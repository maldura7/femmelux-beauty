'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSearchHistory as getApiSearchHistory, SearchHistoryItem } from '@/lib/api/search.api';

const STORAGE_KEY = 'femmelux_search_history';
const MAX_HISTORY_ITEMS = 20;

export function useSearchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Fetch from API if logged in
          const apiHistory = await getApiSearchHistory(MAX_HISTORY_ITEMS);
          setHistory(apiHistory.map((item: SearchHistoryItem) => item.query));
        } else {
          // Load from localStorage if not logged in
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
              }
            } catch {
              setHistory([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading search history:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
            }
          } catch {
            setHistory([]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  // Add a search to history
  const addToHistory = useCallback((query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return;

    setHistory((prev) => {
      // Remove if exists (to move to top)
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmedQuery);
      // Add to beginning
      const newHistory = [query.trim(), ...filtered].slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage (as backup and for non-logged in users)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }

      return newHistory;
    });
  }, []);

  // Remove a specific search from history
  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((q) => q.toLowerCase() !== query.toLowerCase());

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }

      return newHistory;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, []);

  return {
    history,
    isLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
