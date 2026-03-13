import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminOverviewPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">System monitoring and administrative controls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold text-foreground">Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Audit logs, user activity, and system status are available in the Audit Logs module.
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-sans font-semibold text-foreground">Management</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage student and faculty records, record violations and achievements, and maintain organizations.
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverviewPage;
