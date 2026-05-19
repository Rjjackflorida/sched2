"use server"

import { prisma } from "@/lib/prisma"

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
 * Generates a room name based on Type and Room Number.
 * Formula: Type(first word, without vowels) + "-" + Room number
 */
function generateRoomName(type, roomNumber) {
  const firstWord = type.split(' ')[0];
  const prefix = firstWord.replace(/[aeiouAEIOU]/g, '').toUpperCase();
  return `${prefix}-${roomNumber}`;
}

/**
 * Creates a new room in the database.
 */
export async function createRoom(data) {
  const { type, capacity, building, roomNumber } = data;

  if (!type || !capacity || !building || !roomNumber) {
    return { success: false, error: "All fields are required." };
  }

  // Validate room number is numeric and max 5 digits
  if (!/^\d{1,5}$/.test(roomNumber)) {
    return { success: false, error: "Room number must be a numeric value with a maximum of 5 digits." };
  }

  const generatedName = generateRoomName(type, roomNumber);

  try {
    const newRoom = await prisma.room.create({
      data: {
        name: generatedName,
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
  const { type, capacity, building, roomNumber } = data;

  if (!type || !capacity || !building || !roomNumber) {
    return { success: false, error: "All fields are required." };
  }

  // Formula for name update
  const firstWord = type.split(' ')[0];
  const prefix = firstWord.replace(/[aeiouAEIOU]/g, '').toUpperCase();
  const generatedName = `${prefix}-${roomNumber}`;

  try {
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name: generatedName,
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
