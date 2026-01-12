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
      title: 'Comprehensive Training',
      description: 'Structured curriculum covering MRI/CT scan anatomy fundamentals to advanced annotation techniques with real medical imaging datasets',
    },
    {
      icon: '⏱️',
      title: 'Timed Assessments',
      description: 'Practice with real-world timed tests to build confidence and improve your annotation speed with automatic proctoring',
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'Monitor your performance with detailed analytics, percentile rankings, and personalized feedback on skill gaps',
    },
    {
      icon: '🔬',
      title: 'DICOM Viewer',
      description: 'Interactive medical imaging viewer with pan, zoom, and window/level controls for realistic annotation practice',
    },
    {
      icon: '🎯',
      title: '4-Stage Testing',
      description: 'Progressive assessment from cognitive ability through detail orientation, trainability, and final validation',
    },
    {
      icon: '🔒',
      title: 'Secure & Fair',
      description: 'Automated proctoring with plagiarism detection ensures test integrity and fair evaluation for all candidates',
    },
  ];

  const stats = [
    { value: '1000+', label: 'Students Trained' },
    { value: '4', label: 'Modules Covered' },
    { value: '100%', label: 'Online Certification' },
    { value: '24/7', label: 'Expert Support' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold">
            <Image
              src={siteConfig.logo}
              alt={siteConfig.name}
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <span className="text-white">{siteConfig.name}</span>
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href={ROUTES.DASHBOARD}
                className="inline-flex items-center justify-center rounded-full bg-[#00D95A] px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(0,217,90,0.4)] hover:bg-[#00C04D] transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="inline-flex items-center justify-center rounded-full bg-[#00D95A] px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(0,217,90,0.4)] hover:bg-[#00C04D] transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src={siteConfig.logo}
              alt={siteConfig.name}
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            <span className="text-[#00D95A]">{siteConfig.name}</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Africa's Premier Medical Imaging Training & Assessment System
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                href={ROUTES.DASHBOARD}
                className="inline-flex items-center justify-center rounded-full bg-[#00D95A] px-8 py-3.5 text-base font-semibold text-black shadow-[0_0_30px_rgba(0,217,90,0.5)] hover:bg-[#00C04D] transition-all"
              >
                Continue Learning
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.REGISTER}
                  className="inline-flex items-center justify-center rounded-full bg-[#00D95A] px-8 py-3.5 text-base font-semibold text-black shadow-[0_0_30px_rgba(0,217,90,0.5)] hover:bg-[#00C04D] transition-all"
                >
                  Get Started
                </Link>
                <Link
                  href={ROUTES.LOGIN}
                  className="inline-flex items-center justify-center rounded-full border-2 border-[#00D95A] px-8 py-3.5 text-base font-semibold text-white hover:bg-[#00D95A]/10 transition-all"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#00D95A] mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
            World-Class Training Platform
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-12">
            Everything you need to succeed in MRI data annotation and medical imaging
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0F172A]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Join Africa's leading medical imaging training program and become a certified MRI data annotation technician
          </p>
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center justify-center rounded-full bg-[#00D95A] px-10 py-4 text-base font-semibold text-black shadow-[0_0_30px_rgba(0,217,90,0.5)] hover:bg-[#00C04D] transition-all"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0F172A]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Peakpoint Services - {siteConfig.name}
              <br className="md:hidden" />
              <span className="hidden md:inline"> · </span>
              Medical Imaging Annotation Tool
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/terms-and-conditions"
                className="text-sm text-[#00D95A] hover:text-[#00C04D] transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-[#00D95A] hover:text-[#00C04D] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/"
                className="text-sm text-[#00D95A] hover:text-[#00C04D] transition-colors"
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
