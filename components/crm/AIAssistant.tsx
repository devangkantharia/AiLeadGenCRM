// Location: /components/crm/AIAssistant.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import MessageContent from '@/components/MessageContent';
import Citation from '@/components/Citation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: any[];
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // focus the input after client mounts to avoid SSR/CSR attribute mismatch
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // insert a placeholder assistant message (will be replaced)
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      const output = data?.output ?? data?.error ?? "No response";

      setMessages(prev =>
        prev.map(msg => (msg.id === assistantId ? { ...msg, content: output } : msg))
      );
    } catch (err) {
      setMessages(prev =>
        prev.map(msg => (msg.id === assistantId ? { ...msg, content: 'Sorry, error processing request.' } : msg))
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-xl font-semibold mb-4">AI Sales Assistant</h2>

      {/* Chat Messages */}
      <div className="md:max-w-4xl mx-auto px-4 md:px-6 py-6 pt-20 pb-24 space-y-6">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg py-3 px-4 max-w-[85%] ${message.role === 'user' ? 'bg-[var(--secondary-darker)] rounded text-black text-base' : 'text-gray-900 text-base'}`}>
                  <div className="whitespace-pre-wrap text-[15px]">
                    <MessageContent content={message.content} />
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <Citation citations={message.citations} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[var(--secondary-accent2x)] animate-[bounce_1s_infinite]"></div>
              <div className="w-2 h-2 rounded-full bg-[var(--secondary-accent2x)] animate-[bounce_1s_infinite_200ms]"></div>
              <div className="w-2 h-2 rounded-full bg-[var(--secondary-accent2x)] animate-[bounce_1s_infinite_400ms]"></div>
              <span className="text-sm font-medium text-[var(--secondary-accent2x)]">Thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className={` z-40 transition-all duration-300`}>
        <div className={`${hasMessages ? 'w-full md:max-w-4xl mx-auto px-4 md:px-6 py-4 relative' : 'w-full md:max-w-2xl mx-auto px-4 md:px-6'}`}>
          <form onSubmit={handleSubmit} className="relative flex w-full">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask something..."
              className="w-full p-4 pr-[130px] bg-white border border-gray-200 rounded-full shadow-sm 
              focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)] focus:ring-opacity-20 
              focus:border-[var(--brand-default)] text-base transition-all duration-200 
              placeholder:text-gray-400 hover:border-gray-300"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5  
              text-white rounded-full shadow-sm hover:bg-blue-800 disabled:opacity-50 
              disabled:cursor-not-allowed font-medium min-w-[110px] transition-all duration-200 
              hover:shadow-md active:transform active:scale-95"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}