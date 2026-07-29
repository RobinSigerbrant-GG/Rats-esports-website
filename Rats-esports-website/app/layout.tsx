import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RATS Esports | Swedish Grassroots Esports",
  description:
    "RATS Esports is a Swedish grassroots esports association built around competition, development, and community.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
