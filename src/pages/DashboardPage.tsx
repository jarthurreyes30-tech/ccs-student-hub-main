import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, GraduationCap, ShieldAlert, Award, Briefcase, BookOpen, TrendingUp, UserCheck, Calendar, Search, CalendarClock, FileText, BarChart3, FileUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/auth/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, FacultyStudentSearchRow } from "@/lib/api";

const managementModules = [
  { title: "Student Profiling", description: "Manage student records, enrollment status, and academic standing.", icon: Users, count: "Records", gradient: "gradient-primary", path: "/dashboard/students" },
  { title: "Faculty Profiling", description: "Track faculty members, academic rank, and qualifications.", icon: GraduationCap, count: "Records", gradient: "gradient-green", path: "/dashboard/faculty" },
  { title: "Events", description: "Create events, track participation, and record attendance.", icon: Calendar, count: "Events", gradient: "gradient-green", path: "/dashboard/events" },
  { title: "Violations Tracker", description: "Monitor and manage student violations and sanctions.", icon: ShieldAlert, count: "Tracker", gradient: "gradient-primary", path: "/dashboard/violations" },
  { title: "Achievements", description: "Record student achievements in school and external events.", icon: Award, count: "Entries", gradient: "gradient-green", path: "/dashboard/achievements" },
  { title: "Organizations", description: "Manage student organizations and memberships.", icon: Briefcase, count: "Orgs", gradient: "gradient-primary", path: "/dashboard/organizations" },
];

const adminOnlyModules = [
  { title: "Audit Logs", description: "Track all user actions for security and accountability.", icon: BookOpen, count: "Logs", gradient: "gradient-green", path: "/dashboard/audit" },
];

const studentModules = [
  { title: "My Profile", description: "View your student profile and records.", icon: Users, count: "Profile", gradient: "gradient-primary", path: "/dashboard/my/profile" },
  { title: "My Schedule", description: "View your class schedule.", icon: CalendarClock, count: "Schedule", gradient: "gradient-green", path: "/dashboard/my/schedule" },
  { title: "My Events", description: "Browse and register for events, and track attendance.", icon: Calendar, count: "Events", gradient: "gradient-green", path: "/dashboard/my/events" },
  { title: "My Violations", description: "View your violations and status.", icon: ShieldAlert, count: "Status", gradient: "gradient-primary", path: "/dashboard/my/violations" },
  { title: "My Achievements", description: "View your achievements and awards.", icon: Award, count: "Entries", gradient: "gradient-green", path: "/dashboard/my/achievements" },
  { title: "My Organizations", description: "View your organization memberships.", icon: Briefcase, count: "Orgs", gradient: "gradient-primary", path: "/dashboard/my/organizations" },
  { title: "My Documents", description: "Upload and manage your documents.", icon: FileUp, count: "Files", gradient: "gradient-green", path: "/dashboard/my/documents" },
];

const facultyModules = [
  { title: "My Profile", description: "View your faculty profile.", icon: GraduationCap, count: "Profile", gradient: "gradient-green", path: "/dashboard/faculty/me" },
  { title: "My Load", description: "View your teaching load and schedule.", icon: CalendarClock, count: "Load", gradient: "gradient-green", path: "/dashboard/faculty/load" },
  { title: "Teacher Tools", description: "Record violations and achievements.", icon: ShieldAlert, count: "Tools", gradient: "gradient-primary", path: "/dashboard/faculty/tools" },
  { title: "Materials", description: "Upload syllabi and learning resources.", icon: FileText, count: "Files", gradient: "gradient-green", path: "/dashboard/materials" },
  { title: "Reports", description: "Run qualification queries and reports.", icon: BarChart3, count: "Reports", gradient: "gradient-primary", path: "/dashboard/reports" },
  { title: "Events", description: "Monitor events and record student attendance.", icon: Calendar, count: "Events", gradient: "gradient-green", path: "/dashboard/events" },
];

const recentActivity = [
  { action: "New student enrolled", user: "Admin", time: "2 min ago" },
  { action: "Violation resolved - Juan Dela Cruz", user: "Dean", time: "15 min ago" },
  { action: "Faculty profile updated", user: "HR Staff", time: "1 hour ago" },
  { action: "Achievement recorded", user: "Adviser", time: "2 hours ago" },
  { action: "Password reset requested", user: "Student", time: "3 hours ago" },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === "admin";
  const isFaculty = role === "faculty";
  const isStudent = role === "student";

  const pageTitle = isAdmin ? "Admin Dashboard" : isFaculty ? "Faculty Dashboard" : "Student Dashboard";
  const pageSubtitle = isAdmin
    ? "System administration, profiling, and monitoring"
    : isFaculty
      ? "Teaching support and student academic monitoring"
      : "Your profile, records, and participation";

  const displayName = user?.username ?? "";

  const [studentSearch, setStudentSearch] = useState("");
  const [studentMatches, setStudentMatches] = useState<FacultyStudentSearchRow[]>([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);

  const runStudentSearch = useCallback(async () => {
    const q = studentSearch.trim();
    if (!q) {
      setStudentMatches([]);
      return;
    }
    setStudentSearchLoading(true);
    try {
      const res = await api.facultyStudentSearch(q);
      setStudentMatches(res.data);
    } catch {
      setStudentMatches([]);
    } finally {
      setStudentSearchLoading(false);
    }
  }, [studentSearch]);

  useEffect(() => {
    if (!isFaculty) return;
    const t = setTimeout(() => {
      runStudentSearch();
    }, 250);
    return () => clearTimeout(t);
  }, [isFaculty, runStudentSearch]);

  const stats = isAdmin
    ? [
        { label: "Students", value: "—", icon: Users, trend: " ", color: "text-primary" },
        { label: "Faculty", value: "—", icon: GraduationCap, trend: " ", color: "text-secondary" },
        { label: "Violations", value: "—", icon: ShieldAlert, trend: " ", color: "text-destructive" },
        { label: "Achievements", value: "—", icon: Award, trend: " ", color: "text-accent-foreground" },
      ]
    : [];

  const modules = isAdmin
    ? [...managementModules, ...adminOnlyModules]
    : isFaculty
      ? facultyModules
      : studentModules;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          {isStudent ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Welcome, {displayName}</h1>
              <p className="text-muted-foreground mt-1 text-sm">Pamantasan ng Cabuyao (University of Cabuyao) — Dangal ng Bayan</p>
              <p className="text-muted-foreground text-sm">College of Computing Studies</p>
            </div>
          ) : isFaculty ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Welcome, Faculty {displayName}</h1>
              <p className="text-muted-foreground mt-1 text-sm">Quick access to student information and teaching tools</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{pageTitle}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{pageSubtitle}</p>
            </div>
          )}
        </div>

        {!!stats.length && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {stats.map((stat, i) => (
              <Card key={stat.label} className="shadow-card border-border hover:shadow-elevated transition-all animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <stat.icon size={20} className={stat.color} />
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-secondary">
                      <TrendingUp size={12} />
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isFaculty ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="border-border shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-sans font-semibold text-foreground">Teaching Workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button className="justify-start gradient-green text-secondary-foreground" onClick={() => navigate("/dashboard/faculty/load")}>My Load</Button>
                  <Button className="justify-start gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard/faculty/tools")}>Teacher Tools</Button>
                  <Button variant="outline" className="justify-start border-border text-foreground" onClick={() => navigate("/dashboard/materials")}>Materials</Button>
                  <Button variant="outline" className="justify-start border-border text-foreground" onClick={() => navigate("/dashboard/reports")}>Reports</Button>
                  <Button variant="outline" className="justify-start border-border text-foreground sm:col-span-2" onClick={() => navigate("/dashboard/events")}>Events Attendance</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-[10px] text-muted-foreground">Today</p>
                    <p className="text-sm font-semibold text-foreground">Check schedule</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-[10px] text-muted-foreground">Action</p>
                    <p className="text-sm font-semibold text-foreground">Record a violation/achievement</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-[10px] text-muted-foreground">Resources</p>
                    <p className="text-sm font-semibold text-foreground">Upload materials</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-sans font-semibold text-foreground">Student Lookup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 mb-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-10 bg-muted/50"
                      placeholder="Search student no or name..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="border-border text-foreground" onClick={runStudentSearch} disabled={studentSearchLoading}>
                    Search
                  </Button>
                </div>

                <div className="space-y-2">
                  {studentMatches.map((s) => (
                    <div key={s.student_no} className="p-3 rounded-lg bg-muted flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{s.last_name}, {s.first_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{s.student_no} · {s.program ?? "—"} · {s.year_level ?? "—"}-{s.section ?? "—"}</div>
                      </div>
                      <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard/students")}>Open</Button>
                    </div>
                  ))}
                  {studentSearch.trim() && !studentSearchLoading && studentMatches.length === 0 && (
                    <div className="text-sm text-muted-foreground">No matches.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-sans font-semibold text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentActivity.slice(0, 6).map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted">
                      <p className="text-sm text-foreground truncate">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.user} • {item.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-4">{isAdmin ? "Admin Modules" : "Quick Access"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {modules.map((mod, i) => (
                <Card
                  key={mod.title}
                  className="group cursor-pointer shadow-card border-border hover:shadow-elevated transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                  onClick={() => navigate(mod.path)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-lg ${mod.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <mod.icon size={20} className="text-primary-foreground" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">{mod.count}</span>
                    </div>
                    <CardTitle className="text-sm sm:text-base font-semibold text-foreground mt-3 font-sans">{mod.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isStudent && !isFaculty && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-sans font-semibold text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <UserCheck size={14} className="text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.user} • {item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-sans font-semibold text-foreground">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 rounded-lg bg-accent">
                  <p className="text-xs sm:text-sm font-semibold text-accent-foreground mb-2">Programs Offered</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full gradient-primary text-primary-foreground text-[10px] sm:text-xs font-semibold">BS Information Technology</span>
                    <span className="px-3 py-1 rounded-full gradient-green text-secondary-foreground text-[10px] sm:text-xs font-semibold">BS Computer Science</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted">
                  <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">Academic Year</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">2025–2026 | 2nd Semester</p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted">
                  <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">System Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">All systems operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
