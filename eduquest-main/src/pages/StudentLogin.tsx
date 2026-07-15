import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StudentLogin = () => {
  const [rollNumber, setRollNumber] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Layer 3: Pre-warm Supabase connection / handle SSO redirect auto-login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      setLoading(true);
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (!error && data.session) {
          navigate("/dashboard");
        } else {
          toast({
            title: "Session Error 🔑",
            description: "Failed to automatically log in. Please enter credentials.",
            variant: "destructive",
          });
        }
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      supabase.auth.getSession().catch(() => { });
    }
  }, [navigate, toast]);

  // Rate limiting: max 5 attempts per 2 minutes
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limit check
    if (Date.now() < lockoutUntil) {
      const secs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      toast({ title: "Too many attempts", description: `Please wait ${secs}s before trying again.`, variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let session: { access_token?: string; refresh_token?: string; user?: { id: string } } | null = null;

      // Layer 1: Try Edge Function
      try {
        const { data, error } = await supabase.functions.invoke("student-login", {
          body: { roll_number: rollNumber, pin },
        });

        if (error || data?.error) {
          throw new Error(data?.error || error?.message || "Edge Function failed");
        }

        session = data.session;
      } catch (edgeFnErr: any) {
        console.warn("[StudentLogin] Edge Function unavailable, using direct login");

        // Layer 2: Direct Supabase auth fallback
        const generatedEmail = `${rollNumber.toLowerCase().replace(/\s+/g, "")}@student.eduquest.local`;

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: generatedEmail,
          password: pin,
        });

        if (signInError) {
          toast({
            title: "Oops! 🔑",
            description: "Check your roll number and PIN and try again",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        session = signInData.session;
      }

      // Set session from the response — let AuthContext handle role resolution
      if (session) {
        if (session.access_token && session.refresh_token) {
          // Edge function session — set it manually
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        }
        // AuthContext will auto-fetch role + profile from server via onAuthStateChange
        navigate("/dashboard");
      }
    } catch {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 120_000);
        setAttempts(0);
      }
      toast({
        title: "Oh no! 🔄",
        description: "Something didn't work. Let's try again!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src="/eduquest-logo.png" alt="EduQuest" className="w-16 h-16 object-contain" />
            <span className="text-2xl font-black">EduQuest</span>
          </div>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Student Login 🎓</CardTitle>
            <CardDescription>Enter your roll number and PIN to start learning</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Roll Number</label>
                <Input
                  placeholder="e.g. STU001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">PIN 🔑</label>
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    placeholder="Enter your PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    className="h-12 rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "🚀 Start Learning"
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

export default StudentLogin;
