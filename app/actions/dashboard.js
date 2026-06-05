"use server"

import { prisma } from "@/lib/prisma"
import { getSystemSettings } from "./settings"

export async function getDashboardStats() {
  try {
    // Get active term
    const settingsRes = await getSystemSettings()
    const activeSemester = settingsRes.settings?.activeSemester || "1st"
    const activeYear = settingsRes.settings?.activeAcademicYear || 2024

    // 1. Unscheduled Sections
    const allSections = await prisma.courseSection.findMany({
      where: { semester: activeSemester, academicYear: activeYear },
      include: {
        _count: { select: { schedules: true } },
        course: true,
        section: { include: { program: true } }
      }
    })

    const unscheduledSections = allSections.filter(s => s._count.schedules === 0)
    const unscheduledCount = unscheduledSections.length

    // 2. Faculty Readiness
    const totalFaculty = await prisma.facultyProfile.count()
    
    // Get distinct faculty IDs who have submitted availability for this term
    const availabilityRecords = await prisma.facultyAvailability.findMany({
      where: { semester: activeSemester, academicYear: activeYear },
      select: { facultyId: true },
      distinct: ['facultyId']
    })
    const readyFacultyCount = availabilityRecords.length

    // 3. Total Scheduled (Count of section schedules for the active term)
    const totalScheduled = await prisma.sectionSchedule.count({
      where: {
        section: { semester: activeSemester, academicYear: activeYear }
      }
    })

    // 4. Recent Assignments (last 5 schedules)
    const recentSchedules = await prisma.sectionSchedule.findMany({
      where: {
        section: { semester: activeSemester, academicYear: activeYear }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        section: {
          include: {
            course: true,
            section: { include: { program: true } }
          }
        },
        room: true
      }
    })

    return {
      success: true,
      activeTerm: `${activeSemester} Semester ${activeYear}-${activeYear + 1}`,
      stats: {
        unscheduledCount,
        totalFaculty,
        readyFacultyCount,
        totalScheduled
      },
      unscheduledList: unscheduledSections.slice(0, 5).map(s => ({
        id: s.id,
        courseCode: s.course.code,
        courseTitle: s.course.title,
        programCode: s.section.program.code,
        yearLevel: s.section.yearLevel,
        sectionName: s.section.name
      })),
      recentSchedules: recentSchedules.map(s => ({
        id: s.id,
        courseCode: s.section.course.code,
        roomName: s.room ? (s.room.building ? `${s.room.building} - ${s.room.roomNumber || s.room.name}` : (s.room.roomNumber || s.room.name)) : 'TBA',
        dayOfWeek: s.dayOfWeek,
        createdAt: s.createdAt
      }))
    }

  } catch (error) {
    console.error("Dashboard Stats Error:", error)
    return { success: false, error: error.message }
  }
}
