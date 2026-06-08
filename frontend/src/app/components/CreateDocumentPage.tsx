import { useState, useRef, useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import api from "../services/api"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

const INITIAL_CONTENT = `
<p class="text-slate-400 italic">[Start typing or editing here...]</p>
`

interface ClientItem {
  _id: string
  name: string
  tcNo?: string
  phone?: string
  address?: string
  email?: string
}

interface SavedTemplateItem {
  _id: string
  title: string
  contentHtml: string
  placeholders?: string[]
}

interface ApiErrorShape {
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
}

const extractTemplatePlaceholders = (contentHtml: string) => {
  const matches = String(contentHtml || "").match(/{{\s*[A-Z0-9_]+\s*}}/g) || []
  return [...new Set(matches.map((item) => item.replace(/\s+/g, "")))]
}

const formatPlaceholderLabel = (placeholder: string) =>
  placeholder
    .replace(/[{}]/g, "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ")

const escapePlaceholderForRegex = (placeholder: string) =>
  placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const getClientTemplateDefaults = (client: ClientItem): Record<string, string> => ({
  "{{MUVEKKIL_AD_SOYAD}}": client.name || "",
  "{{MUVEKKIL_TC_NO}}": client.tcNo || "",
  "{{MUVEKKIL_ADRES}}": client.address || "",
  "{{MUVEKKIL_TELEFON}}": client.phone || "",
  "{{MUVEKKIL_EMAIL}}": client.email || "",
  "{{KIRACI_ADI_SOYADI}}": client.name || "",
  "{{KIRACI_TC}}": client.tcNo || "",
  "{{KIRACI_ADRES}}": client.address || "",
})

const buildTemplateHtmlFromValues = (
  baseHtml: string,
  placeholders: string[],
  fieldValues: Record<string, string>,
) => {
  let nextHtml = baseHtml

  for (const placeholder of placeholders) {
    const value = fieldValues[placeholder]?.trim()
    const replaceValue = value || placeholder
    const pattern = new RegExp(escapePlaceholderForRegex(placeholder), "g")
    nextHtml = nextHtml.replace(pattern, replaceValue)
  }

  return nextHtml
}

export default function CreateDocumentPage() {
  const { id } = useParams()
  const location = useLocation()
  const [title, setTitle] = useState("")
  const [name, setName] = useState("")
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientItem[]>([])
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplateItem[]>([])
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState("")
  const [selectedTemplateBaseHtml, setSelectedTemplateBaseHtml] = useState("")
  const [activeTemplatePlaceholders, setActiveTemplatePlaceholders] = useState<string[]>([])
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, string>>({})
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [templateType, setTemplateType] = useState("")
  const [newClient, setNewClient] = useState({
    name: "",
    tcNo: "",
    phone: "",
    address: "",
    email: "",
  })

  const navigate = useNavigate()
  const editorRef = useRef<HTMLDivElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  const [userName, setUserName] = useState("")
  const [userJob, setUserJob] = useState("")
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)
  const templateIdFromQuery = new URLSearchParams(location.search).get("templateId")

  useEffect(() => {
    if (!id) return

    const fetchDocument = async () => {
      try {
        const response = await api.get(`/documents/${id}`)
        const doc = response.data.data
        const role = response.data.role

        if (role && role !== "owner" && role !== "editor") {
          alert("Bu dokümanı düzenleme yetkin yok.")
          navigate("/documents")
          return
        }

        setTitle(doc.title || "")
        setName(doc.name || "")
        setContent(doc.content || INITIAL_CONTENT)

        if (editorRef.current) {
          editorRef.current.innerHTML = doc.content || INITIAL_CONTENT
        }
      } catch (error: unknown) {
        const apiError = error as ApiErrorShape
        console.error("Failed to load document", error)

        if (apiError.response?.status === 403) {
          alert("Bu dokümanı düzenleme yetkin yok.")
          navigate("/documents")
          return
        }

        if (apiError.response?.status === 404) {
          alert("Doküman bulunamadı.")
          navigate("/documents")
          return
        }

        alert("Doküman düzenleme için yüklenemedi.")
        navigate("/documents")
      }
    }

    fetchDocument()
  }, [id, navigate])

  useEffect(() => {
    if (editorRef.current && !id) {
      editorRef.current.innerHTML = content
    }

    const fetchClients = async () => {
      try {
        const [clientsRes, templatesRes] = await Promise.all([
          api.get("/clients"),
          api.get("/templates"),
        ])

        setClients(clientsRes.data.data || [])
        setSavedTemplates(templatesRes.data || [])
      } catch (error) {
        console.error("Failed to fetch create-document dependencies", error)
      }
    }

    const storedName = localStorage.getItem("userName")
    const storedJob = localStorage.getItem("userJob")
    const storedImage = localStorage.getItem("userProfileImage")

    if (storedName) setUserName(storedName)
    if (storedJob) setUserJob(storedJob)

    if (storedImage) {
      if (storedImage.startsWith("http")) {
        setUserProfileImage(storedImage)
      } else {
        setUserProfileImage(`http://localhost:5000${storedImage}`)
      }
    }

    fetchClients()
  }, [content, id])

  useEffect(() => {
    if (id || !templateIdFromQuery || !savedTemplates.length) return

    const matchedTemplate = savedTemplates.find(
      (template) => template._id === templateIdFromQuery,
    )

    if (!matchedTemplate) return

    const templateHtml = matchedTemplate.contentHtml || INITIAL_CONTENT
    const placeholders =
      matchedTemplate.placeholders?.length
        ? matchedTemplate.placeholders
        : extractTemplatePlaceholders(templateHtml)
    const initialFieldValues = placeholders.reduce<Record<string, string>>(
      (accumulator, placeholder) => {
        accumulator[placeholder] = ""
        return accumulator
      },
      {},
    )

    setSelectedSavedTemplateId(matchedTemplate._id)
    setTitle((currentTitle) => currentTitle || matchedTemplate.title || "")
    setTemplateType(`saved:${matchedTemplate._id}`)
    setSelectedTemplateBaseHtml(templateHtml)
    setActiveTemplatePlaceholders(placeholders)
    setTemplateFieldValues(initialFieldValues)
    setContent(templateHtml)

    if (editorRef.current) {
      editorRef.current.innerHTML = templateHtml
    }
  }, [id, savedTemplates, templateIdFromQuery])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post("/clients", newClient)
      setClients([res.data.data, ...clients])
      setIsClientModalOpen(false)
      setNewClient({ name: "", tcNo: "", phone: "", address: "", email: "" })
      alert("Client saved successfully!")
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape
      alert(apiError.response?.data?.message || "Failed to create client")
    }
  }

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    if (!clientId) return

    const client = clients.find((c) => c._id === clientId)
    if (!client) return

    setName(client.name)

    if (activeTemplatePlaceholders.length) {
      const clientDefaults = getClientTemplateDefaults(client)

      setTemplateFieldValues((currentValues) => {
        const nextValues = { ...currentValues }

        for (const placeholder of activeTemplatePlaceholders) {
          if (!nextValues[placeholder] && clientDefaults[placeholder]) {
            nextValues[placeholder] = clientDefaults[placeholder]
          }
        }

        return nextValues
      })
    }
  }

  const handleApplyClientToDocument = () => {
    if (!selectedClientId) return
    const client = clients.find((c) => c._id === selectedClientId)
    if (!client) return

    if (editorRef.current) {
      let html = editorRef.current.innerHTML
      html = html
        .replace(/{{MÜVEKKİL_AD_SOYAD}}/g, client.name || "___________________")
        .replace(/{{MÜVEKKİL_TC}}/g, client.tcNo || "___________________")
        .replace(/{{MÜVEKKİL_ADRES}}/g, client.address || "___________________")
        .replace(/{{MÜVEKKİL_TELEFON}}/g, client.phone || "___________________")
        .replace(/{{KIRACI_ADI_SOYADI}}/g, client.name || "___________________")
        .replace(/{{KIRACI_TC}}/g, client.tcNo || "___________________")
        .replace(/{{KIRACI_ADRES}}/g, client.address || "___________________")

      editorRef.current.innerHTML = html
      setContent(html)
    }
  }

  const handleApplySavedTemplate = (templateId: string) => {
    setSelectedSavedTemplateId(templateId)
    if (!templateId) {
      setSelectedTemplateBaseHtml("")
      setActiveTemplatePlaceholders([])
      setTemplateFieldValues({})
      return
    }

    const template = savedTemplates.find((item) => item._id === templateId)
    if (!template) return

    const templateHtml = template.contentHtml || INITIAL_CONTENT
    const placeholders =
      template.placeholders?.length
        ? template.placeholders
        : extractTemplatePlaceholders(templateHtml)
    const initialFieldValues = placeholders.reduce<Record<string, string>>(
      (accumulator, placeholder) => {
        accumulator[placeholder] = ""
        return accumulator
      },
      {},
    )
    const selectedClient = clients.find((client) => client._id === selectedClientId)

    if (selectedClient) {
      const clientDefaults = getClientTemplateDefaults(selectedClient)

      for (const placeholder of placeholders) {
        if (clientDefaults[placeholder]) {
          initialFieldValues[placeholder] = clientDefaults[placeholder]
        }
      }
    }

    setTemplateType(`saved:${template._id}`)
    setTitle((currentTitle) => currentTitle || template.title || "")
    setSelectedTemplateBaseHtml(templateHtml)
    setActiveTemplatePlaceholders(placeholders)
    setTemplateFieldValues(initialFieldValues)
    setContent(templateHtml)

    if (editorRef.current) {
      editorRef.current.innerHTML = templateHtml
    }
  }

  const handleTemplateFieldChange = (placeholder: string, value: string) => {
    setTemplateFieldValues((currentValues) => ({
      ...currentValues,
      [placeholder]: value,
    }))
  }

  const handleApplyTemplateFields = () => {
    let baseHtml = selectedTemplateBaseHtml

    if (!baseHtml) {
      baseHtml = editorRef.current?.innerHTML || ""
      if (!baseHtml) return
      setSelectedTemplateBaseHtml(baseHtml)
    }

    const nextHtml = buildTemplateHtmlFromValues(
      baseHtml,
      activeTemplatePlaceholders,
      templateFieldValues,
    )

    if (editorRef.current) {
      editorRef.current.innerHTML = nextHtml
    }

    setContent(nextHtml)
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const editorContent = editorRef.current ? editorRef.current.innerHTML : content
      const currentContent =
        selectedTemplateBaseHtml && activeTemplatePlaceholders.length
          ? buildTemplateHtmlFromValues(
              selectedTemplateBaseHtml,
              activeTemplatePlaceholders,
              templateFieldValues,
            )
          : editorContent

      if (editorRef.current && currentContent !== editorContent) {
        editorRef.current.innerHTML = currentContent
      }

      if (id) {
        await api.put(`/documents/${id}`, {
          title: title || "Untitled Document",
          name: name || "Unknown Client",
          content: currentContent,
        })
      } else {
        await api.post("/documents/create", {
          title: title || "New Document",
          name: name || "Unknown Client",
          content: currentContent,
          status: "Draft",
        })
      }

      navigate("/documents")
    } catch (error: unknown) {
      const apiError = error as ApiErrorShape
      console.error(error)
      alert(apiError.response?.data?.message || "Failed to save document")
    } finally {
      setLoading(false)
    }
  }

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = INITIAL_CONTENT
      setContent(INITIAL_CONTENT)
    }
    setSelectedTemplateBaseHtml("")
    setActiveTemplatePlaceholders([])
    setTemplateFieldValues({})
    setSelectedSavedTemplateId("")
  }

  const insertTemplate = (type: string) => {
    if (!editorRef.current) return

    setTemplateType(type)
    setSelectedSavedTemplateId("")
    setSelectedTemplateBaseHtml("")
    setActiveTemplatePlaceholders([])
    setTemplateFieldValues({})

    let templateHtml = ""

    if (type === "rental_agreement") {
      templateHtml = `
        <div style="font-family: Roboto, Arial, sans-serif; color: black; line-height: 1.3; font-size: 11pt;">
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px;">
                        <span style="font-weight: bold; font-size: 16pt;">KONUT KİRA SÖZLEŞMESİ</span>
                    </td>
                </tr>
            </table>

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

            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 5px;">ÖZEL ŞARTLAR (Varsa):</div>
            <div style="border: 1px solid black; padding: 10px; margin-bottom: 30px; min-height: 50px;">
                {{OZEL_SARTLAR_ALANI}}
            </div>

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
      `
    } else if (type === "official_mandate") {
      templateHtml = `
        <div style="font-family: Arial, sans-serif; color: black; line-height: 1.5; font-size: 11pt;">
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="font-weight: bold; font-size: 14pt;">T.C.</div>
                <div style="font-weight: bold; font-size: 14pt;">ADALET BAKANLIĞI</div>
                <div style="font-size: 12pt;">Personel Genel Müdürlüğü</div>
            </div>

            <table style="width: 100%; border: none; margin-bottom: 20px;">
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        <strong>Sayı:</strong> E-12345678-903.02-100<br>
                        <strong>Konu:</strong> Görevlendirme Onayı
                    </td>
                    <td style="width: 50%; text-align: right; vertical-align: top;">
                        <strong>Tarih:</strong> ${new Date().toLocaleDateString("tr-TR")}
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

            <table style="width: 100%; border: none; margin-top: 60px;">
                <tr>
                    <td style="width: 60%;"></td>
                    <td style="width: 40%; text-align: center;">
                        Av. ${name || "İsim Soyad"}<br>
                        <span style="font-style: italic;">Daire Başkanı</span>
                        <div style="margin-top: 15px;">(İmza)</div>
                    </td>
                </tr>
            </table>

            <div style="margin-top: 80px; text-align: center;">
                <strong>OLUR</strong><br>
                ${new Date().toLocaleDateString("tr-TR")}<br><br><br>
                <strong>Mehmet YILMAZ</strong><br>
                Bakan a.<br>
                Genel Müdürü
            </div>
        </div>
      `
    } else if (type === "petition") {
      templateHtml = `
        <div style="font-family: Arial, sans-serif; color: black; line-height: 1.5; font-size: 11pt;">
            <div style="text-align: right; margin-bottom: 20px;">
                <strong>Tarih:</strong> ${new Date().toLocaleDateString("tr-TR")}
            </div>

            <div style="text-align: center; font-weight: bold; margin-bottom: 40px; font-size: 12pt;">
                ANKARA CUMHURİYET BAŞSAVCILIĞI'NA
            </div>

            <div style="margin-bottom: 10px;">
                <strong>MÜŞTEKİ :</strong> ${name || "Ad Soyad"} (T.C. No: ....................)
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

            <table style="width: 100%; border: none;">
                <tr>
                    <td style="width: 60%;"></td>
                    <td style="width: 40%; text-align: center;">
                        <strong>Müşteki</strong><br>
                        ${name || "Ad Soyad"}<br>
                        (İmza)
                    </td>
                </tr>
            </table>
        </div>
      `
    }

    if (templateHtml) {
      editorRef.current.innerHTML = templateHtml
      setContent(templateHtml)

      const placeholders = extractTemplatePlaceholders(templateHtml)
      const initialFieldValues = placeholders.reduce<Record<string, string>>(
        (acc, placeholder) => {
          acc[placeholder] = ""
          return acc
        },
        {},
      )
      setSelectedTemplateBaseHtml(templateHtml)
      setActiveTemplatePlaceholders(placeholders)
      setTemplateFieldValues(initialFieldValues)
    }
  }

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editorRef.current) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          editorRef.current?.focus()
          document.execCommand("insertImage", false, event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ""
  }

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen dark:bg-[#111621] dark:text-white">
      <Navbar userName={userName} userProfileImage={userProfileImage} />
      <Sidebar userName={userName} userJob={userJob} userProfileImage={userProfileImage} />

      <main className="ml-72 pt-28 px-12 pb-12 min-h-screen">
        <div className="max-w-5xl mx-auto pb-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2 dark:text-white">
                {id ? "Edit Document" : "Create Document"}
              </h1>
              <p className="text-on-surface-variant font-medium dark:text-slate-400">
                {id
                  ? "Modify existing document details or content."
                  : "Draft a new legal document for a client case file."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/documents")}
                className="px-6 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold hover:bg-surface-container-low transition-all dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-white font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                {loading ? "Saving..." : id ? "Update Document" : "Save Document"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 dark:text-slate-400">
                Document Title
              </label>
              <input
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 px-5 text-lg font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/15 transition-all outline-none"
                placeholder="e.g. Master Service Agreement - Q3 Update"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 flex justify-between dark:text-slate-400">
                Client Association
                {selectedClientId && (
                  <button
                    onClick={handleApplyClientToDocument}
                    className="text-primary hover:text-blue-700 normal-case tracking-normal"
                  >
                    Apply to Document
                  </button>
                )}
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 pl-5 pr-10 appearance-none text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/15 transition-all outline-none"
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                  >
                    <option value="">Select Client...</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant dark:text-slate-400">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsClientModalOpen(true)}
                  className="aspect-square bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-purple-400 rounded-xl flex items-center justify-center hover:bg-secondary/20 transition-all px-4"
                  title="Add New Client"
                >
                  <span className="material-symbols-outlined">person_add</span>
                </button>
              </div>
            </div>

            <div className="col-span-12 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 dark:text-slate-400">
                Saved Template
              </label>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 pl-5 pr-10 appearance-none text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/15 transition-all outline-none"
                    value={selectedSavedTemplateId}
                    onChange={(e) => handleApplySavedTemplate(e.target.value)}
                  >
                    <option value="">Saved template sec...</option>
                    {savedTemplates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant dark:text-slate-400">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/templates")}
                  className="rounded-xl border border-slate-200 px-5 py-4 font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                >
                  Templates sayfasini ac
                </button>
              </div>
            </div>

            {!!activeTemplatePlaceholders.length && (
              <div className="col-span-12 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 dark:text-slate-400">
                      Template Variables
                    </label>
                    <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                      Bu sablonda tanimlanan degiskenleri doldur. Alanlari belgeye
                      uygula dediginde
                      {" "}
                      <code>{"{{DEGISKEN}}"}</code>
                      {" "}
                      alanlari otomatik olarak yer degistirir.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyTemplateFields}
                    className="rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:bg-[#2b67e8]"
                  >
                    Alanlari Belgeye Uygula
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {activeTemplatePlaceholders.map((placeholder) => (
                    <div key={placeholder}>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {formatPlaceholderLabel(placeholder)}
                      </label>
                      <input
                        value={templateFieldValues[placeholder] || ""}
                        onChange={(event) =>
                          handleTemplateFieldChange(placeholder, event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-500/40 dark:focus:ring-blue-500/10"
                        placeholder={`${formatPlaceholderLabel(placeholder)} gir`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.04)] overflow-hidden border border-slate-200">
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-slate-200 bg-slate-50 shadow-inner">
              <div className="relative group/template">
                <select
                  value={templateType}
                  onChange={(e) => insertTemplate(e.target.value)}
                  className="appearance-none outline-none h-9 flex items-center gap-2 pl-3 pr-8 hover:bg-slate-200 rounded-md transition-colors text-sm font-semibold text-primary bg-transparent cursor-pointer"
                >
                  <option value="" disabled>
                    Insert Template...
                  </option>
                  <option value="rental_agreement">Konut Kira Sözleşmesi (Şablon)</option>
                  <option value="official_mandate">Görevlendirme Onayı (Resmî)</option>
                  <option value="petition">Dilekçe Örneği</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-primary pointer-events-none">
                  auto_awesome
                </span>
              </div>

              <div className="h-6 w-[1px] bg-slate-300 mx-2"></div>

              <button
                onClick={() => execCmd("bold")}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                title="Bold"
              >
                <span className="material-symbols-outlined text-[20px]">format_bold</span>
              </button>

              <button
                onClick={() => execCmd("italic")}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                title="Italic"
              >
                <span className="material-symbols-outlined text-[20px]">format_italic</span>
              </button>

              <div className="flex-1"></div>

              <input
                type="file"
                ref={signatureInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleSignatureUpload}
              />

              <button
                onClick={() => signatureInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/10 text-secondary rounded-md transition-colors text-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">ink_pen</span>
                <span>Insert Signature</span>
              </button>
            </div>

            <div className="bg-slate-100 p-8 md:p-12 overflow-y-auto flex flex-col items-center">
              <div
                className="w-[210mm] min-h-[297mm] bg-white text-black shadow-xl p-[2.5cm] outline-none leading-relaxed text-[11pt] relative"
                contentEditable
                ref={editorRef}
                style={{ fontFamily: "Arial, sans-serif" }}
              ></div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold px-4">
            <span>{id ? "Document Revision" : "Draft v1.0.4 - Local Instance"}</span>
            <button
              onClick={handleReset}
              className="hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              Reset Canvas
            </button>
          </div>
        </div>
      </main>

      {isClientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Register New Client
              </h3>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="flex flex-col gap-4">
              <input
                className="w-full h-11 px-4 rounded-xl border-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Full Name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                required
              />
              <input
                className="w-full h-11 px-4 rounded-xl border-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="TC Identity No"
                value={newClient.tcNo}
                onChange={(e) => setNewClient({ ...newClient, tcNo: e.target.value })}
                required
              />
              <input
                className="w-full h-11 px-4 rounded-xl border-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Phone Number"
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
              <input
                className="w-full h-11 px-4 rounded-xl border-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
              <textarea
                className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                placeholder="Address"
                rows={3}
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-slate-400"
                  onClick={() => setIsClientModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
