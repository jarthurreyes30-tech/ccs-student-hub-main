import { useCallback, useEffect, useState } from "react";
import { FileUp, RefreshCw, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api, StudentDocumentRow } from "@/lib/api";

const MyDocumentsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<StudentDocumentRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.myDocuments();
      setRows(res.data);
    } catch (e) {
      toast({ title: "My Documents", description: e instanceof Error ? e.message : "Unable to load" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("Medical Clearance");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!kind.trim() || !file) {
      toast({ title: "Upload", description: "Kind and file are required" });
      return;
    }

    setUploading(true);
    try {
      await api.uploadMyDocument({ kind: kind.trim(), file });
      toast({ title: "Upload", description: "Uploaded." });
      setOpen(false);
      setFile(null);
      await load();
    } catch (e) {
      toast({ title: "Upload", description: e instanceof Error ? e.message : "Unable to upload" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Documents</h1>
            <p className="text-muted-foreground mt-1 text-sm">Upload and manage your documents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border text-foreground" onClick={load} disabled={loading}>
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <FileUp size={16} className="mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display text-foreground">Upload Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-foreground">Kind</Label>
                    <Input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Medical Clearance / ID / Certificate" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">File</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <Button className="gradient-primary text-primary-foreground" onClick={upload} disabled={uploading}>
                    <Upload size={16} className="mr-2" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-sans font-semibold text-foreground">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Kind</TableHead>
                    <TableHead className="text-muted-foreground">Filename</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Size</TableHead>
                    <TableHead className="text-muted-foreground">Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="text-foreground font-medium">{r.kind}</TableCell>
                      <TableCell className="text-muted-foreground">{r.original_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{r.mime_type ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{typeof r.size_bytes === "number" ? `${Math.round(r.size_bytes / 1024)} KB` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.created_at}</TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No documents</TableCell></TableRow>
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

export default MyDocumentsPage;
