# Venture Compound Scavenger Hunt - Product Requirements Document (PRD)

## 1. Executive Summary & Overview
Every year at **DragonCon**, the **Venture Compound** Facebook group puts together an annual cosplay scavenger hunt. Participants search across the convention to spot and photograph specific cosplayers from a provided target list.

This project is a lightweight, mobile-first web application designed for a single group of friends to collaboratively track the list, upload photos of spotted cosplayers, and view overall hunt progress in real time during the convention.

---

## 2. Goals & Objectives
- **Collaborative Hunt Tracking**: Provide a shared space where a group of friends can work together on a single checklist.
- **Yearly Session Separation**: Support distinct pages/sessions per year (e.g., 2024, 2025, 2026) while retaining past years' memories and photo archives.
- **Frictionless Mobile Access**: Allow friends to easily access the hunt via a shareable link and quickly snap/upload photos on the go amidst crowded con conditions.
- **Simple Progress Visualization**: Keep everyone motivated with a clear completion counter/progress bar showing how many items have been found.

---

## 3. User Roles & Access
- **Friend / Participant**:
  - Enter the shared yearly join/lobby code (or open an invite link containing the code) to access the hunt.
  - View the list of target cosplayers and overall progress.
  - Upload photos for specific target items.
  - Optionally enter their name/nickname when uploading to record who snapped the photo.
- **Organizer / Admin (Friend managing the list)**:
  - Create a new year session and set the shared join code (or admin passphrase).
  - Share the join code or direct invite link with friends.
  - Upload or edit the master list of target cosplayers for the year.
  - Manage or remove mistaken photo uploads if necessary.

---

## 4. Key Features & Functional Requirements

### 4.1 Year / Session Management
- **Dedicated Year URLs**: Direct routes for each year (e.g., `/2026`, `/2025`).
- **Archive & History**: Ability to browse previous years' completed lists and photo galleries via a header year switcher with clear convention labels (`YYYY Con`).
- **Current Year Default**: Navigating to the home page redirects or highlights the active convention year.

### 4.2 Target List Management
- **List Ingestion**:
  - Ability to quickly import or create the annual list (e.g., bulk paste line-by-line, CSV upload, or manual entry).
- **Target Item Fields**:
  - Item Title / Character Name (e.g., "Brock Samson in speedo", "Dr. Girlfriend (Season 1)").
  - Optional hints, notes, or category tags (e.g., "The Monarch's Henchmen", "Guild of Calamitous Intent").
  - Status indicator (`Found` / `Needed`).

### 4.3 Photo Submission & Collaboration
- **Direct Photo Upload**:
  - Native mobile camera integration (trigger camera or photo library from mobile browser).
  - Client-side image compression/resizing (e.g. `browser-image-compression`) before upload to ensure small file sizes (~300–600 KB WebP/JPEG) and reliable uploads under congested convention Wi-Fi/cellular conditions.
  - Direct upload to cloud blob storage (e.g., client tokens / presigned URLs) to bypass serverless function payload limits, with fallback to local storage during development.
- **Submission Metadata**:
  - Photographer name / credit (optional text input or remembered locally in browser).
  - Timestamp of upload.
  - Optional caption or location notes (e.g., "Spotted at Marriott Atrium").
- **Single Photo per Item**: Restrict checklist targets to a single photo sighting to keep the hunt simple and focused.
- **Direct Thumbnail Expansion**: Clicking directly on a target's sighting photo opens the full image in a high-resolution lightbox without requiring a separate view button.
- **Optimized Delivery**: Responsive thumbnails and image caching via `next/image` to minimize client bandwidth and stay well within free hosting limits.

### 4.4 Progress & Filtering
- **Required Target Goal Subset**: Support setting a configurable required target goal count (e.g., finding 15 out of 45 provided cosplayers on the master list).
- **Mission Progress Gauge**:
  - Completion percentage and power meter calculate progress against the required target goal rather than the entire list.
  - Thematic rank milestones scale with progress (e.g., *Level 1 Henchman* → *Guild Sovereign*).
- **Overdrive Bonus Indicator**: When the group spots more cosplayers than the target goal, display a distinct bonus badge (e.g., `+N Bonus!`) and trigger a *Super-Science Overdrive* visual indicator.
- **Search & Quick Filters**:
  - Filter list by: `All`, `Completed (Found)`, and `Incomplete (Needed)`.
  - Instant text search across character names, descriptions, and notes.
- **Photo Gallery View**: Ability to switch between a checklist view and a visual photo grid of all captured cosplays.

### 4.5 Access Control & Shared Lobby Codes
- **Lobby-Style Join Code**:
  - Each yearly session is protected by a short, memorable join code (e.g., `VENTURE26` or a 4–6 character code).
  - Unauthenticated visitors hitting a hunt URL (e.g., `/2026`) are presented with a simple "Enter Lobby Code" gate before viewing targets or photos.
- **Persistent Session State**:
  - Once the correct code is entered, the session is saved locally in the browser (via cookie / localStorage) so participants do not need to re-enter it on every visit.
- **Frictionless Invite URLs**:
  - Organizers can share direct invite links with the join code included as a query parameter (e.g., `/2026?join=VENTURE26`) to auto-authenticate friends with a single click.

---

## 5. Non-Functional Requirements

### 5.1 Mobile-First & Responsive Design
- Optimized for one-handed smartphone use while walking convention floors.
- High-contrast, clean UI that remains readable under varied lighting conditions.

### 5.2 Performance & Convention Network Resilience
- **Pre-Upload Image Compression**: Resize and compress images client-side before sending across the wire to avoid failed uploads on congested 4G/5G con networks.
- **Direct-to-Storage Uploads**: Avoid buffering image payloads through Next.js serverless functions by issuing direct upload tokens/URLs.
- **Fast Initial Page Load**: Static shell and cached/optimistic UI updates with thumbnail rendering via `next/image`.

### 5.3 Simplicity, Low Maintenance & Free Tier Suitability
- **Zero-Cost Operation**: Designed to fit comfortably within Vercel Hobby / free tier limits (bandwidth, functions, image optimization, and storage for ~20–40 photos/year).
- **Lightweight Access Control**: Shared lobby/join code prevents unauthorized public browsing while avoiding the friction and overhead of personal user accounts, email verification, or password resets.
- **Simplified Storage & Database**: SQLite-based database to eliminate overhead and configuration complexity of dedicated PostgreSQL clusters.

---

## 6. Scope Boundaries

### In Scope (MVP)
- Shareable year-specific hunt sessions (`/:year`) with header year archive switcher.
- Shared lobby / join code access gate with browser persistence and optional invite link query parameter.
- Bulk list entry & editing for the target checklist, with configurable required target goal counts.
- Single mobile photo upload per checklist item with camera trigger and direct thumbnail lightbox preview.
- Mission Progress Gauge and rank milestones calculated against the required target subset, featuring bonus overdrive indicators when exceeded.
- Search and filter by completion status.
- Lightbox / full-screen photo viewer.
- Client-side image compression and direct blob upload with local fallback.

### Out of Scope (Explicitly Deferred)
- Multiple competing teams or competitive leaderboards.
- Complex user authentication, user profiles, or granular role management.
- Heavy relational database architectures (Postgres/MySQL not needed for simple group scale).
- Automated image recognition or AI verification.
- GPS/geofencing check-ins.
- Native mobile app stores (PWA / responsive web only).

---

## 7. Recommended Technical Architecture

- **Frontend / Framework**: Next.js (App Router), React, Tailwind CSS.
- **Database & ORM**: SQLite (e.g., Turso / libSQL for serverless, or embedded SQLite) via Drizzle ORM or Prisma for simple schemas and zero-maintenance deployments.
- **Media Storage**: Vercel Blob (or S3-compatible / Supabase Storage) with direct client uploads and `next/image` thumbnail optimization.
- **Deployment & Hosting**: Vercel (Hobby / Free Tier).

---

## 8. UI/UX & Theming Specifications

### 8.1 Visual Identity & Aesthetic ("Super-Science at the Con")
The visual identity blends 1960s/70s retro-futuristic *Venture Bros.* super-science aesthetics with iconic, evergreen *DragonCon* cultural nods.

- **Venture Bros. Styling Cues**:
  - **Color Palette**:
    - *Team Venture / Super-Science (Primary)*: Venture Orange (`#EA580C` / `#F97316`), Compound Cream/Khaki (`#FAF7F2` / `#FEF3C7`), OSI Navy/Slate (`#0F172A` / `#1E293B`).
    - *Guild & Monarch Accents (Secondary/Alerts)*: Monarch Gold/Yellow (`#F59E0B` / `#FBBF24`), Guild Purple (`#6B21A8`), Henchman Red (`#DC2626`).
  - **Typography & Geometry**:
    - Bold, condensed retro-futuristic sans-serif headers (evoking classic Hanna-Barbera / Venture Bros. title cards).
    - Monospace font (`Geist Mono` / `Space Mono`) for timestamps, mission tags, and "TARGET ACQUIRED" readouts.
    - Chunky retro borders with sharp drop-shadow offsets (`shadow-[3px_3px_0px_0px_#000]`) and 60s/70s pill badges.

- **DragonCon Styling Cues**:
  - **Dragon Logo & Iconography**: The iconic DragonCon dragon silhouette incorporated into header badges, con stamps, navigation watermarks, or favicon.
  - **Marriott Marquis Carpet Motif**: Subtle geometric diamond / chevron pattern accents on header banners, dividers, or the join-gate background.
  - **Con Badges & Hanging Ribbon Stacks**: Target item cards styled as con badges with hanging satin ribbon tags (e.g., "FOUND AT CON", category tags).
  - **Field Operations Dossier**: Overall layout structured like an official convention field operations logbook.

### 8.2 Component Design Concepts
- **Compound Security Checkpoint (Join / Lobby Gate)**:
  - Styled as an OSI / Venture Compound security terminal with tactile retro inputs, carpet-pattern background texture, and an "ACCESS GRANTED" / "GO TEAM VENTURE!" submission action.
- **Mission Progress Gauge (Threat Level / Power Meter)**:
  - Designed as a retro laboratory power meter or ray-gun charge bar with thematic milestone titles (e.g., *Level 1 Henchman* → *Guild Sovereign*).
- **Target Checklist Cards & Sighting Logs**:
  - *Unfound Target*: Styled as a classified OSI dossier file with silhouette placeholder and tactile "LOG SIGHTING" camera button.
  - *Found Target*: Displays captured photo in a vintage Polaroid / slide mount frame with an attached green/gold "FOUND" badge ribbon.
