/*
  Warnings:

  - You are about to drop the column `department_id` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `department_id` on the `faculty_profiles` table. All the data in the column will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `college_id` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `college_id` to the `faculty_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_department_id_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_head_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "faculty_profiles" DROP CONSTRAINT "faculty_profiles_department_id_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "department_id",
ADD COLUMN     "college_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "faculty_profiles" DROP COLUMN "department_id",
ADD COLUMN     "college_id" UUID NOT NULL;

-- DropTable
DROP TABLE "departments";

-- CreateTable
CREATE TABLE "colleges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "head_faculty_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");

-- AddForeignKey
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_head_faculty_id_fkey" FOREIGN KEY ("head_faculty_id") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
