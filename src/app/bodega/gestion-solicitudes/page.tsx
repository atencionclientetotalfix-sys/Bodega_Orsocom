'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClipboardList, AlertCircle, Search, Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { processOrderApproval } from './actions';

export default function GestionSolicitudes() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // States purely for the forms inside
  const [approvals, setApprovals] = useState<Record<string, number>>({});
  const [rejections, setRejections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('order_requests')
      .select(`
        *,
        requester:user_profiles(first_name, last_name, email),
        project:projects(name, code, cost_center:cost_centers(name)),
        items:order_request_items(
          *,
          product:products(name, sku, uom:uoms(abbreviation), stock_actual),
          variant:product_variants(size_label, stock_actual)
        )
      `)
      .in('status', ['PENDING', 'PARTIAL']) // Only actionable items
      .order('created_at', { ascending: false });

    if (data) setRequests(data);
    setLoading(false);
  };

  const handleApproveQtyChange = (itemId: string, maxQty: number, val: number) => {
    const qty = Math.max(0, Math.min(maxQty, val));
    setApprovals(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleRejectNoteChange = (itemId: string, note: string) => {
    setRejections(prev => ({ ...prev, [itemId]: note }));
  };

  const submitApproval = async (request: any) => {
    const itemsData = request.items.map((item: any) => {
      const approvedQty = approvals[item.id] !== undefined ? approvals[item.id] : item.requested_qty; // Default to full approval if untouched
      const rejectNote = rejections[item.id] || '';
      
      let finalStatus: 'APPROVED' | 'PARTIAL' | 'REJECTED' = 'APPROVED';
      if (approvedQty === 0) finalStatus = 'REJECTED';
      else if (approvedQty < item.requested_qty) finalStatus = 'PARTIAL';

      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        approved_qty: approvedQty,
        requested_qty: item.requested_qty,
        status: finalStatus,
        notes: rejectNote
      };
    });

    setIsSubmitting(true);
    const result = await processOrderApproval({
      requestId: request.id,
      items: itemsData
    });
    setIsSubmitting(false);

    if (result.error) {
      alert(result.error);
    } else {
      setExpandedRow(null);
      fetchRequests(); // reload
    }
  };

  const toggleRow = (id: string, items: any[]) => {
    if (expandedRow !== id) {
      // Pre-fill default approval qtys
      const initialApr: Record<string, number> = {};
      items.forEach(i => {
         // Default to max possible logically, capped by physical stock.
         const physStock = i.variant ? i.variant.stock_actual : i.product.stock_actual;
         initialApr[i.id] = Math.min(i.requested_qty, physStock);
      });
      setApprovals(initialApr);
      setExpandedRow(id);
    } else {
      setExpandedRow(null);
    }
  };

  if (loading) return <div className="text-center text-slate-500 py-12">Cargando Solicitudes...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ClipboardList size={28} className="text-amber-500" />
          Gestión de Despachos 
        </h1>
        <p className="text-slate-400 mt-1">Revisa y autoriza de forma administrativa y rebaja stock de la bodega.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
         {requests.length === 0 ? (
           <div className="text-center text-slate-500 py-20 flex flex-col items-center gap-3">
             <CheckCircle2 size={48} className="text-emerald-500/50" />
             <p>No hay solicitudes pendientes en este momento.</p>
           </div>
         ) : (
           <div className="divide-y divide-slate-800">
             {requests.map((req) => (
               <div key={req.id} className="group">
                  {/* Header Row */}
                  <div 
                    onClick={() => toggleRow(req.id, req.items)}
                    className="flex items-center justify-between p-5 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                     <div className="flex items-center gap-6">
                       <span className="bg-slate-800 text-amber-500 px-3 py-1 rounded text-sm font-bold border border-slate-700">
                         #FOLIO-{req.folio}
                       </span>
                       <div>
                         <p className="text-white font-medium">{req.project?.name} <span className="text-xs text-slate-500">({req.project?.code})</span></p>
                         <p className="text-xs text-slate-400 mt-0.5">
                           Solicitante: {req.requester?.first_name} {req.requester?.last_name} ({req.requester?.email})
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2 text-slate-400 text-sm">
                         <Clock size={14} />
                         {new Date(req.created_at).toLocaleDateString('es-CL', { hour: '2-digit', minute:'2-digit' })}
                       </div>
                       <div className="w-8 h-8 rounded bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                         {expandedRow === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                       </div>
                     </div>
                  </div>

                  {/* Expanded Items section */}
                  {expandedRow === req.id && (
                    <div className="p-6 bg-slate-950/50 border-t border-slate-800/50">
                       <h3 className="text-sm font-semibold text-white mb-4">Líneas de la Solicitud</h3>
                       
                       <div className="space-y-3">
                         {req.items.map((item: any) => {
                           const physStock = item.variant ? item.variant.stock_actual : item.product.stock_actual;
                           const isStockWarning = physStock < item.requested_qty;

                           return (
                             <div key={item.id} className={`p-4 rounded-lg border ${isStockWarning ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900'} grid grid-cols-12 gap-4 items-center`}>
                               <div className="col-span-5">
                                 <p className="text-sm font-medium text-white">{item.product.name} <span className="text-xs text-slate-500 ml-2">{item.product.sku}</span></p>
                                 <div className="flex items-center mt-1 gap-2">
                                  {item.variant && (
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded border border-indigo-500/20">
                                      Talla: {item.variant.size_label}
                                    </span>
                                  )}
                                  <span className={`text-[10px] px-1.5 rounded border ${isStockWarning ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                    Stock Físico: {physStock} {item.product.uom?.abbreviation}
                                  </span>
                                 </div>
                               </div>

                               <div className="col-span-3 text-center">
                                 <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Solicitado</p>
                                 <p className="font-semibold text-white text-lg">{item.requested_qty}</p>
                               </div>

                               <div className="col-span-4 flex items-center gap-3">
                                 <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Aprobar</label>
                                  <input 
                                    type="number" 
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    min="0"
                                    max={Math.min(item.requested_qty, physStock)}
                                    title="Cantidad a despachar física"
                                    value={approvals[item.id] !== undefined ? approvals[item.id] : ''}
                                    onChange={e => handleApproveQtyChange(item.id, item.requested_qty, parseInt(e.target.value) || 0)}
                                  />
                                 </div>
                                 <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Nota Rechazo</label>
                                  <input 
                                    type="text" 
                                    placeholder="Motivo..."
                                    className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1.5 text-sm focus:border-amber-500 disabled:opacity-30"
                                    title="Justificar rebaja"
                                    disabled={approvals[item.id] === item.requested_qty}
                                    value={rejections[item.id] || ''}
                                    onChange={e => handleRejectNoteChange(item.id, e.target.value)}
                                  />
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>

                       <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                          <button 
                            onClick={() => setExpandedRow(null)}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => submitApproval(req)}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? 'Procesando...' : 'Confirmar Despacho'}
                          </button>
                       </div>
                    </div>
                  )}
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
