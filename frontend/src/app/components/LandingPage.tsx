import { Link } from "react-router-dom"
import { ModeToggle } from "@/app/components/mode-toggle"

export default function LandingPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-200 font-display">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border-light dark:border-border-dark bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 bg-login-primary rounded-lg text-white">
                <span className="material-symbols-outlined text-[20px]">description</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-text-light dark:text-text-dark">MakeDoc</h1>
            </Link>
            
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Link to="/login">
                <button className="hidden sm:flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Log in
                </button>
              </Link>
              <Link to="/sign-up">
                <button className="h-9 items-center justify-center rounded-lg bg-login-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors">
                  Register
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-login-primary dark:text-blue-300 w-fit">
                <span className="flex h-2 w-2 rounded-full bg-login-primary mr-2"></span>
                New: AI Document Analysis v2.0
              </div>
              <h1 className="text-4xl font-black tracking-tight text-text-light dark:text-text-dark sm:text-6xl lg:leading-[1.1]">
                Streamline Your Legal Practice with <span className="text-login-primary">Intelligent Management</span>
              </h1>
              <p className="text-lg text-muted-light dark:text-muted-dark leading-relaxed max-w-xl">
                The all-in-one platform for case tracking, automated billing, and secure client communication. Designed specifically for modern, high-growth law firms.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <Link to="/sign-up">
                    <button className="h-12 px-6 rounded-lg bg-login-primary text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                    Get Started Free
                    </button>
                </Link>
                <button className="h-12 px-6 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-text-light dark:text-text-dark font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">play_circle</span>
                  Watch Demo
                </button>
              </div>
              
            </div>
            <div className="relative lg:h-auto h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-login-primary/20 to-transparent mix-blend-multiply z-10 pointer-events-none"></div>
              <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD9YecPrJgD3sh98RU0ans6y5NIB7p6BqFwZQb3mrEpBIDqdDFydBXa3i7uQGvBFuVznjcZ4XVBb8AEjEPosD9Ff0IKXDnzuSe-mQBwSoOjW7cqwJByMx0SS0JY3QhYrkKkl7zSHQRC6gsjs88uT80tHC1kGUeHj1dwe_WVGcaQFpl6OeWWtYntW8OUPDgjDzwQLJGp7ehNHpQNx-g0Quy6q75JbR9zSZsY63Vpeo6CnWr6H4bcUqArx6y6oIHCpH_rI_Nfn_-CPRY')" }}></div>
              {/* Floating Card UI Element */}
              <div className="absolute bottom-8 left-8 right-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg z-20 border border-gray-100 dark:border-gray-700 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-light dark:text-text-dark">Case #4092 Approved</p>
                    <p className="text-xs text-muted-light dark:text-muted-dark">Just now • Settlement reached</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 blur-3xl opacity-20 dark:opacity-10 pointer-events-none">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
        </div>
      </section>

      {/* Social Proof / Logos */}
      <section className="py-10 border-y border-border-light dark:border-border-dark bg-white dark:bg-[#1a202c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-muted-light dark:text-muted-dark mb-8 uppercase tracking-wider">Trusted by top firms worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder Logos */}
            <div className="flex justify-center items-center h-8">
              <span className="text-xl font-bold font-serif italic text-text-light dark:text-text-dark">Vanguard</span>
            </div>
            <div className="flex justify-center items-center h-8">
              <span className="text-xl font-bold tracking-widest text-text-light dark:text-text-dark">LEXCORP</span>
            </div>
            <div className="flex justify-center items-center h-8">
              <span className="text-xl font-extrabold text-text-light dark:text-text-dark">JURIS<span className="font-light">AI</span></span>
            </div>
            <div className="flex justify-center items-center h-8">
              <span className="text-xl font-bold font-mono text-text-light dark:text-text-dark">Davis&amp;Co</span>
            </div>
            <div className="flex justify-center items-center h-8">
              <span className="text-xl font-serif font-black text-text-light dark:text-text-dark">SCALES</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background-light dark:bg-background-dark">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-login-primary font-semibold text-sm tracking-wider uppercase mb-3">Key Capabilities</h2>
            <h3 className="text-3xl font-bold tracking-tight text-text-light dark:text-text-dark sm:text-4xl mb-4">Everything you need to run a successful practice</h3>
            <p className="text-lg text-muted-light dark:text-muted-dark">Replace your disconnected tools with one unified operating system designed for the modern legal industry.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative p-8 bg-white dark:bg-[#1a202c] rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-login-primary/50 dark:hover:border-login-primary/50 transition-all shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-login-primary text-6xl rotate-12">folder_open</span>
              </div>
              <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-login-primary">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Case Management</h4>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">Organize files, track deadlines with automated reminders, and manage documents effortlessly in a secure cloud environment.</p>
            </div>
            {/* Feature 2 */}
            <div className="group relative p-8 bg-white dark:bg-[#1a202c] rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-login-primary/50 dark:hover:border-login-primary/50 transition-all shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-login-primary text-6xl rotate-12">credit_card</span>
              </div>
              <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-login-primary">
                <span className="material-symbols-outlined">credit_card</span>
              </div>
              <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Secure Billing</h4>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">Automated invoicing, precise time tracking down to the minute, and fully compliant trust accounting integration.</p>
            </div>
            {/* Feature 3 */}
            <div className="group relative p-8 bg-white dark:bg-[#1a202c] rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-login-primary/50 dark:hover:border-login-primary/50 transition-all shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-login-primary text-6xl rotate-12">group</span>
              </div>
              <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-login-primary">
                <span className="material-symbols-outlined">group</span>
              </div>
              <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Client Portal</h4>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">Secure communication channels, encrypted file sharing, and real-time status updates for your clients.</p>
            </div>
            {/* Feature 4 */}
            <div className="group relative p-8 bg-white dark:bg-[#1a202c] rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-login-primary/50 dark:hover:border-login-primary/50 transition-all shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-login-primary text-6xl rotate-12">analytics</span>
              </div>
              <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-login-primary">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Analytics Dashboard</h4>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">Visual insights into firm performance, billable hours, and case success rates to drive better business decisions.</p>
            </div>
            {/* Feature 5 */}
            <div className="group relative p-8 bg-white dark:bg-[#1a202c] rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-login-primary/50 dark:hover:border-login-primary/50 transition-all shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-login-primary text-6xl rotate-12">balance</span>
              </div>
              <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-login-primary">
                <span className="material-symbols-outlined">balance</span>
              </div>
              <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Conflict Checking</h4>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">Instant, firm-wide conflict checks using our proprietary search engine to ensure compliance before taking any case.</p>
            </div>
            {/* Feature 6 */}
            <div className="group relative p-8 bg-white dark:bg-[#1a202c] rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-login-primary/50 dark:hover:border-login-primary/50 transition-all shadow-sm hover:shadow-md">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-login-primary text-6xl rotate-12">smartphone</span>
              </div>
              <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-login-primary">
                <span className="material-symbols-outlined">smartphone</span>
              </div>
              <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Mobile Access</h4>
              <p className="text-muted-light dark:text-muted-dark leading-relaxed">Access your cases, track time, and communicate with clients from anywhere with our native iOS and Android apps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Feature Block (Dark Mode Inverse) */}
      <section className="py-20 bg-white dark:bg-[#1a202c]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 mt-8">
                  <div className="h-48 rounded-2xl bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCaED3s6hzUsUDsEXDfX8NhREKQ6_Y1U1GGg74ldrcLNjemq3aSP4UR3Ekhgq0Lo5FCAtApEVVwG4RfSRGXr0jauKJdDhxiXkdDXyWGqmESt_fjIQpCJDk4dciBQqHpA8KxD9blRcbpUVIg08NIVbA9saKlnqZ3Gmu3Ulyzya4c7Ah0Mxx13nSpTdishe46mhG3SeNVKiXt2GuTgubPMaMGxtMRlKvtoGEHmp__oQj5VHyQD8zbUjrdf8paIeoqvPLiZHj1_iCa8tc')" }}></div>
                  <div className="h-64 rounded-2xl bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBx5Xm7uBMYjDZiYYqR31sUvfRrCRv6Ofxv-kK7XmFM4_EYsKD-wHrfPQopiPl8idtnNFOh6dPY1VJCErHhPPPl2Vh3lOf_olyY7UEDpsDFAZaN7391fwHVWTqE08k2h0Ikj8Jw8Yk0fSGSP6CMH8GLUwbPDOUZL-WStn80irx6P9esJ1KfSB07yk1XyLUQI7-UtJzLekUtKeelRlGt5KDbKY0_y0owFPyaf_6boybUJAa_rd16_roh_-5joHTlR2emNOKGesef264')" }}></div>
                </div>
                <div className="space-y-4">
                  <div className="h-64 rounded-2xl bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAaN51-0suZx9VQYH4iZWzgE73feWM7TuZ048OUIrjWiJsuijZEzCq89ObVAvl9GC_FCdcipUeCWAXeoYtj_K2cCnGpoMpVzE8Gk94LJV1SHJ-QWbSQC95klNvessVrEdGyb8WYOvkiXOxpwsFMTl4Yr8Dx4VaTBBjR-jCS_9ZGJBgFRa1abqANIUi2L9bz7TLzlZ-9dvmgyTz0or4r3_smOczhhVIcc44fr8kH9SRHASmCaj5ILBryq1vJT98wbWx7eyC5NnXszXY')" }}></div>
                  <div className="h-48 rounded-2xl bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBBS5sgmV9dlswolzdAgD2enoRbqLwXC5j6uMySIQoBoSbaFtQP0xpGMQmvD5j54YfKmT03yqnsPEt26_oU4v78T5vV_rfnbofn_t4Cf5iG9rnYGkCg5l8u4xt0ArpdzshH_9auDCF6KdONKDTOKhCezrck7TCCm4sFwOdRyP3DfE_MbwwKZ0bc0x-8gmd2tbPbC-EpfCmiazjgA7AqVPU2cOLfM2bPh_xyUtaK5Tx_EiceMlfS_F95XGzPuVkuxYy8JDpgF_IRVZg')" }}></div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-3xl font-bold tracking-tight text-text-light dark:text-text-dark sm:text-4xl mb-6">Built for the modern legal workflow</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-none pt-1">
                    <div className="flex items-center justify-center size-8 rounded-full bg-login-primary/10 text-login-primary">
                      <span className="material-symbols-outlined text-xl">security</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Bank-Grade Security</h4>
                    <p className="text-muted-light dark:text-muted-dark mt-2">256-bit encryption for all data at rest and in transit. We treat your client's privacy with the same rigor you do.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-none pt-1">
                    <div className="flex items-center justify-center size-8 rounded-full bg-login-primary/10 text-login-primary">
                      <span className="material-symbols-outlined text-xl">bolt</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Automated Workflows</h4>
                    <p className="text-muted-light dark:text-muted-dark mt-2">Set triggers for document generation, email follow-ups, and task assignments to save 10+ hours per week.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-none pt-1">
                    <div className="flex items-center justify-center size-8 rounded-full bg-login-primary/10 text-login-primary">
                      <span className="material-symbols-outlined text-xl">sync</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Seamless Integrations</h4>
                    <p className="text-muted-light dark:text-muted-dark mt-2">Connects natively with Outlook, Gmail, Quickbooks, Dropbox, and over 50 other essential business tools.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-20 bg-login-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">Ready to modernize your firm?</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Join over 5,000 legal professionals who have switched to JurisFlow to grow their practice and reclaim their time.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sign-up">
                <button className="h-12 px-8 rounded-lg bg-white text-login-primary font-bold hover:bg-gray-100 transition-colors shadow-lg dark:bg-[#1e2532]">
                    Start Your Free Trial
                </button>
            </Link>
            <button className="h-12 px-8 rounded-lg border border-white/30 bg-login-primary/20 backdrop-blur-sm text-white font-bold hover:bg-login-primary/40 transition-colors">
              Schedule a Demo
            </button>
          </div>
          <p className="text-sm text-blue-200 mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-light dark:bg-[#0d1117] pt-16 pb-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-login-primary text-[24px]">gavel</span>
                <h2 className="text-xl font-bold text-text-light dark:text-text-dark">JurisFlow</h2>
              </div>
              <p className="text-muted-light dark:text-muted-dark text-sm leading-relaxed max-w-xs mb-6">
                Empowering legal professionals with intelligent tools to manage cases, clients, and billing with ease.
              </p>
              <div className="flex gap-4">
                <a className="text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path></svg>
                </a>
                <a className="text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a className="text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path></svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-light dark:text-text-dark mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Features</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Pricing</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Integrations</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-light dark:text-text-dark mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Documentation</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">API Reference</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Blog</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Community</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-light dark:text-text-dark mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">About</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Legal</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="text-sm text-muted-light dark:text-muted-dark hover:text-login-primary dark:hover:text-white transition-colors" href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-light dark:text-muted-dark">© 2023 JurisFlow Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="text-xs text-muted-light dark:text-muted-dark bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">v2.4.0</span>
              <span className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <span className="size-2 rounded-full bg-green-500"></span>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
