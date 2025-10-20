# AI Chatbot with OpenAI-Compatible API

A modern, streaming chatbot built with Next.js 15, TypeScript, and Tailwind CSS that works with OpenAI and any OpenAI-compatible API providers.

## Features

- 🚀 Real-time streaming responses
- 💬 Clean, modern UI with dark mode support
- 🔄 Auto-scrolling chat interface
- 🎨 Beautiful gradient design with Tailwind CSS
- 🔌 Support for multiple OpenAI-compatible providers
- ⚡️ Built with Next.js 15 App Router and Edge Runtime

## Supported API Providers

This chatbot works with any OpenAI-compatible API service, including:

- **OpenAI** - Official OpenAI API
- **OpenRouter** - Access to multiple LLM providers
- **Together AI** - Fast inference for open models
- **Groq** - Ultra-fast LLM inference
- **LocalAI** - Run models locally
- **Ollama** - Local model serving (via compatibility layer)
- Any other service with OpenAI-compatible endpoints

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit the `.env.local` file in the root directory with your API credentials:

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

Open [http://localhost:3000](http://localhost:3000) in your browser to see the chatbot.

## Project Structure

```
app/
├── api/
│   └── chat/
│       └── route.ts          # API endpoint for chat requests
├── types/
│   └── chat.ts               # TypeScript type definitions
├── layout.tsx                # Root layout with metadata
├── page.tsx                  # Main chatbot UI component
└── globals.css               # Global styles
```

## How It Works

1. **Frontend** ([page.tsx](app/page.tsx)):
   - React component with chat UI
   - Manages message state and user input
   - Handles streaming responses from the API

2. **Backend** ([app/api/chat/route.ts](app/api/chat/route.ts)):
   - Next.js API route running on Edge Runtime
   - Configures OpenAI client with custom base URL
   - Streams responses back to the frontend

3. **Configuration** ([.env.local](.env.local)):
   - Stores API credentials securely
   - Allows easy switching between providers
   - Not committed to git (protected by .gitignore)

## Customization

### Change the Model

Edit `OPENAI_MODEL` in `.env.local` to use a different model:

```env
OPENAI_MODEL=gpt-4
```

### Adjust Response Parameters

Edit [app/api/chat/route.ts](app/api/chat/route.ts#L26-L31) to modify:
- `temperature`: Creativity (0.0 - 2.0)
- `max_tokens`: Maximum response length
- Other OpenAI parameters

### Modify UI Styling

The UI uses Tailwind CSS classes. Edit [page.tsx](app/page.tsx) to customize:
- Colors and themes
- Layout and spacing
- Message bubble styles

## Troubleshooting

### "Invalid API Key" Error
- Verify your `OPENAI_API_KEY` in `.env.local` is correct
- Ensure you've restarted the dev server after changing `.env.local`

### "Failed to get response" Error
- Check that `OPENAI_BASE_URL` is correct for your provider
- Verify the model name is supported by your provider
- Check your API provider's status page

### Streaming Not Working
- Some providers may not support streaming
- Check the browser console for errors
- Ensure you're using a modern browser

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
