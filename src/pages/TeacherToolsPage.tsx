import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const TeacherToolsPage = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"violation" | "achievement">("violation");
  const [studentNo, setStudentNo] = useState("");
  const [titleOrType, setTitleOrType] = useState("");
  const [eventOrDesc, setEventOrDesc] = useState("");
  const [entryType, setEntryType] = useState<"School" | "Outside">("School");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!studentNo.trim()) {
      toast({ title: "Teacher Tools", description: "Student number is required." });
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "violation") {
        if (!titleOrType.trim()) throw new Error("Violation type is required");
        await api.createViolation({
          student_no: studentNo.trim(),
          type: titleOrType.trim(),
          description: eventOrDesc.trim() ? eventOrDesc.trim() : null,
          date,
          status: "Pending",
        });
        toast({ title: "Recorded", description: "Violation recorded." });
      } else {
        if (!titleOrType.trim()) throw new Error("Achievement title is required");
        await api.createAchievement({
          student_no: studentNo.trim(),
          title: titleOrType.trim(),
          event: eventOrDesc.trim() ? eventOrDesc.trim() : null,
          type: entryType,
          date,
        });
        toast({ title: "Recorded", description: "Achievement recorded." });
      }

      setStudentNo("");
      setTitleOrType("");
      setEventOrDesc("");
    } catch (e) {
      toast({ title: "Teacher Tools", description: e instanceof Error ? e.message : "Unable to submit" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Teacher Tools</h1>
          <p className="text-muted-foreground mt-1 text-sm">Record violations and achievements for students</p>
        </div>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg text-foreground">Record Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="violation">Violation</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Student No.</Label>
              <Input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="e.g., 2024-0001" />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{mode === "violation" ? "Violation Type" : "Achievement Title"}</Label>
              <Input value={titleOrType} onChange={(e) => setTitleOrType(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{mode === "violation" ? "Description" : "Event"}</Label>
              <Input value={eventOrDesc} onChange={(e) => setEventOrDesc(e.target.value)} />
            </div>

            {mode === "achievement" && (
              <div className="space-y-2">
                <Label className="text-foreground">Type</Label>
                <Select value={entryType} onValueChange={(v) => setEntryType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School">School</SelectItem>
                    <SelectItem value="Outside">Outside</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <Button className="gradient-primary text-primary-foreground" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherToolsPage;
