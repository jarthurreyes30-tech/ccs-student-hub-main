import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Plus, RefreshCw, Upload } from "lucide-react";
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
import { api, MaterialRow } from "@/lib/api";

const MaterialsPage = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MaterialRow[]>([]);
  const [kind, setKind] = useState<"all" | MaterialRow["kind"]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listMaterials({ kind: kind === "all" ? undefined : kind });
      setRows(res.data);
    } catch (e) {
      toast({ title: "Materials", description: e instanceof Error ? e.message : "Unable to load" });
    } finally {
      setLoading(false);
    }
  }, [kind, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [upKind, setUpKind] = useState<MaterialRow["kind"]>("Syllabus");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: "Upload", description: "Title is required" });
      return;
    }
    setUploading(true);
    try {
      await api.uploadMaterial({ title: title.trim(), kind: upKind, description: description.trim() ? description.trim() : undefined, file: file ?? undefined });
      toast({ title: "Upload", description: "Saved." });
      setOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
      await load();
    } catch (e) {
      toast({ title: "Upload", description: e instanceof Error ? e.message : "Unable to upload" });
    } finally {
      setUploading(false);
    }
  };

  const badgeClass = (k: MaterialRow["kind"]) => {
    if (k === "Syllabus") return "gradient-primary text-primary-foreground";
    if (k === "Lesson") return "gradient-green text-secondary-foreground";
    return "bg-accent text-accent-foreground";
  };

  const visible = useMemo(() => rows, [rows]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Instruction Materials</h1>
            <p className="text-muted-foreground mt-1 text-sm">Syllabi, lessons, and resources</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Syllabus">Syllabus</SelectItem>
                <SelectItem value="Lesson">Lesson</SelectItem>
                <SelectItem value="Resource">Resource</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-border text-foreground" onClick={load} disabled={loading}>
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus size={16} className="mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-foreground">Upload Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-foreground">Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Kind</Label>
                    <Select value={upKind} onValueChange={(v) => setUpKind(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Syllabus">Syllabus</SelectItem>
                        <SelectItem value="Lesson">Lesson</SelectItem>
                        <SelectItem value="Resource">Resource</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Description</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">File (optional)</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <Button className="gradient-primary text-primary-foreground" onClick={submit} disabled={uploading}>
                    <Upload size={16} className="mr-2" />
                    {uploading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-sans font-semibold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-secondary" />
              Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="text-muted-foreground">Kind</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Course</TableHead>
                    <TableHead className="text-muted-foreground hidden lg:table-cell">Uploaded By</TableHead>
                    <TableHead className="text-muted-foreground">File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((m) => (
                    <TableRow key={m.id} className="border-border">
                      <TableCell className="text-foreground font-medium">{m.title}</TableCell>
                      <TableCell>
                        <Badge className={badgeClass(m.kind)}>{m.kind}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {m.course_code ? `${m.course_code} — ${m.course_title}` : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{m.uploaded_by_username ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.original_name ? m.original_name : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  )}
                  {!loading && visible.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No materials</TableCell></TableRow>
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

export default MaterialsPage;
