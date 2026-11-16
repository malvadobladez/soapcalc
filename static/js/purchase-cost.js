const purchaseUnits = {
  g: [1, "g"], kg: [1000, "g"], lb: [453.592, "g"], oz: [28.3495, "g"],
  ml: [1, "mL"], l: [1000, "mL"], "fl oz": [29.5735295625, "mL"],
  each: [1, "each"], unit: [1, "each"], piece: [1, "each"], pcs: [1, "each"]
};

function lookupUnit(value) {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  return Object.hasOwn(purchaseUnits, key) ? purchaseUnits[key] : null;
}

export function normalizedStockQuantity(quantity, unit) {
  if (quantity == null || quantity === "" || !Number.isFinite(Number(quantity))) return null;
  const measurement = lookupUnit(unit);
  return measurement
    ? { amount: Number(quantity) * measurement[0], group: measurement[1] }
    : { amount: Number(quantity), group: "other:" + String(unit ?? "").trim().toLowerCase() };
}

function roundCost(value) {
  // Match Python ties-to-even for exactly representable six-decimal half steps.
  const binarySteps = value * 128;
  if (Number.isSafeInteger(binarySteps) && binarySteps % 2 === 1) {
    const lower = Math.floor(value * 1e6);
    return (lower + lower % 2) / 1e6;
  }
  return Number(value.toFixed(6));
}

export function unitPrices(item) {
  const unit = lookupUnit(item.purchase_unit || "g");
  const quantity = Number(item.purchase_unit ? item.purchase_quantity : item.purchase_weight_grams);
  if (!unit || !Number.isFinite(quantity) || quantity <= 0 || item.purchase_total_cost == null || item.purchase_total_cost === "") return null;
  const [factor, base] = unit;
  const total = Number(item.purchase_total_cost);
  if (!Number.isFinite(total) || total < 0) return null;
  const cost = roundCost(total / (quantity * factor));
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

export function costForAmount(item, amount, amountUnit) {
  if (item.purchase_total_cost == null || item.purchase_total_cost === "") {
    return { cost: null, reason: "missing_purchase_cost" };
  }
  const price = unitPrices(item);
  if (!price) return { cost: null, reason: "invalid_purchase_details" };

  const source = lookupUnit(amountUnit);
  const quantity = Number(amount);
  if (amount == null || amount === "" || !Number.isFinite(quantity) || quantity < 0) {
    return { cost: null, reason: "invalid_recipe_amount" };
  }
  if (!source) return { cost: null, reason: "incompatible_units" };

  const [factor, base] = source;
  let converted = quantity * factor;
  if (base !== price.base) {
    if (base === "each" || price.base === "each") {
      return { cost: null, reason: "incompatible_units" };
    }
    const density = Number(item.master_items?.density_g_per_ml);
    if (!Number.isFinite(density) || density <= 0) {
      return { cost: null, reason: "missing_density" };
    }
    converted = base === "g" ? converted / density : converted * density;
  }

  // Brenda rounds the purchase base price, then the extended line price.
  const cost = converted * price.cost;
  return Number.isFinite(cost)
    ? { cost: roundCost(cost), reason: null }
    : { cost: null, reason: "invalid_recipe_amount" };
}
