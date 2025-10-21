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

## 🔧 **SETUP GUIDE** (Non-Developer Friendly)

### **Step 1: Railway Environment Variables Setup**

1. **Go to your Railway project**: [https://railway.app/project/d56bd076-cf91-4e06-9327-7848cd164c07](https://railway.app/project/d56bd076-cf91-4e06-9327-7848cd164c07)

2. **Click on "Variables" tab** in Railway

3. **Add these environment variables** (copy-paste exactly):

```
OPENAI_API_KEY=sk-YOUR_ACTUAL_OPENAI_KEY_HERE
AUTH_PASSWORD=FJ7aGAohcaXfCHgH3DDEPfTv.sv@Xy
SESSION_SECRET=fooh-2025-super-secret-session-key-xyz789
NODE_ENV=production

FIREBASE_API_KEY=AIzaSyBxHKyy1XAdKLkjQCNTuhdieQLtjZnq3hQ
FIREBASE_AUTH_DOMAIN=linkedin-generator-95f96.firebaseapp.com
FIREBASE_PROJECT_ID=linkedin-generator-95f96
FIREBASE_STORAGE_BUCKET=linkedin-generator-95f96.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=753617799017
FIREBASE_APP_ID=1:753617799017:web:5a80c2748e3079f27a9ff8
FIREBASE_MEASUREMENT_ID=G-LE6NFS6XT8
```

⚠️ **Important**: Replace `sk-YOUR_ACTUAL_OPENAI_KEY_HERE` with your real OpenAI API key!

4. **Save** the variables in Railway

---

### **Step 2: Firebase Security Rules Setup**

1. **Go to Firebase Console**: [https://console.firebase.google.com](https://console.firebase.google.com)

2. **Select your project**: `linkedin-generator-95f96`

3. **Click "Firestore Database"** (left sidebar)

4. **Click "Rules" tab** (top of page)

5. **Replace all the code** with this (copy-paste):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to presets and facts collections
    match /{collection}/{document} {
      allow read, write: if collection in ['presets', 'facts'];
    }
  }
}
```

6. **Click "Publish"** to save the rules

---

### **Step 3: Upload Frontend to Hetzner FTP**

1. **Find the file**: `frontend-for-ftp/index.html` in your project folder

2. **Upload to Hetzner FTP** as `index.html` (overwrite existing file)

3. **Your frontend URL**: `https://fooh-linkedin.snekmedia.com`

---

### **Step 4: Testing Checklist**

✅ **Test the app**:

1. Visit: `https://fooh-linkedin.snekmedia.com`
2. Login with password: `FJ7aGAohcaXfCHgH3DDEPfTv.sv@Xy`
3. Try generating a post with:
   - **Description**: "A giant Nike shoe appears on Times Square"
   - **Metrics**: "500K views, 12K likes"
   - **Fact**: Pick any from dropdown
4. Check if post generates successfully

🔧 **If it doesn't work**:

- **403/401 errors**: Check Railway environment variables are saved
- **503 errors**: Check your OpenAI API key is valid and has credits
- **Can't login**: Check AUTH_PASSWORD in Railway matches exactly
- **Database errors**: Check Firebase rules are published correctly

---

### **Step 5: How Updates Work**

🔄 **Automatic Backend Updates**:
- When you push to GitHub → Railway automatically redeploys
- No manual steps needed for backend

📁 **Manual Frontend Updates**:
- Upload `frontend-for-ftp/index.html` to Hetzner FTP
- Overwrites the existing `index.html` file

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)