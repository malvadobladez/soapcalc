export function mountGrimoireChat(db) {
  const key = "soapcalc.grimoire.chat";
  const widget = document.createElement("div");
  widget.innerHTML = `
    <style>
      .grimoire-chat-launch { position:fixed; right:1rem; bottom:1rem; z-index:30; }
      .grimoire-chat-panel { position:fixed; inset:0 0 0 auto; margin:0; width:min(100%,30rem); height:100%; max-width:100%; max-height:100%; overflow:auto; }
      .grimoire-chat-panel::backdrop { background:#27231955; }
      .grimoire-chat-top { display:flex; align-items:center; justify-content:space-between; gap:.75rem; }
      .grimoire-chat-text { white-space:pre-wrap; overflow-wrap:anywhere; }
      .grimoire-chat-entry { margin-bottom:.6rem; max-width:90%; border-radius:1rem; padding:.65rem .85rem; background:var(--color-base-200); }
      .grimoire-chat-entry-user { margin-inline-start:auto; background:#35584614; }
      @media(max-width:540px) { .grimoire-chat-panel { width:100%; } }
    </style>
    <button type="button" class="btn btn-primary rounded-full grimoire-chat-launch" aria-haspopup="dialog" title="Open the Grimoire assistant" hidden>▤ Ask the Grimoire</button>
    <dialog class="surface-panel p-6 grimoire-chat-panel" aria-labelledby="grimoire-chat-title">
      <div class="grimoire-chat-top">
        <h2 id="grimoire-chat-title" class="overview-script-subtitle">Ask the Grimoire.</h2>
        <button type="button" data-close class="btn btn-ghost rounded-full" title="Close the Grimoire panel">Close</button>
      </div>
      <form class="home-ai-composer mt-4">
        <label for="grimoire-chat-question" class="sr-only">Question for the Grimoire</label>
        <textarea id="grimoire-chat-question" class="textarea textarea-bordered home-ai-prompt w-full bg-base-100" rows="3" maxlength="2000" placeholder="What knowledge do you seek?" required></textarea>
        <div class="home-ai-actions">
          <button type="submit" class="btn btn-primary rounded-full" title="Send your question to the Grimoire">Send Forth</button>
          <button type="button" data-clear class="btn btn-ghost rounded-full" title="Clear this conversation and question">Clear the Page</button>
        </div>
        <p role="status" class="home-ai-status"></p>
      </form>
      <div role="log" aria-label="Conversation" class="home-ai-transcript mt-4"></div>
    </dialog>`;
  document.body.append(widget);
  const launch = widget.querySelector(".grimoire-chat-launch");
  const panel = widget.querySelector("dialog");
  const form = widget.querySelector("form");
  const question = form.querySelector("textarea");
  const submit = form.querySelector('[type="submit"]');
  const status = form.querySelector('[role="status"]');
  const log = widget.querySelector('[role="log"]');
  let owner = null;
  let history = [];
  let revision = 0;

  function render() {
    log.replaceChildren();
    if (!history.length) log.textContent = "Set forth your question, and the Grimoire shall answer.";
    for (const entry of history) {
      const user = entry.role === "user";
      const bubble = document.createElement("div");
      bubble.className = "grimoire-chat-entry" + (user ? " grimoire-chat-entry-user" : "");
      const label = document.createElement("p");
      label.className = "section-kicker";
      label.textContent = user ? "You" : "The Grimoire";
      const body = document.createElement("p");
      body.className = "grimoire-chat-text";
      body.textContent = entry.content;
      bubble.append(label, body);
      log.append(bubble);
    }
    log.scrollTop = log.scrollHeight;
  }

  function clear() {
    revision++;
    history = [];
    question.value = "";
    status.textContent = "";
    submit.disabled = false;
    try { sessionStorage.removeItem(key); } catch {}
    render();
  }

  db.auth.onAuthStateChange((event, session) => {
    const user = session?.user;
    const next = user?.email_confirmed_at ? user.id : null;
    if (!next) {
      clear();
      if (panel.open) panel.close();
    } else if (next !== owner) {
      revision++;
      history = [];
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
        if (saved?.owner === next && Array.isArray(saved.history)) history = saved.history.slice(-6);
      } catch {}
      question.value = "";
      status.textContent = "";
      submit.disabled = false;
      render();
    }
    owner = next;
    launch.hidden = !owner;
  });

  launch.onclick = () => { panel.showModal(); question.focus(); };
  widget.querySelector("[data-close]").onclick = () => panel.close();
  widget.querySelector("[data-clear]").onclick = clear;
  form.onsubmit = async event => {
    event.preventDefault();
    const message = question.value.trim();
    if (!owner || !message || submit.disabled) return;
    const request = ++revision;
    submit.disabled = true;
    status.textContent = "Waiting for the Grimoire…";
    try {
      const { data, error } = await db.functions.invoke("workspace-chat", { body: { message, history } });
      if (request !== revision) return;
      if (error || typeof data?.answer !== "string" || !data.answer.trim()) throw new Error("No answer");
      history = [...history, { role: "user", content: message }, { role: "assistant", content: data.answer.slice(0, 2000) }].slice(-6);
      try { sessionStorage.setItem(key, JSON.stringify({ owner, history })); } catch {}
      if (question.value.trim() === message) question.value = "";
      status.textContent = "";
      render();
    } catch {
      if (request === revision) status.textContent = "Could not get a reply. Your question is still here. Try again.";
    } finally {
      if (request === revision) submit.disabled = false;
    }
  };
}
