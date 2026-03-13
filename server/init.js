import bcrypt from "bcryptjs";
import { db } from "./db.js";

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','faculty','student')),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('Curricular','Extra-curricular')),
      category TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      location TEXT,
      description TEXT,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_participation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Registered','Attended','Absent','Cancelled')),
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      attendance_marked_by_user_id INTEGER,
      attendance_marked_at TEXT,
      UNIQUE(event_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      student_no TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      program TEXT,
      year_level INTEGER,
      section TEXT,
      section_id INTEGER,
      enrollment_status TEXT,
      academic_status TEXT,
      gpa REAL,
      height_cm REAL,
      weight_kg REAL,
      sports_interest_json TEXT NOT NULL DEFAULT '[]',
      medical_clearance_status TEXT,
      medical_notes TEXT,
      employment_status TEXT,
      company TEXT,
      position TEXT,
      internship_status TEXT,
      skills_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER,
      uploaded_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      faculty_no TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      rank TEXT,
      status TEXT,
      field TEXT,
      degree TEXT,
      institution TEXT,
      year_graduated INTEGER,
      skills_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      abbr TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS organization_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      role TEXT,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(organization_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      recorded_by_user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Pending','Sanctioned','Resolved')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      recorded_by_user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      event TEXT,
      type TEXT NOT NULL CHECK (type IN ('School','Outside')),
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS academic_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      units REAL,
      program TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(code)
    );

    CREATE TABLE IF NOT EXISTS course_prerequisites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      prerequisite_course_id INTEGER NOT NULL,
      UNIQUE(course_id, prerequisite_course_id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name)
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL CHECK (day_of_week IN (1,2,3,4,5,6,7)),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      program TEXT,
      year_level INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name)
    );

    CREATE TABLE IF NOT EXISTS schedule_offerings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      room_id INTEGER,
      time_slot_id INTEGER,
      faculty_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(term_id, course_id, section_id, time_slot_id)
    );

    CREATE TABLE IF NOT EXISTS instruction_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term_id INTEGER,
      course_id INTEGER,
      offering_id INTEGER,
      title TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('Syllabus','Lesson','Resource')),
      description TEXT,
      original_name TEXT,
      stored_name TEXT,
      mime_type TEXT,
      size_bytes INTEGER,
      uploaded_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS curriculum_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(program, name)
    );

    CREATE TABLE IF NOT EXISTS curriculum_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curriculum_version_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(curriculum_version_id, name)
    );

    CREATE TABLE IF NOT EXISTS curriculum_term_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curriculum_term_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      UNIQUE(curriculum_term_id, course_id)
    );
  `);

  // Role migration: remove 'staff' role (remap to 'admin')
  try {
    const currentUserTableSql = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
      .get()?.sql;
    const hasStaffInConstraint = typeof currentUserTableSql === "string" && currentUserTableSql.includes("'staff'");
    if (hasStaffInConstraint) {
      db.exec(`
        ALTER TABLE users RENAME TO users_old;
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin','faculty','student')),
          active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
          last_login_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      const oldUserCols = db.prepare("PRAGMA table_info(users_old)").all().map((c) => c.name);
      const selectCols = ["id", "username", "password_hash", "role", "created_at"]
        .concat(oldUserCols.includes("active") ? ["active"] : [])
        .concat(oldUserCols.includes("last_login_at") ? ["last_login_at"] : []);
      const oldUsers = db.prepare(`SELECT ${selectCols.join(", ")} FROM users_old`).all();
      const insertUser = db.prepare(
        "INSERT INTO users (id, username, password_hash, role, active, last_login_at, created_at) VALUES (@id, @username, @password_hash, @role, @active, @last_login_at, @created_at)"
      );
      const insertMany = db.transaction((rows) => {
        for (const r of rows) {
          insertUser.run({
            ...r,
            role: r.role === "staff" ? "admin" : r.role,
            active: typeof r.active === "number" ? r.active : 1,
            last_login_at: r.last_login_at ?? null,
          });
        }
      });
      insertMany(oldUsers);
      db.exec("DROP TABLE users_old");
    } else {
      db.prepare("UPDATE users SET role = 'admin' WHERE role = 'staff'").run();
    }
  } catch {
    // ignore migration failures; app will still enforce roles via authorization
  }

  // Lightweight migrations for existing DBs
  const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!userCols.includes("active")) {
    db.exec("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))");
  }
  if (!userCols.includes("last_login_at")) {
    db.exec("ALTER TABLE users ADD COLUMN last_login_at TEXT");
  }

  const studentCols = db.prepare("PRAGMA table_info(students)").all().map((c) => c.name);
  if (!studentCols.includes("user_id")) {
    db.exec("ALTER TABLE students ADD COLUMN user_id INTEGER");
  }
  if (!studentCols.includes("section_id")) {
    db.exec("ALTER TABLE students ADD COLUMN section_id INTEGER");
  }
  const studentExtraCols = [
    "gpa",
    "height_cm",
    "weight_kg",
    "sports_interest_json",
    "medical_clearance_status",
    "medical_notes",
    "employment_status",
    "company",
    "position",
    "internship_status",
  ];
  for (const col of studentExtraCols) {
    if (!studentCols.includes(col)) {
      if (col === "sports_interest_json") {
        db.exec("ALTER TABLE students ADD COLUMN sports_interest_json TEXT NOT NULL DEFAULT '[]'");
      } else if (col === "gpa") {
        db.exec("ALTER TABLE students ADD COLUMN gpa REAL");
      } else if (col === "height_cm" || col === "weight_kg") {
        db.exec(`ALTER TABLE students ADD COLUMN ${col} REAL`);
      } else {
        db.exec(`ALTER TABLE students ADD COLUMN ${col} TEXT`);
      }
    }
  }
  const facultyCols = db.prepare("PRAGMA table_info(faculty)").all().map((c) => c.name);
  if (!facultyCols.includes("user_id")) {
    db.exec("ALTER TABLE faculty ADD COLUMN user_id INTEGER");
  }

  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  if (userCount === 0) {
    const insert = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");

    insert.run("admin", bcrypt.hashSync("admin123", 10), "admin");
    insert.run("faculty", bcrypt.hashSync("faculty123", 10), "faculty");
    insert.run("student", bcrypt.hashSync("student123", 10), "student");
  }

  const studentCount = db.prepare("SELECT COUNT(*) as c FROM students").get().c;
  if (studentCount === 0) {
    const insertStudent = db.prepare(
      "INSERT INTO students (student_no, first_name, last_name, email, program, year_level, section, enrollment_status, academic_status, skills_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    insertStudent.run("2024-0001", "Juan", "Dela Cruz", "juan@pnc.edu.ph", "BSIT", 3, "A", "Enrolled", "Good Standing", JSON.stringify(["Java", "Python", "React"]));
    insertStudent.run("2024-0002", "Maria", "Santos", "maria@pnc.edu.ph", "BSCS", 2, "B", "Enrolled", "Good Standing", JSON.stringify(["C++", "Machine Learning"]));
    insertStudent.run("2024-0003", "Pedro", "Reyes", "pedro@pnc.edu.ph", "BSIT", 4, "A", "Enrolled", "Probation", JSON.stringify(["Networking", "Linux"]));
  }

  const facultyCount = db.prepare("SELECT COUNT(*) as c FROM faculty").get().c;
  if (facultyCount === 0) {
    const insertFaculty = db.prepare(
      "INSERT INTO faculty (faculty_no, name, rank, status, field, degree, institution, year_graduated, skills_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    insertFaculty.run("FAC-001", "Dr. Elena Rivera", "Professor III", "Active", "Data Science", "PhD Computer Science", "UP Diliman", 2015, JSON.stringify(["Python", "R", "ML"]));
    insertFaculty.run("FAC-002", "Engr. Mark Villanueva", "Instructor I", "Active", "Software Engineering", "MS Computer Science", "DLSU", 2019, JSON.stringify(["Java", "Spring Boot"]));
  }

  const termCount = db.prepare("SELECT COUNT(*) as c FROM academic_terms").get().c;
  if (termCount === 0) {
    db.prepare("INSERT INTO academic_terms (name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)")
      .run("AY 2025-2026 | 2nd Semester", "2025-11-01", "2026-03-31");
  }

  // Link demo accounts to demo profiles when possible
  const studentUser = db.prepare("SELECT id FROM users WHERE username = ?").get("student")?.id;
  if (studentUser) {
    db.prepare("UPDATE students SET user_id = ? WHERE student_no = ? AND (user_id IS NULL OR user_id = '')").run(studentUser, "2024-0001");
  }
  const facultyUser = db.prepare("SELECT id FROM users WHERE username = ?").get("faculty")?.id;
  if (facultyUser) {
    db.prepare("UPDATE faculty SET user_id = ? WHERE faculty_no = ? AND (user_id IS NULL OR user_id = '')").run(facultyUser, "FAC-001");
  }

  // Seed organizations + memberships + sample violations/achievements
  const orgCount = db.prepare("SELECT COUNT(*) as c FROM organizations").get().c;
  if (orgCount === 0) {
    const insertOrg = db.prepare("INSERT INTO organizations (name, abbr) VALUES (?, ?)");
    insertOrg.run("CCS Student Council", "CSG");
    insertOrg.run("IT Society", "ITS");
  }

  const memberCount = db.prepare("SELECT COUNT(*) as c FROM organization_members").get().c;
  if (memberCount === 0) {
    const juan = db.prepare("SELECT id FROM students WHERE student_no = ?").get("2024-0001")?.id;
    const maria = db.prepare("SELECT id FROM students WHERE student_no = ?").get("2024-0002")?.id;
    const csg = db.prepare("SELECT id FROM organizations WHERE abbr = ?").get("CSG")?.id;
    const its = db.prepare("SELECT id FROM organizations WHERE abbr = ?").get("ITS")?.id;
    const insertMem = db.prepare("INSERT OR IGNORE INTO organization_members (organization_id, student_id, role) VALUES (?, ?, ?)");
    if (juan && csg) insertMem.run(csg, juan, "Member");
    if (maria && its) insertMem.run(its, maria, "Member");
  }

  const vCount = db.prepare("SELECT COUNT(*) as c FROM violations").get().c;
  if (vCount === 0) {
    const adminId = db.prepare("SELECT id FROM users WHERE username = ?").get("admin")?.id;
    const facultyId = db.prepare("SELECT id FROM users WHERE username = ?").get("faculty")?.id;
    const pedro = db.prepare("SELECT id FROM students WHERE student_no = ?").get("2024-0003")?.id;
    if (adminId && facultyId && pedro) {
      db.prepare("INSERT INTO violations (student_id, recorded_by_user_id, type, description, date, status) VALUES (?, ?, ?, ?, ?, ?)")
        .run(pedro, facultyId, "Academic Dishonesty", "Caught cheating during midterm exam", "2026-02-15", "Pending");
    }
  }

  const aCount = db.prepare("SELECT COUNT(*) as c FROM achievements").get().c;
  if (aCount === 0) {
    const facultyId = db.prepare("SELECT id FROM users WHERE username = ?").get("faculty")?.id;
    const maria = db.prepare("SELECT id FROM students WHERE student_no = ?").get("2024-0002")?.id;
    if (facultyId && maria) {
      db.prepare("INSERT INTO achievements (student_id, recorded_by_user_id, title, event, type, date) VALUES (?, ?, ?, ?, ?, ?)")
        .run(maria, facultyId, "Best Research Paper", "CCS Research Colloquium 2026", "School", "2026-02-20");
    }
  }

  const eventCount = db.prepare("SELECT COUNT(*) as c FROM events").get().c;
  if (eventCount === 0) {
    const adminId = db.prepare("SELECT id FROM users WHERE username = ?").get("admin")?.id;
    const insertEvent = db.prepare(
      "INSERT INTO events (title, kind, category, start_date, end_date, location, description, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    insertEvent.run(
      "CCS Hackathon",
      "Extra-curricular",
      "Hackathon",
      "2026-03-20",
      "2026-03-20",
      "CCS Lab",
      "Team programming competition",
      adminId ?? null,
    );
    insertEvent.run(
      "Programming Contest Qualifiers",
      "Curricular",
      "Programming Contest",
      "2026-04-05",
      "2026-04-05",
      "Main Auditorium",
      "Internal qualifiers for inter-college contest",
      adminId ?? null,
    );
  }
}
