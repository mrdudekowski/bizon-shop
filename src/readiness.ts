import { assertSchemaReady, type SchemaVersionQuery } from "./schemaReadiness";

export async function checkBackendReadiness(query: SchemaVersionQuery): Promise<void> {
  try {
    await query("SELECT 1");
    await assertSchemaReady(query);
  } catch (error) {
    throw new Error("Backend is not ready", { cause: error });
  }
}
