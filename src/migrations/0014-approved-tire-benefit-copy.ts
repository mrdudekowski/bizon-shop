import type { Migration } from "../migrationRunner";

export const approvedTireBenefitCopyMigration: Migration = {
  version: "202610220014",
  description: "Replace reviewed tire benefit translation markers with approved Russian copy",
  sql: `
    DO $$
    DECLARE
      marker_count integer;
      title_count integer;
    BEGIN
      SELECT COUNT(*), COUNT(DISTINCT title)
        INTO marker_count, title_count
      FROM tire_models_features
      WHERE description LIKE 'Редакционный перевод:%';

      IF marker_count <> 66 OR title_count <> 17 THEN
        RAISE EXCEPTION 'Expected 66 editorial benefit rows across 17 titles; found % rows across % titles', marker_count, title_count;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM cms_drafts AS draft
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(draft.draft->'features') = 'array' THEN draft.draft->'features' ELSE '[]'::jsonb END
        ) AS feature
        WHERE draft.collection = 'tire-models'
          AND feature->>'description' LIKE 'Редакционный перевод:%'
          AND feature->>'title' NOT IN (
            'Безопасность', 'Восстанавливаемость', 'Высокая грузоподъёмность', 'Высокий пробег',
            'Износостойкость', 'Короткий тормозной путь', 'Низкий уровень шума',
            'Низкое сопротивление качению', 'Самоочищение', 'Стойкость к порезам',
            'Стойкость к проколам', 'Стойкость к разрывам', 'Сцепление на мокрой дороге',
            'Теплоотвод', 'Удаление камней', 'Управляемость', 'Экономичность'
          )
      ) THEN
        RAISE EXCEPTION 'Found an unmapped editorial benefit marker in a tire model draft';
      END IF;
    END $$;

    UPDATE tire_models_features AS feature
    SET description = approved.description
    FROM (VALUES
      ('Безопасность', 'Помогает сохранять контроль над автомобилем в движении.'),
      ('Восстанавливаемость', 'Каркас шины подходит для восстановления протектора при соблюдении технологии.'),
      ('Высокая грузоподъёмность', 'Надёжная работа при перевозке тяжёлых грузов.'),
      ('Высокий пробег', 'Шина рассчитана на длительный срок службы.'),
      ('Износостойкость', 'Материалы и рисунок протектора помогают замедлить износ.'),
      ('Короткий тормозной путь', 'Рисунок протектора способствует эффективному торможению.'),
      ('Низкий уровень шума', 'Снижает шум во время движения и делает поездку комфортнее.'),
      ('Низкое сопротивление качению', 'Шина тратит меньше энергии на качение.'),
      ('Самоочищение', 'Рисунок протектора помогает шине очищаться от загрязнений во время движения.'),
      ('Стойкость к порезам', 'Протектор помогает защитить шину от порезов и сколов.'),
      ('Стойкость к проколам', 'Помогает избежать проколов и сохранить шину в рабочем состоянии.'),
      ('Стойкость к разрывам', 'Помогает сохранять целостность шины при нагрузках.'),
      ('Сцепление на мокрой дороге', 'Помогает сохранять контроль над автомобилем во время дождя.'),
      ('Теплоотвод', 'Отводит излишнее тепло и помогает шине работать стабильно.'),
      ('Удаление камней', 'Канавки протектора помогают выводить камни и защищают шину от повреждений.'),
      ('Управляемость', 'Шина помогает сохранять устойчивость и точность управления.'),
      ('Экономичность', 'Шина помогает снизить расход топлива.')
    ) AS approved(title, description)
    WHERE feature.title = approved.title
      AND feature.description LIKE 'Редакционный перевод:%';

    UPDATE cms_drafts AS draft
    SET draft = jsonb_set(
      draft.draft,
      '{features}',
      (
        SELECT COALESCE(jsonb_agg(
          CASE
            WHEN feature->>'description' LIKE 'Редакционный перевод:%'
              THEN jsonb_set(feature, '{description}', to_jsonb(approved.description))
            ELSE feature
          END
          ORDER BY feature_order
        ), '[]'::jsonb)
        FROM jsonb_array_elements(draft.draft->'features') WITH ORDINALITY AS item(feature, feature_order)
        LEFT JOIN (VALUES
          ('Безопасность', 'Помогает сохранять контроль над автомобилем в движении.'),
          ('Восстанавливаемость', 'Каркас шины подходит для восстановления протектора при соблюдении технологии.'),
          ('Высокая грузоподъёмность', 'Надёжная работа при перевозке тяжёлых грузов.'),
          ('Высокий пробег', 'Шина рассчитана на длительный срок службы.'),
          ('Износостойкость', 'Материалы и рисунок протектора помогают замедлить износ.'),
          ('Короткий тормозной путь', 'Рисунок протектора способствует эффективному торможению.'),
          ('Низкий уровень шума', 'Снижает шум во время движения и делает поездку комфортнее.'),
          ('Низкое сопротивление качению', 'Шина тратит меньше энергии на качение.'),
          ('Самоочищение', 'Рисунок протектора помогает шине очищаться от загрязнений во время движения.'),
          ('Стойкость к порезам', 'Протектор помогает защитить шину от порезов и сколов.'),
          ('Стойкость к проколам', 'Помогает избежать проколов и сохранить шину в рабочем состоянии.'),
          ('Стойкость к разрывам', 'Помогает сохранять целостность шины при нагрузках.'),
          ('Сцепление на мокрой дороге', 'Помогает сохранять контроль над автомобилем во время дождя.'),
          ('Теплоотвод', 'Отводит излишнее тепло и помогает шине работать стабильно.'),
          ('Удаление камней', 'Канавки протектора помогают выводить камни и защищают шину от повреждений.'),
          ('Управляемость', 'Шина помогает сохранять устойчивость и точность управления.'),
          ('Экономичность', 'Шина помогает снизить расход топлива.')
        ) AS approved(title, description) ON approved.title = feature->>'title'
      )
    )
    WHERE draft.collection = 'tire-models'
      AND jsonb_typeof(draft.draft->'features') = 'array'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(draft.draft->'features') AS feature
        WHERE feature->>'description' LIKE 'Редакционный перевод:%'
      );

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM tire_models_features
        WHERE description LIKE 'Редакционный перевод:%'
      ) THEN
        RAISE EXCEPTION 'Editorial benefit markers remain in tire_models_features after copy migration';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM cms_drafts AS draft
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(draft.draft->'features') = 'array' THEN draft.draft->'features' ELSE '[]'::jsonb END
        ) AS feature
        WHERE draft.collection = 'tire-models'
          AND feature->>'description' LIKE 'Редакционный перевод:%'
      ) THEN
        RAISE EXCEPTION 'Editorial benefit markers remain in tire model draft overlays after copy migration';
      END IF;
    END $$;
  `,
};
