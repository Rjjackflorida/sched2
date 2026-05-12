-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'faculty',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "college" TEXT,
    "head_faculty_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "employee_id" TEXT,
    "designation" TEXT,
    "employment_type" TEXT DEFAULT 'full_time',
    "max_units_per_sem" INTEGER DEFAULT 18,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculty_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "department_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_availability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "faculty_id" UUID NOT NULL,
    "semester" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculty_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "building" TEXT,
    "capacity" INTEGER,
    "type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL,
    "faculty_id" UUID,
    "room_id" UUID,
    "section_code" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "start_time" TIME,
    "end_time" TIME,
    "max_students" INTEGER,
    "status" TEXT DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_user_id_key" ON "faculty_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_employee_id_key" ON "faculty_profiles"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_availability_faculty_id_semester_academic_year_day__key" ON "faculty_availability"("faculty_id", "semester", "academic_year", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_course_id_section_code_semester_academic_ye_key" ON "course_sections"("course_id", "section_code", "semester", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_faculty_id_day_of_week_start_time_end_time__key" ON "course_sections"("faculty_id", "day_of_week", "start_time", "end_time", "semester", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_room_id_day_of_week_start_time_end_time_sem_key" ON "course_sections"("room_id", "day_of_week", "start_time", "end_time", "semester", "academic_year");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_faculty_id_fkey" FOREIGN KEY ("head_faculty_id") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_availability" ADD CONSTRAINT "faculty_availability_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
