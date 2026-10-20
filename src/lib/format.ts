const egp = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function money(value: number | string) {
  return `${egp.format(Number(value))} EGP`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Cairo",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Africa/Cairo",
});

export function formatDate(value: string) {
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: string) {
  return dateTimeFmt.format(new Date(value));
}

// Egyptian numbers are stored as 01XXXXXXXXX; WhatsApp wants 201XXXXXXXXX.
export function whatsappLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "20");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
