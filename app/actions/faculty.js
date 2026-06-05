"use server"

import { prisma } from "@/lib/prisma"
import { getSystemSettings } from "@/app/actions/settings"

/**
 * Fetches all users with the 'faculty' role and their associated profiles.
 * Optionally filters workload by semester and academic year.
 */
export async function getFacultyRoster(semester, academicYear) {
  try {
    let filterSemester = semester;
    let filterAcademicYear = academicYear;

    if (!filterSemester || !filterAcademicYear) {
      const settingsRes = await getSystemSettings();
      if (settingsRes.success && settingsRes.settings) {
        filterSemester = filterSemester || settingsRes.settings.activeSemester;
        filterAcademicYear = filterAcademicYear || settingsRes.settings.activeAcademicYear.toString();
      }
    }

    // Fetch users filtered by role 'faculty'
    const users = await prisma.user.findMany({
      where: { role: "faculty" },
      include: {
        facultyProfile: {
          include: {
            sections: {
              where: {
                ...(filterSemester && { semester: filterSemester }),
                ...(filterAcademicYear && { academicYear: parseInt(filterAcademicYear, 10) })
              },
              include: {
                course: true
              }
            },
            availabilities: {
              where: {
                ...(filterSemester && { semester: filterSemester }),
                ...(filterAcademicYear && { academicYear: parseInt(filterAcademicYear, 10) })
              }
            }
          }
        }
      },
      orderBy: { lastName: "asc" }
    });

    // Map and format the data for the UI
    const roster = users.map(user => {
      const profile = user.facultyProfile;
      
      // Calculate Workload (Sum of units from assigned course sections)
      let currentWorkload = 0;
      if (profile?.sections) {
        currentWorkload = profile.sections.reduce((sum, section) => {
          return sum + (section.course?.units || 0);
        }, 0);
      }

      // Determine Availability Status
      // For now, we check if they have any availability records
      const hasAvailability = profile?.availabilities && profile.availabilities.length > 0;

      return {
        id: user.id,
        profileId: profile?.id,
        fullName: `${user.firstName} ${user.lastName}`,
        employeeId: profile?.employeeId ?? "not assigned yet",
        employmentType: profile?.employmentType ?? "not assigned yet",
        workload: {
          current: currentWorkload,
          max: profile?.maxUnitsPerSem ?? null // Return null if not set to trigger "not assigned yet" in UI
        },
        availabilityStatus: hasAvailability ? "Submitted" : "Missing"
      };
    });

    return { success: true, roster };
  } catch (error) {
    console.error("Failed to fetch faculty roster:", error);
    return { success: false, error: "Failed to load faculty roster from database." };
  }
}

/**
 * Updates a faculty member's profile details.
 */
export async function updateFacultyProfile(userId, data) {
  const { employmentType, maxUnitsPerSem } = data;

  try {
    const updatedProfile = await prisma.facultyProfile.update({
      where: { userId: userId },
      data: {
        employmentType: employmentType,
        maxUnitsPerSem: parseInt(maxUnitsPerSem, 10),
      },
    });

    return { success: true, profile: updatedProfile };
  } catch (error) {
    console.error("Failed to update faculty profile:", error);
    return { success: false, error: "Failed to update profile in database." };
  }
}

/**
 * Deletes a faculty profile. 
 * Note: This deletes the profile metadata but keeps the User account.
 * Will fail if the faculty is assigned to active schedule sections.
 */
export async function deleteFacultyProfile(userId) {
  try {
    const profile = await prisma.facultyProfile.findUnique({
      where: { userId },
      include: { _count: { select: { sections: true } } }
    });

    if (profile && profile._count.sections > 0) {
      return { 
        success: false, 
        error: `Cannot delete profile. This faculty member has ${profile._count.sections} active class section(s) assigned.` 
      };
    }

    // Delete the profile
    await prisma.facultyProfile.delete({
      where: { userId }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete faculty profile:", error);
    return { success: false, error: "Failed to delete profile from database." };
  }
}

/**
 * Saves or updates faculty availability.
 * Implements block merging to reduce database rows.
 */
export async function saveFacultyAvailability(userId, { semester, academicYear, blocks }) {
  try {
    // 1. Find the faculty profile ID
    const profile = await prisma.facultyProfile.findUnique({
      where: { userId }
    });

    if (!profile) return { success: false, error: "Faculty profile not found." };

    // 2. Group blocks by day
    const dayGroups = {};
    blocks.forEach(block => {
      const [day, time] = block.split('-');
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(time);
    });

    // 3. Merging Algorithm: Convert individual 30-min slots into ranges
    const finalRecords = [];
    
    Object.keys(dayGroups).forEach(day => {
      // Sort times (e.g., "08:00", "08:30", "13:00")
      const times = dayGroups[day].sort();
      
      let currentStart = null;
      let lastTime = null;

      times.forEach((time, index) => {
        if (currentStart === null) {
          currentStart = time;
        }

        const [h, m] = time.split(':').map(Number);
        // Calculate the end time of THIS block (30 mins later)
        let nextM = m + 30;
        let nextH = h;
        if (nextM === 60) { nextH += 1; nextM = 0; }
        const currentBlockEnd = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;

        // Check if the NEXT selected time in the array matches currentBlockEnd
        const nextSelectedTime = times[index + 1];
        
        if (nextSelectedTime !== currentBlockEnd) {
          // Gap detected or end of array! Finalize this range.
          // Ensure time strings are 2-digit padded for startTime
          const [startH, startM] = currentStart.split(':');
          const paddedStart = `${startH.padStart(2, '0')}:${startM.padStart(2, '0')}`;

          finalRecords.push({
            facultyId: profile.id,
            semester,
            academicYear: parseInt(academicYear, 10),
            dayOfWeek: day,
            startTime: new Date(`1970-01-01T${paddedStart}:00Z`), 
            endTime: new Date(`1970-01-01T${currentBlockEnd}:00Z`),
            status: "unavailable"
          });
          currentStart = null;
        }
      });
    });

    // 4. Transaction: Clear old records for this period and insert new ones
    await prisma.$transaction([
      prisma.facultyAvailability.deleteMany({
        where: {
          facultyId: profile.id,
          semester,
          academicYear: parseInt(academicYear, 10)
        }
      }),
      prisma.facultyAvailability.createMany({
        data: finalRecords
      })
    ]);

    return { success: true };
  } catch (error) {
    console.error("Failed to save availability:", error);
    return { success: false, error: "Database error while saving availability." };
  }
}

/**
 * Fetches the faculty's saved availability for the specified semester and splits them into 30-min UI blocks.
 * Also returns 'isLocked: true' if the faculty already has courses on the master schedule.
 */
export async function getFacultyAvailability(userId, semester, academicYear) {
  try {
    const profile = await prisma.facultyProfile.findUnique({
      where: { userId }
    });

    if (!profile) return { success: false, error: "Faculty profile not found." };

    // --- LOCK TRIGGER CHECK ---
    // Check if even ONE course has been placed on the master schedule for this faculty
    const existingSchedule = await prisma.sectionSchedule.findFirst({
      where: {
        section: {
          facultyId: profile.id,
          semester,
          academicYear: parseInt(academicYear, 10)
        }
      }
    });

    const isLocked = !!existingSchedule;

    const records = await prisma.facultyAvailability.findMany({
      where: {
        facultyId: profile.id,
        semester,
        academicYear: parseInt(academicYear, 10)
      }
    });

    const blocks = [];

    records.forEach(record => {
      const day = record.dayOfWeek;
      let currentTime = new Date(record.startTime);
      const endTime = new Date(record.endTime);

      while (currentTime < endTime) {
        const hh = String(currentTime.getUTCHours()).padStart(2, '0');
        const mm = String(currentTime.getUTCMinutes()).padStart(2, '0');
        blocks.push(`${day}-${hh}:${mm}`);

        // Add 30 minutes
        currentTime.setUTCMinutes(currentTime.getUTCMinutes() + 30);
      }
    });

    return { success: true, blocks, isLocked };
  } catch (error) {
    console.error("Failed to fetch availability:", error);
    return { success: false, error: "Database error while fetching availability." };
  }
}

/**
 * Fetches profile, assignments, and workload for a specific faculty user.
 */
export async function getFacultyProfileData(userId, semester, academicYear) {
  try {
    const profile = await prisma.facultyProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        sections: {
          where: {
            semester: semester,
            academicYear: parseInt(academicYear, 10)
          },
          include: {
            course: true,
            section: { include: { program: true } },
            schedules: { include: { room: true } }
          }
        }
      }
    });

    if (!profile) return { success: false, error: "Profile not found." };

    // Calculate Workload for the specific period
    const currentWorkload = profile.sections.reduce((sum, s) => sum + (s.course?.units || 0), 0);

    return {
      success: true,
      data: {
        fullName: `${profile.user.firstName} ${profile.user.lastName}`,
        employmentType: profile.employmentType,
        maxUnits: profile.maxUnitsPerSem,
        currentWorkload,
        sections: profile.sections.map(s => ({
          id: s.id,
          courseCode: s.course.code,
          courseTitle: s.course.title,
          programCode: s.section.program.code,
          yearLevel: s.section.yearLevel,
          sectionName: s.section.name,
          sectionCode: `${s.section.program.code} ${s.section.yearLevel}-${s.section.name}`,
          units: s.course.units,
          schedules: s.schedules.map(sch => ({
            day: sch.dayOfWeek,
            startTime: sch.startTime,
            endTime: sch.endTime,
            time: `${formatTime(sch.startTime)} - ${formatTime(sch.endTime)}`,
            room: sch.room ? `${sch.room.building} - ${sch.room.roomNumber}` : "TBA"
          }))
        }))
      }
    };
  } catch (error) {
    console.error("Failed to fetch faculty profile data:", error);
    return { success: false, error: "Database error." };
  }
}

/**
 * Helper to format Prisma DateTime (Time only) to readable string.
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'UTC' 
  });
}

/**
 * Fetches the active schedule for a specific faculty member by User ID.
 */
export async function getFacultyScheduleData(userId) {
  try {
    const { getSystemSettings } = await import('@/app/actions/settings');
    const settingsRes = await getSystemSettings();
    const activeSemester = settingsRes?.settings?.activeSemester || "1st";
    const activeYear = settingsRes?.settings?.activeAcademicYear || 2024;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        facultyProfile: {
          include: {
            sections: {
              where: {
                semester: activeSemester,
                academicYear: activeYear
              },
              include: {
                course: true,
                section: { include: { program: true } },
                schedules: { include: { room: true } }
              }
            }
          }
        }
      }
    });

    if (!user) return { success: false, error: "Faculty not found." };

    // Flatten schedules for the grid
    const schedules = [];
    if (user.facultyProfile && user.facultyProfile.sections) {
      user.facultyProfile.sections.forEach(sec => {
        sec.schedules.forEach(sch => {
          schedules.push({
            id: sch.id,
            courseCode: sec.course.code,
            courseTitle: sec.course.title,
            sectionCode: `${sec.section.program.code} ${sec.section.yearLevel}-${sec.section.name}`,
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
      facultyName: `${user.firstName} ${user.lastName}`,
      activeSemester,
      activeAcademicYear: activeYear,
      schedules
    };
  } catch (error) {
    console.error("Failed to fetch faculty schedule:", error);
    return { success: false, error: "Failed to load faculty schedule." };
  }
}
