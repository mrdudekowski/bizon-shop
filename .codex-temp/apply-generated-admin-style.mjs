import fs from 'node:fs';
const editors = [
  'tires/TireModelEditor.tsx', 'tires/TireDirectionEditor.tsx',
  'wheels/WheelTypeEditor.tsx', 'wheels/WheelModelEditor.tsx',
  'shop/ShopCategoryEditor.tsx', 'shop/ShopProductEditor.tsx',
  'pages/PageEditor.tsx', 'materials/MaterialEditor.tsx',
];
for (const file of editors) {
  const path = `src/admin/${file}`;
  let text = fs.readFileSync(path, 'utf8');
  text = text.replace('"use client";', '"use client";\n\nimport { BlockNav, DocumentActions, useAdminRole } from "@/admin/ui/DocumentUI";');
  text = text.replace('useState<AdminRole>("admin")', 'useAdminRole()');
  text = text.replace(/\bAdminRole,\s*/g, '');
  // Only the final rendered document, not the loading/error returns.
  text = text.replace(/(<main(?: className=\{styles\.\w+\})?>)(\s*<h1>[\s\S]*?<\/h1>)/g, '<main className="document">$2\n      <BlockNav />');
  text = text.replace(/<h2>Карточка<\/h2>/g, '<h2>Основные данные</h2>').replace(/<h2>Медиа<\/h2>/g, '<h2>Фото</h2>');
  text = text.replace(/\n\s+Slug\n/g, '\n          Адрес\n');
  text = text.replace(/<div className=\{styles\.actions\}>/g, '<DocumentActions>');
  if (file.startsWith('tires/')) text = text.replace(/<div>(\s*<p>Сохранил:)/, '<DocumentActions>$1');
  text = text.replace(/<\/div>(\s*<\/main>\s*\);\s*}\s*)$/, '</DocumentActions>$1');
  fs.writeFileSync(path, text);
}
