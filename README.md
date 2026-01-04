# MakeDoc - Hukuk Bürosu Doküman Yönetim Sistemi

MakeDoc, avukatlar ve hukuk büroları için geliştirilmiş, şablon tabanlı otomatik hukuki belge (PDF) oluşturma ve yönetim sistemidir.

## 🚀 Özellikler

*   **Şablon Yönetimi:** Kira sözleşmeleri, dilekçeler ve resmi yazılar için hazır şablonlar.
*   **Otomatik PDF Oluşturma:** `Puppeteer` altyapısı ile ekrandaki tasarımın birebir aynısı (1:1) PDF çıktısı.
*   **Doküman Düzenleme:** Zengin metin editörü ile belgeleri düzenleme ve özelleştirme.
*   **Dosya Yönetimi:** Dokümanları taslak olarak kaydetme, arşivleme ve dışa aktarma.
*   **Kullanıcı Yönetimi:** Kayıt olma, giriş yapma ve profil yönetimi.

## 🛠️ Teknolojiler

Bu proje modern web teknolojileri kullanılarak geliştirilmiştir:

*   **Frontend:** React (Vite), Tailwind CSS
*   **Backend:** Node.js, Express.js
*   **Veritabanı:** MongoDB
*   **PDF Motoru:** Puppeteer (Headless Chrome)

## 📦 Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
*   Node.js (v18 veya üzeri)
*   MongoDB (Yerel veya Atlas URL)

### 1. Projeyi Klonlayın
```bash
git clone <repo-url>
cd makeDoc
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
```
`.env` dosyasını oluşturun ve gerekli değişkenleri tanımlayın:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/makedoc (veya Atlas URI)
JWT_SECRET=gizli_anahtariniz
```
Sunucuyu başlatın:
```bash
npm run dev
```

### 3. Frontend Kurulumu
```bash
cd ../frontend
npm install
```
Uygulamayı başlatın:
```bash
npm run dev
```

## 📝 Kullanım

1.  Uygulamayı tarayıcıda açın (Genellikle `http://localhost:5173`).
2.  Kayıt olun ve giriş yapın.
3.  "Create New" butonuna tıklayarak yeni bir belge oluşturun.
4.  Bir şablon seçin (Örn: Konut Kira Sözleşmesi) ve alanları doldurun.
5.  "Save Document" butonuna basarak dokümanı PDF olarak oluşturun ve kaydedin.

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
