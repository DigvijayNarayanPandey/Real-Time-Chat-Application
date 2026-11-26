const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toValidDate(dateInput) {
  if (!dateInput) return null;
  const parsed = dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Returns local calendar midnight for the given date so day diffs are DST-safe.
 */
export function getLocalDayStart(dateInput) {
  const date = toValidDate(dateInput);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Returns a deterministic YYYY-MM-DD key in the user's local timezone.
 */
export function getLocalDateKey(dateInput) {
  const date = toValidDate(dateInput);
  if (!date) return "unknown";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats chat day separators consistently like WhatsApp:
 * Today, Yesterday, Weekday (within last 6 days), or DD/MM/YYYY.
 */
export function formatDateHeader(dateInput, referenceNow = new Date()) {
  const msgDate = toValidDate(dateInput);
  const msgDayStart = getLocalDayStart(msgDate);
  const todayStart = getLocalDayStart(referenceNow);

  if (!msgDate || !msgDayStart || !todayStart) return "";

  const diffDays = Math.round((todayStart.getTime() - msgDayStart.getTime()) / MS_PER_DAY);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays < 7) {
    return msgDate.toLocaleDateString(undefined, { weekday: "long" });
  }

  return msgDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formats message timestamps consistently as HH:MM.
 */
export function formatMessageTime(dateInput) {
  const date = toValidDate(dateInput);
  if (!date) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
