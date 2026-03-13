import { useState } from "react";
import { Search, Plus, Eye, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

const violationsData = [
  { id: "V-001", student: "Pedro Reyes", studentId: "2024-0003", type: "Academic Dishonesty", description: "Caught cheating during midterm exam", date: "2026-02-15", status: "Pending" as const },
  { id: "V-002", student: "Carlos Mendoza", studentId: "2024-0005", type: "Attendance", description: "Exceeded allowed absences in 3 subjects", date: "2026-02-10", status: "Sanctioned" as const },
  { id: "V-003", student: "Juan Dela Cruz", studentId: "2024-0001", type: "Dress Code", description: "Repeated dress code violations", date: "2026-01-28", status: "Resolved" as const },
  { id: "V-004", student: "Ana Garcia", studentId: "2024-0004", type: "Late Submission", description: "Consistently late project submissions", date: "2026-02-20", status: "Pending" as const },
  { id: "V-005", student: "Mark Villanueva", studentId: "2024-0007", type: "Laboratory", description: "Damaged lab equipment due to negligence", date: "2026-01-15", status: "Sanctioned" as const },
];

const statusConfig = {
  Pending: { icon: Clock, className: "border-primary text-primary" },
  Sanctioned: { icon: AlertTriangle, className: "border-destructive text-destructive" },
  Resolved: { icon: CheckCircle, className: "border-secondary text-secondary" },
};

const ViolationsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [violations, setViolations] = useState(violationsData);
  const [selectedViolation, setSelectedViolation] = useState<typeof violationsData[0] | null>(null);

  const filtered = violations.filter(
    (v) =>
      v.student.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase()) ||
      v.status.toLowerCase().includes(search.toLowerCase())
  );

  const recordViolation = () => {
    toast({ title: "Record Violation", description: "Violation entry form will be added next." });
  };

  const updateStatus = (id: string, status: "Pending" | "Sanctioned" | "Resolved") => {
    setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
    setSelectedViolation((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    toast({ title: "Violation updated", description: `${id} marked as ${status}.` });
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Violations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track and manage student violations</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-card" onClick={recordViolation}>
            <Plus size={16} className="mr-2" />
            Record Violation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending", count: violations.filter(v => v.status === "Pending").length, color: "text-primary" },
            { label: "Sanctioned", count: violations.filter(v => v.status === "Sanctioned").length, color: "text-destructive" },
            { label: "Resolved", count: violations.filter(v => v.status === "Resolved").length, color: "text-secondary" },
          ].map((s) => (
            <Card key={s.label} className="border-border shadow-card">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-4 border-border shadow-card">
          <CardContent className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student, type, or status..."
                className="pl-10 bg-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Student</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => {
                    const StatusIcon = statusConfig[v.status].icon;
                    return (
                      <TableRow key={v.id} className="border-border hover:bg-accent/50 transition-colors">
                        <TableCell className="font-mono text-sm text-foreground">{v.id}</TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground text-sm">{v.student}</p>
                          <p className="text-xs text-muted-foreground">{v.studentId}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-foreground text-sm">{v.type}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{v.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig[v.status].className}>
                            <StatusIcon size={12} className="mr-1" />
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedViolation(v)} className="text-muted-foreground hover:text-foreground">
                                <Eye size={14} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="font-display text-foreground">Violation Details</DialogTitle>
                              </DialogHeader>
                              {selectedViolation && (
                                <div className="space-y-4 mt-2">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-muted-foreground">Violation ID</p><p className="text-sm font-mono text-foreground">{selectedViolation.id}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm text-foreground">{selectedViolation.date}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Student</p><p className="text-sm font-medium text-foreground">{selectedViolation.student}</p></div>
                                    <div><p className="text-xs text-muted-foreground">Student ID</p><p className="text-sm font-mono text-foreground">{selectedViolation.studentId}</p></div>
                                  </div>
                                  <div><p className="text-xs text-muted-foreground">Type</p><p className="text-sm text-foreground">{selectedViolation.type}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm text-foreground">{selectedViolation.description}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Status</p>
                                    <Badge variant="outline" className={statusConfig[selectedViolation.status].className + " mt-1"}>
                                      {selectedViolation.status}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    {selectedViolation.status === "Pending" && (
                                      <>
                                        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => updateStatus(selectedViolation.id, "Sanctioned")}>
                                          Mark as Sanctioned
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => updateStatus(selectedViolation.id, "Resolved")}>
                                          Resolve
                                        </Button>
                                      </>
                                    )}
                                    {selectedViolation.status === "Sanctioned" && (
                                      <Button size="sm" variant="outline" onClick={() => updateStatus(selectedViolation.id, "Resolved")}>
                                        Resolve
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No violations found</TableCell>
                    </TableRow>
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

export default ViolationsPage;
