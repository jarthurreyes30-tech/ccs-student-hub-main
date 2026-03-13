import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type MyViolation = {
  id: number;
  type: string;
  description: string | null;
  date: string;
  status: "Pending" | "Sanctioned" | "Resolved";
  recorded_by: string;
};

const MyViolationsPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<MyViolation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.myViolations();
        setRows(res.data as MyViolation[]);
      } catch (e) {
        toast({ title: "My Violations", description: e instanceof Error ? e.message : "Unable to load" });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Violations</h1>
          <p className="text-muted-foreground mt-1 text-sm">View your recorded violations and status</p>
        </div>

        <Card className="border-border shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Recorded By</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="text-sm text-foreground">{r.date}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{r.type}</p>
                        {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.recorded_by}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          r.status === "Resolved" ? "border-secondary text-secondary" :
                          r.status === "Pending" ? "border-primary text-primary" :
                          "border-destructive text-destructive"
                        }>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
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

export default MyViolationsPage;
