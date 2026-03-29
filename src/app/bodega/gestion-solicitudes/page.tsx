'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ClipboardList, Clock, CheckCircle2, ChevronDown, ChevronUp, ScanLine } from 'lucide-react';
import { processOrderApproval } from './actions';
import { toast } from 'sonner';

export default function GestionSolicitudes() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const [approvals, setApprovals] = useState<Record<string, number>>({});
  const [rejections, setRejections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Scanner & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

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
      .in('status', ['PENDING', 'PARTIAL'])
      .order('created_at', { ascending: false });

    if (data) {
      setRequests(data);
      setFilteredRequests(data);
    }
    setLoading(false);
  };

  const submitApproval = async (request: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const itemsData = request.items.map((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const approvedQty = approvals[item.id] !== undefined ? approvals[item.id] : item.requested_qty;
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
      toast.error(result.error);
    } else {
      toast.success(`Despacho para #${request.folio || request.id.slice(0,5)} confirmado.`);
      setExpandedRow(null);
      setSearchTerm('');
      fetchRequests();
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Auto-focus on search input when component mounts
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si estamos dentro de un input que sea de cantidad o texto de rechazo, no capturamos para no entorpecer
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'; // eslint-disable-line @typescript-eslint/no-unused-vars

      if (e.key === 'Escape' && expandedRow) {
        setExpandedRow(null);
        if (searchInputRef.current) searchInputRef.current.focus();
      }

      // Si apretan Enter y hay una fila abierta (y NO estan buscando), confirmamos despacho
      if (e.key === 'Enter' && expandedRow && target.id !== 'scanner-search') {
        const activeReq = requests.find(r => r.id === expandedRow);
        if (activeReq && !isSubmitting) submitApproval(activeReq);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedRow, requests, isSubmitting, approvals, rejections]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleApproveQtyChange = (itemId: string, requested: number, val: number) => {
    const validVal = Math.max(0, Math.min(val, requested));
    setApprovals(prev => ({ ...prev, [itemId]: validVal }));
  };

  const handleRejectNoteChange = (itemId: string, val: string) => {
    setRejections(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toUpperCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredRequests(requests);
      return;
    }

    const filtered = requests.filter(req => {
      const matchFolio = req.folio?.toUpperCase().includes(term) || req.id.toUpperCase().includes(term);
      const matchSku = req.items.some((item: any) => item.product.sku?.toUpperCase().includes(term)); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      return matchFolio || matchSku;
    });

    setFilteredRequests(filtered);

    // Auto-expand if only 1 matches and we hit enter or scan completes.
    // Done through handleKeyDownSearch
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Un escaneo de código de barras normalmente termina con "Enter".
      if (filteredRequests.length === 1 && expandedRow !== filteredRequests[0].id) {
        toggleRow(filteredRequests[0].id, filteredRequests[0].items);
        // Borrar input para el siguiente escaneo
        setSearchTerm('');
        setFilteredRequests(requests);
      }
    }
  };


  const toggleRow = (id: string, items: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (expandedRow !== id) {
      const initialApr: Record<string, number> = {};
      items.forEach(i => {
         const physStock = i.variant ? i.variant.stock_actual : i.product.stock_actual;
         initialApr[i.id] = Math.min(i.requested_qty, physStock);
      });
      setApprovals(initialApr);
      setExpandedRow(id);
    } else {
      setExpandedRow(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[50vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <ClipboardList className="text-amber-500" size={32} />
            Gestión Logística de Despachos
          </h1>
          <p className="text-slate-400">Aprueba o rechaza solicitudes de pedidos para rebajar inventario.</p>
        </div>

        {/* Global Scanner / Search Bar */}
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <ScanLine size={18} className="text-slate-500 group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            id="scanner-search"
            ref={searchInputRef}
            type="text"
            className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder-slate-500 shadow-lg backdrop-blur-md"
            placeholder="Pistola Scanner (SKU) o Buscar Folio..."
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={handleKeyDownSearch}
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
             <div className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-400 shadow-sm">
               AUTO-FOCUS
             </div>
          </div>
        </div>
      </div>

      <div className="premium-glass-card p-0 overflow-hidden relative min-h-[400px]">
         {filteredRequests.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <CheckCircle2 size={56} className="text-emerald-500/20 mb-4" />
             <p className="text-lg font-medium text-slate-400">Bodega al día.</p>
             <p className="text-sm">No hay solicitudes pendientes con el criterio de búsqueda.</p>
           </div>
         ) : (
           <div className="divide-y divide-slate-800/50">
             {filteredRequests.map((req) => (
               <div key={req.id} className="group flex flex-col transition-all">
                  {/* Header Row */}
                  <div 
                    onClick={() => toggleRow(req.id, req.items)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 cursor-pointer transition-colors ${expandedRow === req.id ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'}`}
                  >
                     <div className="flex items-center gap-6 w-full sm:w-auto">
                       <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${req.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} shadow-sm`}>
                         #FOLIO-{req.folio || req.id.slice(0,5).toUpperCase()}
                       </span>
                       <div>
                         <p className="text-white font-medium text-lg tracking-tight">
                           {req.project?.name} <span className="text-xs text-slate-500 font-normal">({req.project?.code})</span>
                         </p>
                         <p className="text-sm text-slate-400 mt-0.5">
                           Pide: <span className="text-slate-300">{req.requester?.first_name} {req.requester?.last_name}</span>
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                       <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                         <Clock size={16} />
                         {new Date(req.created_at).toLocaleDateString('es-CL', { hour: '2-digit', minute:'2-digit' })}
                       </div>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${expandedRow === req.id ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                         {expandedRow === req.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                       </div>
                     </div>
                  </div>

                  {/* Expanded Document Grid */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedRow === req.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 bg-slate-900/30 border-t border-slate-800/50 shadow-inner">
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                         <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest col-span-full">Detalle a Despachar</h3>
                       </div>
                       
                       <div className="space-y-4">
                         {req.items.map((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                           const physStock = item.variant ? item.variant.stock_actual : item.product.stock_actual;
                           const isStockWarning = physStock < item.requested_qty;

                           return (
                             <div key={item.id} className={`p-5 rounded-xl border grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-sm ${isStockWarning ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50'}`}>
                               <div className="lg:col-span-5 flex flex-col">
                                 <p className="text-base font-semibold text-white">
                                   {item.product.name}
                                 </p>
                                 <div className="flex items-center mt-2 gap-2 flex-wrap">
                                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                    {item.product.sku}
                                  </span>
                                  {item.variant && (
                                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-medium tracking-wide">
                                      Talla: {item.variant.size_label}
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-0.5 rounded border font-medium tracking-wide ${isStockWarning ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                    Físico: {physStock} {item.product.uom?.abbreviation}
                                  </span>
                                 </div>
                               </div>

                               <div className="lg:col-span-2 text-center py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-800/50">
                                 <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest font-bold">Solicitado</p>
                                 <p className="font-bold text-white text-2xl">{item.requested_qty} <span className="text-xs text-slate-500 font-normal">{item.product.uom?.abbreviation}</span></p>
                               </div>

                               <div className="lg:col-span-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                 <div className="w-full sm:w-1/3">
                                  <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">Aprobar Qty</label>
                                  <input 
                                    type="number" 
                                    className={`w-full bg-slate-950 border text-white rounded-lg px-3 py-2 text-base font-semibold focus:outline-none focus:ring-2 shadow-inner transition-colors ${
                                      approvals[item.id] < item.requested_qty ? 'border-amber-500/50 focus:ring-amber-500 focus:border-transparent text-amber-500' : 'border-slate-700 focus:ring-emerald-500 focus:border-transparent'
                                    }`}
                                    min="0"
                                    max={Math.min(item.requested_qty, physStock)}
                                    title="Cantidad a despachar física"
                                    value={approvals[item.id] !== undefined ? approvals[item.id] : ''}
                                    onChange={e => handleApproveQtyChange(item.id, item.requested_qty, parseInt(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                  />
                                 </div>
                                 <div className="w-full sm:w-2/3">
                                  <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest font-bold">Motivo (Si es parcial)</label>
                                  <input 
                                    type="text" 
                                    placeholder="Justificar menor cantidad..."
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-30 disabled:cursor-not-allowed shadow-inner"
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

                       <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-800/50">
                          <p className="text-xs text-slate-500 flex items-center gap-2 hidden sm:flex">
                             <span className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400">Esc</span> para cerrar
                             <span className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400 ml-2">Enter</span> para confirmar
                          </p>
                          <div className="flex gap-4 w-full sm:w-auto">
                            <button 
                              onClick={() => {
                                setExpandedRow(null);
                                if (searchInputRef.current) searchInputRef.current.focus();
                              }}
                              className="flex-1 sm:flex-none px-6 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium border border-transparent hover:border-slate-700"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => submitApproval(req)}
                              disabled={isSubmitting}
                              className="premium-btn flex-1 sm:flex-none px-8 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
                            >
                              {isSubmitting ? 'Registrando...' : 'Confirmar Despacho'}
                            </button>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
