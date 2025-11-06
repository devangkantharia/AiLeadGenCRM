// Location: /lib/actions/ai.actions.ts
// --- IMPROVED VERSION WITH ACCURATE CONTACT AND WEBSITE EXTRACTION ---

"use server";

import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Exa from "exa-js";
import { Langfuse } from "langfuse";

// --- INITIALIZE ALL CLIENTS ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_HOST!,
});

// Helper function to get our internal user ID
async function getUserId(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", clerkId)
    .single();

  if (error || !data) throw new Error("User not found in DB.");
  return data.id;
}

// --- IMPROVED EXA WEB_SEARCH HANDLER WITH CONTACT SEARCH ---
async function webSearchHandler(params: { query: string; searchType?: 'company' | 'contacts' }) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("EXA_API_KEY not configured");

  const exa = new Exa(apiKey);
  const searchType = params.searchType || 'company';
  console.log(`[AI] Calling Exa with query: ${params.query} (type: ${searchType})`);

  let allResults: any[] = [];
  try {
    const searchResponse = await exa.searchAndContents(params.query, {
      numResults: searchType === 'contacts' ? 5 : 10,
      useAutoprompt: true,
      text: {
        includeHtmlTags: false,
        maxCharacters: searchType === 'contacts' ? 5000 : 3000
      }
    });
    allResults = searchResponse.results;
  } catch (e) {
    console.error("Exa search error:", e);
    throw new Error("Exa search failed");
  }

  const uniqueResults = Array.from(new Map(allResults.map(r => [r.url || r.link || r.uri, r])).values());

  // Helper: Extract clean domain from URL
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, "").replace(/^app\./, "").replace(/^blog\./, "");
    } catch {
      return "";
    }
  };

  // Helper: Extract company website (prefer official domain, skip aggregators)
  const extractCompanyWebsite = (url: string, text: string): string => {
    const domain = extractDomain(url);

    // Skip aggregator/directory/social sites
    const skipDomains = ['linkedin.com', 'crunchbase.com', 'twitter.com', 'x.com', 'facebook.com',
      'tracxn.com', 'techcrunch.com', 'forbes.com', 'bloomberg.com', 'clutch.co',
      'g2.com', 'capterra.com', 'wikipedia.org', 'reddit.com', 'medium.com',
      'angellist.com', 'producthunt.com'];

    if (skipDomains.some(skip => domain.includes(skip))) {
      // Try to extract actual website from content with multiple patterns
      const patterns = [
        // Direct website mentions
        /(?:website|site|visit us|homepage|web)[\s:]+(?:https?:\/\/)?((?:www\.)?[a-z0-9\-]+\.[a-z0-9\-\.]+)/i,
        // www. patterns
        /\b(?:www\.)([a-z0-9\-]+\.[a-z0-9\-\.]+)/i,
        // Direct URLs in text
        /https?:\/\/((?:www\.)?[a-z0-9\-]+\.(?:com|io|ai|co\.uk|co|uk|eu|org|net))/i,
        // Domain patterns (more specific)
        /\b([a-z0-9\-]+\.(?:com|io|ai|co\.uk|co|uk))(?:\s|\/|$)/i,
        // Company name + .com pattern
        /([a-z0-9\-]+)\.(?:com|io|ai|co\.uk)\b/i
      ];

      for (const pattern of patterns) {
        const matches = text.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
        for (const match of matches) {
          let extractedDomain = match[1]?.toLowerCase() || match[0]?.toLowerCase();
          if (!extractedDomain) continue;

          // Clean up
          extractedDomain = extractedDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');

          // Validate it's not an email or the same aggregator domain
          if (extractedDomain.includes('@')) continue;
          if (skipDomains.some(skip => extractedDomain.includes(skip))) continue;

          // Additional validation - must have valid TLD
          if (!/\.(com|io|ai|co|uk|eu|org|net)$/i.test(extractedDomain)) continue;

          return extractedDomain.startsWith('http') ? extractedDomain : `https://${extractedDomain}`;
        }
      }
      return ""; // No valid website found in aggregator content
    }

    // Return the source URL as the company website
    return url;
  };

  // Helper: Extract emails with strict validation
  const extractEmails = (text: string): string[] => {
    const emails = Array.from(
      text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g) || []
    );
    // Filter out generic/system emails
    return emails.filter(e =>
      !e.match(/@(example|test|noreply|no-reply|admin|support|info|hello|contact|sales|marketing|press|media|team|help)\./) &&
      !e.match(/^(info|hello|contact|support|admin|sales|no-reply|noreply)@/) &&
      e.length < 60
    ).slice(0, 10); // Limit to 10 emails max
  };

  // Helper: Extract phone numbers (international formats)
  const extractPhones = (text: string): string[] => {
    const patterns = [
      /\+?\d{1,4}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g,
      /\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g,
    ];
    const phones: string[] = [];
    for (const pattern of patterns) {
      const matches = Array.from(text.match(pattern) || []);
      phones.push(...matches);
    }
    // Dedupe and limit
    return Array.from(new Set(phones)).slice(0, 3);
  };

  // Helper: Extract leadership contacts with ENHANCED validation for LinkedIn and leadership pages
  const extractContacts = (text: string, emails: string[], searchType: string = 'company') => {
    const contacts: Array<{ name: string; title: string; email: string }> = [];

    // Leadership keywords (expanded list)
    const leadershipKeywords = [
      'ceo', 'chief executive', 'founder', 'co-founder', 'cofounder',
      'cto', 'chief technology', 'chief technical',
      'cfo', 'chief financial',
      'coo', 'chief operating',
      'cmo', 'chief marketing',
      'cpo', 'chief product',
      'ciso', 'chief information security',
      'president', 'managing director',
      'vp', 'vice president', 'v.p.',
      'head of', 'director of', 'general manager',
      'evp', 'executive vice president',
      'svp', 'senior vice president'
    ];

    // For contact searches, be more aggressive with patterns
    if (searchType === 'contacts') {
      // LinkedIn profile patterns: "John Smith" followed by title
      const linkedInPatterns = [
        // Pattern: Name\nTitle at Company
        /\b([A-Z][a-z]{2,15}(?:\s[A-Z][a-z]{2,15}){1,2})\s*\n\s*([A-Z][A-Za-z\s&\/\-]{3,80}?)\s+(?:at|@)\s+/gi,
        // Pattern: Name | Title
        /\b([A-Z][a-z]{2,15}(?:\s[A-Z][a-z]{2,15}){1,2})\s*\|\s*([A-Z][A-Za-z\s&\/\-]{3,60})\b/g,
        // Pattern: Name - Title
        /\b([A-Z][a-z]{2,15}(?:\s[A-Z][a-z]{2,15}){1,2})\s*[-–]\s*([A-Z][A-Za-z\s&\/\-]{3,60})\b/g,
      ];

      for (const pattern of linkedInPatterns) {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null && contacts.length < 10) {
          const name = match[1].trim();
          const title = match[2].trim();

          const titleLower = title.toLowerCase();
          const hasLeadershipKeyword = leadershipKeywords.some(kw => titleLower.includes(kw));

          if (hasLeadershipKeyword) {
            const nameParts = name.split(/\s+/);
            if (nameParts.length >= 2 && nameParts.length <= 3) {
              // Try to match email
              const nameTokens = name.toLowerCase().split(/\s+/);
              const matchedEmail = emails.find(email => {
                const localPart = email.split('@')[0].toLowerCase().replace(/[._]/g, '');
                return nameTokens.some(token =>
                  localPart.includes(token) ||
                  (nameTokens.length === 2 && localPart.includes(nameTokens[0][0] + nameTokens[1]))
                );
              });

              contacts.push({
                name,
                title: title.replace(/[,;.]$/, '').substring(0, 60),
                email: matchedEmail || ""
              });
            }
          }
        }
      }
    }

    // Original patterns (for both search types)
    const patterns = [
      // Pattern 1: John Smith, CEO | John Smith - CEO
      /\b([A-Z][a-z]{2,15}(?:\s[A-Z][a-z]{2,15}){1,2})\s*[,\-–]\s*([A-Z][A-Za-z\s&\/\-]{3,60})\b/g,
      // Pattern 2: CEO: John Smith | CEO - John Smith  
      /\b([A-Z][A-Za-z\s&\/\-]{3,40})\s*[:–-]\s*([A-Z][a-z]{2,15}(?:\s[A-Z][a-z]{2,15}){1,2})\b/g,
    ];

    for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
      const pattern = patterns[patternIndex];
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null && contacts.length < 10) {
        let name = "";
        let title = "";

        if (patternIndex === 0) {
          name = match[1].trim();
          title = match[2].trim();
        } else {
          title = match[1].trim();
          name = match[2].trim();
        }

        // Strict validation: title must contain a leadership keyword
        const titleLower = title.toLowerCase();
        const hasLeadershipKeyword = leadershipKeywords.some(kw => titleLower.includes(kw));
        if (!hasLeadershipKeyword) continue;

        // Strict validation: name must be 2-3 proper words
        const nameParts = name.split(/\s+/);
        if (nameParts.length < 2 || nameParts.length > 3) continue;

        // Each part must start with capital letter
        const isProperName = nameParts.every(part =>
          part.length >= 2 && /^[A-Z][a-z]/.test(part) && !/\d/.test(part)
        );
        if (!isProperName) continue;

        // Reject common false positives
        const rejectPatterns = ['Ltd', 'Limited', 'Inc', 'Corp', 'Company', 'Group', 'Partners'];
        if (rejectPatterns.some(reject => name.includes(reject))) continue;

        // Try to find a matching email
        const nameTokens = name.toLowerCase().split(/\s+/);
        const matchedEmail = emails.find(email => {
          const localPart = email.split('@')[0].toLowerCase().replace(/[._]/g, '');
          return nameTokens.some(token =>
            localPart.includes(token) ||
            token.includes(localPart) ||
            // Check initials: John Smith -> jsmith, j.smith
            (nameTokens.length === 2 && localPart.includes(nameTokens[0][0] + nameTokens[1]))
          );
        });

        // Clean up title (remove trailing punctuation, limit length)
        title = title.replace(/[,;.]$/, '').trim();
        if (title.length > 50) title = title.substring(0, 50);

        contacts.push({
          name,
          title,
          email: matchedEmail || ""
        });
      }
    }

    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>();
    return contacts.filter(c => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10); // Max 10 contacts for contact searches, 5 for company searches
  };

  // Process results
  const enriched = uniqueResults.slice(0, 8).map((r: any) => {
    const fullText = `${r.title || ""} ${r.text || ""}`;
    const url = r.url || r.link || r.uri || "";

    // Extract company name from title (improved for list pages)
    let companyName = "";
    if (r.title) {
      // Remove list prefixes like "10 Best", "Top 20", etc.
      let cleanTitle = r.title.replace(/^(?:Top|Best|Leading|\d+)\s+(?:B2B|SaaS|Tech|UK|London)?\s*/i, '').trim();
      // Split on common delimiters and take first part
      companyName = cleanTitle.split(/[-|:•]/)[0].trim();
      // Remove common suffixes and list indicators
      companyName = companyName.replace(/\s+(Ltd|Limited|Inc|Corp|Corporation|Group|Company|GmbH|AG|SA|BV|PLC)\.?$/i, '').trim();
      companyName = companyName.replace(/\s+(?:List|Directory|Guide|Review|Companies|Startups)$/i, '').trim();
    }

    // If title is a list/directory, try to extract first company from content
    const isListPage = r.title && /(?:top|best|list|directory|\d+)/i.test(r.title);
    if (isListPage || !companyName) {
      // Try to find company names in content (numbered lists, bullets)
      const listPatterns = [
        /(?:^|\n)\d+\.\s+([A-Z][A-Za-z0-9\s&''-]{2,40})(?:\s+[-–|:])/m,
        /(?:^|\n)•\s+([A-Z][A-Za-z0-9\s&''-]{2,40})(?:\s+[-–|:])/m,
        /\n([A-Z][A-Za-z0-9\s&''-]{2,40})(?:\s+is a|\s+provides|\s+-\s+)/m
      ];

      for (const pattern of listPatterns) {
        const match = fullText.match(pattern);
        if (match) {
          companyName = match[1].trim();
          break;
        }
      }
    }

    // If still no name, try domain as last resort
    if (!companyName && url) {
      const domain = extractDomain(url);
      if (domain && !domain.includes('linkedin') && !domain.includes('crunchbase') && !domain.includes('list')) {
        companyName = domain.split('.')[0];
        companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      }
    }

    // Extract company size
    const sizeMatch = fullText.match(/\b(\d+[\s,]?\+?\s*(?:-|to)?\s*\d*)\s*(?:employees?|people|staff|team members?|headcount)\b/i);
    const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, ' ').trim() + ' employees' : "";

    // Extract industry (look for common patterns)
    let industry = "";
    const industryPatterns = [
      /(?:provides?|offers?|delivers?|specializes? in|focused on)\s+([A-Za-z\s,&-]{10,80}?)(?:\s+(?:solutions?|services?|software|platform|products?|for|to|and))/i,
      /(?:industry|sector)[\s:]+([A-Za-z\s,&-]{5,50}?)(?:\.|,|;)/i,
      /\b(SaaS|fintech|healthcare|e-commerce|AI|software|insurance|banking|logistics|marketing|HR tech|CRM|analytics|cybersecurity)\b/i
    ];

    for (const pattern of industryPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        industry = match[1].trim();
        if (industry.length > 60) industry = industry.substring(0, 60);
        break;
      }
    }

    // Extract location
    const locationPatterns = [
      /(?:based in|headquartered in|located in|headquarters in|offices? in|from)\s+([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+){0,3})/,
      /([A-Z][a-z]+,\s+(?:UK|US|USA|EU|England|Scotland|Wales|California|New York|Texas|London|Manchester|Birmingham))/,
    ];

    let location = "";
    for (const pattern of locationPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        location = match[1].trim();
        break;
      }
    }

    // Extract all emails first
    const emails = extractEmails(fullText);

    // Extract contacts (with emails matched) - pass searchType
    const contacts = extractContacts(fullText, emails, searchType);

    // Extract phones
    const phones = extractPhones(fullText);

    // Extract website
    const website = extractCompanyWebsite(url, fullText);

    return {
      companyName,
      website,
      industry,
      size,
      location,
      contacts,
      phones,
      sourceUrl: url
    };
  })
    .filter(r => r.companyName && r.companyName.length > 2); // Only results with valid company name

  // For contact searches, prioritize results with contacts
  if (searchType === 'contacts') {
    const withContacts = enriched.filter(r => r.contacts.length > 0);
    return JSON.stringify({
      query: params.query,
      searchType,
      results: withContacts.length > 0 ? withContacts : enriched, // Return all if no contacts found
      total: withContacts.length > 0 ? withContacts.length : enriched.length,
      timestamp: new Date().toISOString()
    });
  }

  // For company searches, allow any meaningful info
  const filtered = enriched.filter(r => {
    return r.website || r.contacts.length > 0 || r.industry || r.size || r.location;
  });

  return JSON.stringify({
    query: params.query,
    searchType,
    results: filtered,
    total: filtered.length,
    timestamp: new Date().toISOString()
  });
}

// --- saveLeadToCrmHandler ---
const saveLeadToCrmHandler = async (
  params: {
    companyName: string;
    industry?: string;
    geography?: string;
    size?: string;
    website?: string;
    contacts?: { name: string; title?: string; email?: string }[];
  },
  clerkId?: string
) => {
  if (!clerkId) return "Error: User not logged in.";

  let ownerId: string;
  try {
    ownerId = await getUserId(clerkId);
  } catch (error) {
    console.error("Failed to get user ID:", error);
    return `Error: ${(error as Error).message}`;
  }

  // 1. Create Company
  const { data: companyData, error: companyError } = await supabaseAdmin
    .from("Company")
    .insert([
      {
        name: params.companyName,
        industry: params.industry || null,
        geography: params.geography || null,
        size: params.size || null,
        website: params.website || null,
        status: "Lead",
        ownerId
      },
    ])
    .select()
    .single();

  if (companyError || !companyData) {
    console.error("Supabase Company insert error:", companyError);
    return `Error saving company: ${companyError?.message || "Unknown error"}. Details: ${JSON.stringify(companyError)}`;
  }

  const companyId = companyData.id;
  let contactsSaved = 0;

  // 2. Create People (Contacts) if they exist
  if (params.contacts && params.contacts.length > 0) {
    console.log(`[SAVE] Attempting to save ${params.contacts.length} contacts:`, JSON.stringify(params.contacts, null, 2));

    const peopleToInsert = params.contacts
      .filter((contact) => contact.name && contact.name.trim().length > 0)
      .map((contact) => {
        const nameParts = contact.name.trim().split(/\s+/);
        const firstName = nameParts.shift() || "";
        const lastName = nameParts.join(" ");
        return {
          firstName,
          lastName: lastName || null,
          email: contact.email || null,
          title: contact.title || null,
          companyId,
          ownerId,
        };
      });

    console.log(`[SAVE] People to insert (${peopleToInsert.length}):`, JSON.stringify(peopleToInsert, null, 2));

    if (peopleToInsert.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseAdmin
        .from("Person")
        .insert(peopleToInsert)
        .select();

      if (peopleError) {
        console.error(`[SAVE ERROR] Error saving contacts:`, peopleError);
      } else {
        contactsSaved = peopleToInsert.length;
        console.log(`[SAVE SUCCESS] Saved ${contactsSaved} contacts:`, JSON.stringify(peopleData, null, 2));
      }
    } else {
      console.log(`[SAVE] No valid contacts to insert after filtering`);
    }
  } else {
    console.log(`[SAVE] No contacts provided - saving company as lead without contacts (user can add manually later)`);
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");

  const message = contactsSaved > 0
    ? `Successfully saved ${params.companyName} to CRM with ${contactsSaved} contacts.`
    : `Successfully saved ${params.companyName} to CRM. No contacts found - you can add them manually later.`;

  return JSON.stringify({
    message,
    newCompany: companyData,
    contactsSaved,
  });
};

// --- Main entry: processAIRequest ---
export async function processAIRequest(prompt: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("Not authenticated");

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  if (!process.env.EXA_API_KEY) {
    throw new Error("EXA_API_KEY not configured");
  }
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_HOST) {
    throw new Error("Langfuse environment not configured");
  }

  const trace = langfuse.trace({
    name: "ai-lead-generation",
    userId: clerkId,
    input: prompt,
    tags: ["openai-tools", "improved-extraction"]
  });

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI lead generation assistant for a CRM system.

🚨 CRITICAL RULE: You MUST call save_lead_to_crm for EVERY company you find. This is NOT optional.

YOUR JOB (3 STEPS):
1. Search for companies using web_search
2. Search for their contacts using web_search (optional - skip if not needed)
3. ALWAYS call save_lead_to_crm with the data (MANDATORY)

DO NOT just return information to the user. ALWAYS SAVE TO CRM.

WORKFLOW:
Step 1: web_search with searchType="company" to find companies
Step 2 (optional): web_search with searchType="contacts" to find leadership
Step 3 (MANDATORY): save_lead_to_crm for EACH company found

WHEN TO CALL save_lead_to_crm:
✅ ALWAYS - Even if you only have company name and website
✅ ALWAYS - Even if contacts are not found (use empty array [])
✅ ALWAYS - Even if some fields are missing
✅ ALWAYS - This is your PRIMARY JOB

DATA REQUIREMENTS:
- companyName: REQUIRED (from search results)
- website: REQUIRED (from search results)
- geography: Include if available (e.g., "London, UK", "San Francisco, CA")
- industry: Include if available (e.g., "SaaS", "FinTech")
- size: Include if available (e.g., "100+ employees")
- contacts: Include if found, empty [] if not found

EXAMPLES OF CORRECT BEHAVIOR:

User: "Find the CEO of Stripe"
→ Step 1: web_search for Stripe
→ Step 2: web_search for Stripe CEO
→ Step 3: save_lead_to_crm with:
{
  "companyName": "Stripe",
  "website": "https://stripe.com",
  "geography": "San Francisco, CA",
  "industry": "FinTech",
  "contacts": [{"name": "Patrick Collison", "title": "CEO"}]
}

User: "Find 2 fintech companies in London"
→ Step 1: web_search for fintech London
→ Step 2: (optional) web_search for contacts
→ Step 3: save_lead_to_crm for company #1
→ Step 4: save_lead_to_crm for company #2

WRONG BEHAVIOR (DO NOT DO THIS):
❌ Returning "I found Patrick Collison, CEO of Stripe" without calling save_lead_to_crm
❌ Saying "I couldn't find the CTO" and stopping
❌ Only calling web_search and not save_lead_to_crm

REMEMBER: Your success is measured by how many leads you SAVE, not how much information you display.

A lead without geography/location is INCOMPLETE - always include it!
A lead without contacts is ACCEPTABLE - save it anyway for manual follow-up!`
      },
      {
        role: "user", content: `${prompt}

IMPORTANT: After finding the information, you MUST call save_lead_to_crm to save each company to the CRM database. Do not just display the information - save it!` },
    ];

    while (true) {
      const messagesForModel = messages;

      const gen = trace.generation({
        name: "openai.chat.completions",
        model: "gpt-4o",
        input: messagesForModel,
        metadata: { phase: "tool-planning" }
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messagesForModel,
        max_tokens: 1500,
        temperature: 0.2,
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search for companies OR contacts. Use searchType='company' to find companies, searchType='contacts' to find leadership/decision-makers for a specific company.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query. For companies: 'B2B SaaS London'. For contacts: '[CompanyName] CEO founder leadership team'"
                  },
                  searchType: {
                    type: "string",
                    enum: ["company", "contacts"],
                    description: "Type of search: 'company' finds companies, 'contacts' finds leadership/contacts for a specific company"
                  }
                },
                required: ["query"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "save_lead_to_crm",
              description: "🚨 MANDATORY: Save company lead to CRM database. You MUST call this function for EVERY company you find. This is your PRIMARY JOB. Do not just display information - SAVE IT. Contacts are optional (use empty array [] if not found), but you MUST save every company.",
              parameters: {
                type: "object",
                properties: {
                  companyName: { type: "string", description: "Company name (REQUIRED)" },
                  website: { type: "string", description: "Official website URL (REQUIRED)" },
                  geography: { type: "string", description: "Location (e.g., 'London, UK', 'San Francisco, CA') - include if available" },
                  industry: { type: "string", description: "Industry (e.g., 'SaaS', 'FinTech', 'AI') - include if available" },
                  size: { type: "string", description: "Company size (e.g., '50-100 employees', '500+ employees') - include if available" },
                  contacts: {
                    type: "array",
                    description: "Array of contacts (OPTIONAL - can be empty []). Include any leadership/decision-makers you found.",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Full name (e.g., 'Patrick Collison')" },
                        title: { type: "string", description: "Job title (e.g., 'CEO', 'Founder', 'CTO')" },
                        email: { type: "string", description: "Email address if available (optional)" },
                      },
                      required: ["name", "title"],
                    },
                  },
                },
                required: ["companyName", "website"],
              },
            },
          }
        ],
        tool_choice: "auto",
        user: clerkId
      });

      try {
        gen.update({ output: completion });
      } catch { }
      gen.end();

      const message = completion.choices?.[0]?.message;

      if (message?.content) {
        await trace.update({ output: message.content });
        return message.content;
      }

      if (message?.tool_calls) {
        messages.push(message);

        const toolSpan = trace.span({ name: "tool-execution-loop" });

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || "{}");

          const toolCallSpan = toolSpan.span({
            name: toolName,
            input: args,
          });

          let result;
          try {
            if (toolName === "save_lead_to_crm") {
              console.log(`[TOOL CALL] save_lead_to_crm called with args:`, JSON.stringify(args, null, 2));
              result = await saveLeadToCrmHandler(args, clerkId);
              console.log(`[TOOL CALL] save_lead_to_crm result:`, result);
            } else if (toolName === "web_search") {
              result = await webSearchHandler(args);
            } else {
              result = `Tool ${toolName} not found`;
            }
            if (typeof result === 'string' && result.length > 8000) {
              result = result.slice(0, 8000) + '\n...[truncated]';
            }
            toolCallSpan.update({ output: result });
          } catch (e: any) {
            result = `Error: ${e.message}`;
            toolCallSpan.update({ output: result, level: "ERROR" });
            console.error(result);
          }

          toolCallSpan.end();
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
        toolSpan.end();
        continue;
      }
      break;
    }

    await trace.update({ output: "No content returned" });
    return "No response from AI.";

  } catch (error) {
    await trace.update({ output: (error as Error).message });
    console.error("AI processing error:", error);
    throw error;
  } finally {
    await langfuse.shutdownAsync();
  }
}
