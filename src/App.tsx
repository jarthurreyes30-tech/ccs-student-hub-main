import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import RoleRoute from "@/auth/RoleRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import FacultyPage from "./pages/FacultyPage";
import ViolationsPage from "./pages/ViolationsPage";
import AchievementsPage from "./pages/AchievementsPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import AuditPage from "./pages/AuditPage";
import SettingsPage from "./pages/SettingsPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import MyViolationsPage from "./pages/MyViolationsPage";
import MyAchievementsPage from "./pages/MyAchievementsPage";
import MyOrganizationsPage from "./pages/MyOrganizationsPage";
import FacultyProfilePage from "./pages/FacultyProfilePage";
import TeacherToolsPage from "./pages/TeacherToolsPage";
import AdminOverviewPage from "./pages/AdminOverviewPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import EventsPage from "./pages/EventsPage";
import MyEventsPage from "./pages/MyEventsPage";
import SchedulingPage from "./pages/SchedulingPage";
import MySchedulePage from "./pages/MySchedulePage";
import FacultyLoadPage from "./pages/FacultyLoadPage";
import MaterialsPage from "./pages/MaterialsPage";
import MyDocumentsPage from "./pages/MyDocumentsPage";
import ReportsPage from "./pages/ReportsPage";
import CurriculumPage from "./pages/CurriculumPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <AdminOverviewPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin/users"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <AdminUsersPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/my/profile"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["student"]}>
                      <StudentProfilePage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/my/violations"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["student"]}>
                      <MyViolationsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/my/achievements"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["student"]}>
                      <MyAchievementsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/my/organizations"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["student"]}>
                      <MyOrganizationsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/faculty/me"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["faculty"]}>
                      <FacultyProfilePage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/faculty/load"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["faculty"]}>
                      <FacultyLoadPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/faculty/tools"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin", "faculty"]}>
                      <TeacherToolsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/scheduling"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <SchedulingPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/materials"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin", "faculty"]}>
                      <MaterialsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/reports"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin", "faculty"]}>
                      <ReportsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/curriculum"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <CurriculumPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/my/schedule"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["student"]}>
                      <MySchedulePage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/my/documents"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["student"]}>
                      <MyDocumentsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/students"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <StudentsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/faculty"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <FacultyPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/violations"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin", "faculty"]}>
                      <ViolationsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/achievements"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin", "faculty"]}>
                      <AchievementsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/organizations"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <OrganizationsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/events"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin", "faculty"]}>
                      <EventsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/my/events"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["student"]}>
                      <MyEventsPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/audit"
                element={
                  <ProtectedRoute>
                    <RoleRoute allow={["admin"]}>
                      <AuditPage />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
