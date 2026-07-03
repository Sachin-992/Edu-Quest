import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Building2, ChevronRight, GraduationCap, Shield, Sparkles
} from "lucide-react";

const SchoolRegister = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1 fields
    const [schoolName, setSchoolName] = useState("");
    const [schoolCode, setSchoolCode] = useState("");

    // Step 2 fields
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolName || !adminEmail || !adminPassword) {
            toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }
        if (adminPassword.length < 6) {
            toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            // 1. Sign up admin user
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: adminEmail,
                password: adminPassword,
                options: {
                    data: { full_name: adminName || adminEmail },
                },
            });

            if (signUpError) throw signUpError;
            if (!signUpData.user) throw new Error("Failed to create account");

            // 2. Create school
            const freePlan = await supabase
                .from("subscription_plans")
                .select("id")
                .eq("name", "Free")
                .maybeSingle();

            const { data: school, error: schoolError } = await supabase
                .from("schools")
                .insert({
                    name: schoolName,
                    code: schoolCode || schoolName.toLowerCase().replace(/\s+/g, "-").slice(0, 20),
                    billing_email: adminEmail,
                    plan_id: freePlan.data?.id || null,
                    subscription_status: "trial",
                })
                .select("id")
                .single();

            if (schoolError) throw schoolError;

            // 3. Update profile with school_id
            await supabase
                .from("profiles")
                .update({
                    school_id: school.id,
                    full_name: adminName || adminEmail,
                })
                .eq("user_id", signUpData.user.id);

            // 4. Assign school_admin role
            await supabase
                .from("user_roles")
                .insert({ user_id: signUpData.user.id, role: "school_admin" as any })
                .single();

            // Also assign admin role for backward compatibility
            await supabase
                .from("user_roles")
                .insert({ user_id: signUpData.user.id, role: "admin" as any })
                .single();

            // 5. Audit log
            await supabase.from("audit_log").insert({
                school_id: school.id,
                user_id: signUpData.user.id,
                action: "school.register",
                resource_type: "school",
                resource_id: school.id,
                metadata: { school_name: schoolName, admin_email: adminEmail },
            });

            toast({
                title: "🎉 School registered!",
                description: "Welcome to EduQuest. Redirecting to your dashboard...",
            });

            // Navigate to admin dashboard
            setTimeout(() => navigate("/admin", { replace: true }), 1500);
        } catch (err: any) {
            console.error("[SchoolRegister] Error:", err);
            toast({
                title: "Registration failed",
                description: err.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="text-center space-y-3">
                    <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20">
                        <GraduationCap className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground">Register Your School</h1>
                    <p className="text-sm text-muted-foreground">Start your 30-day free trial · No credit card required</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-3 justify-center">
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</div>
                        School
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</div>
                        Admin Account
                    </div>
                </div>

                {/* Form Card */}
                <form onSubmit={step === 2 ? handleRegister : (e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
                    <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-6 space-y-5 shadow-lg">
                        {step === 1 && (
                            <>
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    School Details
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">School Name *</Label>
                                        <Input
                                            value={schoolName}
                                            onChange={(e) => setSchoolName(e.target.value)}
                                            placeholder="e.g. Chennai Public School"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">School Code (optional)</Label>
                                        <Input
                                            value={schoolCode}
                                            onChange={(e) => setSchoolCode(e.target.value)}
                                            placeholder="e.g. CPS-2026"
                                            className="rounded-xl"
                                        />
                                        <p className="text-[11px] text-muted-foreground">Used by students to identify your school during login.</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Shield className="w-4 h-4 text-primary" />
                                    Admin Account
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Full Name</Label>
                                        <Input
                                            value={adminName}
                                            onChange={(e) => setAdminName(e.target.value)}
                                            placeholder="Your name"
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Email *</Label>
                                        <Input
                                            type="email"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            placeholder="admin@school.edu"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Password *</Label>
                                        <Input
                                            type="password"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            required
                                            minLength={6}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
                        disabled={loading || (step === 1 && !schoolName)}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : step === 1 ? (
                            <>Next: Create Admin Account <ChevronRight className="w-4 h-4 ml-1" /></>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Start Free Trial
                            </>
                        )}
                    </Button>
                </form>

                {/* Footer Links */}
                <div className="text-center space-y-2">
                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            ← Back to school details
                        </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Already registered?{" "}
                        <button onClick={() => navigate("/admin/login")} className="text-primary font-semibold hover:underline">
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SchoolRegister;
