import { useState } from "react";
import { Search, Plus, Users, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

const orgsData = [
  {
    id: 1, name: "CCS Student Council", abbr: "CSG", members: 25,
    officers: [
      { name: "Juan Dela Cruz", position: "President" },
      { name: "Maria Santos", position: "Vice President" },
      { name: "Carlos Mendoza", position: "Secretary" },
    ]
  },
  {
    id: 2, name: "IT Society", abbr: "ITS", members: 78,
    officers: [
      { name: "Pedro Reyes", position: "President" },
      { name: "Ana Garcia", position: "Treasurer" },
    ]
  },
  {
    id: 3, name: "Computer Science Guild", abbr: "CSG", members: 65,
    officers: [
      { name: "Sofia Lim", position: "President" },
      { name: "Mark Villanueva", position: "Vice President" },
    ]
  },
  {
    id: 4, name: "CCS Research Circle", abbr: "CRC", members: 32,
    officers: [
      { name: "Maria Santos", position: "Head Researcher" },
    ]
  },
  {
    id: 5, name: "Esports Club", abbr: "ESC", members: 45,
    officers: [
      { name: "Carlos Mendoza", position: "Captain" },
      { name: "Pedro Reyes", position: "Co-Captain" },
    ]
  },
];

const OrganizationsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const addOrganization = () => {
    toast({ title: "Add Organization", description: "Organization creation form will be added next." });
  };

  const filtered = orgsData.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Organizations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Student clubs and organizations</p>
          </div>
          <Button className="gradient-primary text-primary-foreground shadow-card" onClick={addOrganization}>
            <Plus size={16} className="mr-2" />
            Add Organization
          </Button>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search organizations..." className="pl-10 bg-muted/50" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((org, i) => (
            <Card
              key={org.id}
              className="border-border hover:shadow-elevated transition-all hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">{org.abbr}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users size={14} />
                    <span className="text-sm font-medium">{org.members}</span>
                  </div>
                </div>
                <CardTitle className="text-base font-semibold text-foreground mt-3 font-sans">{org.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Officers:</p>
                <div className="space-y-2">
                  {org.officers.slice(0, 3).map((o, j) => (
                    <div key={j} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{o.name}</span>
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{o.position}</Badge>
                    </div>
                  ))}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-primary text-xs">
                      View All Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-display text-foreground">{org.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users size={16} />
                        <span className="text-sm">{org.members} total members</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Officers</p>
                        {org.officers.map((o, j) => (
                          <div key={j} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <span className="text-sm text-foreground">{o.name}</span>
                            <Badge variant="outline" className="border-primary text-primary">{o.position}</Badge>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full gradient-green text-secondary-foreground"
                        size="sm"
                        onClick={() => toast({ title: "Add Member", description: `Add member flow for ${org.name} will be added next.` })}
                      >
                        <UserPlus size={14} className="mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationsPage;
