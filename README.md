# FOOH LinkedIn Post Generator

AI-powered tool for creating engaging LinkedIn posts about FOOH (Fake Out Of Home) videos.

## Features

- Password-protected access
- OpenAI GPT-4o-mini integration
- Customizable prompts with presets
- FOOH facts library with usage tracking
- Token-based authentication
- Firebase Firestore database

## Tech Stack

- Node.js/Express backend
- Firebase Firestore database
- OpenAI API integration
- Split deployment (Railway + FTP)

## Environment Variables Required

```
OPENAI_API_KEY=sk-your-openai-api-key
AUTH_PASSWORD=your-secure-password
SESSION_SECRET=your-session-secret
NODE_ENV=production

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)