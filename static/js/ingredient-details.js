import { db } from "/static/js/grimoire-account.js?v=floating-chat-1";

const element = (tag, value) => { const item = document.createElement(tag); item.textContent = value; return item; };

export async function viewItem(item, panel) {
  panel.textContent = "Loading item details…";
  const { data, error } = await db.from("master_items").select("*").eq("id", item.id).single();
  if (!panel.isConnected) return;
  if (error) { panel.textContent = "Could not load item details."; return; }
  panel.replaceChildren();
  const { metadata, ...core } = data;
  const d = { ...metadata, ...core };
  const format = value => {
    if (value == null || (typeof value === "string" && !value.trim())) return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.map(format).filter(Boolean).join(", ");
    if (typeof value === "object") return Object.entries(value).map(([key, entry]) => label(key.replaceAll("_", " "), entry)).filter(Boolean).join(" · ");
    return String(value);
  };
  const label = (name, value) => {
    const formatted = format(value);
    return formatted === "" ? "" : name + " " + formatted;
  };
  const append = (parent, tag, fields) => {
    for (const [name, value] of fields) {
      const formatted = format(value);
      if (formatted === "") continue;
      const line = document.createElement(tag);
      line.append(element("strong", name + ": "), document.createTextNode(formatted));
      parent.append(line);
    }
  };
  const join = (...values) => values.filter(Boolean).join(" · ");
  const percent = value => format(value) === "" ? "" : format(value) + "%";
  const acids = ["Lauric", "Myristic", "Palmitic", "Stearic", "Ricinoleic", "Oleic", "Linoleic", "Linolenic"];
  const grid = document.createElement("div");
  grid.className = "compact-values";
  const left = document.createElement("div");
  const right = document.createElement("div");
  function block(column, fields) {
    const group = document.createElement("div");
    group.className = "compact-block";
    append(group, "p", fields);
    if (group.childElementCount) column.append(group);
  }
  block(left, [
    ["Common names", d.common_names], ["Scientific name", d.scientific_name], ["Good for", d.therapeutic_tags],
    ["Taste profile", d.taste_profile], ["Caffeine level", d.caffeine_level], ["Skin feel", d.skin_feel],
    ["Allergen flags", d.allergen_flags], ["Drug interactions", d.drug_interactions],
    ["Use flags", join(label("Skin-safe", d.skin_safe), label("Lip-safe", d.lip_safe), label("Food grade", d.food_grade))]
  ]);
  const density = join(label("source:", d.density_source), label("confidence:", d.density_confidence));
  block(left, [
    ["SAP values", join(label("NaOH", d.sap_naoh), label("KOH", d.sap_koh))],
    ["SAP source", d.sap_source],
    ["Fatty acids %", acids.map(name => label(name, percent(d["fa_" + name.toLowerCase()]))).filter(Boolean).join(", ")],
    ["Iodine value", d.iodine_value], ["Usage range", [percent(d.usage_rate_min), percent(d.usage_rate_max)].filter(Boolean).join("–")],
    ["Density (g/mL)", format(d.density_g_per_ml) && format(d.density_g_per_ml) + (density ? " (" + density + ")" : "")],
    ["Usage context", d.usage_context], ["Evidence tier", d.evidence_tier]
  ]);
  block(right, [
    ["Traditional use", d.traditional_use], ["Safety notes", d.safety_notes], ["Contraindications", d.contraindications],
    ["Regulatory notes", d.regulatory_notes], ["Pregnancy/lactation", d.pregnancy_lactation_notes],
    ["Confidence reason", d.confidence_reason], ["Notes", d.notes]
  ]);
  block(right, [["Colorant profile", d.colorant_profile], ["Colorant source", d.colorant_profile_source_url]]);
  if (left.childElementCount) grid.append(left);
  if (right.childElementCount) grid.append(right);
  if (grid.childElementCount === 1) grid.style.gridTemplateColumns = "1fr";
  const footer = document.createElement("div");
  footer.className = "compact-footer";
  const date = value => value?.slice(0, 10);
  append(footer, "span", [["Confidence", d.confidence], ["Source", d.source],
    ["Last refresh", date(d.metadata_updated_at)], ["Created", date(d.created_at)], ["ID", d.id]]);
  const suppliers = {
    "serenityuniverse.com": "Serenity Universe",
    "candorasoap.ca": "Candora Soap"
  };
  let productUrl;
  try {
    const url = new URL(d.supplier_url);
    if (url.protocol === "https:" && !url.username && !url.password) productUrl = url;
  } catch {}
  const supplierHost = productUrl?.hostname.replace(/^www\./, "");
  const sourceHost = Object.keys(suppliers).find(host => host.split(".")[0] === String(d.source ?? "").toLowerCase());
  const host = Object.hasOwn(suppliers, supplierHost) ? supplierHost : sourceHost;
  function supplierLink(label, href, name) {
    const line = element("span", "");
    const link = element("a", name);
    link.href = href;
    link.className = "underline";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    line.append(element("strong", label + ": "), link);
    footer.append(line);
  }
  if (host) supplierLink("Supplier", "https://" + host, suppliers[host]);
  if (productUrl) supplierLink("Product", productUrl.href, "View original supplier listing");
  if (grid.childElementCount) panel.append(grid);
  if (footer.childElementCount) panel.append(footer);
}
