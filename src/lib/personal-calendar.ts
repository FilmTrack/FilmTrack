export type PersonalCalendarEvent = {
  titleId: number;
  titleName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName?: string;
  airDate: string;
  href: string;
};

export type PersonalCalendarGroups = {
  today: PersonalCalendarEvent[];
  thisWeek: PersonalCalendarEvent[];
  later: PersonalCalendarEvent[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOnlyToUtc(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function tehranDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function groupPersonalCalendar(
  events: PersonalCalendarEvent[],
  todayKey = tehranDateKey(),
): PersonalCalendarGroups {
  const todayUtc = dateOnlyToUtc(todayKey);
  if (todayUtc === null) return { today: [], thisWeek: [], later: [] };

  const groups: PersonalCalendarGroups = { today: [], thisWeek: [], later: [] };

  for (const event of [...events].sort((a, b) => a.airDate.localeCompare(b.airDate))) {
    const eventUtc = dateOnlyToUtc(event.airDate);
    if (eventUtc === null || eventUtc < todayUtc) continue;
    const daysAway = Math.floor((eventUtc - todayUtc) / DAY_MS);
    if (daysAway === 0) groups.today.push(event);
    else if (daysAway <= 7) groups.thisWeek.push(event);
    else groups.later.push(event);
  }

  return groups;
}

export function formatPersianCalendarDate(date: string) {
  const utc = dateOnlyToUtc(date);
  if (utc === null) return date;
  return new Intl.DateTimeFormat("fa-IR", {
    calendar: "persian",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(utc + 12 * 60 * 60 * 1000));
}
