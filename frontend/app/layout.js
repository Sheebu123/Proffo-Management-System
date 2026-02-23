import "./globals.css";

export const metadata = {
  title: "SmartSalon",
  description: "SmartSalon appointment and payment management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
