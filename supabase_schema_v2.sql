-- =============== ORSOCOM CLOUD: WMS SCHEMA V2 ===============
-- Ejecutar en el Editor SQL de Supabase (https://supabase.com/dashboard/project/_/sql/)
-- NOTA: Este script NO elimina datos existentes, solo crea lo nuevo.

-- 1. ESTRUCTURAS ORGANIZACIONALES (Centros de Costo y Proyectos)

CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Ej: CC-01
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL, -- Ej: PRJ-101
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Cerrado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);


-- 2. SISTEMA DE USUARIOS Y ROLES (Vinculado a Supabase Auth)

-- user_roles: 'SUPER_ADMIN', 'BODEGUERO', 'SUPERVISOR', 'USER'
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('SUPER_ADMIN', 'BODEGUERO', 'SUPERVISOR', 'USER')),
    -- Relación opcional para definir a qué Centro de Costo puede acceder un Supervisor
    assigned_cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar RLS en perfiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile or Super Admins can view all" 
ON public.user_profiles FOR SELECT 
USING ( auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'SUPER_ADMIN' );

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
USING ( auth.uid() = id );


-- TRIGGER PARA CREAR PERFIL AUTOMÁTICO AL REGISTRARSE EN SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'USER' -- Por defecto, todos nacen como usuario terreno. Super Admin debe cambiarlo.
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validamos si el trigger ya existe, si no lo creamos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END
$$;


-- 3. MÓDULO DE SOLICITUDES DE PEDIDO (Carrito de Terreno)

CREATE TABLE IF NOT EXISTS public.order_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio SERIAL UNIQUE NOT NULL, -- Ej: 1, 2, 3... (Auto-incremental para UI amigable)
    requester_id UUID NOT NULL REFERENCES public.user_profiles(id),
    project_id UUID NOT NULL REFERENCES public.projects(id),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'COMPLETED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.order_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.order_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    -- Para EPP (Tallas), el variant_id será obligatorio lógicamente desde el frontend
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
    approved_qty INTEGER DEFAULT 0 CHECK (approved_qty >= 0),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PARTIAL', 'REJECTED')),
    notes TEXT, -- Justificaciones de rechazo (Ej: "Quiebre de stock temporal").
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS para Solicitudes
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_request_items ENABLE ROW LEVEL SECURITY;

-- Políticas temporales (Todos los autenticados pueden ver CC y Proyectos por ahora)
CREATE POLICY "Enable ALL for authenticated users on cost_centers" ON public.cost_centers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on order_requests" ON public.order_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on order_request_items" ON public.order_request_items FOR ALL USING (auth.role() = 'authenticated');


-- 4. DATOS SEMILLA BÁSICOS (Centros de Costo de Ejemplo)
INSERT INTO public.cost_centers (code, name, description) VALUES
('CC-ZONANORTE', 'Zona Norte', 'Obras y operaciones en zona norte'),
('CC-SANTIAGO', 'Sede Central RM', 'Operaciones Casa Matriz y despachos metropolitanos'),
('CC-TEMUCO', 'Operativa Temuco', 'Proyectos Sur/Temuco')
ON CONFLICT (code) DO NOTHING;

-- Insertar Proyectos Base asumiendo los UUIDs recién creados
DO $$
DECLARE
  norte_id UUID;
  santiago_id UUID;
  temuco_id UUID;
BEGIN
  SELECT id INTO norte_id FROM public.cost_centers WHERE code = 'CC-ZONANORTE';
  SELECT id INTO santiago_id FROM public.cost_centers WHERE code = 'CC-SANTIAGO';
  SELECT id INTO temuco_id FROM public.cost_centers WHERE code = 'CC-TEMUCO';

  IF norte_id IS NOT NULL THEN
    INSERT INTO public.projects (cost_center_id, code, name) VALUES (norte_id, 'PRJ-N01', 'Ampliación Subestación Calama') ON CONFLICT (code) DO NOTHING;
  END IF;
  
  IF santiago_id IS NOT NULL THEN
    INSERT INTO public.projects (cost_center_id, code, name) VALUES (santiago_id, 'PRJ-RM01', 'Mantención Parque Solar Lampa') ON CONFLICT (code) DO NOTHING;
    INSERT INTO public.projects (cost_center_id, code, name) VALUES (santiago_id, 'PRJ-RM02', 'Luminarias Públicas Maipú') ON CONFLICT (code) DO NOTHING;
  END IF;

  IF temuco_id IS NOT NULL THEN
    INSERT INTO public.projects (cost_center_id, code, name) VALUES (temuco_id, 'PRJ-S01', 'Cableado Industrial Planta Arauco') ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;
