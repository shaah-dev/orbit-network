# Orbit-Network

A full-stack social media app: profiles, follow/unfollow, posts with images, likes,
comments, notifications, dark/light theme, and an admin dashboard with full database
access. Backend is Node.js/Express/MongoDB, frontend is React (Vite).

## File structure

```
orbit-network/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── db.js                  # MongoDB connection
│   ├── .env.example           # Copy to .env and fill in
│   ├── package.json
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   └── Notification.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + adminOnly
│   │   └── upload.js          # Multer image upload config
│   ├── routes/
│   │   ├── authRoutes.js      # signup, login
│   │   ├── userRoutes.js      # profile, follow/unfollow, avatar/cover upload
│   │   ├── postRoutes.js      # create/feed/explore/like/comment/delete
│   │   ├── notificationRoutes.js
│   │   ├── chatRoutes.js      # conversations + messages (DMs)
│   │   └── adminRoutes.js     # full DB access for admins
│   └── uploads/                # uploaded images land here
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css           # all design tokens, theme variables, animations
        ├── api.js              # axios instance
        ├── socket.js           # socket.io-client connection helper
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── PostCard.jsx
        │   ├── CommentBox.jsx
        │   ├── FollowButton.jsx
        │   ├── NotificationBell.jsx
        │   └── AuthBrandPanel.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── Feed.jsx
            ├── Profile.jsx
            ├── Chat.jsx
            └── AdminDashboard.jsx
```

No nested file-inside-file mess — two top-level folders, each at most two levels deep.

## Step 1 — Install prerequisites

1. Install [Node.js LTS](https://nodejs.org) (v18+).
2. Install MongoDB locally ([MongoDB Community Server](https://www.mongodb.com/try/download/community)) **or** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and copy its connection string.
3. Open the project folder in VS Code: `File → Open Folder → orbit-network`.
4. Install the **ESLint** and **Prettier** VS Code extensions (optional, for cleaner editing).

## Step 2 — Set up the backend

Open a terminal in VS Code (`Ctrl+`` `) and run:

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/orbit-network   # or your Atlas connection string
JWT_SECRET=replace_with_a_long_random_string
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```
You should see `MongoDB connected` and `Orbit-Network server running on port 5000`.

## Step 3 — Set up the frontend

Open a **second terminal** (keep the backend running):

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** — you'll land on the Login page with the animated
Orbit-Network branding panel.

## Step 4 — Create your first account and become admin

1. Go to `/signup` and create an account normally.
2. To make that account an admin, open MongoDB (via `mongosh`, MongoDB Compass, or
   Atlas's web UI) and run:

```js
use orbit-network
db.users.updateOne({ username: "your_username" }, { $set: { role: "admin" } })
```

3. Refresh the app — a 🛠️ admin icon will appear in the navbar, linking to
   `/admin`, where you have full visibility and control over every user and post
   in the database (promote/demote, activate/deactivate, delete).

## Step 5 — Try the core features

- Create a post with text and/or an image from the Feed page.
- Like and comment on posts.
- Visit another user's profile (`/profile/username`) and click **Follow** —
  their posts then appear in your **Following** tab, and they get a notification.
- Click the 🔔 bell to see likes, comments, and new followers.
- Click the ☀️/🌙 icon at any time (including on the login screen) to switch themes —
  the preference is saved per browser.
- Edit your own profile: name, bio, avatar, and cover photo.

## How it's built (so you can extend it)

- **Auth**: JWT stored in `localStorage`, sent as a Bearer token on every API call
  via the axios interceptor in `src/api.js`.
- **Images**: uploaded with Multer to `backend/uploads/`, served statically at
  `/uploads/...`, and referenced by path in the database.
- **Real-time chat**: Conversation and Message models, REST endpoints to list/start
  conversations and fetch/send messages, plus a Socket.IO layer (`backend/server.js`)
  that authenticates each socket with the same JWT and pushes new messages and
  typing indicators instantly to whichever user(s) are connected. Click "Message"
  on any profile to start a thread, or use the 💬 icon in the navbar to see all
  your conversations.
- **Auth pages**: the left branding panel is a shared `AuthBrandPanel` component
  (`src/components/AuthBrandPanel.jsx`) — a single glossy abstract glyph with a
  slow ambient glow drift and gentle rotation, on a near-black background, rather
  than literal planet/orbit icons. Edit that one file to change the wordmark,
  tagline, or glyph shape on both Login and Signup at once.
- **Admin**: a `role` field on the User model (`user` | `admin`) gated by the
  `adminOnly` middleware. Every admin route operates directly on the same
  Mongoose models as the public routes, so it's full read/write access to the
  real data, not a separate mock dataset.
- **Responsive design**: the navbar is a sticky top bar on mobile and switches
  to a fixed left sidebar above 900px width (see the media queries at the
  bottom of `src/index.css`). The feed column is centered and capped at 640px
  so it reads well on phone, tablet, and desktop alike.

## Next steps you might want

- Add direct messaging (a `Conversation`/`Message` model + a chat UI) to get
  closer to Telegram-style functionality.
- Add image lightboxes, stories, or video posts for an Instagram-style feel.
- Move file storage to Cloudinary or S3 before deploying, since local
  `uploads/` won't persist on most hosting platforms.
- Deploy the backend (Render, Railway, Fly.io) and the frontend (Vercel,
  Netlify), pointing `CLIENT_URL` and the frontend's API base URL at each
  other's production domains.
