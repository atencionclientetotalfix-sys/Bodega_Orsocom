-- =============== ORSOCOM CLOUD: WMS SCHEMA ===============
-- Ejecutar en el Editor SQL de Supabase (https://supabase.com/dashboard/project/_/sql/)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Familias (Categorías)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Material', 'EPP', 'Herramienta')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Unidades de Medida (UoM)
CREATE TABLE IF NOT EXISTS public.uoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Maestro de Productos (SKU)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    uom_id UUID REFERENCES public.uoms(id) ON DELETE SET NULL,
    min_stock INTEGER DEFAULT 0,
    is_serialized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Variantes de Producto (Tallas EPP: 35-46, XS-XXXL)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size_label VARCHAR(50) NOT NULL, -- Ej: '35', '42', 'M', 'XL', 'Única'
    stock_actual INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Detalles de Equipos (Herramientas Serializadas / Equipamiento)
CREATE TABLE IF NOT EXISTS public.equipment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    certification_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'Operativo' CHECK (status IN ('Operativo', 'Mantención', 'Vencido', 'De Baja')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Supervisores (Para notificaciones de alertas)
CREATE TABLE IF NOT EXISTS public.supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    notify_expirations BOOLEAN DEFAULT TRUE,
    notify_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Movimientos de Inventario (Trazabilidad)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id),
    equipment_id UUID REFERENCES public.equipment_details(id),
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL,
    project_name VARCHAR(255),
    reference_doc VARCHAR(100), -- OC, Guía de Despacho, etc.
    user_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- Permitir acceso autenticado a todas las tablas (se pueden restringir más luego)

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Políticas base (Permiten todo para usuarios autenticados)
CREATE POLICY "Enable ALL for authenticated users on categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on uoms" ON public.uoms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on product_variants" ON public.product_variants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on equipment_details" ON public.equipment_details FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on supervisors" ON public.supervisors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users on stock_movements" ON public.stock_movements FOR ALL USING (auth.role() = 'authenticated');

-- Permitir anónimo temporalmente SI fuese necesario (opcional)
-- CREATE POLICY "Enable read for public" ON public.products FOR SELECT USING (true);

-- 4. INSERT DATA BÁSICA DE EJEMPLO
INSERT INTO public.categories (name, type) VALUES 
('Tableros', 'Material'),
('Cables', 'Material'),
('Ferretería', 'Material'),
('Calzado de Seguridad', 'EPP'),
('Vestuario Alta Visibilidad', 'EPP'),
('Protección Visual', 'EPP'),
('Herramientas Manuales', 'Herramienta'),
('Equipos de Medición', 'Herramienta');

INSERT INTO public.uoms (name, abbreviation) VALUES 
('Unidad', 'UN'),
('Metro', 'MT'),
('Caja', 'CJ'),
('Rollo', 'RL'),
('Par', 'PAR');
