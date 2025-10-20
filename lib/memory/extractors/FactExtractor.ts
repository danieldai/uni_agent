/**
 * Fact Extractor
 *
 * Extracts important facts about the user from conversations using LLM.
 */

import OpenAI from 'openai';
import { Message, ExtractedFacts } from '../types';
import { getOpenAIConfig, getOpenAIModel } from '../config';
import { buildExtractionPrompt } from '../prompts';
import { parseMessagesToText, filterRelevantMessages } from '../utils/messageParser';

export class FactExtractor {
  private client: OpenAI;
  private model: string;

  constructor() {
    const config = getOpenAIConfig();
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = getOpenAIModel();
  }

  /**
   * Extract facts from a conversation
   * @param messages Array of conversation messages
   * @param options Extraction options
   * @returns Extracted facts
   */
  async extract(
    messages: Message[],
    options: {
      maxMessages?: number;
      minMessageLength?: number;
      temperature?: number;
    } = {}
  ): Promise<ExtractedFacts> {
    const {
      maxMessages = 20,
      minMessageLength = 10,
      temperature = 0.3,
    } = options;

    // Filter relevant messages for extraction
    const relevantMessages = filterRelevantMessages(messages, {
      excludeSystem: true,
      minLength: minMessageLength,
      maxMessages,
    });

    if (relevantMessages.length === 0) {
      return { facts: [] };
    }

    // Convert messages to text format
    const conversationText = parseMessagesToText(relevantMessages);

    // Build the extraction prompt
    const prompt = buildExtractionPrompt(conversationText);

    try {
      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        response_format: { type: 'json_object' },
      });

      // Parse the response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const parsed = JSON.parse(content);

      // Validate the response structure
      if (!parsed.facts || !Array.isArray(parsed.facts)) {
        throw new Error('Invalid response format: missing facts array');
      }

      return {
        facts: parsed.facts.filter((fact: any) => typeof fact === 'string' && fact.trim().length > 0),
      };
    } catch (error) {
      console.error('Fact extraction error:', error);

      // Return empty facts on error rather than throwing
      // This allows the system to continue operating
      return { facts: [] };
    }
  }

  /**
   * Extract facts from a simple text conversation string
   * Useful for testing or when messages are already formatted
   * @param conversationText Formatted conversation text
   * @param temperature LLM temperature (default: 0.3)
   * @returns Extracted facts
   */
  async extractFromText(
    conversationText: string,
    temperature = 0.3
  ): Promise<ExtractedFacts> {
    if (!conversationText.trim()) {
      return { facts: [] };
    }

    const prompt = buildExtractionPrompt(conversationText);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const parsed = JSON.parse(content);

      if (!parsed.facts || !Array.isArray(parsed.facts)) {
        throw new Error('Invalid response format: missing facts array');
      }

      return {
        facts: parsed.facts.filter((fact: any) => typeof fact === 'string' && fact.trim().length > 0),
      };
    } catch (error) {
      console.error('Fact extraction error:', error);
      return { facts: [] };
    }
  }

  /**
   * Batch extract facts from multiple conversations
   * @param conversationBatch Array of message arrays
   * @param options Extraction options
   * @returns Array of extracted facts for each conversation
   */
  async extractBatch(
    conversationBatch: Message[][],
    options?: {
      maxMessages?: number;
      minMessageLength?: number;
      temperature?: number;
    }
  ): Promise<ExtractedFacts[]> {
    const results = await Promise.all(
      conversationBatch.map(messages => this.extract(messages, options))
    );
    return results;
  }

  /**
   * Get the count of API tokens that would be used for extraction
   * Approximate calculation based on character count
   * @param messages Messages to estimate tokens for
   * @returns Approximate token count
   */
  estimateTokens(messages: Message[]): number {
    const relevantMessages = filterRelevantMessages(messages, {
      excludeSystem: true,
      maxMessages: 20,
    });
    const conversationText = parseMessagesToText(relevantMessages);
    const prompt = buildExtractionPrompt(conversationText);

    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(prompt.length / 4);
  }
}
