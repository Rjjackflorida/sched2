"use server"

import { prisma } from "@/lib/prisma"
import { createSession, deleteSession } from "@/lib/session"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function login(prevState, formData) {
  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  let user = null;

  // 1. Hardcoded MVP Credentials Bypass
  if (email === "admin@university.edu" && password === "password123") {
    user = { id: "admin-1", role: "admin" }
  } else if (email === "faculty@university.edu" && password === "password123") {
    user = { id: "faculty-1", role: "faculty" }
  } else {
    // 2. Database Auth
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email },
      })

      if (!dbUser || !dbUser.isActive) {
        return { error: "Invalid credentials or inactive account." }
      }

      // Verify password
      const isValid = await bcrypt.compare(password, dbUser.passwordHash)
      if (!isValid) {
        return { error: "Invalid credentials." }
      }
      
      user = dbUser;
    } catch (e) {
      console.error("Database connection failed:", e);
      return { error: "Database not connected. For MVP, please use admin@university.edu or faculty@university.edu with password123." }
    }
  }

  // Create session
  await createSession(user.id, user.role)

  // Redirect based on role
  if (user.role === "admin") {
    redirect("/")
  } else {
    redirect("/faculty-portal")
  }
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
