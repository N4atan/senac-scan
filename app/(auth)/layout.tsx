
import type { Metadata } from "next";
import { Maven_Pro } from "next/font/google";
import "../globals.css";
import { Toaster } from "react-hot-toast";

const mavenPro = Maven_Pro({
  variable: "--font-maven-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SenacScan - Autenticação",
  description: "Gerenciamento de bens patrimoniais do SENAC",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-br"
      className={`${mavenPro.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
