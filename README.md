# 📚 MangaView (maybe soon... *Alexandria*)

> *Thinking of renaming this to “Alexandria” — like the ancient library, but with less fire and way more manga.*

**MangaView** is a lightweight, fully web-based manga viewer and manager. It’s built from scratch using vanilla HTML, CSS, and JavaScript on the frontend. The backend with Node.js + Express is currently in development to support user authentication and session management.

---

## 🚀 Project Highlights

- 📖 **Manga browsing and reading UI** optimized for clarity and ease of navigation.
- 🌐 **Consistent 3x3 grid layout** for Home, Browse, and Notes pages.
- 🧭 **Global Header** reused across pages with animated links and floating-label search input.
- 💬 **Welcome message** shown to users, with state saved in `localStorage`.
- 🧠 Modular, maintainable code with vanilla JS/HTML/CSS.

---

## 🌐 Frontend Pages

### 🏠 Home (`index.html`)
- Clean landing page with quick links and introduction.
- Uses the same **3x3 grid layout** as Browse and Notes for consistency.
- Shows a welcome message saved in `localStorage`.

### 📚 Browse (`browse.html`)
- Displays all manga in a **3x3 grid** layout.
- Each card includes:
  - Cover image
  - Manga title
  - Clickable link to reader

### 🕒 Latest (`latest.html`)
- Features a **carousel** that dynamically shows manga sorted from highest to lowest ID.
- Uses JavaScript to detect and order manga by cover file numbers.

### 📝 Notes (planned)
- Also using the **3x3 grid layout** for consistency.
- Intended for user or system notes related to manga or reading progress.

### 🧭 Global Header
- Reusable navigation bar styled with `header.css`.
- Features animated links and a floating-label search input.
- Present on all main pages for consistent navigation.

---

## 🛠 Backend (Node.js + Express) — *In Progress*

### 🔐 User Authentication
- Planned password hashing with `bcrypt`.
- User data storage currently flat JSON; database upgrade planned.

### 💾 Session Management
- Using `express-session` or cookies for session persistence.

---

## 📈 Roadmap

- 🚧 Complete backend development with Node.js + Express for authentication and sessions.
- 🔄 Develop chapter reader API: `/api/manga/:id/chapter/:num`
- 🧠 Migrate from JSON to a proper database (SQLite or MongoDB).
- 🧷 Add user features: favorites, reading history, bookmarks, and resume functionality.
- 📖 Build a dedicated manga reader UI with chapter navigation.
- 📝 Implement Notes page with consistent grid layout.

---

## 💡 Notes

- All frontend components are written in vanilla HTML, CSS, and JavaScript.
- Designed for easy deployment on basic Node.js servers.
- Welcome message uses `localStorage` to remember user visits.

---

Thanks for checking out MangaView —  
and unlike the real Library of Alexandria, **everything is backed up!** 📖
