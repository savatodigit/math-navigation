import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://savatodigit.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return respond({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return respond({ error: "Требуется вход преподавателя." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("APP_SERVER_KEY");
    const teacherEmail = (Deno.env.get("TEACHER_EMAIL") || "").trim().toLowerCase();
    if (!url || !serviceKey || !teacherEmail) {
      console.error("Missing SUPABASE_URL, APP_SERVER_KEY or TEACHER_EMAIL secret");
      return respond({ error: "Сервер кабинета не настроен." }, 500);
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user || (authData.user.email || "").toLowerCase() !== teacherEmail) {
      return respond({ error: "Доступ разрешён только преподавателю." }, 403);
    }

    const [applicationsResult, studentsResult, variantsResult] = await Promise.all([
      supabase.from("coursework_applications").select("*").order("application_no", { ascending: true }),
      supabase.from("coursework_students").select("*"),
      supabase.from("coursework_variants").select("*").eq("is_active", true),
    ]);

    if (applicationsResult.error || studentsResult.error || variantsResult.error) {
      console.error("Teacher list query failed", applicationsResult.error?.message, studentsResult.error?.message, variantsResult.error?.message);
      return respond({ error: "Не удалось загрузить данные заявок. Проверьте структуру таблиц." }, 500);
    }

    const students = new Map((studentsResult.data || []).map((s: any) => [String(s.id), s]));
    const applications = (applicationsResult.data || []).map((a: any) => {
      const s: any = students.get(String(a.student_id)) || {};
      const fullName = [s.surname, s.given_name, s.patronymic].filter(Boolean).join(" ");
      return {
        application_no: a.application_no ?? a.id ?? "",
        full_name: fullName,
        study_group: s.study_group ?? "",
        record_book_no: s.record_book_no ?? "",
        variant_no: a.variant_no ?? "",
        created_at: a.created_at ? new Date(a.created_at).toLocaleString("ru-RU") : "",
      };
    });

    const assigned = new Set(applications.map((a: any) => String(a.variant_no)).filter(Boolean));
    const activeVariantCount = (variantsResult.data || []).length;

    return respond({
      applications,
      used_variants: assigned.size,
      free_variants: Math.max(0, activeVariantCount - assigned.size),
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error instanceof Error ? error.message : error);
    return respond({ error: "Внутренняя ошибка кабинета преподавателя." }, 500);
  }
});