import fs from 'node:fs';
for (const file of ['src/admin/shop/ShopProductEditor.tsx','src/admin/tires/TireDirectionEditor.tsx','src/admin/tires/TireModelEditor.tsx','src/admin/wheels/WheelModelEditor.tsx']) {
 let s=fs.readFileSync(file,'utf8').replace(/^\s*const blockers = .*PublishBlockers\([^\n]*\);\r?\n/gm,'\n'); fs.writeFileSync(file,s);
}
let page='src/admin/pages/PageEditor.tsx';let s=fs.readFileSync(page,'utf8');s=s.replace('  }, [pageKey]);','  }, [pageKey, setRole]);');fs.writeFileSync(page,s);
