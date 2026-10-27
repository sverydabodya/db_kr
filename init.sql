-- Початок транзакції
BEGIN;

-- ==========================================
-- 1. СТВОРЕННЯ ТАБЛИЦЬ
-- ==========================================

CREATE TABLE IF NOT EXISTS public.form_factors
(
    form_factor_id serial NOT NULL,
    form_factor_name character varying(20) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    image_url character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT form_factors_pkey PRIMARY KEY (form_factor_id),
    CONSTRAINT form_factors_form_factor_name_key UNIQUE (form_factor_name)
);

CREATE TABLE IF NOT EXISTS public.manufacturers
(
    manufacturer_id serial NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    country character varying(50) COLLATE pg_catalog."default",
    website character varying(150) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    logo_url character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT manufacturers_pkey PRIMARY KEY (manufacturer_id),
    CONSTRAINT manufacturers_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.memory_types
(
    type_id serial NOT NULL,
    type_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    default_voltage numeric(3, 2) NOT NULL,
    description text COLLATE pg_catalog."default",
    image_url character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT memory_types_pkey PRIMARY KEY (type_id),
    CONSTRAINT memory_types_type_name_key UNIQUE (type_name)
);

CREATE TABLE IF NOT EXISTS public.ram_models
(
    ram_id serial NOT NULL,
    manufacturer_id integer NOT NULL,
    type_id integer NOT NULL,
    form_factor_id integer NOT NULL,
    model_name character varying(150) COLLATE pg_catalog."default" NOT NULL,
    capacity_gb integer NOT NULL,
    frequency_mhz integer NOT NULL,
    cas_latency integer,
    extra_features jsonb DEFAULT '{}'::jsonb,
    description text COLLATE pg_catalog."default",
    image_url character varying(255) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ram_models_pkey PRIMARY KEY (ram_id)
);

CREATE TABLE IF NOT EXISTS public.users
(
    user_id serial NOT NULL,
    login character varying(50) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_login_key UNIQUE (login)
);

-- Зв'язки (Змінено на ON DELETE RESTRICT для захисту від видалення компаній, які мають ОЗП)
ALTER TABLE IF EXISTS public.ram_models
    ADD CONSTRAINT ram_models_form_factor_id_fkey FOREIGN KEY (form_factor_id)
    REFERENCES public.form_factors (form_factor_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.ram_models
    ADD CONSTRAINT ram_models_manufacturer_id_fkey FOREIGN KEY (manufacturer_id)
    REFERENCES public.manufacturers (manufacturer_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.ram_models
    ADD CONSTRAINT ram_models_type_id_fkey FOREIGN KEY (type_id)
    REFERENCES public.memory_types (type_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE RESTRICT;

-- ==========================================
-- 2. ТРИГЕР ДЛЯ АВТООНОВЛЕННЯ updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ram_models_updated_at
BEFORE UPDATE ON public.ram_models
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. ПОЧАТКОВІ ДАНІ (СІДИНГ)
-- ==========================================

-- Додаємо адміністратора (Логін: admin, Пароль: admin)
-- Пароль вже захешований через bcrypt ($2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW = 'admin')
INSERT INTO public.users (login, password_hash)
VALUES ('admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW')
ON CONFLICT DO NOTHING;

-- Додаємо формфактори
INSERT INTO public.form_factors (form_factor_name, description) VALUES
('DIMM', 'Стандартний формфактор для настільних ПК'),
('SO-DIMM', 'Компактний формфактор для ноутбуків та міні-ПК'),
('LRDIMM', 'Серверний формфактор зі зниженим навантаженням на шину')
ON CONFLICT DO NOTHING;

-- Додаємо типи пам'яті
INSERT INTO public.memory_types (type_name, default_voltage, description) VALUES
('DDR3', 1.50, 'Застарілий стандарт пам''яті'),
('DDR4', 1.20, 'Найпопулярніший сучасний стандарт'),
('DDR5', 1.10, 'Новітній стандарт з підвищеною пропускною здатністю')
ON CONFLICT DO NOTHING;

-- Додаємо виробників
INSERT INTO public.manufacturers (name, country, website) VALUES
('Kingston', 'USA', 'https://www.kingston.com'),
('G.Skill', 'Taiwan', 'https://www.gskill.com'),
('Corsair', 'USA', 'https://www.corsair.com'),
('Crucial', 'USA', 'https://www.crucial.com')
ON CONFLICT DO NOTHING;

-- Додаємо кілька моделей ОЗП
INSERT INTO public.ram_models 
(manufacturer_id, type_id, form_factor_id, model_name, capacity_gb, frequency_mhz, cas_latency, extra_features, description) 
VALUES
(
    (SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'),
    (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'),
    (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'),
    'Trident Z5 Neo RGB', 32, 6000, 30,
    '{"has_rgb": true, "profiles": ["EXPO", "XMP 3.0"], "heatsink": "Aluminum"}'::jsonb,
    'Оптимізована пам''ять для AMD Ryzen 7000'
),
(
    (SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'),
    (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'),
    (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'),
    'Fury Impact', 16, 3200, 20,
    '{"has_rgb": false, "profiles": ["PnP"]}'::jsonb,
    'Швидка пам''ять для апгрейду ігрових ноутбуків'
),
(
    (SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Corsair'),
    (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'),
    (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'),
    'Vengeance', 64, 5200, 40,
    '{"has_rgb": false, "profiles": ["XMP 3.0"], "tested_voltage": 1.25}'::jsonb,
    'Надійний комплект для робочих станцій'
);

COMMIT;