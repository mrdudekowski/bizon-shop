import { s3ObjectStore } from "./s3ObjectStore";

export type ObjectStore = {
  checkAvailable(): Promise<void>;
  put(input: { key: string; body: Buffer; contentType: string }): Promise<void>;
  delete(input: { key: string }): Promise<void>;
};

let override: ObjectStore | null = null;

/** ponytail: module override for vitest; HTTP layer can pass a store later if tests get an injection seam. */
export function setObjectStoreForTests(store: ObjectStore | null) {
  override = store;
}

export function getObjectStore(): ObjectStore {
  return override ?? s3ObjectStore();
}
