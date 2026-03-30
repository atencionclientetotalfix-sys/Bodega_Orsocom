'use server';

import { createClient } from '@/utils/supabase/server';

export async function getMyOrderRequests() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Usuario no autenticado', data: null };
  }

  const { data, error } = await supabase
    .from('order_requests')
    .select(`
      id,
      folio,
      status,
      created_at,
      notes,
      projects ( name, code ),
      order_request_items (
        id,
        requested_qty,
        approved_qty,
        status,
        notes,
        product_id,
        variant_id,
        products ( name, sku ),
        product_variants ( size_label )
      )
    `)
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getMyOrderRequests:', error);
    return { error: 'No se pudieron recuperar los pedidos', data: null };
  }

  return { data, error: null };
}
