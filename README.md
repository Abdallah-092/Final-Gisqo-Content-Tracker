
<div align="center">
  <img width="1200" height="475" alt="GisqoTracker Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GisqoTracker - Content Production System

GisqoTracker is a modern, full-featured content tracking application designed for creative teams. It provides a robust platform for creators and administrators to log, monitor, and analyze content production with features like role-based access, productivity goals, and real-time analytics.

---

## ✨ Key Features

- **Role-Based Dashboards**: Separate, tailored views for **Admins** (overall monitoring) and **Creators** (personal progress).
- **Content Logging**: Easily log new content with details like title, type, client, and a direct link.
- **Daily & Monthly Goals**: Track daily submission goals for creators and monthly post targets for each client.
- **Interactive Calendar**: A dynamic, week-by-week calendar interface to visualize content submissions.
- **Production Health Board**: A high-level overview of each client's monthly content progress against their target.
- **Team Performance Insights**: A detailed analytics panel showing content breakdown by type and a leaderboard of creator productivity.
- **Global Announcements**: Admins can post team-wide notices that appear as a banner on the dashboard, powered by Firebase Firestore.
- **Client Management**: Admins can register and manage clients, which are then used to track associated content.
- **Modern, Responsive UI**: Built with Tailwind CSS for a seamless experience on any device, featuring a sleek dark mode theme.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend/Database**: Firebase (Firestore for the global notice system)
- **Deployment**: Static Hosting (e.g., Bluehost, Vercel, Firebase Hosting)

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- A [Firebase](https://firebase.google.com/) project

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/Abdallah-092/Final-Gisqo-Content-Tracker.git
    cd Final-Gisqo-Content-Tracker
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    - Create a new file named `.env.local` in the root of your project.
    - Go to your Firebase project settings and find your web app configuration.
    - Add your Firebase configuration to the `.env.local` file like this:

    ```env
    VITE_FIREBASE_API_KEY="your_api_key"
    VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
    VITE_FIREBASE_PROJECT_ID="your_project_id"
    VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
    VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
    VITE_FIREBASE_APP_ID="your_app_id"
    ```

4. **Run the development server:**
   ```sh
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or the next available port).

## 📦 Available Scripts

- `npm run dev`: Starts the application in development mode.
- `npm run build`: Bundles the application for production into the `dist` folder.
- `npm run preview`: Serves the production build locally for testing.

## ☁️ Deployment

1.  Run the build command:
    ```sh
    npm run build
    ```
2.  This will create a `dist` directory containing all the static files for your application.
3.  Upload the contents of this `dist` folder to your preferred static hosting provider (like Bluehost, Vercel, Netlify, or Firebase Hosting).
