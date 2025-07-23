import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Poppins,  Cedarville_Cursive} from 'next/font/google';
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'], 
  subsets: ['latin'], 
  variable: '--font-poppins',
});

const cedarville_cursive = Cedarville_Cursive({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cedarville',
});


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Melt & Whirl Bakery',
  description: 'Your favorite bakery items!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
   return (
    <html lang="en" className={`${poppins.variable} ${cedarville_cursive.variable}`}>
      <body
        className={`${(global as any).geistSans?.variable || ''} ${(global as any).geistMono?.variable || ''} antialiased`}
      >
       <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );

}
