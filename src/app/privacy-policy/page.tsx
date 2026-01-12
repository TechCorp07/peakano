'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { siteConfig } from '@/config/site';

/**
 * PeakPoint Logo Component
 */
function PeakPointLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src={siteConfig.logo}
      alt={siteConfig.name}
      width={size}
      height={size}
      className="object-contain"
    />
  );
}

/**
 * Highlight Box Component
 */
function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#00FF66]/10 border-l-4 border-[#00FF66] p-4 rounded-r-lg my-4">
      {children}
    </div>
  );
}

/**
 * Section Header Component
 */
function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="text-xl font-semibold text-[#0F172A] mt-8 mb-4 pb-2 border-b-2 border-[#00FF66]">
      {number}. {title}
    </h2>
  );
}

/**
 * Privacy Policy Page
 * Matches MVP design at training.peakpoint.africa/privacy-policy
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Header/Navbar */}
      <header className="py-4 bg-[#0F172A]">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <PeakPointLogo size={40} />
            <span className="text-white text-lg font-semibold">{siteConfig.name}</span>
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
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-[900px]">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-2">
              Privacy Policy
            </h1>
            <div className="w-24 h-1 bg-[#00FF66] mx-auto mb-4"></div>
            <p className="text-slate-500 italic">Last Updated: January 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-12">
            {/* Introduction */}
            <SectionHeader number={1} title="Introduction" />
            <p className="text-slate-600 leading-relaxed mb-4">
              Welcome to the Peakpoint Services MRI Annotation Training and Assessment Platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <HighlightBox>
              <p className="text-[#0F172A] font-medium">
                By using our platform, you consent to the data practices described in this policy. We are committed to protecting your privacy and complying with Zimbabwe&apos;s Postal and Telecommunications Regulatory Authority (POTRAZ) Data Protection Act and GDPR principles.
              </p>
            </HighlightBox>

            {/* Personal Data Collection */}
            <SectionHeader number={2} title="Personal Data Collection" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We collect information that you provide directly to us and information that is automatically collected when you use our platform.
            </p>

            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Information You Provide</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="bg-[#0F172A] text-white">
                    <th className="p-3 text-left">Data Type</th>
                    <th className="p-3 text-left">Information</th>
                    <th className="p-3 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50">
                    <td className="p-3 border-b border-slate-200">Account Information</td>
                    <td className="p-3 border-b border-slate-200">Name, email, username, password</td>
                    <td className="p-3 border-b border-slate-200">Account creation and authentication</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-slate-200">Personal Details</td>
                    <td className="p-3 border-b border-slate-200">Phone number, date of birth, national ID, gender</td>
                    <td className="p-3 border-b border-slate-200">Identity verification and compliance</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 border-b border-slate-200">Location Information</td>
                    <td className="p-3 border-b border-slate-200">Province, city/town</td>
                    <td className="p-3 border-b border-slate-200">Service delivery and regional compliance</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-slate-200">Professional Background</td>
                    <td className="p-3 border-b border-slate-200">Employment status, experience, education, certifications</td>
                    <td className="p-3 border-b border-slate-200">Training customization and eligibility assessment</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Automatically Collected Information</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="bg-[#0F172A] text-white">
                    <th className="p-3 text-left">Data Type</th>
                    <th className="p-3 text-left">Information</th>
                    <th className="p-3 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50">
                    <td className="p-3 border-b border-slate-200">Device Information</td>
                    <td className="p-3 border-b border-slate-200">Browser type, operating system, device identifiers</td>
                    <td className="p-3 border-b border-slate-200">Platform optimization and security</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-slate-200">Usage Data</td>
                    <td className="p-3 border-b border-slate-200">Pages visited, features used, session duration</td>
                    <td className="p-3 border-b border-slate-200">Service improvement and analytics</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 border-b border-slate-200">Proctoring Data</td>
                    <td className="p-3 border-b border-slate-200">Webcam captures, screen recordings during assessments</td>
                    <td className="p-3 border-b border-slate-200">Test integrity and fraud prevention</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Data Usage Purposes */}
            <SectionHeader number={3} title="Data Usage Purposes" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We use the collected information for the following primary purposes:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>To provide, operate, and maintain our training platform</li>
              <li>To process your registration and manage your account</li>
              <li>To conduct proctored assessments and certifications</li>
              <li>To analyze usage patterns and improve our services</li>
              <li>To communicate with you about updates, promotions, and support</li>
              <li>To comply with legal obligations and regulatory requirements</li>
            </ul>

            {/* Data Sharing */}
            <SectionHeader number={4} title="Data Sharing" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li><strong>Service Providers:</strong> Third parties that assist with platform operations, payment processing, and analytics</li>
              <li><strong>Regulatory Authorities:</strong> When required by law or to comply with POTRAZ regulations</li>
              <li><strong>Certification Bodies:</strong> To verify your credentials and certifications</li>
            </ul>
            <HighlightBox>
              <p className="text-[#0F172A] font-medium">
                We do NOT sell your personal data, share your information without your consent (except as required by law), or transfer your data internationally without appropriate safeguards.
              </p>
            </HighlightBox>

            {/* Security Measures */}
            <SectionHeader number={5} title="Security Measures" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We implement comprehensive security measures to protect your data:
            </p>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Technical Safeguards</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>SSL/TLS encryption for all data transmissions</li>
              <li>Encrypted data storage with industry-standard algorithms</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Multi-factor authentication options</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Organizational Measures</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Access controls and role-based permissions</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Proctoring Data Protection</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Webcam images compressed and stored securely</li>
              <li>Automatic deletion after 30 days unless flagged for review</li>
              <li>Limited access to authorized personnel only</li>
            </ul>

            {/* Data Retention */}
            <SectionHeader number={6} title="Data Retention" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We retain your personal data for different periods depending on the type:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li><strong>Account Information:</strong> For the duration of your account plus 2 years after closure</li>
              <li><strong>Assessment Records:</strong> 5 years for certification verification purposes</li>
              <li><strong>Proctoring Data:</strong> 30 days unless flagged for review</li>
              <li><strong>Usage Analytics:</strong> Aggregated and anonymized after 1 year</li>
            </ul>

            {/* User Rights */}
            <SectionHeader number={7} title="Your Rights" />
            <p className="text-slate-600 leading-relaxed mb-4">
              Under POTRAZ Data Protection Act and GDPR principles, you have the following rights:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to certain processing activities</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-slate-600 leading-relaxed">
              To exercise these rights, please contact us using the details provided below. We will respond to access requests within 30 days.
            </p>

            {/* Cookies and Tracking */}
            <SectionHeader number={8} title="Cookies and Tracking" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-slate-600 leading-relaxed">
              You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect platform functionality.
            </p>

            {/* International Transfers */}
            <SectionHeader number={9} title="International Data Transfers" />
            <p className="text-slate-600 leading-relaxed mb-4">
              Your data may be transferred to and processed in countries outside Zimbabwe. When we transfer data internationally, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Standard contractual clauses approved by relevant authorities</li>
              <li>Data processing agreements with service providers</li>
              <li>Compliance with GDPR requirements for EU data subjects</li>
            </ul>

            {/* Children's Privacy */}
            <SectionHeader number={10} title="Children's Privacy" />
            <p className="text-slate-600 leading-relaxed mb-4">
              Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a minor, please contact us immediately.
            </p>

            {/* Breach Notification */}
            <SectionHeader number={11} title="Data Breach Notification" />
            <p className="text-slate-600 leading-relaxed mb-4">
              In the event of a data breach that may affect your personal information:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>We will notify POTRAZ within 72 hours of becoming aware</li>
              <li>Affected users will be notified without undue delay</li>
              <li>We will provide details of the breach and remediation steps</li>
            </ul>

            {/* Policy Updates */}
            <SectionHeader number={12} title="Policy Updates" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. Changes will be communicated through:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Email notifications to registered users</li>
              <li>In-app notifications when you next log in</li>
              <li>Updated &quot;Last Updated&quot; date at the top of this page</li>
            </ul>
            <p className="text-slate-600 leading-relaxed">
              Continued use of our platform after changes constitutes acceptance of the updated policy.
            </p>

            {/* Contact Information */}
            <SectionHeader number={13} title="Contact Information" />
            <p className="text-slate-600 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="bg-slate-50 rounded-lg p-6 mb-4">
              <ul className="text-slate-600 space-y-2">
                <li><strong>Email:</strong> privacy@peakpoint.africa</li>
                <li><strong>Phone:</strong> +263 778 477 608</li>
                <li><strong>Address:</strong> Eastgate Building, Robert Mugabe Road, Harare, Zimbabwe</li>
                <li><strong>Data Protection Officer:</strong> dpo@peakpoint.africa</li>
              </ul>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM Central Africa Time (CAT)
            </p>

            {/* Back Button */}
            <div className="mt-12 text-center">
              <Link
                href={ROUTES.REGISTER}
                className="inline-flex items-center gap-2 bg-[#00FF66] hover:bg-[#00CC52] text-black font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(0,255,102,0.4)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Registration
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[#E6EDF3] text-sm bg-[#0F172A]">
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
