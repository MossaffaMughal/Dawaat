import React from "react";
import "../styles/PoliciesPage.css";

const PrivacyPolicy = () => {
  return (
    <div className="policies-page">
      <div className="policy-header">
        <h1>Privacy Policy</h1>
        <p>How we protect and manage your personal information</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <h2>🔒 Information We Collect</h2>
          <p>
            When you visit our website or place an order, we may collect the
            following information:
          </p>
          <ul>
            <li>Name and contact information (email, phone number)</li>
            <li>Shipping and billing addresses</li>
            <li>Order history and preferences</li>
            <li>Payment information (processed securely)</li>
            <li>Website usage data and cookies</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>📋 How We Use Your Information</h2>
          <p>Your information is used solely to:</p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Communicate with you regarding your purchase</li>
            <li>Improve our website and customer service</li>
            <li>Send promotional emails (only with your consent)</li>
          </ul>
          <p>
            We never sell or share your personal information with third parties
            for marketing purposes without your explicit consent.
          </p>
        </section>

        <section className="policy-section">
          <h2>🛡️ Data Security</h2>
          <p>
            We take data security seriously. Your information is stored securely
            and is only accessible to authorized personnel. We use
            industry-standard encryption and security measures to protect your
            data.
          </p>
          <p>
            Payment processing is handled by secure payment gateways that comply
            with international security standards.
          </p>
        </section>

        <section className="policy-section">
          <h2>🍪 Cookies and Tracking</h2>
          <p>
            Our website uses cookies to enhance your browsing experience. These
            help us remember your preferences and understand how you use our
            site.
          </p>
          <p>
            You can control cookie settings through your browser. However,
            disabling cookies may affect some website functionality.
          </p>
        </section>

        <section className="policy-section">
          <h2>📧 Email Communication</h2>
          <p>
            If you've opted in to receive promotional emails, we may send you
            updates about new products, special offers, and announcements.
          </p>
          <p>
            You can unsubscribe from promotional emails at any time by clicking
            the unsubscribe link in any email or contacting us directly.
          </p>
        </section>

        <section className="policy-section">
          <h2>🌐 Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not
            responsible for their privacy practices. Please review their privacy
            policies before sharing personal information.
          </p>
        </section>

        <section className="policy-section">
          <h2>👤 Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Request corrections to your data</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <strong>dawaat.pk@gmail.com</strong>.
          </p>
        </section>

        <section className="policy-section">
          <h2>🔄 Policy Updates</h2>
          <p>
            We may update this privacy policy periodically. Changes will be
            posted on this page with an updated date. Your continued use of our
            site indicates acceptance of any changes.
          </p>
        </section>

        <section className="policy-section">
          <h2>💬 Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our data
            practices, please reach out to <strong>dawaat.pk@gmail.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
