'use client';

import { useState, useEffect } from 'react';

interface Memory {
  id: string;
  memory: string;
  created_at: string;
  updated_at?: string;
  score?: number;
}

interface MemoryViewerProps {
  userId: string;
}

export function MemoryViewer({ userId }: MemoryViewerProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/memory?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setMemories(data.results || []);
      } else {
        setError(data.error || 'Failed to load memories');
      }
    } catch (error) {
      console.error('Failed to load memories:', error);
      setError('Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    try {
      const response = await fetch('/api/memory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memoryId }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setMemories(prev => prev.filter(m => m.id !== memoryId));
      } else {
        alert(data.error || 'Failed to delete memory');
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
      alert('Failed to delete memory');
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadMemories();
    }
  }, [isOpen, userId]);

  if (!userId) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        title={isOpen ? 'Close Memories' : 'View Memories'}
      >
        <span className="text-lg">🧠</span>
        <span>{isOpen ? 'Close' : 'View'} Memories</span>
        {!isOpen && memories.length > 0 && (
          <span className="bg-purple-800 px-2 py-0.5 rounded-full text-xs">
            {memories.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-bold flex items-center space-x-2">
              <span className="text-xl">🧠</span>
              <span>Your Memories</span>
            </h3>
            <button
              onClick={loadMemories}
              disabled={isLoading}
              className="text-white hover:bg-purple-700 p-1 rounded transition-colors disabled:opacity-50"
              title="Refresh memories"
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-4">
            {isLoading && memories.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-purple-600 rounded-full mb-2"></div>
                <p className="text-sm">Loading memories...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                <p className="text-sm">{error}</p>
                <button
                  onClick={loadMemories}
                  className="mt-2 text-purple-600 hover:text-purple-700 text-sm underline"
                >
                  Try again
                </button>
              </div>
            ) : memories.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <div className="text-4xl mb-2">🤔</div>
                <p className="text-sm">No memories yet</p>
                <p className="text-xs mt-1">
                  Start chatting to build your memory!
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {memories.map((m) => (
                  <li
                    key={m.id}
                    className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-750 p-2 rounded transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {m.memory}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(m.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          {m.updated_at && (
                            <span className="text-xs text-blue-500" title="Updated">
                              📝
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMemory(m.id)}
                        className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete memory"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {memories.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'} stored
            </div>
          )}
        </div>
      )}
    </div>
  );
}
