import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import api from "../services/api";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  job?: string;
  profileImage?: string | null;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
};

const resolveProfileImage = (imagePath?: string | null) => {
  if (!imagePath) return null;
  return imagePath.startsWith("http")
    ? imagePath
    : `http://localhost:5000${imagePath}`;
};

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [job, setJob] = useState("");

  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const previewImage = imagePreview || userProfileImage;

  const hasFormChanges = useMemo(() => {
    if (!initialProfile) return false;

    return (
      name.trim() !== initialProfile.name ||
      email.trim().toLowerCase() !== initialProfile.email ||
      (job.trim() || "Lawyer") !== (initialProfile.job || "Lawyer")
    );
  }, [email, initialProfile, job, name]);

  const loadProfile = async () => {
    const response = await api.get("/users/me");
    const user: UserProfile = response.data.data;

    setInitialProfile(user);
    setName(user.name || "");
    setEmail(user.email || "");
    setJob(user.job || "Lawyer");
    setUserProfileImage(resolveProfileImage(user.profileImage));
    setImagePreview(null);
    setSelectedImage(null);

    localStorage.setItem("userName", user.name || "");
    localStorage.setItem("userJob", user.job || "Lawyer");
    if (user.profileImage) {
      localStorage.setItem("userProfileImage", user.profileImage);
    } else {
      localStorage.removeItem("userProfileImage");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        await loadProfile();
      } catch (fetchError: unknown) {
        setError(getErrorMessage(fetchError, "Profil bilgileri yuklenemedi."));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Profil fotografi 10MB'den kucuk olmalidir.");
      return;
    }

    setError(null);
    setMessage(null);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedJob = job.trim() || "Lawyer";

    if (!trimmedName || !trimmedEmail) {
      setError("Ad soyad ve e-posta alanlari zorunludur.");
      return;
    }

    if (!hasFormChanges && !selectedImage) {
      setMessage("Kaydedilecek bir degisiklik bulunmuyor.");
      return;
    }

    try {
      setSaving(true);

      if (hasFormChanges) {
        await api.put("/users/profile", {
          name: trimmedName,
          email: trimmedEmail,
          job: trimmedJob,
        });
      }

      if (selectedImage) {
        const formData = new FormData();
        formData.append("profileImage", selectedImage);
        await api.put("/users/profile/image", formData);
      }

      await loadProfile();
      setMessage("Profil bilgileriniz basariyla guncellendi.");
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, "Profil guncellenemedi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen dark:bg-[#111621] dark:text-white">
      <Navbar userName={name} userProfileImage={previewImage} />
      <Sidebar userName={name} userJob={job} userProfileImage={previewImage} />

      <main className="ml-72 pt-28 px-12 pb-12 min-h-screen">
        <div className="mx-auto max-w-6xl">
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-8 py-10 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.28),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_30%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-blue-200">
                  Profile Studio
                </p>
                <h1 className="text-4xl font-black tracking-tight">
                  Profili Duzenle
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
                  Hesap bilgilerinizi, unvaninizi ve profil fotografinizi tek bir
                  yerden yonetin. Yaptiginiz degisiklikler uygulama genelinde aninda
                  gorunur.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-blue-100">
                    Durum
                  </p>
                  <p className="mt-2 text-lg font-bold">Aktif</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-blue-100">
                    Rol
                  </p>
                  <p className="mt-2 text-lg font-bold">{job || "Lawyer"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-blue-100">
                    Hesap
                  </p>
                  <p className="mt-2 text-lg font-bold">Guncellenebilir</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                Fotograf
              </p>

              <div className="mt-6 flex flex-col items-center rounded-[28px] bg-slate-50 p-6 text-center dark:bg-[#111621]">
                <div className="relative h-40 w-40 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-200 shadow-inner dark:border-[#334155] dark:bg-slate-800">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={name || "Profil fotografi"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-slate-900 text-5xl font-black text-white">
                      {(name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <label
                  htmlFor="profile-image-upload"
                  className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 dark:bg-blue-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    upload
                  </span>
                  Fotograf Sec
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelection}
                  className="hidden"
                />

                <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  JPG, PNG veya WEBP formatinda, maksimum 10MB boyutunda bir
                  fotograf yukleyebilirsiniz.
                </p>
              </div>

              <div className="mt-6 rounded-[24px] border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-sm font-bold text-slate-900 dark:text-blue-100">
                  Profil gorunurlugu
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Guncellediginiz isim, meslek ve profil fotografi; dashboard,
                  mesajlar ve ekip alanlarinda aninda kullanilir.
                </p>
              </div>
            </aside>

            <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-[#2e3645] dark:bg-[#1e2532]">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-6 dark:border-[#2e3645]">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                  Hesap Bilgileri
                </p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Kisisel Bilgileri Guncelle
                </h2>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Bu alanlar giris yapan kullanicinin temel profil bilgilerini
                  gunceller.
                </p>
              </div>

              {loading ? (
                <div className="py-16 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  Profil yukleniyor...
                </div>
              ) : (
                <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                      {message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Ad Soyad
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-[#334155] dark:bg-[#111621] dark:text-white"
                        placeholder="Adinizi ve soyadinizi girin"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Meslek / Unvan
                      </span>
                      <input
                        type="text"
                        value={job}
                        onChange={(event) => setJob(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-[#334155] dark:bg-[#111621] dark:text-white"
                        placeholder="Orn. Lawyer, Attorney, Partner"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      E-posta Adresi
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-[#334155] dark:bg-[#111621] dark:text-white"
                      placeholder="ornek@hukukburosu.com"
                      required
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-[#334155] dark:bg-[#111621]">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Kayitli hesap ozeti
                      </p>
                      <dl className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between gap-4">
                          <dt>Kullanici</dt>
                          <dd className="font-semibold text-slate-900 dark:text-white">
                            {name || "-"}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt>E-posta</dt>
                          <dd className="font-semibold text-slate-900 dark:text-white">
                            {email || "-"}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt>Rol</dt>
                          <dd className="font-semibold text-slate-900 dark:text-white">
                            {job || "Lawyer"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
                      <p className="text-sm font-bold text-slate-900 dark:text-amber-100">
                        Guvenlik Notu
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        E-posta degisikligi yaptiginizda bir sonraki giriste yeni
                        adresinizi kullanmaniz gerekir. Kaydetmeden once bilgilerinizi
                        son kez kontrol edin.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-[#2e3645]">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Degisiklikleriniz kaydedildiginde local profil bilgileri de
                      otomatik guncellenir.
                    </p>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        save
                      </span>
                      {saving ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
