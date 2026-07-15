import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Layer 3: Pre-warm Supabase connection (DNS + TLS done before user clicks Sign In)
  useEffect(() => {
    supabase.auth.getSession().catch(() => { });
  }, []);

  // Rate limiting: max 5 attempts per 2 minutes
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limit check
    if (Date.now() < lockoutUntil) {
      const secs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast({ title: "Too many attempts", description: `Please wait ${secs}s before trying again.`, variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        // SECURITY: Verify user actually has admin role from server — never trust client
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        const roles = (roleData || []).map(r => r.role);
        const adminRoles = ["admin", "super_admin", "school_admin", "platform_admin", "teacher"];
        const isAdmin = roles.some(r => adminRoles.includes(r));

        if (!isAdmin) {
          await supabase.auth.signOut();
          toast({ title: "Access Denied", description: "This account does not have admin privileges.", variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      // Let AuthContext handle caching after server-verified role fetch
      navigate("/admin", { replace: true });
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 120_000); // 2 minute lockout
        setAttempts(0);
      }
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-edu-purple/10 blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-primary/10 blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src="/eduquest-logo.png" alt="EduQuest" className="w-16 h-16 object-contain" />
            <span className="text-2xl font-black">EduQuest Portal</span>
          </div>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Teacher & Admin Login 🔐</CardTitle>
            <CardDescription>Sign in to access the school dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email</label>
                <Input
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-edu-purple text-edu-purple-foreground font-bold text-base hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
