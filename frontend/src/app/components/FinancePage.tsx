import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import { Navbar } from "../components/Navbar"
import { Sidebar } from "../components/Sidebar"

type FinanceType = "income" | "expense"

interface FinanceRecord {
  _id: string
  title: string
  amount: number
  date: string
  type: FinanceType
  category: string
}

interface FinanceCategory {
  _id: string
  name: string
}

interface Client {
  _id: string
  name: string
  email?: string
  phone?: string
  tcNo?: string
}

interface Invoice {
  _id: string
  invoiceNumber: string
  title: string
  description?: string
  amount: number
  invoiceDate: string
  dueDate: string
  status: "draft" | "issued" | "paid" | "overdue"
  clientName: string
  clientEmail?: string
  notes?: string
  client?: Client
}

interface FinanceSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  comparison: {
    category: string
    income: number
    expense: number
    balance: number
  }[]
}

const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value || 0)

const todayInput = () => new Date().toISOString().slice(0, 10)

const monthStartInput = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)

const loadFinanceBundle = async (month: number, year: number) => {
  const [recordsRes, summaryRes, categoriesRes, clientsRes, invoicesRes] =
    await Promise.all([
    api.get(`/finance/records?month=${month}&year=${year}`),
    api.get(`/finance/summary?month=${month}&year=${year}`),
    api.get("/finance/categories"),
    api.get("/clients"),
    api.get("/finance/invoices"),
  ])

  return {
    records: recordsRes.data || [],
    summary: summaryRes.data || null,
    categories: categoriesRes.data || [],
    clients: clientsRes.data.data || [],
    invoices: invoicesRes.data || [],
  }
}

export default function FinancePage() {
  const now = new Date()

  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)

  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(todayInput())
  const [type, setType] = useState<FinanceType>("income")
  const [category, setCategory] = useState("")

  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportStartDate, setExportStartDate] = useState(monthStartInput(now))
  const [exportEndDate, setExportEndDate] = useState(todayInput())
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(
    null,
  )

  const [invoiceClientId, setInvoiceClientId] = useState("")
  const [invoiceTitle, setInvoiceTitle] = useState("")
  const [invoiceDescription, setInvoiceDescription] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(todayInput())
  const [invoiceDueDate, setInvoiceDueDate] = useState(todayInput())
  const [invoiceStatus, setInvoiceStatus] = useState<
    "draft" | "issued" | "paid" | "overdue"
  >("issued")
  const [invoiceNotes, setInvoiceNotes] = useState("")

  const [userName, setUserName] = useState("")
  const [userJob, setUserJob] = useState("")
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 2, current - 1, current, current + 1]
  }, [])

  const refreshFinanceData = async () => {
    setLoading(true)

    try {
      const bundle = await loadFinanceBundle(month, year)
      setRecords(bundle.records)
      setSummary(bundle.summary)
      setCategories(bundle.categories)
      setClients(bundle.clients)
      setInvoices(bundle.invoices)
    } catch (error) {
      console.error(error)
      alert("Muhasebe verileri alinamadi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedImage = localStorage.getItem("userProfileImage")
    const storedJob = localStorage.getItem("userJob")

    if (storedName) setUserName(storedName)
    if (storedJob) setUserJob(storedJob)

    if (storedImage) {
      setUserProfileImage(
        storedImage.startsWith("http")
          ? storedImage
          : `http://localhost:5000${storedImage}`,
      )
    }
  }, [])

  useEffect(() => {
    const syncFinanceData = async () => {
      setLoading(true)

      try {
        const bundle = await loadFinanceBundle(month, year)
        setRecords(bundle.records)
        setSummary(bundle.summary)
        setCategories(bundle.categories)
        setClients(bundle.clients)
        setInvoices(bundle.invoices)
      } catch (error) {
        console.error(error)
        alert("Muhasebe verileri alinamadi.")
      } finally {
        setLoading(false)
      }
    }

    void syncFinanceData()
  }, [month, year])

  const handleProfileImageUpdate = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }

      const formData = new FormData()
      formData.append("profileImage", file)

      try {
        const response = await api.put("/users/profile/image", formData)

        if (response.data.success) {
          const newImagePath = response.data.data.profileImage
          localStorage.setItem("userProfileImage", newImagePath)
          setUserProfileImage(`http://localhost:5000${newImagePath}`)
        }
      } catch (error) {
        console.error("Failed to update profile image:", error)
      }
    }
  }

  const resetForm = () => {
    setTitle("")
    setAmount("")
    setDate(todayInput())
    setType("income")
    setCategory("")
  }

  const handleCreateRecord = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!title || !amount || !date || !category) {
      alert("Baslik, tutar, tarih ve kategori zorunludur.")
      return
    }

    try {
      await api.post("/finance/records", {
        title,
        amount: Number(amount),
        date,
        type,
        category,
      })

      resetForm()
      await refreshFinanceData()
    } catch (error) {
      console.error(error)
      alert("Kayit eklenemedi.")
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Bu kaydi silmek istiyor musun?")) return

    try {
      await api.delete(`/finance/records/${id}`)
      await refreshFinanceData()
    } catch (error) {
      console.error(error)
      alert("Kayit silinemedi.")
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return

    try {
      await api.post("/finance/categories", { name: newCategory.trim() })
      setNewCategory("")
      await refreshFinanceData()
    } catch (error) {
      console.error(error)
      alert("Kategori eklenemedi veya zaten mevcut.")
    }
  }

  const resetInvoiceForm = () => {
    setInvoiceClientId("")
    setInvoiceTitle("")
    setInvoiceDescription("")
    setInvoiceAmount("")
    setInvoiceDate(todayInput())
    setInvoiceDueDate(todayInput())
    setInvoiceStatus("issued")
    setInvoiceNotes("")
  }

  const handleCreateInvoice = async (event: React.FormEvent) => {
    event.preventDefault()

    if (
      !invoiceClientId ||
      !invoiceTitle ||
      !invoiceAmount ||
      !invoiceDate ||
      !invoiceDueDate
    ) {
      alert("Muvekkil, baslik, tutar, fatura tarihi ve vade tarihi zorunludur.")
      return
    }

    setCreatingInvoice(true)

    try {
      await api.post("/finance/invoices", {
        clientId: invoiceClientId,
        title: invoiceTitle,
        description: invoiceDescription,
        amount: Number(invoiceAmount),
        invoiceDate,
        dueDate: invoiceDueDate,
        status: invoiceStatus,
        notes: invoiceNotes,
      })

      resetInvoiceForm()
      await refreshFinanceData()
    } catch (error) {
      console.error(error)
      alert("Fatura olusturulamadi.")
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleInvoiceStatusChange = async (
    invoiceId: string,
    status: "draft" | "issued" | "paid" | "overdue",
  ) => {
    try {
      await api.patch(`/finance/invoices/${invoiceId}/status`, { status })
      setInvoices((currentInvoices) =>
        currentInvoices.map((invoice) =>
          invoice._id === invoiceId ? { ...invoice, status } : invoice,
        ),
      )
    } catch (error) {
      console.error(error)
      alert("Fatura durumu guncellenemedi.")
    }
  }

  const handleDownloadInvoicePdf = async (
    invoiceId: string,
    invoiceNumber: string,
  ) => {
    setDownloadingInvoiceId(invoiceId)

    try {
      const response = await api.get(`/finance/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      })

      const file = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(file)
      const link = document.createElement("a")

      link.href = url
      link.download = `${invoiceNumber}.pdf`
      link.click()

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert("Fatura PDF indirilemedi.")
    } finally {
      setDownloadingInvoiceId(null)
    }
  }

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert("Baslangic ve bitis tarihi secmelisin.")
      return
    }

    if (exportStartDate > exportEndDate) {
      alert("Baslangic tarihi bitis tarihinden sonra olamaz.")
      return
    }

    setExporting(true)

    try {
      const params = new URLSearchParams({
        startDate: exportStartDate,
        endDate: exportEndDate,
      })

      const response = await api.get(`/finance/export?${params.toString()}`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const anchor = document.createElement("a")

      anchor.href = url
      anchor.download = `muhasebe-${exportStartDate}-${exportEndDate}.csv`
      anchor.click()

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert("Disa aktarma basarisiz.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-on-surface antialiased dark:bg-[#111621] dark:text-white">
      <Navbar
        userName={userName}
        userProfileImage={userProfileImage}
        onProfileImageUpdate={handleProfileImageUpdate}
      />

      <Sidebar
        userName={userName}
        userJob={userJob}
        userProfileImage={userProfileImage}
      />

      <main className="ml-0 px-6 pb-12 pt-28 md:px-10 lg:ml-64">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  payments
                </span>
                Finance Management
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                Muhasebe
              </h1>

              <p className="mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
                Aylik gelir-gider kayitlarini, kategorileri ve finansal ozetini
                yonet.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold dark:border-[#2e3645] dark:bg-[#1e2532]"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (itemMonth) => (
                    <option key={itemMonth} value={itemMonth}>
                      {itemMonth}. Ay
                    </option>
                  ),
                )}
              </select>

              <select
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold dark:border-[#2e3645] dark:bg-[#1e2532]"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {years.map((itemYear) => (
                  <option key={itemYear} value={itemYear}>
                    {itemYear}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Tarih Araligina Gore Aktar
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Belirli iki tarih arasindaki gelir ve gider kayitlarini CSV
                  olarak disa aktar.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Baslangic
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(event) => setExportStartDate(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold dark:border-[#2e3645] dark:bg-[#111621]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Bitis
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(event) => setExportEndDate(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold dark:border-[#2e3645] dark:bg-[#111621]"
                  />
                </div>

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-[#2b67e8] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined">download</span>
                  {exporting ? "Aktariliyor..." : "CSV Disa Aktar"}
                </button>
              </div>
            </div>
          </section>

          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-8 shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Toplam Gelir
              </p>
              <h3 className="mt-4 text-4xl font-black text-emerald-600">
                {money(summary?.totalIncome || 0)}
              </h3>
            </div>

            <div className="rounded-lg bg-white p-8 shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Toplam Gider
              </p>
              <h3 className="mt-4 text-4xl font-black text-red-600">
                {money(summary?.totalExpense || 0)}
              </h3>
            </div>

            <div className="rounded-lg bg-white p-8 shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Net Durum
              </p>
              <h3
                className={`mt-4 text-4xl font-black ${
                  (summary?.balance || 0) >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {money(summary?.balance || 0)}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 space-y-8 lg:col-span-4">
              <section className="rounded-lg bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <h2 className="mb-5 text-xl font-black">Yeni Gelir/Gider</h2>

                <form onSubmit={handleCreateRecord} className="space-y-4">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Baslik"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Tutar"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />

                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value as FinanceType)
                    }
                  >
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Kategori sec veya yaz"
                    list="finance-categories"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />

                  <datalist id="finance-categories">
                    {categories.map((financeCategory) => (
                      <option key={financeCategory._id} value={financeCategory.name} />
                    ))}
                  </datalist>

                  <button className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white transition-colors hover:bg-[#2b67e8]">
                    Kaydet
                  </button>
                </form>
              </section>

              <section className="rounded-lg bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <h2 className="mb-5 text-xl font-black">Kategori Ekle</h2>

                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Orn: Kira"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                  />

                  <button
                    onClick={handleCreateCategory}
                    className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white dark:bg-white dark:text-slate-900"
                  >
                    Ekle
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {categories.map((financeCategory) => (
                    <span
                      key={financeCategory._id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {financeCategory.name}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-lg bg-white p-6 shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <div className="mb-5">
                  <h2 className="text-xl font-black">Fatura Kes</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Muvekkil secerek hizmete ait yeni fatura olustur.
                  </p>
                </div>

                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    value={invoiceClientId}
                    onChange={(event) => setInvoiceClientId(event.target.value)}
                  >
                    <option value="">Muvekkil sec</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Fatura basligi"
                    value={invoiceTitle}
                    onChange={(event) => setInvoiceTitle(event.target.value)}
                  />

                  <textarea
                    className="min-h-[92px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Hizmet aciklamasi"
                    value={invoiceDescription}
                    onChange={(event) =>
                      setInvoiceDescription(event.target.value)
                    }
                  />

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Fatura tutari"
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceAmount}
                    onChange={(event) => setInvoiceAmount(event.target.value)}
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                      type="date"
                      value={invoiceDate}
                      onChange={(event) => setInvoiceDate(event.target.value)}
                    />

                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                      type="date"
                      value={invoiceDueDate}
                      onChange={(event) => setInvoiceDueDate(event.target.value)}
                    />
                  </div>

                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    value={invoiceStatus}
                    onChange={(event) =>
                      setInvoiceStatus(
                        event.target.value as
                          | "draft"
                          | "issued"
                          | "paid"
                          | "overdue",
                      )
                    }
                  >
                    <option value="draft">Taslak</option>
                    <option value="issued">Kesildi</option>
                    <option value="paid">Odendi</option>
                    <option value="overdue">Gecikmis</option>
                  </select>

                  <textarea
                    className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[#2e3645] dark:bg-[#111621]"
                    placeholder="Notlar"
                    value={invoiceNotes}
                    onChange={(event) => setInvoiceNotes(event.target.value)}
                  />

                  <button
                    disabled={creatingInvoice || clients.length === 0}
                    className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white transition-colors hover:bg-[#2b67e8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {creatingInvoice ? "Olusturuluyor..." : "Fatura Olustur"}
                  </button>
                </form>

                {clients.length === 0 && (
                  <p className="mt-3 text-sm text-amber-600 dark:text-amber-300">
                    Once Clients bolumunden bir muvekkil eklemelisin.
                  </p>
                )}
              </section>
            </div>

            <div className="col-span-12 space-y-8 lg:col-span-8">
              <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <div className="border-b border-slate-100 p-6 dark:border-[#2e3645]">
                  <h2 className="text-xl font-black">Faturalar</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-[#111621]">
                      <tr>
                        <th className="p-4 text-left">Fatura No</th>
                        <th className="p-4 text-left">Muvekkil</th>
                        <th className="p-4 text-left">Baslik</th>
                        <th className="p-4 text-left">Tutar</th>
                        <th className="p-4 text-left">Kesim</th>
                        <th className="p-4 text-left">Vade</th>
                        <th className="p-4 text-left">Durum</th>
                        <th className="p-4 text-left">PDF</th>
                      </tr>
                    </thead>

                    <tbody>
                      {invoices.map((invoice) => (
                        <tr
                          key={invoice._id}
                          className="border-t border-slate-100 dark:border-[#2e3645]"
                        >
                          <td className="p-4 font-bold text-primary">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {invoice.clientName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {invoice.clientEmail || "-"}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold">{invoice.title}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {invoice.description || invoice.notes || "-"}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-900 dark:text-white">
                            {money(invoice.amount)}
                          </td>
                          <td className="p-4">
                            {new Date(invoice.invoiceDate).toLocaleDateString(
                              "tr-TR",
                            )}
                          </td>
                          <td className="p-4">
                            {new Date(invoice.dueDate).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="p-4">
                            <select
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-[#2e3645] dark:bg-[#111621]"
                              value={invoice.status}
                              onChange={(event) =>
                                handleInvoiceStatusChange(
                                  invoice._id,
                                  event.target.value as
                                    | "draft"
                                    | "issued"
                                    | "paid"
                                    | "overdue",
                                )
                              }
                            >
                              <option value="draft">Taslak</option>
                              <option value="issued">Kesildi</option>
                              <option value="paid">Odendi</option>
                              <option value="overdue">Gecikmis</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() =>
                                handleDownloadInvoicePdf(
                                  invoice._id,
                                  invoice.invoiceNumber,
                                )
                              }
                              disabled={downloadingInvoiceId === invoice._id}
                              className="rounded-lg bg-primary/10 px-3 py-2 font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {downloadingInvoiceId === invoice._id
                                ? "Hazirlaniyor..."
                                : "PDF"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!invoices.length && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            Henuz olusturulmus fatura yok.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <div className="border-b border-slate-100 p-6 dark:border-[#2e3645]">
                  <h2 className="text-xl font-black">Gelir - Gider Tablosu</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-[#111621]">
                      <tr>
                        <th className="p-4 text-left">Kategori</th>
                        <th className="p-4 text-left">Gelir</th>
                        <th className="p-4 text-left">Gider</th>
                        <th className="p-4 text-left">Net</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(summary?.comparison || []).map((row) => (
                        <tr
                          key={row.category}
                          className="border-t border-slate-100 dark:border-[#2e3645]"
                        >
                          <td className="p-4 font-bold">{row.category}</td>
                          <td className="p-4 font-semibold text-emerald-600">
                            {money(row.income)}
                          </td>
                          <td className="p-4 font-semibold text-red-600">
                            {money(row.expense)}
                          </td>
                          <td
                            className={`p-4 font-black ${
                              row.balance >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {money(row.balance)}
                          </td>
                        </tr>
                      ))}

                      {!summary?.comparison?.length && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500">
                            Bu ay icin gelir-gider karsilastirmasi yok.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-[#2e3645]">
                  <h2 className="text-xl font-black">Kayitlar</h2>
                  {loading && (
                    <span className="text-sm text-slate-500">Yukleniyor...</span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-[#111621]">
                      <tr>
                        <th className="p-4 text-left">Baslik</th>
                        <th className="p-4 text-left">Tutar</th>
                        <th className="p-4 text-left">Tarih</th>
                        <th className="p-4 text-left">Tip</th>
                        <th className="p-4 text-left">Kategori</th>
                        <th className="p-4 text-left">Islem</th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map((record) => (
                        <tr
                          key={record._id}
                          className="border-t border-slate-100 dark:border-[#2e3645]"
                        >
                          <td className="p-4 font-bold">{record.title}</td>
                          <td
                            className={`p-4 font-semibold ${
                              record.type === "income"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {money(record.amount)}
                          </td>
                          <td className="p-4">
                            {new Date(record.date).toLocaleDateString("tr-TR")}
                          </td>
                          <td className="p-4">
                            {record.type === "income" ? "Gelir" : "Gider"}
                          </td>
                          <td className="p-4">{record.category}</td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDeleteRecord(record._id)}
                              className="rounded-lg bg-red-50 px-3 py-2 font-bold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!records.length && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            Bu ay icin kayit bulunamadi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
