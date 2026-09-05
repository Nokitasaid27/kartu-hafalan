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
  surat:SURAT.map(x=>[x[0],x[1]]),
  mode:null, font:"normal",
  profiles:{
    jamaah:{identity:"",view:"table",currentIndex:0,statuses:{}},
    pembimbing:{identity:"",jamaah:[]}
  }
};

// Migrasi data dari V1.0-V1.3 agar data lama tidak hilang saat struktur penyimpanan diperbaiki.
function migrateData(){
  if(!Array.isArray(db.surat)||!db.surat.length) db.surat=SURAT.map(x=>[x[0],x[1]]);
  db.profiles=db.profiles||{};
  if(!db.profiles.jamaah) db.profiles.jamaah={identity:"",view:"table",currentIndex:0,statuses:{}};
  if(!db.profiles.pembimbing) db.profiles.pembimbing={identity:"",jamaah:[]};
  if(db.identity && db.mode==="jamaah" && !db.profiles.jamaah.identity) db.profiles.jamaah.identity=db.identity;
  if(db.mode==="jamaah" && db.statuses && Object.keys(db.statuses).length && !Object.keys(db.profiles.jamaah.statuses||{}).length) db.profiles.jamaah.statuses=db.statuses;
  if(db.mode==="jamaah" && typeof db.view==="string") db.profiles.jamaah.view=db.view;
  if(db.mode==="jamaah" && Number.isInteger(db.currentIndex)) db.profiles.jamaah.currentIndex=db.currentIndex;
  if(db.identity && db.mode==="pembimbing" && !db.profiles.pembimbing.identity) db.profiles.pembimbing.identity=db.identity;
  if(Array.isArray(db.jamaah) && !db.profiles.pembimbing.jamaah.length) db.profiles.pembimbing.jamaah=db.jamaah;
  // Bentuk lama tetap diterima, tetapi seluruh perubahan baru ditulis ke profiles.
}
migrateData();

function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function profile(){return db.mode==="jamaah"?db.profiles.jamaah:db.profiles.pembimbing}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function setFont(){
  const sizes={normal:"18px",large:"22px",xlarge:"26px"};
  document.documentElement.style.setProperty("--fs",sizes[db.font]||sizes.normal);
}
function statusFor(map,i){return map[i]||""}
function suratList(){return db.surat||SURAT}
function suratLabel(){return suratList().length===SURAT.length?"Juz 30":"Juz 30 + Surat Tambahan"}
function initials(name){return (name||"?").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}

function layout(content,title="Kartu Hafalan",sub="Al-Qur'an"){
  return `<div class="app">
    <header class="header"><div class="header-row">
      <div class="logo">📖</div><div><div class="header-title">${title}</div><div class="header-sub">${sub}</div></div>
    </div></header>${content}</div>`;
}
function footer(active){
 return `<nav class="footer-nav"><div class="footer-nav-inner single">
  <button class="${active==="settings"?"active":""}" onclick="settings()">⚙️<br>Pengaturan</button>
 </div></nav>`;
}

function render(){
 setFont();
 const root=document.getElementById("app");
 if(!db.mode) return welcome();
 if(db.mode==="jamaah" && !db.profiles.jamaah.identity) return identity("jamaah");
 if(db.mode==="pembimbing" && !db.profiles.pembimbing.identity) return identity("pembimbing");
 if(db.mode==="jamaah") return jamaahHome();
 return pembimbingHome();
}

function welcome(){
 document.getElementById("app").innerHTML=`
 <main><div class="card center">
   <div class="big-logo">📖</div><h1>Kartu Hafalan<br>Al-Qur'an</h1>
   <p class="muted">Catatan sederhana untuk hafalan Al-Qur'an.</p>
   <div class="stack" style="margin-top:25px">
    <button class="btn btn-primary" onclick="chooseMode('jamaah')">👤 JAMAAH</button>
    <button class="btn btn-secondary" onclick="chooseMode('pembimbing')">👥 PEMBIMBING</button>
   </div>
 </div></main>`;
}
function chooseMode(m){db.mode=m;save();render()}
function identity(m){
 const label=m==="jamaah"?"Nama Jamaah":"Nama Pembimbing";
 const savedName=db.profiles[m].identity||"";
 document.getElementById("app").innerHTML=layout(`<main>
 <button class="back" onclick="db.mode=null;save();render()">← Kembali</button>
 <div class="card"><h1>${label}</h1>
  <div class="field"><label for="identity">${label}</label><input id="identity" value="${esc(savedName)}" placeholder="${m==="jamaah"?"Contoh: Ibu Siti":"Contoh: Ustadz Ahmad"}"></div>
  <button class="btn btn-primary" style="width:100%" onclick="startIdentity()">MULAI</button>
 </div></main>`);
}
function startIdentity(){
 const v=document.getElementById("identity").value.trim();
 if(!v){alert("Silakan isi nama terlebih dahulu.");return}
 profile().identity=v;
 save();render();
}

function jamaahHome(){
 const p=db.profiles.jamaah, map=p.statuses||{};
 document.getElementById("app").innerHTML=layout(`<main>
  <div class="toolbar"><div class="grow"><div class="screen-title">Kartu Hafalan</div><div class="muted">${esc(p.identity)} · ${suratLabel()}</div></div></div>
  <div class="card">
   <div class="info-strip"><b>Catatan pribadi</b><br><span class="small">Status dapat Anda ubah sesuai catatan setoran Anda.</span></div>
   ${cardControls()}
   ${p.view==="table"?tableView(map):largeView(map)}
  </div>
 </main>${footer("home")}`);
}
function cardControls(){
 const p=db.profiles.jamaah;
 return `<div class="segment">
  <button class="${p.view==="table"?"active":""}" onclick="db.profiles.jamaah.view='table';save();render()">Tabel</button>
  <button class="${p.view==="large"?"active":""}" onclick="db.profiles.jamaah.view='large';save();render()">Tampilan Besar</button>
 </div>`;
}
function tableView(map){
 return `<div class="table-wrap"><table><thead><tr><th style="width:52px">No</th><th>Nama Surat</th><th class="center">Ulang</th><th class="center">Lanjut</th></tr></thead><tbody>
 ${suratList().map((s,i)=>{let st=statusFor(map,i);return `<tr><td>${i+1}</td><td>${esc(s[0])}</td>
 <td class="center"><button class="status-dot ${st==="ulang"?"on-red":""}" aria-label="Ulang ${esc(s[0])}" onclick="toggleStatus(${i},'ulang')">${st==="ulang"?"✓":""}</button></td>
 <td class="center"><button class="status-dot ${st==="lanjut"?"on-green":""}" aria-label="Lanjut ${esc(s[0])}" onclick="toggleStatus(${i},'lanjut')">${st==="lanjut"?"✓":""}</button></td>
 </tr>`}).join("")}</tbody></table></div>`;
}
function largeView(map){
 const i=Math.max(0,Math.min(suratList().length-1,db.profiles.jamaah.currentIndex||0)), s=suratList()[i], st=statusFor(map,i);
 return `<div class="large-card">
  <div class="large-index">${i+1} dari ${suratList().length}</div>
  <div class="large-name">${esc(s[0])}</div>
  <button class="status-btn ${st==="ulang"?"selected-red":""}" onclick="toggleStatus(${i},'ulang')">${st==="ulang"?"✓ ":""}ULANG</button>
  <button class="status-btn ${st==="lanjut"?"selected-green":""}" onclick="toggleStatus(${i},'lanjut')">${st==="lanjut"?"✓ ":""}LANJUT</button>
  <div class="nav-buttons"><button class="btn btn-outline" onclick="moveCurrent(-1)">‹ Sebelumnya</button><button class="btn btn-outline" onclick="moveCurrent(1)">Berikutnya ›</button></div>
 </div>`;
}
function toggleStatus(i,st){
 const p=db.profiles.jamaah; p.statuses=p.statuses||{};
 p.statuses[i]=p.statuses[i]===st?"":st;
 p.currentIndex=i;save();render();
}
function moveCurrent(d){const p=db.profiles.jamaah;p.currentIndex=Math.max(0,Math.min(suratList().length-1,(p.currentIndex||0)+d));save();render()}

function pembimbingHome(){
 document.getElementById("app").innerHTML=layout(`<main>
  <div class="toolbar"><div class="grow"><div class="screen-title">Daftar Jamaah</div><div class="muted">${esc(db.profiles.pembimbing.identity)}</div></div></div>
  <div class="card">
   <div class="field"><input id="search" placeholder="🔎 Cari jamaah..." oninput="filterJamaah(this.value)"></div>
   <div id="jamaah-list">${jamaahList("")}</div>
   <button class="btn btn-primary" style="width:100%;margin-top:14px" onclick="addJamaah()">＋ TAMBAH JAMAAH</button>
  </div>
 </main>${footer("home")}`);
}
function jamaahList(q){
 const arr=(db.profiles.pembimbing.jamaah||[]).filter(x=>x.name.toLowerCase().includes(q.toLowerCase()));
 if(!arr.length)return `<div class="empty">Belum ada jamaah.</div>`;
 return `<div class="list">${arr.map((x,i)=>`<button class="list-item" onclick="openJamaah(${i})">
  <div class="avatar">${initials(x.name)}</div><div class="grow"><b>${esc(x.name)}</b><div class="small muted">${suratLabel()}</div></div><div>›</div>
 </button>`).join("")}</div>`;
}
function filterJamaah(q){const el=document.getElementById("jamaah-list");if(el)el.innerHTML=jamaahList(q)}
function addJamaah(){
 document.getElementById("app").innerHTML=layout(`<main>
 <button class="back" onclick="render()">← Kembali</button>
 <div class="card"><h1>Tambah Jamaah</h1>
  <div class="field"><label>Nama Jamaah</label><input id="new-name" placeholder="Contoh: Bapak Ahmad"></div>
  <button class="btn btn-primary" style="width:100%" onclick="createJamaah()">BUAT KARTU</button>
 </div></main>`);
}
function createJamaah(){
 const name=document.getElementById("new-name").value.trim();
 if(!name){alert("Silakan isi nama jamaah.");return}
 const p=db.profiles.pembimbing; p.jamaah=p.jamaah||[];
 p.jamaah.push({name,statuses:{},view:"table",currentIndex:0});
 save();render();
}
function openJamaah(i){
 const x=db.profiles.pembimbing.jamaah[i];
 document.getElementById("app").innerHTML=layout(`<main>
  <div class="toolbar"><button class="back" onclick="render()">← Daftar Jamaah</button><div class="grow"></div></div>
  <div class="card">
   <div class="screen-title">Kartu Hafalan</div><div class="muted">${esc(x.name)} · ${suratLabel()}</div>
   ${jamaahCardForMentor(x,i)}
  </div>
 </main>${footer("home")}`);
}
function jamaahCardForMentor(x,idx){
 const map=x.statuses||{}, view=x.view||"table";
 return `<div class="segment">
  <button class="${view==="table"?"active":""}" onclick="setMentorView(${idx},'table')">Tabel</button>
  <button class="${view==="large"?"active":""}" onclick="setMentorView(${idx},'large')">Tampilan Besar</button>
 </div>
 ${view==="table"?mentorTable(x,idx):mentorLarge(x,idx)}`;
}
function mentorTable(x,idx){
 return `<div class="table-wrap"><table><thead><tr><th>No</th><th>Nama Surat</th><th class="center">Ulang</th><th class="center">Lanjut</th></tr></thead><tbody>
 ${suratList().map((s,i)=>{let st=statusFor(x.statuses||{},i);return `<tr><td>${i+1}</td><td>${esc(s[0])}</td>
 <td class="center"><button class="status-dot ${st==="ulang"?"on-red":""}" onclick="mentorStatus(${idx},${i},'ulang')">${st==="ulang"?"✓":""}</button></td>
 <td class="center"><button class="status-dot ${st==="lanjut"?"on-green":""}" onclick="mentorStatus(${idx},${i},'lanjut')">${st==="lanjut"?"✓":""}</button></td></tr>`}).join("")}</tbody></table></div>`;
}
function mentorLarge(x,idx){
 const i=Math.max(0,Math.min(suratList().length-1,x.currentIndex||0)),s=suratList()[i],st=statusFor(x.statuses||{},i);
 return `<div class="large-card"><div class="large-index">${i+1} dari ${suratList().length}</div><div class="large-name">${esc(s[0])}</div>
 <button class="status-btn ${st==="ulang"?"selected-red":""}" onclick="mentorStatus(${idx},${i},'ulang')">${st==="ulang"?"✓ ":""}ULANG</button>
 <button class="status-btn ${st==="lanjut"?"selected-green":""}" onclick="mentorStatus(${idx},${i},'lanjut')">${st==="lanjut"?"✓ ":""}LANJUT</button>
 <div class="nav-buttons"><button class="btn btn-outline" onclick="mentorMove(${idx},-1)">‹ Sebelumnya</button><button class="btn btn-outline" onclick="mentorMove(${idx},1)">Berikutnya ›</button></div></div>`;
}
function setMentorView(i,v){db.profiles.pembimbing.jamaah[i].view=v;save();openJamaah(i)}
function mentorStatus(j,i,st){const x=db.profiles.pembimbing.jamaah[j];x.statuses=x.statuses||{};x.statuses[i]=x.statuses[i]===st?"":st;x.currentIndex=i;save();openJamaah(j)}
function mentorMove(j,d){const x=db.profiles.pembimbing.jamaah[j];x.currentIndex=Math.max(0,Math.min(suratList().length-1,(x.currentIndex||0)+d));save();openJamaah(j)}

function settings(){
 document.getElementById("app").innerHTML=layout(`<main>
  <button class="back" onclick="render()">← Kembali</button>
  <div class="screen-title">Pengaturan</div>
  <div class="card">
   <div class="setting-row"><div><b>Ukuran Huruf</b><div class="small muted">Pengaturan tersimpan di perangkat ini.</div></div>
    <div class="font-buttons">
     <button class="${db.font==="normal"?"active":""}" onclick="setFontSize('normal')">A</button>
     <button class="${db.font==="large"?"active":""}" onclick="setFontSize('large')">A</button>
     <button class="${db.font==="xlarge"?"active":""}" onclick="setFontSize('xlarge')">A</button>
    </div>
   </div>
   <div class="setting-row"><div><b>Backup Data</b><div class="small muted">Simpan salinan data.</div></div><button class="btn btn-secondary" onclick="backup()">Backup</button></div>
   <div class="setting-row"><div><b>Restore Data</b><div class="small muted">Kembalikan dari file backup.</div></div><button class="btn btn-secondary" onclick="document.getElementById('restore-file').click()">Restore</button></div>
   <div class="setting-row"><div><b>Tambah Surat</b><div class="small muted">Tambahkan surat di luar daftar Juz 30.</div></div><button class="btn btn-secondary" onclick="addSurat()">＋ Tambah</button></div>
   <div class="setting-row"><div><b>Reset Data</b><div class="small muted">Hapus semua data aplikasi.</div></div><button class="btn btn-danger" onclick="resetData()">Reset</button></div>
  </div>
  <input id="restore-file" type="file" accept=".json,application/json" style="display:none" onchange="restore(event)">
 </main>${footer("settings")}`);
}
function addSurat(){
 document.getElementById("app").innerHTML=layout(`<main>
 <button class="back" onclick="settings()">← Kembali</button>
 <div class="card"><h1>Tambah Surat</h1>
  <p class="muted">Surat baru akan ditambahkan di bagian paling bawah daftar hafalan pada perangkat ini.</p>
  <div class="field"><label>Nama Surat</label><input id="new-surat-name" placeholder="Contoh: Yasin"></div>
  <div class="field"><label>Nomor Surat (opsional)</label><input id="new-surat-number" type="number" min="1" max="114" placeholder="Contoh: 36"></div>
  <button class="btn btn-primary" style="width:100%" onclick="createSurat()">TAMBAH SURAT</button>
 </div></main>`);
}
function createSurat(){
 const name=document.getElementById("new-surat-name").value.trim();
 const numberRaw=document.getElementById("new-surat-number").value.trim();
 if(!name){alert("Silakan isi nama surat.");return}
 const number=numberRaw?Number(numberRaw):null;
 if(number!==null && (!Number.isInteger(number)||number<1||number>114)){alert("Nomor surat harus antara 1 sampai 114.");return}
 const list=suratList();
 if(list.some(x=>x[0].toLowerCase()===name.toLowerCase())){alert("Surat tersebut sudah ada.");return}
 list.push([name,number]);
 db.surat=list;save();settings();
 alert("Surat berhasil ditambahkan.");
}

function setFontSize(f){db.font=f;save();render()}
function backup(){
 const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="KartuHafalan_Backup.json";a.click();URL.revokeObjectURL(a.href);
}
function restore(e){
 const file=e.target.files[0];if(!file)return;
 const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||typeof x!=="object")throw Error();db=x;save();render();alert("Backup berhasil dipulihkan.");}catch(_){alert("File backup tidak valid.");}};r.readAsText(file);
}
function resetData(){if(confirm("Hapus semua data aplikasi?")){localStorage.removeItem(KEY);location.reload()}}

function mainMenu(){
  // Kembali ke menu awal untuk memilih mode Jamaah atau Pembimbing.
  // Data kartu tetap tersimpan; hanya mode aktif yang di-reset.
  db.mode=null;
  save();
  render();
}
function home(){render()}
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();
