export interface CalendarEventInput {
  id: string;
  title: string;
  description?: string;
  startsAt: string | Date;
  endsAt: string | Date;
  location?: string;
  url?: string;
  now?: Date;
}

export function formatIcsUtcDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid calendar date');
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}Z`
  );
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const chunks: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const charBytes = new TextEncoder().encode(char).length;
    const limit = chunks.length === 0 ? 75 : 74;
    if (currentBytes + charBytes > limit && current.length > 0) {
      chunks.push(current);
      current = char;
      currentBytes = charBytes;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }
  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks.join('\r\n ');
}

export function buildEventIcs(event: CalendarEventInput): string {
  const dtStamp = formatIcsUtcDate(event.now ?? new Date());
  const dtStart = formatIcsUtcDate(event.startsAt);
  const dtEnd = formatIcsUtcDate(event.endsAt);

  const descriptionParts: string[] = [];
  if (event.description?.trim()) {
    descriptionParts.push(event.description.trim());
  }
  if (event.url?.trim()) {
    descriptionParts.push(`Chi tiết sự kiện: ${event.url.trim()}`);
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TixFlow//Event Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(event.id)}@tixflow.vn`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join('\n\n'))}`);
  }
  if (event.location?.trim()) {
    lines.push(`LOCATION:${escapeIcsText(event.location.trim())}`);
  }
  if (event.url?.trim()) {
    lines.push(`URL:${event.url.trim()}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatIcsUtcDate(event.startsAt)}/${formatIcsUtcDate(event.endsAt)}`,
  });

  const detailsParts: string[] = [];
  if (event.description?.trim()) {
    detailsParts.push(event.description.trim());
  }
  if (event.url?.trim()) {
    detailsParts.push(event.url.trim());
  }
  if (detailsParts.length > 0) {
    params.set('details', detailsParts.join('\n\n'));
  }
  if (event.location?.trim()) {
    params.set('location', event.location.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadEventIcs(event: CalendarEventInput, filename: string): void {
  const content = buildEventIcs(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
