import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api, FacultyLoadRow } from "@/lib/api";

const dayLabel: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

const FacultyLoadPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FacultyLoadRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.myFacultyLoad();
      setRows(res.data);
    } catch (e) {
      toast({ title: "My Load", description: e instanceof Error ? e.message : "Unable to load" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const m = new Map<string, FacultyLoadRow[]>();
    for (const r of rows) {
      const k = r.term_name;
      const arr = m.get(k) ?? [];
      arr.push(r);
      m.set(k, arr);
    }
    return Array.from(m.entries());
  }, [rows]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Teaching Load</h1>
            <p className="text-muted-foreground mt-1 text-sm">Your assigned offerings per term</p>
          </div>
          <Button variant="outline" className="border-border text-foreground" onClick={load} disabled={loading}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {grouped.map(([term, list]) => (
          <Card key={term} className="border-border shadow-card mb-4">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <CalendarClock size={16} className="text-secondary" />
                <span className="text-sm font-semibold text-foreground">{term}</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Course</TableHead>
                      <TableHead className="text-muted-foreground">Section</TableHead>
                      <TableHead className="text-muted-foreground">Day/Time</TableHead>
                      <TableHead className="text-muted-foreground">Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r) => (
                      <TableRow key={r.id} className="border-border">
                        <TableCell className="text-foreground">{r.course_code} — {r.course_title}</TableCell>
                        <TableCell className="text-foreground">{r.section_name}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap">
                          {r.day_of_week ? `${dayLabel[r.day_of_week]} ${r.start_time ?? ""}-${r.end_time ?? ""}` : "—"}
                        </TableCell>
                        <TableCell className="text-foreground">{r.room_name ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No load</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && rows.length === 0 && (
          <Card className="border-border shadow-card">
            <CardContent className="py-10 text-center text-muted-foreground">No teaching load assigned yet.</CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyLoadPage;
