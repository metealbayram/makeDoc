import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../services/api"


const INITIAL_CONTENT = `
<p class="text-slate-400 italic">[Start typing or editing here...]</p>
`



export default function CreateDocumentPage() {
  const { id } = useParams();
  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
        const fetchDocument = async () => {
            try {
                const response = await api.get(`/documents/${id}`);
                const doc = response.data.data;
                setTitle(doc.title);
                setName(doc.name);
                setContent(doc.content);
                if (editorRef.current) {
                    editorRef.current.innerHTML = doc.content;
                }
            } catch (error) {
                console.error("Failed to load document", error);
                alert("Failed to load document for editing");
                navigate("/documents");
            }
        };
        fetchDocument();
    }
  }, [id, navigate]);

  useEffect(() => {
      if (editorRef.current && !id) {
          editorRef.current.innerHTML = content;
      }
  }, []);

  const handleCreate = async () => {
    setLoading(true)
    try {
        // Collect current content from contenteditable div if ref exists
        const currentContent = editorRef.current ? editorRef.current.innerHTML : content;

        if (id) {
            await api.put(`/documents/${id}`, { 
                title: title || "Untitled Document", 
                name: name || "Unknown Client", 
                content: currentContent
            })
        } else {
            await api.post("/documents/create", { 
                title: title || "New Document", 
                name: name || "Unknown Client", 
                content: currentContent, 
                status: "Draft" 
            })
        }
        navigate("/documents")
    } catch (err: any) {
      console.error(err)
      alert("Failed to save document")
    } finally {
      setLoading(false)
    }
  }

  // Simple formatting helpers
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleReset = () => {
    if (editorRef.current) {
        editorRef.current.innerHTML = INITIAL_CONTENT;
    }
  }

  const insertTemplate = (type: string) => {
    if (!editorRef.current) return;

    let templateHtml = "";

        if (type === "rental_agreement") {
        templateHtml = `
            <div style="font-family: Roboto, Arial, sans-serif; color: black; line-height: 1.3; font-size: 11pt;">
                <!-- Başlık (Table for PDF Border Support) -->
                <table style="width: 100%; margin-bottom: 20px;">
                    <tr>
                        <td style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px;">
                            <span style="font-weight: bold; font-size: 16pt;">KONUT KİRA SÖZLEŞMESİ</span>
                        </td>
                    </tr>
                </table>

                <!-- Taraflar Tablosu -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; width: 30%; background-color: #f0f0f0;">KİRAYA VEREN</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRAYA_VEREN_ADI_SOYADI}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #f0f0f0;">T.C. KİMLİK NO</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRAYA_VEREN_TC}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #f0f0f0;">ADRESİ</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRAYA_VEREN_ADRES}}</td>
                    </tr>
                    <tr><td colspan="2" style="height: 10px; border-left: 1px solid transparent; border-right: 1px solid transparent;"></td></tr>
                     <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; width: 30%; background-color: #f0f0f0;">KİRACI</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRACI_ADI_SOYADI}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #f0f0f0;">T.C. KİMLİK NO</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRACI_TC}}</td>
                    </tr>
                     <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; background-color: #f0f0f0;">ADRESİ</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRACI_ADRES}}</td>
                    </tr>
                </table>

                <!-- Taşınmaz Bilgileri -->
                 <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr style="background-color: #e0e0e0;">
                        <td colspan="2" style="border: 1px solid black; padding: 5px; font-weight: bold; text-align: center;">KİRALANAN TAŞINMAZ BİLGİLERİ</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; width: 30%;">İL / İLÇE</td>
                        <td style="border: 1px solid black; padding: 5px;">{{TASINMAZ_IL_ILCE}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">MAHALLE / SOKAK</td>
                        <td style="border: 1px solid black; padding: 5px;">{{TASINMAZ_MAHALLE_SOKAK}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">KAPI NO / DAİRE</td>
                        <td style="border: 1px solid black; padding: 5px;">{{TASINMAZ_KAPI_DAIRE}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">KİRALANANIN CİNSİ</td>
                        <td style="border: 1px solid black; padding: 5px;">{{TASINMAZ_CINSI}} (Daire/Dükkan vb.)</td>
                    </tr>
                </table>

                <!-- Sözleşme Şartları -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr style="background-color: #e0e0e0;">
                        <td colspan="2" style="border: 1px solid black; padding: 5px; font-weight: bold; text-align: center;">SÖZLEŞME ŞARTLARI</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold; width: 30%;">1. KİRA SÜRESİ</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRA_SURESI}} (Yıl/Ay)</td>
                    </tr>
                     <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">2. BAŞLANGIÇ TARİHİ</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRA_BASLANGIC_TARIHI}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">3. KİRA BEDELİ (Aylık)</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRA_BEDELI_AYLIK}} TL</td>
                    </tr>
                     <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">4. KİRA BEDELİ (Yıllık)</td>
                        <td style="border: 1px solid black; padding: 5px;">{{KIRA_BEDELI_YILLIK}} TL</td>
                    </tr>
                     <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">5. DEPOZİTO</td>
                        <td style="border: 1px solid black; padding: 5px;">{{DEPOZITO_MIKTARI}} TL</td>
                    </tr>
                     <tr>
                        <td style="border: 1px solid black; padding: 5px; font-weight: bold;">6. ÖDEME ŞEKLİ</td>
                        <td style="border: 1px solid black; padding: 5px;">Her ayın {{ODEME_GUNU}}'ne kadar banka yoluyla ödenecektir.</td>
                    </tr>
                </table>

                <!-- Genel Hükümler -->
                <div style="font-weight: bold; font-size: 12pt; text-decoration: underline; margin-bottom: 5px;">GENEL HÜKÜMLER</div>
                <div style="text-align: justify; margin-bottom: 20px;">
                    <ol style="margin-top: 0; padding-left: 20px;">
                        <li style="margin-bottom: 5px;">Kiracı, kiralananı özenle kullanmak zorundadır.</li>
                        <li style="margin-bottom: 5px;">Kiracı, kiralananda yapacağı tadilatlar için kiralayanın yazılı iznini almak zorundadır.</li>
                        <li style="margin-bottom: 5px;">Kiracı, apartman yönetiminin aldığı kararlara uymakla yükümlüdür.</li>
                        <li style="margin-bottom: 5px;">Kira bedeli, her yıl TÜFE oranında artırılacaktır.</li>
                        <li style="margin-bottom: 5px;">Kiracı, aidat ve diğer ortak giderleri zamanında ödemekle yükümlüdür.</li>
                        <li style="margin-bottom: 5px;">Sözleşme süresi bitiminde taraflar aksini bildirmediği sürece sözleşme 1 yıl uzamış sayılır.</li>
                        <li style="margin-bottom: 5px;">Kiralananın tahliyesi durumunda kiracı, anahtarı kiralayana teslim etmek zorundadır.</li>
                         <li style="margin-bottom: 5px;">İhtilaf durumunda {{YETKILI_MAHKEME}} Mahkemeleri ve İcra Daireleri yetkilidir.</li>
                    </ol>
                </div>

                <!-- Özel Şartlar -->
                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 5px;">ÖZEL ŞARTLAR (Varsa):</div>
                <div style="border: 1px solid black; padding: 10px; margin-bottom: 30px; min-height: 50px;">
                    {{OZEL_SARTLAR_ALANI}}
                </div>


                <!-- İmzalar -->
                <table style="width: 100%; border: none; margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; width: 33%; vertical-align: top;">
                            <strong>KİRAYA VEREN</strong><br><br>
                            (İmza)<br><br><br>
                            _________________
                        </td>
                        <td style="text-align: center; width: 33%; vertical-align: top;">
                            <strong>KEFİL (Varsa)</strong><br><br>
                            (İmza)<br><br><br>
                            _________________
                        </td>
                        <td style="text-align: center; width: 33%; vertical-align: top;">
                            <strong>KİRACI</strong><br><br>
                            (İmza)<br><br><br>
                            _________________
                        </td>
                    </tr>
                </table>
            </div>
        `;
    } else if (type === "official_mandate") {
        templateHtml = `
            <div style="font-family: Arial, sans-serif; color: black; line-height: 1.5; font-size: 11pt;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="font-weight: bold; font-size: 14pt;">T.C.</div>
                    <div style="font-weight: bold; font-size: 14pt;">ADALET BAKANLIĞI</div>
                    <div style="font-size: 12pt;">Personel Genel Müdürlüğü</div>
                </div>

                <!-- Header Table replacement for Flexbox -->
                <table style="width: 100%; border: none; margin-bottom: 20px;">
                    <tr>
                        <td style="width: 50%; vertical-align: top;">
                            <strong>Sayı:</strong> E-12345678-903.02-100<br>
                            <strong>Konu:</strong> Görevlendirme Onayı
                        </td>
                        <td style="width: 50%; text-align: right; vertical-align: top;">
                            <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}
                        </td>
                    </tr>
                </table>

                <div style="text-align: center; margin: 40px 0; font-weight: bold; font-size: 12pt;">
                    MAKAMINA
                </div>

                <div style="text-align: justify; text-indent: 40px; line-height: 1.5; margin-bottom: 30px;">
                    Bakanlığımızca yürütülmekte olan proje kapsamında, aşağıda kimliği belirtilen personelin, 
                    15.02.2026 - 20.02.2026 tarihleri arasında İstanbul Adliyesi'nde gerçekleştirilecek olan 
                    çalıştayda görevlendirilmesi, yol ve gündelik giderlerinin ilgili bütçe kaleminden 
                    karşılanması hususunu tensiplerinize arz ederim.
                </div>

                <!-- Signature Alignment replacement for Flexbox -->
                <table style="width: 100%; border: none; margin-top: 60px;">
                    <tr>
                        <td style="width: 60%;"></td>
                        <td style="width: 40%; text-align: center;">
                            Av. ${name || 'İsim Soyad'}<br>
                            <span style="font-style: italic;">Daire Başkanı</span>
                            <div style="margin-top: 15px;">(İmza)</div>
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 80px; text-align: center;">
                    <strong>OLUR</strong><br>
                    ${new Date().toLocaleDateString('tr-TR')}<br><br><br>
                    <strong>Mehmet YILMAZ</strong><br>
                    Bakan a.<br>
                    Genel Müdürü
                </div>
            </div>
        `;
    } else if (type === "petition") {
        templateHtml = `
            <div style="font-family: Arial, sans-serif; color: black; line-height: 1.5; font-size: 11pt;">
                <div style="text-align: right; margin-bottom: 20px;">
                    <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}
                </div>
                
                <div style="text-align: center; font-weight: bold; margin-bottom: 40px; font-size: 12pt;">
                    ANKARA CUMHURİYET BAŞSAVCILIĞI'NA
                </div>

                <div style="margin-bottom: 10px;">
                    <strong>MÜŞTEKİ :</strong> ${name || 'Ad Soyad'} (T.C. No: ....................)
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>ADRES   :</strong> ................................................................
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>ŞÜPHELİ :</strong> Meçhul / Veya Şahsın Bilgileri
                </div>
                <div style="margin-bottom: 20px;">
                    <strong>SUÇ     :</strong> Hakaret, Tehdit (Örnek)
                </div>

                <div style="margin-bottom: 20px; font-weight: bold; text-decoration: underline;">
                    AÇIKLAMALAR :
                </div>

                <div style="text-align: justify; line-height: 1.5;">
                    <p>1. ... tarihinde şüpheli şahıs tarafıma yönelik...</p>
                    <p>2. Olayın gelişimi şu şekildedir...</p>
                    <p>3. Bu nedenle şikayetçi olma zorunluluğum doğmuştur.</p>
                </div>

                <div style="margin-top: 20px; font-weight: bold; text-decoration: underline;">
                    SONUÇ VE İSTEM :
                </div>
                
                <div style="text-align: justify; line-height: 1.5; margin-bottom: 40px;">
                    Yukarıda arz ve izah edilen nedenlerle, şüpheli hakkında gerekli soruşturmanın yapılarak 
                    kamu davası açılmasına karar verilmesini saygılarımla arz ve talep ederim.
                </div>

                <!-- Signature Alignment replacement for Flexbox -->
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 60%;"></td>
                        <td style="width: 40%; text-align: center;">
                            <strong>Müşteki</strong><br>
                            ${name || 'Ad Soyad'}<br>
                            (İmza)
                        </td>
                    </tr>
                </table>
            </div>
        `;
    }

    if (templateHtml) {
        editorRef.current.innerHTML = templateHtml;
    }
  }

  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef.current) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                // Focus editor to ensure we have a range (though simple append works too if lost focus)
                editorRef.current?.focus();
                
                // Create image element manually or via execCommand
                // execCommand 'insertImage' allows undo support usually
                document.execCommand('insertImage', false, event.target.result as string);
                
                // If we want to style it specifically immediately after:
                // We'd need to find the last inserted image, but execCommand is simple.
                // Alternatively:
                // const imgHtml = `<img src="${event.target.result}" style="max-height: 80px; display: inline-block;" />`;
                // document.execCommand('insertHTML', false, imgHtml);
            }
        };
        reader.readAsDataURL(file);
    }
    // Reset input
    if (e.target) e.target.value = '';
  }



  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex font-display">
      
      {/* Sidebar (Consistent with design, only showing icons on mobile/tablet if needed, but here sticking to desktop first as per html) 
          In a real app, this sidebar might be a shared layout component. duplicated here for direct match.
      */}
      <aside className="w-64 bg-surface-light dark:bg-[#1e2532] border-r border-slate-200 dark:border-slate-800 flex-col justify-between hidden md:flex h-full shrink-0">
        <div className="flex flex-col h-full">
            {/* User Profile / Branding */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded bg-login-primary text-white">
                        <span className="material-symbols-outlined text-[24px]">description</span>
                    </div>
                <div className="flex flex-col overflow-hidden">
                <h1 className="text-slate-900 dark:text-white text-md font-bold truncate">MakeDoc</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium truncate">Document Builder</p>
                </div>
                </div>
            </div>
            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="/dashboard">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">dashboard</span>
                <span className="text-sm font-medium">Dashboard</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary dark:text-blue-400 transition-colors" href="#">
                <span className="material-symbols-outlined fill-current">description</span>
                <span className="text-sm font-medium">Create New</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="/documents">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">folder</span>
                <span className="text-sm font-medium">Documents</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group" href="/calendar">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">calendar_month</span>
                <span className="text-sm font-medium">Calendar</span>
                </a>
            </nav>
            {/* Bottom Settings */}
            <div className="p-3 mt-auto border-t border-slate-100 dark:border-slate-800">
                
                
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 bg-surface-light dark:bg-[#1e2532] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-2 text-sm">
                <a className="text-slate-500 hover:text-primary transition-colors" href="/documents">Documents</a>
                <span className="text-slate-400 material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-slate-900 dark:text-white font-medium">{id ? "Edit Document" : "Create New"}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:block mr-2">
                <span className="material-symbols-outlined text-[14px] align-text-bottom mr-1">cloud_done</span>
                    Draft autosave
                </span>
                <button 
                  onClick={() => navigate("/documents")}
                  className="flex items-center justify-center h-9 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[18px] mr-2">close</span> Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex items-center justify-center h-9 px-4 rounded-lg
                    bg-primary hover:bg-blue-700
                    text-white
                    dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900
                    text-sm font-medium shadow-sm transition-all shadow-blue-500/20
                    disabled:opacity-50
                    ">
                    {loading ? "Saving..." : (id ? "Update Document" : "Save Document")}
                </button>
            </div>
        </header>

        {/* Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-12 bg-background-light dark:bg-background-dark">
            <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20">
                {/* Page Heading */}
                <div className="flex flex-col gap-1 mb-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {id ? "Edit Document" : "Create Document"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {id ? "Modify existing document details or content." : "Draft a new legal document for a client case file."}
                    </p>
                </div>

                {/* Metadata Card */}
                <div className="bg-surface-light dark:bg-[#1e2532] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        Document Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Document Title</label>
                            <input 
                                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400" 
                                placeholder="e.g. Service Agreement - Smith vs. Jones" 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Client Association</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
                                <input 
                                    className="w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400" 
                                    placeholder="Search for client..." 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">edit_document</span>
                            Content
                        </h2>
                        <div className="flex items-center gap-2">

                            <button 
                                onClick={handleReset}
                                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1">
                                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                Reset
                            </button>
                        </div>
                    </div>
                    {/* Editor Component */}
                    <div className="bg-surface-light dark:bg-[#1e2532] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        {/* Toolbar */}
                        <div className="flex items-center flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a202c]">
                             
                             {/* Template Selector */}
                             <select 
                                onChange={(e) => insertTemplate(e.target.value)}
                                className="h-8 text-sm bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded px-2 mr-2 focus:ring-2 focus:ring-indigo-500">
                                <option value="">+ Insert Template...</option>
                                <option value="rental_agreement">Konut Kira Sözleşmesi (Şablon)</option>
                                <option value="official_mandate">Görevlendirme Onayı (Resmî)</option>
                                <option value="petition">Dilekçe Örneği</option>
                                <option value="contract">Hizmet Sözleşmesi</option>
                             </select>
                             
                             <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                             {/* Text Style */}
                            <select className="h-8 text-sm bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 rounded px-2 mr-2">
                                <option>Normal Text</option>
                                <option>Heading 1</option>
                                <option>Heading 2</option>
                                <option>Heading 3</option>
                            </select>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                            {/* Formatting Buttons */}
                            <button onClick={() => execCmd('bold')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Bold">
                                <span className="material-symbols-outlined text-[20px]">format_bold</span>
                            </button>
                            <button onClick={() => execCmd('italic')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Italic">
                                <span className="material-symbols-outlined text-[20px]">format_italic</span>
                            </button>
                            <button onClick={() => execCmd('underline')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Underline">
                                <span className="material-symbols-outlined text-[20px]">format_underlined</span>
                            </button>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                            {/* Alignment */}
                            <button onClick={() => execCmd('justifyLeft')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Align Left">
                                <span className="material-symbols-outlined text-[20px]">format_align_left</span>
                            </button>
                            <button onClick={() => execCmd('justifyCenter')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Align Center">
                                <span className="material-symbols-outlined text-[20px]">format_align_center</span>
                            </button>
                            <button onClick={() => execCmd('justifyRight')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Align Right">
                                <span className="material-symbols-outlined text-[20px]">format_align_right</span>
                            </button>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                            {/* Lists */}
                            <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Bulleted List">
                                <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                            </button>
                            <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors" title="Numbered List">
                                <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
                            </button>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                            {/* Insert */}
                            <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center gap-1 px-2" title="Insert Variable">
                                <span className="material-symbols-outlined text-[20px]">data_object</span>
                                <span className="text-xs font-medium">Variable</span>
                            </button>
                            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                            {/* Signature */}
                            <input 
                                type="file" 
                                ref={signatureInputRef} 
                                className="hidden" 
                                accept="image/png, image/jpeg"
                                onChange={handleSignatureUpload}
                            />
                            <button 
                                onClick={() => signatureInputRef.current?.click()}
                                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center gap-1 px-2 bg-indigo-50 dark:bg-indigo-900/30" 
                                title="Insert Signature Image">
                                <span className="material-symbols-outlined text-[20px]">ink_pen</span>
                                <span className="text-xs font-medium">Insert Signature</span>
                            </button>
                        </div>
                        {/* Editable Area */}
                        <div className="flex-1 bg-slate-100 dark:bg-[#0f1218] p-8 overflow-y-auto flex justify-center">
                             {/* Paper Background Simulation */}
                            <div 
                                className="w-[210mm] min-h-[297mm] bg-white text-black shadow-xl p-[2.5cm] outline-none leading-relaxed text-[11pt]" 
                                contentEditable
                                ref={editorRef}
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments Section */}
                <div className="bg-surface-light dark:bg-[#1e2532] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">attach_file</span>
                        Attachments & Exhibits
                    </h2>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-slate-400 text-3xl">cloud_upload</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or Images (max 10MB)</p>
                    </div>
                    {/* Uploaded File Example (Static) */}
                    <div className="mt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-red-600 dark:text-red-400">
                                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">Exhibit_A_Scope.pdf</span>
                                    <span className="text-xs text-slate-500">2.4 MB • Uploaded just now</span>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:text-red-500 transition-colors p-2">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </main>
    </div>
  )
}
