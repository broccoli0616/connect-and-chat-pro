# CommPractice

CommPractice is a scenario-based communication practice web app built with React, TypeScript, and Vite. It helps learners practice everyday conversations in a safe, low-pressure environment through interactive role-play.

## Live Demo

[CommPractice on Vercel](https://connect-and-chat-pro.vercel.app/)

## Features

- Guided conversation practice with scenario flows
- Airport check-in practice in voice mode
- Airport check-in practice in AAC mode
- Onboarding and role-based flow (learner and therapist)
- Multiplayer lobby flow
- AI-assisted checkpoint analysis with local fallback when no API key is configured

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI
- Framer Motion
- TanStack Query
- Vitest and Testing Library

## Project Structure

```text
src/
  components/   Reusable feature and UI components
  data/         Scenario and airport check-in data
  hooks/        Custom React hooks
  lib/          AI agent and utility logic
  pages/        Page-level flows
  test/         Test setup and test files
public/
  aac-custom/   AAC custom assets
  aac-source/   AAC source assets
  aac-supplement/ AAC supplementary assets
```

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

1. Clone the repository.

```bash
git clone git@github.com:broccoli0616/connect-and-chat-pro.git
cd connect-and-chat-pro
```

1. Install dependencies.

```bash
npm install
```

1. Create your local environment file.

```bash
cp .env.example .env
```

1. Set your API key in `.env` if you want AI evaluation.

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

1. Start the development server.

```bash
npm run dev
```

1. Open the local URL shown in terminal (usually [http://localhost:5173](http://localhost:5173)).

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run build:dev`: Build with development mode
- `npm run preview`: Preview production build locally
- `npm run lint`: Run ESLint
- `npm test`: Run tests once with Vitest
- `npm run test:watch`: Run tests in watch mode

## Testing

Run tests:

```bash
npm test
```

Test files and setup are in `src/test`.

## Deployment

Production deployment is hosted on Vercel:

[Vercel Deployment](https://connect-and-chat-pro.vercel.app/)

## Roadmap

- Expand scenario coverage for more daily communication situations
- Improve coaching quality and feedback detail
- Enhance multiplayer interactions
- Explore immersive communication practice experiences

## Project Poster

![CommPractice Project Poster](./src/assets/commpractice_poster%20%281%29.png)
## Team

- Li Xuanming
- Lin Muxi
- Yang Boxiang
- Yu Letian
- Zhang Jiayi
