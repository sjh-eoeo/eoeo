# 🚀 Quick Start Guide

Get the TikTok Video Management Dashboard running in 5 minutes!

## Prerequisites Checklist
- ✅ Node.js 18+ installed
- ✅ pnpm installed (or npm)
- ✅ Firebase account created
- ✅ Git installed

---

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd tiktok-video-management-dashboard

# Install dependencies
pnpm install
```

---

## Step 2: Firebase Setup (2 minutes)

### Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Follow the wizard (enable Google Analytics if desired)

### Enable Services
1. **Authentication**: 
   - Click "Authentication" → "Get started"
   - Go to "Sign-in method" tab
   - Enable "Google" provider → Save

2. **Firestore Database**:
   - Click "Firestore Database" → "Create database"
   - Start in "Production mode"
   - Choose location closest to your users

3. **Storage**:
   - Click "Storage" → "Get started"
   - Use default rules → Next → Done

### Get Configuration
1. Go to "Project Settings" (⚙️ icon)
2. Scroll to "Your apps" section
3. Click "</>" (Web) icon
4. Register app (nickname: "Dashboard")
5. Copy the `firebaseConfig` values

---

## Step 3: Environment Variables (1 minute)

```bash
# Copy example environment file
cp .env.example .env

# Open .env and paste your Firebase config
nano .env
```

Paste your Firebase values:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

Save and close (Ctrl+X, Y, Enter)

---

## Step 4: Run! (30 seconds)

```bash
pnpm run dev
```

Open http://localhost:5173 in your browser! 🎉

---

## Step 5: First Login

1. Click "Sign in with Google"
2. Choose your Google account
3. You'll be redirected to the dashboard

---

## Step 6: Make Yourself Admin

### Option A: Automatic (First User)
The first user to sign in is automatically set as admin! ✨

### Option B: Manual
If not automatically set:

1. Go to https://console.firebase.google.com/
2. Open your project
3. Go to "Firestore Database"
4. Find the `users` collection
5. Click on your user document
6. Edit the document:
   ```javascript
   role: "admin"
   status: "active"
   ```
7. Refresh your dashboard

---

## 🎯 You're Done!

Your dashboard is now running with:
- ✅ Google Authentication
- ✅ Admin access
- ✅ All features enabled
- ✅ Tutorial system active

---

## 🎓 Next Steps

### Explore the Features
1. **Dashboard**: View real-time statistics
2. **Videos**: Add a test video record
3. **Profiles**: Create a test creator profile
4. **Payments**: Record a test payment
5. **Tutorial**: Click "💡 Tutorial" button on any page

### Add Team Members
1. Have them sign in with Google
2. Go to **Admin** page
3. Find their user
4. Set their **Role**: User, Finance, or Admin
5. Set **Status**: Active

### Configure Brand
1. In the header, you'll see "All Brands" dropdown
2. Brands are automatically created when you add profiles
3. Use brand filter to isolate data views

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/operation-not-allowed)"
**Solution**: Enable Google Auth in Firebase Console → Authentication → Sign-in method

### "Permission denied" errors
**Solution**: Update Firestore Security Rules (see README.md)

### Dev server won't start
**Solution**: 
```bash
rm -rf node_modules
pnpm install
```

### Can't sign in
**Solution**: 
- Clear browser cache
- Check Firebase console for errors
- Verify environment variables in `.env`

---

## 📚 Learn More

- **Full Documentation**: See README.md
- **Deployment Guide**: See DEPLOYMENT.md
- **Production Checklist**: See PRODUCTION-READY.md
- **Firebase Security**: See README.md → Firebase Security Rules

---

## 🆘 Need Help?

1. Check the console (F12) for error messages
2. Review Firebase Console → Firestore → Usage tab
3. See README.md troubleshooting section
4. Contact the development team

---

## 🎉 Success!

You're now ready to manage TikTok video partnerships like a pro! 

**Pro Tips**:
- Use the Tutorial button on each page to learn all features
- The Dashboard updates in real-time as you add data
- All file uploads (contracts, invoices) are stored securely in Firebase Storage
- Use brand filter to manage multiple brands efficiently
- Finance page is perfect for accounting team access

**Happy Managing! 🚀**
