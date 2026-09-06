const SURAT = [
  ["Al-Fatihah",1],["An-Naas",114],["Al-Falaq",113],["Al-Ikhlas",112],["Al-Lahab",111],
  ["An-Nasr",110],["Al-Kafirun",109],["Al-Kautsar",108],["Al-Ma'un",107],["Al-Quraisy",106],
  ["Al-Fiil",105],["Al-Humazah",104],["Al-Asr",103],["Al-Takatsur",102],["Al-Qoriah",101],
  ["Al-Adiyat",100],["Al-Zalzalah",99],["Al-Bayyinah",98],["Al-Qadr",97],["Al-Alaq",96],
  ["At-Tin",95],["Asy-Syarh",94],["Ad-Dhuha",93],["Al-Lail",92],["Asy-Syams",91],
  ["Al-Balad",90],["Al-Fajr",89],["Al-Ghasyiyah",88],["Al-A'la",87],["At-Thariq",86],
  ["Al-Buruj",85],["Al-Insyiqaq",84],["Al-Muthaffifin",83],["Al-Infitar",82],["At-Takwir",81],
  ["Abasa",80],["An-Nazi'at",79],["An-Naba'",78]
];

const KEY="kartu-hafalan-v1-data";
let db=JSON.parse(localStorage.getItem(KEY)||"null")||{
  mode:null, font:"normal", customSurat:[],
  profiles:{
    jamaah:{identity:"",view:"table",currentIndex:0,statuses:{}},
    pembimbing:{identity:"",jamaah:[]}
  }
};

// Pertahankan struktur V1.4 agar data JAMAAH dan PEMBIMBING tetap terpisah.
function migrateData(){
  db.profiles=db.profiles||{};
  if(!db.profiles.jamaah) db.profiles.jamaah={identity:"",view:"table",currentIndex:0,statuses:{}};
  if(!db.profiles.pembimbing) db.profiles.pembimbing={identity:"",jamaah:[]};
  db.profiles.jamaah.statuses=db.profiles.jamaah.statuses||{};
  db.profiles.pembimbing.jamaah=db.profiles.pembimbing.jamaah||[];
  db.customSurat=Array.isArray(db.customSurat)?db.customSurat:[];
  if(db.identity && db.mode==="jamaah" && !db.profiles.jamaah.identity) db.profiles.jamaah.identity=db.identity;
  if(db.mode==="jamaah" && db.statuses && Object.keys(db.statuses).length && !Object.keys(db.profiles.jamaah.statuses).length) db.profiles.jamaah.statuses=db.statuses;
  if(db.mode==="jamaah" && typeof db.view==="string") db.profiles.jamaah.view=db.view;
  if(db.mode==="jamaah" && Number.isInteger(db.currentIndex)) db.profiles.jamaah.currentIndex=db.currentIndex;
  if(db.identity && db.mode==="pembimbing" && !db.profiles.pembimbing.identity) db.profiles.pembimbing.identity=db.identity;
  if(Array.isArray(db.jamaah) && !db.profiles.pembimbing.jamaah.length) db.profiles.pembimbing.jamaah=db.jamaah;
}
migrateData();

let deferredInstallPrompt=null;
const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;renderInstallArea();});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;renderInstallArea();});

function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function profile(){return db.mode==="jamaah"?db.profiles.jamaah:db.profiles.pembimbing}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function setFont(){const sizes={normal:"18px",large:"22px",xlarge:"26px"};document.documentElement.style.setProperty("--fs",sizes[db.font]||sizes.normal)}
function statusFor(map,key){return map[key]||""}
function initials(name){return (name||"?").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
function entries(){
  const base=SURAT.map((s,i)=>({key:`base-${s[1]}`,name:s[0],number:s[1],kind:"base"}));
  const custom=(db.customSurat||[]).map(s=>({key:`custom-${s.id}`,id:s.id,name:s.name,ayat:s.ayat||"",kind:"custom"}));
  return base.concat(custom);
}
function entryAt(i){return entries()[Math.max(0,Math.min(entries().length-1,i))]}
function totalEntries(){return entries().length}
function layout(content,title="Kartu Hafalan",sub="Al-Qur'an"){
  return `<div class="app"><header class="header"><div class="header-row"><div class="logo">📖</div><div><div class="header-title">${title}</div><div class="header-sub">${sub}</div></div></div></header>${content}</div>`;
}
function footer(active){return `<nav class="footer-nav"><div class="footer-nav-inner single"><button class="${active==="settings"?"active":""}" onclick="settings()">⚙️<br>Pengaturan</button></div></nav>`}
function render(){
  setFont();
  const root=document.getElementById("app");
  if(!db.mode)return welcome();
  if(db.mode==="jamaah"&&!db.profiles.jamaah.identity)return identity("jamaah");
  if(db.mode==="pembimbing"&&!db.profiles.pembimbing.identity)return identity("pembimbing");
  if(db.mode==="jamaah")return jamaahHome();
  return pembimbingHome();
}
function installArea(){
  if(isStandalone())return "";
  return `<div id="install-area" class="install-area"><button class="btn btn-secondary install-btn" onclick="installApp()">📲 PASANG KARTU HAFALAN</button><div class="small muted install-hint">Pasang di HP agar berikutnya cukup tap icon Kartu Hafalan.</div></div>`;
}
function renderInstallArea(){const el=document.getElementById("install-area");if(el){el.outerHTML=installArea()||""}}
async function installApp(){
  if(isStandalone())return;
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    const result=await deferredInstallPrompt.userChoice;
    if(result.outcome==="accepted")deferredInstallPrompt=null;
    renderInstallArea();
    return;
  }
  alert("Jika tombol pemasangan belum muncul, buka menu ⋮ Chrome lalu pilih ‘Tambahkan ke layar utama’ atau ‘Install app’.");
}
function welcome(){
 document.getElementById("app").innerHTML=`<main><div class="card center"><div class="big-logo">📖</div><h1>Kartu Hafalan<br>Al-Qur'an</h1><p class="muted">Catatan sederhana untuk hafalan Al-Qur'an.</p><div class="stack" style="margin-top:25px"><button class="btn btn-primary" onclick="chooseMode('jamaah')">👤 JAMAAH</button><button class="btn btn-secondary" onclick="chooseMode('pembimbing')">👥 PEMBIMBING</button></div>${installArea()}</div></main>`;
}
function chooseMode(m){db.mode=m;save();render()}
function identity(m){
 const label=m==="jamaah"?"Nama Jamaah":"Nama Pembimbing";const savedName=db.profiles[m].identity||"";
 document.getElementById("app").innerHTML=layout(`<main><button class="back" onclick="db.mode=null;save();render()">← Kembali</button><div class="card"><h1>${label}</h1><div class="field"><label for="identity">${label}</label><input id="identity" value="${esc(savedName)}" placeholder="${m==="jamaah"?"Contoh: Ibu Siti":"Contoh: Bapak Ahmad"}"></div><button class="btn btn-primary" style="width:100%" onclick="startIdentity()">MULAI</button></div></main>`);
}
function startIdentity(){const v=document.getElementById("identity").value.trim();if(!v){alert("Silakan isi nama terlebih dahulu.");return}profile().identity=v;save();render()}
function jamaahHome(){
 const p=db.profiles.jamaah,map=p.statuses||{};
 document.getElementById("app").innerHTML=layout(`<main><div class="toolbar"><div class="grow"><div class="screen-title">Kartu Hafalan</div><div class="muted">${esc(p.identity)} · Juz 30</div></div></div><div class="card"><div class="info-strip"><b>Catatan pribadi</b><br><span class="small">Status dapat Anda ubah sesuai catatan setoran Anda.</span></div>${cardControls()}${p.view==="table"?tableView(map):largeView(map)}${addSuratButton()}</div></main>${footer("home")}`);
}
function cardControls(){const p=db.profiles.jamaah;return `<div class="segment"><button class="${p.view==="table"?"active":""}" onclick="db.profiles.jamaah.view='table';save();render()">Tabel</button><button class="${p.view==="large"?"active":""}" onclick="db.profiles.jamaah.view='large';save();render()">Tampilan Besar</button></div>`}
function tableView(map){const all=entries();return `<div class="table-wrap"><table><thead><tr><th style="width:52px">No</th><th>Nama Surat</th><th class="center">Ulang</th><th class="center">Lanjut</th></tr></thead><tbody>${all.map((s,i)=>rowHtml(s,i,map,null)).join("")}</tbody></table></div>`}
function rowHtml(s,i,map,mentorIdx){const st=statusFor(map,s.key);const ayat=s.kind==="custom"?`<div class="ayat-wrap"><input class="ayat-input" value="${esc(s.ayat)}" placeholder="Ayat, mis. 1–12" onchange="updateAyat('${s.id}',this.value)" onkeydown="if(event.key==='Enter'){this.blur()}" /></div>`:"";const statusClick=mentorIdx===null?`toggleStatus('${s.key}',${i}`:`mentorStatus(${mentorIdx},'${s.key}',${i}`;return `<tr><td>${i+1}</td><td class="surat-cell"><div>${esc(s.name)}</div>${ayat}</td><td class="center"><button class="status-dot ${st==="ulang"?"on-red":""}" aria-label="Ulang ${esc(s.name)}" onclick="${statusClick},'ulang')">${st==="ulang"?"✓":""}</button></td><td class="center"><button class="status-dot ${st==="lanjut"?"on-green":""}" aria-label="Lanjut ${esc(s.name)}" onclick="${statusClick},'lanjut')">${st==="lanjut"?"✓":""}</button></td></tr>`}
function largeView(map){const i=Math.max(0,Math.min(totalEntries()-1,db.profiles.jamaah.currentIndex||0)),s=entryAt(i),st=statusFor(map,s.key);return `<div class="large-card"><div class="large-index">${i+1} dari ${totalEntries()}</div><div class="large-name">${esc(s.name)}</div>${s.kind==="custom"?`<input class="ayat-input large-ayat" value="${esc(s.ayat)}" placeholder="Ayat, mis. 1–12" onchange="updateAyat('${s.id}',this.value)"/>`:""}<button class="status-btn ${st==="ulang"?"selected-red":""}" onclick="toggleStatus('${s.key}',${i},'ulang')">${st==="ulang"?"✓ ":""}ULANG</button><button class="status-btn ${st==="lanjut"?"selected-green":""}" onclick="toggleStatus('${s.key}',${i},'lanjut')">${st==="lanjut"?"✓ ":""}LANJUT</button><div class="nav-buttons"><button class="btn btn-outline" onclick="moveCurrent(-1)">‹ Sebelumnya</button><button class="btn btn-outline" onclick="moveCurrent(1)">Berikutnya ›</button></div></div>`}
function setView(v){db.profiles.jamaah.view=v;save();render()}
function toggleStatus(key,i,st){const p=db.profiles.jamaah;p.statuses=p.statuses||{};p.statuses[key]=p.statuses[key]===st?"":st;p.currentIndex=i;save();render()}
function moveCurrent(d){const p=db.profiles.jamaah;p.currentIndex=Math.max(0,Math.min(totalEntries()-1,(p.currentIndex||0)+d));save();render()}
function pembimbingHome(){document.getElementById("app").innerHTML=layout(`<main><div class="toolbar"><div class="grow"><div class="screen-title">Daftar Jamaah</div><div class="muted">${esc(db.profiles.pembimbing.identity)}</div></div></div><div class="card"><div class="field"><input id="search" placeholder="🔎 Cari jamaah..." oninput="filterJamaah(this.value)"></div><div id="jamaah-list">${jamaahList("")}</div><button class="btn btn-primary" style="width:100%;margin-top:14px" onclick="addJamaah()">＋ TAMBAH JAMAAH</button></div></main>${footer("home")}`)}
function jamaahList(q){const arr=(db.profiles.pembimbing.jamaah||[]).filter(x=>x.name.toLowerCase().includes(q.toLowerCase()));if(!arr.length)return `<div class="empty">Belum ada jamaah.</div>`;return `<div class="list">${arr.map((x,i)=>`<button class="list-item" onclick="openJamaah(${i})"><div class="avatar">${initials(x.name)}</div><div class="grow"><b>${esc(x.name)}</b><div class="small muted">Juz 30</div></div><div>›</div></button>`).join("")}</div>`}
function filterJamaah(q){const el=document.getElementById("jamaah-list");if(el)el.innerHTML=jamaahList(q)}
function addJamaah(){document.getElementById("app").innerHTML=layout(`<main><button class="back" onclick="render()">← Kembali</button><div class="card"><h1>Tambah Jamaah</h1><div class="field"><label>Nama Jamaah</label><input id="new-name" placeholder="Contoh: Bapak Ahmad"></div><button class="btn btn-primary" style="width:100%" onclick="createJamaah()">BUAT KARTU</button></div></main>`)}
function createJamaah(){const name=document.getElementById("new-name").value.trim();if(!name){alert("Silakan isi nama jamaah.");return}const p=db.profiles.pembimbing;p.jamaah=p.jamaah||[];p.jamaah.push({name,statuses:{},view:"table",currentIndex:0});save();render()}
function openJamaah(i){const x=db.profiles.pembimbing.jamaah[i];document.getElementById("app").innerHTML=layout(`<main><div class="toolbar"><button class="back" onclick="render()">← Daftar Jamaah</button><div class="grow"></div></div><div class="card"><div class="screen-title">Kartu Hafalan</div><div class="muted">${esc(x.name)} · Juz 30</div>${jamaahCardForMentor(x,i)}</div></main>${footer("home")}`)}
function jamaahCardForMentor(x,idx){const map=x.statuses||{},view=x.view||"table";return `${cardControlsMentor(view,idx)}${view==="table"?mentorTable(x,idx):mentorLarge(x,idx)}${addSuratButton()}`}
function cardControlsMentor(view,idx){return `<div class="segment"><button class="${view==="table"?"active":""}" onclick="setMentorView(${idx},'table')">Tabel</button><button class="${view==="large"?"active":""}" onclick="setMentorView(${idx},'large')">Tampilan Besar</button></div>`}
function mentorTable(x,idx){return `<div class="table-wrap"><table><thead><tr><th style="width:52px">No</th><th>Nama Surat</th><th class="center">Ulang</th><th class="center">Lanjut</th></tr></thead><tbody>${entries().map((s,i)=>rowHtml(s,i,x.statuses||{},idx)).join("")}</tbody></table></div>`}
function mentorLarge(x,idx){const all=entries(),i=Math.max(0,Math.min(all.length-1,x.currentIndex||0)),s=all[i],st=statusFor(x.statuses||{},s.key);return `<div class="large-card"><div class="large-index">${i+1} dari ${all.length}</div><div class="large-name">${esc(s.name)}</div>${s.kind==="custom"?`<input class="ayat-input large-ayat" value="${esc(s.ayat)}" placeholder="Ayat, mis. 1–12" onchange="updateAyat('${s.id}',this.value)"/>`:""}<button class="status-btn ${st==="ulang"?"selected-red":""}" onclick="mentorStatus(${idx},'${s.key}',${i},'ulang')">${st==="ulang"?"✓ ":""}ULANG</button><button class="status-btn ${st==="lanjut"?"selected-green":""}" onclick="mentorStatus(${idx},'${s.key}',${i},'lanjut')">${st==="lanjut"?"✓ ":""}LANJUT</button><div class="nav-buttons"><button class="btn btn-outline" onclick="mentorMove(${idx},-1)">‹ Sebelumnya</button><button class="btn btn-outline" onclick="mentorMove(${idx},1)">Berikutnya ›</button></div></div>`}
function setMentorView(i,v){db.profiles.pembimbing.jamaah[i].view=v;save();openJamaah(i)}
function mentorStatus(j,key,i,st){const x=db.profiles.pembimbing.jamaah[j];x.statuses=x.statuses||{};x.statuses[key]=x.statuses[key]===st?"":st;x.currentIndex=i;save();openJamaah(j)}
function mentorMove(j,d){const x=db.profiles.pembimbing.jamaah[j],n=entries().length;x.currentIndex=Math.max(0,Math.min(n-1,(x.currentIndex||0)+d));save();openJamaah(j)}
function addSuratButton(){return `<div class="add-surat-area"><button class="btn btn-secondary add-surat-btn" onclick="showAddSurat()">＋ TAMBAH SURAT & AYAT</button><div class="small muted add-surat-hint">Tambahkan surat di luar daftar Juz 30 dan nomor ayat bila diperlukan.</div></div>`}
function showAddSurat(){document.getElementById("app").innerHTML=layout(`<main><button class="back" onclick="render()">← Kembali</button><div class="card"><h1>Tambah Surat</h1><p class="muted">Masukkan nama surat. Nomor ayat dapat diisi dan nanti bisa diubah langsung pada kartu.</p><div class="field"><label for="custom-name">Nama Surat</label><input id="custom-name" placeholder="Contoh: Yasin"></div><div class="field"><label for="custom-ayat">Ayat (opsional)</label><input id="custom-ayat" placeholder="Contoh: 1–12"></div><button class="btn btn-primary" style="width:100%" onclick="createSurat()">TAMBAHKAN KE KARTU</button></div></main>`)}
function createSurat(){const name=document.getElementById("custom-name").value.trim(),ayat=document.getElementById("custom-ayat").value.trim();if(!name){alert("Silakan isi nama surat.");return}db.customSurat=db.customSurat||[];db.customSurat.push({id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,ayat});save();alert(`Surat ${name} berhasil ditambahkan.`);render()}
function updateAyat(id,value){const x=(db.customSurat||[]).find(s=>s.id===id);if(!x)return;x.ayat=value.trim();save();render()}
function settings(){document.getElementById("app").innerHTML=layout(`<main><button class="back" onclick="render()">← Kembali</button><div class="screen-title">Pengaturan</div><div class="card"><div class="setting-row"><div><b>Ukuran Huruf</b><div class="small muted">Pengaturan tersimpan di perangkat ini.</div></div><div class="font-buttons"><button class="${db.font==="normal"?"active":""}" onclick="setFontSize('normal')">A</button><button class="${db.font==="large"?"active":""}" onclick="setFontSize('large')">A</button><button class="${db.font==="xlarge"?"active":""}" onclick="setFontSize('xlarge')">A</button></div></div><div class="setting-row"><div><b>Backup Data</b><div class="small muted">Simpan salinan data.</div></div><button class="btn btn-secondary" onclick="backup()">Backup</button></div><div class="setting-row"><div><b>Restore Data</b><div class="small muted">Kembalikan dari file backup.</div></div><button class="btn btn-secondary" onclick="document.getElementById('restore-file').click()">Restore</button></div><div class="setting-row"><div><b>Reset Data</b><div class="small muted">Hapus semua data aplikasi.</div></div><button class="btn btn-danger" onclick="resetData()">Reset</button></div></div><input id="restore-file" type="file" accept=".json,application/json" style="display:none" onchange="restore(event)"></main>${footer("settings")}`)}
function setFontSize(f){db.font=f;save();render()}
function backup(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="KartuHafalan_Backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function restore(e){const file=e.target.files&&e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||typeof x!=="object")throw Error();db=x;migrateData();save();render();alert("Backup berhasil dipulihkan.")}catch(_){alert("File backup tidak valid.")}};r.readAsText(file)}
function resetData(){if(confirm("Hapus semua data aplikasi?")){localStorage.removeItem(KEY);location.reload()}}

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(r=>r.update()).catch(()=>{}));
render();
