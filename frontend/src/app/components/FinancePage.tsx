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

export default function FinancePage() {
  const now = new Date()

  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [categories, setCategories] = useState<FinanceCategory[]>([])
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

  const [userName, setUserName] = useState("")
  const [userJob, setUserJob] = useState("")
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null)

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 2, current - 1, current, current + 1]
  }, [])

  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    const storedImage = localStorage.getItem("userProfileImage")
    const storedJob = localStorage.getItem("userJob")

    if (storedName) setUserName(storedName)
    if (storedJob) setUserJob(storedJob)

    if (storedImage) {
      if (storedImage.startsWith("http")) {
        setUserProfileImage(storedImage)
      } else {
        setUserProfileImage(`http://localhost:5000${storedImage}`)
      }
    }
  }, [])

  const loadFinanceData = async () => {
    setLoading(true)

    try {
      const [recordsRes, summaryRes, categoriesRes] = await Promise.all([
        api.get(`/finance/records?month=${month}&year=${year}`),
        api.get(`/finance/summary?month=${month}&year=${year}`),
        api.get("/finance/categories"),
      ])

      setRecords(recordsRes.data || [])
      setSummary(summaryRes.data || null)
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error(error)
      alert("Muhasebe verileri alınamadı.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinanceData()
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

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !amount || !date || !category) {
      alert("Başlık, tutar, tarih ve kategori zorunludur.")
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
      await loadFinanceData()
    } catch (error) {
      console.error(error)
      alert("Kayıt eklenemedi.")
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Bu kaydı silmek istiyor musun?")) return

    try {
      await api.delete(`/finance/records/${id}`)
      await loadFinanceData()
    } catch (error) {
      console.error(error)
      alert("Kayıt silinemedi.")
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return

    try {
      await api.post("/finance/categories", { name: newCategory.trim() })
      setNewCategory("")
      await loadFinanceData()
    } catch (error) {
      console.error(error)
      alert("Kategori eklenemedi veya zaten mevcut.")
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get(`/finance/export?month=${month}&year=${year}`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement("a")

      a.href = url
      a.download = `muhasebe-${year}-${month}.csv`
      a.click()

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert("Dışa aktarma başarısız.")
    }
  }

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
      />

      <main className="ml-0 lg:ml-64 pt-28 px-6 md:px-10 pb-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary font-bold text-sm mb-4">
                <span className="material-symbols-outlined text-[18px]">
                  payments
                </span>
                Finance Management
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Muhasebe
              </h1>

              <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl">
                Aylık gelir-gider kayıtlarını, kategorileri ve finansal özetini yönet.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold dark:bg-[#1e2532] dark:border-[#2e3645]"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}. Ay
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold dark:bg-[#1e2532] dark:border-[#2e3645]"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined">download</span>
                CSV Dışa Aktar
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white p-8 rounded-lg shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Toplam Gelir
              </p>
              <h3 className="mt-4 text-4xl font-black text-emerald-600">
                {money(summary?.totalIncome || 0)}
              </h3>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Toplam Gider
              </p>
              <h3 className="mt-4 text-4xl font-black text-red-600">
                {money(summary?.totalExpense || 0)}
              </h3>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-[0_10px_30px_-10px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
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
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <section className="bg-white rounded-lg p-6 shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <h2 className="text-xl font-black mb-5">Yeni Gelir/Gider</h2>

                <form onSubmit={handleCreateRecord} className="space-y-4">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-[#111621] dark:border-[#2e3645]"
                    placeholder="Başlık"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-[#111621] dark:border-[#2e3645]"
                    placeholder="Tutar"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-[#111621] dark:border-[#2e3645]"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />

                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-[#111621] dark:border-[#2e3645]"
                    value={type}
                    onChange={(e) => setType(e.target.value as FinanceType)}
                  >
                    <option value="income">Gelir</option>
                    <option value="expense">Gider</option>
                  </select>

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-[#111621] dark:border-[#2e3645]"
                    placeholder="Kategori seç veya yaz"
                    list="finance-categories"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />

                  <datalist id="finance-categories">
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name} />
                    ))}
                  </datalist>

                  <button className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white hover:opacity-90 active:scale-95 transition-all">
                    Kaydet
                  </button>
                </form>
              </section>

              <section className="bg-white rounded-lg p-6 shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <h2 className="text-xl font-black mb-5">Kategori Ekle</h2>

                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:bg-[#111621] dark:border-[#2e3645]"
                    placeholder="Örn: Kira"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />

                  <button
                    onClick={handleCreateCategory}
                    className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white dark:bg-white dark:text-slate-900"
                  >
                    Ekle
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span
                      key={cat._id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-8">
              <section className="bg-white rounded-lg overflow-hidden shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <div className="p-6 border-b border-slate-100 dark:border-[#2e3645]">
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
                          <td
                            colSpan={4}
                            className="p-8 text-center text-slate-500"
                          >
                            Bu ay için gelir-gider karşılaştırması yok.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white rounded-lg overflow-hidden shadow-[0_20px_40px_rgba(36,49,86,0.08)] dark:bg-[#1e2532]">
                <div className="p-6 border-b border-slate-100 dark:border-[#2e3645] flex items-center justify-between">
                  <h2 className="text-xl font-black">Kayıtlar</h2>
                  {loading && (
                    <span className="text-sm text-slate-500">Yükleniyor...</span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-[#111621]">
                      <tr>
                        <th className="p-4 text-left">Başlık</th>
                        <th className="p-4 text-left">Tutar</th>
                        <th className="p-4 text-left">Tarih</th>
                        <th className="p-4 text-left">Tip</th>
                        <th className="p-4 text-left">Kategori</th>
                        <th className="p-4 text-left">İşlem</th>
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
                              className="rounded-lg bg-red-50 px-3 py-2 text-red-600 font-bold hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!records.length && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500"
                          >
                            Bu ay için kayıt bulunamadı.
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