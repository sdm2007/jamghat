import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, Cookie, Database, Info, ExternalLink } from 'lucide-react';

export const LEGAL_TABS = {
  PRIVACY: 'privacy',
  TERMS: 'terms',
  COOKIES: 'cookies',
  DATA: 'data',
  ABOUT: 'about'
};

export function LegalModal({ initialTab = LEGAL_TABS.PRIVACY, onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="modal-backdrop legal-modal-backdrop" onClick={onClose}>
      <div className="legal-modal-container" onClick={e => e.stopPropagation()}>
        <div className="legal-modal-header">
          <div className="legal-header-titles">
            <span className="eyebrow">JAMGHAT COMPLIANCE & LEGAL</span>
            <h2>Documentation & Policies</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close legal view">
            ✕
          </button>
        </div>

        <div className="legal-modal-nav">
          <button
            className={`legal-tab-btn ${activeTab === LEGAL_TABS.PRIVACY ? 'active' : ''}`}
            onClick={() => setActiveTab(LEGAL_TABS.PRIVACY)}
          >
            <Shield size={15} /> Privacy Policy
          </button>
          <button
            className={`legal-tab-btn ${activeTab === LEGAL_TABS.TERMS ? 'active' : ''}`}
            onClick={() => setActiveTab(LEGAL_TABS.TERMS)}
          >
            <FileText size={15} /> Terms & Conditions
          </button>
          <button
            className={`legal-tab-btn ${activeTab === LEGAL_TABS.COOKIES ? 'active' : ''}`}
            onClick={() => setActiveTab(LEGAL_TABS.COOKIES)}
          >
            <Cookie size={15} /> Cookie Policy
          </button>
          <button
            className={`legal-tab-btn ${activeTab === LEGAL_TABS.DATA ? 'active' : ''}`}
            onClick={() => setActiveTab(LEGAL_TABS.DATA)}
          >
            <Database size={15} /> User Data Policy
          </button>
          <button
            className={`legal-tab-btn ${activeTab === LEGAL_TABS.ABOUT ? 'active' : ''}`}
            onClick={() => setActiveTab(LEGAL_TABS.ABOUT)}
          >
            <Info size={15} /> About Us
          </button>
        </div>

        <div className="legal-modal-body">
          {activeTab === LEGAL_TABS.PRIVACY && <PrivacyPolicyContent />}
          {activeTab === LEGAL_TABS.TERMS && <TermsContent />}
          {activeTab === LEGAL_TABS.COOKIES && <CookiePolicyContent />}
          {activeTab === LEGAL_TABS.DATA && <UserDataPolicyContent />}
          {activeTab === LEGAL_TABS.ABOUT && <AboutUsContent />}
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <article className="legal-article">
      <h1>Privacy Policy — Jamghat</h1>
      <p className="legal-meta">Effective Date: 28 October 2026 | Last Updated: 28 October 2026</p>

      <section>
        <h3>1. About This Policy</h3>
        <p>Jamghat is a local business discovery platform that helps people discover shops and services, compare listed prices, view business hours, and contact local businesses.</p>
        <p>This Privacy Policy explains how Jamghat collects, uses, stores, shares, and protects personal data when users visit or use our website.</p>
        <p>We aim to handle personal data in accordance with applicable Indian law, including the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Digital Personal Data Protection Rules, 2025, as and when their relevant provisions apply.</p>
      </section>

      <section>
        <h3>2. Information We Collect</h3>
        <h4>A. Information from Visitors</h4>
        <ul>
          <li>Basic technical information, such as IP address, browser type, device information, and server logs, where collected.</li>
          <li>Location information only when a location-related feature requests or uses it.</li>
          <li>Cookie and preference information, according to the site's actual cookie configuration.</li>
        </ul>
        <p>Visitors can browse public business listings without creating an account.</p>

        <h4>B. Business Owner Information</h4>
        <p>When a business owner registers or manages a listing, we may collect:</p>
        <ul>
          <li>Name and email address.</li>
          <li>Login credentials and authentication information.</li>
          <li>Business name, address, opening hours, and contact details.</li>
          <li>Products or services, stock details, and listed prices.</li>
          <li>Business photographs and other information submitted for the listing.</li>
        </ul>
        <p>Business owners must provide accurate information and should only submit information they are authorised to publish.</p>

        <h4>C. Information Collected Automatically</h4>
        <p>We may process technical logs, security events, session information, and error reports to operate the website, maintain security, and troubleshoot issues. We do not claim to collect analytics, advertising profiles, or precise location data unless the relevant functionality is actually enabled.</p>
      </section>

      <section>
        <h3>3. How We Use Personal Data</h3>
        <ul>
          <li>Display and maintain business listings.</li>
          <li>Allow business owners to register, verify their email, sign in, and manage listings.</li>
          <li>Show business hours, products, services, and prices.</li>
          <li>Enable visitors to contact listed businesses.</li>
          <li>Compare prices for matching listed products.</li>
          <li>Maintain sessions and prevent unauthorised access.</li>
          <li>Respond to support requests and complaints.</li>
          <li>Meet applicable legal obligations.</li>
        </ul>
        <p>We will not use personal data for unrelated purposes without an appropriate lawful basis.</p>
      </section>

      <section>
        <h3>4. Public Business Information</h3>
        <p>Business listings may be visible to anyone visiting Jamghat. Information such as a business name, address, contact details, hours, prices, and uploaded business photographs may be publicly accessible.</p>
        <p>Business owners should not submit personal or confidential information that they do not intend to make public. Public visibility of a business listing does not mean that private account credentials or authentication tokens are public.</p>
      </section>

      <section>
        <h3>5. Cookies and Session Management</h3>
        <p>Jamghat uses an HTTP-only session cookie for authentication. This cookie helps maintain a business owner's login session. Essential cookies may be used for security and core website functions. Optional analytics or advertising cookies should only be activated if those technologies are implemented and the required consent has been obtained.</p>
      </section>

      <section>
        <h3>6. Third-Party Services</h3>
        <p>Jamghat's infrastructure may involve:</p>
        <ul>
          <li>Supabase/PostgreSQL for database and storage services.</li>
          <li>An email service provider for business-owner email verification.</li>
          <li>Hosting and infrastructure providers (e.g., Render).</li>
          <li>Google Maps, if the optional map integration is enabled.</li>
        </ul>
        <p>Public business photographs may be accessible through public image URLs. We do not publish database passwords, authentication secrets, or private account credentials.</p>
      </section>

      <section>
        <h3>7. Sharing of Personal Data</h3>
        <p>We may share relevant information with service providers supporting website operations, where legally permitted or required, or where necessary to respond to valid legal requests. Any sharing must be consistent with applicable law and the purposes described in this policy.</p>
      </section>

      <section>
        <h3>8. Data Retention</h3>
        <p>We retain personal data only for as long as reasonably necessary for the stated purposes or as required by applicable law. When information is no longer required, it should be deleted or anonymised where appropriate and legally permitted.</p>
      </section>

      <section>
        <h3>9. Security</h3>
        <p>We use appropriate technical and organisational measures to protect personal data against unauthorised access, disclosure, alteration, loss, or misuse, including access controls, secure server-side credential handling, protected environment secrets, and monitoring. No internet service can guarantee absolute security.</p>
      </section>

      <section>
        <h3>10. Your Privacy Rights</h3>
        <p>Subject to applicable law, you may request information, correction, or erasure of personal data, withdraw consent, or raise a grievance regarding your personal data.</p>
      </section>

      <section>
        <h3>11. Children's Data</h3>
        <p>Jamghat is not intended to encourage children to disclose unnecessary personal information. Where applicable law requires verifiable parental consent or other safeguards, we will implement the relevant requirements before processing.</p>
      </section>

      <section>
        <h3>12. Personal Data Breaches</h3>
        <p>If a personal data breach occurs, Jamghat will take appropriate steps to investigate, contain, and address it and provide notifications to affected individuals and authorities where required by applicable law.</p>
      </section>

      <section>
        <h3>13. Contact and Grievances</h3>
        <div className="legal-contact-card">
          <p><strong>Platform:</strong> Jamghat</p>
          <p><strong>Website:</strong> <a href="https://jamghat.thesrock.in/" target="_blank" rel="noreferrer">https://jamghat.thesrock.in/</a></p>
          <p><strong>Privacy Contact:</strong> contact@thesrock.in</p>
          <p><strong>Grievance Officer:</strong> Grievance Redressal Team, Jamghat</p>
        </div>
      </section>
    </article>
  );
}

function TermsContent() {
  return (
    <article className="legal-article">
      <h1>Terms and Conditions — Jamghat</h1>
      <p className="legal-meta">Effective Date: 28 October 2026 | Last Updated: 28 October 2026</p>

      <section>
        <h3>1. Introduction</h3>
        <p>Welcome to Jamghat. These Terms and Conditions govern your access to and use of the Jamghat website at <a href="https://jamghat.thesrock.in/">https://jamghat.thesrock.in/</a>. By accessing or using Jamghat, you agree to comply with these Terms.</p>
      </section>

      <section>
        <h3>2. About Jamghat</h3>
        <p>Jamghat provides a platform for discovering local businesses and their publicly displayed information. Unless expressly stated otherwise, Jamghat acts as a business discovery and information platform. A business listing does not mean that Jamghat owns, operates, endorses, or directly sells the listed products or services.</p>
      </section>

      <section>
        <h3>3. Eligibility and User Accounts</h3>
        <p>Visitors may browse publicly available listings without registering. Business owners who create accounts must provide accurate information, use a valid email address, keep login credentials confidential, and notify the platform of any unauthorised access.</p>
      </section>

      <section>
        <h3>4. Business Listings and Information</h3>
        <p>Business owners are responsible for ensuring that their submitted information is accurate, lawful, and up to date. Prices and availability may change without notice. Users should confirm important details directly with the relevant business before making a purchase or visiting.</p>
      </section>

      <section>
        <h3>5. Price Comparisons</h3>
        <p>Price comparisons are provided for informational purposes. Differences in product quality, brand, condition, or taxes may affect comparability. Jamghat does not guarantee that every listed price is the lowest or current at the moment of purchase.</p>
      </section>

      <section>
        <h3>6. Relationship with Local Businesses</h3>
        <p>Any purchase, booking, payment, delivery, or warranty is strictly between the user and the relevant business. The business is responsible for fulfilling orders and consumer obligations.</p>
      </section>

      <section>
        <h3>7. Acceptable Use</h3>
        <p>You agree not to submit false or misleading information, impersonate individuals or businesses, upload infringing content, attempt unauthorised system access, or use automated scraping without authorisation.</p>
      </section>

      <section>
        <h3>8. User-Submitted Content</h3>
        <p>Users and business owners retain rights to their submitted content, granting Jamghat a non-exclusive licence to host and display it to operate the platform.</p>
      </section>

      <section>
        <h3>9. Governing Law</h3>
        <p>These Terms are governed by the laws of India. Disputes will be handled by the competent courts or consumer forums having jurisdiction.</p>
      </section>

      <section>
        <h3>10. Contact Details</h3>
        <div className="legal-contact-card">
          <p><strong>Platform:</strong> Jamghat</p>
          <p><strong>Website:</strong> https://jamghat.thesrock.in/</p>
          <p><strong>Email:</strong> contact@thesrock.in</p>
        </div>
      </section>
    </article>
  );
}

function CookiePolicyContent() {
  return (
    <article className="legal-article">
      <h1>Cookie Policy — Jamghat</h1>
      <p className="legal-meta">Effective Date: 28 October 2026</p>

      <section>
        <h3>1. What Are Cookies?</h3>
        <p>Cookies and browser local storage are small data files stored on your device that help maintain sessions, remember user preferences, and protect accounts.</p>
      </section>

      <section>
        <h3>2. Cookies Used by Jamghat</h3>
        <ul>
          <li><strong>Essential Cookies / Storage:</strong> Required for secure sign-in (<code>jg_session</code> HTTP-only cookie), theme choices (<code>mh-theme</code>), and language selections (<code>mh-lang</code>).</li>
          <li><strong>Preference Cookies / Storage:</strong> Used to save chosen map coordinates (<code>mh-location</code>) and store cookie consent choices (<code>mh-cookie-consent</code>).</li>
          <li><strong>Analytics & Marketing:</strong> Jamghat currently does not deploy non-consensual tracking or third-party ad profiling cookies.</li>
        </ul>
      </section>

      <section>
        <h3>3. Managing Cookie Choices</h3>
        <p>You can adjust your cookie preferences at any time using the Cookie Settings trigger in the site footer or through your web browser controls.</p>
      </section>
    </article>
  );
}

function UserDataPolicyContent() {
  return (
    <article className="legal-article">
      <h1>User Data Policy — Jamghat</h1>
      <p className="legal-meta">Effective Date: 28 October 2026 | Last Updated: 28 October 2026</p>

      <section>
        <h3>1. Introduction & Regulatory Alignment</h3>
        <p>Jamghat adheres to fair information practices under the Digital Personal Data Protection Act, 2023 (DPDP Act) and the DPDP Rules, 2025.</p>
      </section>

      <section>
        <h3>2. Purpose Limitation</h3>
        <p>We process personal information strictly to operate local listings, facilitate user-to-business discovery, verify genuine business ownership, and ensure platform security.</p>
      </section>

      <section>
        <h3>3. Data Erasure</h3>
        <p>Business owners may permanently delete their listing and account via the Dashboard at any time. Once initiated, all associated catalog items, database mappings, and photos are permanently purged.</p>
      </section>
    </article>
  );
}

function AboutUsContent() {
  return (
    <article className="legal-article">
      <h1>About Us — Jamghat</h1>
      <p className="legal-meta" style={{ color: 'var(--brand)', fontWeight: 700 }}>
        Discover Local. Compare Smartly. Support Local Businesses.
      </p>

      <section>
        <p>Jamghat is a hyperlocal business discovery platform created to make finding shops, products, and services simpler for everyone in the neighbourhood.</p>
        <p>We believe that local businesses are the heartbeat of every community. Finding the right shop, checking live availability, and verifying opening hours can be frustrating. Jamghat brings this verified local data onto one screen.</p>
      </section>

      <section>
        <h3>Why Jamghat?</h3>
        <ul>
          <li><strong>Easy Discovery:</strong> Find neighborhood shops and home service providers.</li>
          <li><strong>Price Transparency:</strong> Benchmark listed product prices across multiple local sellers.</li>
          <li><strong>Digital Visibility:</strong> Provide independent storefronts with an online catalog and photo gallery.</li>
          <li><strong>Community Support:</strong> Empower local trade without complex commission markups.</li>
        </ul>
      </section>

      <section>
        <h3>Project Information</h3>
        <div className="legal-contact-card">
          <p><strong>Platform:</strong> Jamghat</p>
          <p><strong>Website:</strong> <a href="https://jamghat.thesrock.in/" target="_blank" rel="noreferrer">https://jamghat.thesrock.in/</a></p>
          <p><strong>Open Source:</strong> <a href="https://github.com/sdm2007/jamghat" target="_blank" rel="noreferrer">github.com/sdm2007/jamghat <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></a></p>
        </div>
      </section>
    </article>
  );
}