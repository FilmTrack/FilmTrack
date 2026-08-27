import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazirmatn",
});

const siteUrl = "https://www.filmtrack.ir";
const siteTitle = "FilmTrack | ردیاب فارسی فیلم و سریال";
const siteDescription =
  "فیلم‌ها و سریال‌هایت را در FilmTrack کشف و ردیابی کن، وضعیت تماشا را ثبت کن و فهرست و تاریخچه شخصی خودت را بساز.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "FilmTrack",
  title: {
    default: siteTitle,
    template: "%s | FilmTrack",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "FilmTrack", url: "https://github.com/FilmTrack" }],
  creator: "FilmTrack",
  publisher: "FilmTrack",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    locale: "fa_IR",
    siteName: "FilmTrack",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FilmTrack",
  },
};

export const viewport = {
  themeColor: "#0e0e0e",
  width: "device-width",
  initialScale: 1,
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FilmTrack",
    url: siteUrl,
    inLanguage: "fa-IR",
    description: siteDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FilmTrack",
    url: siteUrl,
    logo: `${siteUrl}/brand/filmtrack-play.svg`,
    sameAs: ["https://github.com/FilmTrack"],
    founder: {
      "@type": "Person",
      name: "امیر متفکر",
      url: "https://amirmotefaker.ir",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body
        suppressHydrationWarning
        className={`${vazirmatn.className} min-h-screen bg-[#0e0e0e] antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
