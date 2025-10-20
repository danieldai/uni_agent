/**
 * Memory Service
 *
 * Core service that orchestrates memory operations by integrating:
 * - Fact extraction
 * - Action decision
 * - Embedding generation
 * - Vector storage
 * - History tracking
 */

import { Message, MemoryResult } from './types';
import { OpenSearchStore } from './stores/OpenSearchStore';
import { HistoryStore } from './stores/HistoryStore';
import { OpenAIEmbedding } from './embeddings/OpenAIEmbedding';
import { FactExtractor } from './extractors/FactExtractor';
import { ActionDecider } from './extractors/ActionDecider';
import { generateHash } from './utils/hash';
import { memoryConfig } from './config';

export class MemoryService {
  private vectorStore: OpenSearchStore;
  private historyStore: HistoryStore;
  private embedding: OpenAIEmbedding;
  private factExtractor: FactExtractor;
  private actionDecider: ActionDecider;

  constructor() {
    this.vectorStore = new OpenSearchStore();
    this.historyStore = new HistoryStore();
    this.embedding = new OpenAIEmbedding();
    this.factExtractor = new FactExtractor();
    this.actionDecider = new ActionDecider();
  }

  /**
   * Add memories from conversation messages
   *
   * Process flow:
   * 1. Extract facts from conversation
   * 2. Generate embeddings for facts
   * 3. Search for similar existing memories
   * 4. Decide actions (ADD/UPDATE/DELETE/NONE)
   * 5. Execute actions on vector store
   * 6. Record in history
   *
   * @param messages Conversation messages
   * @param userId User ID
   * @returns Memory result with actions taken
   */
  async add(messages: Message[], userId: string): Promise<MemoryResult> {
    try {
      // Step 1: Extract facts from conversation
      console.log('Step 1: Extracting facts...');
      const extractedFacts = await this.factExtractor.extract(messages);

      if (extractedFacts.facts.length === 0) {
        console.log('No facts extracted');
        return { results: [] };
      }

      console.log(`Extracted ${extractedFacts.facts.length} facts`);

      // Step 2: Generate embeddings for all facts
      console.log('Step 2: Generating embeddings...');
      const factEmbeddings = await this.embedding.embedBatch(extractedFacts.facts);

      // Step 3: Search for similar existing memories for each fact
      console.log('Step 3: Searching for similar memories...');
      const similarMemoriesForFacts = await Promise.all(
        factEmbeddings.map(embedding =>
          this.vectorStore.search(
            embedding,
            { user_id: userId },
            memoryConfig.behavior.retrievalLimit
          )
        )
      );

      // Step 4: Decide actions for all facts
      console.log('Step 4: Deciding actions...');
      const decision = await this.actionDecider.decide(
        extractedFacts.facts,
        similarMemoriesForFacts.flat(), // Flatten all similar memories
        { similarityThreshold: memoryConfig.behavior.similarityThreshold }
      );

      console.log(`Decisions made: ${decision.memory.length} actions`);

      // Step 5: Execute actions
      console.log('Step 5: Executing actions...');
      const results = [];

      for (let i = 0; i < decision.memory.length; i++) {
        const action = decision.memory[i];
        const factIndex = i < factEmbeddings.length ? i : 0;
        const embedding = factEmbeddings[factIndex];

        switch (action.event) {
          case 'ADD':
            await this.executeAdd(action.id, action.text, embedding, userId);
            results.push({
              id: action.id,
              memory: action.text,
              event: 'ADD' as const,
            });
            break;

          case 'UPDATE':
            await this.executeUpdate(action.id, action.text, embedding, userId, action.old_memory);
            results.push({
              id: action.id,
              memory: action.text,
              event: 'UPDATE' as const,
              old_memory: action.old_memory,
            });
            break;

          case 'DELETE':
            await this.executeDelete(action.id, action.text, userId);
            results.push({
              id: action.id,
              memory: action.text,
              event: 'DELETE' as const,
            });
            break;

          case 'NONE':
            // No action needed, but still record in results
            results.push({
              id: action.id,
              memory: action.text,
              event: 'NONE' as const,
            });
            break;
        }
      }

      console.log(`Completed: ${results.length} actions executed`);
      return { results };

    } catch (error) {
      console.error('Memory add error:', error);
      throw error;
    }
  }

  /**
   * Execute ADD action
   * @param id Memory ID
   * @param text Memory text
   * @param embedding Embedding vector
   * @param userId User ID
   */
  private async executeAdd(
    id: string,
    text: string,
    embedding: number[],
    userId: string
  ): Promise<void> {
    const hash = generateHash(text);
    const now = new Date().toISOString();

    // Insert into vector store
    await this.vectorStore.insert(
      [embedding],
      [id],
      [{
        user_id: userId,
        data: text,
        hash,
        created_at: now,
      }]
    );

    // Record in history
    await this.historyStore.add({
      memory_id: id,
      user_id: userId,
      prev_value: null,
      new_value: text,
      event: 'ADD',
    });
  }

  /**
   * Execute UPDATE action
   * @param id Memory ID
   * @param text New memory text
   * @param embedding New embedding vector
   * @param userId User ID
   * @param oldMemory Previous memory text
   */
  private async executeUpdate(
    id: string,
    text: string,
    embedding: number[],
    userId: string,
    oldMemory?: string
  ): Promise<void> {
    const hash = generateHash(text);
    const now = new Date().toISOString();

    // Update in vector store
    await this.vectorStore.update(id, embedding, {
      user_id: userId,
      data: text,
      hash,
      updated_at: now,
    });

    // Record in history
    await this.historyStore.add({
      memory_id: id,
      user_id: userId,
      prev_value: oldMemory || null,
      new_value: text,
      event: 'UPDATE',
    });
  }

  /**
   * Execute DELETE action
   * @param id Memory ID
   * @param text Memory text being deleted
   * @param userId User ID
   */
  private async executeDelete(
    id: string,
    text: string,
    userId: string
  ): Promise<void> {
    // Delete from vector store
    await this.vectorStore.delete(id);

    // Record in history
    await this.historyStore.add({
      memory_id: id,
      user_id: userId,
      prev_value: text,
      new_value: null,
      event: 'DELETE',
    });
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.vectorStore.close();
    await this.historyStore.close();
  }
}
