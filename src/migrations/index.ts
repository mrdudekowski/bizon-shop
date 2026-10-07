import type { Migration } from "../migrationRunner";
import { cmsEditorSchemaMigration } from "./0001-cms-editor-schema";
import { shopCategoryCarouselMigration } from "./0002-shop-category-carousel";
import { shopSubcategoriesMigration } from "./0003-shop-subcategories";
import { mediaObjectMetadataMigration } from "./0004-media-object-metadata";
import { mediaDeletionHistoryMigration } from "./0005-media-deletion-history";
import { mediaReplacementsMigration } from "./0006-media-replacements";
import { passwordResetHistoryMigration } from "./0007-password-reset-history";
import { shopCatalogShowcaseMigration } from "./0008-shop-catalog-showcase";

export const MIGRATIONS: readonly Migration[] = [
  cmsEditorSchemaMigration,
  shopCategoryCarouselMigration,
  shopSubcategoriesMigration,
  mediaObjectMetadataMigration,
  mediaDeletionHistoryMigration,
  mediaReplacementsMigration,
  passwordResetHistoryMigration,
  shopCatalogShowcaseMigration,
];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS.at(-1)?.version ?? "0";
