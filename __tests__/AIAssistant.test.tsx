// Location: /__tests__/AIAssistant.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIAssistant } from '@/components/crm/AIAssistant';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Theme } from '@radix-ui/themes';

// --- 1. Mock 'fetch' ---
// We tell Jest that any time 'fetch' is called, it should
// return our mock response.
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ output: "This is a mock AI response." }),
    ok: true,
  })
) as jest.Mock;

// We also mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Create a re-usable QueryClient for our tests
const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <Theme>
      {children}
      <Toaster />
    </Theme>
  </QueryClientProvider>
);

// --- 2. The Test Suite ---
describe('AIAssistant Component', () => {

  // Type our global fetch mock
  const fetchMock = global.fetch as jest.Mock;

  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('should render the component and let a user send a message', async () => {
    // --- 3. Arrange ---
    render(<AIAssistant />, { wrapper });
    const user = userEvent.setup();

    // Define what the AI will "respond" with
    const aiResponse = "This is a mock AI response.";
    fetchMock.mockResolvedValue({
      json: () => Promise.resolve({ output: aiResponse }),
      ok: true,
    });

    const input = screen.getByPlaceholderText(/Ask something to find/i);
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // --- 4. Act ---
    await user.type(input, 'Hello AI');
    await user.click(sendButton);

    // --- 5. Assert ---
    // Check 1: User's message appears
    expect(screen.getByText('Hello AI')).toBeInTheDocument();

    // Check 2: 'fetch' was called correctly
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Hello AI' }),
    });

    // Check 3: Wait for the mock response to appear
    await waitFor(() => {
      expect(screen.getByText(aiResponse)).toBeInTheDocument();
    });

    // Check 4: Input is cleared
    expect(input).toHaveValue('');
  });
});

