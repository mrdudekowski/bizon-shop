import type { Migration } from "../migrationRunner";

export const syncTireWheelCharacteristicsMigration: Migration = {
  version: "202610260019",
  description: "Synchronize tire and wheel specification columns, seed forged wheel variants, and refresh stale catalog drafts",
  sql: `
    ALTER TABLE tire_models_application_types
      ALTER COLUMN value TYPE varchar USING value::text;

    UPDATE tire_models_application_types
    SET value = CASE value
      WHEN 'long-haul' THEN 'long_haul'
      WHEN 'off-road' THEN 'off_road'
      ELSE value
    END
    WHERE value IN ('long-haul', 'off-road');

    UPDATE tire_variants
    SET
      size = COALESCE(NULLIF(BTRIM(size), ''), size_normalized),
      size_normalized = COALESCE(NULLIF(BTRIM(size_normalized), ''), size),
      rim_diameter = COALESCE(rim_diameter, rim_diameter_in),
      load_index = COALESCE(NULLIF(BTRIM(load_index), ''), load_index_single::text),
      speed_index = COALESCE(NULLIF(BTRIM(speed_index), ''), speed_symbol::text),
      ply_rating = COALESCE(NULLIF(BTRIM(ply_rating), ''), ply_rating_pr::text),
      overall_diameter = COALESCE(overall_diameter, overall_diameter_mm),
      section_width = COALESCE(section_width, section_width_mm),
      recommended_rim = COALESCE(NULLIF(BTRIM(recommended_rim), ''), standard_rim_in::text)
    WHERE
      size IS NULL OR BTRIM(size) = ''
      OR rim_diameter IS NULL
      OR load_index IS NULL OR BTRIM(load_index) = ''
      OR speed_index IS NULL OR BTRIM(speed_index) = ''
      OR ply_rating IS NULL OR BTRIM(ply_rating) = ''
      OR overall_diameter IS NULL
      OR section_width IS NULL
      OR recommended_rim IS NULL OR BTRIM(recommended_rim) = '';

    UPDATE tire_models
    SET
      series = COALESCE(NULLIF(BTRIM(series), ''), 'BIZON TBR'),
      tread_type = CASE
        WHEN NULLIF(BTRIM(tread_type), '') IS NOT NULL THEN tread_type
        WHEN slug = 'dsr158' THEN 'Магистральный тяговый'
        WHEN slug = 'dsr177' THEN 'Карьерный повышенной проходимости'
        WHEN slug = 'dsr188' THEN 'Региональный универсальный'
        WHEN slug IN ('dld816', 'dsr08a', 'dld815', 'dld809', 'dsrd22') THEN 'Тяговый ведущий'
        WHEN slug IN ('dsr118', 'tax106', 'ttx108') THEN 'Прицепной магистральный'
        WHEN slug IN ('dwd100') THEN 'Зимний фрикционный'
        WHEN slug IN ('fio628', 'dsr830') THEN 'Внедорожный глубокий'
        ELSE 'Универсальный региональный'
      END
    WHERE series IS NULL OR BTRIM(series) = '' OR tread_type IS NULL OR BTRIM(tread_type) = '';

    INSERT INTO tire_models_selection_axles ("order", parent_id, value)
    SELECT p."order", p.parent_id, p.value::text::enum_tire_models_selection_axles
    FROM tire_models_positions p
    WHERE p.value::text IN ('steer', 'drive', 'trailer')
      AND NOT EXISTS (
        SELECT 1
        FROM tire_models_selection_axles a
        WHERE a.parent_id = p.parent_id AND a.value::text = p.value::text
      );

    UPDATE wheel_models
    SET fitment_notes = CASE slug
      WHEN 'atlas' THEN 'Изготавливается под параметры ступицы и тормозной системы внедорожника. Доступны сверловки 5×127, 6×139.7 и 5×150.'
      WHEN 'nomad' THEN 'Экспедиционная серия с усиленным ободом под резину повышенного профиля A/T и M/T. Сверловки 5×127 и 6×139.7.'
      WHEN 'ember' THEN 'Производительная кованая геометрия с оптимизированным весом и зазором под многопоршневые суппорты.'
      WHEN 'bastion' THEN 'Усиленная архитектура для рамных внедорожников и пикапов с повышенной осевой нагрузкой.'
      ELSE fitment_notes
    END
    WHERE (fitment_notes IS NULL OR BTRIM(fitment_notes) = '')
      AND slug IN ('atlas', 'nomad', 'ember', 'bastion');

    INSERT INTO wheel_variants (
      wheel_model_id, sort_order, size_label, sku, diameter, width, bolt_holes,
      pcd, pcd_mm, offset_e_t, center_bore, load_rating, weight, color, finish,
      fastener_type, fastener_material, compatible_tire_sizes, source_specification,
      available, price_on_request, status, published_at, updated_at, created_at
    )
    SELECT
      wm.id,
      v.sort_order,
      v.size_label,
      v.sku,
      v.diameter,
      v.width,
      v.bolt_holes,
      v.pcd,
      v.pcd_mm,
      v.offset_e_t,
      v.center_bore,
      v.load_rating,
      v.weight,
      v.color,
      v.finish,
      v.fastener_type,
      v.fastener_material,
      v.compatible_tire_sizes,
      v.source_specification,
      true,
      true,
      'published',
      now(),
      now(),
      now()
    FROM wheel_models wm
    JOIN (
      VALUES
        ('atlas', 0, '18×9', 'BZN-ATL-1890-6139', 18::numeric, 9::numeric, 6::numeric, '6×139.7', 139.7::numeric, 12::numeric, 106.1::numeric, '1150 кг', 11.4::numeric, 'Satin Black', 'Матовый чёрный с фрезеровкой канта', 'Коническая гайка M12×1.5', 'Кованая сталь 10.9', '275/65 R18, 285/65 R18', '18×9J PCD 6×139.7 ET12 DIA 106.1 (Land Cruiser / Prado / Hilux)'),
        ('atlas', 1, '20×9.5', 'BZN-ATL-2095-6135', 20::numeric, 9.5::numeric, 6::numeric, '6×135', 135::numeric, 18::numeric, 93.1::numeric, '1200 кг', 12.6::numeric, 'Machined Silver', 'Алмазная проточка / матовый лак', 'Коническая гайка M14×1.5', 'Кованая сталь 10.9', '275/55 R20, 285/55 R20', '20×9.5J PCD 6×135 ET18 DIA 93.1 (Land Cruiser 300 / GX 550)'),
        ('nomad', 0, '17×8.5', 'BZN-NMD-1785-5127', 17::numeric, 8.5::numeric, 5::numeric, '5×127', 127::numeric, 0::numeric, 71.6::numeric, '1100 кг', 10.8::numeric, 'Bronze', 'Сатиновая бронза с защитным лаком', 'Коническая гайка M14×1.5', 'Кованая сталь 10.9', '285/70 R17, 315/70 R17, 35×12.5 R17', '17×8.5J PCD 5×127 ET0 DIA 71.6 (Jeep Wrangler JL Rubicon / Gladiator JT)'),
        ('nomad', 1, '18×9', 'BZN-NMD-1890-6139', 18::numeric, 9::numeric, 6::numeric, '6×139.7', 139.7::numeric, 15::numeric, 100.1::numeric, '1150 кг', 11.5::numeric, 'Bronze', 'Сатиновая бронза с защитным лаком', 'Конический болт / гайка', 'Кованая сталь 10.9', '265/65 R18, 285/60 R18', '18×9J PCD 6×139.7 ET15 DIA 100.1 (TANK 300 / пикапы)'),
        ('ember', 0, '18×9', 'BZN-EMB-1890-6139', 18::numeric, 9::numeric, 6::numeric, '6×139.7', 139.7::numeric, 20::numeric, 93.1::numeric, '1100 кг', 11.1::numeric, 'Crimson Red', 'Анодированный красный / глянцевый лак', 'Коническая гайка M12×1.5', 'Титан / кованая сталь', '285/70 R18, 35×12.5 R18', '18×9J PCD 6×139.7 ET20 DIA 93.1 (Ford Bronco VI)'),
        ('ember', 1, '19×9.5', 'BZN-EMB-1995-5114', 19::numeric, 9.5::numeric, 5::numeric, '5×114.3', 114.3::numeric, 22::numeric, 66.1::numeric, '850 кг', 9.4::numeric, 'Crimson Red', 'Многослойный металлик / фрезеровка спиц', 'Коническая гайка M12×1.25', 'Кованый титан Gr5', '255/35 R19, 265/35 R19', '19×9.5J PCD 5×114.3 ET22 DIA 66.1 (Sport / Skyline GT-R)'),
        ('bastion', 0, '17×8.5', 'BZN-BST-1785-6139', 17::numeric, 8.5::numeric, 6::numeric, '6×139.7', 139.7::numeric, 10::numeric, 100.1::numeric, '1200 кг', 11.2::numeric, 'Dark Graphite', 'Тёмный графит с имитацией бедлока', 'Коническая гайка M14×1.5', 'Кованая сталь 10.9', '265/70 R17, 285/70 R17', '17×8.5J PCD 6×139.7 ET10 DIA 100.1 (TANK 300 / TANK 500)'),
        ('bastion', 1, '20×9', 'BZN-BST-2090-6139', 20::numeric, 9::numeric, 6::numeric, '6×139.7', 139.7::numeric, 15::numeric, 106.1::numeric, '1250 кг', 12.8::numeric, 'Dark Graphite', 'Матовый тёмный графит / ЧПУ-фаска', 'Коническая гайка M14×1.5', 'Кованая сталь 10.9', '275/55 R20, 285/50 R20', '20×9J PCD 6×139.7 ET15 DIA 106.1 (Тяжёлые внедорожники)')
    ) AS v(
      model_slug, sort_order, size_label, sku, diameter, width, bolt_holes,
      pcd, pcd_mm, offset_e_t, center_bore, load_rating, weight, color, finish,
      fastener_type, fastener_material, compatible_tire_sizes, source_specification
    ) ON v.model_slug = wm.slug
    WHERE NOT EXISTS (
      SELECT 1 FROM wheel_variants wv WHERE wv.wheel_model_id = wm.id
    );

    DELETE FROM cms_drafts
    WHERE (collection = 'tire-models' AND doc_id IN ('12', '21'))
       OR (collection = 'wheel-models' AND doc_id IN ('1', '3', '4', '5'));
  `,
};
