# AI Agent with Memory & Multi-Platform Support

A sophisticated AI chatbot with persistent memory built with Next.js 15, TypeScript, and OpenSearch. Features cross-platform support for web, Electron desktop, and mobile (iOS/Android) via Capacitor.

## 🎯 Project Status

**Current Version:** 0.1.0
**Status:** ✅ Fully Functional
**Last Updated:** October 2025

### Recent Updates
- ✅ Advanced memory system with OpenSearch vector storage
- ✅ Fact extraction and semantic memory retrieval
- ✅ Electron desktop app support
- ✅ Capacitor mobile app support (iOS & Android)
- ✅ Image upload support on native platforms
- ✅ Multi-platform build system (web, desktop, mobile)
- ✅ Persistent conversation memory with similarity search
- ✅ Real-time streaming responses
- ✅ SQLite-based history tracking

## ✨ Features

### Core Capabilities
- 🚀 **Real-time Streaming** - See AI responses appear word-by-word
- 🧠 **Persistent Memory** - AI remembers facts from previous conversations using vector similarity search
- 💬 **Modern UI** - Clean interface with dark mode support
- 🔄 **Auto-scrolling** - Automatically follows the conversation
- 🎨 **Tailwind CSS** - Beautiful gradient design and responsive layout
- 🔌 **Multi-Provider** - Works with OpenAI, OpenRouter, Groq, and more
- 🔒 **Secure** - API keys stored in environment variables

### Multi-Platform Support
- 🌐 **Web App** - Next.js web application with full API support
- 💻 **Desktop App** - Electron-based native desktop application (macOS, Windows, Linux)
- 📱 **Mobile Apps** - Native iOS and Android apps via Capacitor
- 📷 **Image Upload** - Camera and photo library access on mobile/desktop
- 🔄 **Cross-Platform** - Shared codebase across all platforms

### Memory System
- 🎯 **Semantic Search** - Find relevant memories using vector embeddings
- 📝 **Fact Extraction** - Automatically extracts important information from conversations
- 🔍 **Smart Retrieval** - Contextual memory lookup based on conversation topics
- 📊 **History Tracking** - Complete audit trail of memory changes (ADD/UPDATE/DELETE)
- 💾 **OpenSearch Integration** - Scalable vector storage for millions of memories
- 🗄️ **SQLite History** - Lightweight local history database

## 🔌 Supported API Providers

This chatbot works with any OpenAI-compatible API service. Simply change the `OPENAI_BASE_URL` in your `.env.local` file:

| Provider | Base URL | Model Examples |
|----------|----------|----------------|
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4`, `gpt-3.5-turbo` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `openai/gpt-4`, `anthropic/claude-3` |
| **Groq** | `https://api.groq.com/openai/v1` | `mixtral-8x7b-32768`, `llama2-70b` |
| **Together AI** | `https://api.together.xyz/v1` | `mistralai/Mixtral-8x7B-Instruct-v0.1` |
| **LocalAI** | `http://localhost:8080/v1` | Your local models |
| **Ollama** | `http://localhost:11434/v1` | `llama2`, `mistral`, etc. |

Plus any other service with OpenAI-compatible endpoints!

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- OpenSearch instance running (for memory features)
- API key from OpenAI or compatible provider

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd uni_agent

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file in the root directory (see `.env.example` for reference):

```env
# OpenAI API Configuration
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Memory Service Configuration
MEMORY_ENABLED=true
OPENSEARCH_NODE=http://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=YourStrongPassword123!
OPENSEARCH_INDEX=chatbot_memories

# Embedding Configuration
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Memory Behavior
MEMORY_SIMILARITY_THRESHOLD=0.7
MEMORY_RETRIEVAL_LIMIT=5
MEMORY_EXTRACTION_ENABLED=true

# Database Configuration
DATABASE_URL=file:./data/chatbot.db

# For mobile/desktop apps
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Set Up OpenSearch (Optional - for memory features)

```bash
# Using Docker
docker run -d -p 9200:9200 -p 9600:9600 -e "discovery.type=single-node" \
  -e "OPENSEARCH_INITIAL_ADMIN_PASSWORD=YourStrongPassword123!" \
  opensearchproject/opensearch:latest
```

### 4. Run the Application

#### Web Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Electron Desktop App
```bash
npm run electron:dev
```

#### Mobile Apps
```bash
# Build for mobile
npm run build:mobile

# Sync with Capacitor
npm run cap:sync

# Open in Xcode (iOS)
npm run cap:ios

# Open in Android Studio (Android)
npm run cap:android
```

## 📁 Project Structure

```
uni_agent/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts           # Chat API with streaming & memory
│   │   └── memory/
│   │       ├── route.ts           # Get all memories
│   │       ├── add/route.ts       # Add new memories
│   │       ├── search/route.ts    # Search memories
│   │       └── [id]/history/route.ts # Memory history
│   ├── components/
│   │   ├── MemoryViewer.tsx       # UI for viewing memories
│   │   └── PlatformInfo.tsx       # Platform detection component
│   ├── types/
│   │   └── chat.ts                # TypeScript interfaces
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main chat UI
│   └── globals.css                # Tailwind styles
├── lib/
│   ├── memory/
│   │   ├── MemoryService.ts       # Core memory orchestration
│   │   ├── stores/
│   │   │   ├── OpenSearchStore.ts # Vector storage
│   │   │   └── HistoryStore.ts    # SQLite history
│   │   ├── extractors/
│   │   │   ├── FactExtractor.ts   # Extract facts from chat
│   │   │   └── ActionDecider.ts   # Decide memory actions
│   │   ├── embeddings/
│   │   │   └── OpenAIEmbedding.ts # Generate embeddings
│   │   └── utils/
│   │       ├── contextBuilder.ts  # Build context from memories
│   │       ├── tokenBudget.ts     # Manage token limits
│   │       └── hash.ts            # Hash utilities
│   ├── api-client.ts              # Platform-aware API client
│   └── platform.ts                # Platform detection
├── electron/
│   ├── src/
│   │   ├── index.ts               # Electron main process
│   │   └── preload.ts             # Preload script
│   └── package.json               # Electron dependencies
├── android/                       # Android Capacitor project
├── ios/                           # iOS Capacitor project
├── capacitor.config.ts            # Capacitor configuration
├── next.config.ts                 # Next.js multi-platform config
├── .env.local                     # Environment variables (not in git)
├── .env.example                   # Example environment config
└── package.json                   # Main dependencies
```

### Key Components

#### Memory System
- **[lib/memory/MemoryService.ts](lib/memory/MemoryService.ts)** - Orchestrates all memory operations
- **[lib/memory/stores/OpenSearchStore.ts](lib/memory/stores/OpenSearchStore.ts)** - Vector database integration
- **[lib/memory/extractors/FactExtractor.ts](lib/memory/extractors/FactExtractor.ts)** - AI-powered fact extraction
- **[lib/memory/extractors/ActionDecider.ts](lib/memory/extractors/ActionDecider.ts)** - Smart memory management decisions

#### API Routes
- **[app/api/chat/route.ts](app/api/chat/route.ts)** - Chat endpoint with memory integration
- **[app/api/memory/route.ts](app/api/memory/route.ts)** - Memory management endpoints

#### Frontend
- **[app/page.tsx](app/page.tsx)** - Main chat interface with image upload support
- **[app/components/MemoryViewer.tsx](app/components/MemoryViewer.tsx)** - Memory browsing UI

#### Platform Support
- **[lib/platform.ts](lib/platform.ts)** - Platform detection utilities
- **[lib/api-client.ts](lib/api-client.ts)** - Cross-platform API client
- **[capacitor.config.ts](capacitor.config.ts)** - Mobile app configuration
- **[electron/](electron/)** - Desktop app setup

## 🔧 How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  (Web Browser / Electron Desktop / iOS / Android App)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│  ┌──────────────────┐         ┌──────────────────────┐          │
│  │   /api/chat      │         │   /api/memory/*      │          │
│  │  (streaming)     │         │  (CRUD operations)   │          │
│  └────────┬─────────┘         └──────────┬───────────┘          │
└───────────┼────────────────────────────────┼──────────────────────┘
            │                                │
            ▼                                ▼
┌──────────────────────┐         ┌──────────────────────┐
│   OpenAI API         │         │   Memory Service     │
│  (Streaming Chat)    │         │  (Fact Extraction)   │
└──────────────────────┘         └──────────┬───────────┘
                                            │
                    ┌───────────────────────┼────────────────────────┐
                    ▼                       ▼                        ▼
         ┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐
         │ OpenSearch       │   │ OpenAI Embeddings│   │ SQLite (History)   │
         │ (Vector Store)   │   │ (text-embedding) │   │ (Audit Trail)      │
         └──────────────────┘   └──────────────────┘   └────────────────────┘
```

### Memory System Flow

1. **Conversation Input** → User sends message to chat
2. **Fact Extraction** → AI analyzes conversation and extracts important facts
3. **Embedding Generation** → Facts converted to vector embeddings
4. **Similarity Search** → Search existing memories for related content
5. **Action Decision** → AI decides: ADD new / UPDATE existing / DELETE outdated / NONE
6. **Storage** → Execute actions in OpenSearch (vectors) & SQLite (history)
7. **Retrieval** → When user asks question, relevant memories retrieved via semantic search
8. **Context Building** → Memories injected into chat context for AI awareness

### Platform-Specific Features

#### Web App
- Full API routes available (Next.js server)
- Direct database connections
- Server-side memory processing

#### Electron Desktop
- Static export of Next.js app
- Bundled with Electron shell
- Native file system access
- API calls to separate backend or embedded server

#### Mobile Apps (iOS/Android)
- Static export via Capacitor
- Native camera/photo access
- API calls to backend server
- Offline-first capability with local storage

### Component Breakdown

1. **Frontend** ([app/page.tsx](app/page.tsx)):
   - React client with real-time streaming
   - Image upload support on native platforms
   - Memory viewer component
   - Platform-aware API client

2. **Chat API** ([app/api/chat/route.ts](app/api/chat/route.ts)):
   - Streaming responses via OpenAI SDK
   - Memory integration for context
   - Automatic fact extraction after responses
   - Token budget management

3. **Memory Service** ([lib/memory/MemoryService.ts](lib/memory/MemoryService.ts)):
   - Orchestrates fact extraction, embedding, and storage
   - Manages ADD/UPDATE/DELETE operations
   - Semantic search with similarity scoring
   - History tracking for audit trail

4. **Vector Storage** ([lib/memory/stores/OpenSearchStore.ts](lib/memory/stores/OpenSearchStore.ts)):
   - OpenSearch integration for scalable vector search
   - Cosine similarity scoring
   - Metadata filtering by user_id
   - Efficient batch operations

## 🎨 Customization

### Change the AI Model

Edit `OPENAI_MODEL` in `.env.local`:

```env
# Use GPT-4 for better responses
OPENAI_MODEL=gpt-4

# Use GPT-4 Turbo for faster GPT-4
OPENAI_MODEL=gpt-4-turbo-preview

# Use Groq's Mixtral for ultra-fast responses
OPENAI_MODEL=mixtral-8x7b-32768
```

### Adjust AI Response Parameters

Edit [app/api/chat/route.ts](app/api/chat/route.ts) (around line 26-31):

```typescript
const response = await openai.chat.completions.create({
  model,
  stream: true,
  messages,
  temperature: 0.7,      // Lower = more focused, Higher = more creative (0.0-2.0)
  max_tokens: 1000,      // Maximum response length
  // Add more parameters:
  // top_p: 1,           // Nucleus sampling
  // frequency_penalty: 0,
  // presence_penalty: 0,
});
```

### Customize UI Styling

The UI uses Tailwind CSS. Edit [app/page.tsx](app/page.tsx) to customize:

**Colors:**
- User messages: `bg-blue-600` → Change to your preferred color
- AI messages: `bg-white dark:bg-gray-800` → Customize background
- Gradient: `from-gray-50 to-gray-100` → Create your own gradient

**Layout:**
- Message width: `max-w-[80%]` → Adjust message bubble size
- Container width: `max-w-4xl` → Change overall layout width

**Animations:**
- Loading dots: Modify `animate-bounce` and `animationDelay`

## 🔍 Troubleshooting

### Common Issues

#### ❌ "Invalid API Key" Error
**Problem:** Authentication failure with the AI provider

**Solutions:**
- ✅ Verify your `OPENAI_API_KEY` in `.env.local` is correct
- ✅ Ensure you've restarted the dev server after changing `.env.local`
- ✅ Check that your API key hasn't expired or been revoked
- ✅ Confirm you have credits/quota remaining with your provider

#### ❌ "Failed to get response" Error
**Problem:** Cannot connect to the AI provider

**Solutions:**
- ✅ Check that `OPENAI_BASE_URL` matches your provider's endpoint
- ✅ Verify the model name is supported by your provider
- ✅ Test your API key with a curl request to the provider
- ✅ Check your provider's status page for outages
- ✅ Ensure you're not behind a firewall blocking the API

#### ❌ Streaming Not Working
**Problem:** Responses appear all at once instead of word-by-word

**Solutions:**
- ✅ Some providers don't support streaming (check their docs)
- ✅ Check browser console (F12) for JavaScript errors
- ✅ Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- ✅ Verify the `stream: true` parameter in [app/api/chat/route.ts](app/api/chat/route.ts)

#### ❌ TypeScript Errors
**Problem:** Type errors during development

**Solutions:**
- ✅ Run `npm install` to ensure all dependencies are installed
- ✅ Check that TypeScript version is compatible (v5+)
- ✅ Restart your IDE/editor TypeScript server

### Getting Help

If you encounter issues not listed here:
1. Check the browser console for error messages
2. Review the terminal where `npm run dev` is running
3. Verify all environment variables are set correctly
4. Try with a different AI provider to isolate the issue

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Run Next.js dev server
npm run electron:dev           # Build and run Electron app
npm run mobile:dev             # Build for mobile and open in IDE

# Building
npm run build                  # Build for web (with API routes)
npm run build:web              # Build standalone web server
npm run build:mobile           # Build static export for mobile
npm run build:electron         # Build static export for Electron

# Electron Desktop
npm run electron:build         # Build Electron app
npm run electron:package       # Package Electron app for distribution
npm run cap:electron           # Open Electron project

# Mobile (Capacitor)
npm run cap:sync               # Sync web build to mobile platforms
npm run cap:copy               # Copy web files to mobile
npm run cap:update             # Update Capacitor dependencies
npm run cap:ios                # Open iOS project in Xcode
npm run cap:android            # Open Android project in Android Studio

# Other
npm start                      # Start production server
npm run lint                   # Run ESLint
```

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.6 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 4 | Styling framework |
| **OpenAI SDK** | 6.5.0 | AI provider integration |
| **OpenSearch** | 3.5.1 | Vector database for memories |
| **SQLite (better-sqlite3)** | 12.4.1 | Local history storage |
| **Capacitor** | 7.4.3 | Native mobile wrapper |
| **Electron** | 38.4.0 | Desktop app framework |

### Key Technologies

- **Vector Embeddings** - Semantic search using OpenAI text-embedding-3
- **Streaming** - Real-time AI response delivery
- **Cross-Platform** - Single codebase for web, desktop, and mobile
- **Memory System** - Persistent conversation context with fact extraction
- **OpenSearch** - Scalable vector similarity search
- **Capacitor Camera** - Native camera and photo access

## 🚀 Deployment

### Web Application

#### Deploy to Vercel (Recommended for Web)

1. Go to [Vercel](https://vercel.com) and import your repository
2. Add environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`
   - `OPENSEARCH_NODE` (external OpenSearch instance)
   - `OPENSEARCH_USERNAME`
   - `OPENSEARCH_PASSWORD`
   - `DATABASE_URL` (PostgreSQL recommended for production)
   - All other env vars from `.env.example`
3. Deploy!

#### Docker Deployment

```bash
# Build web version
BUILD_TARGET=web npm run build

# Run with Docker
docker build -t ai-agent .
docker run -p 3000:3000 --env-file .env.local ai-agent
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed Docker instructions.

### Desktop Application (Electron)

```bash
# Build for current platform
npm run electron:build

# Package for distribution
npm run electron:package

# Distributable app will be in electron/dist/
```

Supports macOS, Windows, and Linux builds via electron-builder.

### Mobile Applications

#### iOS

1. Build and sync: `npm run mobile:dev`
2. Open Xcode: Project opens automatically
3. Configure signing in Xcode
4. Build and run on device/simulator

Requirements:
- macOS with Xcode installed
- Apple Developer account for device deployment

#### Android

1. Build and sync: `npm run build:mobile && npm run cap:sync`
2. Open Android Studio: `npm run cap:android`
3. Configure signing in Android Studio
4. Build APK or AAB for distribution

Requirements:
- Android Studio installed
- Android SDK configured

### Production Considerations

#### Memory System Setup
- Use managed OpenSearch service (AWS OpenSearch, Elastic Cloud)
- Set up PostgreSQL for production history storage
- Configure proper backup strategies
- Set appropriate similarity thresholds for your use case

#### API Configuration
- For mobile/desktop: Point `NEXT_PUBLIC_API_URL` to your web server
- Use environment-specific configs
- Enable CORS for cross-origin requests from native apps

#### Security
- Never commit `.env.local` or API keys
- Use environment variables for all sensitive data
- Implement rate limiting on API routes
- Add authentication for production deployments

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions

- 🎨 Additional UI themes and customization options
- 🌐 Multi-language support with i18n
- 🔐 User authentication and multi-user support
- 📊 Analytics dashboard for memory usage
- 🔊 Text-to-speech and voice input
- 📸 Image generation support (DALL-E integration)
- 🔗 Memory graph visualization
- 📤 Export/import memory backups
- 🧪 Additional embedding providers (Cohere, local models)
- 📝 Conversation templates and prompts library
- 🔔 Push notifications for mobile apps
- 🌙 Advanced memory management (tagging, categories)

## 💡 Use Cases

This project demonstrates several advanced AI application patterns:

- **Personal AI Assistant** - Remember user preferences, facts, and context across conversations
- **Customer Support Bot** - Maintain customer history and preferences
- **Educational Tutor** - Track student progress and learning patterns
- **Research Assistant** - Build knowledge base from conversations
- **Desktop Productivity Tool** - Native desktop app with AI capabilities
- **Mobile AI App** - On-the-go AI assistance with camera integration
- **Knowledge Management** - Extract and organize information automatically

## ⭐ Support

If you find this project helpful, please consider:
- Giving it a star on GitHub
- Sharing it with others
- Contributing improvements
- Reporting issues or suggesting features

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide

## 🏗️ Project Architecture

This project showcases a modern full-stack AI application with:

- **Monorepo Structure** - Single codebase for web, desktop, and mobile
- **Vector Database Integration** - Semantic memory with OpenSearch
- **AI-Powered Features** - Fact extraction, embedding generation, memory management
- **Cross-Platform Support** - React Native-style approach with Capacitor
- **Real-Time Streaming** - Progressive response rendering
- **Type Safety** - Full TypeScript coverage
- **Production Ready** - Docker support, environment management, error handling

---

**Built with Next.js 15, OpenAI SDK, OpenSearch, Capacitor & Electron**

*A demonstration of advanced AI application architecture with persistent memory and multi-platform support.*
