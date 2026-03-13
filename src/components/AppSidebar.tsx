import {
  LayoutDashboard, Users, GraduationCap, ShieldAlert,
  Award, Briefcase, Settings, LogOut, BookOpen, UserCog, Calendar, CalendarClock, FileText, BarChart3, FileUp, Layers
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import ccsLogo from "@/assets/ccs-logo.png";
import pncLogo from "@/assets/pnc-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/dashboard/students", icon: Users },
  { title: "Faculty", url: "/dashboard/faculty", icon: GraduationCap },
  { title: "Scheduling", url: "/dashboard/scheduling", icon: CalendarClock },
  { title: "Materials", url: "/dashboard/materials", icon: FileText },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
  { title: "Events", url: "/dashboard/events", icon: Calendar },
  { title: "Violations", url: "/dashboard/violations", icon: ShieldAlert },
  { title: "Achievements", url: "/dashboard/achievements", icon: Award },
  { title: "Organizations", url: "/dashboard/organizations", icon: Briefcase },
];

const systemNav = [
  { title: "Audit Logs", url: "/dashboard/audit", icon: BookOpen },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const studentNav = [
  { title: "My Profile", url: "/dashboard/my/profile", icon: Users },
  { title: "My Schedule", url: "/dashboard/my/schedule", icon: CalendarClock },
  { title: "My Events", url: "/dashboard/my/events", icon: Calendar },
  { title: "My Violations", url: "/dashboard/my/violations", icon: ShieldAlert },
  { title: "My Achievements", url: "/dashboard/my/achievements", icon: Award },
  { title: "My Organizations", url: "/dashboard/my/organizations", icon: Briefcase },
  { title: "My Documents", url: "/dashboard/my/documents", icon: FileUp },
];

const facultyNav = [
  { title: "My Profile", url: "/dashboard/faculty/me", icon: GraduationCap },
  { title: "My Load", url: "/dashboard/faculty/load", icon: CalendarClock },
  { title: "Teacher Tools", url: "/dashboard/faculty/tools", icon: ShieldAlert },
];

const adminNav = [
  { title: "Admin Overview", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "User Management", url: "/dashboard/admin/users", icon: UserCog },
  { title: "Curriculum", url: "/dashboard/curriculum", icon: Layers },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const role = user?.role;
  const canManageStudents = role === "admin";
  const canManageFaculty = role === "admin";
  const canSeeAudit = role === "admin";

  const canSeeScheduling = role === "admin";
  const canSeeMaterials = role === "admin" || role === "faculty";
  const canSeeReports = role === "admin" || role === "faculty";

  const canSeeViolations = role === "admin" || role === "faculty";
  const canSeeAchievements = role === "admin" || role === "faculty";
  const canSeeOrganizations = role === "admin";
  const canSeeEvents = role === "admin" || role === "faculty";

  const visibleMainNav = mainNav.filter((item) => {
    if (item.title === "Students") return canManageStudents;
    if (item.title === "Faculty") return canManageFaculty;
    if (item.title === "Scheduling") return canSeeScheduling;
    if (item.title === "Materials") return canSeeMaterials;
    if (item.title === "Reports") return canSeeReports;
    if (item.title === "Events") return canSeeEvents;
    if (item.title === "Violations") return canSeeViolations;
    if (item.title === "Achievements") return canSeeAchievements;
    if (item.title === "Organizations") return canSeeOrganizations;
    return true;
  });

  const showStudentNav = role === "student";
  const showFacultyNav = role === "faculty";
  const showAdminNav = role === "admin";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={ccsLogo} alt="CCS" className="w-9 h-9 object-contain flex-shrink-0" />
          {!collapsed && (
            <div>
              <p className="font-display font-bold text-sm text-sidebar-primary leading-tight">CCS Portal</p>
              <p className="text-[10px] text-sidebar-foreground/60">Office Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {showAdminNav && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
              {!collapsed ? "Admin" : ""}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showStudentNav && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
              {!collapsed ? "Student" : ""}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {studentNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showFacultyNav && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
              {!collapsed ? "Faculty" : ""}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {facultyNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
            {!collapsed ? "Main" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
            {!collapsed ? "System" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav
                .filter((item) => (item.title === "Audit Logs" ? canSeeAudit : true))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <NavLink to="/" className="text-destructive hover:text-destructive" onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 pt-3 border-t border-sidebar-border mt-2">
            <img src={pncLogo} alt="PnC" className="w-6 h-6 object-contain" />
            <p className="text-[9px] text-sidebar-foreground/40 leading-tight">
              Pamantasan ng Cabuyao
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
