import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api, BasketballTryoutRow, ProgrammingContestRow } from "@/lib/api";

const ReportsPage = () => {
  const { toast } = useToast();

  const [active, setActive] = useState<"basketball" | "programming">("basketball");

  const [bbLoading, setBbLoading] = useState(false);
  const [bbRows, setBbRows] = useState<BasketballTryoutRow[]>([]);
  const [bbMinHeight, setBbMinHeight] = useState("170");
  const [bbSport, setBbSport] = useState("basketball");

  const [pcLoading, setPcLoading] = useState(false);
  const [pcRows, setPcRows] = useState<ProgrammingContestRow[]>([]);
  const [pcMaxGpa, setPcMaxGpa] = useState("2.0");
  const [pcProgram, setPcProgram] = useState("");
  const [pcSkill, setPcSkill] = useState("");

  const loadBasketball = useCallback(async () => {
    setBbLoading(true);
    try {
      const res = await api.reportBasketballTryouts({
        min_height_cm: bbMinHeight.trim() ? Number(bbMinHeight) : undefined,
        require_clearance: true,
        sport: bbSport.trim() ? bbSport.trim() : undefined,
      });
      setBbRows(res.data);
    } catch (e) {
      toast({ title: "Reports", description: e instanceof Error ? e.message : "Unable to load report" });
    } finally {
      setBbLoading(false);
    }
  }, [bbMinHeight, bbSport, toast]);

  const loadProgramming = useCallback(async () => {
    setPcLoading(true);
    try {
      const res = await api.reportProgrammingContest({
        max_gpa: pcMaxGpa.trim() ? Number(pcMaxGpa) : undefined,
        program: pcProgram.trim() ? pcProgram.trim() : undefined,
        skill: pcSkill.trim() ? pcSkill.trim() : undefined,
      });
      setPcRows(res.data);
    } catch (e) {
      toast({ title: "Reports", description: e instanceof Error ? e.message : "Unable to load report" });
    } finally {
      setPcLoading(false);
    }
  }, [pcMaxGpa, pcProgram, pcSkill, toast]);

  useEffect(() => {
    if (active === "basketball") loadBasketball();
    if (active === "programming") loadProgramming();
  }, [active, loadBasketball, loadProgramming]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1 text-sm">Qualification queries and analytics</p>
          </div>
        </div>

        <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
          <TabsList>
            <TabsTrigger value="basketball">Basketball Try-outs</TabsTrigger>
            <TabsTrigger value="programming">Programming Contest</TabsTrigger>
          </TabsList>

          <TabsContent value="basketball">
            <Card className="border-border shadow-card mb-4">
              <CardHeader>
                <CardTitle className="text-base font-sans font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 size={16} className="text-secondary" />
                  Qualified Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-foreground">Min Height (cm)</Label>
                    <Input value={bbMinHeight} onChange={(e) => setBbMinHeight(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Sport keyword</Label>
                    <Input value={bbSport} onChange={(e) => setBbSport(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="border-border text-foreground w-full" onClick={loadBasketball} disabled={bbLoading}>
                      <RefreshCw size={16} className="mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Student</TableHead>
                        <TableHead className="text-muted-foreground">Program</TableHead>
                        <TableHead className="text-muted-foreground">Height</TableHead>
                        <TableHead className="text-muted-foreground">Clearance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bbRows.map((r) => (
                        <TableRow key={r.student_no} className="border-border">
                          <TableCell className="text-foreground">
                            <div className="font-medium">{r.last_name}, {r.first_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{r.student_no}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{r.program ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.height_cm ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.medical_clearance_status ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                      {bbLoading && (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                      )}
                      {!bbLoading && bbRows.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No results</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programming">
            <Card className="border-border shadow-card mb-4">
              <CardHeader>
                <CardTitle className="text-base font-sans font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 size={16} className="text-secondary" />
                  Qualified Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label className="text-foreground">Max GPA (lower is better)</Label>
                    <Input value={pcMaxGpa} onChange={(e) => setPcMaxGpa(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Program (optional)</Label>
                    <Input value={pcProgram} onChange={(e) => setPcProgram(e.target.value)} placeholder="BSCS" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Skill (optional)</Label>
                    <Input value={pcSkill} onChange={(e) => setPcSkill(e.target.value)} placeholder="python" />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="border-border text-foreground w-full" onClick={loadProgramming} disabled={pcLoading}>
                      <RefreshCw size={16} className="mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Student</TableHead>
                        <TableHead className="text-muted-foreground">Program</TableHead>
                        <TableHead className="text-muted-foreground">GPA</TableHead>
                        <TableHead className="text-muted-foreground">Events</TableHead>
                        <TableHead className="text-muted-foreground">Achievements</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pcRows.map((r) => (
                        <TableRow key={r.student_no} className="border-border">
                          <TableCell className="text-foreground">
                            <div className="font-medium">{r.last_name}, {r.first_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{r.student_no}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{r.program ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.gpa ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.events_joined}</TableCell>
                          <TableCell className="text-muted-foreground">{r.achievements_count}</TableCell>
                        </TableRow>
                      ))}
                      {pcLoading && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                      )}
                      {!pcLoading && pcRows.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No results</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
