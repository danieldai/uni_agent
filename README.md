# AI Chatbot with OpenAI-Compatible API

A modern, streaming chatbot built with Next.js 15, TypeScript, and Tailwind CSS that works with OpenAI and any OpenAI-compatible API providers.

## 🎯 Project Status

**Current Version:** 0.1.0
**Status:** ✅ Fully Functional
**Last Updated:** January 2025

### Recent Updates
- ✅ Initial chatbot implementation with streaming support
- ✅ OpenAI SDK integration (v6.5.0)
- ✅ Full-screen responsive UI with dark mode
- ✅ Environment-based configuration for multiple providers
- ✅ Edge Runtime optimization

## ✨ Features

- 🚀 **Real-time Streaming** - See AI responses appear word-by-word
- 💬 **Modern UI** - Clean interface with dark mode support
- 🔄 **Auto-scrolling** - Automatically follows the conversation
- 🎨 **Tailwind CSS** - Beautiful gradient design and responsive layout
- 🔌 **Multi-Provider** - Works with OpenAI, OpenRouter, Groq, and more
- ⚡️ **Edge Runtime** - Fast performance with Next.js 15 App Router
- 🔒 **Secure** - API keys stored in environment variables
- 📱 **Responsive** - Works seamlessly on desktop and mobile

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

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd memory_with_opensearch

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create or edit the `.env.local` file in the root directory with your API credentials:

```env
# For OpenAI
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# For OpenRouter
# OPENAI_BASE_URL=https://openrouter.ai/api/v1
# OPENAI_API_KEY=sk-or-v1-your-key-here
# OPENAI_MODEL=openai/gpt-3.5-turbo

# For Groq
# OPENAI_BASE_URL=https://api.groq.com/openai/v1
# OPENAI_API_KEY=gsk_your-groq-api-key-here
# OPENAI_MODEL=mixtral-8x7b-32768

# For Together AI
# OPENAI_BASE_URL=https://api.together.xyz/v1
# OPENAI_API_KEY=your-together-api-key-here
# OPENAI_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start chatting!

### 4. Start Chatting

Once the server is running:
1. Type your message in the input field at the bottom
2. Click "Send" or press Enter
3. Watch the AI response stream in real-time
4. Continue the conversation!

## 📁 Project Structure

```
memory_with_opensearch/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API endpoint with streaming support
│   ├── types/
│   │   └── chat.ts           # TypeScript interfaces for messages
│   ├── layout.tsx            # Root layout with metadata
│   ├── page.tsx              # Main chatbot UI (client component)
│   └── globals.css           # Global Tailwind styles
├── .env.local                # Environment variables (not in git)
├── package.json              # Dependencies (Next.js 15, OpenAI 6.5.0)
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

### Key Files

- **[app/api/chat/route.ts](app/api/chat/route.ts)** - Edge Runtime API route that handles OpenAI streaming
- **[app/page.tsx](app/page.tsx)** - React client component with chat interface and state management
- **[app/types/chat.ts](app/types/chat.ts)** - TypeScript definitions for Message and ChatResponse
- **[.env.local](.env.local)** - Configuration for API keys and provider settings

## 🔧 How It Works

### Architecture Flow

```
User Input → Frontend (React) → API Route (Edge) → OpenAI SDK → AI Provider
                ↑                                                      ↓
                └──────────────── Streaming Response ─────────────────┘
```

### Component Breakdown

1. **Frontend** ([app/page.tsx](app/page.tsx)):
   - React client component with `useState` and `useEffect` hooks
   - Manages message history and input state
   - Sends POST requests to `/api/chat` endpoint
   - Reads and renders streaming responses in real-time
   - Auto-scrolls to latest message

2. **Backend API** ([app/api/chat/route.ts](app/api/chat/route.ts)):
   - Next.js API route with Edge Runtime for optimal performance
   - Initializes OpenAI client with configurable base URL
   - Accepts message array and forwards to AI provider
   - Returns `ReadableStream` for token-by-token streaming
   - Error handling with proper HTTP status codes

3. **Configuration** ([.env.local](.env.local)):
   - Stores API credentials securely outside of codebase
   - Allows switching providers without code changes
   - Protected by `.gitignore` (never committed to version control)

4. **Type Safety** ([app/types/chat.ts](app/types/chat.ts)):
   - TypeScript interfaces for `Message` and `ChatResponse`
   - Ensures type safety across frontend and backend

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
# Install dependencies
npm install

# Run development server (with Turbopack)
npm run dev

# Build for production (with Turbopack)
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.6 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 4 | Styling framework |
| **OpenAI SDK** | 6.5.0 | AI provider integration |

### Key Technologies

- **Turbopack** - Fast bundler for development and production
- **Edge Runtime** - Deployed at the edge for low latency
- **Server Components** - Optimized rendering strategy
- **Streaming** - Real-time response delivery

## 🚀 Deployment

### Deploy to Vercel

The easiest way to deploy this chatbot:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Click the button above or go to [Vercel](https://vercel.com)
2. Import your repository
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`
4. Deploy!

### Deploy to Other Platforms

This is a standard Next.js app and can be deployed to:
- **Netlify** - Full Next.js support
- **Railway** - Simple deployment with environment variables
- **Fly.io** - Docker-based deployment
- **AWS Amplify** - Integrated with AWS services
- **Self-hosted** - Use `npm run build` and `npm start`

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

- 🎨 Additional UI themes
- 💾 Conversation history persistence
- 🔊 Text-to-speech integration
- 📸 Image generation support
- 🌐 Multi-language support
- 🔐 User authentication
- 📊 Usage analytics dashboard

## ⭐ Support

If you find this project helpful, please consider:
- Giving it a star on GitHub
- Sharing it with others
- Contributing improvements

---

**Built with ❤️ using Next.js 15 and OpenAI SDK**
