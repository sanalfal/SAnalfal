/* =========================================================
   Sanal Fal — Yönetim paneli
   DİKKAT: Şifre istemci tarafında tutulur; gerçek koruma için
   sunucu tarafı doğrulama gerekir. Demo amaçlıdır.
   ========================================================= */
(() => {
  "use strict";

  // >>> YÖNETİCİ ŞİFRESİ — burayı değiştir <<<
  const ADMIN_PASSWORD = "sanalfal2024";

  const STORE_KEY = "sanalfal_participants";
  const SESSION_KEY = "sanalfal_admin_session";
  const RESULT_KEY = "sanalfal_result";

  const $ = (id) => document.getElementById(id);
  const COLS = ["ad","yas","hobi","mevsim","aksam","renk","ask","tatil","aranan","mutlu","gelecek","tarih"];

  let lastData = [];
  let falDocIds = [];
  let unsub = null;

  function show(id){ ["lock","panel"].forEach(s => $("screen-"+s).classList.toggle("active", s===id)); }

  function login(){
    const v = $("pwInput").value;
    if(v === ADMIN_PASSWORD){
      sessionStorage.setItem(SESSION_KEY, "1");
      show("panel");
      startLoading();
    } else {
      $("pwHint").hidden = false;
      $("pwInput").value="";
      $("pwInput").focus();
    }
  }

  function getData(){ try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; } }
  function esc(s){ return String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

  function renderRows(data){
    lastData = data;
    $("countChip").textContent = data.length + " kişi";
    const tb = $("tbody");
    if(!data.length){
      tb.innerHTML = `<tr><td colspan="13" class="no-data">Henüz katılımcı yok. 💜</td></tr>`;
      return;
    }
    tb.innerHTML = data.map((d,i) =>
      "<tr><td>"+(i+1)+"</td>" +
      COLS.map(c => "<td>"+esc(d[c] ?? "-")+"</td>").join("") +
      "</tr>"
    ).join("");
  }

  function startLoading(){
    const db = window.initFalFirebase ? window.initFalFirebase() : null;
    if(db){
      try{
        // Canlı: yeni katılımcı geldiğinde tablo kendiliğinden güncellenir
        unsub = db.collection("katilimcilar").orderBy("ts","asc").onSnapshot(snap => {
          const data = []; falDocIds = [];
          snap.forEach(doc => { data.push(doc.data()); falDocIds.push(doc.id); });
          renderRows(data);
        }, err => { console.warn("Firestore dinleme hatası:", err); renderRows(getData()); });
      }catch(e){
        console.warn(e);
        renderRows(getData());
      }
    } else {
      // Firebase yoksa localStorage (eski davranış)
      renderRows(getData());
    }
  }

  function exportCSV(){
    const data = lastData.length ? lastData : getData();
    if(!data.length){ alert("Dışa aktarılacak katılımcı yok."); return; }
    const header = ["#","Ad","Yaş","Hobi","Mevsim","İdeal Akşam","Renk","Aşk","Tatil","Aradığı","Mutluluk","Gelecek","Tarih"];
    const rows = data.map((d,i) => [i+1, ...COLS.map(c => d[c] ?? "-")]);
    const csv = [header, ...rows]
      .map(r => r.map(v => { const s = String(v).replace(/"/g,'""'); return /[",;\n]/.test(s) ? '"'+s+'"' : s; }).join(";"))
      .join("\r\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sanalfal-katilimcilar.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function clearAll(){
    if(!confirm("TÜM katılımcı kayıtları silinecek. Emin misin?")) return;
    const db = window.initFalFirebase ? window.initFalFirebase() : null;
    if(db && falDocIds.length){
      try{
        const batch = db.batch();
        falDocIds.forEach(id => batch.delete(db.collection("katilimcilar").doc(id)));
        await batch.commit();
        return;
      }catch(e){ console.warn("Silme hatası:", e); }
    }
    localStorage.removeItem(STORE_KEY);
    renderRows(getData());
  }

  /* ----- Sekmeler ----- */
  function switchTab(name){
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab===name));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.toggle("active", p.id==="tab-"+name));
    if(name==="sonuc") loadResult();
  }

  /* ----- Fal Sonucu: "Senden istediği" + kısa notlar ----- */
  function getResult(){ try { return JSON.parse(localStorage.getItem(RESULT_KEY) || "null"); } catch { return null; } }

  function loadResult(){
    const r = getResult();
    $("resWants").value = (r && r.wants) ? r.wants : "";
    for(let i=1;i<=5;i++){ $("resNote"+i).value = (r && Array.isArray(r.notes)) ? (r.notes[i-1]||"") : ""; }
    resStatus("", false);
  }

  function collectFromFields(){
    const wants = $("resWants").value.trim();
    const notes = [];
    for(let i=1;i<=5;i++){ const v = $("resNote"+i).value.trim(); if(v) notes.push(v); }
    return { wants, notes };
  }

  function saveResult(){
    const { wants, notes } = collectFromFields();
    if(!wants && !notes.length){
      localStorage.removeItem(RESULT_KEY);
      resStatus("Tüm alanlar boş — varsayılan 'senden istediği' ve notlar kullanılacak.", true);
      return;
    }
    localStorage.setItem(RESULT_KEY, JSON.stringify({ wants, notes }));
    resStatus("Kaydedildi ✓ Bu tarayıcıda canlı görünür. Kalıcı için result.json indir.", false);
  }

  function resetResult(){
    if(!confirm("Fal sonucu varsayılana döndürülecek. Emin misin?")) return;
    localStorage.removeItem(RESULT_KEY);
    loadResult();
    resStatus("Varsayılana döndü. Şablon 'senden istediği' ve notlar kullanılacak.", true);
  }

  function exportResultFile(){
    const saved = getResult();
    const { wants, notes } = (saved && (saved.wants || (saved.notes && saved.notes.length)))
      ? { wants: saved.wants||"", notes: saved.notes||[] }
      : collectFromFields();
    if(!wants && !notes.length){
      alert("Önce 'Senden istediği' ve/veya notları yazıp Kaydet, sonra bu dosyayı indir.");
      return;
    }
    const obj = { wants, notes };
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], {type:"application/json;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "result.json";
    a.click();
    URL.revokeObjectURL(a.href);
    alert(
      "result.json indirildi ✅\n\n" +
      "Dosyayı proje klasörüne koy (varsa üstüne yaz), sonra hepsini GitHub'a yükle.\n" +
      "'Senden istediği' ve notlar herkese kalıcı görünür."
    );
  }

  function resStatus(msg, warn){
    const el = $("resStatus");
    if(!msg){ el.hidden=true; el.textContent=""; return; }
    el.hidden=false;
    el.textContent = msg;
    el.style.color = warn ? "var(--rose)" : "#2e8b6f";
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("btnLogin").addEventListener("click", login);
    $("pwInput").addEventListener("keydown", e => { if(e.key==="Enter") login(); });
    $("btnExport").addEventListener("click", exportCSV);
    $("btnClear").addEventListener("click", clearAll);

    // Sekmeler
    document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));
    // Fal sonucu
    $("btnSaveResult").addEventListener("click", saveResult);
    $("btnResetResult").addEventListener("click", resetResult);
    $("btnExportResult").addEventListener("click", exportResultFile);

    if(sessionStorage.getItem(SESSION_KEY) === "1"){
      show("panel"); startLoading();
    } else {
      show("lock");
    }
  });
})();
