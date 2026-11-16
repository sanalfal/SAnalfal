/* =========================================================
   Sanal Fal — ana akış mantiği
   ========================================================= */
(() => {
  "use strict";

  const STORE_KEY = "sanalfal_participants";
  const RESULT_KEY = "sanalfal_result";

  /* SABİT "sizi bekleyen kişi" açıklaması — her zaman bu çıkar */
  const FIXED_PERSON = "Uzun boylu poslu\nEsmer\nGözlüklü\nSayısalcı\nBaş harfi M...";

  let db = null;
  function initFirebase(){
    db = (window.initFalFirebase ? window.initFalFirebase() : null);
  }

  /* ---------- 10 SORU ---------- */
  const QUESTIONS = [
    { id:"yas",     title:"Kaç yaşındasın?", type:"number", placeholder:"örn. 21", min:8, max:99 },
    { id:"hobi",    title:"En sevdiğin hobi hangisi?", type:"choice",
      opts:["Kitap okumak","Müzik dinlemek","Seyahat etmek","Resim yapmak","Dans etmek","Spor yapmak"] },
    { id:"mevsim",  title:"Hangi mevsim seni en çok yansıtıyor?", type:"choice",
      opts:["İlkbahar","Yaz","Sonbahar","Kış"] },
    { id:"aksam",   title:"İdeal bir akşam senin için nasıl olurdu?", type:"choice",
      opts:["Evde film gecesi","Sahilde yürüyüş","Kafede derin sohbet","Konser & müzik","Sevdikleriyle yemek"] },
    { id:"renk",    title:"Hangi renk seni en iyi anlatıyor?", type:"choice",
      opts:["Pudra pembe","Gökyüzü mavisi","Doğa yeşili","Tutkulu kırmızı","Sır perdesi mor","Asil siyah"] },
    { id:"ask",     title:"Sence aşk nedir?", type:"choice",
      opts:["Tutku","Güven","Macera","Dostluk","Kader"] },
    { id:"tatil",   title:"Hayalindeki tatil neresi?", type:"choice",
      opts:["Paris'te sokaklar","Maldivler sahili","Dağ başında kabin","Tokyo ışıkları","İtalya sahili"] },
    { id:"aranan",  title:"Birinde en çok ne ararsın?", type:"choice",
      opts:["Sadakat","Mizah","Zeka","Şefkat","Cesaret"] },
    { id:"mutlu",   title:"Seni en çok ne mutlu eder?", type:"choice",
      opts:["Küçük sürprizler","Derin sohbetler","Sessizlikte huzur","Kahkaha","Başarı"] },
    { id:"gelecek", title:"Gelecekte kendini nerede görüyorsun?", type:"choice",
      opts:["Sıcacık bir evde","Dünyayı gezerken","Kariyerinde zirvede","Sevdikleriyle dolu bir hayat"] },
  ];

  /* ---------- 5 KISA NOT (varsayılan) ---------- */
  const NOTES = [
    "Seni hayatına aldığı ilk andan beri seni çok sevecek.",
    "Sana dünyalar kadar değer verecek; seni hep ön planda tutacak.",
    "Seni sevmeye bir saniye bile mola vermeyecek.",
    "Kötü gününde bile yanında olacak, seni hiç yalnız bırakmayacak.",
    "Seninle geçirdiği her anı bir hediye görecek, seni kaybetmekten korkacak.",
  ];

  /* ---------- "SİZİ BEKLEYEN KİŞİ" ŞABLONLARI (varsayılan) ---------- */
  const PERSONAS = [
    {
      desc:"Uzun boylu, esmer ve gözlüklü. Sayısalcı bir zihne sahip; soğuk gibi görünür ama seni görünce eriyen birine dönüşür.",
      wants:"Senden bir 'biz' kurmanı, seninle bir gelecek istiyor."
    },
    {
      desc:"Yakışıklı boyu, koyu kahverengi dalgalı saçları ve derin bakışlı bir doktor. Güçlü durur ama gözleri seni bulunca yumuşar.",
      wants:"Senden sarsılmaz bir güven; yanında olduğu her an senin için siper olmaya ant içmiş."
    },
    {
      desc:"Esmer, hafif sakallı, gülümseyen bir müzisyen. Parmakları senin için besteler yapar.",
      wants:"Senden cesaret istiyor — onunla dünyayı gezmeye hazır mısın?"
    },
    {
      desc:"Kumral saçlı, ela gözlü, gözlüklü bir yazılımcı. Sana baktığında sanki tüm satırları senin için yazıyormuş gibi bakar.",
      wants:"Senden koşulsuz bir dostluk; en yoğun gününde bile sana bir satır mesaj atacak."
    },
    {
      desc:"Uzun boylu, siyah saçlı, çekici bir mimar. Hayatını senin üzerine bir plan gibi çizer.",
      wants:"Senden ortak bir hayal; ev değil, seninle bir hayat inşa etmek istiyor."
    },
    {
      desc:"Esmer, sportif, güneşten hafif bronzmuş bir pilot. Gözleri hep ufukta ama kalbi seni bulunca yere iner.",
      wants:"Senden macera istiyor; 'hayatım seninle tek bilet,' diyor."
    },
  ];

  /* Hobi'ye göre ek kişisel satır (sadece şablon modda) */
  const HOBI_LINE = {
    "Kitap okumak":"Senin okuduğun kitabı bitirmeden o da başlamaz.",
    "Müzik dinlemek":"Senin için çalınmamış bir şarkı bırakmaz.",
    "Seyahat etmek":"Hayatını bir valiz değil, bir 'sen' varsayarak yaşıyor.",
    "Resim yapmak":"Seni hep en güzel halinden çizer.",
    "Dans etmek":"Hayatı seninle bir dans pisti gibi döndürür.",
    "Spor yapmak":"Senin attığın her adımda yanında koşar.",
  };

  /* ---------- DURUM ---------- */
  const state = { name:"", answers:{}, qIndex:0, noteIndex:0, saved:false, notes:NOTES };

  /* ---------- YARDIMCILAR ---------- */
  const $ = (id) => document.getElementById(id);
  const screens = ["welcome","question","analyzing","person","notes","end"];

  function show(id){
    screens.forEach(s => $("screen-"+s).classList.toggle("active", s===id));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  /* ---------- Arka plan: yumuşak parlayan küreler ---------- */
  function spawnOrbs(){
    const layer = $("bgLayer");
    for(let i=0;i<9;i++){
      const o = document.createElement("div");
      o.className = "bg-orb";
      const size = 50 + Math.random()*90;
      o.style.width = size + "px";
      o.style.height = size + "px";
      o.style.left = (Math.random()*100) + "vw";
      const dur = 18 + Math.random()*16;
      o.style.animationDuration = dur + "s";
      o.style.animationDelay = (-Math.random()*dur) + "s";
      layer.appendChild(o);
    }
  }

  /* ---------- Kararlı seçim (aynı girdi -> aynı sonuç) ---------- */
  function seedPick(str, arr){
    let h = 0;
    for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
    return arr[h % arr.length];
  }

  /* Admin'in yazdığı fal sonucu:
     1) localStorage (panelde canlı düzenleme)
     2) result.json (GitHub'a yüklenince kalıcı, herkese görünür)
     3) şablon */
  let PERSISTENT_RESULT = null;
  async function loadPersistentResult(){
    try{
      const res = await fetch('result.json?v=' + Date.now());
      if(!res.ok) return;
      const r = await res.json();
      if(r && (r.person || r.wants || (Array.isArray(r.notes) && r.notes.some(n => n && n.trim())))){
        PERSISTENT_RESULT = r;
      }
    }catch(e){ /* file:// veya dosya yok -> localStorage/şablon kullanılır */ }
  }
  function getCustomResult(){
    try {
      const ls = JSON.parse(localStorage.getItem(RESULT_KEY) || "null");
      if(ls && (ls.person || ls.wants || (Array.isArray(ls.notes) && ls.notes.some(n => n && n.trim())))){
        return ls;
      }
    } catch {}
    return PERSISTENT_RESULT;
  }
  function getNotes(){
    const c = getCustomResult();
    if(c && Array.isArray(c.notes) && c.notes.some(n => n && n.trim())){
      return c.notes.map(n => n||"").filter(n => n.trim());
    }
    return NOTES;
  }

  /* ---------- 1. KARŞILAMA ---------- */
  function start(){
    const name = $("nameInput").value.trim();
    if(!name){ $("nameHint").hidden=false; $("nameInput").focus(); return; }
    $("nameHint").hidden=true;
    state.name = name;
    state.qIndex = 0;
    state.answers = {};
    renderQuestion();
    show("question");
  }

  /* ---------- 2. SORULAR ---------- */
  function renderQuestion(){
    const q = QUESTIONS[state.qIndex];
    $("qCounter").textContent = `Soru ${state.qIndex+1} / ${QUESTIONS.length}`;
    $("progressBar").style.width = ((state.qIndex)/QUESTIONS.length*100) + "%";
    $("qTitle").textContent = q.title;

    const wrap = $("qOptions");
    wrap.innerHTML = "";

    if(q.type === "number"){
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = q.min; inp.max = q.max;
      inp.value = state.answers[q.id] ?? "";
      inp.placeholder = q.placeholder;
      inp.className = "num-input";
      inp.style.cssText = "width:100%;padding:14px 18px;border:2px solid #f0d6e4;border-radius:18px;font-family:inherit;font-size:1.05rem;outline:none;text-align:center";
      inp.addEventListener("focus",()=>inp.style.borderColor="var(--pink)");
      inp.addEventListener("blur",()=>inp.style.borderColor="#f0d6e4");
      inp.addEventListener("input", () => { state.answers[q.id] = inp.value; });
      wrap.appendChild(inp);
      setTimeout(()=>inp.focus(),60);
    } else {
      q.opts.forEach(opt => {
        const b = document.createElement("button");
        b.textContent = opt;
        if(state.answers[q.id] === opt) b.classList.add("sel");
        b.addEventListener("click", () => {
          state.answers[q.id] = opt;
          wrap.querySelectorAll("button").forEach(x=>x.classList.remove("sel"));
          b.classList.add("sel");
        });
        wrap.appendChild(b);
      });
    }

    $("btnBack").style.visibility = state.qIndex===0 ? "hidden" : "visible";
    $("btnNext").textContent = state.qIndex===QUESTIONS.length-1 ? "Falımı Aç 🔮" : "Devam →";
    $("qSkip").style.visibility = q.type==="choice" ? "visible" : "hidden";
  }

  function nextQuestion(){
    const q = QUESTIONS[state.qIndex];
    if(q.type === "number" && !state.answers[q.id]){
      alert("Lütfen yaşını gir 💕");
      return;
    }
    if(state.qIndex < QUESTIONS.length-1){
      state.qIndex++;
      renderQuestion();
    } else {
      saveParticipant();
      runAnalyzing();
    }
  }
  function backQuestion(){
    if(state.qIndex>0){ state.qIndex--; renderQuestion(); }
  }
  function skipQuestion(){
    if(state.qIndex < QUESTIONS.length-1){ state.qIndex++; renderQuestion(); }
    else { saveParticipant(); runAnalyzing(); }
  }

  /* ---------- 3. ANALİZ ---------- */
  const ANALIZ_MSGS = [
    "Cevapların kararlaştırılıyor...",
    "Kalbinin ritmi okunuyor...",
    "Yıldızların sırrı çözülüyor...",
    "Kader çizgilerin taranıyor...",
    "Sizi bekleyen kişi belirleniyor...",
    "Falın hazırlanıyor...",
  ];
  function runAnalyzing(){
    show("analyzing");
    let p = 0, mi = 0;
    $("analizTitle").textContent = ANALIZ_MSGS[0];
    $("analizSub").textContent = "Bir saniye, yıldızlar hizalanıyor...";
    const t = setInterval(() => {
      p += Math.random()*3.5 + 1.2;
      if(p > 100) p = 100;
      $("analizBar").style.width = p + "%";
      $("analizPercent").textContent = "%"+Math.floor(p);
      if(Math.floor(p/17) !== mi && mi < ANALIZ_MSGS.length-1){
        mi++;
        $("analizTitle").textContent = ANALIZ_MSGS[mi];
      }
      if(p >= 100){
        clearInterval(t);
        $("analizTitle").textContent = "Tamamlandı ✨";
        $("analizSub").textContent = "Sizi bekleyen kişi bulundu...";
        setTimeout(revealPerson, 900);
      }
    }, 250);
  }

  /* ---------- 4. SİZİ BEKLEYEN KİŞİ ---------- */
  function revealPerson(){
    const c = getCustomResult();
    $("personName").textContent = state.name + ", sizi bekleyen kişi bulundu";
    // Kişi açıklaması SABİT (FIXED_PERSON) — değişmez
    $("personText").textContent = FIXED_PERSON;
    // "Senden istediği": admin yazdıysa o, yoksa şablondan
    if(c && c.wants){
      $("personWants").textContent = c.wants;
    } else {
      const seed = state.name + JSON.stringify(state.answers);
      $("personWants").textContent = seedPick(seed, PERSONAS).wants;
    }
    show("person");
  }

  /* ---------- 5. NOTLAR ---------- */
  function startNotes(){
    state.noteIndex = 0;
    state.notes = getNotes();
    renderDots();
    showNote();
    show("notes");
  }
  function renderDots(){
    const d = $("noteDots");
    d.innerHTML = "";
    state.notes.forEach((_,i) => { const e=document.createElement("i"); if(i<=state.noteIndex) e.classList.add("on"); d.appendChild(e); });
  }
  function showNote(){
    $("noteNum").textContent = `${state.noteIndex+1} / ${state.notes.length}`;
    const t = $("noteText");
    t.classList.remove("in");
    t.textContent = state.notes[state.noteIndex];
    void t.offsetWidth; // reflow -> animasyon tetik
    t.classList.add("in");
    renderDots();
    $("btnNextNote").textContent = state.noteIndex===state.notes.length-1 ? "Falımı Tamamla 💜" : "Devam →";
  }
  function nextNote(){
    if(state.noteIndex < state.notes.length-1){ state.noteIndex++; showNote(); }
    else { showEnd(); }
  }

  /* ---------- 6. BİTİŞ ---------- */
  function showEnd(){
    $("endText").textContent = `${state.name}, seni bekleyen kişi yolda. Bu notları sakla — zamanı geldiğinde hepsi gerçek olacak.`;
    show("end");
  }
  function restart(){
    state.name=""; state.answers={}; state.qIndex=0; state.noteIndex=0; state.notes=NOTES;
    $("nameInput").value="";
    show("welcome");
  }
  function shareResult(){
    const notes = (state.notes && state.notes.length ? state.notes : NOTES);
    const txt = `Sanal Fal ✨\nBen: ${state.name}\nSizi bekleyen kişi: ${$("personText").textContent}\nSenden istediği: ${$("personWants").textContent}\n\nNotlar:\n${notes.map((n,i)=>`${i+1}. ${n}`).join("\n")}`;
    navigator.clipboard?.writeText(txt).then(()=>alert("Sonucun kopyalandı! Yapıştırıp paylaşabilirsin 💌"))
      .catch(()=>alert("Kopyalanamadı, elle seçebilirsin."));
  }

  /* ---------- KATILIMCI KAYDI (localStorage) ---------- */
  function saveParticipant(){
    if(state.saved) return;
    state.saved = true;
    const rec = {
      ad: state.name,
      yas: state.answers.yas || "-",
      hobi: state.answers.hobi || "-",
      mevsim: state.answers.mevsim || "-",
      aksam: state.answers.aksam || "-",
      renk: state.answers.renk || "-",
      ask: state.answers.ask || "-",
      tatil: state.answers.tatil || "-",
      aranan: state.answers.aranan || "-",
      mutlu: state.answers.mutlu || "-",
      gelecek: state.answers.gelecek || "-",
      tarih: new Date().toLocaleString("tr-TR"),
      ts: Date.now(),
    };
    // yerel yedek (Firebase olmasa da çalışır)
    try{
      const list = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      list.push(rec);
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
    }catch(e){}
    // tüm cihazlardan toplamak için Firestore
    if(db){
      db.collection("katilimcilar").add(rec).catch(e => console.warn("Firestore yazma hatası:", e));
    }
  }

  /* ---------- BAĞLANTILAR ---------- */
  function bind(){
    $("btnStart").addEventListener("click", start);
    $("nameInput").addEventListener("keydown", e => { if(e.key==="Enter") start(); });
    $("btnNext").addEventListener("click", nextQuestion);
    $("btnBack").addEventListener("click", backQuestion);
    $("qSkip").addEventListener("click", skipQuestion);
    $("btnToNotes").addEventListener("click", startNotes);
    $("btnNextNote").addEventListener("click", nextNote);
    $("btnRestart").addEventListener("click", restart);
    $("btnShare").addEventListener("click", shareResult);

    // Gizli admin girişi: karşılama ekranındaki 💜 simgesine 5 kez hızlıca tıkla
    let clicks=0, timer=null;
    const brand=$("brandEmoji");
    if(brand){
      brand.style.cursor="pointer";
      brand.addEventListener("click", () => {
        clicks++;
        clearTimeout(timer);
        timer=setTimeout(()=>{clicks=0;},2000);
        if(clicks>=5){ clicks=0; location.href="admin.html"; }
      });
    }
  }

  /* ---------- BAŞLAT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    spawnOrbs();
    bind();
    initFirebase();
    loadPersistentResult();
    show("welcome");
  });
})();
