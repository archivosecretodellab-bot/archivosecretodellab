// Genera /dj/<slug>/index.html y sitemap.xml a partir de los datos de index.html.
// Uso: desde la raíz del repo, con un servidor local en el puerto 8790:  node _tools/generar_paginas_dj.js
const {chromium}=require('playwright'),fs=require('fs');
const stub=`(function(){function q(){var o={};['select','eq','order','limit','in','neq','gte','lte','not','is','ilike','single','maybeSingle','insert','update','upsert','delete','range','match','filter','or'].forEach(k=>o[k]=()=>o);o.then=(r)=>r({data:[],error:null,count:0});return o}
window.supabase={createClient:()=>({from:q,rpc:q,auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user:null}})},functions:{invoke:async()=>({data:null,error:null})},channel:()=>({on(){return this},subscribe(){return this}}),storage:{from:()=>({})}})}})();`;
const esc=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slug=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Ø/gi,'o').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const gen=x=>String(x||'').split(/[·,\/|]/).map(t=>t.trim()).filter(t=>t&&!/^(sin g[eé]nero|por confirmar|—|-)$/i.test(t));
const hash=t=>[...t].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7);
const fecha=f=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(f||'');return m?`${m[3]}.${m[2]}.${m[1]}`:''};
const ORD=['1er','2do','3er','4to','5to','6to','7mo','8vo','9no','10mo'];
const SITE='https://archivosecretodellab.com';
const CSS=`:root{--k:#0a0a0a;--b:#1b00e6;--w:#fff;--m:rgba(255,255,255,.62);--l:rgba(255,255,255,.12)}
*{box-sizing:border-box;border-radius:0}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--k);color:var(--w);font-family:"IBM Plex Mono",monospace}
a{color:inherit;text-decoration:none}p,h1,h2{text-wrap:pretty}
.hd{display:flex;justify-content:space-between;align-items:center;padding:20px clamp(16px,3vw,40px);border-bottom:1px solid var(--l)}
.brand{font-family:"Space Mono",monospace;font-weight:700;font-size:13px;letter-spacing:.2em}.cnt{font-size:10px;letter-spacing:.2em;color:var(--m)}
.nav{display:flex;gap:28px;padding:0 clamp(16px,3vw,40px);border-bottom:1px solid var(--l);overflow-x:auto;overflow-y:hidden;scrollbar-width:none;font-size:10px;letter-spacing:.2em;color:var(--m);white-space:nowrap}.nav::-webkit-scrollbar{display:none}.nav a{padding:14px 0 12px;border-bottom:2px solid transparent;flex:none}.nav .on{color:#fff;border-bottom-color:var(--b)}
main{max-width:1180px;margin:0 auto;padding:clamp(24px,4vw,56px) clamp(16px,3vw,40px)}
.crumb{font-size:10px;letter-spacing:.2em;color:var(--m);text-transform:uppercase;margin-bottom:36px}.crumb b{color:#fff;font-weight:400}
.top{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(28px,5vw,72px);align-items:start}
.ph{aspect-ratio:4/5;background:#141414;overflow:hidden}.ph img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
.k{font-size:10px;letter-spacing:.24em;color:#fff;background:var(--b);display:inline-block;padding:5px 8px;text-transform:uppercase}
h1{font-family:"Space Mono",monospace;font-weight:700;overflow-wrap:anywhere;font-size:clamp(40px,9vw,104px);line-height:.92;letter-spacing:-.04em;margin:18px 0 12px;text-transform:uppercase}
.g{font-size:12px;letter-spacing:.12em;color:var(--m);text-transform:uppercase;line-height:1.7}
.bio{font-size:16px;line-height:1.75;color:rgba(255,255,255,.88);max-width:54ch;margin:28px 0 30px;text-align:justify;hyphens:auto;-webkit-hyphens:auto}
.row{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid var(--l);font-size:13px;max-width:54ch}.row:last-child{border-bottom:1px solid var(--l)}.row span:first-child{font-size:10px;letter-spacing:.2em;color:var(--m);text-transform:uppercase}.row a{border-bottom:1px solid var(--b)}.hs{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:flex-end;text-align:right}
.sec{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--l);padding-bottom:14px;margin:clamp(44px,6vw,76px) 0 22px}h2{font-family:"Space Mono",monospace;font-size:13px;letter-spacing:.2em;margin:0;text-transform:uppercase}.sec span{font-size:12px;color:var(--m)}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tile{position:relative;display:block;aspect-ratio:16/9;overflow:hidden;border:1px solid rgba(27,0,230,.55);background:#10101a}.tile img{width:100%;height:100%;object-fit:cover;display:block}
.play{position:absolute;top:0;left:0;background:var(--b);font-size:12px;padding:8px 11px}.tl{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 11px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;line-height:1.5;background:linear-gradient(transparent,rgba(0,0,0,.85))}.tl b{font-weight:600}
.sugs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.sg{display:block;border:1px solid var(--l);padding:18px}.sg:hover{border-color:var(--b)}.sn{display:block;font-family:"Space Mono",monospace;font-weight:700;font-size:17px;margin-bottom:6px;text-transform:uppercase}.sgg{display:block;font-size:10.5px;letter-spacing:.08em;color:var(--m);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sa{display:block;font-size:10px;letter-spacing:.18em;margin-top:18px;text-transform:uppercase}
.cta{margin-top:clamp(44px,6vw,76px);background:var(--b);padding:clamp(24px,4vw,44px);display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}.cta p{font-family:"Space Mono",monospace;font-weight:700;font-size:clamp(20px,3vw,30px);line-height:1.2;margin:0;max-width:22ch}.cta a{background:#fff;color:#0a0a0a;font-size:11px;letter-spacing:.2em;padding:15px 20px;font-weight:600;text-transform:uppercase}
footer{border-top:1px solid var(--l);padding:26px clamp(16px,3vw,40px);font-size:11px;line-height:1.9;color:var(--m)}
@media(max-width:760px){.top,.grid,.sugs{grid-template-columns:1fr}.cnt{display:none}.g{font-size:10.5px;letter-spacing:.06em;white-space:nowrap}}`;
const TRACK=`<script async src="https://www.googletagmanager.com/gtag/js?id=G-10WE08DXZN"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-10WE08DXZN');</script>
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1133425549194108');fbq('track','PageView');</script>`;
function lista(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' y '+a[a.length-1];}
function pagina(d){
 const N=d.artist.toUpperCase(),u=`${SITE}/dj/${d.slug}/`,g=gen(d.genre).slice(0,3);
 const n=String(d.sets.length).padStart(2,'0'),foto=SITE+d.foto;
 const desc=`${N} en el Archivo Secreto del Lab: ${lista(g.map(x=>x.toLowerCase()))}. Mirá ${d.sets.length>1?'sus '+d.sets.length+' sets registrados':'su set registrado'} en Buenos Aires.`;
 const ld=[{"@context":"https://schema.org","@type":"ProfilePage",url:u,name:`${N} | Archivo Secreto del Lab`,mainEntity:{"@type":"Person",name:N,description:d.bio,image:foto,genre:g,...(d.ig.length?{sameAs:d.ig.map(h=>'https://www.instagram.com/'+h+'/')}:{})}},{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Archivo",item:SITE+'/'},{"@type":"ListItem",position:2,name:"DJs",item:SITE+'/dj/'},{"@type":"ListItem",position:3,name:N,item:u}]}];
 const tiles=[...d.sets].reverse().map(s=>`<a class="tile" href="${esc(s.yt)}" target="_blank" rel="noopener"><img src="${esc(s.cover)}" alt="${esc(N)}, set ${esc(s.id)} en el Archivo Secreto del Lab" loading="lazy"><span class="play">▶</span><span class="tl"><b>${esc(s.id)}</b>${s.ord?' · '+esc(s.ord):''}<br>${esc(s.etiqueta)}</span></a>`).join('');
 const sug=d.sug.map(x=>`<a class="sg" href="${esc(x.href)}"><span class="sn">${esc(x.artist)}</span><span class="sgg">${esc(x.g)}</span><span class="sa">Ver ficha →</span></a>`).join('');
 const ig=(d.ig.length?`<div class="row"><span>Instagram</span><span class="hs">${d.ig.map(h=>`<a href="https://www.instagram.com/${h}/" target="_blank" rel="noopener">@${h}</a>`).join(' ')}</span></div>`:'')+(d.yt?`<div class="row"><span>YouTube</span><a href="${esc(d.yt)}" target="_blank" rel="noopener">${esc(d.yt.replace(/^.*youtube\.com\//,''))}</a></div>`:'');
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${TRACK}
<title>${esc(N)}: DJ sets en Buenos Aires | Archivo Secreto del Lab</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${u}"><meta name="robots" content="index, follow">
<meta property="og:type" content="profile"><meta property="og:title" content="${esc(N)} | Archivo Secreto del Lab"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${u}"><meta property="og:image" content="${esc(foto)}"><meta property="og:locale" content="es_AR">
<link rel="icon" type="image/png" href="/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>
<style>${CSS}</style></head><body>
<header class="hd"><a class="brand" href="/">ARCHIVO SECRETO DEL LAB</a><span class="cnt">+200 SETS</span></header>
<nav class="nav"><a href="/">INICIO</a><a class="on" href="/?ir=djsets">DJ SETS</a><a href="/?ir=agenda">GRABÁ TU SET</a><a href="/?ir=renta">ALQUILER DE EQUIPOS</a></nav>
<main><div class="crumb"><a href="/">Archivo</a> / <a href="/dj/">DJs</a> / <b>${esc(d.artist)}</b></div>
<section class="top"><div class="ph">${d.foto?`<img src="${esc(encodeURI(decodeURI(d.foto)))}" alt="${esc(N)}, DJ en el Archivo Secreto del Lab">`:''}</div>
<div><span class="k">Archivo · Buenos Aires</span><h1>${esc(d.artist)}</h1><div class="g">${esc(g.join(' · '))}</div>
<p class="bio">${esc(d.bio)}</p>
<div><div class="row"><span>Primer registro</span><span>${fecha(d.sets[0].fecha)}</span></div><div class="row"><span>Sets en el Archivo</span><span>${n}</span></div>${ig}</div></div></section>
<div class="sec"><h2>Sets en el Archivo</h2><span>${n}</span></div><div class="grid">${tiles}</div>
<div class="sec"><h2>Descubrí otros DJs del Archivo</h2></div><div class="sugs">${sug}</div>
<section class="cta"><p>¿Querés que tu set sea el próximo en el Archivo?</p><a href="/?ir=agenda">→ Grabá tu set</a></section></main>
<footer>Archivo Secreto del Lab · San Telmo, Buenos Aires · Lun a dom, 11 a 19 hs, con reserva previa<br>@archivosecretodellab · produccion@archivosecretodellab.com</footer>
</body></html>`;
}
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.route('**/*',r=>{const u=r.request().url();if(u.includes('localhost:8790'))return r.continue();if(u.includes('supabase'))return r.fulfill({contentType:'text/javascript',body:stub});return r.abort()});
await p.goto('http://localhost:8790/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
const data=await p.evaluate(()=>{const up=x=>x.toUpperCase();const pub=new Set();SM.forEach(s=>{if(s.estado==='Publicado'){pub.add(_nomNorm(s.artista));_b2bPartes(s.artista).forEach(a=>pub.add(_nomNorm(a)))}});
 const todos=DJS.filter(d=>d.bio&&d.bio.length>150&&!/ B2B /i.test(d.artist)&&pub.has(_nomNorm(d.artist))).map(d=>({artist:d.artist,genre:d.genre}));
 const ORD=['1er','2do','3er','4to','5to','6to','7mo','8vo','9no','10mo'];
 const plantilla=/^(participante de|archivo p[uú]blico en directo|sin bio)/i;
 const pil=DJS.filter(d=>d.bio&&d.bio.length>=150&&!plantilla.test(d.bio)).map(d=>{const sets=_setsDeArtista(d.artist,d.alias).filter(s=>s.estado==='Publicado'&&s.url_yt);
  if(!sets.length) return null;
  return {alias:d.alias,artist:d.artist,genre:d.genre,bio:d.bio,links:d.links,foto:imgURL('img/perfiles',getPerfilFilename(d.artist)),sets:sets.map((s,i)=>{const con=_b2bPartes(s.artista).filter(q=>_nomNorm(q)!==_nomNorm(d.artist));return {id:s.id,yt:s.url_yt,fecha:s.fecha,cover:imgURL('img/covers',getCoverFilename(s.artista,smCoverChronoNum(s.artista,s.id))),cat:s.categoria,con:con.length&&_esB2B(s.artista)?con.join(' y '):'',duo:_etiquetaDuo(s,d.artist,d.alias)}})}});
 const ok=new Set(pil.filter(Boolean).map(d=>d.artist));return {pil:pil.filter(Boolean),todos,alias:NAME_ALIAS,fuera:DJS.filter(d=>!ok.has(d.artist)).map(d=>d.artist)}});
const enPiloto=new Set(data.pil.map(d=>d.artist.toUpperCase())),pages=[],usados={},mapa={},avisos=[];
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const existe=u=>fs.existsSync(decodeURI(u).replace(/^\//,''));
const conImagen=u=>{if(existe(u))return u;const q=u.replace(/\.jpg$/,'.png');return existe(q)?q:''};
const ytId=u=>(/(?:v=|youtu\.be\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/.exec(u||'')||[])[1]||'';
for(const d of data.pil){let g=slug(d.artist),k=g,i=2;while(usados[k]){k=g+'-'+i++}usados[k]=1;d.slug=k;mapa[norm(d.artist)]=k;if(d.alias)mapa[norm(d.alias)]=k}
for(const [a,b] of Object.entries(data.alias)){if(mapa[norm(b)])mapa[norm(a)]=mapa[norm(b)]}
if(fs.existsSync('dj'))fs.rmSync('dj',{recursive:true});
for(const d of data.pil){
 const f=conImagen(d.foto);if(!f)avisos.push('sin foto: '+d.artist);d.foto=f;
 d.sets.forEach(s=>{const c=conImagen(s.cover);if(!c)avisos.push('sin portada: '+d.artist+' '+s.id);s.cover=c||('https://i.ytimg.com/vi/'+ytId(s.yt)+'/hqdefault.jpg')});
 const mine=gen(d.genre).map(x=>x.toLowerCase());
 d.sug=data.todos.filter(x=>x.artist!==d.artist).map(x=>{const gs=gen(x.genre),sh=gs.filter(t=>mine.includes(t.toLowerCase()));return {artist:x.artist,sh,gs}}).sort((a,c)=>c.sh.length-a.sh.length||hash(d.artist+a.artist)-hash(d.artist+c.artist)).slice(0,3).map(x=>{if(!x.sh.length)x.sh=[x.gs[0]||''];const sec=x.gs.find(t=>t!==x.sh[0]);return {artist:x.artist,g:[x.sh[0],sec].filter(Boolean).join(' · '),href:mapa[norm(x.artist)]?`/dj/${mapa[norm(x.artist)]}/`:'/?dj='+encodeURIComponent(x.artist)}});
 d.ig=(String(d.links||'').match(/@[\w.]+/g)||[]).map(h=>h.slice(1).replace(/\.$/,''));
 d.yt=/youtube\.com\/@[\w.-]+/i.test(d.links||'')?(d.links.match(/https?:\/\/\S*youtube\.com\/@[\w.-]+/i)||[''])[0]:'';
 d.sets.forEach((s,i)=>{const cat=/PUBLICO/i.test(s.cat)?'ARCHIVO PÚBLICO':s.cat;s.ord=d.sets.length>1?ORD[i]+' set':'';s.etiqueta=(s.duo||(s.con?'B2B con '+s.con:cat))+(s.fecha?' · '+fecha(s.fecha):'')});
 fs.mkdirSync(`dj/${d.slug}`,{recursive:true});fs.writeFileSync(`dj/${d.slug}/index.html`,pagina(d));pages.push(d.slug)}
const hoy=new Date().toISOString().slice(0,10);
const dir=[...data.pil].sort((a,c)=>norm(a.artist).localeCompare(norm(c.artist))).map(d=>`<a class="sg" href="/dj/${d.slug}/"><span class="sn">${esc(d.artist)}</span><span class="sgg">${esc(gen(d.genre).slice(0,2).join(' · '))}</span></a>`).join('');
fs.writeFileSync('dj/index.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${TRACK}
<title>DJs del Archivo: registro de la escena de Buenos Aires | Archivo Secreto del Lab</title>
<meta name="description" content="Todos los DJs registrados en el Archivo Secreto del Lab, el registro audiovisual de la escena electrónica de Buenos Aires. Conocé a cada artista y sus sets."><link rel="canonical" href="${SITE}/dj/">
<link rel="icon" type="image/png" href="/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>
<header class="hd"><a class="brand" href="/">ARCHIVO SECRETO DEL LAB</a><span class="cnt">+200 SETS</span></header>
<nav class="nav"><a href="/">INICIO</a><a class="on" href="/?ir=djsets">DJ SETS</a><a href="/?ir=agenda">GRABÁ TU SET</a><a href="/?ir=renta">ALQUILER DE EQUIPOS</a></nav>
<main><div class="crumb"><a href="/">Archivo</a> / <b>DJs</b></div><h1 style="font-size:clamp(40px,7vw,80px)">DJs del Archivo</h1>
<div class="sugs" style="margin-top:36px">${dir}</div>
<section class="cta"><p>¿Querés que tu set sea el próximo en el Archivo?</p><a href="/?ir=agenda">→ Grabá tu set</a></section></main>
<footer>Archivo Secreto del Lab · San Telmo, Buenos Aires · Lun a dom, 11 a 19 hs, con reserva previa<br>@archivosecretodellab · produccion@archivosecretodellab.com</footer>
</body></html>`);
fs.writeFileSync('dj/paginas.json',JSON.stringify(mapa));
fs.writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${hoy}</lastmod>\n  </url>\n  <url>\n    <loc>${SITE}/dj/</loc>\n    <lastmod>${hoy}</lastmod>\n  </url>\n`+pages.map(s=>`  <url>\n    <loc>${SITE}/dj/${s}/</loc>\n    <lastmod>${hoy}</lastmod>\n  </url>\n`).join('')+`</urlset>\n`);
console.log('PAGINAS',pages.length,'DJS sin pagina',data.fuera);console.log(avisos.join('\n'));
await b.close()})()
