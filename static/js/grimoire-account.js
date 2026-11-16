import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm";
export const db = createClient("https://dfuanosyewsimvhdparf.supabase.co", "sb_publishable_biDbT_ZmXynIVLrgukrz5g_ZBTk84T7");

const host = document.querySelector("[data-grimoire-header]");
if (host) {
  const line = document.createElement("div");
  line.className = "grimoire-header-line";
  const label = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "section-kicker";
  kicker.textContent = "The Living Grimoire";
  const title = document.createElement("p");
  title.className = "text-xl font-semibold";
  title.textContent = host.dataset.grimoireHeader;
  label.append(kicker, title);
  const account = document.createElement("div");
  account.className = "grimoire-account";
  account.hidden = true;
  const signIn = document.createElement("button");
  signIn.type = "button";
  signIn.className = "grimoire-account-pill font-semibold";
  signIn.textContent = "Sign in";
  signIn.hidden = true;
  const profile = document.createElement("a");
  profile.href = "/profile.html";
  profile.title = "Open my profile";
  profile.className = "grimoire-account-pill";
  const logout = document.createElement("button");
  logout.type = "button";
  logout.className = "grimoire-account-pill font-semibold";
  logout.textContent = "Sign out";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.hidden = true;
  const dialog = document.createElement("dialog");
  dialog.className = "surface-panel p-6";
  dialog.style.cssText = "margin:auto;width:min(92vw,28rem);max-height:88vh;overflow:auto";
  dialog.setAttribute("aria-labelledby", "grimoire-signin-title");
  dialog.innerHTML = `
    <h2 id="grimoire-signin-title" class="text-2xl">Sign in</h2>
    <form class="space-y-4 mt-4">
      <label class="block">Email <input name="email" type="email" autocomplete="username" class="input input-bordered rounded-full w-full" required></label>
      <label class="block">Password <input name="password" type="password" autocomplete="current-password" class="input input-bordered rounded-full w-full" required></label>
      <p role="status"></p>
      <div class="flex flex-wrap gap-3">
        <button type="submit" class="btn btn-primary rounded-full">Sign in</button>
        <a href="/signup.html" class="grimoire-account-pill">Create account</a>
        <button type="button" class="btn btn-ghost rounded-full">Cancel</button>
      </div>
    </form>`;
  const form = dialog.querySelector("form");
  const feedback = form.querySelector('[role="status"]');
  const submit = form.querySelector('[type="submit"]');
  const cancel = form.querySelector('[type="button"]');
  dialog.addEventListener("close", () => { form.reset(); feedback.textContent = ""; });
  signIn.onclick = () => dialog.showModal();
  cancel.onclick = () => dialog.close();
  dialog.addEventListener("cancel", event => { if (submit.disabled) event.preventDefault(); });
  form.onsubmit = async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const fields = new FormData(form);
    submit.disabled = cancel.disabled = true;
    feedback.textContent = "";
    try {
      const { error } = await db.auth.signInWithPassword({
        email: fields.get("email").trim().toLowerCase(),
        password: fields.get("password")
      });
      if (error) {
        feedback.textContent = error.code === "email_not_confirmed"
          ? "Verify your email before signing in." : "Could not sign in. Check your email and password.";
      } else dialog.close();
    } catch {
      feedback.textContent = "Could not sign in. Try again.";
    } finally { submit.disabled = cancel.disabled = false; }
  };
  document.body.append(dialog);
  account.append(profile, logout, signIn);
  line.append(label, account);
  host.prepend(line, status);

  db.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    const metadata = user?.user_metadata ?? {};
    const name = [metadata.display_name, metadata.full_name, metadata.name]
      .find(value => typeof value === "string" && value.trim());
    profile.textContent = user ? name?.trim() || user.email || "Signed in" : "";
    account.hidden = false;
    profile.hidden = logout.hidden = !user;
    signIn.hidden = Boolean(user);
    if (user && dialog.open) dialog.close();
  });
  logout.onclick = async () => {
    logout.disabled = true;
    status.hidden = true;
    try {
      const result = await db.auth.signOut();
      if (result.error) throw result.error;
    } catch {
      status.textContent = "Could not sign out. Try again.";
      status.hidden = false;
    } finally { logout.disabled = false; }
  };
}
