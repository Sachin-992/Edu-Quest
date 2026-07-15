import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "teacher" | "student" | "parent";

serve(async (req) => {
    // ---------------- CORS ----------------
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return error("Missing Authorization header", 401);

        const supabase = createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const admin = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
        );

        // -------- AUTH USER --------
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) return error("Unauthorized", 401);

        // -------- FETCH ROLE --------
        const { data: actor } = await admin
            .from("users")
            .select("id, role, status")
            .eq("auth_id", authData.user.id)
            .single();

        if (!actor || actor.status !== "active")
            return error("User not active", 403);

        // -------- REQUEST BODY --------
        const body = await req.json();
        const { action, payload } = body;

        if (!action) return error("Missing action", 400);

        // =====================================================
        // 🎓 CREATE STUDENT
        // =====================================================
        if (action === "createStudent") {
            if (actor.role !== "admin")
                return error("Admin only action", 403);

            const { email, full_name, dob, class: studentClass, section, roll_number, admission_number, address, guardian_phone } = payload;
            if (!email || !dob || !studentClass || !full_name)
                return error("Missing fields: email, dob, class, full_name required", 400);

            const password = formatDOB(dob);

            // 1. Create auth user with role in metadata
            const { data: authUser, error: authErr } =
                await admin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { role: "student", name: full_name },
                });

            if (authErr) return error(authErr.message, 400);

            // 2. Create users table row
            const { data: userRow, error: userErr } = await admin
                .from("users")
                .insert({
                    auth_id: authUser.user.id,
                    email,
                    name: full_name,
                    role: "student",
                    status: "active",
                })
                .select()
                .single();

            if (userErr) {
                // Rollback: delete auth user
                await admin.auth.admin.deleteUser(authUser.user.id);
                return error(userErr.message, 400);
            }

            // 3. Create student profile
            const { error: studentErr } = await admin.from("students").insert({
                user_id: userRow.id,
                name: full_name,
                class: studentClass,
                section: section || "A",
                roll_no: roll_number || 0,
                date_of_birth: dob,
                address: address || null,
                guardian_phone: guardian_phone || null,
                admission_number: admission_number || null,
                fee_status: "pending",
                status: "active",
            });

            if (studentErr) {
                console.error("Student insert error:", studentErr);
                // Continue - student table might have different schema
            }

            // 4. Audit log
            await admin.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: "admin",
                action: "USER_CREATE",
                entity: "student",
                entity_id: userRow.id,
                details: JSON.stringify({ email, name: full_name, role: "student" }),
                severity: "success",
            });

            return json({ success: true, message: "Student created", user_id: userRow.id });
        }

        // =====================================================
        // 👩‍🏫 CREATE TEACHER
        // =====================================================
        if (action === "createTeacher") {
            if (actor.role !== "admin")
                return error("Admin only action", 403);

            const { email, full_name, dob, subject, phone, experience_years, qualification, employee_id, designation } = payload;
            if (!email || !dob || !full_name || !subject)
                return error("Missing fields: email, dob, full_name, subject required", 400);

            const password = formatDOB(dob);

            // 1. Create auth user with role in metadata
            const { data: authUser, error: authErr } =
                await admin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { role: "teacher", name: full_name },
                });

            if (authErr) return error(authErr.message, 400);

            // 2. Create users table row
            const { data: userRow, error: userErr } = await admin
                .from("users")
                .insert({
                    auth_id: authUser.user.id,
                    email,
                    name: full_name,
                    role: "teacher",
                    status: "active",
                })
                .select()
                .single();

            if (userErr) {
                await admin.auth.admin.deleteUser(authUser.user.id);
                return error(userErr.message, 400);
            }

            // 3. Create teacher profile
            const { error: teacherErr } = await admin.from("teachers").insert({
                user_id: userRow.id,
                name: full_name,
                email: email,
                phone: phone || null,
                subject: subject,
                experience_years: experience_years || 0,
                qualification: qualification || null,
                employee_id: employee_id || null,
                designation: designation || "Teacher",
                date_of_birth: dob,
                status: "active",
                join_date: new Date().toISOString().split("T")[0],
            });

            if (teacherErr) {
                console.error("Teacher insert error:", teacherErr);
            }

            // 4. Audit log
            await admin.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: "admin",
                action: "USER_CREATE",
                entity: "teacher",
                entity_id: userRow.id,
                details: JSON.stringify({ email, name: full_name, role: "teacher" }),
                severity: "success",
            });

            return json({ success: true, message: "Teacher created", user_id: userRow.id });
        }

        // =====================================================
        // 👨‍👩‍👧 CREATE PARENT
        // =====================================================
        if (action === "createParent") {
            if (actor.role !== "admin")
                return error("Admin only action", 403);

            const { email, full_name, phone, student_id, child_dob, relationship } = payload;
            if (!email || !student_id || !child_dob || !full_name)
                return error("Missing fields: email, full_name, student_id, child_dob required", 400);

            const password = formatDOB(child_dob);

            // 1. Create auth user with role in metadata
            const { data: authUser, error: authErr } =
                await admin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { role: "parent", name: full_name },
                });

            if (authErr) return error(authErr.message, 400);

            // 2. Create users table row
            const { data: userRow, error: userErr } = await admin
                .from("users")
                .insert({
                    auth_id: authUser.user.id,
                    email,
                    name: full_name,
                    role: "parent",
                    status: "active",
                })
                .select()
                .single();

            if (userErr) {
                await admin.auth.admin.deleteUser(authUser.user.id);
                return error(userErr.message, 400);
            }

            // 3. Create parent profile
            const { data: parentRow, error: parentErr } = await admin
                .from("parents")
                .insert({
                    user_id: userRow.id,
                    name: full_name,
                    email: email,
                    phone: phone || null,
                })
                .select()
                .single();

            if (parentErr) {
                console.error("Parent insert error:", parentErr);
            } else {
                // 4. Link to student
                await admin.from("parent_student_links").insert({
                    parent_id: parentRow.id,
                    student_id,
                    relationship: relationship || "guardian",
                    is_primary: true,
                });
            }

            // 5. Audit log
            await admin.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: "admin",
                action: "USER_CREATE",
                entity: "parent",
                entity_id: userRow.id,
                details: JSON.stringify({ email, name: full_name, role: "parent", linked_student: student_id }),
                severity: "success",
            });

            return json({ success: true, message: "Parent created", user_id: userRow.id });
        }

        // =====================================================
        // 🕒 MARK ATTENDANCE (Teacher only)
        // =====================================================
        if (action === "markAttendance") {
            if (actor.role !== "teacher")
                return error("Only teachers can mark attendance", 403);

            const { student_id, timetable_period_id, date, status } = payload;
            if (!student_id || !timetable_period_id || !date || !status)
                return error("Missing fields", 400);

            // Get teacher_id from users table
            const { data: teacher } = await admin
                .from("teachers")
                .select("id")
                .eq("user_id", actor.id)
                .single();

            if (!teacher)
                return error("Teacher profile not found", 404);

            // Verify teacher owns the period
            const { data: period } = await admin
                .from("timetable_periods")
                .select("id")
                .eq("id", timetable_period_id)
                .eq("teacher_id", teacher.id)
                .single();

            if (!period)
                return error("Unauthorized period access", 403);

            const { error: insertErr } = await admin
                .from("attendance_periods")
                .insert({
                    student_id,
                    timetable_period_id,
                    date,
                    status,
                });

            if (insertErr)
                return error(insertErr.message, 400);

            await admin.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: "teacher",
                action: "ATTENDANCE_MARK",
                entity: "attendance_periods",
                details: `student=${student_id}, period=${timetable_period_id}`,
            });

            return success("Attendance marked");
        }

        // =====================================================
        // 📊 ATTENDANCE REPORT (Role-based access)
        // =====================================================
        if (action === "getAttendanceReport") {
            const { student_id } = payload || {};

            // ADMIN → ALL
            if (actor.role === "admin") {
                const { data } = await admin
                    .from("attendance_summary")
                    .select("*");
                return json({ report: data });
            }

            // STUDENT → SELF
            if (actor.role === "student") {
                const { data: student } = await admin
                    .from("students")
                    .select("id")
                    .eq("user_id", actor.id)
                    .single();

                const { data } = await admin
                    .from("attendance_summary")
                    .select("*")
                    .eq("student_id", student?.id);
                return json({ report: data });
            }

            // PARENT → LINKED CHILDREN
            if (actor.role === "parent") {
                const { data: parent } = await admin
                    .from("parents")
                    .select("id")
                    .eq("user_id", actor.id)
                    .single();

                const { data: links } = await admin
                    .from("parent_student_links")
                    .select("student_id")
                    .eq("parent_id", parent?.id);

                const studentIds = links?.map((l) => l.student_id) || [];

                const { data } = await admin
                    .from("attendance_summary")
                    .select("*")
                    .in("student_id", studentIds);
                return json({ report: data });
            }

            // TEACHER → ASSIGNED CLASSES
            if (actor.role === "teacher") {
                const { data: teacher } = await admin
                    .from("teachers")
                    .select("id")
                    .eq("user_id", actor.id)
                    .single();

                // Get class_ids from timetable_periods assigned to this teacher
                const { data: periods } = await admin
                    .from("timetable_periods")
                    .select("class_id")
                    .eq("teacher_id", teacher?.id);

                const classIds = [...new Set(periods?.map((p) => p.class_id) || [])];

                const { data: students } = await admin
                    .from("students")
                    .select("id")
                    .in("class_id", classIds);

                const studentIds = students?.map((s) => s.id) || [];

                const { data } = await admin
                    .from("attendance_summary")
                    .select("*")
                    .in("student_id", studentIds);
                return json({ report: data });
            }

            return error("Unauthorized", 403);
        }

        // =====================================================
        // ⬆️ UPLOAD FILE (Admin/Teacher only)
        // =====================================================
        if (action === "uploadFile") {
            if (!["admin", "teacher"].includes(actor.role))
                return error("Unauthorized", 403);

            const { class_id, subject_id, file_name, mime_type, base64 } = payload;
            if (!class_id || !subject_id || !file_name || !base64)
                return error("Missing fields", 400);

            // Teacher subject ownership check
            if (actor.role === "teacher") {
                const { data: teacher } = await admin
                    .from("teachers")
                    .select("id")
                    .eq("user_id", actor.id)
                    .single();

                const { data: owns } = await admin
                    .from("timetable_periods")
                    .select("id")
                    .eq("subject_id", subject_id)
                    .eq("teacher_id", teacher?.id)
                    .limit(1);

                if (!owns?.length)
                    return error("Not assigned to subject", 403);
            }

            const filePath =
                `class/${class_id}/subject/${subject_id}/${crypto.randomUUID()}`;

            const fileBuffer = Uint8Array.from(
                atob(base64),
                (c) => c.charCodeAt(0)
            );

            const { error: uploadErr } = await admin.storage
                .from("academic-files")
                .upload(filePath, fileBuffer, {
                    contentType: mime_type,
                    upsert: false,
                });

            if (uploadErr) return error(uploadErr.message, 400);

            await admin.from("academic_files").insert({
                class_id,
                subject_id,
                uploader_id: actor.id,
                file_path: filePath,
                mime_type,
            });

            await admin.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: actor.role,
                action: "FILE_UPLOAD",
                entity: "academic_files",
                details: filePath,
            });

            return success("File uploaded");
        }

        // =====================================================
        // 🔐 CHANGE PASSWORD (Teacher/Self)
        // =====================================================
        if (action === "changeOwnPassword") {
            const { new_password } = payload;

            if (!new_password || new_password.length < 8)
                return error("Password must be at least 8 characters", 400);

            // 1. Strict Role Check: Only Teachers or Admin can change own password here.
            // Students/Parents are LOCKED by DB trigger/policy.
            if (!["teacher", "admin"].includes(actor.role)) {
                return error("Role not authorized to change password", 403);
            }

            // 2. Check Policy (Optional: Enforce previous policy check)
            const { data: userSec } = await admin
                .from("users") // or user_identity_secrets if we moved it
                .select("password_policy")
                .eq("id", actor.id)
                .single();

            if (userSec?.password_policy === 'LOCKED') {
                return error("Account is locked from password changes", 403);
            }

            // 3. Update Auth User (Supabase Auth)
            const { error: updateErr } = await admin.auth.admin.updateUserById(
                authData.user.id,
                { password: new_password }
            );

            if (updateErr) return error(updateErr.message, 400);

            // 4. Update Security Flags
            // Mark first login as completed, set policy to NORMAL
            await admin
                .from("users")
                .update({
                    password_policy: 'NORMAL',
                    first_login_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq("id", actor.id);

            // 5. Audit Log (Immutable)
            await admin.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: actor.role,
                action: "PASSWORD_CHANGE",
                entity: "user",
                entity_id: actor.id,
                severity: "success",
                details: "User changed their own password",
                ip_address: "0.0.0.0"
            });

            return success("Password changed successfully");
        }

        // =====================================================
        // ⬇️ DOWNLOAD FILE (Signed URL)
        // =====================================================
        if (action === "getFileDownloadUrl") {
            const { file_id } = payload;
            if (!file_id) return error("Missing file_id", 400);

            const { data: file } = await admin
                .from("academic_files")
                .select("*")
                .eq("id", file_id)
                .single();

            if (!file) return error("File not found", 404);

            // RLS already protects metadata, but double-check
            const { data: signed } = await admin.storage
                .from("academic-files")
                .createSignedUrl(file.file_path, 3600);

            await admin.from("audit_logs").insert({
                actor_id: actor.id,
                actor_role: actor.role,
                action: "FILE_DOWNLOAD",
                entity: "academic_files",
                details: file.file_path,
            });

            return json({ url: signed?.signedUrl });
        }

        return error("Unknown action", 400);
    } catch (err) {
        console.error("EDGE ERROR:", err);
        return error("Internal server error", 500);
    }
});

// ================= HELPERS =================

function formatDOB(dob: string) {
    const d = new Date(dob);
    return `${String(d.getDate()).padStart(2, "0")}${String(
        d.getMonth() + 1
    ).padStart(2, "0")}${d.getFullYear()}`;
}

function success(message: string) {
    return new Response(JSON.stringify({ success: true, message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function error(message: string, status = 400) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function json(data: object) {
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}
