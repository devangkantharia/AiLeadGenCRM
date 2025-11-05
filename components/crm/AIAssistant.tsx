// Location: /components/crm/AIAssistant.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import MessageContent from '@/components/MessageContent';
import { useQueryClient } from '@tanstack/react-query';
import Citation from '@/components/Citation';
import { toast } from 'sonner';
import { Button, Flex, TextArea, Box, Heading, useThemeContext } from '@radix-ui/themes';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: any[];
}

const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
);

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentAccentColor = useThemeContext().accentColor;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        // If the response is not JSON (server error), normalize the error
        data = { error: `Server returned ${res.status}` };
      }
      const output = data?.output ?? data?.error ?? "No response";

      // Check if the output is a JSON string indicating a successful save
      let foundSavedCompany = false;
      try {
        const result = JSON.parse(output);
        if (result.message && result.newCompany) {
          toast.success(result.message);
          foundSavedCompany = true;

          // Optimistically update the 'companies' query cache
          queryClient.setQueryData(['companies'], (oldData: any[] | undefined) => {
            const newData = oldData ? [...oldData] : [];
            newData.unshift(result.newCompany); // Add the new company to the beginning of the list
            return newData;
          });
        }
      } catch (e) {
        // If parsing fails, it's just a regular text response from the AI
        // Check if the response mentions saving companies successfully
        const lowerOutput = output.toLowerCase();
        if (lowerOutput.includes('saved') || lowerOutput.includes('successfully')) {
          foundSavedCompany = true;
        }
      }

      // If companies were saved, invalidate the query to refetch fresh data
      if (foundSavedCompany) {
        // Small delay to ensure server-side revalidation completes
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['companies'] });
        }, 500);
      }

      setMessages(prev =>
        prev.map(msg => (msg.id === assistantId ? { ...msg, content: output } : msg))
      );
    } catch (err: any) {
      // Handle aborted fetch separately
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(msg => (msg.id === assistantId ? { ...msg, content: 'Request aborted.' } : msg)));
      } else {
        setMessages(prev => prev.map(msg => (msg.id === assistantId ? { ...msg, content: 'Sorry, error processing request.' } : msg)));
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ role, content, citations }: { role: 'user' | 'assistant', content: string, citations?: any[] }) => {
    const isUser = role === 'user';
    return (
      <Flex justify={isUser ? 'end' : 'start'} className="w-full">
        <Box
          className={`max-w-[800px] rounded-xl px-4 py-3 shadow-sm border ${isUser
            ? 'bg-blue-50 border-blue-200'
            : 'bg-white border-gray-200'
            }`}
        >
          <div className="mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isUser
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
              }`}>
              {isUser ? 'You' : 'Assistant'}
            </span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {content ? <MessageContent content={content} /> : <Spinner />}
          </div>
          {citations && citations.length > 0 && (
            <Box mt="2"><Citation citations={citations} /></Box>
          )}
        </Box>
      </Flex>
    );
  };

  return (
    <Flex direction="column" style={{ height: '400px' }}>
      <Box p="4" mb="2" style={{ borderBottom: `1px solid var(--gray-a5)` }}>
        <Heading color={currentAccentColor} as="h2" size="4">AI Chat Assistant</Heading>
      </Box>

      <Flex direction="column" p="4" gap="4" style={{ flexGrow: 1, overflowY: 'auto' }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} citations={m.citations} />
        ))}
        <div ref={messagesEndRef} />
      </Flex>

      <div className="p-4 ">
        <form onSubmit={handleSubmit}>
          <Flex align="stretch" gap="2">
            <TextArea
              ref={inputRef}
              variant={"soft"}
              color={'gray'}
              placeholder="Ask something to find and save new leads..."
              value={input}
              style={{ flexGrow: 1 }}
              onChange={handleInputChange}
              disabled={isLoading} className="p-5 shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-blue-500"
            />
            <Box className="shadow-md hover:shadow-lg border rounded-lg">
              <Button
                variant="soft"
                style={{ height: '64px', width: '100%' }}
                type="submit"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Spinner /> : 'Send'}
              </Button>
            </Box>
          </Flex>
        </form>
      </div>
    </Flex>
  );
}