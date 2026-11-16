const purchaseUnits = {
  g: [1, "g"], kg: [1000, "g"], lb: [453.592, "g"], oz: [28.3495, "g"],
  ml: [1, "mL"], l: [1000, "mL"], "fl oz": [29.5735295625, "mL"],
  each: [1, "each"], unit: [1, "each"], piece: [1, "each"], pcs: [1, "each"]
};

export function unitPrices(item) {
  const unit = item.purchase_unit ? purchaseUnits[item.purchase_unit] : purchaseUnits.g;
  const quantity = Number(item.purchase_unit ? item.purchase_quantity : item.purchase_weight_grams);
  if (!unit || !(quantity > 0) || item.purchase_total_cost == null || item.purchase_total_cost === "") return null;
  const [factor, base] = unit;
  const cost = Number((Number(item.purchase_total_cost) / (quantity * factor)).toFixed(6));
  const density = Number(item.master_items?.density_g_per_ml);
  const perMl = base === "mL" ? cost : base === "g" && density > 0 ? Number((cost * density).toFixed(6)) : null;
  const perGram = base === "g" ? cost : base === "mL" && density > 0 ? Number((cost / density).toFixed(6)) : null;
  return { cost, base, perGram, perMl, retail: cost * (1 + Number(item.markup_percent ?? 0) / 100) };
}

export const purchaseUnitLabels = {
  g: "Grams (g)", kg: "Kilograms (kg)", lb: "Pounds (lb)", oz: "Ounces by weight (oz)",
  ml: "Millilitres (mL)", l: "Litres (L)", "fl oz": "US fluid ounces (fl oz)",
  each: "Each", unit: "Unit", piece: "Piece", pcs: "Pieces (pcs)"
};

export function purchaseCostSummary(item) {
  const price = unitPrices(item);
  if (!price) return "Enter the total purchase cost, amount and unit to see unit pricing.";
  const primary = "Cost " + price.cost.toFixed(6) + " / " + price.base;
  if (price.base === "each") return primary;
  const equivalent = price.base === "g" ? price.perMl : price.perGram;
  const unit = price.base === "g" ? "mL" : "g";
  return primary + (equivalent == null
    ? " · Cost per " + unit + " requires ingredient density."
    : " · " + equivalent.toFixed(6) + " / " + unit);
}
