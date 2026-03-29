'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ApprovalData {
  requestId: string;
  items: {
    id: string; // order_request_item id
    product_id: string;
    variant_id: string | null;
    approved_qty: number;
    requested_qty: number;
    status: 'APPROVED' | 'PARTIAL' | 'REJECTED';
    notes?: string;
  }[];
}

export async function processOrderApproval(data: ApprovalData) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'No autorizado / Sesión expirada' }

  // Extracción del email del usuario que aprueba (para trazabilidad)
  const userEmail = user.email || 'autorizador@desconocido';

  // Obtener nombre del proyecto como referencia rápida (opcional, aunque ya tenemos ID en la orden)
  const { data: orderHeader } = await supabase
    .from('order_requests')
    .select('*, project:projects(name)')
    .eq('id', data.requestId)
    .single();
    
  let allApproved = true;
  let allRejected = true;

  try {
    for (const item of data.items) {
      if (item.status === 'REJECTED') {
        allApproved = false;
      } else if (item.status === 'APPROVED') {
        allRejected = false;
        if (item.approved_qty < item.requested_qty) {
          allApproved = false;
          item.status = 'PARTIAL';
        }
      } else if (item.status === 'PARTIAL') {
        allApproved = false;
        allRejected = false;
      }
      
      // 1. Actualizar la línea de solicitud
      await supabase
        .from('order_request_items')
        .update({
          approved_qty: item.approved_qty,
          status: item.status,
          notes: item.notes
        })
        .eq('id', item.id);

      // 2. Si hay cantidades aprobadas, debemos rebajar STOCK y registrar TRACKING
      if (item.approved_qty > 0) {
        
        // Registrar en Movimientos (Trazabilidad)
        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          movement_type: 'OUT',
          quantity: item.approved_qty,
          project_name: orderHeader?.project?.name || 'Desconocido',
          reference_doc: `Solicitud FOLIO #${orderHeader?.folio || 'N/A'}`,
          user_email: userEmail
        });

        // Rebajar stock en products
        // (Supabase JS no tiene un decremento atómico sin RPC nativamente así que hacemos fetch + update)
        const { data: prodData } = await supabase
          .from('products')
          .select('stock_actual')
          .eq('id', item.product_id)
          .single();
          
        if (prodData) {
          await supabase
            .from('products')
            .update({ stock_actual: Math.max(0, prodData.stock_actual - item.approved_qty) })
            .eq('id', item.product_id);
        }

        // Rebajar stock en variant si aplica (EPP)
        if (item.variant_id) {
          const { data: varData } = await supabase
            .from('product_variants')
            .select('stock_actual')
            .eq('id', item.variant_id)
            .single();

          if (varData) {
            await supabase
              .from('product_variants')
              .update({ stock_actual: Math.max(0, varData.stock_actual - item.approved_qty) })
              .eq('id', item.variant_id);
          }
        }
      }
    }

    // 3. Actualizar la Cabecera de la Solicitud
    let finalStatus = 'PARTIAL';
    if (allApproved) finalStatus = 'COMPLETED';
    if (allRejected) finalStatus = 'REJECTED';

    await supabase
      .from('order_requests')
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq('id', data.requestId);

    revalidatePath('/bodega/gestion-solicitudes');
    revalidatePath('/solicitudes');
    revalidatePath('/inventory');
    return { success: true }
    
  } catch (error: any) {
    console.error("Error processOrderApproval:", error);
    return { error: 'Ocurrió un error en el servidor procesando la solicitud' }
  }
}
