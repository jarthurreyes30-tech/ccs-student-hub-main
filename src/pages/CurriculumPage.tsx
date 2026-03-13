import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, BookOpen, Trash2, CheckCircle2, Link2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, CourseRow, CurriculumTermRow, CurriculumVersionRow } from "@/lib/api";

const CurriculumPage = () => {
  const { toast } = useToast();

  const [program, setProgram] = useState("BSIT");
  const [versions, setVersions] = useState<CurriculumVersionRow[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [terms, setTerms] = useState<CurriculumTermRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);

  const [loading, setLoading] = useState(false);

  const [createVersionOpen, setCreateVersionOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");

  const [createTermOpen, setCreateTermOpen] = useState(false);
  const [newTermName, setNewTermName] = useState("");
  const [newTermSort, setNewTermSort] = useState("0");

  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termCourses, setTermCourses] = useState<any[]>([]);
  const [addCourseId, setAddCourseId] = useState<string>("");

  const [prereqCourseId, setPrereqCourseId] = useState<string>("");
  const [prereqOfCourseId, setPrereqOfCourseId] = useState<string>("");
  const [prereqs, setPrereqs] = useState<CourseRow[]>([]);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) ?? null,
    [selectedVersionId, versions]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, c] = await Promise.all([api.listCurriculumVersions({ program }), api.listCourses({})]);
      setVersions(v.data);
      setCourses(c.data);

      const active = v.data.find((x) => x.is_active === 1) ?? v.data[0] ?? null;
      const vid = active ? active.id : null;
      setSelectedVersionId(vid);

      if (vid) {
        const t = await api.listCurriculumTerms(vid);
        setTerms(t.data);
      } else {
        setTerms([]);
      }

      setSelectedTermId(null);
      setTermCourses([]);
      setPrereqOfCourseId("");
      setPrereqCourseId("");
      setPrereqs([]);
    } catch (e) {
      toast({ title: "Curriculum", description: e instanceof Error ? e.message : "Unable to load curriculum" });
    } finally {
      setLoading(false);
    }
  }, [program, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const selectVersion = async (id: number) => {
    setSelectedVersionId(id);
    setSelectedTermId(null);
    setTermCourses([]);
    try {
      const t = await api.listCurriculumTerms(id);
      setTerms(t.data);
    } catch (e) {
      toast({ title: "Curriculum", description: e instanceof Error ? e.message : "Unable to load terms" });
    }
  };

  const createVersion = async () => {
    if (!newVersionName.trim()) {
      toast({ title: "Create Curriculum Version", description: "Name is required." });
      return;
    }
    try {
      await api.createCurriculumVersion({ program, name: newVersionName.trim() });
      setNewVersionName("");
      setCreateVersionOpen(false);
      await load();
    } catch (e) {
      toast({ title: "Create Curriculum Version", description: e instanceof Error ? e.message : "Unable to create version" });
    }
  };

  const activateVersion = async (id: number) => {
    try {
      await api.activateCurriculumVersion(id);
      await load();
    } catch (e) {
      toast({ title: "Activate Curriculum", description: e instanceof Error ? e.message : "Unable to activate" });
    }
  };

  const createTerm = async () => {
    if (!selectedVersionId) return;
    if (!newTermName.trim()) {
      toast({ title: "Create Term", description: "Term name is required." });
      return;
    }

    const sort = Number(newTermSort || 0);
    if (!Number.isFinite(sort)) {
      toast({ title: "Create Term", description: "Sort order must be a number." });
      return;
    }

    try {
      await api.createCurriculumTerm(selectedVersionId, { name: newTermName.trim(), sort_order: sort });
      setNewTermName("");
      setNewTermSort("0");
      setCreateTermOpen(false);
      const t = await api.listCurriculumTerms(selectedVersionId);
      setTerms(t.data);
    } catch (e) {
      toast({ title: "Create Term", description: e instanceof Error ? e.message : "Unable to create term" });
    }
  };

  const deleteTerm = async (termId: number) => {
    try {
      await api.deleteCurriculumTerm(termId);
      if (selectedVersionId) {
        const t = await api.listCurriculumTerms(selectedVersionId);
        setTerms(t.data);
      }
      if (selectedTermId === termId) {
        setSelectedTermId(null);
        setTermCourses([]);
      }
    } catch (e) {
      toast({ title: "Delete Term", description: e instanceof Error ? e.message : "Unable to delete term" });
    }
  };

  const selectTerm = async (termId: number) => {
    setSelectedTermId(termId);
    setAddCourseId("");
    try {
      const res = await api.listCurriculumTermCourses(termId);
      setTermCourses(res.data);
    } catch (e) {
      toast({ title: "Term Courses", description: e instanceof Error ? e.message : "Unable to load courses" });
    }
  };

  const addCourseToTerm = async () => {
    if (!selectedTermId) return;
    const courseId = Number(addCourseId);
    if (!Number.isFinite(courseId)) {
      toast({ title: "Add Course", description: "Select a course." });
      return;
    }

    try {
      await api.addCurriculumTermCourse(selectedTermId, { course_id: courseId });
      const res = await api.listCurriculumTermCourses(selectedTermId);
      setTermCourses(res.data);
      setAddCourseId("");
    } catch (e) {
      toast({ title: "Add Course", description: e instanceof Error ? e.message : "Unable to add course" });
    }
  };

  const removeCourseFromTerm = async (termCourseId: number) => {
    if (!selectedTermId) return;
    try {
      await api.removeCurriculumTermCourse(termCourseId);
      const res = await api.listCurriculumTermCourses(selectedTermId);
      setTermCourses(res.data);
    } catch (e) {
      toast({ title: "Remove Course", description: e instanceof Error ? e.message : "Unable to remove course" });
    }
  };

  const loadPrereqs = async (courseId: number) => {
    try {
      const res = await api.listCoursePrerequisites(courseId);
      setPrereqs(res.data);
    } catch (e) {
      toast({ title: "Prerequisites", description: e instanceof Error ? e.message : "Unable to load prerequisites" });
    }
  };

  const addPrereq = async () => {
    const courseId = Number(prereqOfCourseId);
    const prereqId = Number(prereqCourseId);
    if (!Number.isFinite(courseId) || !Number.isFinite(prereqId)) {
      toast({ title: "Add Prerequisite", description: "Select both courses." });
      return;
    }
    try {
      await api.addCoursePrerequisite(courseId, { prerequisite_course_id: prereqId });
      await loadPrereqs(courseId);
      setPrereqCourseId("");
    } catch (e) {
      toast({ title: "Add Prerequisite", description: e instanceof Error ? e.message : "Unable to add prerequisite" });
    }
  };

  const removePrereq = async (courseId: number, prereqCourseIdToRemove: number) => {
    try {
      await api.removeCoursePrerequisite(courseId, prereqCourseIdToRemove);
      await loadPrereqs(courseId);
    } catch (e) {
      toast({ title: "Remove Prerequisite", description: e instanceof Error ? e.message : "Unable to remove prerequisite" });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Curriculum</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage curriculum versions, term mapping, and prerequisites</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BSIT">BSIT</SelectItem>
                <SelectItem value="BSCS">BSCS</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={createVersionOpen} onOpenChange={setCreateVersionOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus size={16} className="mr-2" />
                  New Version
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-foreground">Create Curriculum Version</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input value={newVersionName} onChange={(e) => setNewVersionName(e.target.value)} placeholder="e.g. AY 2025-2026" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" className="border-border text-foreground" onClick={() => setCreateVersionOpen(false)}>Cancel</Button>
                    <Button className="gradient-primary text-primary-foreground" onClick={createVersion}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-border shadow-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-foreground">
                <BookOpen size={18} />
                <p className="font-semibold">Versions</p>
              </div>

              <div className="space-y-2">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    className={`w-full text-left p-3 rounded-lg border ${selectedVersionId === v.id ? "border-primary bg-accent" : "border-border bg-muted"}`}
                    onClick={() => selectVersion(v.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.program}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.is_active === 1 ? (
                          <Badge className="gradient-green text-secondary-foreground">Active</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="border-border text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); activateVersion(v.id); }}>
                            <CheckCircle2 size={14} className="mr-2" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {!loading && versions.length === 0 && (
                  <div className="text-sm text-muted-foreground">No versions yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Terms</p>
                  <p className="text-xs text-muted-foreground">{selectedVersion ? `${selectedVersion.program} • ${selectedVersion.name}` : "Select a curriculum version"}</p>
                </div>

                <Dialog open={createTermOpen} onOpenChange={setCreateTermOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-border text-foreground" disabled={!selectedVersionId}>
                      <Plus size={16} className="mr-2" />
                      New Term
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display text-foreground">Create Term</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label>Name</Label>
                        <Input value={newTermName} onChange={(e) => setNewTermName(e.target.value)} placeholder="e.g. 1st Year - 1st Sem" />
                      </div>
                      <div className="space-y-1">
                        <Label>Sort Order</Label>
                        <Input value={newTermSort} onChange={(e) => setNewTermSort(e.target.value)} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className="border-border text-foreground" onClick={() => setCreateTermOpen(false)}>Cancel</Button>
                        <Button className="gradient-primary text-primary-foreground" onClick={createTerm}>Create</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Term</TableHead>
                        <TableHead className="text-muted-foreground">Order</TableHead>
                        <TableHead className="text-muted-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {terms.map((t) => (
                        <TableRow key={t.id} className="border-border hover:bg-accent/50 transition-colors">
                          <TableCell className="text-foreground">
                            <button className="text-left w-full" onClick={() => selectTerm(t.id)}>
                              <div className="font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground">ID {t.id}</div>
                            </button>
                          </TableCell>
                          <TableCell className="text-foreground">{t.sort_order}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteTerm(t.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && selectedVersionId && terms.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No terms yet</TableCell></TableRow>
                      )}
                      {!selectedVersionId && (
                        <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Select a version</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-foreground">Term Courses</p>
                    <Badge variant="outline" className="border-border text-muted-foreground">{selectedTermId ? `Term ${selectedTermId}` : "No term selected"}</Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <Select value={addCourseId} onValueChange={setAddCourseId} disabled={!selectedTermId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="gradient-primary text-primary-foreground" onClick={addCourseToTerm} disabled={!selectedTermId}>Add</Button>
                  </div>

                  <div className="space-y-2">
                    {termCourses.map((tc) => (
                      <div key={tc.id} className="p-3 rounded-lg bg-muted flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{tc.course_code} — {tc.course_title}</div>
                          <div className="text-xs text-muted-foreground">Units: {tc.units ?? "—"}</div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeCourseFromTerm(tc.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    {selectedTermId && termCourses.length === 0 && (
                      <div className="text-sm text-muted-foreground">No courses assigned.</div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 size={16} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Prerequisites</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                      <Select value={prereqOfCourseId} onValueChange={(v) => { setPrereqOfCourseId(v); const id = Number(v); if (Number.isFinite(id)) loadPrereqs(id); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={prereqCourseId} onValueChange={setPrereqCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Prerequisite" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" className="border-border text-foreground" onClick={addPrereq} disabled={!prereqOfCourseId || !prereqCourseId}>
                      Add prerequisite
                    </Button>

                    <div className="space-y-2 mt-3">
                      {prereqs.map((p) => (
                        <div key={p.id} className="p-3 rounded-lg bg-muted flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{p.code} — {p.title}</div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removePrereq(Number(prereqOfCourseId), p.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                      {prereqOfCourseId && prereqs.length === 0 && (
                        <div className="text-sm text-muted-foreground">No prerequisites set.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CurriculumPage;
