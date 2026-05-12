import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/sched2"

const globalForPrisma = globalThis

let prismaClient;

if (globalForPrisma.prisma) {
  prismaClient = globalForPrisma.prisma;
} else {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  prismaClient = new PrismaClient({ adapter })
}

export const prisma = prismaClient

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient
