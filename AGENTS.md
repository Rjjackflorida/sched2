# Agent Context & Instructions: Faculty Scheduling System

This file provides the context, technical constraints, and operational rules for AI agents working on the University Faculty Scheduling System (MVP).

## 1. Project Overview
An automated scheduling platform built to manage faculty availability and academic room assignments. The core value prop is the **Conflict Prevention Engine** that cross-references faculty unavailability with section assignments.

## 2. Tech Stack & Environment
- **Framework:** Next.js (App Router)
- **Language:** JavaScript / TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI + Lucide Icons)
- **Database:** PostgreSQL (managed via Prisma/Drizzle)
- **Deployment:** Vercel

## 3. Core Business Logic (CRITICAL)
- **The Availability Rule:** Faculty members define blocks of "unavailable" time. The system MUST disable/gray-out these slots in the Admin Schedule Builder.
- **The Conflict Engine:**
    - **Faculty Conflict:** One professor cannot be in two sections at the same time.
    - **Room Conflict:** One room cannot host two sections at the same time.
    - **Unit Limit:** Faculty cannot exceed `max_units_per_sem`.

## 4. Database Architecture Reference
Refer to the following table relationships when generating queries or mutations:
- `users` ⮕ `faculty_profiles` (1:1)
- `departments` ⮕ `faculty_profiles` (1:N)
- `faculty_profiles` ⮕ `faculty_availability` (1:N)
- `rooms` ⮕ `course_sections` (1:N)
- `courses` ⮕ `course_sections` (1:N)

## 5. UI/UX Standards
- **Primary Color:** Teal (`#115E59`)
- **Backgrounds:** Light Slate (`#F8FAFC`)
- **Error States:** Use `bg-red-50` with `text-red-600` for alerts/conflicts.
- **Component Library:** Always prefer Shadcn UI components over custom CSS where possible.

## 6. Coding Guidelines for AI
- **Server Actions:** Use Next.js Server Actions for database mutations.
- **Component Structure:** Keep components small. Separate "Admin Dashboard" components from "Faculty" components to avoid role-logic leakage.
- **Conflict Handling:** When writing scheduling logic, prioritize the `(faculty_id, day_of_week, start_time, end_time)` composite unique index to handle overlaps.
- **Type Safety:** Ensure all database responses are typed according to the schema.

## 7. Current Goals
1. Implement the Admin Dashboard UI (System Overview).
2. Establish the Database Connection and Auth flow.
3. Build the "Auto-disable" logic in the Schedule Builder UI.

---
**Note to Agent:** Always verify against the `course_sections` unique indexes before proposing any automated scheduling algorithm.