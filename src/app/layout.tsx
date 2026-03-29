import type { Metadata } from "next";
import "../styles/globals.css";
import Sidebar from "@/components/Sidebar";

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
        <div className="layout-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
