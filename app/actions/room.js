"use server"

import { prisma } from "@/lib/prisma"
import { verifyAdmin } from "@/lib/session"

/**
 * Fetches all rooms from the database.
 */
export async function getRooms() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, rooms };
  } catch (error) {
    console.error("Failed to fetch rooms:", error);
    return { success: false, error: "Failed to load rooms." };
  }
}



/**
 * Creates a new room in the database.
 */
export async function createRoom(data) {
  const { name, type, capacity, building, roomNumber } = data;

  if (!name || !type || !capacity || !building || !roomNumber) {
    return { success: false, error: "All fields are required." };
  }

  // Validate room number is numeric and max 5 digits
  if (!/^\d{1,5}$/.test(roomNumber)) {
    return { success: false, error: "Room number must be a numeric value with a maximum of 5 digits." };
  }

  try {
    await verifyAdmin();
    const newRoom = await prisma.room.create({
      data: {
        name,
        building,
        capacity: parseInt(capacity, 10),
        type,
        isActive: true,
      },
    });

    return { success: true, room: newRoom };
  } catch (error) {
    console.error("Failed to create room:", error);
    return { success: false, error: "Failed to create room in database." };
  }
}

/**
 * Updates an existing room.
 */
export async function updateRoom(id, data) {
  const { name, type, capacity, building, roomNumber } = data;

  if (!name || !type || !capacity || !building || !roomNumber) {
    return { success: false, error: "All fields are required." };
  }

  try {
    await verifyAdmin();
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name,
        building,
        capacity: parseInt(capacity, 10),
        type,
      },
    });

    return { success: true, room: updatedRoom };
  } catch (error) {
    console.error("Failed to update room:", error);
    return { success: false, error: "Failed to update room in database." };
  }
}

/**
 * Deletes a room from the database.
 * Will fail if course sections are scheduled in this room.
 */
export async function deleteRoom(id) {
  try {
    await verifyAdmin();
    const room = await prisma.room.findUnique({
      where: { id },
      include: { _count: { select: { schedules: true } } }
    });

    if (room && room._count.schedules > 0) {
      return { 
        success: false, 
        error: `Cannot delete room. It has ${room._count.schedules} section(s) scheduled in it.` 
      };
    }

    await prisma.room.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete room:", error);
    return { success: false, error: "Failed to delete room from database." };
  }
}

/**
 * Fetches the active schedule for a specific room.
 */
export async function getRoomScheduleData(roomId) {
  try {
    const { getSystemSettings } = await import('@/app/actions/settings');
    const settingsRes = await getSystemSettings();
    const activeSemester = settingsRes?.settings?.activeSemester || "1st";
    const activeYear = settingsRes?.settings?.activeAcademicYear || 2024;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        schedules: {
          where: {
            section: {
              semester: activeSemester,
              academicYear: activeYear
            }
          },
          include: {
            section: {
              include: {
                course: true,
                section: { include: { program: true } },
                faculty: { include: { user: true } }
              }
            }
          }
        }
      }
    });

    if (!room) return { success: false, error: "Room not found." };

    return { 
      success: true, 
      roomName: room.building ? `${room.building} - ${room.roomNumber || room.name}` : (room.roomNumber || room.name),
      activeSemester,
      activeAcademicYear: activeYear,
      schedules: room.schedules.map(sch => ({
        id: sch.id,
        courseCode: sch.section.course.code,
        courseTitle: sch.section.course.title,
        sectionCode: `${sch.section.section.program.code} ${sch.section.section.yearLevel}-${sch.section.section.name}`,
        instructor: sch.section.faculty ? `${sch.section.faculty.user.firstName} ${sch.section.faculty.user.lastName}` : "UNASSIGNED",
        day: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
      }))
    };
  } catch (error) {
    console.error("Failed to fetch room schedule:", error);
    return { success: false, error: "Failed to load room schedule." };
  }
}
