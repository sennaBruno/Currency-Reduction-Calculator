# Implementation Plan: Refactor Exchange Rate API Route

**Goal:** Refactor the existing `/api/exchange-rate` API route to improve separation of concerns, error handling, configuration, and testability by introducing a dedicated service layer.

**Technology Stack:**

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Runtime:** Node.js
*   **Caching:** `next/cache` (`unstable_cache`)
*   **HTTP Client:** `ky`
*   **Configuration:** Environment Variables (.env)

**Prerequisites:**

1.  [ ] **Review Documentation:** Read `memory-bank/@architecture.md` and `memory-bank/@DESIGN_DOCUMENT.md` to understand the project's overall architecture and design principles.
    *   **Validation:** Confirm understanding of the project's conventions for service layers, error handling, and configuration.

**Implementation Steps:**

1.  [ ] **Configuration Setup:**
    *   **Instruction:** Define and document environment variables for the external exchange rate API URL (`EXCHANGE_RATE_API_URL`) and the cache revalidation period in seconds (`EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS`). Update `.env.example` and relevant configuration files.
    *   **Validation:** Verify that the application can access these environment variables during runtime (e.g., via `process.env`). Check that default values are sensible if variables are not set.

2.  [ ] **Create Exchange Rate Service:**
    *   **Instruction:** Create a new file `src/services/exchangeRateService.ts`. Implement a function (e.g., `getUsdBrlRate`) within this file that encapsulates the logic for fetching the USD to BRL exchange rate from the configured external API URL.
    *   **Validation:** Manually test the function or write a unit test stub to confirm it attempts to fetch data from the correct URL provided by the environment variable.

3.  [ ] **Implement Caching in Service:**
    *   **Instruction:** Integrate `unstable_cache` (or the project's standard caching mechanism) within the `getUsdBrlRate` function in `src/services/exchangeRateService.ts`. Use the configured revalidation period from the environment variable. Define appropriate cache keys and tags.
    *   **Validation:** Add logging within the service function to indicate whether a cached or fresh value is being returned. Trigger the function multiple times within and outside the revalidation period to verify caching behavior.

4.  [ ] **Implement Robust Fetching and Error Handling in Service:**
    *   **Instruction:** Enhance the fetching logic within `getUsdBrlRate` to handle potential network errors (e.g., using try-catch) and non-ok HTTP responses from the external API. Validate the structure of the received JSON data, specifically checking for `rates` and `rates.BRL`. Throw specific, informative errors for different failure scenarios (e.g., `NetworkError`, `InvalidResponseError`).
    *   **Validation:** Write unit tests for the `getUsdBrlRate` function that mock different fetch outcomes: successful response, network error, API returning non-200 status, API returning invalid JSON, API returning JSON without the expected `rates.BRL` field. Verify that the correct errors are thrown or the correct rate is returned.

5.  [ ] **Refactor API Route Handler:**
    *   **Instruction:** Modify `src/app/api/exchange-rate/route.ts`. Remove the direct fetching and caching logic. Import and call the `getUsdBrlRate` function from the new service.
    *   **Validation:** Make a request to the `/api/exchange-rate` endpoint. Verify that it successfully returns the exchange rate by calling the service. Check server logs to confirm the service function was executed.

6.  [ ] **Implement Error Handling in API Route:**
    *   **Instruction:** Add a try-catch block around the call to `getUsdBrlRate` in the API route handler (`src/app/api/exchange-rate/route.ts`). Catch errors thrown by the service and map them to appropriate HTTP responses (e.g., 500 Internal Server Error, 503 Service Unavailable). Ensure sensitive error details are logged server-side but not exposed to the client.
    *   **Validation:** Modify unit tests or manually trigger error conditions in the service (e.g., by temporarily providing an invalid API URL via env var). Make requests to the `/api/exchange-rate` endpoint and verify that the correct HTTP status code and a generic error message are returned to the client, while detailed errors are logged server-side.

7.  [ ] **Final Code Review and Testing:**
    *   **Instruction:** Review all changed files (`src/services/exchangeRateService.ts`, `src/app/api/exchange-rate/route.ts`, environment configuration) for adherence to project standards, clarity, and correctness. Run any existing integration or end-to-end tests.
    *   **Validation:** Confirm all tests pass and the endpoint functions correctly under normal and error conditions. Ensure logging provides adequate information for debugging.

8.  [ ] **Update Documentation (If Applicable):**
    *   **Instruction:** If this refactoring introduces significant changes relevant to the overall architecture, update `memory-bank/@architecture.md`.
    *   **Validation:** Review the updated documentation for accuracy and completeness. 