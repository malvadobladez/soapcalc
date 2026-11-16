const links = [
  ["/", "The Grimoire", "Return to The Grimoire homepage"],
  ["/my-apothecary", "My Apothecary", "Open your personal inventory and purchase costs"],
  ["/apothecary-catalog", "Apothecary Catalog", "Browse the Apothecary Catalog"],
  ["/#leaves", "Tea Recipes", "See the Tea Recipes preview"],
  ["/#calculus", "Soap Calculator", "See the Soap Calculator preview"]
];

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
