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
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role,
        passwordHash,
        isActive: true,
      },
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        fullName: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      }
    };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "Failed to create user due to a database error." };
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
 * Toggles a user's active/inactive status.
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

