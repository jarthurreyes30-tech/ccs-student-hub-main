import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Check, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, EventRow, MyEventRow } from "@/lib/api";

const MyEventsPage = () => {
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | EventRow["kind"]>("all");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [my, setMy] = useState<MyEventRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allEvents, myEvents] = await Promise.all([
        api.listEvents({ q: q.trim() ? q.trim() : undefined, kind: kind !== "all" ? kind : undefined }),
        api.myEvents(),
      ]);
      setEvents(allEvents.data);
      setMy(myEvents.data);
    } catch (e) {
      toast({ title: "My Events", description: e instanceof Error ? e.message : "Unable to load events" });
    } finally {
      setLoading(false);
    }
  }, [kind, q, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const myByEventId = useMemo(() => {
    const m = new Map<number, MyEventRow>();
    for (const r of my) m.set(r.event_id, r);
    return m;
  }, [my]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return events.filter((e) => {
      if (kind !== "all" && e.kind !== kind) return false;
      if (!query) return true;
      return (e.title ?? "").toLowerCase().includes(query) || (e.category ?? "").toLowerCase().includes(query);
    });
  }, [events, kind, q]);

  const register = async (eventId: number) => {
    setRegistering(eventId);
    try {
      await api.registerEvent(eventId);
      toast({ title: "Events", description: "Registered." });
      await load();
    } catch (e) {
      toast({ title: "Events", description: e instanceof Error ? e.message : "Unable to register" });
    } finally {
      setRegistering(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Events</h1>
          <p className="text-muted-foreground mt-1 text-sm">Browse events and track your registrations/attendance</p>
        </div>

        <Card className="mb-4 border-border shadow-card">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
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
                    <TableHead className="text-muted-foreground">Event</TableHead>
                    <TableHead className="text-muted-foreground">Kind</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">My Status</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ev) => {
                    const mine = myByEventId.get(ev.id);
                    const registered = !!mine;
                    return (
                      <TableRow key={ev.id} className="border-border hover:bg-accent/50 transition-colors">
                        <TableCell className="text-foreground">
                          <div className="font-medium">{ev.title}</div>
                          <div className="text-xs text-muted-foreground">{ev.location ?? "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={ev.kind === "Curricular" ? "gradient-primary text-primary-foreground" : "gradient-green text-secondary-foreground"}>
                            {ev.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{ev.category ?? "—"}</TableCell>
                        <TableCell className="text-sm text-foreground whitespace-nowrap">
                          {ev.start_date}{ev.end_date ? ` → ${ev.end_date}` : ""}
                        </TableCell>
                        <TableCell>
                          {mine ? (
                            <Badge variant="outline" className="border-border text-foreground">{mine.status}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not registered</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {registered ? (
                            <Button variant="outline" className="border-border text-foreground" size="sm" disabled>
                              <Check size={14} className="mr-2" />
                              Registered
                            </Button>
                          ) : (
                            <Button
                              className="gradient-primary text-primary-foreground"
                              size="sm"
                              onClick={() => register(ev.id)}
                              disabled={loading || registering === ev.id}
                            >
                              <Calendar size={14} className="mr-2" />
                              {registering === ev.id ? "Registering..." : "Register"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

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
      </div>
    </DashboardLayout>
  );
};

export default MyEventsPage;
