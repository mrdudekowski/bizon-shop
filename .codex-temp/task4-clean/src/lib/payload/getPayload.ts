import config from "@payload-config";
import { getPayload as getPayloadClient } from "payload";

/**
 * Server-only Payload Local API instance.
 * Use from Route Handlers, Server Components, and cms layer — never from client code.
 */
export async function getPayload() {
  return getPayloadClient({ config });
}
