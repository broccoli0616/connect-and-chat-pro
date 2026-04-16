# CommPractice

CommPractice is a scenario-based communication practice web app built with React, TypeScript, and Vite. It helps learners practice everyday conversations in a safe, low-pressure environment through interactive role-play.

## Live Demo

[CommPractice on Vercel](https://connect-and-chat-pro.vercel.app/)

## Features

- Guided scenario practice with structured checkpoints
- Airport check-in flow in voice mode
- Airport check-in flow in AAC mode
- Role-based onboarding for learners, caregivers, and therapists
- Live multiplayer matchmaking and room flow
- Optional AI-assisted feedback with a local fallback when no Groq key is configured

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI
- Framer Motion
- TanStack Query
- Firebase Auth and Firestore
- Vitest and Testing Library

## Project Structure

```text
api/            Serverless endpoints
public/         AAC and static assets
src/components/ Reusable UI and feature components
src/data/       Scenario data
src/hooks/      Custom hooks
src/lib/        Shared client logic and storage helpers
src/pages/      Main app screens and flows
src/test/       Test setup and test files
```

## Prerequisites

- Node.js 18+
- npm 9+
- A Firebase project for auth and Firestore

## Getting Started

1. Clone the repository and enter the project directory.
2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file:

```bash
cp .env.example .env
```

4. Fill in your own environment values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_GROQ_API_KEY=...
```

5. Start the development server:

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:8080` in this repo.

## TURN / Multiplayer Notes

- Multiplayer signaling uses Firebase.
- TURN credentials are fetched from [`api/turn-credentials.ts`](./api/turn-credentials.ts).
- To enable TURN on a deployed serverless runtime, set `METERED_API_KEY` and `METERED_DOMAIN`.
- If the TURN endpoint is unavailable, the app falls back to public STUN servers.

## How To Use The App

1. Open the app and log in or create a profile.
2. Choose a role during registration: learner, caregiver, or therapist.
3. Learners and caregivers land on the mode selection screen.
4. Choose `Solo Practice` to run a guided scenario, then pick voice or AAC mode.
5. Choose `Multiplayer` to enter matchmaking and join a live practice room.
6. Therapists are routed to the therapist dashboard after sign-in.

## Available Scripts

- `npm run dev` starts the local dev server
- `npm run build` creates a production build
- `npm run build:dev` creates a development-mode build
- `npm run preview` previews the production build locally
- `npm run lint` runs ESLint
- `npm test` runs the Vitest suite once
- `npm run test:watch` runs Vitest in watch mode

## Testing

Run tests:

```bash
npm test
```

Test files and setup are in `src/test`.

## Deployment

Production deployment is hosted on Vercel:

[Vercel Deployment](https://connect-and-chat-pro.vercel.app/)

## Publishing Checklist

- Keep `.env`, `.vercel/`, `.cert/`, and key/cert files out of Git.
- Use your own Firebase and Metered values in local or deployment env vars.
- Review any screenshots, posters, or docs before publishing if they contain team or project-specific details.

## Team

- Li Xuanming
- Lin Muxi
- Yang Boxiang
- Yu Letian
- Zhang Jiayi
