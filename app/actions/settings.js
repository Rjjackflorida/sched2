"use server"

import { prisma } from "@/lib/prisma"

/**
 * Fetches the global system settings.
 * Creates a default record if none exists.
 */
export async function getSystemSettings() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: "global" }
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: "global",
          activeSemester: "1st",
          activeAcademicYear: new Date().getFullYear(),
        }
      });
    }

    return { success: true, settings };
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return { success: false, error: "Database error while fetching settings." };
  }
}

/**
 * Updates the global system settings.
 */
export async function updateSystemSettings(data) {
  const { activeSemester, activeAcademicYear } = data;

  try {
    const settings = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: {
        activeSemester,
        activeAcademicYear: parseInt(activeAcademicYear, 10),
      },
      create: {
        id: "global",
        activeSemester,
        activeAcademicYear: parseInt(activeAcademicYear, 10),
      }
    });

    return { success: true, settings };
  } catch (error) {
    console.error("Failed to update system settings:", error);
    return { success: false, error: "Database error while updating settings." };
  }
}
