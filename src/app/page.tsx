"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useAlerts } from '@/hooks/useAlerts';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Box, ClipboardList, AlertTriangle, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Bell, Clock, PackageCheck, Truck
} from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, icon, trend, trendValue, color, className = "" }: any) => (
  <div className={`premium-glass-card p-5 flex flex-col gap-2 relative overflow-hidden group ${className}`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl bg-${color}-500 group-hover:opacity-20 transition-opacity`}></div>
    <div className="flex justify-between items-start z-10">
      <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</div>
      <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 ring-1 ring-${color}-500/20`}>
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-white z-10 mt-2">{value}</div>
    {trend && (
      <div className="flex items-center gap-2 mt-auto pt-2 z-10">
        <span className={`flex items-center text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </span>
        <span className="text-xs text-slate-500">vs semana anterior</span>
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.role || 'USER';
  const { expirations, stockAlerts, loading: alertsLoading } = useAlerts();
  
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!profile) return;
    
    fetchDashboardData();

    // Suscripciones Realtime
    const channelEvents = supabase.channel('dashboard_metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_requests' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelEvents);
    };
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoadingStats(true);
    try {
      if (role === 'SUPER_ADMIN' || role === 'BODEGUERO') {
        // Fetch Movimientos Recientes para Admins
        const { data: movs } = await supabase
          .from('stock_movements')
          .select('*, product:products(name)')
          .order('created_at', { ascending: false })
          .limit(5);
        if (movs) setRecentMovements(movs);

        // Fetch Solicitudes Pendientes para Bodega
        const { data: reqs } = await supabase
          .from('order_requests')
          .select('id, folio, status, project:projects(name), created_at')
          .in('status', ['PENDING', 'PARTIAL'])
          .order('created_at', { ascending: false });
        if (reqs) setPendingRequests(reqs);

      } else {
        // Fetch solo los pedidos propios activos del USUARIO
        const { data: myReqs } = await supabase
          .from('order_requests')
          .select('id, folio, status, created_at, items:order_request_items(count)')
          .eq('requester_id', profile?.id)
          .in('status', ['PENDING', 'PARTIAL'])
          .order('created_at', { ascending: false });
        if (myReqs) setPendingRequests(myReqs);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingStats(false);
  };

  const isAdmin = role === 'SUPER_ADMIN' || role === 'BODEGUERO';

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto animate-fade-in-up">
      {/* Header Premium */}
      <header className="relative">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
          Panel de Control <span className="text-amber-500">Orsocom</span>
        </h1>
        <p className="text-slate-400">
          {isAdmin 
            ? 'Monitoreo en tiempo real del inventario y flujo logístico.' 
            : 'Resumen de tus pedidos y catálogo habilitado.'}
        </p>
      </header>

      {/* KPI Cards */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard 
            title="Stock Bajo (Crítico)" 
            value={alertsLoading ? '-' : stockAlerts.length.toString()} 
            icon={<AlertTriangle size={22} />} 
            trend={stockAlerts.length > 0 ? "down" : "up"} 
            trendValue={stockAlerts.length > 0 ? "ATENCIÓN" : "NORMAL"} 
            color={stockAlerts.length > 0 ? "rose" : "emerald"}
          />
          <StatCard 
            title="Despachos Pendientes" 
            value={loadingStats ? '-' : pendingRequests.length.toString()} 
            icon={<Truck size={22} />} 
            color="amber"
          />
          <StatCard 
            title="Equipos por Vencer" 
            value={alertsLoading ? '-' : expirations.length.toString()} 
            icon={<Bell size={22} />} 
            trend={expirations.length > 0 ? "down" : "up"} 
            trendValue={expirations.length > 0 ? "REQUIERE ACCIÓN" : "OK"} 
            color={expirations.length > 0 ? "amber" : "blue"}
          />
          <StatCard 
            title="Total en Bodega (Valor)" 
            value="Est." 
            icon={<TrendingUp size={22} />} 
            color="emerald"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Mis Solicitudes Activas" 
            value={loadingStats ? '-' : pendingRequests.length.toString()} 
            icon={<ClipboardList size={22} />} 
            color="amber"
          />
          <div className="premium-glass-card p-6 flex items-center justify-between col-span-2">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Crea un Nuevo Pedido</h3>
              <p className="text-sm text-slate-400">Solicita EPP y Materiales desde el catálogo autorizado de tu proyecto.</p>
            </div>
            <Link href="/bodega/solicitud" className="premium-btn px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg shadow-lg shadow-amber-500/20">
              Ir al Catálogo
            </Link>
          </div>
        </div>
      )}

      {/* Main Grids */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Columna Izquierda / Mayor (Alertas y Pendientes) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Alertas Críticas (Solo Admins) */}
          {isAdmin && (
            <div className="premium-glass-card p-0">
              <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" /> Semaforización Crítica
                </h3>
              </div>
              <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {alertsLoading ? (
                  <p className="text-slate-500 text-sm text-center py-4">Sincronizando sensores...</p>
                ) : stockAlerts.length === 0 && expirations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <PackageCheck size={40} className="mb-3 opacity-20" />
                    <p>Inventario Saludable. No hay alertas críticas.</p>
                  </div>
                ) : (
                  <>
                    {stockAlerts.map((stk: any, i: number) => (
                      <div key={`stk-${i}`} className="flex items-center gap-4 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                        <div className="p-2 rounded-full bg-rose-500/10 text-rose-500"><AlertTriangle size={16}/></div>
                        <div>
                          <p className="text-sm font-medium text-white">{stk.product_name} {stk.size_label ? `(${stk.size_label})` : ''}</p>
                          <p className="text-xs text-slate-400">Stock Actual: <span className="text-rose-400 font-bold">{stk.current_stock}</span> / Mínimo: {stk.min_stock}</p>
                        </div>
                      </div>
                    ))}
                    {expirations.map((exp: any, i: number) => (
                      <div key={`exp-${i}`} className="flex items-center gap-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                        <div className="p-2 rounded-full bg-amber-500/10 text-amber-500"><Bell size={16}/></div>
                        <div>
                          <p className="text-sm font-medium text-white">Vencimiento: {exp.product_name}</p>
                          <p className="text-xs text-slate-400">SN: {exp.serial_number} - Vence en {exp.days_remaining} días</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Solicitudes Pendientes (Todos) */}
          <div className="premium-glass-card p-0">
            <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ClipboardList size={18} className="text-emerald-500" /> 
                {isAdmin ? 'Despachos Pendientes (Bodega)' : 'Mis Pedidos Abiertos'}
              </h3>
              {isAdmin && (
                <Link href="/bodega/gestion-solicitudes" className="text-xs text-amber-500 hover:text-amber-400 font-medium">
                  Ir a Gestión →
                </Link>
              )}
            </div>
            <div className="p-5">
              {loadingStats ? (
                <div className="h-32 flex items-center justify-center"><div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : pendingRequests.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No hay solicitudes pendientes.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="pb-3 font-medium">Folio</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Fecha</th>
                      {!isAdmin && <th className="pb-3 font-medium text-right">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {pendingRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-medium text-white">#FOLIO-{req.folio || req.id.slice(0,5).toUpperCase()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {req.status === 'PARTIAL' ? 'PARCIAL' : 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                           {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        {!isAdmin && (
                          <td className="py-3 text-right">
                            <span className="text-xs text-slate-500 hover:text-white cursor-pointer transition-colors">Ver GdeD</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha / Menor (Activity Feed) */}
        {isAdmin && (
          <div className="xl:col-span-1">
            <div className="premium-glass-card p-5 h-full">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <Clock size={18} className="text-blue-500" /> Actividad Logística
              </h3>
              
              <div className="relative border-l border-slate-700/50 ml-3 space-y-6">
                {loadingStats ? (
                  <p className="text-slate-500 pl-6 text-sm">Cargando radar...</p>
                ) : recentMovements.length === 0 ? (
                  <p className="text-slate-500 pl-6 text-sm">Sin movimientos recientes.</p>
                ) : (
                  recentMovements.map((mov: any) => (
                    <div key={mov.id} className="pl-6 relative">
                      <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#090e17] ${mov.movement_type === 'OUT' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      <p className="text-sm text-white font-medium">
                        {mov.movement_type === 'OUT' ? 'Despacho' : 'Ingreso'}: <span className="text-slate-300 font-normal">{mov.product?.name}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">{new Date(mov.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Cant: {mov.quantity}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
