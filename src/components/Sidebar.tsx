"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Box, 
  ChevronDown, 
  ChevronRight, 
  ClipboardList, 
  FileText, 
  Home, 
  Settings, 
  ShoppingCart, 
  Truck,
  Users,
  LayoutGrid,
  History,
  AlertTriangle,
  Building2,
  Briefcase
} from 'lucide-react';

interface SidebarItemProps {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: SidebarItemProps[];
  isExpanded?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, icon, href, children }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = children && children.length > 0;

  const toggle = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  const content = (
    <div className={`sidebar-item-container ${expanded ? 'expanded' : ''}`} onClick={toggle}>
      <div className="sidebar-link">
        <div className="sidebar-icon-label">
          {icon && <span className="icon">{icon}</span>}
          <span className="label">{label}</span>
        </div>
        {hasChildren && (
          <span className="chevron">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="sidebar-children">
          {children.map((child, idx) => (
            <SidebarItem key={idx} {...child} />
          ))}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

const Sidebar = () => {
  const navigation: SidebarItemProps[] = [
    { label: 'Escritorio', icon: <Home size={18} />, href: '/' },
    {
      label: 'Solicitudes de Pedido',
      icon: <ClipboardList size={18} />,
      children: [
        { label: 'Listar', href: '/solicitudes' },
        { label: 'Creadas', href: '/solicitudes/creadas' },
        { label: 'Aprobadas', href: '/solicitudes/aprobadas' },
        { label: 'Aprobadas sin gestión', href: '/solicitudes/aprobadas-sin-gestion' },
        { label: 'Parcialmente gestionadas', href: '/solicitudes/gestion-parcial' },
        { label: 'Totalmente gestionadas', href: '/solicitudes/gestion-total' },
        { label: 'Mi Aprobación', href: '/solicitudes/mi-aprobacion' },
        { label: 'Rechazadas', href: '/solicitudes/rechazadas' },
        { label: 'Anuladas', href: '/solicitudes/anuladas' },
      ],
    },
    {
      label: 'Órdenes de Compra',
      icon: <ShoppingCart size={18} />,
      children: [
        { label: 'Listar', href: '/compras' },
        { label: 'Creadas', href: '/compras/creadas' },
        { label: 'Aprobadas', href: '/compras/aprobadas' },
        { label: 'Rechazadas', href: '/compras/rechazadas' },
        { label: 'Mi Aprobación', href: '/compras/mi-aprobacion' },
        { label: 'Cerradas', href: '/compras/cerradas' },
      ],
    },
    {
      label: 'Recepciones',
      icon: <Truck size={18} />,
      href: '/recepciones'
    },
    {
      label: 'Bodega',
      icon: <Box size={18} />,
      children: [
        { label: 'Solicitud de Bodega', href: '/bodega/solicitud' },
        { label: 'Documento de despacho', href: '/bodega/despacho' },
        { label: 'Documento de recepción', href: '/bodega/recepcion' },
        { label: 'Parte de entrada', href: '/bodega/entrada' },
        { label: 'Documento de Ajuste', href: '/bodega/ajuste' },
      ],
    },
    {
      label: 'Reporte',
      icon: <FileText size={18} />,
      children: [
        { label: 'Informe Solicitud Pedido', href: '/reportes/solicitud' },
        { label: 'Informe Orden Compra', href: '/reportes/compra' },
        { label: 'Informe Recepción', href: '/reportes/recepcion' },
        { label: 'Informe Inventario', href: '/reportes/inventario' },
        { label: 'Informe Stock Crítico', href: '/reportes/stock-critico' },
        { label: 'Informe Trazabilidad', href: '/reportes/trazabilidad' },
      ],
    },
  ];

  const configItems: SidebarItemProps[] = [
    { label: 'Empresas', href: '/config/empresas', icon: <Building2 size={16} /> },
    { label: 'Unidades Organizacionales', href: '/config/unidades-org', icon: <LayoutGrid size={16} /> },
    { label: 'Usuarios', href: '/config/usuarios', icon: <Users size={16} /> },
    { label: 'Roles', href: '/config/roles', icon: <Settings size={16} /> },
    { label: 'Proyectos', href: '/config/proyectos', icon: <Briefcase size={16} /> },
    { label: 'Centros Costos', href: '/config/centros-costos', icon: <BarChart3 size={16} /> },
    { label: 'Unidades Medida', href: '/config/unidades-medida', icon: <History size={16} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Orsocom <span>Cloud</span></h1>
      </div>
      
      <div className="sidebar-scrollable">
        <div className="nav-section">
          {navigation.map((item, idx) => (
            <SidebarItem key={idx} {...item} />
          ))}
        </div>

        <div className="sidebar-divider" />
        
        <div className="nav-section config-section">
          <span className="section-title">CONFIGURACIONES</span>
          <SidebarItem 
            label="Configuraciones" 
            icon={<Settings size={18} />} 
            children={configItems} 
          />
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          background-color: var(--sidebar-bg);
          height: 100vh;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          color: #9198a1;
        }

        .sidebar-logo {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .sidebar-logo h1 {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .sidebar-logo h1 span {
          color: var(--accent);
        }

        .sidebar-scrollable {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem 0;
        }

        .nav-section {
          padding: 0 1rem;
        }

        .sidebar-divider {
          height: 1px;
          background-color: var(--border);
          margin: 1rem 0;
        }

        .section-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: #7d8590;
          padding: 0 0.75rem 0.5rem;
          display: block;
        }

        :global(.sidebar-item-container) {
          margin-bottom: 2px;
        }

        :global(.sidebar-link) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        :global(.sidebar-link:hover) {
          background-color: var(--sidebar-hover);
          color: white;
        }

        :global(.sidebar-icon-label) {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        :global(.label) {
          font-size: 0.875rem;
          font-weight: 500;
        }

        :global(.sidebar-children) {
          padding-left: 1.25rem;
          margin-top: 2px;
          border-left: 1px solid var(--border);
          margin-left: 1.25rem;
        }

        :global(.icon) {
          display: flex;
          align-items: center;
          color: var(--accent);
        }

        :global(.expanded .sidebar-link) {
          color: white;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
