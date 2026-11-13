import type { Migration } from "../migrationRunner";

export const responsiveImageFocalPositionsMigration: Migration = {
  version: "202611130039",
  description: "Store independent desktop, tablet, and mobile image focal points",
  sql: `
    ALTER TABLE cms_image_focal_positions
      ADD COLUMN IF NOT EXISTS focal_by_viewport jsonb;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'cms_image_focal_positions'::regclass
          AND conname = 'cms_image_focal_positions_focal_by_viewport_object_check'
      ) THEN
        ALTER TABLE cms_image_focal_positions
          ADD CONSTRAINT cms_image_focal_positions_focal_by_viewport_object_check
          CHECK (focal_by_viewport IS NULL OR jsonb_typeof(focal_by_viewport) = 'object');
      END IF;
    END $$;
  `,
};
