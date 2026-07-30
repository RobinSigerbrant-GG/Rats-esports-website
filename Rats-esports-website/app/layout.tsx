import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RATS Esports | Svensk League of Legends-förening",
  description:
    "RATS är en svensk esportförening inom League of Legends, byggd kring gemenskap, utveckling och tävling.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
