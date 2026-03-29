import type { Metadata } from "next";
import "../styles/globals.css";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Orsocom Cloud | WMS Eléctrico",
  description: "Sistema de Gestión de Bodega de Alta Complejidad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
