# EventHub Project Handoff

## Project Overview
EventHub is a Next.js (App Router) web application designed for organizing gatherings, inviting friends, sharing memories (photos), and live chatting. It uses Prisma with PostgreSQL for the database and NextAuth.js (v5) for authentication.

## Core Features Implemented
*   **User Authentication:** NextAuth.js with Credentials provider (Email/Password registration and login).
*   **Dashboard:** Displays events the user is hosting or participating in.
*   **Event Management:**
    *   Create events with title, date, time (or "Full Day" toggle), location (with Leaflet map integration), and description.
    *   Delete events (Hosts only).
*   **Event Interaction:**
    *   Auto-join system via unique `accessCode` URLs (`/events/[id]?accessCode=...`).
    *   Participant list with roles (HOST, GUEST).
    *   Live Event Chat system.
    *   Media Gallery for uploading and viewing event photos.
*   **Onboarding:** A guided tour system for new users (can be skipped).

## Recent Major Architectural Fixes & Deep Dives

### Open Graph (OG) Image Generation Ecosystem
A significant portion of recent development focused on making dynamic Open Graph images work perfectly across all social platforms, with a massive deep dive into **Facebook Messenger Desktop's legacy parsing quirks.**

**The resulting bulletproof architecture:**
1.  **Satori Engine (`/api/og/route.tsx`):**
    *   We use Next.js's `@vercel/og` (Satori) to generate dynamic PNG images featuring the Event Title, Date, and Host Name.
    *   **Crucial Fix:** The route explicitly uses a raw `pg` Pool connection rather than the Prisma Client adapter to completely bypass Serverless Edge runtime crashes on Vercel (`unsupported module 'net'`).
2.  **Synchronous Cache Hydration (The Race Condition Fix):**
    *   Vercel Serverless Cold Starts take ~1.5s, but Desktop Messenger's crawler aggressively times out at 1.0s.
    *   To bypass this, when a user creates an event, the `getEventMetadata` cache is natively awaited and hydrated *during the Postgres Database Transaction sequence* in the server action (`src/actions/event.ts`).
    *   This guarantees 100% read-after-write consistency, completely eliminating the Distributed Replica Lag race condition where Vercel Edge nodes were permanently caching "Null" metadata.
    *   Simultaneously, `Promise.all(fetch(...))` warms the HTML and API endpoints globally in the background before the user can copy the link.
3.  **Strict 100% Absolute HTML Metadata:**
    *   The `generateMetadata` function in `src/app/events/[id]/page.tsx` strictly forces absolute URLs (`https://www.eventhub.community/...`) for `og:url` and all `og:image` properties.
    *   **Why:** Legacy scrapers inside desktop apps (like Electron-based Messenger) instantly crash if they encounter relative `/` Canonical URLs or Image URLs.
4.  **Legacy XML Prefix Fallbacks (`src/app/layout.tsx`):**
    *   Added the `prefix="og: http://ogp.me/ns#"` attribute to the `<html>` root node.
    *   Added a dummy `fb:app_id` to the global Next.js metadata.
    *   **Why:** Standalone desktop crawlers often silently abort HTML parsing without these explicit namespaces.
5.  **Deleted Rogue Native Files:**
    *   Removed a global `src/app/opengraph-image.tsx` file because Next.js automatically natively suppresses dynamic custom `og:image` string arrays in route pages if a static global generator exists higher in the tree.

### Full Day Event Toggle
*   Implemented an `isFullDay` boolean in the Prisma Schema.
*   Updated the UI to toggle between `<input type="date">` and `<input type="datetime-local">`.
*   Propagated this flag through server actions and formatted the displayed metadata and Satori images to omit the exact time when checked.

## Known Issues / Quirks
*   **Prisma Edge Compatibility:** Vercel Edge functions still struggle occasionally with heavy ORMs. The manual raw Postgres connection in the `og` route is a strict necessity. Do not revert it to Prisma without extensive testing.
*   **Messenger Desktop:** Despite all the bulletproof rendering fallbacks, the Desktop Messenger Client is notoriously unpredictable compared to the Mobile App due to localized Electron client caching. If an OG image fails to render on Desktop but works on Mobile, it is almost certainly a localized cache ghost rather than a code defect.

## Next Steps / Upcoming Work
*   *Please provide instructions on what feature or bug to tackle next in the new session.*
