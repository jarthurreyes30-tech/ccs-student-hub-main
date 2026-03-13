import { useState } from "react";
import { Save, User, Lock, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import DashboardLayout from "@/components/DashboardLayout";

const SettingsPage = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@pnc.edu.ph",
    username: "admin",
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your account and system preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
              <User size={14} /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
              <Lock size={14} /> Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm">
              <Bell size={14} /> Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="font-sans text-lg text-foreground">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/40">
                  <div>
                    <p className="text-sm font-medium text-foreground">Appearance</p>
                    <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
                  </div>
                  <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">First Name</Label>
                    <Input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Last Name</Label>
                    <Input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Username</Label>
                  <Input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                </div>
                <Button className="gradient-primary text-primary-foreground" onClick={handleSave}>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="font-sans text-lg text-foreground">Change Password</CardTitle>
                <CardDescription>Keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Current Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">New Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Confirm New Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button className="gradient-primary text-primary-foreground" onClick={handleSave}>
                  <Shield size={16} className="mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="font-sans text-lg text-foreground">Notification Preferences</CardTitle>
                <CardDescription>Choose what you want to be notified about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { label: "Email Notifications", desc: "Receive email updates for important events", default: true },
                  { label: "New Violation Alerts", desc: "Get notified when a new violation is recorded", default: true },
                  { label: "Enrollment Updates", desc: "Notifications about enrollment status changes", default: false },
                  { label: "System Maintenance", desc: "Advance notice of scheduled maintenance", default: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.default} />
                  </div>
                ))}
                <Button className="gradient-primary text-primary-foreground" onClick={handleSave}>
                  <Save size={16} className="mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
