import { Link } from "react-router-dom"
import { ModeToggle } from "@/app/components/mode-toggle"

const socialProof = [
  "Acme Corp",
  "GlobalTech",
  "Nexus",
  "Stark Ind.",
  "Wayne Ent.",
]

const features = [
  {
    icon: "folder_special",
    title: "Smart Organization",
    description:
      "Auto-categorization and intelligent search mean you never lose a file again. Finding what you need takes seconds.",
  },
  {
    icon: "shield_lock",
    title: "Secure Collaboration",
    description:
      "Granular permissions and enterprise-grade encryption keep your sensitive documents safe while working with your team.",
  },
  {
    icon: "sync",
    title: "Real-time Sync",
    description:
      "Changes are saved instantly across all devices. Work seamlessly from your desk or on the go without missing a beat.",
  },
]

const workflowSteps = [
  {
    step: "1",
    title: "Upload",
    description: "Drag and drop your files into our secure vault.",
    primary: false,
  },
  {
    step: "2",
    title: "Organize",
    description: "Let AI tag and sort your documents automatically.",
    primary: false,
  },
  {
    step: "3",
    title: "Collaborate",
    description: "Share securely and work together in real-time.",
    primary: true,
  },
]

const footerLinks = [
  "Privacy Policy",
  "Terms of Service",
  "Security",
  "Contact",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body antialiased transition-colors dark:bg-background-dark dark:text-white">
      <nav className="fixed top-0 z-50 w-full bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 dark:bg-slate-950/80 dark:shadow-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="font-headline text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            MakeDoc
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              className="font-body font-medium text-slate-600 transition-colors duration-200 ease-in-out hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              href="#product"
            >
              Product
            </a>
            <a
              className="scale-95 font-body font-medium text-slate-600 transition-colors duration-200 ease-in-out hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              href="#features"
            >
              Features
            </a>
            <a
              className="scale-95 font-body font-medium text-slate-600 transition-colors duration-200 ease-in-out hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              href="#pricing"
            >
              Pricing
            </a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <ModeToggle />
            <Link
              to="/login"
              className="font-body font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="rounded-full bg-primary-container px-6 py-2.5 font-body font-medium text-on-primary transition-colors hover:bg-[#2b67e8]"
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ModeToggle />
            <Link
              to="/login"
              className="rounded-full bg-primary-container px-4 py-2 text-sm font-medium text-on-primary"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-32 px-6 pb-20 pt-28">
        <section
          id="product"
          className="mt-8 grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]"
        >
          <div className="flex w-full flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              Document intelligence for modern teams
            </div>

            <h1 className="font-headline text-5xl font-extrabold leading-tight tracking-tight text-on-surface dark:text-white md:text-6xl">
              Manage your documents with intelligence
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-on-surface-variant dark:text-slate-400 md:text-xl">
              MakeDoc transforms how your team organizes, secures, and
              collaborates on files. Experience the luminous workspace designed
              for modern productivity.
            </p>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-container px-8 py-4 text-lg font-medium text-on-primary shadow-[0_18px_40px_rgba(0,82,255,0.18)] transition-colors hover:bg-[#2b67e8]"
              >
                Get Started for Free
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  arrow_forward
                </span>
              </Link>

              <button className="rounded-full bg-surface-container-high px-8 py-4 text-lg font-medium text-on-surface transition-colors hover:bg-[#f2f5fb] dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/90">
                View Demo
              </button>
            </div>

            <div className="grid max-w-xl grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Uptime
                </p>
                <p className="mt-2 text-2xl font-bold text-on-surface dark:text-white">
                  99.9%
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Teams
                </p>
                <p className="mt-2 text-2xl font-bold text-on-surface dark:text-white">
                  5K+
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Saved Time
                </p>
                <p className="mt-2 text-2xl font-bold text-on-surface dark:text-white">
                  12h/w
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full">
            <div className="absolute left-10 top-8 h-36 w-36 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-500/20" />
            <div className="absolute bottom-8 right-8 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/20" />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-surface-container p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                      Workspace
                    </p>
                    <h3 className="mt-2 font-headline text-2xl font-bold text-on-surface dark:text-white">
                      Team overview
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25">
                    Live Sync
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          Recent activity
                        </p>
                        <p className="mt-1 text-3xl font-black text-on-surface dark:text-white">
                          128 files
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        <span className="material-symbols-outlined">folder_open</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-on-surface dark:text-white">
                              Contract pack updated
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Shared with 8 collaborators
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Synced
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-on-surface dark:text-white">
                              Policy archive secured
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              256-bit encrypted storage active
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            Protected
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                        Smart Search
                      </p>
                      <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        Search by tag, owner, or activity...
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <span className="material-symbols-outlined text-[18px]">
                          auto_awesome
                        </span>
                        AI suggestions enabled
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                        Workflow
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                          <span className="text-sm font-semibold text-on-surface dark:text-white">
                            Review
                          </span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                            24
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                          <span className="text-sm font-semibold text-on-surface dark:text-white">
                            Approval
                          </span>
                          <span className="text-sm font-bold text-violet-600 dark:text-violet-300">
                            11
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                          <span className="text-sm font-semibold text-on-surface dark:text-white">
                            Archived
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">
                            93
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center gap-8 py-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-outline dark:text-slate-500">
            Trusted by leading teams
          </p>

          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60 grayscale transition-all duration-500 hover:grayscale-0">
            {socialProof.map((item) => (
              <span
                key={item}
                className="font-headline text-2xl font-bold text-on-surface dark:text-white"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section id="features" className="flex flex-col gap-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-headline text-3xl font-bold text-on-surface dark:text-white md:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-lg text-on-surface-variant dark:text-slate-400">
              Designed to reduce friction and increase focus.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-surface-container-lowest p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed text-primary-container dark:bg-slate-800">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface dark:text-white">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-on-surface-variant dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface-container-low p-12 dark:bg-slate-900 md:p-20">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 font-headline text-3xl font-bold text-on-surface dark:text-white md:text-4xl">
              A seamless workflow
            </h2>
            <p className="text-lg text-on-surface-variant dark:text-slate-400">
              Three simple steps to a more organized team.
            </p>
          </div>

          <div className="relative flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="absolute left-[10%] right-[10%] top-8 z-0 hidden h-0.5 bg-surface-container-highest dark:bg-slate-700 md:block" />

            {workflowSteps.map((item) => (
              <div
                key={item.step}
                className="relative z-10 flex w-full flex-col items-center gap-6 text-center md:w-1/3"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${
                    item.primary
                      ? "bg-primary-container text-on-primary"
                      : "bg-surface-container-lowest text-primary-container dark:bg-slate-800"
                  }`}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-on-surface dark:text-white">
                  {item.title}
                </h3>
                <p className="text-on-surface-variant dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="flex flex-col items-center justify-center gap-8 py-20 text-center"
        >
          <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface dark:text-white md:text-5xl">
            Ready to transform your workflow?
          </h2>
          <p className="max-w-2xl text-xl text-on-surface-variant dark:text-slate-400">
            Join thousands of teams already using MakeDoc to stay organized and
            secure.
          </p>
          <Link
            to="/sign-up"
            className="mt-4 rounded-full bg-primary-container px-10 py-5 text-xl font-medium text-on-primary shadow-[0_20px_40px_rgba(0,82,255,0.18)] transition-colors hover:bg-[#2b67e8]"
          >
            Start Your Free Trial
          </Link>
        </section>
      </main>

      <footer className="mt-20 w-full rounded-t-[3rem] bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-8 px-10 py-12 md:flex-row">
          <div className="font-headline text-xl font-bold text-slate-900 dark:text-white">
            MakeDoc
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            {footerLinks.map((item) => (
              <a
                key={item}
                className="text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                href="#"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Copyright 2024 MakeDoc Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
