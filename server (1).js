const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Sadece aynı dizindeki dosyaları sun (index.html vb.)
app.use(express.static(__dirname));

const MARKER = '\n---SIGNATURE_DATA---\n';

// 1. Anahtar Çifti Üret
app.get('/api/keys', (req, res) => {
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        res.json({ publicKey, privateKey });
    } catch (error) {
        console.error("Anahtar üretme hatası:", error);
        res.status(500).json({ error: "Anahtar üretilemedi." });
    }
});

// 2. Belgeyi İmzala
app.post('/api/sign', upload.single('pdf'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "PDF dosyası eksik." });
        
        const { privateKey, publicKey, signerName } = req.body;
        if (!privateKey || !publicKey || !signerName) {
            return res.status(400).json({ error: "Eksik parametreler (anahtarlar veya imzalayan)." });
        }

        const pdfBuffer = req.file.buffer;

        // SHA-256 Özeti Hesapla (orijinal dosya)
        const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        // İmzala (Orijinal dosyanın buffer'ını doğrudan imzalıyoruz, SHA256 kullanarak)
        const sign = crypto.createSign('SHA256');
        sign.update(pdfBuffer);
        sign.end();
        const signature = sign.sign(privateKey, 'base64');

        const timestamp = new Date().toISOString();

        // Gömülecek Veri
        const embedData = {
            signature,
            publicKey,
            originalHash: hash,
            signerName,
            timestamp
        };

        // Veriyi PDF'in sonuna ekle
        const markerBuffer = Buffer.from(MARKER, 'utf-8');
        const payloadBuffer = Buffer.from(JSON.stringify(embedData), 'utf-8');
        const signedPdfBuffer = Buffer.concat([pdfBuffer, markerBuffer, payloadBuffer]);

        res.json({
            success: true,
            signedPdfBase64: signedPdfBuffer.toString('base64'),
            signature,
            originalHash: hash,
            timestamp
        });
    } catch (error) {
        console.error("İmzalama hatası:", error);
        res.status(500).json({ error: "İmzalama işlemi başarısız.", details: error.message });
    }
});

// 3. Doğrula
app.post('/api/verify', upload.single('pdf'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "PDF dosyası eksik." });

        let currentBuffer = req.file.buffer;
        const markerBuffer = Buffer.from(MARKER, 'utf-8');
        
        const signatures = [];
        let isAllValid = true;
        let hasSignatures = false;

        while (true) {
            const markerIndex = currentBuffer.lastIndexOf(markerBuffer);
            if (markerIndex === -1) break; // Başka imza kalmadı
            hasSignatures = true;

            // Dosyayı ayır
            const pdfPart = currentBuffer.slice(0, markerIndex);
            const payloadPart = currentBuffer.slice(markerIndex + markerBuffer.length);

            let embedData;
            try {
                embedData = JSON.parse(payloadPart.toString('utf-8'));
            } catch (e) {
                isAllValid = false;
                break;
            }

            const { signature, publicKey, originalHash, signerName, timestamp } = embedData;

            // Anlık Hash Hesapla
            const currentHash = crypto.createHash('sha256').update(pdfPart).digest('hex');

            // Doğrula
            const verify = crypto.createVerify('SHA256');
            verify.update(pdfPart);
            verify.end();
            
            let isThisValid = false;
            try {
                isThisValid = verify.verify(publicKey, signature, 'base64');
            } catch (err) {
                isThisValid = false;
            }

            if (currentHash !== originalHash) {
                isThisValid = false;
            }

            if (!isThisValid) {
                isAllValid = false;
                break;
            }

            signatures.push({
                originalHash: currentHash,
                embeddedHash: originalHash,
                signerName,
                timestamp,
                signatureShort: signature.substring(0, 30) + '...'
            });

            // Bir önceki (iç içe) imzanın kontrolü için buffer'ı güncelle
            currentBuffer = pdfPart;
        }

        if (!hasSignatures) {
            return res.json({
                valid: false,
                error: "DİGİTAL İMZA BULUNAMADI: Dosyada gömülü imza verisi yok."
            });
        }

        if (!isAllValid) {
            return res.json({
                valid: false,
                error: "Geçersiz veya kurcalanmış imza tespit edildi."
            });
        }

        // signatures dizisi en sondan en başa (en dıştan en içe) doğru doldu.
        // Kronolojik sıra için tersine çeviriyoruz.
        signatures.reverse();

        res.json({
            valid: true,
            signatures: signatures
        });

    } catch (error) {
        console.error("Doğrulama hatası:", error);
        res.status(500).json({ error: "Doğrulama işlemi sırasında sunucu hatası." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
