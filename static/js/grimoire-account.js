import { mountGrimoireChat } from "./grimoire-chat.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm";
export const db = createClient("https://dfuanosyewsimvhdparf.supabase.co", "sb_publishable_biDbT_ZmXynIVLrgukrz5g_ZBTk84T7");

const blockedDisplayWords = new Set(["fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch", "cunt", "asshole", "dickhead", "whore", "slut"]);

export function hasVulgarDisplayName(name) {
  const words = name.normalize("NFKC").toLowerCase().replace(/\p{Cf}/gu, "").match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.some(word => blockedDisplayWords.has(word));
}

export function bindSignup(form, message) {
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const fields = new FormData(form);
    const displayName = fields.get("display_name").trim();
    if (!displayName) { message.textContent = "Enter a display name."; return; }
    if (hasVulgarDisplayName(displayName)) { message.textContent = "Choose a display name without vulgar language."; return; }
    button.disabled = true;
    try {
      const { error } = await db.auth.signUp({
        email: fields.get("email").trim().toLowerCase(),
        password: fields.get("password"),
        options: { emailRedirectTo: "https://soapcalc.dacruz.ca/", data: { display_name: displayName } }
      });
      if (error && !["user_already_exists", "email_exists"].includes(error.code)) throw error;
      form.reset();
      message.textContent = "If this address can be registered, check your inbox for a verification link. If you already verified this email, sign in.";
    } catch (error) {
      message.textContent = error?.status === 429 || ["over_email_send_rate_limit", "over_request_rate_limit"].includes(error?.code)
        ? "Too many signup or verification email requests. Wait before trying again."
        : "Could not submit signup. Check your details or try again shortly.";
    }
    finally { button.disabled = false; }
  };
}

const host = document.querySelector("[data-grimoire-header]");
if (host) {
  mountGrimoireChat(db);
  const line = document.createElement("div");
  line.className = "grimoire-header-line";
  const label = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "section-kicker";
  kicker.textContent = "The Living Grimoire";
  const title = document.createElement("p");
  title.className = "text-xl font-semibold";
  const onAdminPage = host.dataset.grimoireHeader === "Apothecary Catalog" &&
    new URLSearchParams(location.search).get("manage") === "1";
  title.textContent = onAdminPage ? "Admin" : host.dataset.grimoireHeader;
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
        <button type="button" data-create-account class="grimoire-account-pill">Create account</button>
        <button type="button" class="btn btn-ghost rounded-full">Cancel</button>
      </div>
    </form>`;
  const form = dialog.querySelector("form");
  const feedback = form.querySelector('[role="status"]');
  const submit = form.querySelector('[type="submit"]');
  const createAccount = form.querySelector("[data-create-account]");
  const cancel = form.querySelector('button[type="button"]:not([data-create-account])');
  dialog.addEventListener("close", () => { form.reset(); feedback.textContent = ""; });
  signIn.onclick = () => dialog.showModal();
  cancel.onclick = () => dialog.close();
  dialog.addEventListener("cancel", event => { if (submit.disabled) event.preventDefault(); });
  form.onsubmit = async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const fields = new FormData(form);
    submit.disabled = cancel.disabled = createAccount.disabled = true;
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
    } finally { submit.disabled = cancel.disabled = createAccount.disabled = false; }
  };
  const signup = document.createElement("dialog");
  signup.className = dialog.className;
  signup.style.cssText = dialog.style.cssText;
  signup.setAttribute("aria-labelledby", "grimoire-signup-title");
  signup.innerHTML = `<h2 id="grimoire-signup-title" class="text-2xl">Create account</h2>
    <p class="mt-2">Verify your email before signing in.</p>
    <form class="space-y-4 mt-4">
      <label>Display name <input class="input input-bordered rounded-full w-full" name="display_name" autocomplete="nickname" required maxlength="100"></label>
      <label>Email <input class="input input-bordered rounded-full w-full" name="email" type="email" autocomplete="email" required maxlength="254"></label>
      <label>Password <input class="input input-bordered rounded-full w-full" name="password" type="password" autocomplete="new-password" required minlength="8"></label>
      <button type="submit" class="btn btn-primary rounded-full">Create account</button>
    </form>
    <p class="mt-4" role="status"></p>
    <button type="button" class="btn btn-ghost rounded-full mt-2">Back to sign in</button>`;
  const signupForm = signup.querySelector("form");
  const signupStatus = signup.querySelector('[role="status"]');
  const signupBusy = () => signupForm.querySelector('[type="submit"]').disabled;
  bindSignup(signupForm, signupStatus);
  createAccount.onclick = () => {
    dialog.close();
    signup.showModal();
  };
  signup.querySelector('[type="button"]').onclick = () => {
    if (signupBusy()) return;
    signup.close();
    dialog.showModal();
  };
  signup.addEventListener("cancel", event => { if (signupBusy()) event.preventDefault(); });
  signup.addEventListener("close", () => { signupForm.reset(); signupStatus.textContent = ""; });
  document.body.append(dialog, signup);
  const adminLink = document.createElement("a");
  adminLink.href = "/apothecary-catalog?manage=1";
  adminLink.className = "grimoire-account-pill";
  adminLink.textContent = "Admin";
  adminLink.title = "Open administration tools";
  adminLink.hidden = true;
  if (onAdminPage) adminLink.setAttribute("aria-current", "page");
  account.append(adminLink, profile, logout, signIn);
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
    adminLink.hidden = user?.app_metadata?.catalog_admin !== true;
    if (user && dialog.open) dialog.close();
    if (user && signup.open) signup.close();
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
