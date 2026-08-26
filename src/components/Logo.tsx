import Link from "next/link";

function FilmTrackMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="h-10 w-10 drop-shadow-[0_0_14px_rgba(59,130,246,0.35)]"
      fill="none"
    >
      <defs>
        <linearGradient id="filmtrack-logo-gradient" x1="9" y1="8" x2="54" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00D1FF" />
          <stop offset="0.52" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M20 11.1C15.9 8.8 11 11.7 11 16.4v31.2c0 4.7 4.9 7.6 9 5.3l26.5-15c4.2-2.3 4.2-8.3 0-10.7L20 11.1Z"
        stroke="url(#filmtrack-logo-gradient)"
        strokeWidth="4.25"
        strokeLinejoin="round"
      />
      <path
        d="M26 22.7c-2.2-1.3-5 .3-5 2.9v13c0 2.6 2.8 4.2 5 2.9l11.3-6.5c2.2-1.3 2.2-4.4 0-5.7L26 22.7Z"
        fill="url(#filmtrack-logo-gradient)"
      />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label="FilmTrack">
      <span className="transition-transform duration-200 group-hover:scale-105">
        <FilmTrackMark />
      </span>
      <span className="hidden text-2xl font-extrabold tracking-tight text-white sm:block">
        FilmTrack
      </span>
    </Link>
  );
}
