const links = [
  ["/", "The Grimoire", "Return to The Grimoire homepage"],
  ["/my-apothecary", "My Apothecary", "Open your personal inventory and purchase costs"],
  ["/apothecary-catalog", "Apothecary Catalog", "Browse the Apothecary Catalog"],
  ["/#leaves", "Tea Recipes", "See the Tea Recipes preview"],
  ["/#calculus", "Soap Calculator", "See the Soap Calculator preview"]
];

for (const sidebar of document.querySelectorAll("[data-grimoire-sidebar]")) {
  sidebar.innerHTML = `
      <div class="sidebar-brand">
        <img class="sidebar-brand-logo grimoire-logo" src="/static/img/brand/site-logo.jpg" width="400" height="400" alt="">
        <p class="section-kicker">The Hidden Grimoire</p>
      </div>
      <nav class="grimoire-nav grimoire-sidebar-nav py-4" aria-label="Workspace" data-grimoire-nav></nav>
      <div class="sidebar-art-shell">
        <img class="sidebar-art-image" src="/static/img/brand/sidebar-art.jpg" width="400" height="400" alt="" decoding="async">
      </div>
  `;
  sidebar.querySelector("[data-grimoire-nav]").dataset.grimoireNav = sidebar.dataset.grimoireSidebar;
}

for (const menu of document.querySelectorAll("[data-grimoire-nav]")) {
  for (const [href, label, title] of links) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    link.title = title;
    if (menu.dataset.linkClass) link.className = menu.dataset.linkClass;
    if (href === menu.dataset.grimoireNav) link.setAttribute("aria-current", "page");
    menu.append(link);
  }
}
