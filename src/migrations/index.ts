import { pageEditorialContentMigration } from "./0010-page-editorial-content";
import { shopVariantMediaMigration } from "./0011-shop-variant-media";
import { cmsDocumentLinksMigration } from "./0012-cms-document-links";
import { articleImageIntentMigration } from "./0013-article-image-intent";
import { approvedTireBenefitCopyMigration } from "./0014-approved-tire-benefit-copy";
import { stubHeroContentMigration } from "./0015-stub-hero-content";
import { legalPagesCmsContentMigration } from "./0016-legal-pages-cms-content";
import { shopDeliveryEditorialContentMigration } from "./0017-shop-delivery-editorial-content";
import { imageFocalPositionsMigration } from "./0018-image-focal-position";
import { syncTireWheelCharacteristicsMigration } from "./0019-sync-tire-wheel-characteristics";
import type { Migration } from "../migrationRunner";
import { cmsEditorSchemaMigration } from "./0001-cms-editor-schema";
import { shopCategoryCarouselMigration } from "./0002-shop-category-carousel";
import { shopSubcategoriesMigration } from "./0003-shop-subcategories";
import { mediaObjectMetadataMigration } from "./0004-media-object-metadata";
import { mediaDeletionHistoryMigration } from "./0005-media-deletion-history";
import { mediaReplacementsMigration } from "./0006-media-replacements";
import { passwordResetHistoryMigration } from "./0007-password-reset-history";
import { shopCatalogShowcaseMigration } from "./0008-shop-catalog-showcase";
import { homepageEditorialContentMigration } from "./0009-homepage-editorial-content";

export const MIGRATIONS: readonly Migration[] = [
  cmsEditorSchemaMigration,
  shopCategoryCarouselMigration,
  shopSubcategoriesMigration,
  mediaObjectMetadataMigration,
  mediaDeletionHistoryMigration,
  mediaReplacementsMigration,
  passwordResetHistoryMigration,
  shopCatalogShowcaseMigration,
  homepageEditorialContentMigration,
  pageEditorialContentMigration,
  shopVariantMediaMigration,
  cmsDocumentLinksMigration,
  articleImageIntentMigration,
  approvedTireBenefitCopyMigration,
  stubHeroContentMigration,
  legalPagesCmsContentMigration,
  shopDeliveryEditorialContentMigration,
  imageFocalPositionsMigration,
  syncTireWheelCharacteristicsMigration,
];

export const CURRENT_SCHEMA_VERSION = MIGRATIONS.at(-1)?.version ?? "0";
