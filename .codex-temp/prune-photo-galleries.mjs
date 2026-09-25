import fs from 'node:fs';
for (const name of ['tires/TireModelEditor.tsx','wheels/WheelModelEditor.tsx','shop/ShopProductEditor.tsx','materials/MaterialEditor.tsx']) {
 const file='src/admin/'+name; let s=fs.readFileSync(file,'utf8');
 const start=s.indexOf('<h3>Галерея</h3>');
 if(start>=0){ const end=s.indexOf('</section>',start); if(end>=0) s=s.slice(0,start)+s.slice(end); }
 const fn=s.indexOf('  function moveGallery(');
 if(fn>=0){ let open=s.indexOf('{',fn), depth=0, end=-1; for(let i=open;i<s.length;i++){if(s[i]==='{')depth++;if(s[i]==='}'&&--depth===0){end=i+1;break;}} if(end>0)s=s.slice(0,fn)+s.slice(end).replace(/^\r?\n/,''); }
 fs.writeFileSync(file,s);
}
