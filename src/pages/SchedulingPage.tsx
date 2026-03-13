import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  api,
  CourseRow,
  RoomRow,
  ScheduleOfferingRow,
  SectionRow,
  TermRow,
  TimeSlotRow,
} from "@/lib/api";

const dayLabel: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

const SchedulingPage = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [terms, setTerms] = useState<TermRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [slots, setSlots] = useState<TimeSlotRow[]>([]);
  const [offerings, setOfferings] = useState<ScheduleOfferingRow[]>([]);

  const [termFilter, setTermFilter] = useState<string>("active");

  const activeTermId = useMemo(() => terms.find((t) => t.is_active === 1)?.id ?? null, [terms]);
  const termIdForList = useMemo(() => {
    if (termFilter === "active") return activeTermId;
    if (termFilter === "all") return undefined;
    const n = Number(termFilter);
    return Number.isFinite(n) ? n : undefined;
  }, [activeTermId, termFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, s, r, ts, o] = await Promise.all([
        api.listTerms(),
        api.listCourses({}),
        api.listSections(),
        api.listRooms(),
        api.listTimeSlots(),
        api.listScheduleOfferings({ term_id: typeof termIdForList === "number" ? termIdForList : undefined }),
      ]);
      setTerms(t.data);
      setCourses(c.data);
      setSections(s.data);
      setRooms(r.data);
      setSlots(ts.data);
      setOfferings(o.data);
    } catch (e) {
      toast({ title: "Scheduling", description: e instanceof Error ? e.message : "Unable to load" });
    } finally {
      setLoading(false);
    }
  }, [termIdForList, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const [createTermOpen, setCreateTermOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ name: "", start_date: "", end_date: "", is_active: true });
  const createTerm = async () => {
    if (!newTerm.name.trim()) {
      toast({ title: "Term", description: "Name is required" });
      return;
    }
    try {
      await api.adminCreateTerm({
        name: newTerm.name.trim(),
        start_date: newTerm.start_date.trim() ? newTerm.start_date.trim() : null,
        end_date: newTerm.end_date.trim() ? newTerm.end_date.trim() : null,
        is_active: newTerm.is_active,
      });
      setCreateTermOpen(false);
      setNewTerm({ name: "", start_date: "", end_date: "", is_active: true });
      await load();
      toast({ title: "Term", description: "Created." });
    } catch (e) {
      toast({ title: "Term", description: e instanceof Error ? e.message : "Unable to create" });
    }
  };

  const activateTerm = async (id: number) => {
    try {
      await api.adminActivateTerm(id);
      await load();
      toast({ title: "Term", description: "Activated." });
    } catch (e) {
      toast({ title: "Term", description: e instanceof Error ? e.message : "Unable to activate" });
    }
  };

  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ code: "", title: "", units: "", program: "" });
  const createCourse = async () => {
    if (!newCourse.code.trim() || !newCourse.title.trim()) {
      toast({ title: "Course", description: "Code and title are required" });
      return;
    }
    try {
      await api.adminCreateCourse({
        code: newCourse.code.trim(),
        title: newCourse.title.trim(),
        units: newCourse.units.trim() ? Number(newCourse.units) : null,
        program: newCourse.program.trim() ? newCourse.program.trim() : null,
      });
      setCreateCourseOpen(false);
      setNewCourse({ code: "", title: "", units: "", program: "" });
      await load();
      toast({ title: "Course", description: "Created." });
    } catch (e) {
      toast({ title: "Course", description: e instanceof Error ? e.message : "Unable to create" });
    }
  };

  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [newSection, setNewSection] = useState({ name: "", program: "", year_level: "" });
  const createSection = async () => {
    if (!newSection.name.trim()) {
      toast({ title: "Section", description: "Name is required" });
      return;
    }
    try {
      await api.adminCreateSection({
        name: newSection.name.trim(),
        program: newSection.program.trim() ? newSection.program.trim() : null,
        year_level: newSection.year_level.trim() ? Number(newSection.year_level) : null,
      });
      setCreateSectionOpen(false);
      setNewSection({ name: "", program: "", year_level: "" });
      await load();
      toast({ title: "Section", description: "Created." });
    } catch (e) {
      toast({ title: "Section", description: e instanceof Error ? e.message : "Unable to create" });
    }
  };

  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });
  const createRoom = async () => {
    if (!newRoom.name.trim()) {
      toast({ title: "Room", description: "Name is required" });
      return;
    }
    try {
      await api.adminCreateRoom({
        name: newRoom.name.trim(),
        capacity: newRoom.capacity.trim() ? Number(newRoom.capacity) : null,
      });
      setCreateRoomOpen(false);
      setNewRoom({ name: "", capacity: "" });
      await load();
      toast({ title: "Room", description: "Created." });
    } catch (e) {
      toast({ title: "Room", description: e instanceof Error ? e.message : "Unable to create" });
    }
  };

  const [createSlotOpen, setCreateSlotOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({ day_of_week: "1", start_time: "08:00", end_time: "10:00" });
  const createSlot = async () => {
    try {
      await api.adminCreateTimeSlot({
        day_of_week: Number(newSlot.day_of_week),
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
      });
      setCreateSlotOpen(false);
      setNewSlot({ day_of_week: "1", start_time: "08:00", end_time: "10:00" });
      await load();
      toast({ title: "Time Slot", description: "Created." });
    } catch (e) {
      toast({ title: "Time Slot", description: e instanceof Error ? e.message : "Unable to create" });
    }
  };

  const [createOfferingOpen, setCreateOfferingOpen] = useState(false);
  const [newOffering, setNewOffering] = useState({
    term_id: "",
    course_id: "",
    section_id: "",
    room_id: "",
    time_slot_id: "",
    faculty_id: "",
  });

  const [facultyRows, setFacultyRows] = useState<any[]>([]);
  const loadFaculty = useCallback(async () => {
    try {
      const res = await api.listFaculty({});
      setFacultyRows(res.data as any[]);
    } catch {
      setFacultyRows([]);
    }
  }, []);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  const createOffering = async () => {
    const term_id = Number(newOffering.term_id || activeTermId || "");
    const course_id = Number(newOffering.course_id);
    const section_id = Number(newOffering.section_id);
    const room_id = newOffering.room_id ? Number(newOffering.room_id) : null;
    const time_slot_id = newOffering.time_slot_id ? Number(newOffering.time_slot_id) : null;
    const faculty_id = newOffering.faculty_id ? Number(newOffering.faculty_id) : null;

    if (!Number.isFinite(term_id) || !Number.isFinite(course_id) || !Number.isFinite(section_id)) {
      toast({ title: "Offering", description: "Term/Course/Section are required" });
      return;
    }

    try {
      await api.adminCreateScheduleOffering({ term_id, course_id, section_id, room_id, time_slot_id, faculty_id });
      setCreateOfferingOpen(false);
      setNewOffering({ term_id: "", course_id: "", section_id: "", room_id: "", time_slot_id: "", faculty_id: "" });
      await load();
      toast({ title: "Offering", description: "Created." });
    } catch (e) {
      toast({ title: "Offering", description: e instanceof Error ? e.message : "Unable to create" });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Scheduling</h1>
            <p className="text-muted-foreground mt-1 text-sm">Terms, courses, sections, rooms, time slots, and schedule offerings</p>
          </div>
          <Button variant="outline" className="border-border text-foreground" onClick={load} disabled={loading}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="border-border shadow-card">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base font-sans font-semibold text-foreground">Academic Terms</CardTitle>
              <Dialog open={createTermOpen} onOpenChange={setCreateTermOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-primary text-primary-foreground">
                    <Plus size={14} className="mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display text-foreground">Create Term</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-foreground">Name</Label>
                      <Input value={newTerm.name} onChange={(e) => setNewTerm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-foreground">Start</Label>
                        <Input type="date" value={newTerm.start_date} onChange={(e) => setNewTerm((p) => ({ ...p, start_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">End</Label>
                        <Input type="date" value={newTerm.end_date} onChange={(e) => setNewTerm((p) => ({ ...p, end_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Set Active</Label>
                      <Select value={newTerm.is_active ? "1" : "0"} onValueChange={(v) => setNewTerm((p) => ({ ...p, is_active: v === "1" }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Yes</SelectItem>
                          <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="gradient-primary text-primary-foreground" onClick={createTerm}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terms.map((t) => (
                      <TableRow key={t.id} className="border-border">
                        <TableCell className="text-foreground">{t.name}</TableCell>
                        <TableCell>
                          {t.is_active === 1 ? (
                            <Badge className="gradient-green text-secondary-foreground">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="border-border text-foreground">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border text-foreground"
                            disabled={t.is_active === 1}
                            onClick={() => activateTerm(t.id)}
                          >
                            Activate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {terms.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No terms</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base font-sans font-semibold text-foreground">Schedule Offerings</CardTitle>
              <Dialog open={createOfferingOpen} onOpenChange={setCreateOfferingOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-primary text-primary-foreground">
                    <CalendarClock size={14} className="mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-display text-foreground">Create Offering</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-foreground">Term</Label>
                      <Select
                        value={newOffering.term_id || (activeTermId ? String(activeTermId) : "")}
                        onValueChange={(v) => setNewOffering((p) => ({ ...p, term_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Course</Label>
                      <Select value={newOffering.course_id} onValueChange={(v) => setNewOffering((p) => ({ ...p, course_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Section</Label>
                      <Select value={newOffering.section_id} onValueChange={(v) => setNewOffering((p) => ({ ...p, section_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Room</Label>
                      <Select value={newOffering.room_id} onValueChange={(v) => setNewOffering((p) => ({ ...p, room_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {rooms.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Time Slot</Label>
                      <Select value={newOffering.time_slot_id} onValueChange={(v) => setNewOffering((p) => ({ ...p, time_slot_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {slots.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{dayLabel[s.day_of_week]} {s.start_time}-{s.end_time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Faculty</Label>
                      <Select value={newOffering.faculty_id} onValueChange={(v) => setNewOffering((p) => ({ ...p, faculty_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {facultyRows.map((f) => (
                            <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button className="gradient-primary text-primary-foreground" onClick={createOffering}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Select value={termFilter} onValueChange={setTermFilter}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active term</SelectItem>
                    <SelectItem value="all">All terms</SelectItem>
                    {terms.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Term</TableHead>
                      <TableHead className="text-muted-foreground">Course</TableHead>
                      <TableHead className="text-muted-foreground">Section</TableHead>
                      <TableHead className="text-muted-foreground">Slot</TableHead>
                      <TableHead className="text-muted-foreground">Room</TableHead>
                      <TableHead className="text-muted-foreground">Faculty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offerings.map((o) => (
                      <TableRow key={o.id} className="border-border">
                        <TableCell className="text-foreground">{o.term_name}</TableCell>
                        <TableCell className="text-foreground">{o.course_code} — {o.course_title}</TableCell>
                        <TableCell className="text-foreground">{o.section_name}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap">
                          {o.day_of_week ? `${dayLabel[o.day_of_week]} ${o.start_time ?? ""}-${o.end_time ?? ""}` : "—"}
                        </TableCell>
                        <TableCell className="text-foreground">{o.room_name ?? "—"}</TableCell>
                        <TableCell className="text-foreground">{o.faculty_name ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {offerings.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No offerings</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border shadow-card">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base font-sans font-semibold text-foreground">Courses</CardTitle>
              <Dialog open={createCourseOpen} onOpenChange={setCreateCourseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-border text-foreground">
                    <Plus size={14} className="mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display text-foreground">Create Course</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-foreground">Code</Label>
                      <Input value={newCourse.code} onChange={(e) => setNewCourse((p) => ({ ...p, code: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Title</Label>
                      <Input value={newCourse.title} onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-foreground">Units</Label>
                        <Input value={newCourse.units} onChange={(e) => setNewCourse((p) => ({ ...p, units: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Program</Label>
                        <Input value={newCourse.program} onChange={(e) => setNewCourse((p) => ({ ...p, program: e.target.value }))} placeholder="BSCS / BSIT" />
                      </div>
                    </div>
                    <Button className="gradient-primary text-primary-foreground" onClick={createCourse}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Code</TableHead>
                      <TableHead className="text-muted-foreground">Title</TableHead>
                      <TableHead className="text-muted-foreground">Program</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.slice(0, 10).map((c) => (
                      <TableRow key={c.id} className="border-border">
                        <TableCell className="font-mono text-foreground">{c.code}</TableCell>
                        <TableCell className="text-foreground">{c.title}</TableCell>
                        <TableCell className="text-foreground">{c.program ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {courses.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No courses</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base font-sans font-semibold text-foreground">Sections / Rooms / Time Slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Dialog open={createSectionOpen} onOpenChange={setCreateSectionOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-border text-foreground">Add Section</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-display text-foreground">Create Section</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2"><Label className="text-foreground">Name</Label><Input value={newSection.name} onChange={(e) => setNewSection((p) => ({ ...p, name: e.target.value }))} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2"><Label className="text-foreground">Program</Label><Input value={newSection.program} onChange={(e) => setNewSection((p) => ({ ...p, program: e.target.value }))} /></div>
                        <div className="space-y-2"><Label className="text-foreground">Year</Label><Input value={newSection.year_level} onChange={(e) => setNewSection((p) => ({ ...p, year_level: e.target.value }))} /></div>
                      </div>
                      <Button className="gradient-primary text-primary-foreground" onClick={createSection}>Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-border text-foreground">Add Room</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-display text-foreground">Create Room</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2"><Label className="text-foreground">Name</Label><Input value={newRoom.name} onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))} /></div>
                      <div className="space-y-2"><Label className="text-foreground">Capacity</Label><Input value={newRoom.capacity} onChange={(e) => setNewRoom((p) => ({ ...p, capacity: e.target.value }))} /></div>
                      <Button className="gradient-primary text-primary-foreground" onClick={createRoom}>Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={createSlotOpen} onOpenChange={setCreateSlotOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-border text-foreground">Add Slot</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-display text-foreground">Create Time Slot</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-foreground">Day</Label>
                        <Select value={newSlot.day_of_week} onValueChange={(v) => setNewSlot((p) => ({ ...p, day_of_week: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(dayLabel).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2"><Label className="text-foreground">Start</Label><Input value={newSlot.start_time} onChange={(e) => setNewSlot((p) => ({ ...p, start_time: e.target.value }))} /></div>
                        <div className="space-y-2"><Label className="text-foreground">End</Label><Input value={newSlot.end_time} onChange={(e) => setNewSlot((p) => ({ ...p, end_time: e.target.value }))} /></div>
                      </div>
                      <Button className="gradient-primary text-primary-foreground" onClick={createSlot}>Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Sections</div>
                  <div className="text-sm text-foreground">{sections.length}</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Rooms</div>
                  <div className="text-sm text-foreground">{rooms.length}</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-2">Time Slots</div>
                  <div className="text-sm text-foreground">{slots.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchedulingPage;
