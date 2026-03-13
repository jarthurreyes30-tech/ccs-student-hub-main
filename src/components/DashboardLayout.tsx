import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/auth/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(
    [
      { id: "n-1", title: "New student enrolled", description: "Juan Dela Cruz (2024-0001)", time: "2m", read: false },
      { id: "n-2", title: "Violation resolved", description: "V-003 marked as Resolved", time: "15m", read: false },
      { id: "n-3", title: "Backup completed", description: "Automated backup finished successfully", time: "3h", read: true },
    ],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({ title: "Notifications", description: "All notifications marked as read." });
  };

  const clearNotifications = () => {
    setNotifications([]);
    toast({ title: "Notifications", description: "Notifications cleared." });
  };

  const openNotification = (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (!item) return;

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    toast({ title: item.title, description: item.description });
  };

  const submitSearch = () => {
    if (!search.trim()) return;
    toast({ title: "Search", description: `Searching for "${search.trim()}"...` });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden sm:block relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-8 w-48 lg:w-64 bg-muted/50 text-sm border-none focus-visible:ring-1"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch();
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 p-0 flex items-center justify-center text-[10px] gradient-primary text-primary-foreground border-none">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllAsRead} disabled={notifications.length === 0 || unreadCount === 0}>
                        Mark all read
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearNotifications} disabled={notifications.length === 0}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    <div className="max-h-80 overflow-auto">
                      {notifications.map((n) => (
                        <DropdownMenuItem key={n.id} className="cursor-pointer items-start gap-3 py-2" onSelect={() => openNotification(n.id)}>
                          <div className={`mt-1 h-2 w-2 rounded-full ${n.read ? "bg-muted" : "bg-primary"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{n.description}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {(user?.username ?? "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-foreground leading-tight">{user?.username ?? "User"}</p>
                        <p className="text-[10px] text-muted-foreground">{(user?.role ?? "").toUpperCase()}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => {
                        logout();
                        toast({ title: "Signed out", description: "You have been logged out." });
                      }}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
