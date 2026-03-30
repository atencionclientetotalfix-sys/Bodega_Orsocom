-- Script SEGURO para crear Usuarios de Prueba en Orsocom WMS
-- IMPORTANTE: Ejecuta esto en el SQL Editor de tu Dashboard de Supabase.
-- Contraseña para todos: Orsocom2024!

DO $$
DECLARE
  super_id uuid := gen_random_uuid();
  bodega_id uuid := gen_random_uuid();
  terreno_id uuid := gen_random_uuid();
  supervisor_id uuid := gen_random_uuid();
BEGIN
  -- 0. Limpiar usuarios de prueba si ya existían previamente (Evita el error de duplicado)
  DELETE FROM public.user_profiles WHERE email IN ('admin@orsocom.cl', 'bodega@orsocom.cl', 'terreno@orsocom.cl', 'supervisor@orsocom.cl');
  DELETE FROM auth.users WHERE email IN ('admin@orsocom.cl', 'bodega@orsocom.cl', 'terreno@orsocom.cl', 'supervisor@orsocom.cl');

  -- 1. Insertar en auth.users (Supabase Auth)
  -- SUPER ADMIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (super_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@orsocom.cl', crypt('Orsocom2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Super", "last_name": "Admin"}', now(), now());

  -- BODEGUERO
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (bodega_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bodega@orsocom.cl', crypt('Orsocom2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Jefe", "last_name": "Bodega"}', now(), now());

  -- USUARIO TERRENO
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (terreno_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'terreno@orsocom.cl', crypt('Orsocom2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Tecnico", "last_name": "Terreno"}', now(), now());

  -- SUPERVISOR
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (supervisor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supervisor@orsocom.cl', crypt('Orsocom2024!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name": "Supervisor", "last_name": "Global"}', now(), now());

  -- 2. Insertar en public.user_profiles O Actualizar si un trigger automático ya los creó
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
  VALUES 
    (super_id, 'admin@orsocom.cl', 'Super', 'Admin', 'SUPER_ADMIN'),
    (bodega_id, 'bodega@orsocom.cl', 'Jefe', 'Bodega', 'BODEGUERO'),
    (terreno_id, 'terreno@orsocom.cl', 'Técnico', 'Terreno', 'USER'),
    (supervisor_id, 'supervisor@orsocom.cl', 'Supervisor', 'Global', 'SUPERVISOR')
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;
    
END $$;
