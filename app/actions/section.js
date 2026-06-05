"use server"

import { prisma } from "@/lib/prisma"

/**
 * Fetches all course sections (assignments) from the database.
 */
export async function getCourseSections() {
  try {
    const sections = await prisma.courseSection.findMany({
      include: {
        course: true,
        section: {
          include: { program: true }
        },
        faculty: {
          include: {
            user: true
          }
        },
        _count: {
          select: { schedules: true }
        }
      },
      orderBy: [
        { section: { program: { code: "asc" } } },
        { section: { yearLevel: "asc" } },
        { section: { name: "asc" } },
        { course: { code: "asc" } }
      ],
    });

    return {
      success: true,
      sections: sections.map(s => ({
        id: s.id,
        courseId: s.courseId,
        courseCode: s.course.code,
        courseTitle: s.course.title,
        facultyId: s.facultyId,
        facultyName: s.faculty ? `${s.faculty.user.firstName} ${s.faculty.user.lastName}` : "Unassigned",
        sectionId: s.sectionId,
        program: s.section?.program?.code || "Unknown",
        sectionCode: s.section ? `${s.section.yearLevel}${s.section.name}` : "Unknown",
        semester: s.semester,
        academicYear: s.academicYear,
        maxStudents: s.maxStudents,
        status: s.status,
        scheduleCount: s._count.schedules
      }))
    };
  } catch (error) {
    console.error("Failed to fetch course sections:", error);
    return { success: false, error: "Failed to load class assignments." };
  }
}

/**
 * Creates a new course section (assignment).
 */
export async function createCourseSection(data) {
  const { courseId, facultyId, sectionId, semester, academicYear, maxStudents } = data;

  if (!courseId || !sectionId || !semester || !academicYear) {
    return { success: false, error: "Course, Section, Semester, and Academic Year are required." };
  }

  try {
    // --- WORKLOAD GUARD ---
    if (facultyId) {
      // 1. Fetch the course being assigned to get its units
      const courseToAdd = await prisma.course.findUnique({
        where: { id: courseId },
        select: { units: true, code: true }
      });

      if (!courseToAdd) return { success: false, error: "Course not found." };

      // 2. Fetch the faculty profile and their current workload
      const profile = await prisma.facultyProfile.findUnique({
        where: { id: facultyId },
        include: {
          sections: {
            where: {
              semester,
              academicYear: parseInt(academicYear, 10)
            },
            include: { course: true }
          },
          user: true
        }
      });

      if (profile && profile.maxUnitsPerSem !== null) {
        const currentUnits = profile.sections.reduce((sum, s) => sum + (s.course?.units || 0), 0);
        const totalPotentialUnits = currentUnits + courseToAdd.units;

        if (totalPotentialUnits > profile.maxUnitsPerSem) {
          return { 
            success: false, 
            error: `Cannot assign ${courseToAdd.code}. This would exceed ${profile.user.firstName}'s workload limit of ${profile.maxUnitsPerSem} units. (Current: ${currentUnits}, New Total: ${totalPotentialUnits})` 
          };
        }
      }
    }

    const newSection = await prisma.courseSection.create({
      data: {
        courseId,
        facultyId: facultyId || null,
        sectionId,
        semester,
        academicYear: parseInt(academicYear, 10),
        maxStudents: maxStudents ? parseInt(maxStudents, 10) : null,
      },
    });

    return { success: true, section: newSection };
  } catch (error) {
    console.error("Failed to create course section:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "This exact course is already assigned to this program and section for this semester." };
    }
    return { success: false, error: "Failed to create assignment in database." };
  }
}

/**
 * Updates an existing course section.
 */
export async function updateCourseSection(id, data) {
  const { courseId, facultyId, sectionId, semester, academicYear, maxStudents } = data;

  try {
    // --- WORKLOAD GUARD ---
    if (facultyId) {
      // 1. Fetch the new course to get its units
      const newCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: { units: true, code: true }
      });

      if (!newCourse) return { success: false, error: "Course not found." };

      // 2. Fetch the faculty profile and all their current assignments
      const profile = await prisma.facultyProfile.findUnique({
        where: { id: facultyId },
        include: {
          sections: {
            where: {
              semester,
              academicYear: parseInt(academicYear, 10),
              NOT: { id: id } // EXCLUDE the current section being edited
            },
            include: { course: true }
          },
          user: true
        }
      });

      if (profile && profile.maxUnitsPerSem !== null) {
        const otherUnits = profile.sections.reduce((sum, s) => sum + (s.course?.units || 0), 0);
        const totalPotentialUnits = otherUnits + newCourse.units;

        if (totalPotentialUnits > profile.maxUnitsPerSem) {
          return { 
            success: false, 
            error: `Cannot assign ${newCourse.code}. This would exceed ${profile.user.firstName}'s workload limit of ${profile.maxUnitsPerSem} units. (Current: ${otherUnits}, New Total: ${totalPotentialUnits})` 
          };
        }
      }
    }

    const updatedSection = await prisma.courseSection.update({
      where: { id },
      data: {
        courseId,
        facultyId: facultyId || null,
        sectionId,
        semester,
        academicYear: parseInt(academicYear, 10),
        maxStudents: maxStudents ? parseInt(maxStudents, 10) : null,
      },
    });

    return { success: true, section: updatedSection };
  } catch (error) {
    console.error("Failed to update course section:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "This exact course is already assigned to this program and section for this semester." };
    }
    return { success: false, error: "Failed to update assignment in database." };
  }
}

/**
 * Deletes a course section from the database.
 * Will fail if it has schedules assigned.
 */
export async function deleteCourseSection(id) {
  try {
    const section = await prisma.courseSection.findUnique({
      where: { id },
      include: { _count: { select: { schedules: true } } }
    });

    if (section && section._count.schedules > 0) {
      return { 
        success: false, 
        error: `Cannot delete assignment. It already has ${section._count.schedules} schedule(s) placed on the calendar.` 
      };
    }

    await prisma.courseSection.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete course section:", error);
    return { success: false, error: "Failed to delete assignment from database." };
  }
}
