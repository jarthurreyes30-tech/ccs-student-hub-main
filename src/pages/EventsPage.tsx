import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Search, UserCheck, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, EventParticipantRow, EventRow } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

const EventsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | EventRow["kind"]>("all");

  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    kind: "Extra-curricular" as EventRow["kind"],
    category: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    location: "",
    description: "",
  });

  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantsFor, setParticipantsFor] = useState<EventRow | null>(null);
  const [participants, setParticipants] = useState<EventParticipantRow[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);
  const [participantQ, setParticipantQ] = useState("");
  const [participantStatus, setParticipantStatus] = useState<"all" | EventParticipantRow["status"]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listEvents({ q: q.trim() ? q.trim() : undefined, kind: kind !== "all" ? kind : undefined });
      setRows(res.data);
    } catch (e) {
      toast({ title: "Events", description: e instanceof Error ? e.message : "Unable to load events" });
    } finally {
      setLoading(false);
    }
  }, [kind, q, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => rows, [rows]);

  const openParticipants = async (ev: EventRow) => {
    setParticipantsFor(ev);
    setParticipantsOpen(true);
    setParticipantQ("");
    setParticipantStatus("all");
    setParticipantsLoading(true);
    try {
      const res = await api.listEventParticipants(ev.id);
      setParticipants(res.data);
    } catch (e) {
      toast({ title: "Participants", description: e instanceof Error ? e.message : "Unable to load participants" });
    } finally {
      setParticipantsLoading(false);
    }
  };

  const refreshParticipants = async () => {
    if (!participantsFor) return;
    setParticipantsLoading(true);
    try {
      const res = await api.listEventParticipants(participantsFor.id, {
        q: participantQ.trim() ? participantQ.trim() : undefined,
        status: participantStatus !== "all" ? participantStatus : undefined,
      });
      setParticipants(res.data);
    } catch (e) {
      toast({ title: "Participants", description: e instanceof Error ? e.message : "Unable to load participants" });
    } finally {
      setParticipantsLoading(false);
    }
  };

  const mark = async (student_no: string, status: "Attended" | "Absent") => {
    if (!participantsFor) return;
    setMarking(`${student_no}:${status}`);
    try {
      await api.markEventAttendance(participantsFor.id, { student_no, status });
      await refreshParticipants();
      toast({ title: "Attendance", description: `${status} recorded.` });
    } catch (e) {
      toast({ title: "Attendance", description: e instanceof Error ? e.message : "Unable to mark attendance" });
    } finally {
      setMarking(null);
    }
  };

  const create = async () => {
    if (!newEvent.title.trim()) {
      toast({ title: "Create Event", description: "Title is required." });
      return;
    }
    if (!newEvent.start_date.trim()) {
      toast({ title: "Create Event", description: "Start date is required." });
      return;
    }

    setCreating(true);
    try {
      await api.adminCreateEvent({
        title: newEvent.title.trim(),
        kind: newEvent.kind,
        category: newEvent.category.trim() ? newEvent.category.trim() : null,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date.trim() ? newEvent.end_date.trim() : null,
        location: newEvent.location.trim() ? newEvent.location.trim() : null,
        description: newEvent.description.trim() ? newEvent.description.trim() : null,
      });
      toast({ title: "Create Event", description: "Event created." });
      setCreateOpen(false);
      setNewEvent({
        title: "",
        kind: "Extra-curricular",
        category: "",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: "",
        location: "",
        description: "",
      });
      await load();
    } catch (e) {
      toast({ title: "Create Event", description: e instanceof Error ? e.message : "Unable to create event" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage CCS events and track participation/attendance</p>
          </div>

          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground shadow-card">
                  <Calendar size={16} className="mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-foreground">Create Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-foreground">Title</Label>
                    <Input value={newEvent.title} onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Kind</Label>
                      <Select value={newEvent.kind} onValueChange={(v) => setNewEvent((p) => ({ ...p, kind: v as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Curricular">Curricular</SelectItem>
                          <SelectItem value="Extra-curricular">Extra-curricular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Category</Label>
                      <Input value={newEvent.category} onChange={(e) => setNewEvent((p) => ({ ...p, category: e.target.value }))} placeholder="Hackathon / Seminar / Sports" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Start Date</Label>
                      <Input type="date" value={newEvent.start_date} onChange={(e) => setNewEvent((p) => ({ ...p, start_date: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">End Date</Label>
                      <Input type="date" value={newEvent.end_date} onChange={(e) => setNewEvent((p) => ({ ...p, end_date: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Location</Label>
                    <Input value={newEvent.location} onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Description</Label>
                    <Input value={newEvent.description} onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))} />
                  </div>

                  <Button className="gradient-primary text-primary-foreground" onClick={create} disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="mb-4 border-border shadow-card">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search events (title/category)..."
                  className="pl-10 bg-muted/50"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") load();
                  }}
                />
              </div>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger className="w-full lg:w-60">
                  <SelectValue placeholder="Kind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Curricular">Curricular</SelectItem>
                  <SelectItem value="Extra-curricular">Extra-curricular</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-border text-foreground" onClick={load}>
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
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="text-muted-foreground">Kind</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground hidden lg:table-cell">Location</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ev) => (
                    <TableRow key={ev.id} className="border-border hover:bg-accent/50 transition-colors">
                      <TableCell className="font-medium text-foreground">{ev.title}</TableCell>
                      <TableCell>
                        <Badge className={ev.kind === "Curricular" ? "gradient-primary text-primary-foreground" : "gradient-green text-secondary-foreground"}>
                          {ev.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{ev.category ?? "—"}</TableCell>
                      <TableCell className="text-sm text-foreground whitespace-nowrap">
                        {ev.start_date}{ev.end_date ? ` → ${ev.end_date}` : ""}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{ev.location ?? "—"}</TableCell>
                      <TableCell>
                        <Button variant="outline" className="border-border text-foreground" size="sm" onClick={() => openParticipants(ev)}>
                          <UserCheck size={14} className="mr-2" />
                          Participants
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {loading && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading events...</TableCell></TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No events found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">Participants</DialogTitle>
            </DialogHeader>

            <div className="text-sm text-muted-foreground">
              Event: <span className="text-foreground font-medium">{participantsFor?.title ?? "—"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search student no/name..."
                  className="pl-10 bg-muted/50"
                  value={participantQ}
                  onChange={(e) => setParticipantQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") refreshParticipants();
                  }}
                />
              </div>
              <Select value={participantStatus} onValueChange={(v) => setParticipantStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Attended">Attended</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto mt-3">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Student</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Program</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.participation_id} className="border-border">
                      <TableCell className="text-foreground">
                        <div className="font-medium">{p.last_name}, {p.first_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.student_no}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.program ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border text-foreground">{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border text-foreground"
                            disabled={participantsLoading || marking === `${p.student_no}:Attended`}
                            onClick={() => mark(p.student_no, "Attended")}
                          >
                            <CheckCircle2 size={14} className="mr-2" />
                            Attended
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border text-foreground"
                            disabled={participantsLoading || marking === `${p.student_no}:Absent`}
                            onClick={() => mark(p.student_no, "Absent")}
                          >
                            <XCircle size={14} className="mr-2" />
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {participantsLoading && (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading participants...</TableCell></TableRow>
                  )}
                  {!participantsLoading && participants.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No participants yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" className="border-border text-foreground" onClick={refreshParticipants} disabled={participantsLoading}>
                Refresh
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EventsPage;
