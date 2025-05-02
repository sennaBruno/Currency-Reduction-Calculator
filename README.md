# Calculator Job Project

**Live Deployment:** [https://currency-calculator-alpha.vercel.app/](https://currency-calculator-alpha.vercel.app/)

This is a [Next.js](https://nextjs.org) project designed to perform calculations and currency conversions, built with a focus on maintainable and scalable software architecture.

## Overview

The project implements a calculator with features for simple and detailed calculations, along with a currency converter leveraging real-time exchange rates. It is built using Next.js (App Router) and TypeScript, following a Layered Architecture inspired by Clean Architecture principles.

## Technology Stack

*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript
*   **UI Components:** Shadcn/UI
*   **Styling:** Tailwind CSS
*   **HTTP Client:** `ky`
*   **Server-Side Caching:** `next/cache`
*   **Deployment:** Vercel

## Architecture

The application follows a Layered Architecture:

1.  **Presentation Layer (`src/app/`, `src/components/`)**: Handles UI, routing (App Router), and user interaction.
2.  **Application Layer (`src/application/`)**: Orchestrates use cases and acts as an intermediary.
3.  **Domain Layer (`src/domain/`)**: Contains core business logic, entities, and interfaces (independent of frameworks).
4.  **Infrastructure Layer (`src/infrastructure/`)**: Implements data access (e.g., external API clients like `ExchangeRateRepository`) and other technical concerns.
5.  **Client-Side Services (`src/services/`)**: Provides APIs for client components to interact with the backend.

Dependencies flow inwards: Presentation -> Application -> Domain <- Infrastructure.

## Key Features

*   **Exchange Rate Service:** Fetches and caches USD to BRL exchange rates.
*   **Calculator Service:** Supports simple and multi-step calculations with history.
*   **Currency Converter:** Converts USD to BRL using fetched rates.
*   **Client-Side Service Layer:** Abstracts backend communication for the UI.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Second, set up your environment variables. Create a `.env.local` file in the root directory by copying `.env.example` (if it exists) and fill in the required values, such as the API key for the exchange rate service.

```bash
cp .env.example .env.local
# Now edit .env.local with your actual API key
```

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about the technologies used, take a look at the following resources:

*   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
*   [Shadcn/UI Documentation](https://ui.shadcn.com/docs) - learn about the UI components.
*   [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about utility-first CSS.
*   [ky Documentation](https://github.com/sindresorhus/ky) - learn about the HTTP client.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). Ensure your environment variables are configured in your Vercel project settings.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
