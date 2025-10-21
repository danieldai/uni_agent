# Memory Service User Guide

## Overview

The Memory Service enables the AI chatbot to remember information about you across conversations, providing a more personalized and context-aware experience.

## How It Works

### Automatic Memory Management

1. **Extraction**: As you chat, the AI automatically extracts key facts from your conversations
2. **Storage**: Important information is stored as vector embeddings for semantic search
3. **Retrieval**: In future conversations, relevant memories are retrieved and used for context
4. **Updates**: When you provide new information, the system intelligently updates existing memories

### What Gets Remembered?

The system extracts and remembers:

- Your name, location, job, and professional details
- Personal preferences (food, music, activities, hobbies)
- Important life events or dates
- Relationships and connections
- Goals and aspirations
- Technical skills or areas of expertise

## Using the Memory System

### In the Chat Interface

The memory system works automatically while you chat:

1. **Memory Indicator**: When the chatbot uses memories, you'll see an indicator showing how many memories were retrieved
2. **Personalized Responses**: The AI will use your stored information to provide more relevant answers
3. **Natural Updates**: Simply tell the AI new information, and it will update your memories accordingly

**Example Conversation:**

```
You: Hi! My name is Sarah and I work as a software engineer.
AI: Nice to meet you, Sarah! What kind of software engineering do you do?

[Later conversation]
You: I love hiking on weekends.
AI: That's great! Do you have any favorite hiking trails?

[Even later]
You: What do you know about me?
AI: You're Sarah, a software engineer who enjoys hiking on weekends!
```

### Memory Updates

The system handles three types of memory operations:

1. **ADD**: Creates new memories for facts not previously known
2. **UPDATE**: Modifies existing memories with new information
3. **DELETE**: Removes memories that are no longer valid or contradictory

**Example Update:**

```
You: I work as a product manager.
[Memory created: "User works as a product manager"]

You: I got promoted to senior product manager!
[Memory updated: "User works as a senior product manager"]
```

## API Usage

### Search Memories

Search for memories related to a specific query:

```bash
curl "http://localhost:3000/api/memory/search?query=my+hobbies&userId=user_123&limit=5"
```

**Response:**
```json
{
  "results": [
    {
      "id": "mem_abc123",
      "memory": "User loves hiking",
      "score": 0.92,
      "created_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### Get All Memories

Retrieve all memories for your user ID:

```bash
curl "http://localhost:3000/api/memory?userId=user_123"
```

**Response:**
```json
{
  "results": [
    {
      "id": "mem_abc123",
      "memory": "User's name is Sarah",
      "user_id": "user_123",
      "created_at": "2025-01-20T10:00:00Z",
      "hash": "abc123..."
    }
  ]
}
```

### View Memory History

See the complete change history for a specific memory:

```bash
curl "http://localhost:3000/api/memory/mem_abc123/history"
```

**Response:**
```json
{
  "history": [
    {
      "id": "hist_1",
      "memory_id": "mem_abc123",
      "event": "ADD",
      "prev_value": null,
      "new_value": "User works as a product manager",
      "timestamp": "2025-01-20T10:00:00Z"
    },
    {
      "id": "hist_2",
      "memory_id": "mem_abc123",
      "event": "UPDATE",
      "prev_value": "User works as a product manager",
      "new_value": "User works as a senior product manager",
      "timestamp": "2025-01-21T15:30:00Z"
    }
  ]
}
```

### Delete a Memory

Remove a specific memory:

```bash
curl -X DELETE "http://localhost:3000/api/memory" \
  -H "Content-Type: application/json" \
  -d '{"memoryId": "mem_abc123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

### Manually Add Memories

You can also manually add memories from conversations:

```bash
curl -X POST "http://localhost:3000/api/memory/add" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "messages": [
      {
        "id": "1",
        "role": "user",
        "content": "I love pizza",
        "timestamp": 1642684800000
      }
    ]
  }'
```

**Response:**
```json
{
  "results": [
    {
      "id": "mem_xyz789",
      "memory": "User loves pizza",
      "event": "ADD"
    }
  ]
}
```

## Privacy & Security

### Data Scope

- **User Isolation**: Memories are scoped to your user ID - no one else can see your memories
- **Local Storage**: Your user ID is stored in your browser's localStorage
- **Secure Storage**: Memory data is stored in OpenSearch with user-based filtering

### Data Control

You have full control over your memories:

- **View All**: Access all your stored memories at any time
- **Delete Individual**: Remove specific memories you don't want stored
- **Clear All**: Delete your entire memory history (contact support)
- **Audit Trail**: View complete history of all changes to memories

### What's NOT Stored

The system is designed to avoid storing:

- Passwords or credentials
- Credit card or payment information
- Highly sensitive personal data (unless explicitly stated)

## Best Practices

### For Better Memory Management

1. **Be Specific**: Clear statements help the AI extract accurate information
   - Good: "I work as a software engineer at Google"
   - Less good: "I do some tech stuff"

2. **Correct Mistakes**: If the AI remembers something incorrectly, correct it explicitly
   - "Actually, I work in Seattle, not San Francisco"

3. **Update Changes**: Tell the AI when things change
   - "I got a new job as a data scientist"
   - "I moved to Austin last month"

4. **Review Periodically**: Check your memories occasionally to ensure accuracy

### Privacy Tips

1. **Avoid Sensitive Info**: Don't share passwords, SSNs, or other highly sensitive data
2. **Use Generic Terms**: When discussing sensitive topics, use general terms
3. **Clear Old Memories**: Periodically review and delete outdated or unwanted memories

## Troubleshooting

### Memory Not Being Retrieved

**Issue**: The AI doesn't seem to remember information you shared.

**Solutions**:
- Wait a few seconds after sharing information (indexing delay)
- Be more specific in your statements
- Check if the memory was actually extracted (use the API to view all memories)
- Try rephrasing your query to match how the information was originally stated

### Incorrect Memory Updates

**Issue**: The AI updated a memory incorrectly.

**Solutions**:
- Explicitly correct the information: "No, I said X, not Y"
- Delete the incorrect memory and state the correct information again
- Check the memory history to see what changed

### Too Many/Few Memories

**Issue**: The system is creating too many granular memories or not enough.

**Solutions**:
- This is controlled by the extraction prompts (contact support for adjustments)
- You can manually delete overly granular memories
- Provide more comprehensive statements to create richer memories

## Feature Limitations

### Current Limitations

1. **English Only**: Currently optimized for English conversations
2. **Text Only**: Does not process images, videos, or other media
3. **Recent Context**: Focuses on recent conversation history for extraction
4. **Similarity Threshold**: Very different phrasings might not match existing memories

### Planned Enhancements

- Multi-language support
- Multi-modal memory (images, documents)
- Temporal reasoning (understanding time-based changes)
- Memory analytics and insights
- Export/import functionality

## Support

### Getting Help

- **Documentation**: Check the [Developer Guide](./developer-guide.md) for technical details
- **API Reference**: See [API Reference](./api-reference.md) for complete endpoint documentation
- **Issues**: Report bugs or request features via GitHub Issues

### Feedback

Your feedback helps improve the memory system:
- Report inaccurate extractions
- Suggest new memory types to track
- Share use cases and feature requests

---

**Version**: 1.0
**Last Updated**: January 2025
**License**: MIT
