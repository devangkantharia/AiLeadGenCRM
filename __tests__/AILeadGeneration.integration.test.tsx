// Location: /__tests__/AILeadGeneration.integration.test.tsx
// Comprehensive integration test for AI Lead Generation workflow

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIAssistant } from '@/components/crm/AIAssistant';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Theme } from '@radix-ui/themes';

// --- MOCK SETUP ---
// Mock the AI process API endpoint with realistic responses
const mockAIResponses = {
  success: {
    output: JSON.stringify({
      message: "Successfully saved TechCorp Solutions to CRM with 2 contacts.",
      newCompany: {
        id: "test-company-id-123",
        name: "TechCorp Solutions",
        industry: "B2B SaaS",
        size: "150 employees",
        geography: "San Francisco, California",
        status: "Lead",
        website: "https://techcorp.io",
        ownerId: "test-owner-id",
        createdAt: "2025-11-05T10:00:00.000Z",
        updatedAt: "2025-11-05T10:00:00.000Z"
      },
      contactsSaved: 2
    })
  },
  noContacts: {
    output: JSON.stringify({
      message: "Successfully saved HealthTech Inc to CRM. No contacts found - you can add them manually later.",
      newCompany: {
        id: "test-company-id-456",
        name: "HealthTech Inc",
        industry: "Healthcare AI",
        size: "45 employees",
        geography: "Boston, MA",
        status: "Lead",
        website: "https://healthtech.com",
        ownerId: "test-owner-id",
        createdAt: "2025-11-05T10:00:00.000Z",
        updatedAt: "2025-11-05T10:00:00.000Z"
      },
      contactsSaved: 0
    })
  },
  multipleLeads: {
    output: "I found 3 companies matching your criteria:\n\n1. **AI Innovations Ltd** (London, UK) - AI/ML Platform - 200 employees\n   - CEO: Sarah Johnson\n   - Website: https://aiinnovations.io\n\n2. **DataScale Systems** (Manchester, UK) - Data Analytics - 85 employees\n   - Founder: Michael Chen\n   - Website: https://datascale.co.uk\n\n3. **CloudSecure** (Edinburgh, UK) - Cybersecurity - 120 employees\n   - CTO: Emma Thompson\n   - Website: https://cloudsecure.com\n\nAll companies have been saved to your CRM. You can view them in the Companies section."
  },
  error: {
    output: "I encountered an error while processing your request. Please try again or contact support if the issue persists."
  },
  searchInProgress: {
    output: "Searching for B2B SaaS companies in San Francisco with 100-500 employees...\n\nFound 5 potential leads. Analyzing contact information...\n\nExtracting leadership contacts from LinkedIn and company websites...\n\nProcessing results..."
  }
};

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

// Mock ResizeObserver (required for Radix UI Select component)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Test wrapper with all providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Theme>
        {children}
        <Toaster />
      </Theme>
    </QueryClientProvider>
  );
};

// --- INTEGRATION TEST SUITE ---
describe('AI Lead Generation - Complete Integration Test', () => {
  const fetchMock = global.fetch as jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock.mockClear();
    jest.clearAllMocks();
    // Suppress console.error during tests (component logs expected errors)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  // --- TEST 1: Complete Lead Generation with Contacts ---
  it('should successfully generate and save a lead with contacts', async () => {
    // Arrange
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.success),
      ok: true,
    });

    // Act
    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Find B2B SaaS companies in San Francisco with 100-200 employees');
    await user.click(sendButton);

    // Assert - Check API call was made
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Find B2B SaaS companies in San Francisco with 100-200 employees'
        }),
      });
    });

    // Assert - Check company information is displayed
    await waitFor(() => {
      const responseText = screen.getAllByText(/Successfully saved TechCorp Solutions to CRM with 2 contacts/i);
      expect(responseText.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Assert - Verify input was cleared
    expect(input).toHaveValue('');
  });

  // --- TEST 2: Lead Generation without Contacts ---
  it('should save a lead even when no contacts are found', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.noContacts),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Find healthcare technology companies in Boston');
    await user.click(sendButton);

    // Verify the no-contacts scenario is handled (message appears in toast and chat)
    await waitFor(() => {
      // The response contains the JSON string which includes the company name
      const healthTechElements = screen.getAllByText(/HealthTech Inc/i);
      expect(healthTechElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  // --- TEST 3: Multiple Leads Generation ---
  it('should handle finding and displaying multiple leads', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.multipleLeads),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Find AI companies in UK with Series A funding');
    await user.click(sendButton);

    // Verify all companies are mentioned in the response (using getAllBy for multiple matches)
    await waitFor(() => {
      const aiInnovations = screen.getAllByText(/AI Innovations Ltd/i);
      const dataScale = screen.getAllByText(/DataScale Systems/i);
      const cloudSecure = screen.getAllByText(/CloudSecure/i);

      expect(aiInnovations.length).toBeGreaterThan(0);
      expect(dataScale.length).toBeGreaterThan(0);
      expect(cloudSecure.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Verify locations are shown
    expect(screen.getAllByText(/London, UK/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Manchester, UK/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Edinburgh, UK/i).length).toBeGreaterThan(0);
  });

  // --- TEST 4: Complex Query with Multiple Criteria ---
  it('should process complex queries with multiple search criteria', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    const complexResponse = {
      output: JSON.stringify({
        message: "Successfully saved FinTech Innovations to CRM with 3 contacts.",
        newCompany: {
          id: "test-company-fintech",
          name: "FinTech Innovations",
          industry: "Financial Technology",
          size: "250 employees",
          geography: "London, UK",
          status: "Lead",
          website: "https://fintechinnovations.com",
          ownerId: "test-owner-id",
          createdAt: "2025-11-05T10:00:00.000Z",
          updatedAt: "2025-11-05T10:00:00.000Z"
        },
        contactsSaved: 3
      })
    };

    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(complexResponse),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    const complexQuery = 'Find FinTech companies in London that raised Series B funding in the last 6 months, have 200-500 employees, and are actively hiring for technical roles';
    await user.type(input, complexQuery);
    await user.click(sendButton);

    // Verify the query was sent correctly
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: complexQuery }),
      });
    });

    // Verify company name appears in response
    await waitFor(() => {
      expect(screen.getAllByText(/FinTech Innovations/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  }, 10000); // Increased timeout for complex queries

  // --- TEST 5: Error Handling ---
  it('should handle API errors gracefully', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.error),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Find companies');
    await user.click(sendButton);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/encountered an error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // --- TEST 6: Network Failure ---
  it('should handle network failures appropriately', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Find tech companies');
    await user.click(sendButton);

    // Component should handle the error without crashing
    await waitFor(() => {
      // The component should still be rendered
      expect(input).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // --- TEST 7: Sequential Queries ---
  it('should handle multiple sequential queries correctly', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    // First query
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.success),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Find SaaS companies in SF');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText(/TechCorp Solutions/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Second query
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.noContacts),
      ok: true,
    });

    await user.type(input, 'Find healthcare companies');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText(/HealthTech Inc/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Verify both messages are in the chat history
    expect(screen.getAllByText(/TechCorp Solutions/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/HealthTech Inc/i).length).toBeGreaterThan(0);
  });

  // --- TEST 8: Empty Input Validation ---
  it('should not send a request when input is empty', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Try to send without typing anything
    await user.click(sendButton);

    // Verify no API call was made
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // --- TEST 9: Whitespace-only Input Validation ---
  it('should not send a request when input contains only whitespace', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, '   ');
    await user.click(sendButton);

    // Verify no API call was made
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // --- TEST 10: Loading State Prevention ---
  it('should prevent multiple submissions while loading', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    // Create a delayed response
    fetchMock.mockImplementationOnce(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          json: () => Promise.resolve(mockAIResponses.success),
          ok: true,
        }), 1000)
      )
    );

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'First query');
    await user.click(sendButton);

    // Try to send another message immediately
    await user.type(input, 'Second query');
    await user.click(sendButton);

    // Should only have called fetch once
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // --- TEST 11: Data Validation - Geography Required ---
  it('should handle leads with complete geography information', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    const responseWithGeography = {
      output: JSON.stringify({
        message: "Successfully saved Global Tech to CRM with 1 contacts.",
        newCompany: {
          id: "test-geo-company",
          name: "Global Tech",
          industry: "Software",
          size: "500 employees",
          geography: "San Francisco, California", // Complete geography
          status: "Lead",
          website: "https://globaltech.com",
          ownerId: "test-owner-id",
          createdAt: "2025-11-05T10:00:00.000Z",
          updatedAt: "2025-11-05T10:00:00.000Z"
        },
        contactsSaved: 1
      })
    };

    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(responseWithGeography),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'Find software companies in San Francisco');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText(/Successfully saved Global Tech/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  // --- TEST 12: Realistic User Journey ---
  it('should complete a full realistic user journey', async () => {
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    // Step 1: User asks for general information
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({
        output: "I can help you find leads! You can ask me to find companies by industry, location, size, funding stage, and more. What are you looking for?"
      }),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    await user.type(input, 'How can you help me find leads?');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/I can help you find leads/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Step 2: User makes a specific query
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.multipleLeads),
      ok: true,
    });

    await user.type(input, 'Find AI companies in UK with Series A funding');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText(/AI Innovations Ltd/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Step 3: User asks for more specific information
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve(mockAIResponses.success),
      ok: true,
    });

    await user.type(input, 'Tell me more about TechCorp Solutions');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText(/TechCorp Solutions/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Verify the entire conversation history is maintained
    expect(screen.getByText(/How can you help me find leads/i)).toBeInTheDocument();
    expect(screen.getByText(/AI companies in UK/i)).toBeInTheDocument();
    expect(screen.getByText(/Tell me more about TechCorp Solutions/i)).toBeInTheDocument();
  }, 15000); // Extended timeout for multi-step journey
});
