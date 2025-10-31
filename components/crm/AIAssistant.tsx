// Location: /components/crm/AIAssistant.tsx

'use client';

import { useState, useTransition } from 'react';
import { Button } from '../ui/button';
import { processAIRequest } from '@/lib/actions/ai.actions';

export function AIAssistant() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();

    // Add user message to chat immediately
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);

    // Clear input right away
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await processAIRequest(currentInput);

      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'No response from AI' }]);
    } catch (error) {
      console.error('Error processing AI request:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-xl font-semibold mb-4">AI Sales Assistant</h2>

      {/* Messages */}
      <div className="h-[400px] overflow-y-auto mb-4 space-y-4 border rounded-lg p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${message.role === 'user'
              ? 'bg-blue-100 ml-12'
              : 'bg-gray-100 mr-12'
              }`}
          >
            <p className="text-sm text-gray-900">{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-100 mr-12 p-3 rounded-lg animate-pulse">
            <p className="text-sm text-gray-500">AI is thinking...</p>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to find companies..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}