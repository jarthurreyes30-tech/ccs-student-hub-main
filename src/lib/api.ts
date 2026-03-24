const TOKEN_KEY = "ccs_token";

export type ApiUser = {
  id: number;
  username: string;
  role: "admin" | "faculty" | "student";
};

export type AdminUserRow = {
  id: number;
  username: string;
  role: ApiUser["role"];
  active: number;
  last_login_at: string | null;
  created_at: string;
};

export type ActivityLogRow = {
  id: number;
  action: string;
  ip: string | null;
  created_at: string;
  actor_username: string | null;
};

export type EventRow = {
  id: number;
  title: string;
  kind: "Curricular" | "Extra-curricular";
  category: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
};

export type MyEventRow = {
  participation_id: number;
  status: "Registered" | "Attended" | "Absent" | "Cancelled";
  registered_at: string;
  attendance_marked_at: string | null;
  event_id: number;
  title: string;
  kind: "Curricular" | "Extra-curricular";
  category: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
};

export type EventParticipantRow = {
  participation_id: number;
  status: "Registered" | "Attended" | "Absent" | "Cancelled";
  registered_at: string;
  attendance_marked_at: string | null;
  student_no: string;
  first_name: string;
  last_name: string;
  program: string | null;
  year_level: number | null;
  section: string | null;
};

export type TermRow = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: 0 | 1;
  created_at: string;
};

export type CourseRow = {
  id: number;
  code: string;
  title: string;
  units: number | null;
  program: string | null;
  created_at: string;
};

export type CurriculumVersionRow = {
  id: number;
  program: string;
  name: string;
  is_active: 0 | 1;
  created_at: string;
};

export type CurriculumTermRow = {
  id: number;
  curriculum_version_id: number;
  name: string;
  sort_order: number;
};

export type SectionRow = {
  id: number;
  name: string;
  program: string | null;
  year_level: number | null;
  created_at: string;
};

export type RoomRow = {
  id: number;
  name: string;
  capacity: number | null;
  created_at: string;
};

export type TimeSlotRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type ScheduleOfferingRow = {
  id: number;
  term_id: number;
  term_name: string;
  course_id: number;
  course_code: string;
  course_title: string;
  section_id: number;
  section_name: string;
  room_id: number | null;
  room_name: string | null;
  time_slot_id: number | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  faculty_id: number | null;
  faculty_name: string | null;
};

export type FacultyLoadRow = {
  id: number;
  term_name: string;
  course_code: string;
  course_title: string;
  section_name: string;
  room_name: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
};

export type StudentScheduleRow = {
  id: number;
  term_name: string;
  course_code: string;
  course_title: string;
  room_name: string | null;
  faculty_name: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
};

export type StudentDocumentRow = {
  id: number;
  kind: string;
  original_name: string;
  stored_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type MaterialRow = {
  id: number;
  term_id: number | null;
  term_name: string | null;
  course_id: number | null;
  course_code: string | null;
  course_title: string | null;
  offering_id: number | null;
  title: string;
  kind: "Syllabus" | "Lesson" | "Resource";
  description: string | null;
  original_name: string | null;
  stored_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_user_id: number | null;
  uploaded_by_username: string | null;
  created_at: string;
};

export type FacultyStudentSearchRow = {
  student_no: string;
  first_name: string;
  last_name: string;
  program: string | null;
  year_level: number | null;
  section: string | null;
  academic_status: string | null;
};

export type BasketballTryoutRow = {
  student_no: string;
  first_name: string;
  last_name: string;
  program: string | null;
  year_level: number | null;
  section: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  medical_clearance_status: string | null;
  pending_violations: number;
};

export type ProgrammingContestRow = {
  student_no: string;
  first_name: string;
  last_name: string;
  program: string | null;
  year_level: number | null;
  section: string | null;
  gpa: number | null;
  events_joined: number;
  achievements_count: number;
  pending_violations: number;
};

export type AdminMetrics = {
  users_total: number;
  students_total: number;
  faculty_total: number;
  violations_total: number;
  achievements_total: number;
  events_total: number;
  organizations_total: number;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function requestForm(path: string, form: FormData) {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { method: "POST", headers, body: form });
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === "object" && body && "message" in body ? String((body as any).message) : "Request failed";
    throw new Error(message);
  }

  return body;
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

async function request(path: string, init?: RequestInit) {
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === "object" && body && "message" in body ? String(body.message) : "Request failed";
    throw new Error(message);
  }

  return body;
}

export const api = {
  login: (username: string, password: string) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }) as Promise<{ token: string; user: ApiUser }>,
  me: () => request("/api/me") as Promise<{ user: { role: ApiUser["role"]; username: string; sub: number } }>,
  adminMetrics: () => request("/api/admin/metrics") as Promise<{ data: AdminMetrics }>,
  myStudentProfile: () => request("/api/my/student-profile") as Promise<{ data: any }>,
  myFacultyProfile: () => request("/api/my/faculty-profile") as Promise<{ data: any }>,
  myViolations: () => request("/api/my/violations") as Promise<{ data: any[] }>,
  myAchievements: () => request("/api/my/achievements") as Promise<{ data: any[] }>,
  myOrganizations: () => request("/api/my/organizations") as Promise<{ data: any[] }>,
  listStudents: (params: { q?: string; program?: string }) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.program) usp.set("program", params.program);
    const qs = usp.toString();
    return request(`/api/students${qs ? `?${qs}` : ""}`) as Promise<{ data: Array<any> }>;
  },
  patchStudent: (id: number, payload: any) =>
    request(`/api/students/${id}`, { method: "PATCH", body: JSON.stringify(payload) }) as Promise<{ ok: boolean }>,
  listFaculty: (params: { q?: string }) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    const qs = usp.toString();
    return request(`/api/faculty${qs ? `?${qs}` : ""}`) as Promise<{ data: Array<any> }>;
  },
  createViolation: (payload: {
    student_no: string;
    type: string;
    description: string | null;
    date: string;
    status?: "Pending" | "Sanctioned" | "Resolved";
  }) => request("/api/violations", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  createAchievement: (payload: {
    student_no: string;
    title: string;
    event: string | null;
    type: "School" | "Outside";
    date: string;
  }) => request("/api/achievements", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,

  adminListUsers: (params: { q?: string; role?: ApiUser["role"]; active?: 0 | 1 }) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.role) usp.set("role", params.role);
    if (typeof params.active === "number") usp.set("active", String(params.active));
    const qs = usp.toString();
    return request(`/api/admin/users${qs ? `?${qs}` : ""}`) as Promise<{ data: AdminUserRow[] }>;
  },
  adminCreateUser: (payload: { username: string; password: string; role: ApiUser["role"] }) =>
    request("/api/admin/users", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  adminPatchUser: (id: number, payload: { username?: string; role?: ApiUser["role"]; active?: boolean }) =>
    request(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }) as Promise<{ ok: boolean }>,
  adminResetPassword: (id: number, payload: { password: string }) =>
    request(`/api/admin/users/${id}/reset-password`, { method: "POST", body: JSON.stringify(payload) }) as Promise<{ ok: boolean }>,
  adminListActivityLogs: (params: { q?: string; limit?: number }) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (typeof params.limit === "number") usp.set("limit", String(params.limit));
    const qs = usp.toString();
    return request(`/api/admin/activity-logs${qs ? `?${qs}` : ""}`) as Promise<{ data: ActivityLogRow[] }>;
  },

  listEvents: (params: { q?: string; kind?: EventRow["kind"] }) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.kind) usp.set("kind", params.kind);
    const qs = usp.toString();
    return request(`/api/events${qs ? `?${qs}` : ""}`) as Promise<{ data: EventRow[] }>;
  },
  adminCreateEvent: (payload: {
    title: string;
    kind: EventRow["kind"];
    category?: string | null;
    start_date: string;
    end_date?: string | null;
    location?: string | null;
    description?: string | null;
  }) => request("/api/events", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  adminPatchEvent: (id: number, payload: Partial<Omit<EventRow, "id" | "created_at">>) =>
    request(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }) as Promise<{ ok: boolean }>,

  myEvents: () => request("/api/my/events") as Promise<{ data: MyEventRow[] }>,
  registerEvent: (eventId: number) => request(`/api/events/${eventId}/register`, { method: "POST" }) as Promise<{ ok: boolean }>,
  listEventParticipants: (eventId: number, params?: { q?: string; status?: EventParticipantRow["status"] }) => {
    const usp = new URLSearchParams();
    if (params?.q) usp.set("q", params.q);
    if (params?.status) usp.set("status", params.status);
    const qs = usp.toString();
    return request(`/api/events/${eventId}/participants${qs ? `?${qs}` : ""}`) as Promise<{ data: EventParticipantRow[] }>;
  },
  markEventAttendance: (eventId: number, payload: { student_no: string; status: "Attended" | "Absent" }) =>
    request(`/api/events/${eventId}/attendance`, { method: "POST", body: JSON.stringify(payload) }) as Promise<{ ok: boolean }>,

  listTerms: () => request("/api/terms") as Promise<{ data: TermRow[] }>,
  adminCreateTerm: (payload: { name: string; start_date?: string | null; end_date?: string | null; is_active?: boolean }) =>
    request("/api/terms", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  adminActivateTerm: (termId: number) => request(`/api/terms/${termId}/activate`, { method: "POST" }) as Promise<{ ok: boolean }>,

  listCourses: (params: { q?: string; program?: string }) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.program) usp.set("program", params.program);
    const qs = usp.toString();
    return request(`/api/courses${qs ? `?${qs}` : ""}`) as Promise<{ data: CourseRow[] }>;
  },
  adminCreateCourse: (payload: { code: string; title: string; units?: number | null; program?: string | null }) =>
    request("/api/courses", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,

  listCurriculumVersions: (params: { program?: string }) => {
    const usp = new URLSearchParams();
    if (params.program) usp.set("program", params.program);
    const qs = usp.toString();
    return request(`/api/curriculum/versions${qs ? `?${qs}` : ""}`) as Promise<{ data: CurriculumVersionRow[] }>;
  },
  createCurriculumVersion: (payload: { program: string; name: string }) =>
    request("/api/curriculum/versions", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  activateCurriculumVersion: (id: number) =>
    request(`/api/curriculum/versions/${id}/activate`, { method: "POST" }) as Promise<{ ok: boolean }>,
  listCurriculumTerms: (versionId: number) =>
    request(`/api/curriculum/versions/${versionId}/terms`) as Promise<{ data: CurriculumTermRow[] }>,
  createCurriculumTerm: (versionId: number, payload: { name: string; sort_order?: number }) =>
    request(`/api/curriculum/versions/${versionId}/terms`, { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  deleteCurriculumTerm: (termId: number) =>
    request(`/api/curriculum/terms/${termId}`, { method: "DELETE" }) as Promise<{ ok: boolean }>,
  listCurriculumTermCourses: (termId: number) =>
    request(`/api/curriculum/terms/${termId}/courses`) as Promise<{ data: Array<any> }>,
  addCurriculumTermCourse: (termId: number, payload: { course_id: number }) =>
    request(`/api/curriculum/terms/${termId}/courses`, { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  removeCurriculumTermCourse: (termCourseId: number) =>
    request(`/api/curriculum/term-courses/${termCourseId}`, { method: "DELETE" }) as Promise<{ ok: boolean }>,

  listCoursePrerequisites: (courseId: number) =>
    request(`/api/courses/${courseId}/prerequisites`) as Promise<{ data: CourseRow[] }>,
  addCoursePrerequisite: (courseId: number, payload: { prerequisite_course_id: number }) =>
    request(`/api/courses/${courseId}/prerequisites`, { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,
  removeCoursePrerequisite: (courseId: number, prereqId: number) =>
    request(`/api/courses/${courseId}/prerequisites/${prereqId}`, { method: "DELETE" }) as Promise<{ ok: boolean }>,

  listSections: () => request("/api/sections") as Promise<{ data: SectionRow[] }>,
  adminCreateSection: (payload: { name: string; program?: string | null; year_level?: number | null }) =>
    request("/api/sections", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,

  listRooms: () => request("/api/rooms") as Promise<{ data: RoomRow[] }>,
  adminCreateRoom: (payload: { name: string; capacity?: number | null }) =>
    request("/api/rooms", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,

  listTimeSlots: () => request("/api/time-slots") as Promise<{ data: TimeSlotRow[] }>,
  adminCreateTimeSlot: (payload: { day_of_week: number; start_time: string; end_time: string }) =>
    request("/api/time-slots", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,

  listScheduleOfferings: (params: { term_id?: number }) => {
    const usp = new URLSearchParams();
    if (typeof params.term_id === "number") usp.set("term_id", String(params.term_id));
    const qs = usp.toString();
    return request(`/api/schedule/offerings${qs ? `?${qs}` : ""}`) as Promise<{ data: ScheduleOfferingRow[] }>;
  },
  adminCreateScheduleOffering: (payload: {
    term_id: number;
    course_id: number;
    section_id: number;
    room_id?: number | null;
    time_slot_id?: number | null;
    faculty_id?: number | null;
  }) => request("/api/schedule/offerings", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ id: number }>,

  myFacultyLoad: () => request("/api/faculty/my-load") as Promise<{ data: FacultyLoadRow[] }>,
  myStudentSchedule: () => request("/api/student/my-schedule") as Promise<{ data: StudentScheduleRow[] }>,

  uploadMyDocument: (payload: { kind: string; file: File }) => {
    const form = new FormData();
    form.set("kind", payload.kind);
    form.set("file", payload.file);
    return requestForm("/api/my/documents", form) as Promise<{ id: number }>;
  },
  uploadMaterial: (payload: {
    title: string;
    kind: "Syllabus" | "Lesson" | "Resource";
    description?: string;
    term_id?: number;
    course_id?: number;
    offering_id?: number;
    file?: File;
  }) => {
    const form = new FormData();
    form.set("title", payload.title);
    form.set("kind", payload.kind);
    if (payload.description) form.set("description", payload.description);
    if (typeof payload.term_id === "number") form.set("term_id", String(payload.term_id));
    if (typeof payload.course_id === "number") form.set("course_id", String(payload.course_id));
    if (typeof payload.offering_id === "number") form.set("offering_id", String(payload.offering_id));
    if (payload.file) form.set("file", payload.file);
    return requestForm("/api/materials/upload", form) as Promise<{ id: number }>;
  },

  listMaterials: (params: { term_id?: number; course_id?: number; offering_id?: number; kind?: MaterialRow["kind"] }) => {
    const usp = new URLSearchParams();
    if (typeof params.term_id === "number") usp.set("term_id", String(params.term_id));
    if (typeof params.course_id === "number") usp.set("course_id", String(params.course_id));
    if (typeof params.offering_id === "number") usp.set("offering_id", String(params.offering_id));
    if (params.kind) usp.set("kind", params.kind);
    const qs = usp.toString();
    return request(`/api/materials${qs ? `?${qs}` : ""}`) as Promise<{ data: MaterialRow[] }>;
  },
  myDocuments: () => request("/api/my/documents") as Promise<{ data: StudentDocumentRow[] }>,
  facultyStudentSearch: (q: string) => {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    const qs = usp.toString();
    return request(`/api/faculty/student-search${qs ? `?${qs}` : ""}`) as Promise<{ data: FacultyStudentSearchRow[] }>;
  },
  reportBasketballTryouts: (params: { min_height_cm?: number; require_clearance?: boolean; sport?: string }) => {
    const usp = new URLSearchParams();
    if (typeof params.min_height_cm === "number") usp.set("min_height_cm", String(params.min_height_cm));
    if (typeof params.require_clearance === "boolean") usp.set("require_clearance", params.require_clearance ? "1" : "0");
    if (params.sport) usp.set("sport", params.sport);
    const qs = usp.toString();
    return request(`/api/reports/basketball-tryouts${qs ? `?${qs}` : ""}`) as Promise<{ data: BasketballTryoutRow[] }>;
  },
  reportProgrammingContest: (params: { max_gpa?: number; program?: string; skill?: string }) => {
    const usp = new URLSearchParams();
    if (typeof params.max_gpa === "number") usp.set("max_gpa", String(params.max_gpa));
    if (params.program) usp.set("program", params.program);
    if (params.skill) usp.set("skill", params.skill);
    const qs = usp.toString();
    return request(`/api/reports/programming-contest${qs ? `?${qs}` : ""}`) as Promise<{ data: ProgrammingContestRow[] }>;
  },
};
