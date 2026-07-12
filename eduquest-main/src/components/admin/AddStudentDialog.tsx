import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddStudentDialogProps {
  schoolId: string;
  onStudentAdded: () => void;
}

const MIN_PIN = 6;

const AddStudentDialog = ({ schoolId, onStudentAdded }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [pin, setPin] = useState("");
  const [createdCreds, setCreatedCreds] = useState<{ rollNumber: string; pin: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !rollNumber || !classLevel || !pin) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (pin.length < MIN_PIN) {
      toast({ title: `PIN must be at least ${MIN_PIN} characters`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const payload = {
        full_name: fullName,
        roll_number: rollNumber,
        class_level: parseInt(classLevel),
        school_id: schoolId,
        pin,
      };

      // Try Edge Function first
      let success = false;
      try {
        const res = await supabase.functions.invoke("create-student", {
          body: payload,
        });

        if (res.error) throw res.error;
      } catch (edgeFnErr: any) {
        console.error("[AddStudent] Edge Function error:", edgeFnErr);
        let errorMsg = edgeFnErr.message;
        
        if (edgeFnErr.context && typeof edgeFnErr.context.json === "function") {
          try {
            // Read the JSON response body
            const errBody = await edgeFnErr.context.json();
            if (errBody && errBody.error) {
              errorMsg = errBody.error;
            }
          } catch (e) {
            console.error("[AddStudent] Failed to parse error response context:", e);
          }
        }
        
        throw new Error(
          errorMsg || "Failed to create student. Please check network/config or if the Edge Function is deployed."
        );
      }

      if (success) {
        setCreatedCreds({ rollNumber, pin });
        toast({ title: "Student created successfully! 🎉" });
        onStudentAdded();
      }
    } catch (err: any) {
      console.error("[AddStudent] Error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdCreds) return;
    const text = `Roll Number: ${createdCreds.rollNumber}\nPIN: ${createdCreds.pin}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form
      setFullName("");
      setRollNumber("");
      setClassLevel("");
      setPin("");
      setCreatedCreds(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-lg shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200">
          <UserPlus className="w-4 h-4" /> <span className="hidden md:inline">Add Student</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {createdCreds ? "Student Created! 🎉" : "Add New Student"}
          </DialogTitle>
        </DialogHeader>

        {createdCreds ? (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Share these credentials with the student. They will use them to log in.
            </p>
            <div className="rounded-lg bg-muted/50 border p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Roll Number:</span>
                <span className="font-bold">{createdCreds.rollNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">PIN:</span>
                <span className="font-bold">{createdCreds.pin}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 gap-2"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button
                onClick={() => {
                  setCreatedCreds(null);
                  setFullName("");
                  setRollNumber("");
                  setClassLevel("");
                  setPin("");
                }}
                className="flex-1"
              >
                Add Another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g. Arun Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                placeholder="e.g. STU001"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classLevel">Class</Label>
              <Select value={classLevel} onValueChange={setClassLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((c) => (
                    <SelectItem key={c} value={String(c)}>
                      Class {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">Login PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder={`Min ${MIN_PIN} characters`}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                minLength={MIN_PIN}
              />
              <p className="text-xs text-muted-foreground">
                Students will use this PIN to log in. Minimum {MIN_PIN} characters.
              </p>
            </div>
            <Button type="submit" className="w-full active:scale-[0.98] transition-transform" disabled={loading}>
              {loading ? "Creating..." : "Create Student"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
