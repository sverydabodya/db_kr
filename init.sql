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
    model_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
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

-- Зв'язки (Змінено на ON DELETE RESTRICT)
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
INSERT INTO public.users (login, password_hash)
VALUES ('admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW')
ON CONFLICT DO NOTHING;

-- Додаємо формфактори
INSERT INTO public.form_factors (form_factor_name, description) VALUES
('DIMM', 'Стандартний формфактор для настільних ПК'),
('SO-DIMM', 'Компактний формфактор для ноутбуків та міні-ПК'),
('LRDIMM', 'Серверний формфактор зі зниженим навантаженням на шину')
ON CONFLICT DO NOTHING;

-- Додаємо типи пам'яті (разом із новим DDR3L)
INSERT INTO public.memory_types (type_name, default_voltage, description) VALUES
('DDR3', 1.50, 'Застарілий стандарт пам''яті'),
('DDR3L', 1.35, 'Енергоефективна версія DDR3 для ноутбуків'),
('DDR4', 1.20, 'Найпопулярніший сучасний стандарт'),
('DDR5', 1.10, 'Новітній стандарт з підвищеною пропускною здатністю')
ON CONFLICT DO NOTHING;

-- Додаємо виробників (всі унікальні бренди з твого JSON)
INSERT INTO public.manufacturers (name) VALUES
('Kingston'), ('Samsung'), ('G.Skill'), ('Apacer'),
('Goodram'), ('Patriot'), ('OEM'), ('ATRIA'),
('HP'), ('SK Hynix'), ('Hynix'), ('Crucial'),
('Team'), ('Corsair')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. ЗАВАНТАЖЕННЯ РЕАЛЬНИХ ДАНИХ КАТАЛОГУ
-- ==========================================
INSERT INTO public.ram_models 
(manufacturer_id, type_id, form_factor_id, model_name, capacity_gb, frequency_mhz, image_url) 
VALUES
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury DDR4-3200 32768 MB PC4-25600 (Kit of 2x16384) Beast Black (KF432C16BB1K2/32)', 32, 3200, '/uploads/images/img-1793218888629-7815.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston FURY DDR5-6000 32768MB PC5-48000 (Kit of 2x16384) Beast Black (KF560C36BBE2K2-32)', 32, 6000, '/uploads/images/img-1793218889018-1860.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна пам’ять Kingston Fury DDR4-3200 16384MB PC4-25600 (Kit of 2x8192) Beast Black (KF432C16BBK2/16)', 16, 3200, '/uploads/images/img-1793218889368-3399.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston Fury DDR4-3600 32768 MB PC4-28800 (Kit of 2x16384) Beast Black (KF436C18BBK2/32)', 32, 3600, '/uploads/images/img-1793218889733-4126.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston FURY DDR5-5600 32768MB PC5-44800 (Kit of 2x16384) Beast AM5 Black (KF556C36BBEK2-32)', 32, 5600, '/uploads/images/img-1793218890089-2310.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Kingston Fury SODIMM DDR4-3200 32768 MB PC4-25600 (Kit of 2x16384) Impact Black (KF432S20IBK2/32)', 32, 3200, '/uploads/images/img-1793218890443-4752.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Samsung 16GB DDR4 2666MHz SO-DIMM , Non-ECC, Unbuffered, 1.2V (M471A2K43DB1-CTD)', 16, 2666, '/uploads/images/img-1793218890808-4773.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston Fury DDR4-3200 8192 MB PC4-25600 Beast Black (KF432C16BB/8)', 8, 3200, '/uploads/images/img-1793218891163-8139.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять G.Skill DDR4-3200 16384MB PC4-17000 (Kit of 2x8192) Aegis (F4-3200C16D-16GIS)', 16, 3200, '/uploads/images/img-1793218891512-7480.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять G.Skill DDR4-3600 16384MB PC4-28800 (Kit of 2x8192) Ripjaws V (F4-3600C18D-16GVK)', 16, 3600, '/uploads/images/img-1793218891874-1924.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Apacer'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Apacer DDR5-5200 32768MB PC5-41600 (Kit of 2x16384) NOX (AH5U32G52C522MBAA-2)', 32, 5200, '/uploads/images/img-1793218892234-4234.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Goodram'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Goodram DDR5-6000 32768MB PC5-48000 (Kit of 2x16384) IRDM Black (IR-6000D564L30S/32GDC)', 32, 6000, '/uploads/images/img-1793218892591-7649.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston FURY DDR5-5600 32768MB PC5-44800 (Kit of 2x16384) Beast RGB AM5 Black (KF556C36BBEAK2-32)', 32, 5600, '/uploads/images/img-1793218892940-3027.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3L'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Samsung 8GB DDR3L SO-DIMM 1600MHz CL11 1.35V (M471B1G73DB0-YK0) — оперативна пам''ять', 8, 1600, '/uploads/images/img-1793218893289-7868.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury Beast DDR5-6000 16384MB PC5-48000 (Kit of 2x8192) Black (KF560C30BBEK2-16)', 16, 6000, '/uploads/images/img-1793218893645-8554.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury Beast DDR5-6000 RGB 32768MB PC5-48000 (Kit of 2x16384) Black (KF560C36BBE2AK2-32)', 32, 6000, '/uploads/images/img-1793218893996-6526.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury DDR5-5600 16384MB PC5-44800 Beast Black (KF556C40BB-16)', 16, 5600, '/uploads/images/img-1793218894346-3228.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Patriot'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Patriot DDR4-3200 8192MB PC4-25600 Signature Line (PSD48G320081)', 8, 3200, '/uploads/images/img-1793218894694-3548.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Оперативна памʼять Kingston Fury SODIMM DDR4-3200 16384 MB PC4-25600 Impact Black (KF432S20IB/16)', 16, 3200, '/uploads/images/img-1793218895045-5869.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Оперативна памʼять Kingston Kingston Fury SODIMM DDR5-4800 32768MB PC5-38400 (Kit of 2x16384) Impact Black (KF548S38IBK2-32)', 32, 4800, '/uploads/images/img-1793218895401-5980.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Samsung 16 GB SO-DIMM DDR4 3200 MHz (M471A2K43DB1-CWE)', 16, 3200, '/uploads/images/img-1793218895755-3056.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять G.Skill DDR4-3200 16384MB PC4-25600 (Kit of 2x8192) Ripjaws V (F4-3200C16D-16GVKB)', 16, 3200, '/uploads/images/img-1793218896116-4735.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury Beast DDR5-6000 32768MB PC5-48000 (Kit of 2x16384) Black (KF560C30BBEK2-32)', 32, 6000, '/uploads/images/img-1793218896490-7121.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston Fury DDR4-3200 16384 MB PC4-25600 Beast Black (KF432C16BB1/16)', 16, 3200, '/uploads/images/img-1793218896843-1933.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury DDR4-3200 32768 MB PC4-25600 (Kit of 2x16384) Beast Black (KF432C16BBK2/32)', 32, 3200, '/uploads/images/img-1793218897191-4118.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'OEM'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3L'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'DDR3L 1600 8Gb  PC3L-12800s SoDIMM 1.35v CYBORG CB16D3LS11/8 (776735)', 8, 2666, '/uploads/images/img-1793218897552-7294.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'ATRIA'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3L'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'ATRIA SODIMM DDR3L-1600 8192MB PC3-12800 (UAT31600CL11SLK1/8)', 8, 1600, '/uploads/images/img-1793218897908-9061.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'OEM'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'SSD  M.2 2280 IXUR 512G NVME', 8, 2666, '/uploads/images/img-1793218898267-1393.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Пам''ять Samsung 16 GB SO-DIMM DDR4 3200 MHz (M471A2K43DB1-CWE)', 16, 3200, '/uploads/images/img-1793218898615-9143.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'OEM'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'DDR3-1866 8Gb PC3-14900 1.5V HyperX Fury Blue HX318C10F/8 8192MB (7708669)', 8, 1866, '/uploads/images/img-1793218898980-2581.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Пам''ять Samsung 8GB SO-DIMM DDR4 3200 MHz (M471A1K43EB1-CWE)', 8, 3200, '/uploads/images/img-1793218899336-5132.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'SoDIMM DDR5 16GB 4800 MHz FURY Impact Kingston Fury (ex.HyperX) (KF548S38IB-16)', 16, 4800, '/uploads/images/img-1793218899700-5259.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Пам''ять Kingston 16 GB SO-DIMM DDR4 3200 MHz (KVR32S22S8/16)', 16, 3200, '/uploads/images/img-1793218900053-5921.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Crucial'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Crucial SODIMM DDR5-5600 16384MB PC5-44800 (CT16G56C46S5)', 16, 5600, '/uploads/images/img-1793218900414-3474.png'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'SK Hynix'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'SK Hynix 8GB DDR4 2400MHz SODIMM , Non-ECC, Unbuffered, 1.2V (HMA81GS6AFR8N-UH)', 8, 2400, '/uploads/images/img-1793218900785-3221.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Samsung SODIMM DDR4 16Gb 2666MHz PC4-21300 (M471A2K43CB1-CTD)', 16, 2666, '/uploads/images/img-1793218901141-8881.png'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'OEM'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3L'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'DDR3L-1600 8Gb SODIMM PC3L-12800 1.35V KVR16LS11/8 8192MB (7708559)', 8, 1600, '/uploads/images/img-1793218901517-8930.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'OEM'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'HyperX DDR4-3200 16384MB PC4-25600 (Kit of 2x8192) Fury Black (HX432C16FB3K2/16)', 16, 3200, '/uploads/images/img-1793218901876-9247.webp'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury DDR5-5600 16384MB PC5-44800 (Kit of 2x8192) Beast AM5 Black (KF556C36BBEK2-16)', 16, 5600, '/uploads/images/img-1793218902236-8269.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Оперативна памʼять Kingston Fury SODIMM DDR5-5600 16384MB PC5-44800 Impact 1Rx8 Black (KF556S40IB-16)', 16, 5600, '/uploads/images/img-1793218902590-3203.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston Fury DDR4-3600 65536 MB PC4-28800 (Kit of 2x32768) Beast Black (KF436C18BBK2/64)', 64, 3600, '/uploads/images/img-1793218902945-9839.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'RAM Samsung 8GB DDR4 2400MHz SODIMM , Non-ECC, PC4-19200, CL17, 1.2V (M471A1K43CB1-CRC)', 8, 2400, '/uploads/images/img-1793218903305-5736.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Пам''ять Samsung 8GB SO-DIMM DDR4 2400 MHz (M471A1K43CB1-CRC) OEM', 8, 2400, '/uploads/images/img-1793218903667-1644.png'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'OEM'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'DDR3-1600 8Gb PC3-12800 KVR16N11/8 black 8192MB (5103082)', 8, 1600, '/uploads/images/img-1793218904046-8801.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston Fury DDR5-5200 16384MB PC5-41600 (Kit of 2x8192) Beast Black (KF552C40BBK2-16)', 16, 5200, '/uploads/images/img-1793218904415-9067.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна пам’ять G.Skill DDR4-3200 32768MB PC4-25600 (Kit of 2x16384) Aegis (F4-3200C16D-32GIS)', 32, 3200, '/uploads/images/img-1793218904768-1066.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury Beast DDR5-6000 16384MB PC5-48000 Black (KF560C30BBE-16)', 16, 6000, '/uploads/images/img-1793218905125-8316.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'HP'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'HP SODIMM DDR4 16Gb 3200MHz PC4-25600 (L71647-001)', 16, 3200, '/uploads/images/img-1793218905473-5808.png'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'RAM Samsung 16GB DDR4 3200MHz SODIMM , Non-ECC, Unbuffered, CL22, 1.2V (M471A2G43AB2-CWE)', 16, 3200, '/uploads/images/img-1793218905843-5020.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Модуль пам`ятi SO-DIMM DDR5 2x32GB/5600 Kingston Fury Impact (KF556S40IBK2-64)', 32, 2666, '/uploads/images/img-1793218906215-2616.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Оперативна памʼять Kingston Fury SODIMM DDR5-5600 32768MB PC5-44800 (Kit of 2x16384) Impact 1Rx8 Black (KF556S40IBK2-32)', 32, 5600, '/uploads/images/img-1793218906580-9034.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury DDR5 16Gb (2x8) Beast 5600MHz (KF556C40BBK2-16)', 16, 5600, '/uploads/images/img-1793218906945-7891.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Hynix'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'SO-DIMM DDR4 8GB HYNIX ORIGINAL 2400 MHz, CL17, 1.2 V (HMA81GS6AFR8N-UH)', 8, 2400, '/uploads/images/img-1793218907299-5492.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'оперативна пам''ять Samsung DDR4 16GB 2666MHz SO-DIMM 2Rx8 PC4-2666V (M471A2K43DB1-CTD)', 16, 2666, '/uploads/images/img-1793218907660-1284.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Оперативна памʼять Kingston SODIMM DDR4-3200 8192 MB PC4-25600 (KVR32S22S8/8)', 8, 3200, '/uploads/images/img-1793218908027-3918.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3L'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Samsung DDR3L 8GB 1600MHz SO-DIMM  (M471B1G73QH0-YK0)', 8, 1600, '/uploads/images/img-1793218908383-5199.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'ATRIA'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'ATRIA DDR4-3200 8192MB PC4-25600 (UAT43200CL22K1/8)', 8, 3200, '/uploads/images/img-1793218908744-6270.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'оперативна пам''ять Samsung DDR4 16GB 3200MHz SO-DIMM 1Rx8 PC4-3200AA (M471A2G43AB2-CWE)', 16, 3200, '/uploads/images/img-1793218909105-7667.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'DDR4 8 Gb (3200 MHz) G.SKILL Aegis (F4-3200C16S-8GIS)', 8, 3200, '/uploads/images/img-1793218909462-6043.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Kingston Fury Beast DDR5-6000 RGB 32768MB PC5-48000 (Kit of 2x16384) Black (KF560C30BBAK2-32)', 32, 6000, '/uploads/images/img-1793218909812-5815.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Kingston DDR4-3200 16384MB PC4-25600 (KVR32N22D8/16)', 16, 3200, '/uploads/images/img-1793218910162-5724.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Team'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна памʼять Team Elite DDR4-3200 8192MB PC4-25600 (TED48G3200C2201)', 8, 3200, '/uploads/images/img-1793218910513-9075.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'DDR4 G.Skill Trident Z RGB 2x16GB 3600 MHz (F4-3600C18D-32GTZR) [102453]', 16, 3600, '/uploads/images/img-1793218910865-6341.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'G.Skill'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна пам’ять G.Skill DDR4-3200 16384MB PC4-17000 Aegis (F4-3200C16S-16GIS)', 16, 3200, '/uploads/images/img-1793218911226-3130.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'OEM'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR3'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'DIMM'), 'Оперативна пам’ять Golden Memory DDR3-1333 4096MB PC3-10600 (GM1333D3N9/4G)', 4, 1333, '/uploads/images/img-1793218911575-1380.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Hynix'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Hynix SODIMM DDR4 16Gb 2666MHz PC4-21300 (HMA82GS6JJR8N-VK)', 16, 2666, '/uploads/images/img-1793218911933-3258.png'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Samsung'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR4'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Пам''ять Samsung 16 GB SO-DIMM DDR4 3200 MHz (M471A2K43EB1-CWE)', 16, 3200, '/uploads/images/img-1793218912303-1900.jpg'),
((SELECT manufacturer_id FROM public.manufacturers WHERE name = 'Kingston'), (SELECT type_id FROM public.memory_types WHERE type_name = 'DDR5'), (SELECT form_factor_id FROM public.form_factors WHERE form_factor_name = 'SO-DIMM'), 'Оперативна памʼять Kingston SODIMM DDR5-5600 32768MB PC5-44800 ValueRAM (KVR56S46BD8-32)', 32, 5600, '/uploads/images/img-1793218912661-9687.jpg')
ON CONFLICT DO NOTHING;

COMMIT;