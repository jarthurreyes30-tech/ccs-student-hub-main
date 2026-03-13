import { useEffect, useMemo, useState } from "react";
import { Search, Download, Plus, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";

type StudentRow = {
  id: number;
  student_no: string;
  first_name: string;
  last_name: string;
  email: string | null;
  program: string | null;
  year_level: number | null;
  section: string | null;
  enrollment_status: string | null;
  academic_status: string | null;
  skills: string[];
  sports_interests?: string[];
  gpa?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  medical_clearance_status?: string | null;
  medical_notes?: string | null;
  employment_status?: string | null;
  company?: string | null;
  position?: string | null;
  internship_status?: string | null;
};

const StudentsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.listStudents({
          q: search.trim() ? search.trim() : undefined,
          program: programFilter !== "all" ? programFilter : undefined,
        });
        setRows(res.data as StudentRow[]);
      } catch (e) {
        toast({ title: "Students", description: e instanceof Error ? e.message : "Unable to load students" });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [programFilter, search, toast]);

  const filtered = rows;

  const programOptions = useMemo(() => {
    const programs = new Set<string>();
    for (const r of rows) {
      if (r.program) programs.add(r.program);
    }
    return Array.from(programs).sort();
  }, [rows]);

  const exportCsv = () => {
    const headers = ["student_no", "first_name", "last_name", "program", "year_level", "section", "enrollment_status", "academic_status", "email"];
    const exportRows = filtered.map((s) => [
      s.student_no,
      s.first_name,
      s.last_name,
      s.program ?? "",
      s.year_level ?? "",
      s.section ?? "",
      s.enrollment_status ?? "",
      s.academic_status ?? "",
      s.email ?? "",
    ]);
    const csv = [headers, ...exportRows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast({ title: "Export", description: "Student records exported as CSV." });
  };

  const addStudent = () => {
    toast({ title: "Add Student", description: "Student creation form will be added next." });
  };

  const openEdit = (s: StudentRow) => {
    setSelected(s);
    setForm({
      student_no: s.student_no,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email ?? "",
      program: s.program ?? "",
      year_level: s.year_level ?? "",
      section: s.section ?? "",
      enrollment_status: s.enrollment_status ?? "",
      academic_status: s.academic_status ?? "",
      gpa: s.gpa ?? "",
      height_cm: s.height_cm ?? "",
      weight_kg: s.weight_kg ?? "",
      medical_clearance_status: s.medical_clearance_status ?? "",
      medical_notes: s.medical_notes ?? "",
      employment_status: s.employment_status ?? "",
      company: s.company ?? "",
      position: s.position ?? "",
      internship_status: s.internship_status ?? "",
      skills: Array.isArray(s.skills) ? s.skills.join(", ") : "",
      sports_interests: Array.isArray(s.sports_interests) ? s.sports_interests.join(", ") : "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selected || !form) return;
    if (!String(form.student_no || "").trim() || !String(form.first_name || "").trim() || !String(form.last_name || "").trim()) {
      toast({ title: "Update Student", description: "Student ID, First Name, and Last Name are required." });
      return;
    }

    const payload = {
      student_no: String(form.student_no).trim(),
      first_name: String(form.first_name).trim(),
      last_name: String(form.last_name).trim(),
      email: String(form.email || "").trim() || null,
      program: String(form.program || "").trim() || null,
      year_level: String(form.year_level || "").trim() ? Number(form.year_level) : null,
      section: String(form.section || "").trim() || null,
      enrollment_status: String(form.enrollment_status || "").trim() || null,
      academic_status: String(form.academic_status || "").trim() || null,
      gpa: String(form.gpa || "").trim() ? Number(form.gpa) : null,
      height_cm: String(form.height_cm || "").trim() ? Number(form.height_cm) : null,
      weight_kg: String(form.weight_kg || "").trim() ? Number(form.weight_kg) : null,
      medical_clearance_status: String(form.medical_clearance_status || "").trim() || null,
      medical_notes: String(form.medical_notes || "").trim() || null,
      employment_status: String(form.employment_status || "").trim() || null,
      company: String(form.company || "").trim() || null,
      position: String(form.position || "").trim() || null,
      internship_status: String(form.internship_status || "").trim() || null,
      skills: String(form.skills || "")
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean),
      sports_interests: String(form.sports_interests || "")
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean),
    };

    if (payload.year_level !== null && !Number.isFinite(payload.year_level)) {
      toast({ title: "Update Student", description: "Year level must be a number." });
      return;
    }
    if (payload.gpa !== null && !Number.isFinite(payload.gpa)) {
      toast({ title: "Update Student", description: "GPA must be a number." });
      return;
    }
    if (payload.height_cm !== null && !Number.isFinite(payload.height_cm)) {
      toast({ title: "Update Student", description: "Height must be a number." });
      return;
    }
    if (payload.weight_kg !== null && !Number.isFinite(payload.weight_kg)) {
      toast({ title: "Update Student", description: "Weight must be a number." });
      return;
    }

    setSaving(true);
    try {
      await api.patchStudent(selected.id, payload);
      toast({ title: "Update Student", description: "Student profile updated." });
      setEditOpen(false);
      const res = await api.listStudents({
        q: search.trim() ? search.trim() : undefined,
        program: programFilter !== "all" ? programFilter : undefined,
      });
      setRows(res.data as StudentRow[]);
    } catch (e) {
      toast({ title: "Update Student", description: e instanceof Error ? e.message : "Unable to update student" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage student profiles and records</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-card" onClick={addStudent}>
            <Plus size={16} className="mr-2" />
            Add Student
          </Button>
        </div>

        <Card className="mb-4 border-border shadow-card">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name or ID..." className="pl-10 bg-muted/50" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-border text-foreground" onClick={exportCsv}>
                <Download size={16} className="mr-2" />
                Export
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
                    <TableHead className="text-muted-foreground">Student ID</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Program</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Year</TableHead>
                    <TableHead className="text-muted-foreground hidden lg:table-cell">Enrollment</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className="border-border hover:bg-accent/50 transition-colors">
                      <TableCell className="font-mono text-sm text-foreground">{s.student_no}</TableCell>
                      <TableCell className="font-medium text-foreground">{s.last_name}, {s.first_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {s.program ? (
                          <Badge className={s.program === "BSIT" ? "gradient-primary text-primary-foreground" : "gradient-green text-secondary-foreground"}>
                            {s.program}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-foreground">{s.year_level ?? "—"} - {s.section ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className={
                          s.enrollment_status === "Enrolled" ? "border-secondary text-secondary" :
                          s.enrollment_status === "Graduated" ? "border-primary text-primary" :
                          "border-destructive text-destructive"
                        }>
                          {s.enrollment_status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${
                          s.academic_status === "Good Standing" ? "text-secondary" :
                          s.academic_status === "Graduated" ? "text-primary" :
                          "text-destructive"
                        }`}>
                          {s.academic_status ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelected(s)} className="text-muted-foreground hover:text-foreground">
                              <Eye size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="font-display text-foreground">Student Profile</DialogTitle>
                            </DialogHeader>
                            {selected && (
                              <div className="space-y-4 mt-2">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                    {`${selected.first_name[0] ?? ""}${selected.last_name[0] ?? ""}`}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{selected.last_name}, {selected.first_name}</p>
                                    <p className="text-sm text-muted-foreground">{selected.email ?? ""}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Student ID</p><p className="text-sm font-mono text-foreground">{selected.student_no}</p></div>
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Program</p><p className="text-sm text-foreground">{selected.program ?? "—"}</p></div>
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Year & Section</p><p className="text-sm text-foreground">{selected.year_level ?? "—"} - Section {selected.section ?? "—"}</p></div>
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Enrollment</p><p className="text-sm text-foreground">{selected.enrollment_status ?? "—"}</p></div>
                                </div>
                                <div className="flex justify-end">
                                  <Button className="gradient-primary text-primary-foreground" onClick={() => openEdit(selected)}>
                                    <Pencil size={14} className="mr-2" />
                                    Edit
                                  </Button>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(selected.skills ?? []).map((sk) => (
                                      <Badge key={sk} variant="outline" className="border-primary/30 text-primary text-xs">{sk}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading students...</TableCell></TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">Edit Student</DialogTitle>
            </DialogHeader>
            {selected && form && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Student ID</Label>
                    <Input value={form.student_no} onChange={(e) => setForm({ ...form, student_no: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>First Name</Label>
                    <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Last Name</Label>
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Program</Label>
                    <Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="BSIT / BSCS" />
                  </div>
                  <div className="space-y-1">
                    <Label>Year Level</Label>
                    <Input value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Section</Label>
                    <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Enrollment Status</Label>
                    <Input value={form.enrollment_status} onChange={(e) => setForm({ ...form, enrollment_status: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Academic Status</Label>
                    <Input value={form.academic_status} onChange={(e) => setForm({ ...form, academic_status: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>GPA</Label>
                    <Input value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Height (cm)</Label>
                    <Input value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Weight (kg)</Label>
                    <Input value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Medical Clearance Status</Label>
                    <Input value={form.medical_clearance_status} onChange={(e) => setForm({ ...form, medical_clearance_status: e.target.value })} placeholder="Cleared / Pending" />
                  </div>
                  <div className="space-y-1">
                    <Label>Internship Status</Label>
                    <Input value={form.internship_status} onChange={(e) => setForm({ ...form, internship_status: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Medical Notes</Label>
                  <Textarea value={form.medical_notes} onChange={(e) => setForm({ ...form, medical_notes: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Employment Status</Label>
                    <Input value={form.employment_status} onChange={(e) => setForm({ ...form, employment_status: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Company</Label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Position</Label>
                    <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Skills (comma separated)</Label>
                    <Textarea value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Sports Interests (comma separated)</Label>
                    <Textarea value={form.sports_interests} onChange={(e) => setForm({ ...form, sports_interests: e.target.value })} />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" className="border-border text-foreground" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
                  <Button className="gradient-primary text-primary-foreground" onClick={saveEdit} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;
