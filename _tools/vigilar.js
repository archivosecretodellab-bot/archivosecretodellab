// Chequeos automáticos de salud. Solo lee; nunca muestra datos de personas. Si algo está mal, la corrida falla y GitHub avisa por mail.
const fs=require('fs');const WEB='https://archivosecretodellab.com';const html=fs.readFileSync('index.html','utf8');
const url=(html.match(/SUPA_URL\s*=\s*'([^']+)'/)||[])[1],key=(html.match(/SUPA_KEY\s*=\s*'([^']+)'/)||[])[1];
const fallas=[];const av=(m)=>{console.log('✗ '+m);fallas.push(m)};const ok=(m)=>console.log('✓ '+m);
(async()=>{
 for(const [p,t] of [['/','Archivo Secreto'],['/dj/','DJs del Archivo'],['/dj/siko/','SIKO'],['/sitemap.xml','<urlset'],['/vendor/supabase-2.117.3.js','createClient']]){
  try{const r=await fetch(WEB+p);const b=await r.text();r.ok&&b.includes(t)?ok('web '+p):av('web '+p+' respondió '+r.status)}catch(e){av('web '+p+' no responde')}}
 try{const r=await fetch('https://rdap.verisign.com/com/v1/domain/archivosecretodellab.com');const j=await r.json();const v=(j.events||[]).find(e=>e.eventAction==='expiration');const dias=Math.round((new Date(v.eventDate)-Date.now())/864e5);console.log('Dominio vence: '+v.eventDate.slice(0,10)+' (faltan '+dias+' días)');dias<45?av('el dominio vence en '+dias+' días'):ok('dominio')}catch(e){console.log('? no se pudo leer el vencimiento del dominio')}
 const H={apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact'};
 for(const t of ['djs','reservas','postulaciones_jam','solicitudes_incompletas']){try{const r=await fetch(`${url}/rest/v1/${t}?select=*`,{method:'HEAD',headers:H});const n=(r.headers.get('content-range')||'').split('/')[1];if(r.status>=400)ok(`tabla ${t}: cerrada al público (${r.status})`);else if(n&&n!=='0'&&n!=='*')av(`tabla ${t}: un visitante puede leer ${n} filas`);else ok(`tabla ${t}: un visitante lee 0 filas`)}catch(e){console.log('? tabla '+t+' sin respuesta')}}
 for(const c of ['email','whatsapp','mail','telefono','cumpleanos','nombre_real']){try{const r=await fetch(`${url}/rest/v1/djs_publicos?select=${c}&limit=0`,{headers:{apikey:key,Authorization:'Bearer '+key}});r.status===200?av('djs_publicos deja ver la columna '+c):ok('djs_publicos sin columna '+c)}catch(e){}}
 if(process.env.COMPARAR_BIOS){try{const r=await fetch(`${url}/rest/v1/djs_publicos?select=nombre_artistico,bio`,{headers:{apikey:key,Authorization:'Bearer '+key}});const f=await r.json();console.log('Fichas en la base: '+f.length);const norm=t=>String(t||'').replace(/\s+/g,' ').trim();const con=f.filter(x=>norm(x.bio).length>20);const dif=con.filter(x=>{const m=html.includes(norm(x.bio).slice(0,60).replace(/'/g,"\\'"));return !m});console.log('Con bio cargada en la base: '+con.length+' | distintas a la web: '+dif.length);console.log(dif.map(x=>x.nombre_artistico).slice(0,40).join(', '))}catch(e){console.log('? '+e.message)}}
 if(fallas.length){console.log('\nA REVISAR:\n- '+fallas.join('\n- '));process.exit(1)}
 console.log('\nTodo en orden');
})();
