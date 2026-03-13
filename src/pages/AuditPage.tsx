import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Activity, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { api, ActivityLogRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AuditPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.adminListActivityLogs({ q: search.trim() ? search.trim() : undefined, limit: 200 });
        setRows(res.data);
      } catch (e) {
        toast({ title: "Audit Logs", description: e instanceof Error ? e.message : "Unable to load logs" });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [search, toast]);

  const uniqueUsers = useMemo(
    () => Array.from(new Set(rows.map((a) => a.actor_username ?? "System"))),
    [rows],
  );

  const matchSearch = (a: ActivityLogRow) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const user = (a.actor_username ?? "System").toLowerCase();
    const action = (a.action ?? "").toLowerCase();
    const ip = (a.ip ?? "").toLowerCase();
    return user.includes(q) || action.includes(q) || ip.includes(q);
  };

  const filtered = rows.filter((a) => {
    const user = a.actor_username ?? "System";
    const matchUser = userFilter === "all" || user === userFilter;
    return matchUser;
  });

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">System activity and user action tracking</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="border-border shadow-card">
            <CardContent className="p-4 text-center">
              <Activity size={20} className="mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{rows.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Logs</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-card">
            <CardContent className="p-4 text-center">
              <User size={20} className="mx-auto text-secondary mb-1" />
              <p className="text-xl font-bold text-foreground">{uniqueUsers.length}</p>
              <p className="text-[10px] text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-card">
            <CardContent className="p-4 text-center">
              <Clock size={20} className="mx-auto text-accent-foreground mb-1" />
              <p className="text-xl font-bold text-foreground">Today</p>
              <p className="text-[10px] text-muted-foreground">3 actions</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-card">
            <CardContent className="p-4 text-center">
              <Filter size={20} className="mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold text-foreground">{filtered.length}</p>
              <p className="text-[10px] text-muted-foreground">Showing</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4 border-border shadow-card">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-10 bg-muted/50" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground w-12">#</TableHead>
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">IP Address</TableHead>
                    <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.filter(matchSearch).map((log) => (
                    <TableRow key={log.id} className="border-border hover:bg-accent/50 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border text-foreground font-normal">
                          {log.actor_username ?? "System"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground max-w-xs truncate">{log.action}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{log.ip ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.created_at}</TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading logs...</TableCell></TableRow>
                  )}
                  {!loading && filtered.filter(matchSearch).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No logs found</TableCell></TableRow>
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

export default AuditPage;
