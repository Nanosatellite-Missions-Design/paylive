# 🚀 PayLive - Flash Sale Live Streaming Platform

PayLive is a mobile-first live-streaming application that allows content creators to host flash sales and auctions in real time. Buyers can watch live streams, bid on auctions, scan QR codes, and purchase products instantly — all in one seamless app.

---

## 📱 Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React)
- **Mobile Layout:** Mobile-first with bottom tab navigation (PWA-ready)
- **Backend:** [Firebase](https://firebase.google.com/)
  - Authentication
  - Firestore (Database)
  - Cloud Storage (Images)
  - Cloud Functions (Business Logic)
- **Payments:** [Maviance API](https://maviance.com) (for mobile money transactions)

---

## 🧱 Firebase Database Structure (Overview)

users/
└── userId/
├── profile/
├── paymentMethods/
├── products/
├── liveSales/
├── auctions/
├── transactions/
└── participatedAuctions/

---

## ✨ Features

### 👤 User
- Unified customer/creator profile
- Manage payment methods
- Browse personal product catalog
- View auction and transaction history

### 🎥 Live Sale (Creator)
- Start and manage live sale events
- Real-time product switching
- Viewers count, product stats

### 🛒 Product
- Add/edit/delete products
- QR Code generation per product
- Upload product images to Firebase Storage

### 🏆 Auction System
- Host or join auctions
- Bidding system with real-time updates
- Auto-close auctions with Firebase Cloud Functions

### 📦 Transactions
- Secure payment via Maviance
- View all past purchases and auction wins

---

## 🔒 Firebase Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;

      match /{subcollection=**} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }
    }
  }
}
📂 Project Structure

/pages
  ├── index.tsx            # Home
  ├── login.tsx            # Auth (login/signup)
  ├── profile.tsx          # User profile & settings
  ├── live.tsx             # Live streaming UI
  ├── auctions.tsx         # Auctions and bidding
  └── transactions.tsx     # History view

/components/
  ├── Navbar.tsx
  ├── BottomTabs.tsx       # Mobile-only navigation
  └── ProductCard.tsx

/lib/
  ├── firebase.ts          # Firebase init
  └── api.ts               # API functions
⚙️ Setup Instructions
1. Clone the repository

git clone https://github.com/your-username/paylive.git
cd paylive
2. Install dependencies

npm install
# or
yarn install
3. Configure environment variables
Create a .env.local file and add your Firebase and Maviance credentials:

ini
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

MAVIANCE_API_KEY=...
MAVIANCE_BASE_URL=...

4. Run the development server
npm run dev
# or
yarn dev
Visit http://localhost:3000 in your browser.

🚧 Development Notes
Offline data persistence enabled via Firestore SDK

Cloud Functions handle auction closeout and winner detection

Real-time listeners used in live sale and auction pages

Images managed in Firebase Storage

Indexed queries optimized for performance

📱 Mobile UX
Bottom tab navigation on mobile (Home, Live, Auctions, Profile, Settings)

Responsive layout with touch-friendly components

PWA support planned in upcoming versions

📘 License
MIT License — free to use and modify with credit.

👨‍💻 Author
Nanosatellite Missions Design
Nuadje Dilan
Full Stack Developer