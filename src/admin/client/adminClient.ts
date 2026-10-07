import type {
  AdminSession,
  AdminUser,
  ArticleDraft,
  ChangeSet,
  ChangeSetStatus,
  DocumentStatus,
  EditorCapability,
  EntityRecord,
  MediaListItem,
  MediaDeletionHistoryItem,
  PasswordResetHistoryItem,
  PageDraft,
  PageKey,
  ShopCategoryDraft,
  ShopProductDraft,
  ShopSubcategoryDraft,
  StatusEntity,
  TireDirection,
  TireDirectionDraft,
  TireModelDraft,
  TireModelListItem,
  TireModelRecord,
  WheelModelDraft,
  WheelTypeDraft,
} from "@/admin/domain/types";

export type AdminClient = {
  changeDocumentStatus(entity: StatusEntity, id: string, status: DocumentStatus): Promise<unknown>;
  login(login: string, password: string): Promise<AdminSession>;
  logout(): Promise<void>;
  getSession(): Promise<AdminSession>;
  listTireDirections(): Promise<TireDirection[]>;
  createTireDirection(input: { name: string }): Promise<EntityRecord<TireDirectionDraft>>;
  getTireDirection(id: string): Promise<EntityRecord<TireDirectionDraft>>;
  saveTireDirection(id: string, draft: TireDirectionDraft): Promise<EntityRecord<TireDirectionDraft>>;
  publishTireDirection(id: string): Promise<EntityRecord<TireDirectionDraft>>;
  hideTireDirection(id: string): Promise<EntityRecord<TireDirectionDraft>>;
  deleteTireDirection(id: string): Promise<void>;
  createAsset(file: { name: string; mimeType: string; body?: Blob; dataUrl?: string }): Promise<{ id: string }>;
  replaceAsset(id: string, file: { name: string; mimeType: string; body?: Blob; dataUrl?: string }): Promise<{ id: string; replacementAssetId: string }>;
  cancelAssetReplacement(id: string): Promise<void>;
  listTireModels(): Promise<TireModelListItem[]>;
  getTireModel(id: string): Promise<TireModelRecord>;
  createTireModel(input: { name: string; directionId: string }): Promise<TireModelRecord>;
  saveTireModel(id: string, draft: TireModelDraft): Promise<TireModelRecord>;
  publishTireModel(id: string): Promise<TireModelRecord>;
  hideTireModel(id: string): Promise<TireModelRecord>;
  deleteTireModel(id: string): Promise<void>;
  listWheelTypes(): Promise<EntityRecord<WheelTypeDraft>[]>;
  getWheelType(id: string): Promise<EntityRecord<WheelTypeDraft>>;
  createWheelType(input: { name: string }): Promise<EntityRecord<WheelTypeDraft>>;
  saveWheelType(id: string, draft: WheelTypeDraft): Promise<EntityRecord<WheelTypeDraft>>;
  publishWheelType(id: string): Promise<EntityRecord<WheelTypeDraft>>;
  hideWheelType(id: string): Promise<EntityRecord<WheelTypeDraft>>;
  deleteWheelType(id: string): Promise<void>;
  listWheelModels(): Promise<
    { id: string; name: string; typeName: string; wheelTypeId: string; imageAssetId: string | null; status: DocumentStatus; hasUnpublishedDraft: boolean }[]
  >;
  createWheelModel(input: { name: string; wheelTypeId: string }): Promise<EntityRecord<WheelModelDraft>>;
  getWheelModel(id: string): Promise<EntityRecord<WheelModelDraft>>;
  saveWheelModel(id: string, draft: WheelModelDraft): Promise<EntityRecord<WheelModelDraft>>;
  publishWheelModel(id: string): Promise<EntityRecord<WheelModelDraft>>;
  hideWheelModel(id: string): Promise<EntityRecord<WheelModelDraft>>;
  deleteWheelModel(id: string): Promise<void>;
  listShopCategories(): Promise<EntityRecord<ShopCategoryDraft>[]>;
  getShopCategory(id: string): Promise<EntityRecord<ShopCategoryDraft>>;
  createShopCategory(input: { name: string }): Promise<EntityRecord<ShopCategoryDraft>>;
  saveShopCategory(id: string, draft: ShopCategoryDraft): Promise<EntityRecord<ShopCategoryDraft>>;
  publishShopCategory(id: string): Promise<EntityRecord<ShopCategoryDraft>>;
  hideShopCategory(id: string): Promise<EntityRecord<ShopCategoryDraft>>;
  deleteShopCategory(id: string): Promise<void>;
  listShopSubcategories(categoryId: string): Promise<ShopSubcategoryDraft[]>;
  createShopSubcategory(input: { categoryId: string; name: string; slug: string }): Promise<ShopSubcategoryDraft>;
  saveShopSubcategory(id: string, input: { name: string; slug: string }): Promise<ShopSubcategoryDraft>;
  deleteShopSubcategory(id: string): Promise<void>;
  listShopProducts(): Promise<
    { id: string; name: string; categoryName: string; categoryId: string; categoryPublished: boolean; isPublished: boolean; subcategoryId?: string; imageAssetId: string | null; status: DocumentStatus; hasUnpublishedDraft: boolean }[]
  >;
  createShopProduct(input: { name: string; categoryId: string }): Promise<EntityRecord<ShopProductDraft>>;
  getShopProduct(id: string): Promise<EntityRecord<ShopProductDraft>>;
  saveShopProduct(id: string, draft: ShopProductDraft): Promise<EntityRecord<ShopProductDraft>>;
  publishShopProduct(id: string): Promise<EntityRecord<ShopProductDraft>>;
  hideShopProduct(id: string): Promise<EntityRecord<ShopProductDraft>>;
  deleteShopProduct(id: string): Promise<void>;
  listPages(): Promise<EntityRecord<PageDraft>[]>;
  getPage(key: PageKey): Promise<EntityRecord<PageDraft>>;
  savePage(key: PageKey, draft: PageDraft): Promise<EntityRecord<PageDraft>>;
  publishPage(key: PageKey): Promise<EntityRecord<PageDraft>>;
  resetPage(key: PageKey): Promise<EntityRecord<PageDraft>>;
  listMaterials(): Promise<
    {
      id: string;
      title: string;
      kind: "article";
      imageAssetId: string | null;
      status: DocumentStatus;
      hasUnpublishedDraft: boolean;
    }[]
  >;
  getMaterial(id: string): Promise<EntityRecord<ArticleDraft>>;
  createMaterial(input: { title: string; kind: "article" }): Promise<EntityRecord<ArticleDraft>>;
  saveMaterial(id: string, draft: ArticleDraft): Promise<EntityRecord<ArticleDraft>>;
  publishMaterial(id: string): Promise<EntityRecord<ArticleDraft>>;
  hideMaterial(id: string): Promise<EntityRecord<ArticleDraft>>;
  deleteMaterial(id: string): Promise<void>;
  listAssets(): Promise<MediaListItem[]>;
  deleteAsset(id: string): Promise<void>;
  listMediaDeletionHistory(): Promise<MediaDeletionHistoryItem[]>;
  listUsers(): Promise<AdminUser[]>;
  createUser(input: { login: string; role: AdminUser["role"]; password: string; capabilities?: EditorCapability[] }): Promise<AdminUser>;
  disableUser(id: string): Promise<AdminUser>;
  setUserRole(id: string, role: AdminUser["role"]): Promise<AdminUser>;
  setUserCapabilities(userId: string, capabilities: EditorCapability[]): Promise<AdminUser>;
  resetUserPassword(userId: string, password: string): Promise<void>;
  listPasswordResetHistory(): Promise<PasswordResetHistoryItem[]>;
  listChangeSets(filter?: { status?: ChangeSetStatus; authorUserId?: string }): Promise<ChangeSet[]>;
  getChangeSet(id: string): Promise<ChangeSet>;
  submitChangeSet(id: string): Promise<ChangeSet>;
  publishChangeSet(id: string): Promise<ChangeSet>;
  returnChangeSet(id: string, comment: string): Promise<ChangeSet>;
  cancelChangeSet(id: string): Promise<ChangeSet>;
  storageNotice(): Promise<string | null>;
};
