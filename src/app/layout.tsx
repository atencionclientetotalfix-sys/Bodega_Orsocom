import type { Metadata } from "next";
import "../styles/globals.css";
import { AppLayout } from "@/components/AppLayout";
import { Toaster } from 'sonner';

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
        <Toaster richColors position="top-right" theme="dark" />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
