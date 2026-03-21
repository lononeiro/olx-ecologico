import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// next/font faz self-host automático, sem requisição externa bloqueante
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReciclaFácil — Sistema de Coleta de Recicláveis",
  description: "Conectando cidadãos e empresas de reciclagem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${playfair.variable}`}>
      <body style={{ fontFamily: "var(--font)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}