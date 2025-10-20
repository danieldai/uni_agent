/**
 * Action Decider
 *
 * Decides what action to take (ADD/UPDATE/DELETE/NONE) for each extracted fact
 * based on existing similar memories.
 */

import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { MemoryDecision, SearchResult } from '../types';
import { getOpenAIConfig, getOpenAIModel } from '../config';
import { buildUpdatePrompt } from '../prompts';

export class ActionDecider {
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
   * Decide what action to take for each fact
   * @param facts Array of extracted facts
   * @param existingMemories Similar memories from vector search
   * @param options Decision options
   * @returns Memory decision with actions
   */
  async decide(
    facts: string[],
    existingMemories: SearchResult[],
    options: {
      temperature?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<MemoryDecision> {
    const {
      temperature = 0.3,
      similarityThreshold = 0.7,
    } = options;

    if (facts.length === 0) {
      return { memory: [] };
    }

    // Filter memories by similarity threshold
    const relevantMemories = existingMemories.filter(
      mem => mem.score >= similarityThreshold
    );

    // Format existing memories for the prompt
    const formattedMemories = relevantMemories.map(mem => ({
      id: mem.id,
      text: mem.payload.data,
      score: mem.score,
    }));

    // Build the decision prompt
    const prompt = buildUpdatePrompt(facts, formattedMemories);

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
      if (!parsed.memory || !Array.isArray(parsed.memory)) {
        throw new Error('Invalid response format: missing memory array');
      }

      // Process and validate each decision
      const decisions = parsed.memory.map((item: any) => {
        // Generate new ID if not provided or for ADD operations
        const id = item.event === 'ADD' || !item.id ? uuidv4() : item.id;

        return {
          id,
          text: item.text || '',
          event: this.validateEvent(item.event),
          old_memory: item.old_memory,
        };
      }).filter((item: any) => item.text.trim().length > 0);

      return { memory: decisions };
    } catch (error) {
      console.error('Action decision error:', error);

      // Fallback: treat all facts as ADD if decision fails
      return {
        memory: facts.map(fact => ({
          id: uuidv4(),
          text: fact,
          event: 'ADD' as const,
        })),
      };
    }
  }

  /**
   * Decide action for a single fact
   * @param fact Single extracted fact
   * @param existingMemories Similar memories
   * @param options Decision options
   * @returns Memory decision
   */
  async decideSingle(
    fact: string,
    existingMemories: SearchResult[],
    options?: {
      temperature?: number;
      similarityThreshold?: number;
    }
  ): Promise<MemoryDecision> {
    return this.decide([fact], existingMemories, options);
  }

  /**
   * Validate event type and return valid event or default to ADD
   * @param event Event string from LLM
   * @returns Valid event type
   */
  private validateEvent(event: string): 'ADD' | 'UPDATE' | 'DELETE' | 'NONE' {
    const validEvents: Array<'ADD' | 'UPDATE' | 'DELETE' | 'NONE'> = ['ADD', 'UPDATE', 'DELETE', 'NONE'];
    const normalized = event?.toUpperCase();

    if (validEvents.includes(normalized as any)) {
      return normalized as 'ADD' | 'UPDATE' | 'DELETE' | 'NONE';
    }

    console.warn(`Invalid event type: ${event}, defaulting to ADD`);
    return 'ADD';
  }

  /**
   * Analyze decisions and return summary statistics
   * @param decision Memory decision to analyze
   * @returns Summary of decisions by action type
   */
  analyzeDecisions(decision: MemoryDecision): {
    total: number;
    add: number;
    update: number;
    delete: number;
    none: number;
  } {
    const summary = {
      total: decision.memory.length,
      add: 0,
      update: 0,
      delete: 0,
      none: 0,
    };

    decision.memory.forEach(item => {
      switch (item.event) {
        case 'ADD':
          summary.add++;
          break;
        case 'UPDATE':
          summary.update++;
          break;
        case 'DELETE':
          summary.delete++;
          break;
        case 'NONE':
          summary.none++;
          break;
      }
    });

    return summary;
  }

  /**
   * Filter decisions by event type
   * @param decision Memory decision
   * @param eventType Event type to filter by
   * @returns Filtered decisions
   */
  filterByEvent(
    decision: MemoryDecision,
    eventType: 'ADD' | 'UPDATE' | 'DELETE' | 'NONE'
  ): MemoryDecision {
    return {
      memory: decision.memory.filter(item => item.event === eventType),
    };
  }

  /**
   * Get actionable decisions (exclude NONE)
   * @param decision Memory decision
   * @returns Decisions that require action
   */
  getActionable(decision: MemoryDecision): MemoryDecision {
    return {
      memory: decision.memory.filter(item => item.event !== 'NONE'),
    };
  }
}
