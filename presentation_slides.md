# MakeDoc Sunumu

---

## Slayt 1: Kapak

**Başlık:** MakeDoc
**Alt Başlık:** Hukuk Bürosu Doküman Yönetim ve Otomasyon Sistemi
**Hazırlayan:** Mete Albayram
**Tarih:** 2026

---

## Slayt 2: Gündem

1.  Mevcut Durum ve Sorunlar
2.  Çözümümüz: MakeDoc Nedir?
3.  Temel Özellikler
4.  Teknolojik Altyapı
5.  Sistem Mimarisi
6.  Gelecek Planları (Roadmap)
7.  Soru & Cevap

---

## Slayt 3: Mevcut Durum ve Sorunlar

Hukuk bürolarında belge hazırlama süreçlerinde yaşanan temel zorluklar:

*   **Zaman Kaybı:** Tekrar eden verilerin (isim, adres, tarih) manuel girilmesi.
*   **Format Hataları:** Farklı editörlerden kaynaklanan kaymalar ve bozuk çıktılar.
*   **Standart Eksikliği:** Ofis genelinde tek tip belge yapısının korunamaması.
*   **Arşivleme Zorluğu:** Fiziksel veya dağınık dijital arşivlerde belge bulma güçlüğü.

---

## Slayt 4: Çözümümüz: MakeDoc

MakeDoc, bu sorunları ortadan kaldıran modern bir web platformudur.

*   **Otomasyon:** Şablonlar sayesinde saniyeler içinde hatasız belge üretimi.
*   **Bulut Tabanlı:** Her yerden erişilebilir, kurulum gerektirmeyen yapı.
*   **WYSIWYG (Ne Görüyorsan O):** Ekranda tasarladığınız belgenin aynısını PDF olarak alma garantisi.
*   **Güvenli Depolama:** Tüm belgeleriniz şifreli ve güvenli sunucularda saklanır.

---

## Slayt 5: Temel Özellikler - 1 (Şablon & Editör)

*   **Dinamik Şablonlar:**
    *   Kira Sözleşmeleri
    *   Dilekçeler
    *   Resmi Görevlendirme Yazıları
    *   *Tek tıkla şablon yükleme ve değişken doldurma.*

*   **Zengin Metin Editörü:**
    *   Tarayıcı üzerinde Word benzeri deneyim.
    *   Kalın, İtalik, Liste, Hizalama ve Tablo desteği.
    *   Islak imza görseli ekleme özelliği.

---

## Slayt 6: Temel Özellikler - 2 (PDF Motoru)

MakeDoc'un en güçlü yanı, gelişmiş PDF oluşturma motorudur.

*   **Puppeteer Altyapısı:** Arka planda çalışan Headless Chrome motoru.
*   **Piksel Mükemmelliği:** CSS ile tasarlanan sayfanın, milimetrik hassasiyetle A4 kağıdına dökülmesi.
*   **Akıllı Kenar Boşlukları:** Sayfa geçişlerinin ve baskı paylarının otomatik ayarlanması.

---

## Slayt 7: Teknik Mimari (Genel Bakış)

Proje, modern ve ölçeklenebilir teknolojiler üzerine inşa edilmiştir.

*   **Frontend (Önyüz):** React, Vite, Tailwind CSS
    *   *Hızlı, duyarlı ve modern kullanıcı arayüzü.*
*   **Backend (Arkayüz):** Node.js, Express.js
    *   *Yüksek performanslı REST API.*
*   **Veritabanı:** MongoDB
    *   *Esnek doküman tabanlı veri saklama.*

---

## Slayt 8: Teknik Derinleşme (PDF Süreci)

Belge oluşturma akışı şu şekilde işler:

1.  **İstemci (Client):** Kullanıcı editörde içeriği hazırlar ve "Kaydet"e basar.
2.  **API:** HTML içeriği sunucuya gönderilir.
3.  **Puppeteer:** Sunucu, bu HTML'i sanal bir tarayıcıda render eder.
4.  **PDF Generation:** Render edilen sayfa PDF formatına dönüştürülür ve diske kaydedilir.
5.  **Veritabanı:** Dosya yolu ve meta veriler MongoDB'ye işlenir.

---

## Slayt 9: Kullanıcı Deneyimi (UX)

Kullanıcı dostu arayüz tasarımı ön plandadır.

*   **Dashboard:** Son belgelerin, istatistiklerin ve hızlı erişim menülerinin olduğu özet ekran.
*   **Karanlık Mod (Dark Mode):** Göz yormayan çalışma ortamı için tema desteği.
*   **Sürükle-Bırak:** Dosya ekleri ve imza görselleri için kolay yükleme alanı.

---

## Slayt 10: Güvenlik ve Veri Yönetimi

*   **Kimlik Doğrulama:** JWT (JSON Web Token) ile güvenli oturum yönetimi.
*   **Şifreleme:** Kullanıcı parolaları `bcrypt` ile hash'lenerek saklanır.
*   **Yetkilendirme:** Her kullanıcı sadece kendi belgelerine erişebilir.
*   **Yedekleme:** Dosyalar sunucuda, referanslar veritabanında düzenli yapıdadır.

---

## Slayt 11: Gelecek Planları (Roadmap)

MakeDoc projesini daha da ileriye taşımak için planlanan özellikler:

*   **Yapay Zeka (AI) Asistanı:** Gemini API entegrasyonu ile dava özetinden otomatik dilekçe taslağı oluşturma.
*   **UYAP Entegrasyonu:** Oluşturulan belgelerin doğrudan UYAP formatına uygun dışa aktarımı.
*   **Takvim Modülü:** Duruşma ve belge teslim tarihlerinin takibi.
*   **Mobil Uygulama:** Avukatların adliyede cepten belge görüntüleyebilmesi.

---

## Slayt 12: Teşekkür

Dinlediğiniz için teşekkürler.

**Sorularınız?**

*İletişim:* [E-posta Adresiniz]
*Proje Linki:* [GitHub Repo Linki]

---
