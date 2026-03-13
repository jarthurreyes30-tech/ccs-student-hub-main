import { useEffect, useState } from "react";
import { Search, Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";

type FacultyRow = {
  id: number;
  faculty_no: string;
  name: string;
  rank: string | null;
  status: string | null;
  field: string | null;
  degree: string | null;
  institution: string | null;
  year_graduated: number | null;
  skills: string[];
};

const FacultyPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<FacultyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FacultyRow | null>(null);

  const addFaculty = () => {
    toast({ title: "Add Faculty", description: "Faculty creation form will be added next." });
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.listFaculty({ q: search.trim() ? search.trim() : undefined });
        setRows(res.data as FacultyRow[]);
      } catch (e) {
        toast({ title: "Faculty", description: e instanceof Error ? e.message : "Unable to load faculty" });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [search, toast]);

  const filtered = rows;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Faculty</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage faculty profiles and qualifications</p>
          </div>
          <Button className="gradient-green text-secondary-foreground shadow-card" onClick={addFaculty}>
            <Plus size={16} className="mr-2" />
            Add Faculty
          </Button>
        </div>

        <Card className="mb-4 border-border shadow-card">
          <CardContent className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or field..." className="pl-10 bg-muted/50" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Rank</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Field</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.id} className="border-border hover:bg-accent/50 transition-colors">
                      <TableCell className="font-mono text-sm text-foreground">{f.faculty_no}</TableCell>
                      <TableCell className="font-medium text-foreground">{f.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-foreground text-sm">{f.rank ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{f.field ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={f.status === "Active" ? "border-secondary text-secondary" : "border-primary text-primary"}>
                          {f.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelected(f)} className="text-muted-foreground hover:text-foreground">
                              <Eye size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="font-display text-foreground">Faculty Profile</DialogTitle>
                            </DialogHeader>
                            {selected && (
                              <div className="space-y-4 mt-2">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full gradient-green flex items-center justify-center text-secondary-foreground font-bold text-lg">
                                    {selected.name.split(" ").slice(-1)[0][0]}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{selected.name}</p>
                                    <p className="text-sm text-muted-foreground">{selected.rank ?? ""}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Faculty ID</p><p className="text-sm font-mono text-foreground">{selected.faculty_no}</p></div>
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Status</p><p className="text-sm text-foreground">{selected.status ?? "—"}</p></div>
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Field</p><p className="text-sm text-foreground">{selected.field ?? "—"}</p></div>
                                  <div className="p-3 bg-muted rounded-lg"><p className="text-[10px] text-muted-foreground">Year Graduated</p><p className="text-sm text-foreground">{selected.year_graduated ?? "—"}</p></div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Education</p>
                                  <p className="text-sm text-foreground">{selected.degree ?? "—"} — {selected.institution ?? "—"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(selected.skills ?? []).map((sk) => (
                                      <Badge key={sk} variant="outline" className="border-secondary/30 text-secondary text-xs">{sk}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading faculty...</TableCell>
                    </TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No faculty found</TableCell>
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

export default FacultyPage;
