import type { Metadata, Viewport } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://musicadodiaapp.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Música do Dia — Adivinhe a música pela letra",
    template: "%s | Música do Dia",
  },
  description:
    "Desafio diário de adivinhar a música brasileira ou internacional pelos trechos da letra em até 4 tentativas. Um novo desafio todo dia!",
  applicationName: "Música do Dia",
  keywords: [
    "música do dia",
    "jogo de música",
    "adivinhe a música",
    "letra de música",
    "wordle de música",
    "lyricle",
    "quiz musical diário",
  ],
  authors: [{ name: "Música do Dia" }],
  creator: "Música do Dia",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Música do Dia",
    title: "🎵 Música do Dia — Adivinhe a música pela letra",
    description:
      "Você consegue descobrir qual é a música de hoje pelos trechos da letra em até 4 tentativas? Jogue agora e compartilhe seu resultado!",
  },
  twitter: {
    card: "summary_large_image",
    title: "🎵 Música do Dia — Adivinhe a música pela letra",
    description:
      "Você consegue descobrir qual é a música de hoje pelos trechos da letra em até 4 tentativas? Jogue agora!",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${merriweather.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
