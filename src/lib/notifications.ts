import type { PersonalCalendarEvent } from "@/lib/personal-calendar";

export type NotificationKind = "new_episode" | "season_premiere";

export type FilmTrackNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  eventDate: string;
  href: string;
  titleId: number;
  seasonNumber: number;
  episodeNumber: number;
};

export type NotificationDeliveryAdapter = {
  deliver(items: FilmTrackNotification[]): Promise<void>;
};

export function buildNotificationInbox(events: PersonalCalendarEvent[]) {
  const unique = new Map<string, FilmTrackNotification>();
  for (const event of events) {
    if (!event.airDate || event.seasonNumber <= 0 || event.episodeNumber <= 0) continue;
    const kind: NotificationKind = event.episodeNumber === 1 ? "season_premiere" : "new_episode";
    const id = `${kind}:${event.titleId}:${event.seasonNumber}:${event.episodeNumber}:${event.airDate}`;
    if (unique.has(id)) continue;
    unique.set(id, {
      id,
      kind,
      title: kind === "season_premiere" ? `فصل جدید ${event.titleName}` : `قسمت جدید ${event.titleName}`,
      description: kind === "season_premiere"
        ? `فصل ${event.seasonNumber} با قسمت ${event.episodeNumber} در راه است.`
        : `فصل ${event.seasonNumber} · قسمت ${event.episodeNumber}${event.episodeName ? ` · ${event.episodeName}` : ""}`,
      eventDate: event.airDate,
      href: event.href,
      titleId: event.titleId,
      seasonNumber: event.seasonNumber,
      episodeNumber: event.episodeNumber,
    });
  }
  return [...unique.values()].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}
