# Prompt Templates Examples

## Overview

This document provides examples of the LLM prompts used for memory extraction and decision-making in the memory service.

## Memory Extraction Prompt

### Purpose
Extract important, factual information about the user from conversations.

### Example Input

```
Conversation:
User: My name is Alice and I work as a software engineer in San Francisco.
Assistant: Nice to meet you, Alice! What kind of software engineering do you do?
User: I mainly work on backend systems using TypeScript and Node.js.
```

### Example Output

```json
{
  "facts": [
    "Name is Alice",
    "Works as a software engineer",
    "Located in San Francisco",
    "Specializes in backend systems using TypeScript and Node.js"
  ]
}
```

### What Gets Extracted

✅ **Good to extract:**
- Personal information (name, location, job)
- Skills and expertise
- Hobbies and interests
- Preferences (food, music, activities)
- Goals and aspirations
- Important relationships
- Significant life events

❌ **Do NOT extract:**
- Temporary context ("I'm using Chrome")
- Current conditions ("It's raining today")
- Information about the assistant
- Speculative or inferred information
- Trivial details

## Memory Update/Decision Prompt

### Purpose
Decide what action to take for each extracted fact based on existing memories.

### Action Types

1. **ADD** - Create new memory
   - Fact is unique and new
   - No similar memory exists

2. **UPDATE** - Modify existing memory
   - Fact provides newer/better information
   - Updates or refines existing knowledge

3. **DELETE** - Remove existing memory
   - Fact contradicts existing memory
   - Old information is no longer valid

4. **NONE** - Do nothing
   - Fact is redundant
   - Already captured in existing memory

### Example 1: Job Update

**New Facts:**
```
1. Got promoted to senior software engineer at TechCorp
2. Leads the backend team
```

**Existing Memories:**
```
- [ID: mem_001] Works as a software engineer in San Francisco (similarity: 0.85)
- [ID: mem_002] Specializes in TypeScript and Node.js (similarity: 0.45)
```

**Decision Output:**
```json
{
  "memory": [
    {
      "id": "mem_001",
      "text": "Works as a senior software engineer at TechCorp",
      "event": "UPDATE",
      "old_memory": "Works as a software engineer in San Francisco"
    },
    {
      "id": "mem_003",
      "text": "Leads the backend team at TechCorp",
      "event": "ADD"
    }
  ]
}
```

### Example 2: Location Change (DELETE scenario)

**New Facts:**
```
1. Moved from San Francisco to Seattle
2. Lives in Seattle now
```

**Existing Memories:**
```
- [ID: mem_001] Lives in San Francisco (similarity: 0.92)
- [ID: mem_002] Works in San Francisco (similarity: 0.78)
```

**Decision Output:**
```json
{
  "memory": [
    {
      "id": "mem_001",
      "text": "Lives in San Francisco",
      "event": "DELETE"
    },
    {
      "id": "mem_004",
      "text": "Lives in Seattle",
      "event": "ADD"
    },
    {
      "id": "mem_005",
      "text": "Moved from San Francisco to Seattle",
      "event": "ADD"
    }
  ]
}
```

### Example 3: Redundant Information (NONE scenario)

**New Facts:**
```
1. Name is Alice
```

**Existing Memories:**
```
- [ID: mem_001] Name is Alice (similarity: 1.00)
```

**Decision Output:**
```json
{
  "memory": [
    {
      "id": "mem_001",
      "text": "Name is Alice",
      "event": "NONE"
    }
  ]
}
```

## System Prompt with Memory Context

### Without Memories

```
You are a helpful AI assistant. Be friendly, informative, and conversational.
```

### With Memories

```
You are a helpful AI assistant. Be friendly, informative, and conversational.

You have the following information about the user from previous conversations:
- Name is Alice
- Works as a senior software engineer at TechCorp
- Lives in Seattle
- Enjoys hiking and landscape photography
- Favorite hiking spot is Marin Headlands

Use this information to provide personalized responses, but don't explicitly mention
that you're recalling memories unless it's natural to do so. Act as if you naturally
remember these details about the user.
```

### Example Conversation with Memories

**User:** "I'm thinking about going on a hike this weekend."

**Without Memory:**
"That sounds great! Hiking is a wonderful way to spend time outdoors. Do you have any favorite spots?"

**With Memory:**
"That sounds perfect! Are you thinking of heading back to Marin Headlands, or exploring somewhere new around Seattle? The weather should be nice for some landscape photography too!"

## Prompt Design Principles

### 1. Specificity
- Clear, specific instructions
- Explicit rules and constraints
- Examples of what to do and not do

### 2. Structured Output
- JSON format for easy parsing
- Consistent schema
- Type-safe responses

### 3. Context Preservation
- Conversation history included
- Existing memories with similarity scores
- Temporal information (dates, updates)

### 4. Conservative Extraction
- Extract only explicit information
- Avoid inference or assumption
- Focus on persistent facts, not temporary context

### 5. Smart Updates
- Prefer UPDATE over ADD when related
- Use DELETE sparingly (only for contradictions)
- Use NONE for redundancy

## Testing Prompts

### Manual Testing Checklist

1. **Extraction Test**
   - [ ] Extracts basic info (name, location, job)
   - [ ] Identifies hobbies and preferences
   - [ ] Captures skills and expertise
   - [ ] Ignores temporary context
   - [ ] Returns valid JSON

2. **Decision Test**
   - [ ] Correctly identifies new information (ADD)
   - [ ] Updates related information (UPDATE)
   - [ ] Handles contradictions (DELETE)
   - [ ] Avoids redundancy (NONE)
   - [ ] Preserves memory IDs

3. **System Prompt Test**
   - [ ] Naturally incorporates memories
   - [ ] Doesn't overuse memory references
   - [ ] Maintains conversational tone
   - [ ] Provides personalized responses

## Common Issues and Solutions

### Issue: Over-extraction
**Problem:** Extracting too many trivial facts

**Solution:**
- Emphasize "important" and "useful for future conversations"
- Add negative examples in prompt
- Filter by fact length or complexity

### Issue: Under-extraction
**Problem:** Missing important information

**Solution:**
- Add specific categories to extract
- Provide more examples
- Lower extraction threshold

### Issue: Inappropriate Updates
**Problem:** Creating redundant memories instead of updating

**Solution:**
- Emphasize similarity checking
- Provide better UPDATE examples
- Adjust similarity threshold

### Issue: Excessive Deletions
**Problem:** Deleting valid memories incorrectly

**Solution:**
- Emphasize DELETE is for contradictions only
- Require higher confidence for DELETE
- Add safeguards in code

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-20 | Initial prompt templates |

## References

- [Memory System Design](../__project_context/agent_memory.md)
- [Implementation Plan](../__project_context/implementation_plan.md)
- [Prompts Source Code](../lib/memory/prompts.ts)

---

**Note:** These prompts are designed for GPT-3.5-turbo and GPT-4. Adjust temperature and other parameters based on your specific model and requirements.
