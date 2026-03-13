import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, KeyRound, ToggleLeft, ToggleRight, UserCog } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, AdminUserRow, ApiUser } from "@/lib/api";

const AdminUsersPage = () => {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | ApiUser["role"]>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "1" | "0">("all");

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "student" as ApiUser["role"] });
  const [creating, setCreating] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetFor, setResetFor] = useState<AdminUserRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminListUsers({
        q: search.trim() ? search.trim() : undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        active: activeFilter !== "all" ? (Number(activeFilter) as 0 | 1) : undefined,
      });
      setRows(res.data);
    } catch (e) {
      toast({ title: "User Management", description: e instanceof Error ? e.message : "Unable to load users" });
    } finally {
      setLoading(false);
    }
  }, [activeFilter, roleFilter, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.username.toLowerCase().includes(q));
  }, [rows, search]);

  const create = async () => {
    if (!newUser.username.trim() || !newUser.password) {
      toast({ title: "Create User", description: "Username and password are required." });
      return;
    }

    setCreating(true);
    try {
      await api.adminCreateUser({ username: newUser.username.trim(), password: newUser.password, role: newUser.role });
      toast({ title: "Create User", description: "User created." });
      setNewUser({ username: "", password: "", role: "student" });
      setCreateOpen(false);
      await load();
    } catch (e) {
      toast({ title: "Create User", description: e instanceof Error ? e.message : "Unable to create user" });
    } finally {
      setCreating(false);
    }
  };

  const patch = async (id: number, payload: { username?: string; role?: ApiUser["role"]; active?: boolean }) => {
    try {
      await api.adminPatchUser(id, payload);
      await load();
    } catch (e) {
      toast({ title: "Update User", description: e instanceof Error ? e.message : "Unable to update user" });
    }
  };

  const toggleActive = async (u: AdminUserRow) => {
    await patch(u.id, { active: u.active === 1 ? false : true });
  };

  const openReset = (u: AdminUserRow) => {
    setResetFor(u);
    setResetPassword("");
    setResetOpen(true);
  };

  const submitReset = async () => {
    if (!resetFor) return;
    if (!resetPassword || resetPassword.length < 6) {
      toast({ title: "Reset Password", description: "Password must be at least 6 characters." });
      return;
    }

    setResetting(true);
    try {
      await api.adminResetPassword(resetFor.id, { password: resetPassword });
      toast({ title: "Reset Password", description: `Password reset for ${resetFor.username}.` });
      setResetOpen(false);
    } catch (e) {
      toast({ title: "Reset Password", description: e instanceof Error ? e.message : "Unable to reset password" });
    } finally {
      setResetting(false);
    }
  };

  const roleBadgeClass = (role: ApiUser["role"]) => {
    if (role === "admin") return "gradient-primary text-primary-foreground";
    if (role === "faculty") return "gradient-green text-secondary-foreground";
    return "bg-muted text-foreground";
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1 text-sm">Create users, assign roles, deactivate accounts, and reset passwords</p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground shadow-card">
                <Plus size={16} className="mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">Create User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Username</Label>
                  <Input value={newUser.username} onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Password</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser((p) => ({ ...p, role: v as ApiUser["role"] }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="gradient-primary text-primary-foreground" onClick={create} disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-4 border-border shadow-card">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by username..."
                  className="pl-10 bg-muted/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") load();
                  }}
                />
              </div>

              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Deactivated</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-border text-foreground" onClick={load}>
                <UserCog size={16} className="mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Username</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Last Login</TableHead>
                    <TableHead className="text-muted-foreground hidden lg:table-cell">Created</TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id} className="border-border hover:bg-accent/50 transition-colors">
                      <TableCell className="font-medium text-foreground">{u.username}</TableCell>
                      <TableCell>
                        <Badge className={roleBadgeClass(u.role)}>{u.role.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.active === 1 ? "border-secondary text-secondary" : "border-destructive text-destructive"}>
                          {u.active === 1 ? "ACTIVE" : "DEACTIVATED"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {u.last_login_at ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {u.created_at}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select value={u.role} onValueChange={(v) => patch(u.id, { role: v as ApiUser["role"] })}>
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => toggleActive(u)}>
                            {u.active === 1 ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </Button>

                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => openReset(u)}>
                            <KeyRound size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {loading && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell></TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">Reset Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="text-sm text-muted-foreground">
                Target user: <span className="text-foreground font-medium">{resetFor?.username ?? "—"}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">New Password</Label>
                <Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
              </div>
              <Button className="gradient-primary text-primary-foreground" onClick={submitReset} disabled={resetting || !resetFor}>
                {resetting ? "Resetting..." : "Reset"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
