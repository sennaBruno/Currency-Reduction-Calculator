# Architecture Implementation Plan

**Goal:** Implement the Layered Architecture defined in `memory-bank/@architecture.md` across the project, starting with the exchange rate feature.

**Reference:** `memory-bank/@architecture.md`

**Directory Structure Decision:**

*   [ ] Decide on final naming:
    *   Application Layer: `src/application` or `src/services`? (Let's tentatively use `src/application`)
    *   Infrastructure Layer: `src/infrastructure` or `src/lib`? (Let's tentatively use `src/infrastructure`)
*   [ ] Update `memory-bank/@architecture.md` with final naming decision.

---

## Phase 1: Setup & Refactor Exchange Rate Feature

**1. Create Core Directories:**

*   [x] Create `src/domain`
*   [x] Create `src/application` (or chosen name)
*   [x] Create `src/infrastructure` (or chosen name)

**2. Configuration Setup (`.env`):**

*   [ ] Define `EXCHANGE_RATE_API_URL="https://open.er-api.com/v6/latest/USD"` in `.env` and `.env.example`.
*   [ ] Define `EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS=3600` in `.env` and `.env.example`.
*   [ ] **Validation:** Ensure these can be accessed via `process.env` in the application.

**3. Domain Layer (`src/domain`):**

*   [x] Create `src/domain/exchange-rate/` directory.
*   [ ] Define interfaces for data fetching:
    *   [x] Create `src/domain/exchange-rate/exchangeRateRepository.interface.ts`.
    *   [x] Define `IExchangeRateRepository` interface with a method like `getUsdToBrlRate(): Promise<number>`.
*   [ ] (Optional) Define domain entities/value objects if needed later (e.g., `CurrencyRate`). For now, the interface might suffice.

**4. Infrastructure Layer (`src/infrastructure`):**

*   [x] Install `ky`: `npm install ky` or `yarn add ky`.
    *   [x] **Validation:** Verify `ky` is added to `package.json`.
*   [x] Create `src/infrastructure/exchange-rate/` directory.
*   [x] Implement external API client:
    *   [x] Create `src/infrastructure/exchange-rate/externalExchangeRateClient.ts`.
    *   [x] Implement a class/function using `ky` to fetch data from `process.env.EXCHANGE_RATE_API_URL`. Handle basic fetch errors and validate response structure (check for `rates.BRL`).
*   [x] Implement the repository interface:
    *   [x] Create `src/infrastructure/exchange-rate/exchangeRateRepository.ts`.
    *   [x] Implement `ExchangeRateRepository` class which implements `IExchangeRateRepository` from the domain layer.
    *   [x] This implementation will use the `ExternalExchangeRateClient` to fetch data.
    *   [x] Integrate `next/cache` (`unstable_cache`) *here* within the repository method implementation to cache the result of fetching the rate, using `process.env.EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS`. Use appropriate cache keys (e.g., `['usd-brl-rate']`) and tags (e.g., `['exchange-rate']`).
    *   [x] **Validation:** Add logging to confirm caching behavior (cache hit/miss).

**5. Application Layer (`src/application`):**

*   [x] Create `src/application/exchange-rate/` directory.
*   [x] Create `src/application/exchange-rate/exchangeRateService.ts`.
*   [x] Implement `ExchangeRateService` class/functions.
    *   [x] Inject (or instantiate) an instance of `IExchangeRateRepository` (using the Infrastructure implementation).
    *   [x] Create a method like `fetchUsdBrlRate()` that simply calls the repository's `getUsdToBrlRate()` method.
    *   [x] Add application-level error handling/logging if necessary (e.g., translating repository errors).
*   [x] **Dependency Injection (Consideration):** How will the `ExchangeRateRepository` be provided to the `ExchangeRateService`? (e.g., simple instantiation for now, or a more complex DI container later). Decide and document. (Let's start with simple instantiation).

**6. Presentation Layer (`src/app`):**

*   [x] Locate the existing API route: `src/app/api/exchange-rate/route.ts`.
*   [x] Refactor the `GET` handler:
    *   [x] Remove all direct fetch, caching, and detailed error handling logic.
    *   [x] Instantiate `ExchangeRateService`.
    *   [x] Call the service method (e.g., `fetchUsdBrlRate()`).
    *   [x] Implement a try-catch block.
    *   [x] On success, return the rate using `NextResponse.json`.
    *   [x] On error, log the detailed error server-side and return a generic error response using `NextResponse.json` with status 500.
    *   [x] Add appropriate HTTP Caching Headers to the `NextResponse` (e.g., `Cache-Control: public, s-maxage=3600, stale-while-revalidate=60`). Decide on the exact header strategy.
*   [ ] **Validation:** Test the `/api/exchange-rate` endpoint. Verify it returns the correct rate, caching works (check logs/timing), and appropriate client-facing errors are returned on failure. Check response headers for `Cache-Control`.

**7. Cleanup:**

*   [x] Remove any old service files if they are fully replaced (e.g., if there was a `src/services/exchangeRateService.ts` previously).

**8. Testing Structure (Initial):**

*   [x] Create basic placeholder test files for each layer:
    *   [x] `src/domain/exchange-rate/exchangeRateRepository.interface.test.ts` (if applicable)
    *   [x] `src/infrastructure/exchange-rate/exchangeRateRepository.test.ts`
    *   [x] `src/application/exchange-rate/exchangeRateService.test.ts`
    *   [x] `src/app/api/exchange-rate/route.test.ts` (integration/e2e style)
*   [x] **Note:** This step is just setting up the structure; detailed test implementation will follow.

---

## Phase 2: Apply Pattern to Other Features

*   [ ] Identify next feature/domain to refactor or implement.
*   [ ] Follow steps 3-8 for the new feature, reusing infrastructure components where applicable.
*   [ ] Define necessary Domain interfaces/entities.
*   [ ] Implement Application service/use cases.
*   [ ] Implement Infrastructure (repositories, clients).
*   [ ] Connect Presentation layer.

---

## Phase 3: Cross-Cutting Concerns

*   [ ] **Error Handling:** Formalize error types/classes and handling strategy across layers. Update implementation.
*   [ ] **Logging:** Implement a consistent logging strategy/library.
*   [ ] **DTOs:** Define and implement DTOs for data transfer between layers if needed.
*   [ ] **Dependency Injection:** Implement a proper DI container if simple instantiation becomes cumbersome.
*   [ ] **Database & Prisma:** Integrate Prisma client within the Infrastructure layer repositories when database interaction is needed. 