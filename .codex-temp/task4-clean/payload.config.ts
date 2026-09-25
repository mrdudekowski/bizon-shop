import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";

import {
  Media,
  PeopleStories,
  Products,
  Requests,
  ShopCategories,
  TireIQArticles,
  TireModels,
  TireTypes,
  TireVariants,
  WheelModels,
  WheelTypes,
  WheelVariants,
  Users,
} from "./src/collections";
import { validatePayloadEnv } from "./src/lib/payload/validateEnv";
import { getS3StoragePlugin } from "./src/lib/payload/s3StorageConfig";

validatePayloadEnv();

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, "src"),
    },
    meta: {
      titleSuffix: "— BIZON CMS",
    },
    components: {
      views: {
        dashboard: {
          Component: "./payload-admin/CatalogDashboard.tsx#CatalogDashboard",
        },
      },
    },
  },
  collections: [
    Users,
    Media,
    ShopCategories,
    TireTypes,
    TireModels,
    TireVariants,
    WheelTypes,
    WheelModels,
    WheelVariants,
    Products,
    Requests,
    TireIQArticles,
    PeopleStories,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "src/payload-types.ts"),
  },
  db: postgresAdapter({
    push: false,
    pool: {
      connectionString: process.env.TBR_DATABASE_URI || process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  plugins: [getS3StoragePlugin()],
});
