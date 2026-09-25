import fs from 'node:fs';
for (const file of ['src/admin/materials/MaterialEditor.tsx','src/admin/pages/PageEditor.tsx','src/admin/shop/ShopCategoryEditor.tsx','src/admin/shop/ShopProductEditor.tsx','src/admin/tires/TireDirectionEditor.tsx','src/admin/tires/TireModelEditor.tsx','src/admin/wheels/WheelModelEditor.tsx','src/admin/wheels/WheelTypeEditor.tsx']) {
 let s=fs.readFileSync(file,'utf8').replace(/  const blockers = (?:article|shopProduct|tireDirection|tireModel|wheelModel)PublishBlockers\([^\n]+\);\n/g,'').replace(/\}, \[id\]\);/, '}, [id, setRole]);');
 fs.writeFileSync(file,s);
}
