
<p align="center">
  <img src="https://raw.githubusercontent.com/ahmed-404/Gisqo-Content-Tracker/main/app-profile-pic.png" alt="GisqoTracker Logo" width="150">
</p>

<h1 align="center">GisqoTracker - Content Management System</h1>

<p align="center">
A comprehensive, real-time dashboard for content creation teams to track productivity, manage tasks, and monitor performance. Built with React, TypeScript, and Firebase.
</p>

---

## ✨ Features

The application is divided into two main sections based on user roles: a dashboard for **Content Creators** and a powerful **Admin Hub** for managers.

### 👑 Admin Hub
- **Real-time Analytics:** Monitor team productivity with daily, weekly, and monthly performance charts.
- **People Management:** Add, edit, archive, and manage user accounts (Creators and other Admins).
- **Client Portfolio Management:** Register and manage the list of active or archived clients.
- **Content Bank:** A master audit log to view, search, and filter all content submitted by the team.
- **Scheduling:** Manage team-wide holidays and schedule upcoming video/photo shoots.
- **System Configuration:** Customize application settings like the app name, theme, daily goals, and team announcements.

### ✍️ Creator Dashboard

- **Content Logging:** Easily log new content entries (Videos, Flyers, Animations, etc.) through an intuitive modal.
- **Personalized Calendar:** A dynamic calendar that visualizes personal content submissions, upcoming shoots, and holidays for the month.
- **Performance Tracking:** Track personal daily and monthly goal progress.
- **Client Health Board:** Monitor the content output for each active client against monthly targets.
- **Team Insights:** View a breakdown of team-wide performance and top contributors.
- **Announcements:** Receive important team-wide notices from the administrator.

## 🛠️ Tech Stack

- **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** React Hooks & Context API
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore for database)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Deployment:** Firebase Hosting

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v14 or later)
- npm

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd your-repo-name
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```

### Firebase Configuration

1.  Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2.  In your project settings, add a new web app.
3.  Copy the `firebaseConfig` object provided.
4.  Create a file named `firebase.ts` in the `src` directory and paste your configuration:

    ```typescript
    // src/firebase.ts
    import { initializeApp } from "firebase/app";
    import { getFirestore } from "firebase/firestore";

    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    export const db = getFirestore(app);
    ```

### Running the Application

- **Start the development server:**
  ```sh
  npm run dev
  ```
- Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 🗂️ Project Structure

```
/src
|-- /components     # React components (AdminHub, CreatorDashboard, Sidebar, etc.)
|-- App.tsx         # Main application component with routing and state management
|-- firebase.ts     # Firebase configuration and initialization
|-- index.css       # Global styles and Tailwind CSS imports
|-- index.tsx       # Main entry point for the React application
|-- types.ts        # TypeScript type definitions for the project
```
