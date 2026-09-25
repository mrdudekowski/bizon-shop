import fs from "fs";
import path from "path";

const orphans = [
  "src/components/Hero",
  "src/components/ProductCarousel",
  "src/components/ProductsSection",
  "src/components/FeaturesSection",
  "src/components/AccessoriesSection",
  "src/components/ApplicationsSection",
  "src/components/ContactSection",
  "src/components/HomeContentSections",
  "src/components/catalog/PlaceholderPage.jsx",
  "src/components/Header",
];

function walk(p) {
  const st = fs.statSync(p);
  if (st.isFile()) return [p];
  return fs.readdirSync(p).flatMap((n) => walk(path.join(p, n)));
}

for (const o of orphans) {
  if (!fs.existsSync(o)) {
    console.log(o, "MISSING");
    continue;
  }
  const files = walk(o).filter((f) => /\.(jsx?|tsx?|css|module\.css)$/.test(f));
  let lines = 0;
  for (const f of files) lines += fs.readFileSync(f, "utf8").split(/\r?\n/).length;
  console.log(`${o}\tfiles=${files.length}\tlines=${lines}`);
}
