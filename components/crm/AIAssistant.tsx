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

    // Truncate messages to the last 4 to avoid exceeding token limits
    const truncatedHistory = messages.slice(-4);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: truncatedHistory }),
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
      try {
        const result = JSON.parse(output);
        if (result.message && result.newCompany) {
          toast.success(result.message);

          // Optimistically update the 'companies' query cache
          queryClient.setQueryData(['companies'], (oldData: any[] | undefined) => {
            const newData = oldData ? [...oldData] : [];
            newData.unshift(result.newCompany); // Add the new company to the beginning of the list
            return newData;
          });
        }
      } catch (e) {
        // If parsing fails, it's just a regular text response from the AI
        // No optimistic update needed.
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

  return (
    <Flex direction="column" style={{ height: '400px' }}>
      <Box p="4" mb="2" style={{ borderBottom: `1px solid var(--gray-a5)` }}>
        <Heading color={currentAccentColor} as="h2" size="4">AI Chat Assistant</Heading>
      </Box>

      <Flex direction="column" p="4" gap="4" style={{ flexGrow: 1, overflowY: 'auto' }}>
        {messages.map((message) => (
          <Flex key={message.id} justify={message.role === 'user' ? 'end' : 'start'}>
            <Box style={{ whiteSpace: 'pre-wrap' }}>
              {message.content ? (
                <MessageContent content={message.content} />
              ) : (
                <Spinner />
              )}
              {message.citations && message.citations.length > 0 && (
                <Box mt="2"><Citation citations={message.citations} /></Box>
              )}
            </Box>
          </Flex>
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