"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return {
      success: true,
      users: users.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
      }))
    };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { success: false, error: "Failed to fetch users from database." };
  }
}

export async function createUser(data) {
  const { firstName, lastName, email, role, password } = data;

  if (!firstName || !lastName || !email || !role || !password) {
    return { success: false, error: "All fields are required." };
  }

  try {
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    // Hash the password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user in the database
    // Using a transaction to ensure User and FacultyProfile are created together
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          role,
          passwordHash,
          isActive: true,
        },
      });

      // If user is faculty, automatically create a profile with a sequential ID
      if (role === "faculty") {
        // 1. Find the highest existing Employee ID to determine the next in sequence
        const lastProfile = await tx.facultyProfile.findFirst({
          where: { employeeId: { startsWith: "FCLT-" } },
          orderBy: { employeeId: "desc" },
        });

        let nextIdNumber = 1;
        if (lastProfile && lastProfile.employeeId) {
          // Extract the number from FCLT-0001
          const lastIdPart = lastProfile.employeeId.split("-")[1];
          nextIdNumber = parseInt(lastIdPart, 10) + 1;
        }

        // Format the new ID as FCLT-XXXX (e.g., FCLT-0005)
        const formattedId = `FCLT-${String(nextIdNumber).padStart(4, '0')}`;

        // 2. Create the Faculty Profile row
        await tx.facultyProfile.create({
          data: {
            user: { connect: { id: newUser.id } },
            employeeId: formattedId,
            // Other fields (designation, etc.) remain null as requested
          }
        });
      }

      return newUser;
    });

    return {
      success: true,
      user: {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        fullName: `${result.firstName} ${result.lastName}`,
        email: result.email,
        role: result.role,
        isActive: result.isActive,
      }
    };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "Failed to create user due to a database error." };
  }
}

/**
 * Deletes a user and their associated data from the database.
 */
export async function deleteUser(userId) {
  try {
    // Note: FacultyProfile and other relations will be handled by 'onDelete: Cascade' in schema
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user from database." };
  }
}


/**
 * Updates an existing user's details.
 * If password is provided, it hashes and updates it.
 */
export async function updateUser(userId, data) {
  const { firstName, lastName, email, role, password } = data;

  if (!firstName || !lastName || !email || !role) {
    return { success: false, error: "Required fields are missing." };
  }

  try {
    const updateData = {
      firstName,
      lastName,
      email,
      role,
    };

    // Only update password if a new one is provided
    if (password && password.trim() !== "") {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: "Failed to update user. Check if email is unique." };
  }
}

/**
 * Fetches profile details for a specific user.
 */
export async function getUserProfile(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return { success: false, error: "User not found." };

    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      }
    };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return { success: false, error: "Database error." };
  }
}

/**
 * Updates a user's active/inactive status.
 */
export async function toggleUserStatus(userId, currentStatus) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !currentStatus },
    });

    return {
      success: true,
      isActive: updatedUser.isActive
    };
  } catch (error) {
    console.error("Failed to toggle status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

