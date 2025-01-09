import { useState, useEffect } from "react";
import type { Message } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

export function useChatHistory(chatId?: string) {
  const { toast } = useToast();
  // Use a unique key for each chat session
  const storageKey = chatId ? `chat-history-${chatId}` : 'current-chat-history';

  // Initialize state from localStorage if available
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') return [];

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (error) {
      console.warn('Failed to load chat history:', error);
      return [];
    }
  });

  // Update localStorage when messages change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn('Failed to save chat history:', error);
      toast({
        title: "Warning",
        description: "Failed to save chat history locally",
        variant: "destructive",
      });
    }
  }, [messages, storageKey, toast]);

  const addMessages = (newMessages: Message[]) => {
    setMessages(prev => [...prev, ...newMessages]);
  };

  const clearMessages = () => {
    try {
      setMessages([]);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear chat history:', error);
    }
  };

  return {
    messages,
    addMessages,
    clearMessages
  };
}