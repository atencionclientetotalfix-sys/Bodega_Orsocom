'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

function DespachoDocument() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  
  const [request, setRequest] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // 1. Fetch Order Request
      const { data: requestData, error } = await supabase
        .from('order_requests')
        .select(`
          id, folio, status, created_at,
          requester:users(id, first_name, last_name, rut),
          project:projects(id, name, code)
        `)
        .eq('id', requestId)
        .single();
        
      if (error || !requestData) {
        setLoading(false);
        return;
      }

      // 2. Fetch Order Items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          id, product_id, variant_id, requested_qty, approved_qty, status, rejection_reason,
          product:products(name, sku, uom:uom_id(abbreviation)),
          variant:product_variants(size_label, color)
        `)
        .eq('order_request_id', requestId);

      setRequest({ ...requestData, items: itemsData || [] });
      setLoading(false);
    };

    fetchData();
  }, [requestId, supabase]);

  useEffect(() => {
    if (!loading && request) {
      // Trigger auto-print after rendering delay
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, request]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando documento...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center text-red-500">Documento no encontrado o ID inválido.</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0 font-sans">
      <div className="max-w-[800px] mx-auto border border-gray-300 p-8 print:border-none print:p-0">
        
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">ORSOCOM</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Servicios Generales</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">VALE DE SALIDA</h2>
            <p className="text-lg font-medium text-gray-600">N° {request.folio || request.id.slice(0, 8)}</p>
            <p className="text-sm text-gray-500 mt-1">
              Fecha: {new Date(request.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
            </p>
          </div>
        </div>

        {/* Info Solicitante */}
        <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-md print:bg-transparent print:p-0">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Solicitado por</p>
            <p className="text-base font-semibold">{request.requester?.first_name} {request.requester?.last_name}</p>
            <p className="text-sm text-gray-600">RUT: {request.requester?.rut || 'S/I'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Proyecto / Centro de Costo</p>
            <p className="text-base font-semibold">{request.project?.name || 'S/I'}</p>
            <p className="text-sm text-gray-600">Código: {request.project?.code || 'S/I'}</p>
          </div>
        </div>

        {/* Tabla Artículos */}
        <div className="mb-12">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-600 bg-gray-100 print:bg-transparent">
                <th className="py-3 px-2 font-bold uppercase">SKU</th>
                <th className="py-3 px-2 font-bold uppercase">Descripción del Material</th>
                <th className="py-3 px-2 font-bold uppercase text-center">Unidad</th>
                <th className="py-3 px-2 font-bold uppercase text-right">Cant. Solicitada</th>
                <th className="py-3 px-2 font-bold uppercase text-right">Cant. Entregada</th>
              </tr>
            </thead>
            <tbody>
              {request.items?.map((item: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-3 px-2 font-mono text-xs">{item.product?.sku}</td>
                  <td className="py-3 px-2">
                    <p className="font-semibold">{item.product?.name}</p>
                    {item.variant && (
                      <p className="text-xs text-gray-500">Talla: {item.variant.size_label}</p>
                    )}
                    {item.status !== 'APPROVED' && item.rejection_reason && (
                      <p className="text-xs text-red-600 italic">Nota: {item.rejection_reason}</p>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center text-gray-600">{item.product?.uom?.abbreviation}</td>
                  <td className="py-3 px-2 text-right">{item.requested_qty}</td>
                  <td className="py-3 px-2 text-right font-bold text-base">
                    {item.approved_qty !== null ? item.approved_qty : 0}
                  </td>
                </tr>
              ))}
              {request.items?.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">Sin artículos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Firmas */}
        <div className="mt-20 pt-8 border-t-2 border-dashed border-gray-300 grid grid-cols-2 gap-12 text-center">
          <div>
            <div className="w-full h-16 border-b border-gray-400 mb-2"></div>
            <p className="font-bold text-gray-800">Firma Entregador (Bodega)</p>
            <p className="text-xs text-gray-500 mt-1">Nombre y RUT</p>
          </div>
          <div>
            <div className="w-full h-16 border-b border-gray-400 mb-2"></div>
            <p className="font-bold text-gray-800">Firma Receptor</p>
            <p className="text-xs text-gray-500 mt-1">Conforme de entrega, Nombre y RUT</p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400 print:block">
          Documento generado digitalmente por Orsocom Cloud WMS - {new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}.
        </div>
      </div>
    </div>
  );
}

export default function DespachoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DespachoDocument />
    </Suspense>
  )
}
