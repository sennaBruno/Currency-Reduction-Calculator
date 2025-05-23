# Exchange Rate Calculator Job

This project is a Next.js application that provides currency exchange rate information via API endpoints.

## Project Overview

The application fetches exchange rate data, caches it, and serves it through a set of APIs. It includes features like API client throttling, configurable cache TTL, and calculation history persistence.

## Getting Started

### Prerequisites

- Node.js (version recommended by Next.js)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <https://github.com/sennaBruno/Currency-Reduction-Calculator>
    cd calculator-job
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Set up the database:
    ```bash
    npx prisma generate
    ```

### Running the Development Server

To run the app in development mode (with Turbopack):

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000` (or the next available port if 3000 is busy).

## API Endpoints

The application exposes the following API endpoints:

-   `GET /api/exchange-rate`: Fetches the latest exchange rate 
-   `GET /api/exchange-rates?from=EUR&to=BRL`: Fetches the exchange rate between specified `from` and `to` currencies.
-   `GET /api/exchange-rate-metadata`: Provides metadata related to the exchange rates 
-   `GET /api/calculations`: Retrieves all saved calculation history
-   `GET /api/calculations?id=[id]`: Retrieves a specific calculation by ID
-   `DELETE /api/calculations?id=[id]`: Deletes a calculation by ID

## Technology Stack

-   **Framework:** Next.js 15
-   **Language:** TypeScript
-   **UI:** React, Radix UI, Tailwind CSS, Lucide Icons (Shadcn/UI)
-   **Forms:** React Hook Form + Zod
-   **HTTP Client:** ky
-   **Testing:** Jest + React Testing Library
-   **Database:** PostgreSQL via Supabase
-   **ORM:** Prisma
-   **Utilities:** clsx, tailwind-merge, class-variance-authority, next-themes

## Database Integration

The application uses **Supabase** and **Prisma** for data persistence:

1. **Setup**: Requires a Supabase account and project with PostgreSQL database.
2. **Schema**: Defined in `prisma/schema.prisma`, includes models for Calculation and CalculationStep.
3. **Connection**: Uses connection pooling for efficient database access.
4. **Environment Variables**: Requires `DATABASE_URL` and `DIRECT_URL` to be configured in `.env.local`.

### Supabase Connection Recommendations

- Use transaction mode pooler (`port 6543`) for serverless environments
- Use URL-encoded credentials in your connection strings
- Add connection timeout parameters to avoid connection issues
- Set proper configuration for your application's usage pattern

Example connection string:
```
DATABASE_URL="postgresql://[username]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=60&pool_timeout=60"
```

## State Management

This application uses **Redux Toolkit** for managing global application state. Key concepts include:

-   **Store**: The single source of truth for the application state.
-   **Slices**: Define reducers and actions for specific parts of the state (e.g., currency, calculator).
-   **Reducers**: Handle state transitions based on dispatched actions.
-   **Actions**: Plain objects describing state changes.
-   **Async Thunks**: Handle asynchronous logic like API calls and dispatch actions based on the results.

The state management logic is primarily located in the `src/store/` directory.

## Architecture

The application follows a **Layered Architecture**, drawing inspiration from Clean Architecture principles:

1.  **Domain Layer (`src/domain/`)**: Defines core business concepts, entities, types, and interfaces (e.g., `ICurrency`, `IExchangeRateRepository`). It is independent of frameworks and infrastructure details.
2.  **Application Layer (`src/application/`)**: Contains application-specific logic and use case orchestrators (services like `ExchangeRateService`, `CurrencyConverterService`). It depends on the Domain layer.
3.  **Infrastructure Layer (`src/infrastructure/`)**: Provides concrete implementations for external concerns like API clients (`ExchangeRateApiClient`), data repositories (`ExchangeRateRepository`), caching, and throttling. It implements interfaces defined in the Domain layer.
4.  **Presentation Layer (`src/app/`, `src/components/`)**: Handles UI rendering (React components), user interactions, and routing (Next.js App Router). It interacts with the Application layer (or dedicated client-side services).
5.  **Data Persistence Layer (`src/lib/`)**: Contains database client (Prisma) and data access functions for persisting and retrieving calculations.

The dependencies flow inwards: Presentation -> Application -> Domain <- Infrastructure.

## Date Handling

The application uses **date-fns** for consistent, reliable date and time handling:

1.  **Centralized Utilities**: All date operations are encapsulated in utility functions in `src/utils/dateUtils.ts` for consistency and maintainability.
2.  **UTC Standard**: All internal date operations use UTC for consistency. Dates are:
    - Stored as `Date` objects (UTC-based)
    - Parsed from Unix timestamps using `fromUnixTimestamp` 
    - Created via `nowUTC()`
    - Manipulated with functions like `addSecondsToDate`
3.  **Data Exchange**: 
    - ISO 8601 format is used for all API responses via `formatDateISO`
    - UTC strings from external APIs are carefully parsed using `parseUTCString`
4.  **UI Formatting**:
    - Dates are formatted for user display with locale-aware formatting
    - Both absolute (`formatDate`) and relative (`formatRelativeTime`) times are shown for better UX
    - Time zone conversion is handled implicitly through formatting

This approach ensures accurate timestamps throughout the application, reliable serialization, and appropriate user-facing date displays.

## Configuration

Environment variables can be configured in `.env.local` (refer to `.env.example` for required variables and examples). Key configurations include:

-   **Exchange Rate API Provider (`EXCHANGE_RATE_API_PROVIDER`)**: Specifies the API client implementation. Defaults to `'default'` if not set (observed in logs).
-   **Exchange Rate API Details (`EXCHANGE_RATE_API_KEY`, `EXCHANGE_RATE_API_BASE_URL`)**: Credentials and endpoint for the chosen provider.
-   **Cache TTL (`EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS`)**: Cache duration in seconds for exchange rates (e.g., `3600` for 1 hour).
-   **API Throttling (`API_REQUESTS_PER_SECOND`, `API_THROTTLE_INTERVAL_MS`)**: Limits requests to the external API (e.g., defaults to `2` requests per `1000` ms observed in logs).
-   **Database Connection (`DATABASE_URL`, `DIRECT_URL`)**: Connection strings for Supabase PostgreSQL database.

*Note: Running `npm run dev` may show console logs indicating the specific runtime values being used for configuration like cache TTL and throttling.*