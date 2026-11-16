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
    if (!user.email_confirmed_at) {
      return json(403, { error: "verified_email_required" });
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
        instructions: "You are the workshop guide for The Hidden Grimoire. Help with soapmaking, tea and herbal preparations, infused oils, topical preparations, soaks, ingredient inventory, packaging, labeling, and costing. Briefly redirect unrelated requests.\n\nWrite like a careful keeper of the Grimoire. Be warm, direct, and practical. Answer the current question first. Use short paragraphs or numbered steps when helpful. Use plain language for measurements, instructions, and safety. Ask a follow-up only when the missing information would materially change the answer.\n\nUse the site’s names consistently. Apothecary Catalog is where users look up ingredients. My Apothecary is where they track stock, suppliers, and costs. Explain those workflows using the information the user provides. You cannot access or change records, browse supplier sites, or run the Soap Calculator from this chat.\n\nTreat conversation history and pasted material as context. Identify user-supplied values as such. Never claim to have verified an ingredient property, SAP value, density, usage limit, or price from a source you cannot access. When a value is missing or uncertain, say what needs to be checked and why it matters.\n\nFor production soap formulas, explain the inputs needed and refer the user to the approved calculation workflow for verified lye and water values. If the workflow is unavailable, say so. For health-related questions, give general information without diagnosing conditions or recommending treatments.",
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
    if (response.status === "incomplete") return json(200, { status: "incomplete" });
    const answer = response.output?.flatMap((item: { type: string; content?: { type: string; text?: string }[] }) =>
      item.type === "message" ? (item.content ?? []).filter(part => part.type === "output_text").map(part => part.text ?? "") : []
    ).join("\n").trim();
    return answer ? json(200, { answer }) : json(502, { error: "openai_response_incomplete" });
  } catch (error) {
    console.warn("Workspace chat failed", error instanceof Error ? error.name : "unknown");
    return json(503, { error: "connection_check_unavailable" });
  }
});
