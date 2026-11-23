import type { Server } from "node:http";

export function createStaticExportServer(options?: { directory?: string }): Server;
