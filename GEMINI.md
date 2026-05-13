# Gemini CLI - Project Context: Scheduling System (sched2)

This file provides foundational context and instructions for AI agents working on the University Faculty Scheduling System.

## Core Mandates
- **Visual Integrity:** Maintain the teal-themed, clean UI based on Shadcn UI.
- **Conflict Prevention:** Respect the database constraints in `prisma/schema.prisma` that prevent double-booking of faculty and rooms.
- **Portal Separation:** Ensure features are correctly placed in either the Admin Portal or the Faculty Portal.
- **Readable Code:** Every new block of code or logical section MUST include descriptive comments. This is essential for long-term readability, easier debugging, and providing context for future updates.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** JavaScript
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI + Lucide React icons

## Key Architectural Patterns
- **Layouts:** 
  - `components/admin-layout.jsx`: The persistent layout for all admin pages.
  - `app/faculty-portal/layout.jsx`: The layout for faculty-specific pages.
- **Authentication:**
  - `lib/session.js`: JWT-based session management.
  - `app/actions/auth.js`: Server actions for login, logout, and registration.
  - `middleware.js`: Route protection and role-based access control.
- **Database Schema:** 
  - Managed in `prisma/schema.prisma`.
  - Uses composite unique indexes for scheduling integrity.

## UI/UX Standards
- **Primary Color:** Dark Teal (`#115e59`) for primary buttons and accents.
- **Backgrounds:** `bg-slate-50` for main content areas, `white` for cards and sidebars.
- **Typography:** Professional, sans-serif (Inter/Next.js default, explicitly `font-sans` which maps to Helvetica/Arial in `globals.css`).
  - Headings: `text-slate-900` (often `font-bold` or `font-semibold`).
  - Subtext/Labels: `text-slate-500`.
- **Icons:** Always use `lucide-react`.

### Component Specific Patterns
- **Cards:** 
  - Main container cards: `<Card>` from Shadcn.
  - For tables: `<CardContent className="p-0">` to allow the table to reach the edges.
- **Tables:**
  - `thead`: `bg-slate-50 border-b border-slate-200 text-slate-500`.
  - `tbody tr`: `hover:bg-slate-50 transition-colors bg-white`.
  - Padding: `px-6 py-4` for table cells.
- **Badges:**
  - Success/Submitted: `border-teal-200 bg-teal-50 text-teal-700`.
  - Warning/Missing: `bg-orange-50 text-orange-700`.
  - Critical: `bg-red-500 text-white` or `bg-red-50 text-red-700`.
- **Avatars:** 
  - Fallback style: `bg-teal-100 text-teal-700`.
- **Inputs:** `bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500`.

## Common Tasks & Workflows
- **Adding a Page:** 
  - Create a new folder in `app/` with a `page.jsx`. 
  - Wrap content in `AdminLayout` for admin pages.
  - Structure:
    ```jsx
    <AdminLayout title="Page Title">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Header</h2>
              <p className="text-slate-500 text-sm">Description</p>
            </div>
          </div>
          {/* Content */}
        </div>
      </div>
    </AdminLayout>
    ```
- **Updating Schema:** Modify `prisma/schema.prisma`, then run `npx prisma migrate dev`.
- **UI Components:** Use `npx shadcn-ui@latest add [component]` to add new Shadcn components.

## Reference Files
- `AGENTS.md`: Original project requirements and visual specifications.
- `CLAUDE.md`: Claude-specific instructions (if applicable).
- `package.json`: Dependency list and scripts.
