/**
 * API Client Utility
 *
 * Centralized API client for making requests to backend
 * Handles both web (relative URLs) and mobile (absolute URLs) deployments
 */

import { Message } from '@/app/types/chat';

// Get API base URL from environment or use relative path for web
const getApiBaseUrl = (): string => {
  // For mobile builds, use NEXT_PUBLIC_API_URL
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // For web builds, use relative path (works with Next.js API routes)
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Make an API request
 */
export async function apiRequest(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  // Ensure endpoint ends with trailing slash for Next.js config compatibility
  const normalizedEndpoint = endpoint;//.endsWith('/') ? endpoint : `${endpoint}/`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  console.log(`[API] ${options?.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    return response;
  } catch (error) {
    console.error(`[API] Error calling ${url}:`, error);
    throw error;
  }
}

/**
 * Chat API
 */
export const chatApi = {
  send: async (messages: Message[], userId: string) => {
    return apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, userId }),
    });
  },
};

/**
 * Memory API
 */
export const memoryApi = {
  getAll: async (userId: string) => {
    return apiRequest(`/memory?userId=${userId}`, {
      method: 'GET',
    });
  },

  add: async (messages: Array<{ role: string; content: string }>, userId: string) => {
    return apiRequest('/memory/add', {
      method: 'POST',
      body: JSON.stringify({ messages, userId }),
    });
  },

  search: async (query: string, userId: string, limit: number = 5) => {
    return apiRequest('/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query, userId, limit }),
    });
  },

  delete: async (memoryId: string) => {
    return apiRequest('/memory', {
      method: 'DELETE',
      body: JSON.stringify({ memoryId }),
    });
  },

  getHistory: async (memoryId: string) => {
    return apiRequest(`/memory/${memoryId}/history`, {
      method: 'GET',
    });
  },
};
