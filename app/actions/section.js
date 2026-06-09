"use server"

import { prisma } from "@/lib/prisma"
import { getSystemSettings } from "@/app/actions/settings"
import { verifyAdmin } from "@/lib/session"

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
        units: s.course.units,
        facultyId: s.facultyId,
        facultyName: s.faculty ? `${s.faculty.user.firstName} ${s.faculty.user.lastName}` : "Unassigned",
        sectionId: s.sectionId,
        programCode: s.section?.program?.code || "Unknown",
        yearLevel: s.section?.yearLevel || "",
        sectionName: s.section?.name || "",
        sectionCode: s.section ? `${s.section.yearLevel}-${s.section.name}` : "Unknown",
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
  const { courseId, facultyId, sectionId, semester, academicYear, maxStudents, forceAssignment } = data;

  if (!courseId || !sectionId || !semester || !academicYear) {
    return { success: false, error: "Course, Section, Semester, and Academic Year are required." };
  }

  try {
    await verifyAdmin();
    // --- WORKLOAD GUARD ---
    if (facultyId) {
      const settingsRes = await getSystemSettings();
      const globalSem = settingsRes.settings?.activeSemester || semester;
      const globalYear = settingsRes.settings?.activeAcademicYear || parseInt(academicYear, 10);

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
              semester: globalSem,
              academicYear: parseInt(globalYear, 10)
            },
            include: { course: true }
          },
          user: true
        }
      });

      if (profile && profile.maxUnitsPerSem !== null) {
        const currentUnits = profile.sections.reduce((sum, s) => sum + (s.course?.units || 0), 0);
        const totalPotentialUnits = currentUnits + courseToAdd.units;

        if (totalPotentialUnits > profile.maxUnitsPerSem && !forceAssignment) {
          return { 
            success: false, 
            requiresConfirmation: true,
            error: `Caution: Assigning ${courseToAdd.code} will put ${profile.user.firstName} on overload. (Current: ${currentUnits}, New Total: ${totalPotentialUnits} / Limit: ${profile.maxUnitsPerSem} units). Do you want to proceed?` 
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
  const { courseId, facultyId, sectionId, semester, academicYear, maxStudents, forceAssignment } = data;

  try {
    await verifyAdmin();
    // --- WORKLOAD GUARD ---
    if (facultyId) {
      const settingsRes = await getSystemSettings();
      const globalSem = settingsRes.settings?.activeSemester || semester;
      const globalYear = settingsRes.settings?.activeAcademicYear || parseInt(academicYear, 10);

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
              semester: globalSem,
              academicYear: parseInt(globalYear, 10),
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

        if (totalPotentialUnits > profile.maxUnitsPerSem && !forceAssignment) {
          return { 
            success: false, 
            requiresConfirmation: true,
            error: `Caution: Assigning ${newCourse.code} will put ${profile.user.firstName} on overload. (Current: ${otherUnits}, New Total: ${totalPotentialUnits} / Limit: ${profile.maxUnitsPerSem} units). Do you want to proceed?` 
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
    await verifyAdmin();
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

/**
 * --- SCHEDULE BUILDER ACTIONS ---
 */

/**
 * Fetches all scheduled blocks for a specific semester and year.
 * Used to populate the calendar and check for conflicts.
 */
export async function getSectionSchedules(semester, academicYear) {
  try {
    const schedules = await prisma.sectionSchedule.findMany({
      where: {
        section: {
          semester,
          academicYear: parseInt(academicYear, 10)
        }
      },
      include: {
        room: true,
        section: {
          include: {
            course: true,
            faculty: { include: { user: true } },
            section: { include: { program: true } }
          }
        }
      }
    });

    return { success: true, schedules };
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return { success: false, error: "Database error fetching schedules." };
  }
}

/**
 * Fetches all rooms and identifies which are available for a specific time slot.
 */
export async function getAvailableRooms(dayOfWeek, startTime, endTime, semester, academicYear) {
  try {
    // 1. Get all active rooms
    const allRooms = await prisma.room.findMany({ where: { isActive: true } });

    // 2. Get rooms that are busy at this time
    const busyRoomSchedules = await prisma.sectionSchedule.findMany({
      where: {
        dayOfWeek,
        section: {
          semester,
          academicYear: parseInt(academicYear, 10)
        },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } }
        ]
      },
      select: { roomId: true }
    });

    const busyRoomIds = busyRoomSchedules.map(s => s.roomId).filter(Boolean);

    // 3. Separate into available and busy
    const rooms = allRooms.map(room => ({
      ...room,
      isAvailable: !busyRoomIds.includes(room.id)
    }));

    return { success: true, rooms };
  } catch (error) {
    console.error("Failed to fetch available rooms:", error);
    return { success: false, error: "Database error checking rooms." };
  }
}

/**
 * Helper to convert a Date object or string to minutes from midnight for easy comparison.
 * Ensures we only compare time and ignore dates/timezones.
 */
function getMinutes(input) {
  const date = new Date(input);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/**
 * Creates a new schedule block with strict conflict validation.
 * Checks Faculty, Room, and Student Section overlaps.
 */
export async function createSectionSchedule(data) {
  const { courseSectionId, roomId, dayOfWeek, startTime, endTime } = data;

  try {
    await verifyAdmin();
    // 1. Fetch the CourseSection to get Faculty, Section, and Term details
    const cs = await prisma.courseSection.findUnique({
      where: { id: courseSectionId },
      include: { 
        course: true, 
        section: true,
        faculty: { include: { user: true } }
      }
    });

    if (!cs) return { success: false, error: "Assignment not found." };

    const startMinutes = getMinutes(startTime);
    const endMinutes = getMinutes(endTime);

    // 2. CONFLICT CHECK: Room
    if (roomId) {
      const roomSchedules = await prisma.sectionSchedule.findMany({
        where: {
          roomId,
          dayOfWeek,
          section: {
            semester: cs.semester,
            academicYear: cs.academicYear
          }
        }
      });

      const roomConflict = roomSchedules.find(s => {
        const sStart = getMinutes(s.startTime);
        const sEnd = getMinutes(s.endTime);
        return startMinutes < sEnd && endMinutes > sStart;
      });

      if (roomConflict) return { success: false, error: "Room is already occupied at this time." };
    }

    // 3. CONFLICT CHECK: Faculty (Only if assigned)
    if (cs.facultyId) {
      // A. Check other classes this faculty is teaching
      const facultySchedules = await prisma.sectionSchedule.findMany({
        where: {
          section: {
            facultyId: cs.facultyId,
            semester: cs.semester,
            academicYear: cs.academicYear
          },
          dayOfWeek
        }
      });

      const facultyConflict = facultySchedules.find(s => {
        const sStart = getMinutes(s.startTime);
        const sEnd = getMinutes(s.endTime);
        return startMinutes < sEnd && endMinutes > sStart;
      });

      if (facultyConflict) return { success: false, error: `${cs.faculty.user.firstName} is already teaching another class at this time.` };

      // B. Check Faculty Availability (Submitted via Portal)
      const availabilityRecords = await prisma.facultyAvailability.findMany({
        where: {
          facultyId: cs.facultyId,
          dayOfWeek,
          semester: cs.semester,
          academicYear: cs.academicYear,
          status: "unavailable"
        }
      });

      const availabilityConflict = availabilityRecords.find(s => {
        const sStart = getMinutes(s.startTime);
        const sEnd = getMinutes(s.endTime);
        return startMinutes < sEnd && endMinutes > sStart;
      });

      if (availabilityConflict) return { success: false, error: `${cs.faculty.user.firstName} is marked as UNAVAILABLE at this time.` };
    }

    // 4. CONFLICT CHECK: Student Section (The Block)
    const sectionSchedules = await prisma.sectionSchedule.findMany({
      where: {
        section: {
          sectionId: cs.sectionId,
          semester: cs.semester,
          academicYear: cs.academicYear
        },
        dayOfWeek
      }
    });

    const sectionConflict = sectionSchedules.find(s => {
      const sStart = getMinutes(s.startTime);
      const sEnd = getMinutes(s.endTime);
      return startMinutes < sEnd && endMinutes > sStart;
    });

    if (sectionConflict) return { success: false, error: `Section ${cs.section.yearLevel}${cs.section.name} already has a class scheduled at this time.` };

    // 5. Success! Save the block
    const newSchedule = await prisma.sectionSchedule.create({
      data: {
        sectionId: courseSectionId,
        roomId: roomId || null,
        dayOfWeek,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    });

    return { success: true, schedule: newSchedule };

  } catch (error) {
    console.error("Failed to create schedule:", error);
    return { success: false, error: "Database error while saving schedule." };
  }
}

/**
 * Deletes a scheduled block.
 */
export async function deleteSectionSchedule(id) {
  try {
    await verifyAdmin();
    await prisma.sectionSchedule.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete schedule block:", error);
    return { success: false, error: "Database error." };
  }
}

/**
 * Fetches the active schedule for a specific Student Section (Block).
 */
export async function getStudentSectionScheduleData(sectionId) {
  try {
    const { getSystemSettings } = await import('@/app/actions/settings');
    const settingsRes = await getSystemSettings();
    const activeSemester = settingsRes?.settings?.activeSemester || "1st";
    const activeYear = settingsRes?.settings?.activeAcademicYear || 2024;

    const studentSection = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        program: true,
        courseSections: {
          where: {
            semester: activeSemester,
            academicYear: activeYear
          },
          include: {
            course: true,
            faculty: { include: { user: true } },
            schedules: { include: { room: true } }
          }
        }
      }
    });

    if (!studentSection) return { success: false, error: "Section not found." };

    const blockName = `${studentSection.program.code} ${studentSection.yearLevel}-${studentSection.name}`;

    // Flatten schedules for the grid
    const schedules = [];
    if (studentSection.courseSections) {
      studentSection.courseSections.forEach(cSec => {
        cSec.schedules.forEach(sch => {
          schedules.push({
            id: sch.id,
            courseCode: cSec.course.code,
            courseTitle: cSec.course.title,
            instructor: cSec.faculty ? `${cSec.faculty.user.firstName} ${cSec.faculty.user.lastName}` : "UNASSIGNED",
            room: sch.room ? (sch.room.building ? `${sch.room.building} - ${sch.room.roomNumber || sch.room.name}` : (sch.room.roomNumber || sch.room.name)) : "TBA",
            day: sch.dayOfWeek,
            startTime: sch.startTime,
            endTime: sch.endTime,
          });
        });
      });
    }

    return { 
      success: true, 
      sectionName: blockName,
      activeSemester,
      activeAcademicYear: activeYear,
      schedules
    };
  } catch (error) {
    console.error("Failed to fetch section schedule:", error);
    return { success: false, error: "Failed to load student section schedule." };
  }
}
