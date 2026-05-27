export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function toMoney(value) {
  return currencyFormatter.format(roundMoney(value || 0));
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

export function getTicketCount(value) {
  const count = Math.trunc(toNumber(value));
  return count > 0 ? count : 0;
}

export function getMoneyInput(value) {
  const amount = toNumber(value);
  return amount >= 0 ? amount : 0;
}

export function splitWinnerNames(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
