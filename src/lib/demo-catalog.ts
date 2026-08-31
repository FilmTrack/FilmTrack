import type { TmdbMediaSummary } from "@/lib/tmdb";

export const isLocalVisualQa = process.env.NODE_ENV !== "production";

export const demoMovies: TmdbMediaSummary[] = [
  { id: 550, title: "باشگاه مشت‌زنی", poster_path: null, backdrop_path: null, vote_average: 8.4, release_date: "1999-10-15" },
  { id: 155, title: "شوالیه تاریکی", poster_path: null, backdrop_path: null, vote_average: 8.5, release_date: "2008-07-18" },
  { id: 27205, title: "تلقین", poster_path: null, backdrop_path: null, vote_average: 8.4, release_date: "2010-07-16" },
  { id: 157336, title: "میان‌ستاره‌ای", poster_path: null, backdrop_path: null, vote_average: 8.5, release_date: "2014-11-07" },
  { id: 680, title: "داستان عامه‌پسند", poster_path: null, backdrop_path: null, vote_average: 8.5, release_date: "1994-10-14" },
  { id: 13, title: "فارست گامپ", poster_path: null, backdrop_path: null, vote_average: 8.5, release_date: "1994-07-06" },
  { id: 603, title: "ماتریکس", poster_path: null, backdrop_path: null, vote_average: 8.2, release_date: "1999-03-31" },
  { id: 238, title: "پدرخوانده", poster_path: null, backdrop_path: null, vote_average: 8.7, release_date: "1972-03-24" },
  { id: 429, title: "خوب، بد، زشت", poster_path: null, backdrop_path: null, vote_average: 8.5, release_date: "1966-12-23" },
  { id: 424, title: "فهرست شیندلر", poster_path: null, backdrop_path: null, vote_average: 8.6, release_date: "1993-12-15" },
  { id: 122, title: "بازگشت پادشاه", poster_path: null, backdrop_path: null, vote_average: 8.5, release_date: "2003-12-17" },
  { id: 807, title: "هفت", poster_path: null, backdrop_path: null, vote_average: 8.4, release_date: "1995-09-22" },
];

export const demoShows: TmdbMediaSummary[] = [
  { id: 1396, name: "بریکینگ بد", poster_path: null, backdrop_path: null, vote_average: 8.9, first_air_date: "2008-01-20" },
  { id: 1399, name: "بازی تاج‌وتخت", poster_path: null, backdrop_path: null, vote_average: 8.5, first_air_date: "2011-04-17" },
  { id: 66732, name: "چیزهای عجیب", poster_path: null, backdrop_path: null, vote_average: 8.6, first_air_date: "2016-07-15" },
  { id: 60059, name: "بهتره با ساول تماس بگیری", poster_path: null, backdrop_path: null, vote_average: 8.7, first_air_date: "2015-02-08" },
  { id: 94605, name: "آرکین", poster_path: null, backdrop_path: null, vote_average: 8.8, first_air_date: "2021-11-06" },
  { id: 71912, name: "ویچر", poster_path: null, backdrop_path: null, vote_average: 8.0, first_air_date: "2019-12-20" },
  { id: 60625, name: "ریک و مورتی", poster_path: null, backdrop_path: null, vote_average: 8.7, first_air_date: "2013-12-02" },
  { id: 1402, name: "مردگان متحرک", poster_path: null, backdrop_path: null, vote_average: 8.1, first_air_date: "2010-10-31" },
  { id: 87108, name: "چرنوبیل", poster_path: null, backdrop_path: null, vote_average: 8.7, first_air_date: "2019-05-06" },
  { id: 19885, name: "شرلوک", poster_path: null, backdrop_path: null, vote_average: 8.5, first_air_date: "2010-07-25" },
  { id: 76479, name: "پسرها", poster_path: null, backdrop_path: null, vote_average: 8.4, first_air_date: "2019-07-25" },
  { id: 94997, name: "خانه اژدها", poster_path: null, backdrop_path: null, vote_average: 8.3, first_air_date: "2022-08-21" },
];

export function demoCalendarItems(): Array<TmdbMediaSummary & { type: "movie" | "tv"; date: string }> {
  const base = new Date();
  const addDays = (days: number) => {
    const date = new Date(base);
    date.setDate(base.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  return [
    { ...demoMovies[0], type: "movie", date: addDays(1), release_date: addDays(1) },
    { ...demoShows[0], type: "tv", date: addDays(2), first_air_date: addDays(2) },
    { ...demoMovies[1], type: "movie", date: addDays(3), release_date: addDays(3) },
    { ...demoShows[1], type: "tv", date: addDays(4), first_air_date: addDays(4) },
    { ...demoMovies[2], type: "movie", date: addDays(5), release_date: addDays(5) },
    { ...demoShows[2], type: "tv", date: addDays(6), first_air_date: addDays(6) },
  ];
}
