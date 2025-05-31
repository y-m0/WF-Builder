# Orchestration Nexus UI & Workflow Builder

This application provides a comprehensive interface for designing and managing workflows. It features both a traditional visual workflow editor and an innovative chatbot-driven workflow builder powered by Gemini.

## Setup and Installation

1.  Clone the repository.
2.  Install dependencies. Several new dependencies have been added for routing and testing, so ensure you run:
    ```bash
    npm install
    ```
3.  (For full WF-Builder functionality, the backend service needs to be running. See `npm run dev:backend` script description below).

## Features & Application Overview

The application is structured with the following main user interfaces accessible via routing:

*   **`/` (Main Workflow Editor):**
    *   The primary visual interface for creating, viewing, and modifying complex workflows using a drag-and-drop or node-based system.
    *   This is the original core editor of the Orchestration Nexus UI.

*   **`/workflows/builder` (WF-Builder Interface):**
    *   An integrated module that allows users to design workflows by interacting with an AI chatbot (powered by Gemini).
    *   Describe the workflow you want in natural language, and the WF-Builder will help you construct it.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the main frontend app in development mode.
Open [http://localhost:5173](http://localhost:5173) (or a similar port indicated by Vite) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### `npm run dev:backend`

Runs the backend server (currently for the WF-Builder's chatbot functionality) in watch mode.
This is necessary for the `/workflows/builder` interface to communicate with the Gemini API.
The server typically runs on `http://localhost:3000`.

### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

### `npm run preview`

Serves the production build locally for previewing before deployment.

### `npm test`

Runs the automated tests for the application using Vitest.

### `npm run test:ui`

Runs the automated tests with the Vitest UI, providing an interactive way to view test results.
