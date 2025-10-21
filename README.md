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
AUTH_PASSWORD=your-secure-password-here
SESSION_SECRET=your-random-session-secret-here
NODE_ENV=production

# Firebase Configuration (Web SDK)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## 📁 Files Structure

```
├── server.js           # Express server (Railway)
├── firebase-web-database.js # Firebase Firestore database (Railway)
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