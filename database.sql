-- SQL Setup Script para Supabase - Auditoría Lotta
-- Limpia y reinicia la base de datos de manera segura

-- 1. ELIMINAR CUALQUIER USUARIO CREADO MANUALMENTE PARA LIMPIAR ERRORES
DELETE FROM auth.identities WHERE identity_data->>'email' IN ('lottaburgers@gmail.com', 'andres@lottaburgers.com');
DELETE FROM auth.users WHERE email IN ('lottaburgers@gmail.com', 'andres@lottaburgers.com');

-- 2. ELIMINAR TABLAS Y TRIGGERS (BORRAR TODO)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text);
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.audits CASCADE;

-- 3. RECREAR TABLA DE ROLES
CREATE TABLE public.user_roles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator'))
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = id);

-- 4. RECREAR TABLA DE AUDITORÍAS
CREATE TABLE public.audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_score NUMERIC NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own audits" ON public.audits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audits" ON public.audits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audits" ON public.audits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.id = auth.uid() AND user_roles.role = 'admin'
        )
    );

-- 5. RECREAR EL TRIGGER QUE PONE 'operator' POR DEFECTO
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (id, role)
  VALUES (new.id, 'operator');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. FUNCIÓN SEGURA PARA QUE ADMINS CREEN USUARIOS DESDE LA PÁGINA
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_create_user(email text, password text, user_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin boolean;
    new_user_id uuid;
    encrypted_pw text;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Solo los administradores pueden crear usuarios.';
    END IF;

    IF user_role NOT IN ('admin', 'operator') THEN
        RAISE EXCEPTION 'El rol debe ser admin u operator.';
    END IF;

    encrypted_pw := crypt(password, gen_salt('bf'));
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
        confirmation_token, recovery_token, email_change_token_new, email_change
    )
    VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        email, encrypted_pw, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false,
        '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
        gen_random_uuid(), new_user_id, new_user_id::text, format('{"sub":"%s","email":"%s"}', new_user_id, email)::jsonb, 
        'email', now(), now(), now()
    );

    IF user_role = 'admin' THEN
        UPDATE public.user_roles SET role = 'admin' WHERE id = new_user_id;
    END IF;
END;
$$;

-- 7. CÓDIGO CORRECTO PARA CREAR EL ADMIN INICIAL
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    encrypted_pw text := crypt('44091321', gen_salt('bf'));
    user_email text := 'andres@lottaburgers.com';
BEGIN
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
        confirmation_token, recovery_token, email_change_token_new, email_change
    )
    VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
        user_email, encrypted_pw, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name": "Andres Viscusi"}', false,
        '', '', '', ''
    );

    -- EL ERROR ERA AQUÍ: provider_id DEBE SER EL ID DEL USUARIO (COMO TEXTO), NO EL CORREO.
    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
        gen_random_uuid(), new_user_id, new_user_id::text, format('{"sub":"%s","email":"%s","name":"Andres Viscusi"}', new_user_id, user_email)::jsonb, 
        'email', now(), now(), now()
    );

    -- Convertir a admin
    INSERT INTO public.user_roles (id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
END;
$$;

-- 7. OPCIONAL: CONFIGURACIÓN DE ALMACENAMIENTO PARA REPORTES PDF
-- Esto creará un "Bucket" donde se guardarán los archivos generados y la columna para su link.

-- Agregar columna 'pdf_url' a tu tabla de auditorías si no existe
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Crear el bucket público (asegúrate de que el esquema "storage" exista en Supabase)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit_reports', 'audit_reports', true)
ON CONFLICT (id) DO NOTHING;

-- Borramos las políticas si ya existen para evitar errores al volver a correr el script
DROP POLICY IF EXISTS "Users can upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Public read for reports" ON storage.objects;

-- Dar permisos para que los usuarios logueados suban Pdfs a su carpeta
CREATE POLICY "Users can upload reports" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audit_reports' AND auth.role() = 'authenticated');

-- Dar permisos para que cualquiera pueda leer/descargar el PDF generado
CREATE POLICY "Public read for reports" ON storage.objects
    FOR SELECT USING (bucket_id = 'audit_reports');
