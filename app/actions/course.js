"use server"

import { prisma } from "@/lib/prisma"

/**
 * Fetches all courses from the database.
 */
export async function getCourses() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { code: "asc" },
    });

    return {
      success: true,
      courses: courses.map(c => ({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        units: c.units,
      }))
    };
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return { success: false, error: "Failed to load courses." };
  }
}

/**
 * Generates a course code based on Title and Creation Time.
 * Formula: First 6 consonants (uppercase) + HHMM (Creation Time)
 */
function generateCourseCode(title) {
  // 1. Get consonants and limit to 6
  const consonants = title.replace(/[^bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g, '').substring(0, 6).toUpperCase();
  
  // 2. Get creation time (HHMM)
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  
  return `${consonants}-${hhmm}`;
}

/**
 * Creates a new course in the database.
 */
export async function createCourse(data) {
  const { title, description, units } = data;

  if (!title || !units) {
    return { success: false, error: "Title and Units are required." };
  }

  const generatedCode = generateCourseCode(title);

  try {
    const newCourse = await prisma.course.create({
      data: {
        code: generatedCode,
        title,
        description: description || null,
        units: parseInt(units, 10),
      },
    });

    return { success: true, course: newCourse };
  } catch (error) {
    console.error("Failed to create course:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "A course with this generated code already exists. Please try again in a minute." };
    }
    return { success: false, error: "Failed to create course in database." };
  }
}

/**
 * Updates an existing course.
 */
export async function updateCourse(id, data) {
  const { title, description, units } = data;

  if (!title || !units) {
    return { success: false, error: "Title and Units are required." };
  }

  try {
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        title,
        description: description || null,
        units: parseInt(units, 10),
      },
    });

    return { success: true, course: updatedCourse };
  } catch (error) {
    console.error("Failed to update course:", error);
    return { success: false, error: "Failed to update course in database." };
  }
}

/**
 * Deletes a course from the database.
 * Will fail if course sections are already assigned to it.
 */
export async function deleteCourse(id) {
  try {
    // Check if course has sections
    const course = await prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { sections: true } } }
    });

    if (course && course._count.sections > 0) {
      return { 
        success: false, 
        error: `Cannot delete course. It has ${course._count.sections} section(s) assigned to it.` 
      };
    }

    await prisma.course.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete course:", error);
    return { success: false, error: "Failed to delete course from database." };
  }
}
