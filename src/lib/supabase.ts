import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente principal para operaciones desde el cliente/frontend (respetando RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// NOTA: Para operaciones de 'Service Role' que deban saltarse las políticas RLS 
// (por ejemplo, en Edge Functions o Rutas de API seguras en el servidor),
// deberás inicializar otro cliente usando SUPABASE_SERVICE_ROLE_KEY.
