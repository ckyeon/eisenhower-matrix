# Eisenhower Matrix Note

A powerful, desktop-class note-taking application designed around the **Eisenhower Matrix** method. Prioritize your tasks effectively by categorizing them into four quadrants based on urgency and importance.

Built with **React**, **Tauri**, **Node.js**, and **SQLite**.

## Features

*   **Eisenhower Matrix Layout**: Visualize your tasks in a 2x2 grid (Do First, Schedule, Delegate, Don't Do).
*   **Drag & Drop**: Intuitive drag-and-drop interface to move notes between quadrants.
*   **Markdown Support**: Rich text editing with Markdown support for your notes.
*   **Desktop App**: Native macOS application powered by Tauri for a seamless experience.
*   **Archive System**: Archive completed or irrelevant notes to keep your board clean.
*   **Secure Authentication**: User registration and login with JWT-based authentication.
*   **Optimistic UI**: Instant feedback on actions for a smooth user experience.

## Getting Started

For detailed instructions on how to set up the project locally or deploy it to a server, please refer to the **[Deployment Guide](DEPLOY.md)**.

### Quick Start (Local Development)

1.  **Backend**:
    ```bash
    cd server
    cp .env.example .env # Set your JWT_SECRET
    npm install
    npm start
    ```

2.  **Frontend (App)**:
    ```bash
    cd app
    npm install
    npm run tauri dev
    ```

## Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Vite
*   **Desktop Framework**: Tauri (Rust)
*   **Backend**: Node.js, Express
*   **Database**: SQLite (better-sqlite3)

## License

This project is licensed under the MIT License.
