"use server"

import { prisma } from "@/lib/prisma"

/**
 * Fetches all departments from the database.
 * Includes the head of faculty user details for display.
 */
export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        headFaculty: {
          include: {
            user: true
          }
        },
        _count: {
          select: { faculties: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      departments: departments.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        headFacultyId: d.headFacultyId,
        headFacultyName: d.headFaculty 
          ? `${d.headFaculty.user.firstName} ${d.headFaculty.user.lastName}` 
          : "Not Assigned",
        facultyCount: d._count.faculties,
        createdAt: d.createdAt,
      }))
    };
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return { success: false, error: "Failed to load departments." };
  }
}

/**
 * Fetches all faculty profiles to populate dropdowns.
 * Includes departmentId for filtering.
 */
export async function getFacultyProfiles() {
  try {
    const faculty = await prisma.facultyProfile.findMany({
      include: { user: true },
      orderBy: { user: { lastName: "asc" } },
    });

    return {
      success: true,
      faculty: faculty.map(f => ({
        id: f.id,
        fullName: `${f.user.firstName} ${f.user.lastName}`,
        departmentId: f.departmentId,
      }))
    };
  } catch (error) {
    console.error("Failed to fetch faculty list:", error);
    return { success: false, error: "Failed to load faculty list." };
  }
}

/**
 * Updates an existing department.
 */
export async function updateDepartment(id, data) {
  const { name, headFacultyId } = data;

  if (!name) {
    return { success: false, error: "Department name is required." };
  }

  try {
    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        name,
        headFacultyId: headFacultyId || null,
      },
      include: {
        headFaculty: {
          include: { user: true }
        },
        _count: {
          select: { faculties: true }
        }
      }
    });

    return {
      success: true,
      department: {
        id: updatedDept.id,
        name: updatedDept.name,
        code: updatedDept.code,
        headFacultyName: updatedDept.headFaculty 
          ? `${updatedDept.headFaculty.user.firstName} ${updatedDept.headFaculty.user.lastName}` 
          : "Not Assigned",
        facultyCount: updatedDept._count.faculties,
      }
    };
  } catch (error) {
    console.error("Failed to update department:", error);
    return { success: false, error: "Failed to update department in database." };
  }
}

/**
 * Creates a new department with a custom ID.
 * Format: CODE + HHMM (Creation Time)
 */
export async function createDepartment(data) {
  const { name, code, headFacultyId } = data;

  if (!name || !code) {
    return { success: false, error: "Name and Code are required." };
  }

  try {
    // 1. Generate Custom ID
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const customId = `${code.toUpperCase()}${hours}${minutes}`;

    // 2. Check for ID collision (unlikely but possible within the same minute)
    const existing = await prisma.department.findUnique({
      where: { id: customId }
    });

    if (existing) {
      return { success: false, error: "A department with this generated ID already exists. Please try again in a minute." };
    }

    // 3. Create Department
    const newDept = await prisma.department.create({
      data: {
        id: customId,
        name,
        code: code.toUpperCase(),
        headFacultyId: headFacultyId || null,
      },
      include: {
        headFaculty: {
          include: { user: true }
        },
        _count: {
          select: { faculties: true }
        }
      }
    });

    return {
      success: true,
      department: {
        id: newDept.id,
        name: newDept.name,
        code: newDept.code,
        headFacultyName: newDept.headFaculty 
          ? `${newDept.headFaculty.user.firstName} ${newDept.headFaculty.user.lastName}` 
          : "Not Assigned",
        facultyCount: newDept._count.faculties,
      }
    };
  } catch (error) {
    console.error("Failed to create department:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "A department with this code already exists." };
    }
    return { success: false, error: "Failed to create department due to a database error." };
  }
}

/**
 * Deletes a department from the database.
 * Will fail if courses are still assigned to it.
 */
export async function deleteDepartment(id) {
  try {
    // Check if department has courses (Prisma would throw anyway, but we can be explicit)
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } }
    });

    if (dept && dept._count.courses > 0) {
      return { 
        success: false, 
        error: `Cannot delete department. It still has ${dept._count.courses} course(s) assigned to it.` 
      };
    }

    await prisma.department.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete department:", error);
    return { success: false, error: "Failed to delete department from database." };
  }
}
