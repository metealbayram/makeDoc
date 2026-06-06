import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"

interface TemplateItem {
  _id: string
  title: string
  description?: string
  contentHtml: string
  sourceType: "editor" | "word"
  placeholders?: string[]
  updatedAt?: string
}

interface ApiErrorLike {
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
}

const EMPTY_TEMPLATE = `
  <h1 style="font-size: 20pt; margin-bottom: 16px;">YENI SABLON</h1>
  <p style="margin-bottom: 12px;">Bu alana belge sablonunuzu yazin veya Word dosyasindan icerik aktarın.</p>
  <p><strong>{{MUVEKKIL_AD_SOYAD}}</strong></p>
  <p>{{ACIKLAMA_ALANI}}</p>
`

const PLACEHOLDER_GROUPS = [
  "{{MUVEKKIL_AD_SOYAD}}",
  "{{MUVEKKIL_TC_NO}}",
  "{{MUVEKKIL_ADRES}}",
  "{{MUVEKKIL_TELEFON}}",
  "{{MUVEKKIL_EMAIL}}",
  "{{DAVACI}}",
  "{{DAVALI}}",
  "{{MAHKEME}}",
  "{{DOSYA_NO}}",
  "{{TARIH}}",
  "{{ACIKLAMA_ALANI}}",
  "{{SONUC_VE_TALEP}}",
  "{{IMZA_ALANI}}",
]

const extractFileTitle = (fileName: string) =>
  fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim()

const normalizeCustomPlaceholder = (value: string) => {
  const normalized = value
    .trim()
    .toUpperCase()
    .replaceAll("I", "I")
    .replaceAll("İ", "I")
    .replaceAll("Ş", "S")
    .replaceAll("Ğ", "G")
    .replaceAll("Ü", "U")
    .replaceAll("Ö", "O")
    .replaceAll("Ç", "C")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized ? `{{${normalized}}}` : ""
}

const isDocxFile = (file: File) =>
  file.name.toLowerCase().endsWith(".docx") ||
  file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const extractPlaceholdersFromHtml = (contentHtml: string) => {
  const matches = String(contentHtml || "").match(/{{\s*[A-Z0-9_]+\s*}}/g) || []
  return [...new Set(matches.map((item) => item.replace(/\s+/g, "")))]
}

export default function TemplateBuilderPage() {
  const navigate = useNavigate()
  const editorRef = useRef<HTMLDivElement>(null)
  const wordInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sourceType, setSourceType] = useState<"editor" | "word">("editor")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [customPlaceholderName, setCustomPlaceholderName] = useState("")
  const [customPlaceholders, setCustomPlaceholders] = useState<string[]>([])
  const [userName, setUserName] = useState("")
  const [userJob, setUserJob] = useState("")
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)

  const selectedTemplate = useMemo(
    () => templates.find((item) => item._id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  )

  const syncEditor = (html: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html
    }
  }

  const refreshCustomPlaceholders = (html: string) => {
    const detectedPlaceholders = extractPlaceholdersFromHtml(html)
    const detectedCustomPlaceholders = detectedPlaceholders.filter(
      (placeholder) => !PLACEHOLDER_GROUPS.includes(placeholder),
    )

    setCustomPlaceholders(detectedCustomPlaceholders)
  }

  const resetBuilder = () => {
    setSelectedTemplateId(null)
    setTitle("")
    setDescription("")
    setSourceType("editor")
    setCustomPlaceholders([])
    syncEditor(EMPTY_TEMPLATE)
    refreshCustomPlaceholders(EMPTY_TEMPLATE)
  }

  const loadTemplates = async () => {
    setLoading(true)

    try {
      const response = await api.get("/templates")
      setTemplates(response.data || [])
    } catch (error: unknown) {
      const apiError = error as ApiErrorLike
      console.error("Failed to load templates", error)

      if (apiError.response?.status === 401) {
        alert("Oturumunuz gecersiz veya sona ermis. Lutfen tekrar giris yapin.")
        return
      }

      alert(apiError.response?.data?.message || "Sablonlar alinamadi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedJob = localStorage.getItem("userJob")
    const storedImage = localStorage.getItem("userProfileImage")

    if (storedName) setUserName(storedName)
    if (storedJob) setUserJob(storedJob)

    if (storedImage) {
      setUserProfileImage(
        storedImage.startsWith("http")
          ? storedImage
          : `http://localhost:5000${storedImage}`,
      )
    }

    syncEditor(EMPTY_TEMPLATE)
    refreshCustomPlaceholders(EMPTY_TEMPLATE)
    void loadTemplates()
  }, [])

  const handleSelectTemplate = (template: TemplateItem) => {
    setSelectedTemplateId(template._id)
    setTitle(template.title)
    setDescription(template.description || "")
    setSourceType(template.sourceType || "editor")
    const nextHtml = template.contentHtml || EMPTY_TEMPLATE
    syncEditor(nextHtml)
    refreshCustomPlaceholders(nextHtml)
  }

  const handleSaveTemplate = async () => {
    const contentHtml = editorRef.current?.innerHTML?.trim() || ""

    if (!title.trim() || !contentHtml) {
      alert("Baslik ve sablon icerigi zorunludur.")
      return
    }

    setSaving(true)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        contentHtml,
        sourceType,
      }

      if (selectedTemplateId) {
        const response = await api.put(`/templates/${selectedTemplateId}`, payload)
        setTemplates((currentTemplates) =>
          currentTemplates.map((item) =>
            item._id === selectedTemplateId ? response.data : item,
          ),
        )
      } else {
        const response = await api.post("/templates", payload)
        setTemplates((currentTemplates) => [response.data, ...currentTemplates])
        setSelectedTemplateId(response.data._id)
      }

      await loadTemplates()
      alert("Sablon kaydedildi.")
    } catch (error) {
      console.error("Failed to save template", error)
      alert("Sablon kaydedilemedi.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Bu sablonu silmek istiyor musun?")) return

    try {
      await api.delete(`/templates/${templateId}`)
      setTemplates((currentTemplates) =>
        currentTemplates.filter((item) => item._id !== templateId),
      )

      if (selectedTemplateId === templateId) {
        resetBuilder()
      }
    } catch (error) {
      console.error("Failed to delete template", error)
      alert("Sablon silinemedi.")
    }
  }

  const handleWordUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isDocxFile(file)) {
      alert("Su an sadece .docx uzantili Word dosyalari destekleniyor.")
      if (event.target) event.target.value = ""
      return
    }

    setConverting(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await api.post("/templates/convert-word", formData)

      setSourceType("word")
      if (!title.trim()) {
        setTitle(extractFileTitle(file.name))
      }
      const nextHtml = response.data.contentHtml || EMPTY_TEMPLATE
      syncEditor(nextHtml)
      refreshCustomPlaceholders(nextHtml)

      if (response.data.warnings?.length) {
        alert("Word dosyasi donusturuldu. Bazi stiller tam tasinmamis olabilir.")
      }
    } catch (error) {
      console.error("Failed to convert word file", error)
      alert("Word dosyasi sablona cevrilemedi. Lutfen .docx dosyasi deneyin.")
    } finally {
      setConverting(false)
      if (event.target) event.target.value = ""
    }
  }

  const insertPlaceholder = (placeholder: string) => {
    editorRef.current?.focus()
    document.execCommand("insertText", false, placeholder)
    refreshCustomPlaceholders(editorRef.current?.innerHTML || "")
  }

  const handleInsertCustomPlaceholder = () => {
    const placeholder = normalizeCustomPlaceholder(customPlaceholderName)

    if (!placeholder) {
      alert("Lutfen gecerli bir degisken adi gir.")
      return
    }

    insertPlaceholder(placeholder)
    setCustomPlaceholderName("")
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased dark:bg-[#111621] dark:text-white">
      <Navbar userName={userName} userProfileImage={userProfileImage} />
      <Sidebar
        userName={userName}
        userJob={userJob}
        userProfileImage={userProfileImage}
      />

      <main className="ml-0 px-6 pb-12 pt-28 md:px-10 lg:ml-64">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  style
                </span>
                Template Studio
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Create Template
              </h1>
              <p className="mt-3 max-w-3xl text-slate-500 dark:text-slate-400">
                Kendi hesabina ait Word tabanli veya editor tabanli belge
                sablonlari olustur, HTML olarak sakla ve daha sonra belge
                uretirken tekrar kullan.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetBuilder}
                className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-[#2e3645] dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              >
                Yeni Sablon
              </button>
              <button
                type="button"
                onClick={() => wordInputRef.current?.click()}
                disabled={converting}
                className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#1e2532] dark:hover:bg-[#273043]"
              >
                {converting ? "Donusturuluyor..." : "Word'den Al (.docx)"}
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={saving}
                className="rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:bg-[#2b67e8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Kaydediliyor..." : "Sablonu Kaydet"}
              </button>
            </div>
          </header>

          <input
            ref={wordInputRef}
            type="file"
            className="hidden"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleWordUpload}
          />

          <div className="grid grid-cols-12 gap-8">
            <aside className="col-span-12 space-y-6 xl:col-span-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Sablon Bilgileri
                </h2>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      Baslik
                    </label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:border-[#2e3645] dark:bg-[#111621] dark:text-white dark:focus:border-blue-500/40 dark:focus:ring-blue-500/10"
                      placeholder="Orn: Kira Sozlesmesi Sablonu"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      Aciklama
                    </label>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:border-[#2e3645] dark:bg-[#111621] dark:text-white dark:focus:border-blue-500/40 dark:focus:ring-blue-500/10"
                      placeholder="Bu sablonun ne icin kullanildigini kisaca yaz."
                    />
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-[#2e3645] dark:bg-[#111621] dark:text-slate-400">
                    Kaynak tipi:
                    <span className="ml-2 font-bold text-slate-900 dark:text-white">
                      {sourceType === "word" ? "Word'den donustu" : "Editor ile olusturuldu"}
                    </span>
                  </div>

                  {selectedTemplate && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/create-document?templateId=${selectedTemplate._id}`)
                      }
                      className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500"
                    >
                      Bu Sablonla Belge Olustur
                    </button>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Benim Sablonlarim
                  </h2>
                  {loading && (
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Yukleniyor
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      className={`rounded-2xl border p-4 transition ${
                        selectedTemplateId === template._id
                          ? "border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10"
                          : "border-slate-200 bg-slate-50 dark:border-[#2e3645] dark:bg-[#111621]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full text-left"
                      >
                        <div className="font-bold text-slate-900 dark:text-white">
                          {template.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {template.description || "Aciklama yok"}
                        </div>
                      </button>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          {template.sourceType === "word" ? "Word" : "Editor"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="text-sm font-bold text-red-500 transition hover:text-red-400"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}

                  {!templates.length && !loading && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#2e3645] dark:text-slate-400">
                      Henuz kayitli sablon yok. Editor ile yeni bir sablon
                      olusturabilir veya Word dosyasindan aktarim yapabilirsin.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Sistem Degiskenleri
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Bu alanlar sistemde hazir gelir. Ozellikle muvekkil bilgileri
                  belge olusturma ekraninda secilen client verisinden otomatik
                  doldurulabilir.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[...PLACEHOLDER_GROUPS, ...customPlaceholders].map((placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => insertPlaceholder(placeholder)}
                      className="rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Ozel Degisken Ekle
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Kendi alan adini yaz. Sistem bunu otomatik olarak
                  {" "}
                  <code>{"{{OZEL_ALAN}}"}</code>
                  {" "}
                  formatina cevirip sablona ekler. Belge olusturma ekraninda bu
                  alan sana ayrica sorulur.
                </p>

                <div className="mt-5 space-y-3">
                  <input
                    value={customPlaceholderName}
                    onChange={(event) => setCustomPlaceholderName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:border-[#2e3645] dark:bg-[#111621] dark:text-white dark:focus:border-blue-500/40 dark:focus:ring-blue-500/10"
                    placeholder="Orn: kira artış oranı"
                  />

                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-[#2e3645] dark:bg-[#111621] dark:text-slate-400">
                    Onizleme:
                    <span className="ml-2 font-bold text-slate-900 dark:text-white">
                      {normalizeCustomPlaceholder(customPlaceholderName) || "{{OZEL_ALAN}}"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleInsertCustomPlaceholder}
                    className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:bg-[#2b67e8]"
                  >
                    Ozel Degiskeni Ekle
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Word Yukleme
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Bu alan su an sadece `.docx` formatini destekler. Eski `.doc`
                  dosyalari once Word uzerinden `.docx` olarak kaydedilmelidir.
                </p>
              </section>
            </aside>

            <section className="col-span-12 xl:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(36,49,86,0.08)] dark:border-[#2e3645] dark:bg-[#1e2532]">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-4 dark:border-[#2e3645] dark:bg-[#111621]">
                  <button
                    type="button"
                    onClick={() => document.execCommand("bold")}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand("italic")}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand("insertUnorderedList")}
                    className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Liste
                  </button>
                  <div className="ml-auto text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Kayit bicimi: HTML
                  </div>
                </div>

                <div className="bg-slate-100 p-6 md:p-10 dark:bg-[#0d131d]">
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(event) =>
                      refreshCustomPlaceholders(
                        (event.currentTarget as HTMLDivElement).innerHTML,
                      )
                    }
                    className="mx-auto min-h-[297mm] w-full max-w-[210mm] rounded-sm bg-white p-[24mm] text-[11pt] leading-relaxed text-black shadow-2xl outline-none"
                    suppressContentEditableWarning
                    style={{ fontFamily: "Arial, sans-serif" }}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
