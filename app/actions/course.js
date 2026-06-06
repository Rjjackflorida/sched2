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
 * Creates a new course in the database.
 */
export async function createCourse(data) {
  const { code, title, description, units } = data;

  if (!code || !title || !units) {
    return { success: false, error: "Code, Title and Units are required." };
  }

  try {
    const newCourse = await prisma.course.create({
      data: {
        code,
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
  const { code, title, description, units } = data;

  if (!code || !title || !units) {
    return { success: false, error: "Code, Title and Units are required." };
  }

  try {
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        code,
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
