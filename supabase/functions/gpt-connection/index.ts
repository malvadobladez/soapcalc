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
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json(503, { error: "openai_not_configured" });
    const result = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
        input: "Reply with the single word OK.",
        max_output_tokens: 16,
        store: false,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!result.ok) {
      console.warn("OpenAI connection check failed", result.status);
      return json(502, { error: "openai_request_failed", upstream_status: result.status });
    }
    const response = await result.json();
    const replied = response.status === "completed" && response.output?.some(
      (item: { type: string; content?: { type: string; text?: string }[] }) =>
        item.type === "message" && item.content?.some(part => part.type === "output_text" && part.text?.trim())
    );
    return replied ? json(200, { connected: true }) : json(502, { error: "openai_response_incomplete" });
  } catch (error) {
    console.warn("Connection check failed", error instanceof Error ? error.name : "unknown");
    return json(503, { error: "connection_check_unavailable" });
  }
});
