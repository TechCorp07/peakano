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
 * Terms and Conditions Page
 * Matches MVP design at training.peakpoint.africa/terms-and-conditions
 */
export default function TermsAndConditionsPage() {
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
              Terms and Conditions
            </h1>
            <div className="w-24 h-1 bg-[#00FF66] mx-auto mb-4"></div>
            <p className="text-slate-500 italic">Last Updated: January 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-12">
            {/* Introduction and Acceptance */}
            <SectionHeader number={1} title="Introduction and Acceptance" />
            <p className="text-slate-600 leading-relaxed mb-4">
              Welcome to the Peakpoint Services MRI Annotation Training and Assessment Platform. These Terms and Conditions (&quot;Terms&quot;) govern your use of our platform, services, and any related applications.
            </p>
            <HighlightBox>
              <p className="text-[#0F172A] font-medium">
                By accessing or using our platform, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the platform. These Terms apply to all users, including trainees, instructors, and administrators.
              </p>
            </HighlightBox>

            {/* Eligibility and Account Registration */}
            <SectionHeader number={2} title="Eligibility and Account Registration" />
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Eligibility Requirements</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>You must be at least 18 years of age</li>
              <li>You must have the legal capacity to enter into binding agreements</li>
              <li>You must provide accurate and complete registration information</li>
              <li>You must not have been previously suspended or removed from the platform</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Account Obligations</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>You are responsible for all activities under your account</li>
              <li>Account verification may be required for certain platform features</li>
            </ul>

            {/* Platform Use and Conduct */}
            <SectionHeader number={3} title="Platform Use and Conduct" />
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Permitted Use</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              You may use our platform for legitimate educational and training purposes, including:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Completing MRI annotation training modules</li>
              <li>Participating in assessments and certifications</li>
              <li>Accessing educational materials and resources</li>
              <li>Communicating with instructors and support staff</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Prohibited Conduct</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Share your account credentials with others</li>
              <li>Attempt to circumvent proctoring or security measures</li>
              <li>Copy, distribute, or share assessment content</li>
              <li>Use automated tools, bots, or scripts on the platform</li>
              <li>Impersonate another person or misrepresent your identity</li>
              <li>Engage in any form of cheating or academic dishonesty</li>
              <li>Upload malicious code or interfere with platform operations</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Use the platform for any illegal purposes</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>

            {/* Assessments and Testing */}
            <SectionHeader number={4} title="Assessments and Testing" />
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Proctoring Measures</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Our assessments employ various proctoring technologies to ensure test integrity:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Webcam and screen capture technology</li>
              <li>Browser lockdown during assessments</li>
              <li>Identity verification procedures</li>
              <li>Plagiarism and similarity detection</li>
            </ul>
            <HighlightBox>
              <p className="text-[#0F172A] font-medium">
                By participating in proctored assessments, you consent to webcam monitoring, screen recording, and browser restrictions during the test period. Violations will result in immediate test termination and may lead to account suspension or permanent ban.
              </p>
            </HighlightBox>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Test Conditions</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Assessments must be completed within the specified time limits</li>
              <li>You must have a stable internet connection and functioning webcam</li>
              <li>You must be in a quiet, well-lit environment</li>
              <li>No external assistance or reference materials unless explicitly permitted</li>
            </ul>

            {/* Intellectual Property Rights */}
            <SectionHeader number={5} title="Intellectual Property Rights" />
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Our Content</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              All content on the platform, including but not limited to training materials, assessments, images, videos, and software, is owned by Peakpoint Services or its licensors. You are granted a limited, non-exclusive, non-transferable license to access and use this content for personal educational purposes only.
            </p>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Your Content</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              By submitting content to the platform (such as annotations or feedback), you grant us a worldwide, royalty-free license to use, reproduce, and display such content for platform operations, quality improvement, and training purposes.
            </p>

            {/* Data Protection and Privacy */}
            <SectionHeader number={6} title="Data Protection and Privacy" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We are committed to protecting your personal data in accordance with:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Zimbabwe&apos;s Postal and Telecommunications Regulatory Authority (POTRAZ) Data Protection Act</li>
              <li>General Data Protection Regulation (GDPR) principles</li>
              <li>Industry-standard security practices</li>
            </ul>
            <p className="text-slate-600 leading-relaxed">
              For detailed information about how we collect, use, and protect your data, please refer to our{' '}
              <Link href="/privacy-policy" className="text-[#00CC52] hover:text-[#00AA44] font-medium">
                Privacy Policy
              </Link>.
            </p>

            {/* Fees, Payment, and Refunds */}
            <SectionHeader number={7} title="Fees, Payment, and Refunds" />
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Payment Terms</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>All fees are displayed in the applicable currency at the time of purchase</li>
              <li>Payment must be made in full before accessing paid content</li>
              <li>We accept major credit cards and approved payment methods</li>
              <li>All transactions are processed securely</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Refund Policy</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Refunds may be issued under the following conditions:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Technical failures preventing test completion (verified by our support team)</li>
              <li>Platform errors affecting your assessment results</li>
              <li>Duplicate payments or billing errors</li>
            </ul>
            <HighlightBox>
              <p className="text-[#0F172A] font-medium">
                Refunds are NOT available for completed tests (regardless of outcome), change of mind after purchase, or poor performance on assessments.
              </p>
            </HighlightBox>

            {/* Disclaimers and Limitations */}
            <SectionHeader number={8} title="Disclaimers and Limitations" />
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Platform Availability</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              The platform is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Uninterrupted or error-free service</li>
              <li>That defects will be corrected</li>
              <li>That the platform is free of viruses or harmful components</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">No Employment Guarantee</h3>
            <HighlightBox>
              <p className="text-[#0F172A] font-medium">
                Completion of our training program or certifications provides NO guarantee of employment as an MRI technician, professional licensure, or job placement. We make no representations regarding employment outcomes.
              </p>
            </HighlightBox>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Limitation of Liability</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              To the maximum extent permitted by law, Peakpoint Services shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount you paid for the specific service giving rise to the claim.
            </p>

            {/* Account Suspension and Termination */}
            <SectionHeader number={9} title="Account Suspension and Termination" />
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Suspension Triggers</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              We may suspend or terminate your account if:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>You violate these Terms and Conditions</li>
              <li>We detect fraudulent or suspicious activity</li>
              <li>You engage in cheating or academic dishonesty</li>
              <li>You fail to pay applicable fees</li>
              <li>Required by law or regulatory authority</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-6 mb-3">Termination Effects</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Immediate loss of access to the platform</li>
              <li>Forfeiture of any incomplete certifications</li>
              <li>No refund of fees paid</li>
              <li>Retention of your data as required by law or our data retention policy</li>
            </ul>

            {/* Governing Law and Dispute Resolution */}
            <SectionHeader number={10} title="Governing Law and Dispute Resolution" />
            <p className="text-slate-600 leading-relaxed mb-4">
              These Terms are governed by and construed in accordance with the laws of Zimbabwe. Any disputes arising from these Terms or your use of the platform shall be:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>First, attempted to be resolved through good-faith negotiation</li>
              <li>If negotiation fails, submitted to mediation</li>
              <li>If mediation fails, resolved through the courts of Zimbabwe</li>
            </ul>

            {/* Modifications to Terms */}
            <SectionHeader number={11} title="Modifications to Terms" />
            <p className="text-slate-600 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. Changes will be communicated through:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Email notifications to registered users</li>
              <li>In-app notifications when you next log in</li>
              <li>Updated &quot;Last Updated&quot; date at the top of this page</li>
            </ul>
            <p className="text-slate-600 leading-relaxed">
              Continued use of the platform after changes constitutes acceptance of the modified Terms.
            </p>

            {/* General Provisions */}
            <SectionHeader number={12} title="General Provisions" />
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li><strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</li>
              <li><strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.</li>
              <li><strong>Entire Agreement:</strong> These Terms, along with our Privacy Policy, constitute the entire agreement between you and Peakpoint Services.</li>
              <li><strong>Force Majeure:</strong> We shall not be liable for any failure to perform due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, or government actions.</li>
              <li><strong>Assignment:</strong> You may not assign or transfer your rights under these Terms without our prior written consent.</li>
            </ul>

            {/* Contact Information */}
            <SectionHeader number={13} title="Contact Information" />
            <p className="text-slate-600 leading-relaxed mb-4">
              If you have questions about these Terms and Conditions, please contact us:
            </p>
            <div className="bg-slate-50 rounded-lg p-6 mb-4">
              <ul className="text-slate-600 space-y-2">
                <li><strong>Email:</strong> legal@peakpoint.africa</li>
                <li><strong>Phone:</strong> +263 778 477 608</li>
                <li><strong>Address:</strong> Eastgate Building, Robert Mugabe Road, Harare, Zimbabwe</li>
                <li><strong>Data Protection Officer:</strong> dpo@peakpoint.africa</li>
                <li><strong>Compliance:</strong> compliance@peakpoint.africa</li>
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
