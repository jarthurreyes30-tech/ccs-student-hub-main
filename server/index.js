import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "./db.js";
import { initDb } from "./init.js";
import { requireAuth, requireRole, signToken } from "./auth.js";

initDb();

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

const uploadsDir = path.join(process.cwd(), "server", "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
}

const upload = multer({ dest: uploadsDir });

function getRequestIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress ?? null;
}

function logActivity({ actorUserId, action, targetUserId, ip }) {
  try {
    db.prepare(
      "INSERT INTO activity_logs (actor_user_id, action, target_user_id, ip) VALUES (?, ?, ?, ?)"
    ).run(actorUserId ?? null, action, targetUserId ?? null, ip ?? null);
  } catch {
    // ignore logging failures
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ message: "Missing username/password" });

  const user = db
    .prepare("SELECT id, username, password_hash, role, active FROM users WHERE username = ?")
    .get(username);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  if (user.active === 0) return res.status(403).json({ message: "Account is deactivated" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  try {
    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
  } catch {
    // ignore
  }

  const token = signToken({ sub: user.id, username: user.username, role: user.role });
  logActivity({ actorUserId: user.id, action: "login", targetUserId: user.id, ip: getRequestIp(req) });
  return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Admin: user management
app.get("/api/admin/users", requireAuth, requireRole(["admin"]), (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const role = String(req.query.role ?? "").trim();
  const active = String(req.query.active ?? "").trim();

  const where = [];
  const params = {};
  if (q) {
    where.push("lower(username) LIKE @q");
    params.q = `%${q}%`;
  }
  if (role && ["admin", "faculty", "student"].includes(role)) {
    where.push("role = @role");
    params.role = role;
  }
  if (active === "0" || active === "1") {
    where.push("active = @active");
    params.active = Number(active);
  }

  const sql = `SELECT id, username, role, active, last_login_at, created_at FROM users${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC`;
  const rows = db.prepare(sql).all(params);
  return res.json({ data: rows });
});

app.post("/api/admin/users", requireAuth, requireRole(["admin"]), (req, res) => {
  const { username, password, role } = req.body ?? {};
  const safeRole = ["admin", "faculty", "student"].includes(role) ? role : null;
  if (!username || !password || !safeRole) {
    return res.status(400).json({ message: "Missing username/password/role" });
  }

  try {
    const info = db
      .prepare("INSERT INTO users (username, password_hash, role, active) VALUES (?, ?, ?, 1)")
      .run(String(username).trim(), bcrypt.hashSync(String(password), 10), safeRole);
    logActivity({ actorUserId: req.user.sub, action: `admin.user.create:${safeRole}`, targetUserId: info.lastInsertRowid, ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create user" });
  }
});

app.get("/api/materials", requireAuth, (req, res) => {
  const termId = Number(req.query.term_id);
  const courseId = Number(req.query.course_id);
  const offeringId = Number(req.query.offering_id);
  const kind = String(req.query.kind ?? "").trim();

  const where = [];
  const params = {};
  if (Number.isFinite(termId)) {
    where.push("m.term_id = @termId");
    params.termId = termId;
  }
  if (Number.isFinite(courseId)) {
    where.push("m.course_id = @courseId");
    params.courseId = courseId;
  }
  if (Number.isFinite(offeringId)) {
    where.push("m.offering_id = @offeringId");
    params.offeringId = offeringId;
  }
  if (kind && ["Syllabus", "Lesson", "Resource"].includes(kind)) {
    where.push("m.kind = @kind");
    params.kind = kind;
  }

  const rows = db
    .prepare(
      `SELECT m.id, m.term_id, t.name as term_name, m.course_id, c.code as course_code, c.title as course_title,
              m.offering_id, m.title, m.kind, m.description,
              m.original_name, m.stored_name, m.mime_type, m.size_bytes,
              m.uploaded_by_user_id, u.username as uploaded_by_username, m.created_at
       FROM instruction_materials m
       LEFT JOIN academic_terms t ON t.id = m.term_id
       LEFT JOIN courses c ON c.id = m.course_id
       LEFT JOIN users u ON u.id = m.uploaded_by_user_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY m.id DESC`
    )
    .all(params);
  return res.json({ data: rows });
});

app.get("/api/my/documents", requireAuth, requireRole(["student"]), (req, res) => {
  const me = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.sub);
  if (!me) return res.status(404).json({ message: "Student profile not linked" });
  const rows = db
    .prepare(
      "SELECT id, kind, original_name, stored_name, mime_type, size_bytes, created_at FROM student_documents WHERE student_id = ? ORDER BY id DESC"
    )
    .all(me.id);
  return res.json({ data: rows });
});

app.get("/api/faculty/student-search", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (!q) return res.json({ data: [] });
  const rows = db
    .prepare(
      `SELECT student_no, first_name, last_name, program, year_level, section, academic_status
       FROM students
       WHERE lower(first_name) LIKE @q OR lower(last_name) LIKE @q OR student_no LIKE @q
       ORDER BY last_name, first_name
       LIMIT 20`
    )
    .all({ q: `%${q}%` });
  return res.json({ data: rows });
});

app.get("/api/reports/basketball-tryouts", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const minHeight = Number(req.query.min_height_cm ?? 170);
  const requireClearance = String(req.query.require_clearance ?? "1") !== "0";
  const sport = String(req.query.sport ?? "basketball").trim().toLowerCase();

  const rows = db
    .prepare(
      `SELECT s.student_no, s.first_name, s.last_name, s.program, s.year_level, s.section,
              s.height_cm, s.weight_kg, s.medical_clearance_status, s.sports_interest_json,
              (SELECT COUNT(*) FROM violations v WHERE v.student_id = s.id AND v.status = 'Pending') as pending_violations
       FROM students s
       WHERE (s.height_cm IS NOT NULL AND s.height_cm >= @minHeight)
         ${requireClearance ? "AND ifnull(s.medical_clearance_status,'') = 'Cleared'" : ""}
       ORDER BY s.last_name, s.first_name`
    )
    .all({ minHeight: Number.isFinite(minHeight) ? minHeight : 170 });

  const filtered = rows.filter((r) => {
    try {
      const sports = JSON.parse(r.sports_interest_json ?? "[]");
      const list = Array.isArray(sports) ? sports.map((x) => String(x).toLowerCase()) : [];
      return list.includes(sport);
    } catch {
      return false;
    }
  }).filter((r) => (r.pending_violations ?? 0) === 0);

  return res.json({ data: filtered });
});

app.get("/api/reports/programming-contest", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const maxGpa = Number(req.query.max_gpa ?? 2.0);
  const program = String(req.query.program ?? "").trim();
  const skill = String(req.query.skill ?? "").trim().toLowerCase();

  const where = [];
  const params = { maxGpa: Number.isFinite(maxGpa) ? maxGpa : 2.0 };
  where.push("s.gpa IS NOT NULL AND s.gpa <= @maxGpa");
  if (program) {
    where.push("s.program = @program");
    params.program = program;
  }

  const rows = db
    .prepare(
      `SELECT s.id, s.student_no, s.first_name, s.last_name, s.program, s.year_level, s.section,
              s.gpa, s.skills_json,
              (SELECT COUNT(*) FROM event_participation ep WHERE ep.student_id = s.id AND ep.status IN ('Attended','Registered')) as events_joined,
              (SELECT COUNT(*) FROM achievements a WHERE a.student_id = s.id) as achievements_count,
              (SELECT COUNT(*) FROM violations v WHERE v.student_id = s.id AND v.status = 'Pending') as pending_violations
       FROM students s
       WHERE ${where.join(" AND ")}
       ORDER BY s.gpa ASC, s.last_name, s.first_name`
    )
    .all(params);

  const filtered = rows
    .filter((r) => (r.pending_violations ?? 0) === 0)
    .filter((r) => {
      if (!skill) return true;
      try {
        const skills = JSON.parse(r.skills_json ?? "[]");
        const list = Array.isArray(skills) ? skills.map((x) => String(x).toLowerCase()) : [];
        return list.includes(skill);
      } catch {
        return false;
      }
    })
    .map(({ skills_json, id, ...rest }) => rest);

  return res.json({ data: filtered });
});

app.patch("/api/admin/users/:id", requireAuth, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const patch = req.body ?? {};
  const updates = [];
  const params = { id };

  if (typeof patch.username === "string" && patch.username.trim()) {
    updates.push("username = @username");
    params.username = patch.username.trim();
  }
  if (typeof patch.role === "string" && ["admin", "faculty", "student"].includes(patch.role)) {
    updates.push("role = @role");
    params.role = patch.role;
  }
  if (typeof patch.active === "boolean") {
    updates.push("active = @active");
    params.active = patch.active ? 1 : 0;
  }
  if (!updates.length) return res.status(400).json({ message: "No changes" });

  try {
    const info = db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = @id`).run(params);
    if (info.changes === 0) return res.status(404).json({ message: "User not found" });
    logActivity({ actorUserId: req.user.sub, action: "admin.user.update", targetUserId: id, ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to update user" });
  }
});

app.post("/api/admin/users/:id/reset-password", requireAuth, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body ?? {};
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
  if (!password || String(password).length < 6) return res.status(400).json({ message: "Password too short" });

  try {
    const info = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(String(password), 10), id);
    if (info.changes === 0) return res.status(404).json({ message: "User not found" });
    logActivity({ actorUserId: req.user.sub, action: "admin.user.reset_password", targetUserId: id, ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to reset password" });
  }
});

app.get("/api/admin/activity-logs", requireAuth, requireRole(["admin"]), (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));

  const where = [];
  const params = { limit };
  if (q) {
    where.push("lower(l.action) LIKE @q OR lower(u.username) LIKE @q");
    params.q = `%${q}%`;
  }

  const sql = `
    SELECT l.id, l.action, l.ip, l.created_at, u.username as actor_username
    FROM activity_logs l
    LEFT JOIN users u ON u.id = l.actor_user_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY l.id DESC
    LIMIT @limit
  `;

  const rows = db.prepare(sql).all(params);
  return res.json({ data: rows });
});

app.get("/api/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

app.get("/api/terms", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT id, name, start_date, end_date, is_active, created_at FROM academic_terms ORDER BY is_active DESC, id DESC")
    .all();
  return res.json({ data: rows });
});

app.post("/api/terms", requireAuth, requireRole(["admin"]), (req, res) => {
  const { name, start_date, end_date, is_active } = req.body ?? {};
  if (!name || !String(name).trim()) return res.status(400).json({ message: "Missing name" });
  try {
    const safeActive = is_active === true ? 1 : 0;
    if (safeActive === 1) db.prepare("UPDATE academic_terms SET is_active = 0").run();
    const info = db
      .prepare("INSERT INTO academic_terms (name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)")
      .run(String(name).trim(), start_date ? String(start_date).trim() : null, end_date ? String(end_date).trim() : null, safeActive);
    logActivity({ actorUserId: req.user.sub, action: "term.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create term" });
  }
});

app.post("/api/terms/:id/activate", requireAuth, requireRole(["admin"]), (req, res) => {
  const termId = Number(req.params.id);
  if (!Number.isFinite(termId)) return res.status(400).json({ message: "Invalid id" });
  try {
    db.prepare("UPDATE academic_terms SET is_active = 0").run();
    const info = db.prepare("UPDATE academic_terms SET is_active = 1 WHERE id = ?").run(termId);
    if (info.changes === 0) return res.status(404).json({ message: "Term not found" });
    logActivity({ actorUserId: req.user.sub, action: "term.activate", ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to activate term" });
  }
});

app.get("/api/courses", requireAuth, (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const program = String(req.query.program ?? "").trim();
  const where = [];
  const params = {};
  if (q) {
    where.push("lower(code) LIKE @q OR lower(title) LIKE @q");
    params.q = `%${q}%`;
  }
  if (program) {
    where.push("program = @program");
    params.program = program;
  }
  const rows = db
    .prepare(
      `SELECT id, code, title, units, program, created_at
       FROM courses
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY code ASC`
    )
    .all(params);
  return res.json({ data: rows });
});

app.post("/api/courses", requireAuth, requireRole(["admin"]), (req, res) => {
  const { code, title, units, program } = req.body ?? {};
  if (!code || !title) return res.status(400).json({ message: "Missing code/title" });
  try {
    const info = db
      .prepare("INSERT INTO courses (code, title, units, program) VALUES (?, ?, ?, ?)")
      .run(String(code).trim(), String(title).trim(), typeof units === "number" ? units : null, program ? String(program).trim() : null);
    logActivity({ actorUserId: req.user.sub, action: "course.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create course" });
  }
});

app.get("/api/curriculum/versions", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const program = String(req.query.program ?? "").trim();
  const where = [];
  const params = {};
  if (program) {
    where.push("program = @program");
    params.program = program;
  }
  const rows = db
    .prepare(
      `SELECT id, program, name, is_active, created_at
       FROM curriculum_versions
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY is_active DESC, id DESC`
    )
    .all(params);
  return res.json({ data: rows });
});

app.post("/api/curriculum/versions", requireAuth, requireRole(["admin"]), (req, res) => {
  const { program, name } = req.body ?? {};
  if (!program || !String(program).trim() || !name || !String(name).trim()) {
    return res.status(400).json({ message: "Missing program/name" });
  }
  try {
    const info = db
      .prepare("INSERT INTO curriculum_versions (program, name, is_active) VALUES (?, ?, 0)")
      .run(String(program).trim(), String(name).trim());
    logActivity({ actorUserId: req.user.sub, action: "curriculum.version.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create curriculum version" });
  }
});

app.post("/api/curriculum/versions/:id/activate", requireAuth, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
  const row = db.prepare("SELECT id, program FROM curriculum_versions WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ message: "Curriculum version not found" });
  try {
    db.prepare("UPDATE curriculum_versions SET is_active = 0 WHERE program = ?").run(row.program);
    db.prepare("UPDATE curriculum_versions SET is_active = 1 WHERE id = ?").run(id);
    logActivity({ actorUserId: req.user.sub, action: "curriculum.version.activate", ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to activate curriculum version" });
  }
});

app.get("/api/curriculum/versions/:id/terms", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
  const rows = db
    .prepare(
      "SELECT id, curriculum_version_id, name, sort_order FROM curriculum_terms WHERE curriculum_version_id = ? ORDER BY sort_order ASC, id ASC"
    )
    .all(id);
  return res.json({ data: rows });
});

app.post("/api/curriculum/versions/:id/terms", requireAuth, requireRole(["admin"]), (req, res) => {
  const curriculumVersionId = Number(req.params.id);
  const { name, sort_order } = req.body ?? {};
  if (!Number.isFinite(curriculumVersionId)) return res.status(400).json({ message: "Invalid id" });
  if (!name || !String(name).trim()) return res.status(400).json({ message: "Missing name" });
  const sort = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
  try {
    const info = db
      .prepare("INSERT INTO curriculum_terms (curriculum_version_id, name, sort_order) VALUES (?, ?, ?)")
      .run(curriculumVersionId, String(name).trim(), sort);
    logActivity({ actorUserId: req.user.sub, action: "curriculum.term.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create term" });
  }
});

app.delete("/api/curriculum/terms/:id", requireAuth, requireRole(["admin"]), (req, res) => {
  const termId = Number(req.params.id);
  if (!Number.isFinite(termId)) return res.status(400).json({ message: "Invalid id" });
  try {
    db.prepare("DELETE FROM curriculum_term_courses WHERE curriculum_term_id = ?").run(termId);
    const info = db.prepare("DELETE FROM curriculum_terms WHERE id = ?").run(termId);
    if (info.changes === 0) return res.status(404).json({ message: "Term not found" });
    logActivity({ actorUserId: req.user.sub, action: "curriculum.term.delete", ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to delete term" });
  }
});

app.get("/api/curriculum/terms/:id/courses", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const termId = Number(req.params.id);
  if (!Number.isFinite(termId)) return res.status(400).json({ message: "Invalid id" });
  const rows = db
    .prepare(
      `SELECT tc.id, tc.curriculum_term_id, tc.course_id,
              c.code as course_code, c.title as course_title, c.units
       FROM curriculum_term_courses tc
       JOIN courses c ON c.id = tc.course_id
       WHERE tc.curriculum_term_id = ?
       ORDER BY c.code ASC`
    )
    .all(termId);
  return res.json({ data: rows });
});

app.post("/api/curriculum/terms/:id/courses", requireAuth, requireRole(["admin"]), (req, res) => {
  const termId = Number(req.params.id);
  const { course_id } = req.body ?? {};
  const courseId = Number(course_id);
  if (!Number.isFinite(termId)) return res.status(400).json({ message: "Invalid id" });
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: "Invalid course_id" });
  try {
    const info = db
      .prepare("INSERT INTO curriculum_term_courses (curriculum_term_id, course_id) VALUES (?, ?)")
      .run(termId, courseId);
    logActivity({ actorUserId: req.user.sub, action: "curriculum.term_course.add", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to add course to term" });
  }
});

app.delete("/api/curriculum/term-courses/:id", requireAuth, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const info = db.prepare("DELETE FROM curriculum_term_courses WHERE id = ?").run(id);
    if (info.changes === 0) return res.status(404).json({ message: "Not found" });
    logActivity({ actorUserId: req.user.sub, action: "curriculum.term_course.remove", ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to remove course from term" });
  }
});

app.get("/api/courses/:id/prerequisites", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const courseId = Number(req.params.id);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: "Invalid id" });
  const rows = db
    .prepare(
      `SELECT c.id, c.code, c.title, c.units, c.program, c.created_at
       FROM course_prerequisites p
       JOIN courses c ON c.id = p.prerequisite_course_id
       WHERE p.course_id = ?
       ORDER BY c.code ASC`
    )
    .all(courseId);
  return res.json({ data: rows });
});

app.post("/api/courses/:id/prerequisites", requireAuth, requireRole(["admin"]), (req, res) => {
  const courseId = Number(req.params.id);
  const { prerequisite_course_id } = req.body ?? {};
  const prereqId = Number(prerequisite_course_id);
  if (!Number.isFinite(courseId)) return res.status(400).json({ message: "Invalid id" });
  if (!Number.isFinite(prereqId)) return res.status(400).json({ message: "Invalid prerequisite_course_id" });
  if (courseId === prereqId) return res.status(400).json({ message: "Course cannot be prerequisite of itself" });
  try {
    const info = db
      .prepare("INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES (?, ?)")
      .run(courseId, prereqId);
    logActivity({ actorUserId: req.user.sub, action: "course.prereq.add", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to add prerequisite" });
  }
});

app.delete("/api/courses/:id/prerequisites/:prereqId", requireAuth, requireRole(["admin"]), (req, res) => {
  const courseId = Number(req.params.id);
  const prereqId = Number(req.params.prereqId);
  if (!Number.isFinite(courseId) || !Number.isFinite(prereqId)) return res.status(400).json({ message: "Invalid id" });
  try {
    const info = db
      .prepare("DELETE FROM course_prerequisites WHERE course_id = ? AND prerequisite_course_id = ?")
      .run(courseId, prereqId);
    if (info.changes === 0) return res.status(404).json({ message: "Not found" });
    logActivity({ actorUserId: req.user.sub, action: "course.prereq.remove", ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to remove prerequisite" });
  }
});

app.get("/api/sections", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT id, name, program, year_level, created_at FROM sections ORDER BY name ASC").all();
  return res.json({ data: rows });
});

app.post("/api/sections", requireAuth, requireRole(["admin"]), (req, res) => {
  const { name, program, year_level } = req.body ?? {};
  if (!name) return res.status(400).json({ message: "Missing name" });
  try {
    const info = db
      .prepare("INSERT INTO sections (name, program, year_level) VALUES (?, ?, ?)")
      .run(String(name).trim(), program ? String(program).trim() : null, typeof year_level === "number" ? year_level : null);
    logActivity({ actorUserId: req.user.sub, action: "section.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create section" });
  }
});

app.get("/api/rooms", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT id, name, capacity, created_at FROM rooms ORDER BY name ASC").all();
  return res.json({ data: rows });
});

app.post("/api/rooms", requireAuth, requireRole(["admin"]), (req, res) => {
  const { name, capacity } = req.body ?? {};
  if (!name) return res.status(400).json({ message: "Missing name" });
  try {
    const info = db
      .prepare("INSERT INTO rooms (name, capacity) VALUES (?, ?)")
      .run(String(name).trim(), typeof capacity === "number" ? capacity : null);
    logActivity({ actorUserId: req.user.sub, action: "room.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create room" });
  }
});

app.get("/api/time-slots", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT id, day_of_week, start_time, end_time, created_at FROM time_slots ORDER BY day_of_week ASC, start_time ASC")
    .all();
  return res.json({ data: rows });
});

app.post("/api/time-slots", requireAuth, requireRole(["admin"]), (req, res) => {
  const { day_of_week, start_time, end_time } = req.body ?? {};
  const d = Number(day_of_week);
  if (![1, 2, 3, 4, 5, 6, 7].includes(d) || !start_time || !end_time) return res.status(400).json({ message: "Invalid slot" });
  try {
    const info = db
      .prepare("INSERT INTO time_slots (day_of_week, start_time, end_time) VALUES (?, ?, ?)")
      .run(d, String(start_time).trim(), String(end_time).trim());
    logActivity({ actorUserId: req.user.sub, action: "timeslot.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create time slot" });
  }
});

app.get("/api/schedule/offerings", requireAuth, (req, res) => {
  const termId = Number(req.query.term_id);
  const safeTermId = Number.isFinite(termId) ? termId : null;
  const where = [];
  const params = {};
  if (safeTermId) {
    where.push("o.term_id = @termId");
    params.termId = safeTermId;
  }
  const rows = db
    .prepare(
      `SELECT o.id, o.term_id, t.name as term_name,
              o.course_id, c.code as course_code, c.title as course_title,
              o.section_id, s.name as section_name,
              o.room_id, r.name as room_name,
              o.time_slot_id, ts.day_of_week, ts.start_time, ts.end_time,
              o.faculty_id, f.name as faculty_name
       FROM schedule_offerings o
       JOIN academic_terms t ON t.id = o.term_id
       JOIN courses c ON c.id = o.course_id
       JOIN sections s ON s.id = o.section_id
       LEFT JOIN rooms r ON r.id = o.room_id
       LEFT JOIN time_slots ts ON ts.id = o.time_slot_id
       LEFT JOIN faculty f ON f.id = o.faculty_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY t.is_active DESC, s.name ASC, c.code ASC`
    )
    .all(params);
  return res.json({ data: rows });
});

app.post("/api/schedule/offerings", requireAuth, requireRole(["admin"]), (req, res) => {
  const { term_id, course_id, section_id, room_id, time_slot_id, faculty_id } = req.body ?? {};
  const termId = Number(term_id);
  const courseId = Number(course_id);
  const sectionId = Number(section_id);
  const roomId = room_id == null ? null : Number(room_id);
  const timeSlotId = time_slot_id == null ? null : Number(time_slot_id);
  const facultyId = faculty_id == null ? null : Number(faculty_id);
  if (!Number.isFinite(termId) || !Number.isFinite(courseId) || !Number.isFinite(sectionId)) {
    return res.status(400).json({ message: "Missing term/course/section" });
  }
  try {
    const info = db
      .prepare("INSERT INTO schedule_offerings (term_id, course_id, section_id, room_id, time_slot_id, faculty_id) VALUES (?, ?, ?, ?, ?, ?)")
      .run(termId, courseId, sectionId, Number.isFinite(roomId) ? roomId : null, Number.isFinite(timeSlotId) ? timeSlotId : null, Number.isFinite(facultyId) ? facultyId : null);
    logActivity({ actorUserId: req.user.sub, action: "schedule.offering.create", ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create offering" });
  }
});

app.get("/api/faculty/my-load", requireAuth, requireRole(["faculty", "admin"]), (req, res) => {
  const facultyRow = db.prepare("SELECT id, name FROM faculty WHERE user_id = ?").get(req.user.sub);
  if (!facultyRow && req.user.role === "faculty") return res.status(404).json({ message: "Faculty profile not linked" });

  const fid = facultyRow?.id ?? null;
  const rows = fid
    ? db
        .prepare(
          `SELECT o.id, t.name as term_name, c.code as course_code, c.title as course_title,
                  s.name as section_name, r.name as room_name, ts.day_of_week, ts.start_time, ts.end_time
           FROM schedule_offerings o
           JOIN academic_terms t ON t.id = o.term_id
           JOIN courses c ON c.id = o.course_id
           JOIN sections s ON s.id = o.section_id
           LEFT JOIN rooms r ON r.id = o.room_id
           LEFT JOIN time_slots ts ON ts.id = o.time_slot_id
           WHERE o.faculty_id = ?
           ORDER BY t.is_active DESC, ts.day_of_week ASC, ts.start_time ASC`
        )
        .all(fid)
    : [];
  return res.json({ data: rows });
});

app.get("/api/student/my-schedule", requireAuth, requireRole(["student"]), (req, res) => {
  const me = db.prepare("SELECT id, section_id, section FROM students WHERE user_id = ?").get(req.user.sub);
  if (!me) return res.status(404).json({ message: "Student profile not linked" });

  let sectionId = me.section_id;
  if (!sectionId && me.section) {
    const sec = db.prepare("SELECT id FROM sections WHERE name = ?").get(String(me.section));
    if (sec?.id) {
      sectionId = sec.id;
      try {
        db.prepare("UPDATE students SET section_id = ? WHERE id = ?").run(sectionId, me.id);
      } catch {
      }
    }
  }
  if (!sectionId) return res.json({ data: [] });

  const rows = db
    .prepare(
      `SELECT o.id, t.name as term_name, c.code as course_code, c.title as course_title,
              r.name as room_name, ts.day_of_week, ts.start_time, ts.end_time,
              f.name as faculty_name
       FROM schedule_offerings o
       JOIN academic_terms t ON t.id = o.term_id
       JOIN courses c ON c.id = o.course_id
       LEFT JOIN rooms r ON r.id = o.room_id
       LEFT JOIN time_slots ts ON ts.id = o.time_slot_id
       LEFT JOIN faculty f ON f.id = o.faculty_id
       WHERE o.section_id = ?
       ORDER BY t.is_active DESC, ts.day_of_week ASC, ts.start_time ASC`
    )
    .all(sectionId);
  return res.json({ data: rows });
});

app.post("/api/my/documents", requireAuth, requireRole(["student"]), upload.single("file"), (req, res) => {
  const kind = String(req.body?.kind ?? "").trim();
  if (!req.file || !kind) return res.status(400).json({ message: "Missing file/kind" });

  const me = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.sub);
  if (!me) return res.status(404).json({ message: "Student profile not linked" });

  const storedName = `${crypto.randomUUID()}_${req.file.filename}`;
  const dest = path.join(uploadsDir, storedName);
  try {
    fs.renameSync(req.file.path, dest);
  } catch {
    return res.status(400).json({ message: "Unable to store file" });
  }

  try {
    const info = db
      .prepare(
        "INSERT INTO student_documents (student_id, kind, original_name, stored_name, mime_type, size_bytes, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(me.id, kind, req.file.originalname, storedName, req.file.mimetype ?? null, req.file.size ?? null, req.user.sub);
    logActivity({ actorUserId: req.user.sub, action: `student.document.upload:${kind}`, ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to save document" });
  }
});

app.post("/api/materials/upload", requireAuth, requireRole(["admin", "faculty"]), upload.single("file"), (req, res) => {
  const { term_id, course_id, offering_id, title, kind, description } = req.body ?? {};
  const safeKind = ["Syllabus", "Lesson", "Resource"].includes(kind) ? kind : null;
  if (!title || !safeKind) return res.status(400).json({ message: "Missing title/kind" });

  const termId = term_id == null ? null : Number(term_id);
  const courseId = course_id == null ? null : Number(course_id);
  const offeringId = offering_id == null ? null : Number(offering_id);

  let storedName = null;
  let mimeType = null;
  let sizeBytes = null;
  let originalName = null;
  if (req.file) {
    storedName = `${crypto.randomUUID()}_${req.file.filename}`;
    const dest = path.join(uploadsDir, storedName);
    try {
      fs.renameSync(req.file.path, dest);
    } catch {
      return res.status(400).json({ message: "Unable to store file" });
    }
    mimeType = req.file.mimetype ?? null;
    sizeBytes = req.file.size ?? null;
    originalName = req.file.originalname;
  }

  try {
    const info = db
      .prepare(
        "INSERT INTO instruction_materials (term_id, course_id, offering_id, title, kind, description, original_name, stored_name, mime_type, size_bytes, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        Number.isFinite(termId) ? termId : null,
        Number.isFinite(courseId) ? courseId : null,
        Number.isFinite(offeringId) ? offeringId : null,
        String(title).trim(),
        safeKind,
        description ? String(description).trim() : null,
        originalName,
        storedName,
        mimeType,
        sizeBytes,
        req.user.sub
      );
    logActivity({ actorUserId: req.user.sub, action: `material.upload:${safeKind}`, ip: getRequestIp(req) });
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to save material" });
  }
});

app.get("/api/events", requireAuth, (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const kind = String(req.query.kind ?? "").trim();

  const where = [];
  const params = {};
  if (q) {
    where.push("lower(title) LIKE @q OR lower(ifnull(category,'')) LIKE @q");
    params.q = `%${q}%`;
  }
  if (kind && ["Curricular", "Extra-curricular"].includes(kind)) {
    where.push("kind = @kind");
    params.kind = kind;
  }

  const rows = db
    .prepare(
      `SELECT id, title, kind, category, start_date, end_date, location, description, created_at
       FROM events
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY start_date DESC, id DESC`
    )
    .all(params);
  return res.json({ data: rows });
});

app.post("/api/events", requireAuth, requireRole(["admin"]), (req, res) => {
  const e = req.body ?? {};
  if (!e.title || !e.kind || !e.start_date) return res.status(400).json({ message: "Missing required fields" });

  const safeKind = ["Curricular", "Extra-curricular"].includes(e.kind) ? e.kind : null;
  if (!safeKind) return res.status(400).json({ message: "Invalid kind" });

  const info = db
    .prepare(
      "INSERT INTO events (title, kind, category, start_date, end_date, location, description, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      String(e.title).trim(),
      safeKind,
      e.category ? String(e.category).trim() : null,
      String(e.start_date).trim(),
      e.end_date ? String(e.end_date).trim() : null,
      e.location ? String(e.location).trim() : null,
      e.description ? String(e.description).trim() : null,
      req.user.sub,
    );

  logActivity({ actorUserId: req.user.sub, action: "admin.event.create", targetUserId: null, ip: getRequestIp(req) });
  return res.status(201).json({ id: info.lastInsertRowid });
});

app.patch("/api/events/:id", requireAuth, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const patch = req.body ?? {};
  const updates = [];
  const params = { id };

  if (typeof patch.title === "string" && patch.title.trim()) {
    updates.push("title = @title");
    params.title = patch.title.trim();
  }
  if (typeof patch.kind === "string" && ["Curricular", "Extra-curricular"].includes(patch.kind)) {
    updates.push("kind = @kind");
    params.kind = patch.kind;
  }
  if (typeof patch.category === "string") {
    updates.push("category = @category");
    params.category = patch.category.trim() || null;
  }
  if (typeof patch.start_date === "string" && patch.start_date.trim()) {
    updates.push("start_date = @start_date");
    params.start_date = patch.start_date.trim();
  }
  if (typeof patch.end_date === "string") {
    updates.push("end_date = @end_date");
    params.end_date = patch.end_date.trim() || null;
  }
  if (typeof patch.location === "string") {
    updates.push("location = @location");
    params.location = patch.location.trim() || null;
  }
  if (typeof patch.description === "string") {
    updates.push("description = @description");
    params.description = patch.description.trim() || null;
  }

  if (!updates.length) return res.status(400).json({ message: "No changes" });

  const info = db.prepare(`UPDATE events SET ${updates.join(", ")} WHERE id = @id`).run(params);
  if (info.changes === 0) return res.status(404).json({ message: "Event not found" });
  logActivity({ actorUserId: req.user.sub, action: "admin.event.update", targetUserId: null, ip: getRequestIp(req) });
  return res.json({ ok: true });
});

app.get("/api/my/events", requireAuth, requireRole(["student"]), (req, res) => {
  const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.sub);
  if (!student) return res.json({ data: [] });

  const rows = db
    .prepare(
      `SELECT p.id as participation_id, p.status, p.registered_at, p.attendance_marked_at,
              e.id as event_id, e.title, e.kind, e.category, e.start_date, e.end_date, e.location
       FROM event_participation p
       JOIN events e ON e.id = p.event_id
       WHERE p.student_id = ?
       ORDER BY e.start_date DESC, e.id DESC`
    )
    .all(student.id);

  return res.json({ data: rows });
});

app.post("/api/events/:id/register", requireAuth, requireRole(["student"]), (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) return res.status(400).json({ message: "Invalid event id" });

  const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.sub);
  if (!student) return res.status(404).json({ message: "Student profile not found" });

  const exists = db.prepare("SELECT id FROM events WHERE id = ?").get(eventId);
  if (!exists) return res.status(404).json({ message: "Event not found" });

  try {
    db.prepare("INSERT OR IGNORE INTO event_participation (event_id, student_id, status) VALUES (?, ?, 'Registered')").run(
      eventId,
      student.id,
    );
    logActivity({ actorUserId: req.user.sub, action: "student.event.register", targetUserId: null, ip: getRequestIp(req) });
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to register" });
  }
});

app.get("/api/events/:id/participants", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) return res.status(400).json({ message: "Invalid event id" });

  const q = String(req.query.q ?? "").trim().toLowerCase();
  const status = String(req.query.status ?? "").trim();

  const where = ["p.event_id = @eventId"];
  const params = { eventId };
  if (q) {
    where.push("(lower(s.first_name) LIKE @q OR lower(s.last_name) LIKE @q OR s.student_no LIKE @q)");
    params.q = `%${q}%`;
  }
  if (status && ["Registered", "Attended", "Absent", "Cancelled"].includes(status)) {
    where.push("p.status = @status");
    params.status = status;
  }

  const rows = db
    .prepare(
      `SELECT p.id as participation_id, p.status, p.registered_at, p.attendance_marked_at,
              s.student_no, s.first_name, s.last_name, s.program, s.year_level, s.section
       FROM event_participation p
       JOIN students s ON s.id = p.student_id
       WHERE ${where.join(" AND ")}
       ORDER BY s.last_name, s.first_name`
    )
    .all(params);
  return res.json({ data: rows });
});

app.post("/api/events/:id/attendance", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) return res.status(400).json({ message: "Invalid event id" });

  const { student_no, status } = req.body ?? {};
  const safeStatus = ["Attended", "Absent"].includes(status) ? status : null;
  if (!student_no || !safeStatus) return res.status(400).json({ message: "Missing student_no/status" });

  const student = db.prepare("SELECT id FROM students WHERE student_no = ?").get(String(student_no).trim());
  if (!student) return res.status(404).json({ message: "Student not found" });

  const info = db
    .prepare(
      `UPDATE event_participation
       SET status = ?, attendance_marked_by_user_id = ?, attendance_marked_at = datetime('now')
       WHERE event_id = ? AND student_id = ?`
    )
    .run(safeStatus, req.user.sub, eventId, student.id);

  if (info.changes === 0) return res.status(404).json({ message: "Participation record not found" });
  logActivity({ actorUserId: req.user.sub, action: `event.attendance.${safeStatus.toLowerCase()}`, targetUserId: null, ip: getRequestIp(req) });
  return res.json({ ok: true });
});

// My pages (role-specific)
app.get("/api/my/student-profile", requireAuth, requireRole(["student"]), (req, res) => {
  const row = db
    .prepare(
      "SELECT id, student_no, first_name, last_name, email, program, year_level, section, section_id, enrollment_status, academic_status, gpa, height_cm, weight_kg, sports_interest_json, medical_clearance_status, medical_notes, employment_status, company, position, internship_status, skills_json FROM students WHERE user_id = ?"
    )
    .get(req.user.sub);
  if (!row) return res.status(404).json({ message: "Student profile not found" });
  return res.json({
    data: {
      ...row,
      skills: JSON.parse(row.skills_json || "[]"),
      sports_interests: JSON.parse(row.sports_interest_json || "[]"),
    },
  });
});

app.get("/api/my/faculty-profile", requireAuth, requireRole(["faculty"]), (req, res) => {
  const row = db
    .prepare(
      "SELECT id, faculty_no, name, rank, status, field, degree, institution, year_graduated, skills_json FROM faculty WHERE user_id = ?"
    )
    .get(req.user.sub);
  if (!row) return res.status(404).json({ message: "Faculty profile not found" });
  return res.json({
    data: {
      ...row,
      skills: JSON.parse(row.skills_json || "[]"),
    },
  });
});

app.get("/api/my/violations", requireAuth, requireRole(["student"]), (req, res) => {
  const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.sub);
  if (!student) return res.json({ data: [] });
  const rows = db
    .prepare(
      `SELECT v.id, v.type, v.description, v.date, v.status, u.username as recorded_by
       FROM violations v
       JOIN users u ON u.id = v.recorded_by_user_id
       WHERE v.student_id = ?
       ORDER BY v.date DESC`
    )
    .all(student.id);
  return res.json({ data: rows });
});

app.get("/api/my/achievements", requireAuth, requireRole(["student"]), (req, res) => {
  const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.sub);
  if (!student) return res.json({ data: [] });
  const rows = db
    .prepare(
      `SELECT a.id, a.title, a.event, a.type, a.date, u.username as recorded_by
       FROM achievements a
       JOIN users u ON u.id = a.recorded_by_user_id
       WHERE a.student_id = ?
       ORDER BY a.date DESC`
    )
    .all(student.id);
  return res.json({ data: rows });
});

app.get("/api/my/organizations", requireAuth, requireRole(["student"]), (req, res) => {
  const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.sub);
  if (!student) return res.json({ data: [] });
  const rows = db
    .prepare(
      `SELECT o.id, o.name, o.abbr, m.role as member_role, m.joined_at
       FROM organization_members m
       JOIN organizations o ON o.id = m.organization_id
       WHERE m.student_id = ?
       ORDER BY o.name`
    )
    .all(student.id);
  return res.json({ data: rows });
});

// Teacher/faculty/admin capabilities: record violations and achievements
app.post("/api/violations", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const { student_no, type, description, date, status } = req.body ?? {};
  if (!student_no || !type || !date) return res.status(400).json({ message: "Missing required fields" });
  const student = db.prepare("SELECT id FROM students WHERE student_no = ?").get(student_no);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const safeStatus = status && ["Pending", "Sanctioned", "Resolved"].includes(status) ? status : "Pending";
  const info = db
    .prepare("INSERT INTO violations (student_id, recorded_by_user_id, type, description, date, status) VALUES (?, ?, ?, ?, ?, ?)")
    .run(student.id, req.user.sub, type, description ?? null, date, safeStatus);
  return res.status(201).json({ id: info.lastInsertRowid });
});

app.post("/api/achievements", requireAuth, requireRole(["admin", "faculty"]), (req, res) => {
  const { student_no, title, event, type, date } = req.body ?? {};
  if (!student_no || !title || !type || !date) return res.status(400).json({ message: "Missing required fields" });
  const student = db.prepare("SELECT id FROM students WHERE student_no = ?").get(student_no);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const safeType = type === "Outside" ? "Outside" : "School";
  const info = db
    .prepare("INSERT INTO achievements (student_id, recorded_by_user_id, title, event, type, date) VALUES (?, ?, ?, ?, ?, ?)")
    .run(student.id, req.user.sub, title, event ?? null, safeType, date);
  return res.status(201).json({ id: info.lastInsertRowid });
});

// Students
app.get("/api/students", requireAuth, requireRole(["admin"]), (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const program = String(req.query.program ?? "").trim();

  let rows;
  if (!q && !program) {
    rows = db.prepare("SELECT * FROM students ORDER BY last_name, first_name").all();
  } else {
    const where = [];
    const params = {};
    if (q) {
      where.push("(lower(first_name) LIKE @q OR lower(last_name) LIKE @q OR student_no LIKE @q)");
      params.q = `%${q}%`;
    }
    if (program) {
      where.push("program = @program");
      params.program = program;
    }
    rows = db.prepare(`SELECT * FROM students WHERE ${where.join(" AND ")} ORDER BY last_name, first_name`).all(params);
  }

  const result = rows.map((r) => ({
    ...r,
    skills: JSON.parse(r.skills_json || "[]"),
    sports_interests: JSON.parse(r.sports_interest_json || "[]"),
  }));
  return res.json({ data: result });
});

app.post("/api/students", requireAuth, requireRole(["admin"]), (req, res) => {
  const s = req.body ?? {};
  if (!s.student_no || !s.first_name || !s.last_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const skillsJson = JSON.stringify(Array.isArray(s.skills) ? s.skills : []);

  try {
    const stmt = db.prepare(
      `INSERT INTO students (student_no, first_name, last_name, email, program, year_level, section, enrollment_status, academic_status, skills_json)
       VALUES (@student_no, @first_name, @last_name, @email, @program, @year_level, @section, @enrollment_status, @academic_status, @skills_json)`
    );

    const info = stmt.run({
      student_no: s.student_no,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email ?? null,
      program: s.program ?? null,
      year_level: s.year_level ?? null,
      section: s.section ?? null,
      enrollment_status: s.enrollment_status ?? null,
      academic_status: s.academic_status ?? null,
      skills_json: skillsJson,
    });

    return res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    return res.status(400).json({ message: "Unable to create student" });
  }
});

app.patch("/api/students/:id", requireAuth, requireRole(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

  const patch = req.body ?? {};
  const updates = [];
  const params = { id };

  const setText = (field, col) => {
    if (typeof field === "string") {
      updates.push(`${col} = @${col}`);
      params[col] = field.trim() ? field.trim() : null;
    }
  };

  const setNumber = (field, col) => {
    if (field === null) {
      updates.push(`${col} = NULL`);
      return;
    }
    if (typeof field === "number" && Number.isFinite(field)) {
      updates.push(`${col} = @${col}`);
      params[col] = field;
    }
    if (typeof field === "string" && field.trim()) {
      const n = Number(field);
      if (Number.isFinite(n)) {
        updates.push(`${col} = @${col}`);
        params[col] = n;
      }
    }
  };

  if (typeof patch.student_no === "string" && patch.student_no.trim()) {
    updates.push("student_no = @student_no");
    params.student_no = patch.student_no.trim();
  }
  if (typeof patch.first_name === "string" && patch.first_name.trim()) {
    updates.push("first_name = @first_name");
    params.first_name = patch.first_name.trim();
  }
  if (typeof patch.last_name === "string" && patch.last_name.trim()) {
    updates.push("last_name = @last_name");
    params.last_name = patch.last_name.trim();
  }

  setText(patch.email, "email");
  setText(patch.program, "program");
  setNumber(patch.year_level, "year_level");
  setText(patch.section, "section");
  setText(patch.enrollment_status, "enrollment_status");
  setText(patch.academic_status, "academic_status");

  setNumber(patch.gpa, "gpa");
  setNumber(patch.height_cm, "height_cm");
  setNumber(patch.weight_kg, "weight_kg");
  setText(patch.medical_clearance_status, "medical_clearance_status");
  setText(patch.medical_notes, "medical_notes");
  setText(patch.employment_status, "employment_status");
  setText(patch.company, "company");
  setText(patch.position, "position");
  setText(patch.internship_status, "internship_status");

  if (Array.isArray(patch.skills)) {
    updates.push("skills_json = @skills_json");
    params.skills_json = JSON.stringify(patch.skills);
  }
  if (Array.isArray(patch.sports_interests)) {
    updates.push("sports_interest_json = @sports_interest_json");
    params.sports_interest_json = JSON.stringify(patch.sports_interests);
  }

  if (!updates.length) return res.status(400).json({ message: "No changes" });

  try {
    const info = db.prepare(`UPDATE students SET ${updates.join(", ")} WHERE id = @id`).run(params);
    if (info.changes === 0) return res.status(404).json({ message: "Student not found" });
    logActivity({ actorUserId: req.user.sub, action: "admin.student.update", ip: getRequestIp(req) });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ message: "Unable to update student" });
  }
});

// Faculty
app.get("/api/faculty", requireAuth, requireRole(["admin"]), (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const rows = q
    ? db.prepare("SELECT * FROM faculty WHERE lower(name) LIKE ? OR lower(field) LIKE ? ORDER BY name").all(`%${q}%`, `%${q}%`)
    : db.prepare("SELECT * FROM faculty ORDER BY name").all();

  const result = rows.map((r) => ({
    ...r,
    skills: JSON.parse(r.skills_json || "[]"),
  }));
  return res.json({ data: result });
});

app.post("/api/faculty", requireAuth, requireRole(["admin"]), (req, res) => {
  const f = req.body ?? {};
  if (!f.faculty_no || !f.name) return res.status(400).json({ message: "Missing required fields" });

  const skillsJson = JSON.stringify(Array.isArray(f.skills) ? f.skills : []);

  try {
    const stmt = db.prepare(
      `INSERT INTO faculty (faculty_no, name, rank, status, field, degree, institution, year_graduated, skills_json)
       VALUES (@faculty_no, @name, @rank, @status, @field, @degree, @institution, @year_graduated, @skills_json)`
    );

    const info = stmt.run({
      faculty_no: f.faculty_no,
      name: f.name,
      rank: f.rank ?? null,
      status: f.status ?? null,
      field: f.field ?? null,
      degree: f.degree ?? null,
      institution: f.institution ?? null,
      year_graduated: f.year_graduated ?? null,
      skills_json: skillsJson,
    });

    return res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    return res.status(400).json({ message: "Unable to create faculty" });
  }
});

const port = Number(process.env.PORT || 5050);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${port}`);
});
