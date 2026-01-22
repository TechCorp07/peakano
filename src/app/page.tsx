'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/config/routes';
import { siteConfig } from '@/config/site';

/**
 * Home Page - Annotation Tool
 * Landing page matching the existing MVP at training.peakpoint.africa
 */
export default function HomePage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const features = [
    {
      icon: '📚',
      title: 'Structured Learning Paths',
      description: 'Progressive curriculum from MRI/CT anatomy basics to advanced annotation techniques, with interactive modules and real medical datasets',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '⏱️',
      title: 'Timed Skill Assessments',
      description: 'Build confidence with quick practice sessions, skill tests, and certification exams. Track your speed and accuracy improvements',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: '📊',
      title: 'Progress Analytics',
      description: 'Comprehensive dashboard with performance metrics, skill breakdowns, and personalized recommendations for improvement',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: '🔬',
      title: 'Professional DICOM Viewer',
      description: 'Full-featured medical imaging viewer with pan, zoom, window/level presets, multi-frame support, and measurement tools',
      gradient: 'from-teal-500 to-emerald-500',
    },
    {
      icon: '🤖',
      title: 'AI-Powered Tools',
      description: 'Smart annotation with Magic Wand, Region Growing, AI Segmentation (SAM/MedSAM), and automatic contour detection',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: '🎯',
      title: 'Multi-Level Certification',
      description: 'Three-tier assessment system: Quick Practice for learning, Skill Tests for validation, and Certification for credentials',
      gradient: 'from-emerald-500 to-teal-500',
    },
  ];

  const stats = [
    { value: '1000+', label: 'Students Trained', icon: '👨‍🎓' },
    { value: '4', label: 'Learning Paths', icon: '📖' },
    { value: '100%', label: 'Online Certification', icon: '🏆' },
    { value: '24/7', label: 'Platform Access', icon: '💬' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1a]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00D95A]/20 blur-2xl rounded-full group-hover:bg-[#00D95A]/40 transition-all scale-150" />
              <Image
                src={siteConfig.logo}
                alt={siteConfig.name}
                width={72}
                height={72}
                className="w-16 h-16 md:w-[72px] md:h-[72px] object-contain relative z-10 drop-shadow-[0_0_15px_rgba(0,217,90,0.3)]"
              />
            </div>
            <span className="text-2xl font-black text-white group-hover:text-[#00D95A] transition-colors tracking-tight">{siteConfig.name}</span>
          </Link>
          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <Link
                href={ROUTES.DASHBOARD}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00D95A] to-[#00B84C] px-7 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(0,217,90,0.4)] hover:shadow-[0_0_40px_rgba(0,217,90,0.6)] hover:scale-105 transition-all duration-300"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  className="text-slate-300 hover:text-white transition-colors text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00D95A] to-[#00B84C] px-7 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(0,217,90,0.4)] hover:shadow-[0_0_40px_rgba(0,217,90,0.6)] hover:scale-105 transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#00D95A]/20 via-teal-500/10 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjkzYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          {/* Logo with glow */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00D95A]/30 blur-3xl rounded-full scale-[2]" />
              <Image
                src={siteConfig.logo}
                alt={siteConfig.name}
                width={180}
                height={180}
                className="w-36 h-36 md:w-44 md:h-44 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,217,90,0.4)]"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#00D95A]/10 border border-[#00D95A]/30 rounded-full px-5 py-2 mb-6">
            <span className="w-2 h-2 bg-[#00D95A] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#00D95A]">Africa&apos;s #1 Medical Imaging Training Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6">
            Master Medical
            <br />
            <span className="bg-gradient-to-r from-[#00D95A] via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Image Annotation
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            Comprehensive training system for MRI &amp; CT scan annotation. 
            Get certified and join the future of medical AI development.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-12">
            {isAuthenticated ? (
              <Link
                href={ROUTES.DASHBOARD}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00D95A] to-[#00B84C] px-10 py-4 text-lg font-bold text-black shadow-[0_0_40px_rgba(0,217,90,0.5)] hover:shadow-[0_0_60px_rgba(0,217,90,0.7)] hover:scale-105 transition-all duration-300"
              >
                Continue Learning →
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.REGISTER}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00D95A] to-[#00B84C] px-10 py-4 text-lg font-bold text-black shadow-[0_0_40px_rgba(0,217,90,0.5)] hover:shadow-[0_0_60px_rgba(0,217,90,0.7)] hover:scale-105 transition-all duration-300"
                >
                  Start Learning Free →
                </Link>
                <Link
                  href={ROUTES.LOGIN}
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm px-10 py-4 text-lg font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Floating UI Preview - Professional DICOM Viewer */}
          <div className="relative max-w-5xl mx-auto mt-10">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D95A]/30 to-cyan-500/20 rounded-3xl blur-3xl scale-105" />
            <div className="relative bg-gradient-to-br from-[#0d1117] to-[#161b22] rounded-2xl border border-[#30363d] p-1 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#161b22] rounded-t-xl border-b border-[#30363d]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#0d1117] rounded-md px-4 py-1.5 text-xs text-slate-400 border border-[#30363d] flex items-center gap-2">
                    <span className="text-[#00D95A]">🔒</span>
                    app.peakpoint.africa/viewer/study-001
                  </div>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <div className="w-4 h-4 rounded bg-slate-700/50" />
                  <div className="w-4 h-4 rounded bg-slate-700/50" />
                </div>
              </div>
              
              {/* Professional viewer interface */}
              <div className="grid grid-cols-12 gap-1 p-1 h-72 md:h-96 bg-[#0d1117]">
                {/* Left sidebar - Tools */}
                <div className="col-span-2 bg-[#161b22] rounded-lg p-3 flex flex-col gap-3 border border-[#30363d]/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tools</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['✏️', '🔲', '⭕', '📏', '🎯', '🪄', '🔍', '✋'].map((icon, i) => (
                      <div key={i} className={`h-8 rounded flex items-center justify-center text-sm cursor-pointer transition-all ${i === 5 ? 'bg-[#00D95A]/20 border border-[#00D95A]/50 ring-1 ring-[#00D95A]/30' : 'bg-[#0d1117] hover:bg-slate-700/50 border border-[#30363d]/30'}`}>
                        {icon}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-2">Series</div>
                  <div className="space-y-1.5 flex-1">
                    {['T2 Axial', 'T1 Sagittal', 'DWI'].map((series, i) => (
                      <div key={series} className={`text-[10px] rounded px-2 py-2 flex items-center gap-2 cursor-pointer transition-all ${i === 0 ? 'bg-[#00D95A]/10 text-[#00D95A] border border-[#00D95A]/30' : 'text-slate-400 bg-[#0d1117] border border-transparent hover:border-[#30363d]'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#00D95A]' : 'bg-slate-600'}`} />
                        {series}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Main viewport */}
                <div className="col-span-8 bg-black rounded-lg relative overflow-hidden border border-[#30363d]/50">
                  {/* Realistic MRI visualization */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-56 h-56 md:w-72 md:h-72">
                      {/* Outer body outline */}
                      <div className="absolute inset-0 rounded-[40%] bg-gradient-to-br from-slate-700/40 via-slate-800/30 to-slate-900/40 border border-slate-600/20" />
                      {/* Pelvic structure */}
                      <div className="absolute inset-8 rounded-[35%] bg-gradient-to-br from-slate-600/30 to-slate-700/20" />
                      {/* Organs */}
                      <div className="absolute top-1/4 left-1/3 w-12 h-10 md:w-16 md:h-14 rounded-full bg-gradient-to-br from-slate-500/40 to-slate-600/30 border border-[#00D95A]/40" />
                      <div className="absolute top-1/4 right-1/3 w-12 h-10 md:w-16 md:h-14 rounded-full bg-gradient-to-br from-slate-500/40 to-slate-600/30" />
                      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-14 h-12 md:w-20 md:h-16 rounded-[40%] bg-gradient-to-br from-slate-500/30 to-slate-600/20 border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
                      {/* Spine */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-32 md:w-8 md:h-44 rounded-full bg-gradient-to-b from-slate-400/20 via-slate-500/30 to-slate-400/20" />
                      {/* AI annotation highlight */}
                      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-16 h-14 md:w-24 md:h-20 border-2 border-[#00D95A] rounded-lg animate-pulse opacity-70" />
                    </div>
                  </div>
                  
                  {/* Viewport overlays */}
                  <div className="absolute top-3 left-3 text-[10px] text-slate-400 space-y-0.5">
                    <div>Patient: ANON-2024-001</div>
                    <div className="text-slate-500">MR · T2 Weighted</div>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <div className="bg-[#00D95A]/20 border border-[#00D95A]/50 rounded px-2 py-1 text-[10px] text-[#00D95A] font-medium">
                      AI Active
                    </div>
                    <div className="bg-slate-800/80 border border-[#30363d] rounded px-2 py-1 text-[10px] text-slate-300">
                      S: 12/34
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[35%] bg-gradient-to-r from-[#00D95A] to-teal-400 rounded-full" />
                    </div>
                    <div className="text-[10px] text-slate-400">W: 350 L: 40</div>
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] text-slate-500">256 × 256</div>
                </div>
                
                {/* Right sidebar - Labels & Info */}
                <div className="col-span-2 bg-[#161b22] rounded-lg p-3 flex flex-col gap-3 border border-[#30363d]/50">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Annotations</div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Bladder', color: '#00D95A', active: true },
                      { label: 'Uterus', color: '#06b6d4', active: false },
                      { label: 'Rectum', color: '#f59e0b', active: false },
                    ].map((item) => (
                      <div key={item.label} className={`text-[10px] rounded px-2 py-2 flex items-center gap-2 ${item.active ? 'bg-[#00D95A]/10 border border-[#00D95A]/30' : 'bg-[#0d1117] border border-[#30363d]/30'}`}>
                        <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
                        <span className={item.active ? 'text-white' : 'text-slate-400'}>{item.label}</span>
                        {item.active && <span className="ml-auto text-[8px] text-[#00D95A]">●</span>}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-auto">Progress</div>
                  <div className="bg-[#0d1117] rounded-lg p-2 border border-[#30363d]/30">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-[#00D95A] font-medium">67%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-[#00D95A] to-emerald-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 border-y border-white/5 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent">
        <div className="container mx-auto px-6">
          <p className="text-center text-base text-slate-400 mb-10 font-medium">Trusted by Leading Medical Institutions Across Africa</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🏥', name: 'Teaching Hospitals', count: '15+', desc: 'Partner institutions' },
              { icon: '🎓', name: 'Medical Universities', count: '8+', desc: 'Academic partners' },
              { icon: '🔬', name: 'Research Institutes', count: '12+', desc: 'Collaborating centers' },
              { icon: '🏛️', name: 'Health Ministries', count: '5+', desc: 'Government agencies' },
            ].map((partner, i) => (
              <div key={i} className="group bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 hover:border-[#00D95A]/30 rounded-xl p-6 text-center transition-all duration-300">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{partner.icon}</div>
                <div className="text-white font-semibold text-lg mb-1">{partner.name}</div>
                <div className="text-[#00D95A] font-bold text-2xl">{partner.count}</div>
                <div className="text-slate-500 text-xs">{partner.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 relative">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-[#00D95A]/10 via-teal-500/5 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#00D95A] to-teal-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm font-medium text-blue-400 mb-6">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              How It <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Register', desc: 'Create your free account in under 2 minutes', icon: '📝' },
              { step: '02', title: 'Learn', desc: 'Complete interactive training modules at your pace', icon: '📖' },
              { step: '03', title: 'Practice', desc: 'Annotate real medical images with AI assistance', icon: '🎯' },
              { step: '04', title: 'Get Certified', desc: 'Pass assessments and earn your certification', icon: '🏆' },
            ].map((item, i) => (
              <div key={i} className="relative group">
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#00D95A]/50 to-transparent z-0" />
                )}
                <div className="relative bg-slate-800/30 rounded-2xl p-6 border border-white/5 hover:border-[#00D95A]/30 transition-all duration-300 hover:-translate-y-2 z-10">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="text-[#00D95A] text-sm font-bold mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a0f1a] via-slate-900 to-[#0a0f1a]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#00D95A]/10 border border-[#00D95A]/30 rounded-full text-sm font-medium text-[#00D95A] mb-6">
              Platform Features
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              World-Class Training
              <br />
              <span className="bg-gradient-to-r from-[#00D95A] to-teal-400 bg-clip-text text-transparent">Platform</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to succeed in MRI data annotation and medical imaging
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const accentColors = [
                'bg-gradient-to-b from-[#00D95A] to-teal-500',      // 0: Learning Paths - Green
                'bg-gradient-to-b from-amber-400 to-orange-500',    // 1: Timed Assessments - Orange
                'bg-gradient-to-b from-blue-400 to-indigo-500',     // 2: Progress Analytics - Blue
                'bg-gradient-to-b from-cyan-400 to-teal-500',       // 3: DICOM Viewer - Cyan
                'bg-gradient-to-b from-violet-400 to-purple-500',   // 4: AI Tools - Purple
                'bg-gradient-to-b from-rose-400 to-pink-500',       // 5: Certification - Pink
              ];
              
              return (
              <div
                key={index}
                className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/5 hover:border-[#00D95A]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,217,90,0.15)] overflow-hidden ${
                  index === 0 || index === 4 ? 'ring-1 ring-[#00D95A]/20' : ''
                }`}
              >
                {/* Accent bar for all cards */}
                <div className={`absolute top-0 left-0 w-1 h-full ${accentColors[index]}`} />
                
                {/* Popular badge */}
                {index === 4 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    AI-Powered
                  </div>
                )}
                
                {/* Gradient border on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00D95A] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D95A]/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
            Ready to Start Your
            <br />
            <span className="bg-gradient-to-r from-[#00D95A] to-teal-400 bg-clip-text text-transparent">Journey?</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Join Africa&apos;s leading medical imaging training program and become a certified MRI data annotation technician
          </p>
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00D95A] to-[#00B84C] px-12 py-5 text-lg font-bold text-black shadow-[0_0_50px_rgba(0,217,90,0.5)] hover:shadow-[0_0_70px_rgba(0,217,90,0.7)] hover:scale-105 transition-all duration-300"
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#070a10] border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <Image
                src={siteConfig.logo}
                alt={siteConfig.name}
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
              <div>
                <div className="text-white font-bold">{siteConfig.name}</div>
                <div className="text-slate-500 text-sm">
                  © {new Date().getFullYear()} Peakpoint Services
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/terms-and-conditions"
                className="text-sm text-slate-400 hover:text-[#00D95A] transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-slate-400 hover:text-[#00D95A] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/"
                className="text-sm text-slate-400 hover:text-[#00D95A] transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
