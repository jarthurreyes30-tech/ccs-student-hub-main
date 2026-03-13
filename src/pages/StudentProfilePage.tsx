import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type StudentProfile = {
  student_no: string;
  first_name: string;
  last_name: string;
  email: string | null;
  program: string | null;
  year_level: number | null;
  section: string | null;
  enrollment_status: string | null;
  academic_status: string | null;
  skills: string[];
};

const StudentProfilePage = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.myStudentProfile();
        setProfile(res.data as StudentProfile);
      } catch (e) {
        toast({ title: "My Profile", description: e instanceof Error ? e.message : "Unable to load profile" });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Student profile and basic records</p>
        </div>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg text-foreground">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
            {!loading && !profile && <div className="text-sm text-muted-foreground">No profile found.</div>}
            {!loading && profile && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Student No.</p>
                    <p className="text-sm font-mono text-foreground">{profile.student_no}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Name</p>
                    <p className="text-sm text-foreground">{profile.last_name}, {profile.first_name}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Program</p>
                    <p className="text-sm text-foreground">{profile.program ?? "—"}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Year & Section</p>
                    <p className="text-sm text-foreground">{profile.year_level ?? "—"} - {profile.section ?? "—"}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{profile.email ?? "—"}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <p className="text-sm text-foreground">{profile.academic_status ?? "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.skills ?? []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      (profile.skills ?? []).map((sk) => (
                        <Badge key={sk} variant="outline" className="border-primary/30 text-primary text-xs">{sk}</Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfilePage;
