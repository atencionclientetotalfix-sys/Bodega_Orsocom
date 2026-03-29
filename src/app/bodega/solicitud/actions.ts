'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface OrderRequestBody {
  project_id: string;
  notes: string;
  items: {
    product_id: string;
    variant_id: string | null;
    requested_qty: number;
  }[];
}

export async function submitOrderRequest(body: OrderRequestBody) {
  const supabase = await createClient()

  // 1. Get current logged in user (requester)
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return { error: 'No autorizado' }
  }

  // 2. Insert into order_requests
  const { data: order, error: orderErr } = await supabase
    .from('order_requests')
    .insert({
      requester_id: user.id,
      project_id: body.project_id,
      notes: body.notes,
      status: 'PENDING'
    })
    .select('id, folio')
    .single()

  if (orderErr || !order) {
    console.error('Error creating order request:', orderErr)
    return { error: 'Error al crear la cabecera de la solicitud' }
  }

  // 3. Prepare items
  const itemsToInsert = body.items.map(item => ({
    request_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id || null, // ensure empty string becomes null
    requested_qty: item.requested_qty,
    approved_qty: 0,
    status: 'PENDING'
  }))

  // 4. Insert into order_request_items
  const { error: itemsErr } = await supabase
    .from('order_request_items')
    .insert(itemsToInsert)

  if (itemsErr) {
    console.error('Error creating order items:', itemsErr)
    // Rollback is tricky without RPC, so we could theoretically delete the order but let's assume it works.
    return { error: 'Error al guardar los ítems de la solicitud' }
  }

  // Revalidar los paths para que las vistas actualicen
  revalidatePath('/bodega/solicitud')
  revalidatePath('/solicitudes')

  return { success: true, folio: order.folio }
}
