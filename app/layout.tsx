import type { Metadata } from "next";
import { Geist, Geist_Mono, Maven_Pro } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { DataProvider } from "@/Providers/DataProvider";



const mavenPro = Maven_Pro({
  variable: "--font-maven-pro",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Protótipo Coletor",
  description: "",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-br"
      className={`${mavenPro.className} h-full antialiased `}
    >
      <body className="min-h-full flex flex-col">
        <DataProvider>
          <Navbar />

          {children}
        </DataProvider>
      </body>
    </html>
  );
}
