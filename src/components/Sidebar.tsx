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
    <div className={`mb-0.5 ${expanded ? 'expanded' : ''}`} onClick={toggle}>
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-800/80 hover:text-white ${expanded ? 'text-white bg-slate-800/40' : 'text-slate-400'}`}>
        <div className="flex items-center gap-3">
          {icon && <span className="flex items-center text-amber-500">{icon}</span>}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {hasChildren && (
          <span className="text-slate-500">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="pl-4 mt-1 border-l border-white/5 ml-4 animate-fade-in-up space-y-0.5">
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
    <aside className="w-[280px] premium-sidebar h-screen flex flex-col text-[#9198a1] flex-shrink-0 z-50">
      <div className="p-6 border-b border-white/5 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <img 
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/logo.png`} 
            alt="Orsocom Logo" 
            className="h-8 w-auto object-contain drop-shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Orsocom <span className="text-amber-500">Cloud</span>
          </h1>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 uppercase font-semibold tracking-wider flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          Rol: {role}
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow custom-scrollbar py-4">
        <div className="px-4 space-y-1">
          {navigation.map((item, idx) => (
            <SidebarItem key={idx} {...item} />
          ))}
        </div>

        {role === 'SUPER_ADMIN' && (
          <>
            <div className="h-px bg-white/5 my-4 mx-4" />
            <div className="px-4">
              <span className="text-[10px] font-bold text-slate-500 px-3 pb-2 block uppercase tracking-wider">ADMINISTRACIÓN</span>
              <SidebarItem 
                label="Sistema" 
                icon={<Settings size={18} />} 
                children={configItems} 
              />
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/40">
        <button 
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
