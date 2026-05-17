"use server"

import { prisma } from "@/lib/prisma"

/**
 * Fetches all users with the 'faculty' role and their associated profiles.
 * Implements logic to handle missing profiles or departments.
 */
export async function getFacultyRoster() {
  try {
    // Fetch users filtered by role 'faculty'
    const users = await prisma.user.findMany({
      where: { role: "faculty" },
      include: {
        facultyProfile: {
          include: {
            department: true,
            sections: {
              include: {
                course: true
              }
            },
            availabilities: true
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
        fullName: `${user.firstName} ${user.lastName}`,
        employeeId: profile?.employeeId ?? "not assigned yet",
        departmentName: profile?.department?.name ?? "not assigned yet",
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
  const { departmentId, employmentType, maxUnitsPerSem } = data;

  try {
    const updatedProfile = await prisma.facultyProfile.update({
      where: { userId: userId },
      data: {
        departmentId: departmentId || null,
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

