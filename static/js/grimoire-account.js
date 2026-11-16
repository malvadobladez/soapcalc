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
  account.append(profile, logout);
  line.append(label, account);
  host.prepend(line, status);

  db.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    const metadata = user?.user_metadata ?? {};
    const name = [metadata.display_name, metadata.full_name, metadata.name]
      .find(value => typeof value === "string" && value.trim());
    profile.textContent = user ? name?.trim() || user.email || "Signed in" : "";
    account.hidden = !user;
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
