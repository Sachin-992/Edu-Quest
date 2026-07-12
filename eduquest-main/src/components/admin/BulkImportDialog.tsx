import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface BulkImportDialogProps {
    schoolId: string;
    onImportComplete: () => void;
}

interface ImportRow {
    full_name: string;
    roll_number: string;
    class_level: string;
    pin: string;
}

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

const BulkImportDialog = ({ schoolId, onImportComplete }: BulkImportDialogProps) => {
    const [open, setOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const fileRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });

                // Read the first sheet
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON — header row becomes keys
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

                const parsed: ImportRow[] = [];
                for (const row of jsonData) {
                    // Support flexible column names (case-insensitive, with/without underscores)
                    const name = String(row["full_name"] ?? row["Full Name"] ?? row["name"] ?? row["Name"] ?? row["FULL_NAME"] ?? "").trim();
                    const roll = String(row["roll_number"] ?? row["Roll Number"] ?? row["roll"] ?? row["Roll"] ?? row["ROLL_NUMBER"] ?? "").trim();
                    const cls = String(row["class_level"] ?? row["Class Level"] ?? row["class"] ?? row["Class"] ?? row["CLASS_LEVEL"] ?? "").trim();
                    const pin = String(row["pin"] ?? row["Pin"] ?? row["PIN"] ?? row["password"] ?? row["Password"] ?? "").trim();

                    if (name || roll) {
                        parsed.push({
                            full_name: name,
                            roll_number: roll,
                            class_level: cls,
                            pin: pin,
                        });
                    }
                }

                setRows(parsed);
                setResult(null);

                if (parsed.length === 0) {
                    toast({
                        title: "No data found",
                        description: "Make sure your Excel file has columns: full_name, roll_number, class_level, pin",
                        variant: "destructive",
                    });
                }
            } catch (err: any) {
                toast({
                    title: "Failed to read file",
                    description: err.message || "Invalid file format",
                    variant: "destructive",
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            { full_name: "Arun Kumar", roll_number: "STU001", class_level: 7, pin: "123456" },
            { full_name: "Priya S", roll_number: "STU002", class_level: 7, pin: "654321" },
            { full_name: "Ravi M", roll_number: "STU003", class_level: 8, pin: "112233" },
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Set column widths
        ws["!cols"] = [
            { wch: 20 }, // full_name
            { wch: 14 }, // roll_number
            { wch: 12 }, // class_level
            { wch: 10 }, // pin
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "student_import_template.xlsx");
    };

    const handleImport = async () => {
        if (rows.length === 0) return;
        setImporting(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast({ title: "Not authenticated", variant: "destructive" });
            setImporting(false);
            return;
        }

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const row of rows) {
            try {
                if (!row.full_name || !row.roll_number || !row.pin) {
                    errors.push(`${row.roll_number || "??"}: Missing fields`);
                    failed++;
                    continue;
                }
                if (row.pin.length < 6) {
                    errors.push(`${row.roll_number}: PIN too short (min 6)`);
                    failed++;
                    continue;
                }

                const res = await supabase.functions.invoke("create-student", {
                    body: {
                        full_name: row.full_name,
                        roll_number: row.roll_number,
                        class_level: parseInt(row.class_level) || 1,
                        school_id: schoolId,
                        pin: row.pin,
                    },
                });

                if (res.error || res.data?.error) {
                    let errMsg = res.data?.error || res.error?.message;
                    if (res.error?.context && typeof res.error.context.json === "function") {
                        try {
                            const errBody = await res.error.context.json();
                            if (errBody && errBody.error) {
                                errMsg = errBody.error;
                            }
                        } catch (e) {
                            console.error("[BulkImport] Failed to parse error response context:", e);
                        }
                    }
                    errors.push(`${row.roll_number}: ${errMsg}`);
                    failed++;
                } else {
                    success++;
                }
            } catch (err: any) {
                errors.push(`${row.roll_number}: ${err.message}`);
                failed++;
            }
        }

        setResult({ success, failed, errors });
        setImporting(false);
        if (success > 0) onImportComplete();
    };

    const handleClose = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setRows([]);
            setResult(null);
            setFileName("");
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg">
                    <Upload className="h-3.5 w-3.5" /> <span className="hidden md:inline">Excel Import</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" /> Bulk Import Students
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Format info + Template download */}
                    <div className="rounded-lg bg-muted/50 border p-3">
                        <p className="text-xs text-muted-foreground mb-2">
                            Excel format (.xlsx) with these columns:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="text-xs w-full border-collapse">
                                <thead>
                                    <tr className="bg-green-50 dark:bg-green-950/30">
                                        <th className="border border-border/50 px-2 py-1.5 text-left font-bold text-green-700 dark:text-green-400">full_name</th>
                                        <th className="border border-border/50 px-2 py-1.5 text-left font-bold text-green-700 dark:text-green-400">roll_number</th>
                                        <th className="border border-border/50 px-2 py-1.5 text-left font-bold text-green-700 dark:text-green-400">class_level</th>
                                        <th className="border border-border/50 px-2 py-1.5 text-left font-bold text-green-700 dark:text-green-400">pin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-border/50 px-2 py-1">Arun Kumar</td>
                                        <td className="border border-border/50 px-2 py-1">STU001</td>
                                        <td className="border border-border/50 px-2 py-1">7</td>
                                        <td className="border border-border/50 px-2 py-1">123456</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-border/50 px-2 py-1">Priya S</td>
                                        <td className="border border-border/50 px-2 py-1">STU002</td>
                                        <td className="border border-border/50 px-2 py-1">7</td>
                                        <td className="border border-border/50 px-2 py-1">654321</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            className="mt-2 gap-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 p-1.5 h-auto"
                        >
                            <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
                        </Button>
                    </div>

                    {/* File picker */}
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                    {fileName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                            {fileName}
                        </p>
                    )}

                    {/* Preview table */}
                    {rows.length > 0 && !result && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">
                                ✅ {rows.length} student{rows.length > 1 ? "s" : ""} ready to import
                            </p>
                            <div className="max-h-40 overflow-y-auto rounded border">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-2 py-1 text-left">Name</th>
                                            <th className="px-2 py-1 text-left">Roll</th>
                                            <th className="px-2 py-1 text-left">Class</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.slice(0, 10).map((r, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="px-2 py-1">{r.full_name}</td>
                                                <td className="px-2 py-1">{r.roll_number}</td>
                                                <td className="px-2 py-1">{r.class_level}</td>
                                            </tr>
                                        ))}
                                        {rows.length > 10 && (
                                            <tr><td colSpan={3} className="px-2 py-1 text-muted-foreground">... and {rows.length - 10} more</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
                                {importing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> Import {rows.length} Students</>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" /> {result.success} created
                                </div>
                                {result.failed > 0 && (
                                    <div className="flex items-center gap-1 text-destructive">
                                        <AlertCircle className="w-4 h-4" /> {result.failed} failed
                                    </div>
                                )}
                            </div>
                            {result.errors.length > 0 && (
                                <div className="max-h-32 overflow-y-auto text-xs text-destructive bg-destructive/5 rounded p-2 space-y-1">
                                    {result.errors.map((e, i) => <div key={i}>{e}</div>)}
                                </div>
                            )}
                            <Button onClick={() => handleClose(false)} className="w-full">
                                Done
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BulkImportDialog;
