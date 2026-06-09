import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secretKey = process.env.SESSION_SECRET

if (!secretKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL SECURITY ERROR: SESSION_SECRET environment variable must be set in production.")
  } else {
    console.warn("⚠️ WARNING: No SESSION_SECRET found. Using insecure fallback for local development only.")
  }
}

const encodedKey = new TextEncoder().encode(secretKey || "development_fallback_secret_key")

export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(session) {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    return null
  }
}

export async function createSession(userId, role) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, expiresAt })

  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "strict",
    path: "/",
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value
  if (!session) return null
  return await decrypt(session)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function verifyAdmin() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized: Admin access required.")
  }
  return session
}
