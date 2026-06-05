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
- **Typography:** Professional, sans-serif (Inter/Next.js default).
  - **Headings:** `text-slate-900 font-bold`.
  - **Subheadings/Section Titles:** `text-slate-800 font-semibold`.
  - **Body Text:** `text-slate-600 font-normal`.
  - **Subtext/Labels:** `text-slate-500 font-medium`.
  - **Monospace:** Use `font-mono font-medium` for critical identifiers (Room names, Course codes, Program codes, Employee IDs).
  - **Metadata/Headers:** Use `text-[10px] font-semibold uppercase tracking-widest text-slate-500` for table headers and small metadata labels.
- **Icons:** Always use `lucide-react`.

### Component Specific Patterns
- **Cards:** 
  - Main container cards: `<Card>` from Shadcn.
  - For tables: `<CardContent className="p-0">` with `overflow-hidden` to allow the table to reach edges.
  - Containers often benefit from `bg-white/50 backdrop-blur-sm`.
- **Tables:**
  - `thead`: `bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-widest`.
  - `tbody tr`: `hover:bg-slate-50/80 transition-colors bg-white/40`.
  - Padding: `px-6 py-4` for table cells.
  - **Cell Text:** Use `font-medium` for primary identifiers in rows, `font-normal` for secondary data.
- **Badges:**
  - Success/Submitted: `border-teal-200 bg-teal-50 text-teal-700`.
  - Warning/Missing: `bg-orange-50 text-orange-700`.
  - Critical: `bg-red-500 text-white` or `bg-red-50 text-red-700`.
- **Avatars:** 
  - Fallback style: `bg-teal-100 text-teal-700`.
- **Inputs:** `bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all`.

### Modals & Destructive Actions
- **Backdrop:** Use `fixed inset-0 bg-slate-900/40 backdrop-blur-xs` for modal overlays.
- **Animation:** Apply `animate-in fade-in-50 zoom-in-95 duration-200` to modal content.
- **Delete Confirmation:** Every destructive action MUST use a unified confirmation modal.
  - Icon: `Trash2` in a `bg-red-50 text-red-600` circle.
  - Action Button: `bg-red-600 hover:bg-red-700`.

### Interactive Patterns
- **Tabs:** Use a horizontal button-based tab switcher for switching between sub-resources.
  - Active: `bg-[#115e59] text-white shadow-lg shadow-teal-900/20`.
  - Inactive: `text-slate-500 hover:bg-slate-50`.
- **Search:** Search bars should be `rounded-xl` with a `Search` icon on the left.
- **Loading:** Use standardized async feedback: `Loader2` (animate-spin) + `font-bold uppercase tracking-widest text-xs text-slate-400`.
- **Feedback:** Use `isSubmitting` to disable buttons and `formError` alerts (in `bg-red-50`) to display server action errors within modals.

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
