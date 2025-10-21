# FOOH LinkedIn Post Generator

AI-powered tool for creating engaging LinkedIn posts about FOOH (Fake Out Of Home) videos.

## 🚀 Deployment Architecture

This project uses a **split deployment** strategy:

### Backend (Railway)
- **Repository**: This GitHub repo contains only backend files
- **Deploy**: Entire repo to Railway
- **URL**: `https://web-production-d56b.up.railway.app`

### Frontend (Hetzner FTP)
- **File**: `frontend-for-ftp/index.html` (upload as `index.html`)
- **URL**: `https://fooh-linkedin.snekmedia.com`
- **API calls**: Point to Railway backend

## 🔧 Environment Variables (Railway)

```
OPENAI_API_KEY=your-openai-api-key
AUTH_PASSWORD=FJ7aGAohcaXfCHgH3DDEPfTv.sv@Xy
SESSION_SECRET=fooh-session-secret-key-for-development
NODE_ENV=production

# Firebase Configuration
FIREBASE_PROJECT_ID=linkedin-generator-95f96
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@linkedin-generator-95f96.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

## 📁 Files Structure

```
├── server.js           # Express server (Railway)
├── firebase-database.js # Firebase Firestore database (Railway)
├── package.json        # Dependencies (Railway)
├── .env.example        # Environment template
├── frontend-for-ftp/   # Frontend files (Hetzner FTP)
│   └── index.html      # Upload this to FTP as index.html
```

## 🔐 Features

- Password-protected access
- OpenAI GPT-4o-mini integration
- Customizable prompts with presets (max 5)
- FOOH facts library with usage tracking
- Token-based authentication (cross-domain support)
- Firebase Firestore database for persistent data storage

## 📝 Usage

1. Users visit: `https://fooh-linkedin.snekmedia.com`
2. Enter password to access
3. Fill form: description, metrics, creator, FOOH fact
4. Generate LinkedIn post using AI
5. Copy and use the generated post

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)