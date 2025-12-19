'use client';

import Link from 'next/link';
import { ROUTES } from '@/config/routes';

/**
 * PeakPoint Logo Component
 */
function PeakPointLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-lg flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #00FF66 0%, #00CC52 100%)'
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size * 0.5, height: size * 0.5 }}
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    </div>
  );
}

/**
 * Auth Layout
 * Provides centered layout for authentication pages
 * Matches MVP design at training.peakpoint.africa
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className=" min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Header/Navbar */}
      <header className="mb-40 py-4 bg-[#0F172A]">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <PeakPointLogo size={40} />
            <span className="text-white text-lg font-semibold">Peakpoint Services</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={ROUTES.LOGIN}
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Login
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex items-center justify-center rounded-full bg-[#00FF66] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#00CC52] transition-all"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-40 py-4 text-center text-[#E6EDF3] text-sm bg-[#0F172A]">
        © 2025 Peakpoint Services. All rights reserved.
        <br />
        African Medical Annotation Training & Assessment
        <br />
        <div className="py-6 flex items-center justify-center gap-6 mt-2">
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
      </footer>
    </div>
  );
}
