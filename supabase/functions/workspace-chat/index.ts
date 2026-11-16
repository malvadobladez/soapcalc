const origin = "https://soapcalc.dacruz.ca";
const headers = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const json = (status: number, value: object) => Response.json(value, { status, headers });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json(401, { error: "authentication_required" });
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return json(503, { error: "auth_not_configured" });
  try {
    const userResponse = await fetch(url + "/auth/v1/user", {
      headers: { Authorization: auth, apikey: anon },
      signal: AbortSignal.timeout(5000),
    });
    if (userResponse.status === 401 || userResponse.status === 403) {
      return json(401, { error: "authentication_required" });
    }
    if (!userResponse.ok) return json(503, { error: "auth_unavailable" });
    const user = await userResponse.json();
    if (!user.email_confirmed_at || user.app_metadata?.catalog_admin !== true) {
      return json(403, { error: "catalog_admin_required" });
    }
    const body = await request.text();
    if (body.length > 16000) return json(413, { error: "message_too_large" });
    let payload;
    try { payload = JSON.parse(body); } catch { return json(400, { error: "invalid_request" }); }
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    if (!message || message.length > 2000) return json(400, { error: "invalid_message" });
    const history = Array.isArray(payload.history) ? payload.history.slice(-6).flatMap((entry: { role?: string; content?: string }) =>
      entry && (entry.role === "user" || entry.role === "assistant") && typeof entry.content === "string"
        ? [{ role: entry.role, content: entry.content.slice(0, 2000) }] : []
    ) : [];
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json(503, { error: "openai_not_configured" });
    const result = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
        instructions: "You are the Hidden Grimoire workspace assistant for a handcrafted product lab. Help with soap, tea, tinctures and infusions, prepared oils, topical preparations, soaks, ingredient inventory, packaging, labeling, costing and workflow. Briefly redirect unrelated requests to these topics. Answer the latest question first, avoid repeating advice, and ask for clarification only when needed. Answer general questions without requiring a recipe. You have no access to saved recipes or inventory and cannot update records. Never invent ingredient properties, SAP values, usage limits or lye amounts. Do not provide medical diagnosis or treatment advice.",
        input: [...history, { role: "user", content: message }],
        max_output_tokens: 650,
        store: false,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!result.ok) {
      console.warn("OpenAI workspace chat failed", result.status);
      return json(502, { error: "openai_request_failed", upstream_status: result.status });
    }
    const response = await result.json();
    const answer = response.output?.flatMap((item: { type: string; content?: { type: string; text?: string }[] }) =>
      item.type === "message" ? (item.content ?? []).filter(part => part.type === "output_text").map(part => part.text ?? "") : []
    ).join("\n").trim();
    return answer ? json(200, { answer }) : json(502, { error: "openai_response_incomplete" });
  } catch (error) {
    console.warn("Workspace chat failed", error instanceof Error ? error.name : "unknown");
    return json(503, { error: "connection_check_unavailable" });
  }
});
