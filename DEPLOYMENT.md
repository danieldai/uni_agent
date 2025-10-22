# Deployment Guide

This project supports multiple deployment modes:

## 1. Development Mode (with APIs)

Run the full Next.js app with API routes:

```bash
npm run dev
```

Access at: `http://localhost:3000`
- Frontend: ✅
- API Routes: ✅ (`/api/*`)

---

## 2. Mobile Build (Static Export)

Build static files for Capacitor mobile apps:

```bash
npm run build:mobile
npm run cap:sync
```

Output: `out/` directory
- Frontend: ✅ (static HTML/CSS/JS)
- API Routes: ❌ (not included, deploy separately)

### Open in Native IDEs:
```bash
npm run cap:ios      # Open in Xcode
npm run cap:android  # Open in Android Studio
```

---

## 3. Web Production (with APIs)

### Option A: Node.js Server

Build and run with Node.js:

```bash
npm run build        # Regular build with APIs
npm run start        # Start production server
```

Access at: `http://localhost:3000`

### Option B: Docker Deployment

Build Docker image:

```bash
docker build -t memory-app .
```

Run container:

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e OPENSEARCH_URL=your_opensearch_url \
  -e DATABASE_URL=your_db_url \
  memory-app
```

### Option C: Vercel/Platform Deployment

Deploy to Vercel, Railway, Render, or Fly.io:

1. Connect your Git repository
2. Set environment variables:
   - `OPENAI_API_KEY`
   - `OPENSEARCH_URL`
   - `DATABASE_URL`
3. Deploy (build command: `npm run build`)

---

## Environment Variables

### Required for API Routes:

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
OPENAI_MODEL=gpt-3.5-turbo                   # Optional
OPENSEARCH_URL=https://your-opensearch:9200
DATABASE_URL=postgresql://...                # Or SQLite path
```

### For Mobile App (Frontend):

```env
NEXT_PUBLIC_API_URL=https://your-api-server.com/api
```

---

## Build Target Summary

| Command | Build Target | Output | APIs | Use Case |
|---------|-------------|--------|------|----------|
| `npm run dev` | Development | `.next` | ✅ | Local development |
| `npm run build` | Web (default) | `.next` | ✅ | Web production (Vercel, Node.js) |
| `npm run build:web` | Web (standalone) | `.next/standalone` | ✅ | Docker deployment |
| `npm run build:mobile` | Mobile (export) | `out/` | ❌ | iOS/Android apps |

---

## Docker Compose Example

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENSEARCH_URL=${OPENSEARCH_URL}
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

---

## Mobile App API Configuration

When deploying for mobile, update the mobile app to point to your deployed API:

```typescript
// In your mobile app code
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

Set in `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-api-server.com/api
```

---

## Troubleshooting

### APIs not working in mobile build
- Mobile builds use `output: 'export'` which disables API routes
- Deploy APIs separately using web build or Docker

### Docker build fails
- Check that all dependencies are in `package.json`
- Ensure environment variables are set

### CORS errors from mobile app
- Add CORS middleware to API routes if needed
- Check that `androidScheme: 'https'` is set in `capacitor.config.ts`
