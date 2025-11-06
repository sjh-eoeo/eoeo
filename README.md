# TikTok Video Management Dashboard

A comprehensive web application for managing TikTok creator partnerships, video tracking, payments, and shipping logistics. Built with React, TypeScript, and Firebase.

## 🎯 Features

### Core Functionality
- **Multi-Brand Support**: Manage multiple brands with isolated data views
- **Creator Profile Management**: Track TikTok creators with contract details, payment information, and bank details
- **Video Upload Tracking**: Record and monitor video uploads with GMV Boost campaign management
- **Payment Processing**: Track payments, upload invoices, and monitor payment status
- **Shipping Management**: Track product shipments with carrier information and delivery confirmation
- **Finance Dashboard**: Dedicated page for finance team with CSV export capabilities

### User Management
- **Role-Based Access Control**: Admin, Finance, and User roles with different permission levels
- **Google Authentication**: Secure login with Firebase Authentication
- **User Status Management**: Admins can activate/deactivate users and assign roles

### UI/UX Features
- **Interactive Tutorial System**: Step-by-step guided tours for each page
- **Real-time Dashboard**: Live statistics and performance metrics
- **Advanced Data Tables**: Sorting, filtering, searching, and pagination
- **Dark Mode Interface**: Modern dark theme with cyan accents
- **Responsive Design**: Mobile-friendly interface

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (recommended) or npm
- **Firebase Project**: Active Firebase project with Firestore and Authentication enabled

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tiktok-video-management-dashboard
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see [Firebase Security Rules](#firebase-security-rules) below)
5. Enable Firebase Storage:
   - Go to Storage
   - Get started with default rules

#### Get Firebase Configuration
1. Go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click on Web app icon or create new web app
4. Copy the firebaseConfig values

### 4. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is active
    function isActive() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }
    
    // Users collection - admins can write, authenticated users can read their own
    match /users/{userId} {
      allow read: if isAuthenticated() && isActive();
      allow write: if isAdmin();
    }
    
    // Videos collection - authenticated active users can read/write
    match /videos/{videoId} {
      allow read: if isAuthenticated() && isActive();
      allow write: if isAuthenticated() && isActive();
      allow delete: if isAdmin();
    }
    
    // Profiles collection - authenticated active users can read/write
    match /profiles/{profileId} {
      allow read: if isAuthenticated() && isActive();
      allow write: if isAuthenticated() && isActive();
      allow delete: if isAdmin();
    }
    
    // Payments collection - authenticated active users can read/write
    match /payments/{paymentId} {
      allow read: if isAuthenticated() && isActive();
      allow write: if isAuthenticated() && isActive();
      allow delete: if isAdmin();
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /contracts/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /invoices/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Run Development Server

```bash
pnpm run dev
# or
npm run dev
```

The app will be available at `http://localhost:5173`

### 7. Initial Admin Setup

**First user to sign in will be automatically set as admin.** Subsequent users will need role assignment from an admin.

To manually set a user as admin:
1. Sign in with Google
2. Go to Firebase Console > Firestore Database
3. Find the `users` collection
4. Locate your user document
5. Update the fields:
   ```javascript
   role: "admin"
   status: "active"
   ```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── features/        # Feature-specific components
│   │   ├── payments/    # Payment forms
│   │   ├── profiles/    # Profile forms
│   │   └── videos/      # Video forms
│   ├── layout/          # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   └── MainNav.tsx
│   └── ui/              # Reusable UI components
│       ├── Button.tsx
│       ├── DataTable.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── SearchBar.tsx
│       ├── Select.tsx
│       └── Tutorial.tsx
├── config/              # Configuration files
├── hooks/               # Custom React hooks
│   ├── useFirestore.ts
│   ├── useStorage.ts
│   └── useTableState.ts
├── lib/
│   ├── firebase/        # Firebase configuration
│   └── utils/           # Utility functions
├── pages/               # Page components
│   ├── AdminPage.tsx
│   ├── DashboardPage.tsx
│   ├── FinancePage.tsx
│   ├── PaymentsPage.tsx
│   ├── ProfilesPage.tsx
│   ├── SettingsPage.tsx
│   └── VideosPage.tsx
├── store/               # Zustand state management
│   ├── useAuthStore.ts
│   ├── useBrandStore.ts
│   ├── usePaymentStore.ts
│   ├── useProfileStore.ts
│   └── useVideoStore.ts
└── types/               # TypeScript types
```

## 📦 Build for Production

```bash
pnpm run build
# or
npm run build
```

The build output will be in the `dist` directory.

## 🚀 Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

Select options:
- Use existing project
- Public directory: `dist`
- Configure as single-page app: Yes
- Set up automatic builds: No

4. Deploy:
```bash
pnpm run build && firebase deploy
```

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

Follow the prompts and set environment variables in Vercel dashboard.

### Deploy to Netlify

1. Build the project:
```bash
pnpm run build
```

2. Deploy via Netlify CLI or drag-and-drop `dist` folder to Netlify dashboard

3. Set environment variables in Netlify dashboard (Site settings > Environment variables)

## 🎓 Using the Application

### Dashboard
- View real-time statistics
- Monitor top performing creators
- Track recent video uploads
- View payment summary

### Videos Page
- Add new video records
- Track TikTok video uploads
- Enable GMV Boost campaigns
- Search and filter videos

### Profiles Page
- Manage creator profiles
- Upload contracts (PDF)
- Track shipping status
- Manage payment information

### Payments Page
- Record payments
- Upload invoices (PDF)
- Track payment status
- View payment history

### Finance Page (Admin/Finance roles only)
- View consolidated payment records
- Export data to CSV
- Filter by date range
- Access all invoice files

### Admin Page (Admin only)
- Manage user roles
- Activate/deactivate users
- View system statistics
- Delete all data (danger zone)

### Tutorial System
- Click "💡 Tutorial" button (bottom-right) on any page
- Follow step-by-step guided tour
- Reset tutorials in Settings page

## 🛡️ Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` by default
2. **Use Firebase Security Rules** - Restrict data access appropriately
3. **Enable Firebase App Check** - Protect against abuse
4. **Regular Backups** - Export Firestore data regularly
5. **Monitor Firebase Usage** - Set up billing alerts

## 🔧 Troubleshooting

### Build Errors
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear build cache: `rm -rf dist .vite`

### Firebase Connection Issues
- Verify environment variables are set correctly
- Check Firebase project is active
- Ensure Firestore and Authentication are enabled

### Authentication Issues
- Check Google Auth is enabled in Firebase Console
- Verify authorized domains include your deployment URL
- Clear browser cache and cookies

## 📊 Performance Optimization

### Current Bundle Size
- Main bundle: ~987 KB (264 KB gzipped)

### Optimization Recommendations
1. **Code Splitting**: Implement route-based lazy loading
2. **Tree Shaking**: Already enabled via Vite
3. **Image Optimization**: Use WebP format for images
4. **Caching**: Configure Firebase Hosting caching headers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is proprietary and confidential.

## 🐛 Known Issues

- Large bundle size warning (>500 KB) - Optimize with code splitting
- React Joyride peer dependency warning with React 19 - Functional, no issues

## 📞 Support

For issues or questions, please contact the development team.
