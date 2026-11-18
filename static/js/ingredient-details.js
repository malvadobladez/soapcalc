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
  const conciseSafety = {
    drug_interactions: ["None reported in the EMA monograph for oral artichoke-leaf medicinal preparations.", "None reported"],
    pregnancy_lactation_notes: ["EMA oral preparations: avoid during pregnancy and breastfeeding. Safety data are insufficient.", "Avoid during pregnancy and breastfeeding"]
  };
  for (const [field, [stored, display]] of Object.entries(conciseSafety)) {
    if (d[field] === stored) d[field] = display;
  }
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
      if (name === "Allergen flags" && !/^(?:none(?: reported| known)?|unknown|n\/a|no)$/i.test(formatted.trim())) {
        line.classList.add("text-danger-inline");
      }
      line.append(element("strong", name + ": "), document.createTextNode(formatted));
      const sourceField = { "Drug interactions": "drug_interactions", "Pregnancy/lactation": "pregnancy_lactation_notes" }[name];
      const source = sourceField && metadata?.reference_sources?.[sourceField];
      if (typeof source?.url === "string" && source.url.startsWith("https://www.ema.europa.eu/")) {
        const link = element("a", "Reference");
        link.href = source.url;
        link.className = "underline text-sm";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.title = String(metadata[sourceField] ?? "");
        line.append(document.createTextNode(" · "), link);
      }
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
    return group;
  }
  block(left, [
    ["Common names", d.common_names], ["Scientific name", d.scientific_name], ["Part used", d.part_used], ["Good for", d.therapeutic_tags],
    ["Taste profile", d.taste_profile], ["Caffeine level", d.caffeine_level], ["Skin feel", d.skin_feel],
    ["Allergen flags", d.allergen_flags], ["Drug interactions", d.drug_interactions],
    ["Use flags", join(label("Skin-safe", d.skin_safe), label("Lip-safe", d.lip_safe), label("Food grade", d.food_grade))]
  ]);
  const density = join(label("source:", d.density_source), label("confidence:", d.density_confidence));
  const usage = block(left, [
    ["SAP values", join(label("NaOH", d.sap_naoh), label("KOH", d.sap_koh))],
    ["SAP source", d.sap_source],
    ["Fatty acids %", acids.map(name => label(name, percent(d["fa_" + name.toLowerCase()]))).filter(Boolean).join(", ")],
    ["Iodine value", d.iodine_value], ["Usage range", [percent(d.usage_rate_min), percent(d.usage_rate_max)].filter(Boolean).join("–")],
    ["Density (g/mL)", format(d.density_g_per_ml) && format(d.density_g_per_ml) + (density ? " (" + density + ")" : "")],
    ["Usage context", d.usage_context]
  ]);
  block(right, [
    ["Traditional use", d.traditional_use], ["Safety notes", d.safety_notes], ["Contraindications", d.contraindications],
    ["Regulatory notes", d.regulatory_notes], ["Pregnancy/lactation", d.pregnancy_lactation_notes],
    ["Notes", d.notes]
  ]);
  block(right, [["Colorant profile", d.colorant_profile], ["Colorant source", d.colorant_profile_source_url]]);
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
    const url = new URL(metadata?.supplier_url ?? d.supplier_url);
    if (url.protocol === "https:" && !url.username && !url.password) productUrl = url;
  } catch {}
  const supplierHost = productUrl?.hostname.replace(/^www\./, "");
  const sourceHost = Object.keys(suppliers).find(host => host.split(".")[0] === String(d.source ?? "").toLowerCase());
  const host = Object.hasOwn(suppliers, supplierHost) ? supplierHost : sourceHost;
  function supplierLink(label, href, name) {
    const line = element("p", "");
    const link = element("a", name);
    link.href = href;
    link.className = "underline";
    link.style.overflowWrap = "anywhere";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    line.append(element("strong", label + ": "), link);
    usage.append(line);
  }
  if (host) supplierLink("Supplier", "https://" + host, suppliers[host]);
  if (productUrl) supplierLink("Vendor URL", productUrl.href, productUrl.href);
  if (usage.childElementCount && !usage.parentNode) left.append(usage);
  if (left.childElementCount) grid.append(left);
  if (right.childElementCount) grid.append(right);
  if (grid.childElementCount === 1) grid.style.gridTemplateColumns = "1fr";
  if (grid.childElementCount) panel.append(grid);
  if (footer.childElementCount) panel.append(footer);
  const { data: account } = await db.auth.getUser();
  if (!panel.isConnected || account.user?.app_metadata?.catalog_admin !== true ||
      account.user?.user_metadata?.show_all_metadata !== true) return;
  const allFields = document.createElement("details");
  allFields.open = true;
  allFields.append(element("summary", "All metadata fields"));
  const table = document.createElement("table");
  table.className = "table table-sm w-full";
  for (const [key, value] of Object.entries(d).sort(([a], [b]) => a.localeCompare(b))) {
    const row = document.createElement("tr");
    const heading = element("th", key.replaceAll("_", " "));
    heading.scope = "row";
    const cell = element("td", value == null || value === "" ? "—" :
      typeof value === "object" ? JSON.stringify(value, null, 2) : String(value));
    cell.style.whiteSpace = "pre-wrap";
    cell.style.overflowWrap = "anywhere";
    row.append(heading, cell);
    table.append(row);
  }
  allFields.append(table);
  panel.append(allFields);
}
