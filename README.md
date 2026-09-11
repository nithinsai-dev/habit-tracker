# HabitFlow 🔥 — Full-Stack Habit Tracker

A modern, gamified habit tracking application built with the **MERN** stack (MongoDB, Express, React, Node.js). Track your daily habits, build unbreakable streaks, and visualize your consistency with interactive **GitHub-style contribution heatmaps**.

---

## 🌟 Key Features

- ⚡ **1-Click Instant Check-In & Undo**: Complete habits directly from the dashboard card with confetti celebration animations and full undo support.
- 🛡️ **Hardened Authentication**: Strict email validation, password security checks, safe credentials handling (zero plaintext logging), and protected routes.
- 🧮 **Robust Streak Engine**: Calendar-day date math (`YYYY-MM-DD`) that never breaks across timezones or Daylight Saving Time (DST). Computes active streaks and tracks all-time personal records (`bestStreak`).
- 📊 **Dynamic Dashboard Analytics**: Real-time progress bar, daily completion percentages, active streak highlights, and lifetime check-in metrics.
- 🎨 **Category & Color Personalization**: Categorize habits (Career, Health, Fitness, Finance, Learning, General) and assign custom theme colors to customize your heatmaps.
- 🔍 **Search & Category Filters**: Instant debounce search and quick filter pills to organize your habit dashboard.
- 🔔 **Toast Notification System**: Modern, non-intrusive toast notifications for check-ins, edits, and errors (no native browser alerts).
- 🌓 **Dark & Light Mode**: Fluid, persistent theme toggle with customized obsidian and light surface tokens.
- 🗓️ **Interactive GitHub-Style Heatmap**: 52-week contribution grid with hover tooltips, date inspection, and personal reflection note logs.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with centralized base URL configuration and 401 interceptors
- **Styling**: Modern CSS Custom Properties Design System + Tailwind CSS v4
- **Micro-Interactions**: Canvas-Confetti

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + BcryptJS password hashing
- **Security**: CORS, sanitized inputs, and structured error handling

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or newer recommended)
- **MongoDB** (Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI)

---

### Backend Setup

1. Open a terminal and navigate to `Back-end`:
   ```bash
   cd Back-end
   npm install
   ```

2. Verify or create your `.env` file in `Back-end/`:
   ```env
   MONGO_URL=mongodb://localhost:27017/habittracker
   JWT_SECRET=your_super_secret_jwt_key
   PORT=3000
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:3000`.*

---

### Frontend Setup

1. Open a second terminal and navigate to `Front-end/react-app`:
   ```bash
   cd Front-end/react-app
   npm install
   ```

2. (Optional) Create a `.env` file in `Front-end/react-app/`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The application will open on `http://localhost:5173`.*

---

### Convenient Root Scripts

From the repository root, you can also run:
```bash
npm run dev:backend       # Starts backend with nodemon
npm run dev:frontend      # Starts frontend Vite dev server
npm run build:frontend    # Creates production bundle
```

---

## 📜 License

This project is licensed under the MIT License.
