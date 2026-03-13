import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import ccsLogo from "@/assets/ccs-logo.png";
import pncLogo from "@/assets/pnc-logo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const run = async () => {
      setSubmitting(true);
      try {
        await login(username.trim(), password);
        navigate("/dashboard");
      } catch (err) {
        toast({ title: "Login failed", description: err instanceof Error ? err.message : "Invalid credentials" });
      } finally {
        setSubmitting(false);
      }
    };

    run();
  };

  const forgotPassword = () => {
    toast({
      title: "Forgot password",
      description: "Password recovery flow will be added next. Please contact MISD for now.",
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border border-primary/30" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full border border-primary/20" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-secondary/20" />
        </div>
        <div className="relative z-10 text-center max-w-lg">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-24 h-24 flex items-center justify-center">
              <img
                src={pncLogo}
                alt="University of Cabuyao Logo"
                className="w-full h-full object-contain scale-110"
              />
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <img
                src={ccsLogo}
                alt="CCS Logo"
                className="w-full h-full object-contain scale-100"
              />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-4">
            College of Computing Studies
          </h1>
          <p className="text-lg text-primary-foreground/70 mb-2">
            Pamantasan ng Cabuyao
          </p>
          <div className="w-16 h-1 gradient-primary mx-auto rounded-full my-6" />
          <p className="text-primary-foreground/60 text-sm leading-relaxed">
            Web-Based Office Management & Profiling System for IT and CS Students
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <span className="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
              IT
            </span>
            <span className="px-4 py-1.5 rounded-full bg-secondary/20 text-secondary text-xs font-semibold">
              CS
            </span>
            <span className="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
              IS
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logos */}
          <div className="flex lg:hidden items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 flex items-center justify-center">
              <img src={pncLogo} alt="PnC Logo" className="w-full h-full object-contain scale-110" />
            </div>
            <div className="w-16 h-16 flex items-center justify-center">
              <img src={ccsLogo} alt="CCS Logo" className="w-full h-full object-contain scale-100" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access the CCS Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">
                Username or Email
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-muted/50 border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-muted/50 border-border focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                Remember me
              </label>
              <button type="button" onClick={forgotPassword} className="text-sm text-primary hover:underline font-medium">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base shadow-card hover:opacity-90 transition-opacity"
            >
              <LogIn size={18} className="mr-2" />
              {submitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Having trouble? Contact MISD via their official Facebook page
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Katapatan Mutual Homes, Brgy. Banay-banay, City of Cabuyao, Laguna 4025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
