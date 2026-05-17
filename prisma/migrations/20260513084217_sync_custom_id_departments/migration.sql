/*
  Warnings:

  - You are about to drop the column `college_id` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `college_id` on the `faculty_profiles` table. All the data in the column will be lost.
  - You are about to drop the `colleges` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `department_id` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `faculty_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "colleges" DROP CONSTRAINT "colleges_head_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_college_id_fkey";

-- DropForeignKey
ALTER TABLE "faculty_profiles" DROP CONSTRAINT "faculty_profiles_college_id_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "college_id",
ADD COLUMN     "department_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "faculty_profiles" DROP COLUMN "college_id",
ADD COLUMN     "department_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "colleges";

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "head_faculty_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_faculty_id_fkey" FOREIGN KEY ("head_faculty_id") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
