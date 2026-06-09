"use server"

import { prisma } from "@/lib/prisma"
import { verifyAdmin } from "@/lib/session"

/**
 * Fetches all programs with their nested sections.
 */
export async function getPrograms() {
  try {
    await verifyAdmin();
    const programs = await prisma.program.findMany({
      include: {
        sections: {
          orderBy: [
            { yearLevel: "asc" },
            { name: "asc" }
          ]
        }
      },
      orderBy: { code: "asc" }
    });

    return { success: true, programs };
  } catch (error) {
    console.error("Failed to fetch programs:", error);
    return { success: false, error: "Failed to load programs." };
  }
}

/**
 * Creates a new Program.
 */
export async function createProgram(data) {
  const { code, name } = data;

  if (!code || !name) {
    return { success: false, error: "Program code and name are required." };
  }

  try {
    await verifyAdmin();
    const newProgram = await prisma.program.create({
      data: {
        code: code.toUpperCase(),
        name,
      },
    });

    return { success: true, program: newProgram };
  } catch (error) {
    console.error("Failed to create program:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "A program with this code already exists." };
    }
    return { success: false, error: "Failed to create program." };
  }
}

/**
 * Creates a new Section under a Program.
 */
export async function createSection(data) {
  const { programId, yearLevel, name } = data;

  if (!programId || !yearLevel || !name) {
    return { success: false, error: "Program, year level, and block name are required." };
  }

  try {
    await verifyAdmin();
    const newSection = await prisma.section.create({
      data: {
        programId,
        yearLevel: parseInt(yearLevel, 10),
        name: name.toUpperCase(),
      },
    });

    return { success: true, section: newSection };
  } catch (error) {
    console.error("Failed to create section:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "This exact section already exists for this program and year." };
    }
    return { success: false, error: "Failed to create section." };
  }
}

/**
 * Deletes a Program. Will fail if sections exist (due to constraints or manual check, though Cascade delete is on, we might want to warn).
 * Actually Cascade delete is on for sections, but what if courseSections exist? 
 */
export async function deleteProgram(id) {
  try {
    await verifyAdmin();
    // Check if any sections under this program are used in course sections
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            _count: { select: { courseSections: true } }
          }
        }
      }
    });

    if (!program) return { success: false, error: "Program not found." };

    const inUse = program.sections.some(s => s._count.courseSections > 0);
    if (inUse) {
      return { success: false, error: "Cannot delete program. Some of its sections are currently assigned to courses." };
    }

    await prisma.program.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete program:", error);
    return { success: false, error: "Failed to delete program." };
  }
}

/**
 * Deletes a Section. Will fail if used in CourseSection.
 */
export async function deleteSection(id) {
  try {
    await verifyAdmin();
    const section = await prisma.section.findUnique({
      where: { id },
      include: { _count: { select: { courseSections: true } } }
    });

    if (section && section._count.courseSections > 0) {
      return { success: false, error: "Cannot delete section. It is currently assigned to a course." };
    }

    await prisma.section.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete section:", error);
    return { success: false, error: "Failed to delete section." };
  }
}
