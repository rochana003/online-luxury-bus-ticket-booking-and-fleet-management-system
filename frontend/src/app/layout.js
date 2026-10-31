import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Luxury Bus Booking",
  description: "Luxury bus booking system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
