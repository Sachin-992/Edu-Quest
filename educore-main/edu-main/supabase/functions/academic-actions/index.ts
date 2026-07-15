
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Verify User
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (userError || !user) {
            throw new Error('Invalid token')
        }

        const { action, payload } = await req.json()

        if (action === 'uploadFile') {
            const { class_id, subject_id, file_name, mime_type, base64 } = payload

            if (!class_id || !file_name || !base64) {
                throw new Error('Missing required fields')
            }

            // 2. Decode File
            const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

            // 3. Upload to Storage
            // Path: class_id/subject_id/filename (timestamped to avoid collision)
            const timestamp = new Date().getTime()
            const filePath = `${class_id}/${subject_id || 'general'}/${timestamp}_${file_name}`

            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('academic_resources')
                .upload(filePath, fileData, {
                    contentType: mime_type,
                    upsert: false
                })

            if (uploadError) throw uploadError

            // 5. Create DB Record (now using RLS compliant insert)
            const { data: dbData, error: dbError } = await supabaseClient
                .from('academic_files')
                .insert({
                    class_id,
                    subject_id,
                    file_name,
                    file_path: filePath,
                    file_type: mime_type,
                    file_size: fileData.length,
                    uploaded_by: user.id
                })
                .select()
                .single()

            if (dbError) throw dbError

            return new Response(
                JSON.stringify({ success: true, data: dbData }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'createNotice') {
            const { class_id, type, title, content } = payload
            // RLS will enforce permissions, but we can double check logic here if needed
            const { data, error } = await supabaseClient
                .from('notices')
                .insert({
                    class_id,
                    type,
                    title,
                    content,
                    author_id: user.id
                })
                .select()
                .single()

            if (error) throw error
            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'updateHomework') {
            const { class_id, subject_id, content, date } = payload
            const { data, error } = await supabaseClient
                .from('daily_homework')
                .upsert({
                    class_id,
                    subject_id,
                    homework_date: date || new Date().toISOString().split('T')[0],
                    content,
                    teacher_id: user.id
                }, { onConflict: 'class_id,subject_id,homework_date' })
                .select()
                .single()

            if (error) throw error
            return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'markAttendance') {
            // Expects period_id for strict attendance
            const { period_id, records } = payload
            // records: [{ student_id, status }]

            // We need to map to attendance_periods table
            const attendanceRows = records.map((r: any) => ({
                student_id: r.student_id,
                timetable_period_id: period_id,
                attendance_date: new Date().toISOString().split('T')[0],
                status: r.status,
                marked_by: user.id
            }))

            const { data, error } = await supabaseClient
                .from('attendance_periods')
                .upsert(attendanceRows, { onConflict: 'student_id,timetable_period_id,attendance_date' })
                .select()

            if (error) throw error
            return new Response(JSON.stringify({ success: true, count: data.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'submitMarks') {
            const { exam_id, records } = payload
            // records: [{ student_id, subject, marks, max_marks }]

            const marksRows = records.map((r: any) => ({
                student_id: r.student_id,
                exam_id,
                subject: r.subject,
                marks: r.marks,
                max_marks: r.max_marks || 100, // Default or passed
                grade: r.marks >= 90 ? 'A+' : r.marks >= 80 ? 'A' : r.marks >= 70 ? 'B+' : r.marks >= 60 ? 'B' : r.marks >= 50 ? 'C' : 'F',
                entered_by: user.id
            }))

            const { data, error } = await supabaseClient
                .from('marks')
                .upsert(marksRows, { onConflict: 'student_id,exam_id,subject' })
                .select()

            if (error) throw error
            return new Response(JSON.stringify({ success: true, count: data.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
