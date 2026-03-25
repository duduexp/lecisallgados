import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leci Salgados - Salgados Fresquinhos para Sua Festa!",
  description: "Coxinha, risole, pastel, kibe e muito mais! Salgados artesanais feitos com carinho e ingredientes de qualidade. Peça com antecedência e surpreenda seus convidados.",
  keywords: ["Leci Salgados", "salgados", "coxinha", "risole", "pastel", "kibe", "festa", "Igarapé", "Minas Gerais", "salgados para festa"],
  authors: [{ name: "Leci Salgados" }],
  icons: {
    icon: "/images/logo-leci.png",
  },
  openGraph: {
    title: "Leci Salgados - Salgados Fresquinhos para Sua Festa!",
    description: "Salgados artesanais feitos com carinho para sua festa ou comércio",
    url: "https://lecisalgados.com",
    siteName: "Leci Salgados",
    type: "website",
    images: ["/images/logo-leci.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leci Salgados - Salgados Fresquinhos para Sua Festa!",
    description: "Salgados artesanais feitos com carinho para sua festa ou comércio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
