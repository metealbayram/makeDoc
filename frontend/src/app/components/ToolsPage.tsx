import { useEffect, useState } from "react";
import api from "../services/api";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export default function ToolsPage() {
  const [userName, setUserName] = useState("");
  const [userJob, setUserJob] = useState("");
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  // Yargitay Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedKararId, setSelectedKararId] = useState<string | null>(null);
  const [kararDetailHtml, setKararDetailHtml] = useState<string>("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [wordSuccess, setWordSuccess] = useState<string | null>(null);
  const [isConvertingWord, setIsConvertingWord] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedImage = localStorage.getItem("userProfileImage");
    const storedJob = localStorage.getItem("userJob");
    if (storedName) setUserName(storedName);
    if (storedJob) setUserJob(storedJob);
    if (storedImage) {
      if (storedImage.startsWith("http")) {
        setUserProfileImage(storedImage);
      } else {
        setUserProfileImage(`http://localhost:5000${storedImage}`);
      }
    }
  }, []);

  const handleProfileImageUpdate = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) return;
      const formData = new FormData();
      formData.append("profileImage", file);
      try {
        const response = await api.put("/users/profile/image", formData);
        if (response.data.success) {
          const newImagePath = response.data.data.profileImage;
          localStorage.setItem("userProfileImage", newImagePath);
          setUserProfileImage(`http://localhost:5000${newImagePath}`);
        }
      } catch (error) {
        console.error("Failed to update profile image:", error);
      }
    }
  };

  const handleSearchYargitay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await api.get(`/yargitay/search?keyword=${encodeURIComponent(searchQuery)}&page=1&pageSize=20`);
      
      let arr = [];
      const resData = response.data;
      if (resData && resData.data) {
          const yData = resData.data;
          
          // Yargıtay sunucusu kendi içinde hata fırlatırsa (Örn: WAF, Cookie veya Rate Limit)
          if (yData.metadata && yData.metadata.FMTY === 'ERROR') {
             throw new Error("Yargıtay Sunucusu İsteği Engelledi veya Hata Verdi: " + (yData.metadata.FMTE || "Zaman aşımı / Adalet_Runtime_Exception"));
          }

          if (yData.data && yData.data.data && Array.isArray(yData.data.data)) {
              arr = yData.data.data;
          } else if (yData.data && Array.isArray(yData.data)) {
              arr = yData.data;
          } else if (Array.isArray(yData)) {
              arr = yData;
          }
      }
      setResults(arr);
    } catch (err: any) {
      console.error(err);
      setError(err.message === "Network Error" ? "Ağ Bağlantısı Hatası" : err.message || "Karar aramasında bir hata oluştu veya bağlantı zaman aşımına uğradı.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReadDetail = async (id: string) => {
      setSelectedKararId(id);
      setIsLoadingDetail(true);
      setKararDetailHtml("");
      
      try {
          const response = await api.get(`/yargitay/${id}`);
          if (response.data?.success && response.data?.data?.data) {
              setKararDetailHtml(response.data.data.data);
          } else {
              setKararDetailHtml("<p class='text-red-500'>Karar detayı yüklenemedi veya boş geldi.</p>");
          }
      } catch (err) {
          console.error(err);
          setKararDetailHtml("<p class='text-red-500'>Karar detayını çekerken bir hata oluştu.</p>");
      } finally {
          setIsLoadingDetail(false);
      }
  };

  const handleWordToPdfConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordFile) {
      setWordError("Please choose a Word file first.");
      return;
    }

    setIsConvertingWord(true);
    setWordError(null);
    setWordSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", wordFile);

      const response = await api.post("/tools/word-to-pdf", formData, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = wordFile.name.replace(/\.(doc|docx)$/i, "");

      link.href = downloadUrl;
      link.download = `${baseName || "converted-document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setWordSuccess("PDF is ready and has been downloaded.");
      setWordFile(null);
    } catch (err: any) {
      let message = "Word to PDF conversion failed.";

      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();

        try {
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        } catch {
          if (text) {
            message = text;
          }
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }

      setWordError(message);
    } finally {
      setIsConvertingWord(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen dark:bg-[#111621] dark:text-white">
      <Navbar
        userName={userName}
        userProfileImage={userProfileImage}
        onProfileImageUpdate={handleProfileImageUpdate}
      />
      <Sidebar
        userName={userName}
        userJob={userJob}
        userProfileImage={userProfileImage}
        onProfileImageUpdate={handleProfileImageUpdate}
      />

      <main className="ml-72 pt-28 px-12 pb-12 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-2 dark:text-slate-400">
                <span>Workspace</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-bold">Tools</span>
              </nav>
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline dark:text-white">
                Legal Tools
              </h1>
            </div>
          </div>

          <div className="space-y-10">
            <section className="space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Research Tools
                </p>
                <h2 className="mt-2 text-2xl font-extrabold font-headline text-on-surface dark:text-white">
                  Legal Research
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant dark:text-slate-400">
                  Search official legal sources and inspect detailed decision content.
                </p>
              </div>
            {/* Tool 1: Yargitay Karar Arama */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-[#1e2532] dark:border-slate-800">
              <div className="bg-slate-50/50 p-6 border-b border-slate-100 dark:bg-[#111621]/50 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 dark:bg-orange-500/10 dark:text-orange-500">
                    <span className="material-symbols-outlined">gavel</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-on-surface font-headline dark:text-white">Yargıtay Karar Arama</h2>
                    <p className="text-sm text-on-surface-variant dark:text-slate-400">Resmi Yargıtay veritabanında emsal karar sorgulayın.</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSearchYargitay} className="flex gap-4 max-w-2xl mb-8">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Anahtar kelime girin (Örn: Boşanma, Alacak...)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 dark:bg-[#111621] dark:border-slate-700"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary-dim transition-colors disabled:opacity-50"
                  >
                    {isSearching ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span>Axtar</span>}
                  </button>
                </form>

                {/* Results Section */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {results.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{results.length} Sonuç Bulundu</h3>
                    <div className="grid gap-4">
                      {results.map((karar, idx) => (
                        <div key={idx} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow dark:border-slate-800">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-on-surface dark:text-white text-lg">
                               Emsal Karar - Esas No: {karar.esasNo || "Belirtilmemiş"}
                            </h4>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono dark:bg-slate-800 dark:text-slate-400">
                                {karar.daire || "İlgili Daire"}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                              Yargıtay {karar.daire} - Karar No: {karar.kararNo || "Bulunamadı"}. İçeriğin detayı sisteme giriş yapıldıktan sonra resmi bağlatıdan okunabilir. İlgili aranan kelime: <span className="font-bold">"{karar.arananKelime}"</span>.
                          </p>
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                              <span>Tarih: {karar.kararTarihi || "Bilinmiyor"}</span>
                              <button 
                                onClick={() => handleReadDetail(karar.id)}
                                className="text-primary font-bold hover:underline flex items-center gap-1"
                              >
                                  Kararı Oku
                                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </section>

            <section className="space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Conversion Tools
                </p>
                <h2 className="mt-2 text-2xl font-extrabold font-headline text-on-surface dark:text-white">
                  Document Conversion
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant dark:text-slate-400">
                  Convert working files into shareable PDF outputs.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-[#1e2532] dark:border-slate-800">
                <div className="bg-slate-50/50 p-6 border-b border-slate-100 dark:bg-[#111621]/50 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 dark:bg-blue-500/10 dark:text-blue-400">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface font-headline dark:text-white">
                        Word to PDF
                      </h3>
                      <p className="text-sm text-on-surface-variant dark:text-slate-400">
                        Upload a `.doc` or `.docx` file and download the converted PDF.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <form onSubmit={handleWordToPdfConvert} className="space-y-5 max-w-3xl">
                    <label className="flex flex-col gap-3 p-5 border border-dashed border-slate-300 rounded-2xl bg-slate-50/70 hover:border-primary/40 transition-colors dark:border-slate-700 dark:bg-slate-900/40">
                      <span className="text-sm font-semibold text-on-surface dark:text-white">
                        Select Word document
                      </span>
                      <input
                        type="file"
                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-primary/10 file:px-4 file:py-2.5 file:font-semibold file:text-primary hover:file:bg-primary/15 dark:text-slate-300 dark:file:bg-primary/15 dark:file:text-blue-300"
                        onChange={(e) => {
                          setWordFile(e.target.files?.[0] || null);
                          setWordError(null);
                          setWordSuccess(null);
                        }}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Supported formats: `.doc` and `.docx`.
                      </span>
                    </label>

                    {wordFile && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                        <span className="material-symbols-outlined text-primary">draft</span>
                        <span className="font-medium text-on-surface dark:text-white">{wordFile.name}</span>
                      </div>
                    )}

                    {wordError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {wordError}
                      </div>
                    )}

                    {wordSuccess && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {wordSuccess}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        The generated PDF downloads automatically when conversion finishes.
                      </p>
                      <button
                        type="submit"
                        disabled={!wordFile || isConvertingWord}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isConvertingWord ? (
                          <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined">picture_as_pdf</span>
                        )}
                        {isConvertingWord ? "Converting..." : "Convert to PDF"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Karar Detay Modalı */}
      {selectedKararId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1e2532] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xl font-bold text-on-surface dark:text-white flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary">description</span>
                   Karar Detayı
                </h3>
                <button 
                  onClick={() => setSelectedKararId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#1e2532]">
                 {isLoadingDetail ? (
                     <div className="flex flex-col items-center justify-center h-48 gap-4 text-slate-500">
                         <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                         <p>Karar metni Yargıtay'dan çekiliyor...</p>
                     </div>
                 ) : (
                     <div 
                        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-headings:text-on-surface dark:prose-headings:text-white"
                        dangerouslySetInnerHTML={{ __html: kararDetailHtml }}
                     />
                 )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
