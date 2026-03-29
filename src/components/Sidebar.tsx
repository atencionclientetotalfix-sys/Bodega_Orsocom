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
  Building2,
  Briefcase,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

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
  const { profile, signOut } = useAuth();
  const role = profile?.role || 'USER';

  // Navigation Items
  const navBase: SidebarItemProps[] = [
    { label: 'Escritorio', icon: <Home size={18} />, href: '/' },
  ];

  const navUser: SidebarItemProps[] = [
    { label: 'Nueva Solicitud', icon: <ShoppingCart size={18} />, href: '/bodega/solicitud' },
    { label: 'Mis Pedidos', icon: <History size={18} />, href: '/solicitudes/mis-pedidos' },
  ];

  const navSupervisor: SidebarItemProps[] = [
    {
      label: 'Gestión Solicitudes',
      icon: <ClipboardList size={18} />,
      children: [
        { label: 'Aprobaciones Pendientes', href: '/solicitudes/pendientes' },
        { label: 'Historial', href: '/solicitudes/historial' }
      ]
    }
  ];

  const navBodega: SidebarItemProps[] = [
    {
      label: 'Bodega Central',
      icon: <Box size={18} />,
      children: [
        { label: 'Gestión Despachos', href: '/bodega/gestion-solicitudes' },
        { label: 'Maestro de SKU', href: '/inventory' },
        { label: 'Documento de despacho', href: '/bodega/despacho' },
        { label: 'Documento de recepción', href: '/bodega/recepcion' },
        { label: 'Ajuste Stock', href: '/bodega/ajuste' },
      ],
    },
    {
      label: 'Recepciones/OC',
      icon: <Truck size={18} />,
      children: [
        { label: 'Recepciones', href: '/recepciones' },
        { label: 'Órdenes Compra', href: '/compras' }
      ]
    }
  ];

  const navReports: SidebarItemProps[] = [
    {
      label: 'Reportes',
      icon: <FileText size={18} />,
      children: [
        { label: 'Stock Crítico', href: '/reportes/stock-critico' },
        { label: 'Trazabilidad', href: '/reportes/trazabilidad' },
      ],
    },
  ];

  // Logic to build sidebar based on role
  let navigation: SidebarItemProps[] = [...navBase];
  
  if (role === 'SUPER_ADMIN') {
    navigation = [
      ...navBase,
      ...navUser,
      ...navBodega,
      ...navReports
    ];
  } else if (role === 'BODEGUERO') {
    navigation = [
      ...navBase,
      ...navBodega,
      ...navReports
    ];
  } else if (role === 'SUPERVISOR') {
    navigation = [
      ...navBase,
      ...navUser,
      ...navSupervisor,
      ...navReports
    ];
  } else {
    // Standard User
    navigation = [
      ...navBase,
      ...navUser
    ];
  }

  const configItems: SidebarItemProps[] = [
    { label: 'Empresas', href: '/config/empresas', icon: <Building2 size={16} /> },
    { label: 'Unidades Organizacionales', href: '/config/unidades-org', icon: <LayoutGrid size={16} /> },
    { label: 'Usuarios', href: '/config/usuarios', icon: <Users size={16} /> },
    { label: 'Roles', href: '/config/roles', icon: <Settings size={16} /> },
    { label: 'Proyectos', href: '/config/proyectos', icon: <Briefcase size={16} /> },
    { label: 'Centros Costos', href: '/config/centros-costos', icon: <BarChart3 size={16} /> }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Orsocom <span>Cloud</span></h1>
        <div className="text-xs text-slate-500 mt-1 uppercase font-semibold">
          Rol: {role}
        </div>
      </div>
      
      <div className="sidebar-scrollable flex-grow custom-scrollbar">
        <div className="nav-section space-y-1">
          {navigation.map((item, idx) => (
            <SidebarItem key={idx} {...item} />
          ))}
        </div>

        {role === 'SUPER_ADMIN' && (
          <>
            <div className="sidebar-divider" />
            <div className="nav-section config-section">
              <span className="section-title">ADMINISTRACIÓN</span>
              <SidebarItem 
                label="Sistema" 
                icon={<Settings size={18} />} 
                children={configItems} 
              />
            </div>
          </>
        )}
      </div>

      <div className="sidebar-footer p-4 border-t border-slate-800">
        <button 
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
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

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 10px;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
