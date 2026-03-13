import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type MyOrg = {
  id: number;
  name: string;
  abbr: string | null;
  member_role: string | null;
  joined_at: string;
};

const MyOrganizationsPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<MyOrg[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.myOrganizations();
        setRows(res.data as MyOrg[]);
      } catch (e) {
        toast({ title: "My Organizations", description: e instanceof Error ? e.message : "Unable to load" });
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Organizations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your memberships and roles</p>
        </div>

        <Card className="border-border shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Organization</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          {r.abbr && (
                            <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{r.abbr}</Badge>
                          )}
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{r.member_role ?? "Member"}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.joined_at}</TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
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

export default MyOrganizationsPage;
