import { getPayload } from "payload";
import config from "@payload-config";
import { getPageContent } from "../src/lib/cms/pages/getPageContent.ts";

const payload = await getPayload({ config });
const pages = await payload.find({
  collection: "pages",
  limit: 20,
  depth: 0,
  overrideAccess: true,
});
console.log(
  "docs",
  pages.docs.map((d) => ({ key: d.key, status: d.status, title: d.title })),
);

const home = await getPageContent("home");
const shop = await getPageContent("shop-home");
console.log("home.hero.title", home.hero.title);
console.log("shop.hero.title", shop.hero.title);
console.log("shop.orderSteps", shop.orderSteps.length);
process.exit(0);
