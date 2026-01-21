# AI Lead-Generation CRM

An intelligent, proactive CRM platform designed to automate the sales discovery process. This application leverages generative AI and neural web search to find, qualify, and manage leads with minimal manual entry.

## 🚀 Key Features

### 🧠 Proactive AI Assistant

- **Neural Web Search:** Integrates with the **Exa AI API** to perform high-intent searches for companies based on natural language queries.
- **Autonomous Data Entry:** Uses **OpenAI Tool Calling** to parse search results and automatically save lead data (industry, size, geography) directly into the database.
- **Contextual Intelligence:** Extracts potential contact information and company insights from raw web data.

### 📊 Pipeline Management

- **Interactive Dashboard:** Real-time visualization of sales health using **Recharts**, featuring deal distribution by stage and total pipeline value.
- **Lead Tracking:** Manage the journey from "Discovery" to "Won" with a structured database schema.
- **Activity Logs:** Maintain a complete history of interactions including calls, emails, tasks, and notes.

### ✉️ Email Sequence Builder

- **Rich Text Editing:** A professional-grade template builder powered by **Blocknote** and **Mantine**.
- **Sequence Logic:** Organize outreach efforts into timed steps (e.g., Day 1, Day 3, Day 7) to standardize the sales workflow.
- **Structured Templates:** Templates are saved as portable JSON for consistent rendering across the platform.

### 🛠️ Technical Architecture

- **Frontend:** Next.js 14 (App Router) with Radix UI Themes for a sophisticated, high-performance interface.
- **State Management:** TanStack Query v5 for robust data fetching and cache synchronization.
- **Backend:** Supabase (PostgreSQL) for secure data persistence and row-level security.
- **Auth:** Clerk for seamless user authentication and session management.
- **Observability:** **Langfuse** integration for full-stack AI traceability, monitoring token usage, and debugging tool execution.

## 🔧 Environment Setup

To run this project locally, create a `.env.local` file in the root directory and provide the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI & Search APIs
OPENAI_API_KEY=your_openai_api_key
EXA_API_KEY=your_exa_api_key

# Monitoring (Langfuse)
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public
LANGFUSE_HOST=[https://cloud.langfuse.com](https://cloud.langfuse.com)
```

## 📦 Installation

1. Clone the repository to your local machine.
2. Install the necessary packages: ```npm install```
3. Initialize the Supabase tables using the provided SQL schemas in the `/lib/supabase` directory.
4. Start the development server: ```npm run dev```

## 🛡️ Security and Observability

The project uses **Supabase RLS (Row Level Security)** to ensure that users can only access leads and sequences they own. AI performance and costs are tracked via **Langfuse**, providing visibility into model latency and tool-calling accuracy.
