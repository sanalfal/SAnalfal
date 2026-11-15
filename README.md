# Sanal Fal

Kızlara yönelik romantik temalı "sanal fal" sitesi: İsim → 10 soru → "fal açılıyor" animasyonu → "sizi bekleyen kişi" → 5 kısa not → bitiş. Ayrıca gizli admin paneli.

## Dosyalar
- `index.html` / `css/style.css` / `js/app.js` — ana site
- `admin.html` / `js/admin.js` — gizli yönetim paneli
- `js/firebase-config.js` — **Firebase ayarların (bunu dolduracaksın)**
- `result.json` — admin'in yazdığı kalıcı "senden istediği" + notlar (GitHub'a yüklenince herkese görünür)

## Admin panele giriş
- Sitede sağ alt köşedeki sönük 🔒 simgesine tıkla (ya da `admin.html`'i aç).
- Şifre: `sanalfal2024` → `js/admin.js` içindeki `ADMIN_PASSWORD`'ten değiştirebilirsin.

## ⭐ TÜM CİHAZLARDAN katılımcı toplamak (Firebase)
Yukarıdaki yönergeler `js/firebase-config.js` içinde de var. Özet:

1. https://console.firebase.google.com → **Proje ekle** (ücretsiz).
2. Proje açılınca **</> Web** simgesine tıkla → takma ad → kaydet. Ekrana gelen `firebaseConfig`'i kopyala.
3. `js/firebase-config.js` aç → `BURAYA...` değerlerini kendi değerlerinle değiştir. Kaydet.
4. Sol menü → **Build → Firestore Database → Create database** → bölge → Enable.
5. Firestore → **Rules** sekmesi → şu kuralı yapıştır → **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /katilimcilar/{doc} {
         allow read, write: if true;
       }
     }
   }
   ```
6. Tüm dosyaları GitHub'a yükle.

Artık her cihazdan girilen fal cevapları Firestore'a yazılır; admin paneli **herkesi** canlı görür (yeni katılımcı geldiğinde tablo kendiliğinden güncellenir). Firebase'i doldurmadan da site çalışır; o zaman katılımcılar yine sadece o tarayıcıda (localStorage) kalır.

> Güvenlik: Yukarıdaki açık kural herkesin yazmasına izin verir (fal formu için gerekli). Daha sıkı koruma istersen Firebase Auth eklenmeli. Admin şifresi istemci tarafındadır; kaynak kodu gören bulur — gerçek koruma sunucu tarafı ister.

## "Sizi bekleyen kişi" açıklaması SABİT
Açıklama `js/app.js` içindeki `FIXED_PERSON` değişkenine yazılmıştır:
```
Esmer, uzun boylu, poslu, gözlüklü, sayısalcı.
```
Değiştirmek istersen o satırı düzenle.

## "Senden istediği" ve notları kalıcı yapma (result.json)
1. Admin → **Fal Sonucu** sekmesine yaz → **Kaydet**.
2. **"Kalıcı Yap · result.json indir"** → dosyayı proje klasörüne koy (üstüne yaz).
3. GitHub'a yükle. Böylece herkese kalıcı görünür.

## GitHub Pages'te yayınlama
1. Tüm dosyaları bir GitHub reposuna yükle (kök dizine).
2. Repo → **Settings → Pages** → Source: `main` / `/root` → Save.
3. 1-2 dk sonra `https://kullaniciadi.github.io/repo-adi/` yayında.
