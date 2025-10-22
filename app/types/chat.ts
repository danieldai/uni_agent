export interface MessageImage {
  type: 'base64' | 'url';
  data: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  images?: MessageImage[];
}

export interface ChatResponse {
  message: string;
  error?: string;
}

// OpenAI API compatible message format for multimodal content
export type OpenAIMessageContent =
  | string
  | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
      };
    }>;

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: OpenAIMessageContent;
}
