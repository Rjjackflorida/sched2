"use server"

import { prisma } from "@/lib/prisma"
import { getSystemSettings } from "@/app/actions/settings"

/**
 * 📈 ROOM UTILIZATION DATA
 */
export async function getRoomUtilizationData() {
  try {
    const settingsRes = await getSystemSettings();
    const semester = settingsRes.settings.activeSemester;
    const year = settingsRes.settings.activeAcademicYear;

    const rooms = await prisma.room.findMany({
      include: {
        schedules: {
          where: {
            section: {
              semester: semester,
              academicYear: year
            }
          }
        }
      }
    });

    return {
      success: true,
      data: rooms.map(room => {
        const totalMinutes = room.schedules.length * 30;
        const totalHours = totalMinutes / 60;
        const weeklyCapacityHours = 70; 
        const utilizationRate = ((totalHours / weeklyCapacityHours) * 100).toFixed(1);

        return {
          roomName: room.name,
          building: room.building,
          type: room.type,
          capacity: room.capacity,
          scheduledHours: totalHours,
          utilization: `${utilizationRate}%`
        };
      })
    };
  } catch (error) {
    console.error("Utilization Data Error:", error);
    return { success: false, error: "Failed to generate utilization metrics." };
  }
}

/**
 * 💼 FACULTY WORKLOAD DATA
 */
export async function getFacultyWorkloadData() {
  try {
    const settingsRes = await getSystemSettings();
    const semester = settingsRes.settings.activeSemester;
    const year = settingsRes.settings.activeAcademicYear;

    const faculty = await prisma.facultyProfile.findMany({
      include: {
        user: true,
        sections: {
          where: {
            semester: semester,
            academicYear: year
          },
          include: {
            course: true
          }
        }
      }
    });

    return {
      success: true,
      data: faculty.map(f => {
        const currentUnits = f.sections.reduce((sum, s) => sum + (s.course?.units || 0), 0);
        const maxUnits = f.maxUnitsPerSem || 18;

        return {
          fullName: `${f.user.firstName} ${f.user.lastName}`,
          employeeId: f.employeeId,
          type: f.employmentType,
          currentUnits: currentUnits,
          maxUnits: maxUnits,
          status: currentUnits > maxUnits ? "Overload" : currentUnits === maxUnits ? "Full" : "Available"
        };
      })
    };
  } catch (error) {
    console.error("Workload Data Error:", error);
    return { success: false, error: "Failed to generate workload metrics." };
  }
}

/**
 * 🏆 MASTER CAMPUS SCHEDULE
 */
export async function getMasterScheduleData() {
  try {
    const settingsRes = await getSystemSettings();
    const semester = settingsRes.settings.activeSemester;
    const year = settingsRes.settings.activeAcademicYear;

    const schedules = await prisma.sectionSchedule.findMany({
      where: {
        section: {
          semester: semester,
          academicYear: year
        }
      },
      include: {
        room: true,
        section: {
          include: {
            course: true,
            section: { include: { program: true } },
            faculty: { include: { user: true } }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return {
      success: true,
      data: schedules.map(s => {
        const formatT = (date) => date.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' 
        });

        return {
          "Day": s.dayOfWeek,
          "Time Slot": `${formatT(s.startTime)} - ${formatT(s.endTime)}`,
          "Room": s.room ? `${s.room.building} - ${s.room.roomNumber}` : "TBA",
          "Course": `${s.section.course.code}: ${s.section.course.title}`,
          "Section": `${s.section.section.program.code} ${s.section.section.yearLevel}-${s.section.section.name}`,
          "Instructor": s.section.faculty ? `${s.section.faculty.user.firstName} ${s.section.faculty.user.lastName}` : "TBA",
          "Units": s.section.course.units
        };
      })
    };
  } catch (error) {
    console.error("Master Schedule Error:", error);
    return { success: false, error: "Failed to fetch master schedule data." };
  }
}

/**
 * 👨‍🏫 FACULTY BATCH SCHEDULE DATA
 * Returns a teaching-focused list of assignments, sorted by instructor.
 */
export async function getFacultyBatchScheduleData() {
  try {
    const settingsRes = await getSystemSettings();
    const semester = settingsRes.settings.activeSemester;
    const year = settingsRes.settings.activeAcademicYear;

    const schedules = await prisma.sectionSchedule.findMany({
      where: {
        section: {
          semester: semester,
          academicYear: year
        }
      },
      include: {
        room: true,
        section: {
          include: {
            course: true,
            section: { include: { program: true } },
            faculty: { include: { user: true } }
          }
        }
      },
      orderBy: [
        { section: { faculty: { user: { lastName: 'asc' } } } },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return {
      success: true,
      data: schedules.map(s => {
        const formatT = (date) => date.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' 
        });

        return {
          "Instructor": s.section.faculty ? `${s.section.faculty.user.firstName} ${s.section.faculty.user.lastName}` : "UNASSIGNED",
          "Employee ID": s.section.faculty?.employeeId || "N/A",
          "Day": s.dayOfWeek,
          "Time Slot": `${formatT(s.startTime)} - ${formatT(s.endTime)}`,
          "Course Code": s.section.course.code,
          "Course Title": s.section.course.title,
          "Units": s.section.course.units,
          "Section": `${s.section.section.program.code} ${s.section.section.yearLevel}-${s.section.section.name}`,
          "Room": s.room ? `${s.room.building} - ${s.room.roomNumber}` : "TBA"
        };
      })
    };
  } catch (error) {
    console.error("Faculty Batch Error:", error);
    return { success: false, error: "Failed to generate faculty batch report." };
  }
}
