import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type FacultyProfile = {
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

const FacultyProfilePage = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.myFacultyProfile();
        setProfile(res.data as FacultyProfile);
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Faculty Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Faculty information and qualifications</p>
        </div>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg text-foreground">Faculty Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
            {!loading && !profile && <div className="text-sm text-muted-foreground">No profile found.</div>}
            {!loading && profile && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Faculty No.</p>
                    <p className="text-sm font-mono text-foreground">{profile.faculty_no}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Name</p>
                    <p className="text-sm text-foreground">{profile.name}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Rank</p>
                    <p className="text-sm text-foreground">{profile.rank ?? "—"}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Field</p>
                    <p className="text-sm text-foreground">{profile.field ?? "—"}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Education</p>
                    <p className="text-sm text-foreground">{profile.degree ?? "—"} — {profile.institution ?? "—"}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-[10px] text-muted-foreground">Year Graduated</p>
                    <p className="text-sm text-foreground">{profile.year_graduated ?? "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.skills ?? []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      (profile.skills ?? []).map((sk) => (
                        <Badge key={sk} variant="outline" className="border-secondary/30 text-secondary text-xs">{sk}</Badge>
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

export default FacultyProfilePage;
