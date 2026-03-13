import { useState } from "react";
import { Search, Plus, Trophy, Medal, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

const achievementsData = [
  { id: 1, student: "Maria Santos", studentId: "2024-0002", title: "Best Research Paper", event: "CCS Research Colloquium 2026", type: "School" as const, date: "2026-02-20" },
  { id: 2, student: "Sofia Lim", studentId: "2024-0006", title: "Champion - Hackathon", event: "TechFest Philippines 2026", type: "Outside" as const, date: "2026-01-15" },
  { id: 3, student: "Juan Dela Cruz", studentId: "2024-0001", title: "Dean's Lister", event: "Academic Excellence Awards", type: "School" as const, date: "2026-02-01" },
  { id: 4, student: "Carlos Mendoza", studentId: "2024-0005", title: "2nd Place - Programming Contest", event: "PSITE Regional Competition", type: "Outside" as const, date: "2026-01-28" },
  { id: 5, student: "Ana Garcia", studentId: "2024-0004", title: "Best UI/UX Design", event: "CCS Web Design Competition", type: "School" as const, date: "2026-02-10" },
  { id: 6, student: "Pedro Reyes", studentId: "2024-0003", title: "Top Performer - OJT", event: "Industry Partner Recognition", type: "Outside" as const, date: "2025-12-15" },
];

const AchievementsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "School" | "Outside">("All");

  const addAchievement = () => {
    toast({ title: "Add Achievement", description: "Achievement creation form will be added next." });
  };

  const filtered = achievementsData.filter((a) => {
    const matchesSearch = a.student.toLowerCase().includes(search.toLowerCase()) ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.event.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || a.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Achievements</h1>
            <p className="text-muted-foreground mt-1 text-sm">Student awards and recognitions</p>
          </div>
          <Button className="gradient-green text-secondary-foreground shadow-card" onClick={addAchievement}>
            <Plus size={16} className="mr-2" />
            Add Achievement
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search achievements..." className="pl-10 bg-muted/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(["All", "School", "Outside"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "gradient-primary text-primary-foreground" : "text-foreground"}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Achievement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => (
            <Card
              key={a.id}
              onClick={() => toast({ title: a.title, description: `${a.student} • ${a.event}` })}
              className="border-border hover:shadow-elevated transition-all hover:-translate-y-1 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.type === "School" ? "gradient-primary" : "gradient-green"}`}>
                    {a.type === "School" ? <Medal size={20} className="text-primary-foreground" /> : <Trophy size={20} className="text-secondary-foreground" />}
                  </div>
                  <Badge variant="outline" className={a.type === "School" ? "border-primary text-primary" : "border-secondary text-secondary"}>
                    {a.type}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{a.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{a.event}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs font-medium text-foreground">{a.student}</p>
                    <p className="text-[10px] text-muted-foreground">{a.studentId}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{a.date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Star size={40} className="mx-auto mb-3 opacity-30" />
              <p>No achievements found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AchievementsPage;
