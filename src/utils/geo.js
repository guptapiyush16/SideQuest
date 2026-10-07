// Small geo + date helpers.

/** Distance between two {latitude, longitude} points in km (haversine). */
export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Local YYYY-MM-DD key. */
export function dayKey(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${m}-${day}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));

export function prettyDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 864e5));
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return `${MONTHS[m - 1]} ${d}`;
}

export function shortDate(ts) {
  const d = new Date(ts);
  return `${SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Night owl';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
