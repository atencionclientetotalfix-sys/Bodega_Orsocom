'use client';

import { useState, useEffect } from 'react';
import { getMyOrderRequests } from './actions';
import { ChevronDown, ChevronUp, Package, Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw, CopyPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function MisPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await getMyOrderRequests();
    if (error) {
      toast.error(error);
    } else if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-medium"><Clock size={14} /> PENDIENTE</span>;
      case 'PARTIAL':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-medium"><AlertTriangle size={14} /> PARCIAL</span>;
      case 'COMPLETED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-medium"><CheckCircle size={14} /> COMPLETA</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-medium"><XCircle size={14} /> RECHAZADA</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xs">{status}</span>;
    }
  };

  const handleDuplicate = (order: any) => {
    // In a real flow, you might pre-fill the cart context. 
    // For now we just redirect the user to the catalog. You can implement Cart Context population here.
    toast.success(`Redirigiendo al catálogo para volver a pedir similar al Folio #${order.folio}`);
    router.push('/bodega/solicitud');
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Package className="text-amber-500" /> Mis Pedidos
          </h1>
          <p className="text-slate-400 mt-2">Historial y estado de tus solicitudes de bodega.</p>
        </div>
        <button 
          onClick={fetchOrders} 
          disabled={loading}
          className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors"
          title="Actualizar"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin text-amber-500' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse">Cargando tu historial de pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center">
          <Package size={48} className="text-slate-700 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Aún no tienes pedidos</h3>
          <p className="text-slate-400 mb-6">Tus solicitudes de materiales aparecerán aquí.</p>
          <button 
            onClick={() => router.push('/bodega/solicitud')}
            className="px-6 py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors"
          >
            Ir al Catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const items = order.order_request_items || [];
            
            return (
              <div key={order.id} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700">
                {/* Header Compacto */}
                <div 
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex flex-col items-center justify-center border border-slate-700 shadow-inner">
                      <span className="text-[10px] text-slate-500 uppercase font-bold leading-none">Folio</span>
                      <span className="text-lg font-bold text-white leading-tight">#{order.folio}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{order.projects?.name || 'Sin Proyecto'} <span className="text-slate-500 text-sm font-normal">({order.projects?.code})</span></h3>
                      <p className="text-slate-400 text-xs mt-1">
                        Solicitado el {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    {getStatusBadge(order.status)}
                    <button className="text-slate-500 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Detalle Acordeón Expandido */}
                {isExpanded && (
                  <div className="bg-slate-900 border-t border-slate-800 p-5">
                    
                    {order.status === 'REJECTED' && (
                      <div className="mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
                        <div>
                          <p className="text-red-400 text-sm font-medium mb-1">Tu solicitud fue rechazada.</p>
                          <p className="text-slate-400 text-xs mb-3">Revisa las notas del bodeguero en los ítems y puedes volver a intentarlo si consideras que fue un error o si requieres hacer ajustes.</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(order); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                          >
                            <CopyPlus size={14} /> Volver a Pedir
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Materiales Solicitados ({items.length})</h4>
                      
                      <div className="border border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-800/50">
                            <tr>
                              <th className="p-3 text-xs font-medium text-slate-400">Producto</th>
                              <th className="p-3 text-xs font-medium text-slate-400 text-center">Req.</th>
                              <th className="p-3 text-xs font-medium text-slate-400 text-center">Entregado</th>
                              <th className="p-3 text-xs font-medium text-slate-400">Estado Ítem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {items.map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="p-3">
                                  <p className="text-sm text-white font-medium">{item.products?.name}</p>
                                  <div className="flex gap-2 items-center mt-1">
                                    <span className="text-[10px] text-slate-500 font-mono">{item.products?.sku}</span>
                                    {item.product_variants?.size_label && (
                                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 rounded border border-slate-700">Talla: {item.product_variants.size_label}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center text-sm font-medium text-slate-300">{item.requested_qty}</td>
                                <td className="p-3 text-center text-sm font-bold text-emerald-400">{item.approved_qty}</td>
                                <td className="p-3">
                                  {getStatusBadge(item.status)}
                                  {item.notes && (
                                    <p className="text-[10px] text-amber-500/80 mt-1 italic border-l-2 border-amber-500/30 pl-2">Nota: {item.notes}</p>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {order.notes && (
                        <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                          <p className="text-xs font-semibold text-slate-400 mb-1">Tus observaciones:</p>
                          <p className="text-sm text-slate-300 italic">"{order.notes}"</p>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
