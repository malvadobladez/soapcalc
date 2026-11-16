import { db } from "./grimoire-account.js?v=floating-chat-1";

export async function readPages(table, fields, order) {
  const rows = [];
  const chunk = 250;
  for (let offset = 0; ; offset += chunk) {
    const { data, error } = await db.from(table).select(fields).order(order).range(offset, offset + chunk - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < chunk) return rows;
  }
}
