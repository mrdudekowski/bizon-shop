-- Add the CMS-managed S3 background image for the homepage tire selector.
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS home_selection_entry_image_id integer REFERENCES media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS home_selection_entry_image_alt text;
