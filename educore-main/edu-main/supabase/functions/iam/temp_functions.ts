
// ─────────────────────────────────────────────────────────────────────────────
// EDGE FUNCTION 7: LIST USERS (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

async function listStudents(req: Request): Promise<Response> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse('Unauthorized', 401)

    // Using user-context client to respect RLS, but verifying role via DB first for speed
    const { data: userData } = await supabase.from('users').select('role').eq('auth_id', user.id).single()
    if (!userData || userData.role !== 'admin') {
        return errorResponse('DENIED: Admin access required', 403)
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*, users(email, name)') // Join to get email/name from users table
            .neq('status', 'inactive')
            .order('created_at', { ascending: false })

        if (error) throw error

        // Transform if needed to flatten user details
        const students = data.map((s: any) => ({
            ...s,
            name: s.users?.name || s.name, // Fallback
            email: s.users?.email
        }))

        return createResponse({
            success: true,
            data: students
        })
    } catch (err: any) {
        return errorResponse(`Fetch failed: ${err.message}`, 500)
    }
}

async function listTeachers(req: Request): Promise<Response> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse('Unauthorized', 401)

    // Admin check
    const { data: userData } = await supabase.from('users').select('role').eq('auth_id', user.id).single()
    if (!userData || userData.role !== 'admin') {
        return errorResponse('DENIED: Admin access required', 403)
    }

    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('*, users(email, name)')
            .neq('status', 'inactive')
            .order('created_at', { ascending: false })

        if (error) throw error

        const teachers = data.map((t: any) => ({
            ...t,
            name: t.users?.name || t.name,
            email: t.users?.email
        }))

        return createResponse({
            success: true,
            data: teachers
        })
    } catch (err: any) {
        return errorResponse(`Fetch failed: ${err.message}`, 500)
    }
}

async function listParents(req: Request): Promise<Response> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse('Unauthorized', 401)

    // Admin check
    const { data: userData } = await supabase.from('users').select('role').eq('auth_id', user.id).single()
    if (!userData || userData.role !== 'admin') {
        return errorResponse('DENIED: Admin access required', 403)
    }

    try {
        const { data, error } = await supabase
            .from('parents')
            .select('*, users(email, name), parent_student_links(student_id)')
            .order('created_at', { ascending: false })

        if (error) throw error

        const parents = data.map((p: any) => ({
            ...p,
            name: p.users?.name || p.name,
            email: p.users?.email,
            linked_students: p.parent_student_links?.map((l: any) => l.student_id) || []
        }))

        return createResponse({
            success: true,
            data: parents
        })
    } catch (err: any) {
        return errorResponse(`Fetch failed: ${err.message}`, 500)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EDGE FUNCTION 8: DASHBOARD STATS (ADMIN)
// ─────────────────────────────────────────────────────────────────────────────

async function getStats(req: Request, entity: 'student' | 'teacher' | 'parent'): Promise<Response> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse('Unauthorized', 401)

    // Admin check
    const { data: userData } = await supabase.from('users').select('role').eq('auth_id', user.id).single()
    if (!userData || userData.role !== 'admin') {
        return errorResponse('DENIED: Admin access required', 403)
    }

    try {
        const table = entity + 's' // students, teachers, parents

        // Parallel queries for stats
        const [total, active] = await Promise.all([
            supabase.from(table).select('id', { count: 'exact', head: true }),
            supabase.from(table).select('id', { count: 'exact', head: true }).eq('status', 'active') // Parents might not have status column in schema? Check schema.
            // Parents table in schema: no status column. Students and Teachers do.
        ])

        // Parent table has no status, assume all active or check users table status?
        // Users table has status.
        // For parents, we might just count total.

        let result = {
            total: total.count || 0,
            active: active.count || 0
        }

        if (entity === 'parent') {
            // Parents don't have status on their own table usually, join user?
            // Simplification: just return total for parents
            result.active = result.total
        }

        return createResponse({
            success: true,
            data: result
        })

    } catch (err: any) {
        return errorResponse(`Stats failed: ${err.message}`, 500)
    }
}
