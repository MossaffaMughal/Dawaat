import React from "react";
import "../styles/PoliciesPage.css";

const TermsConditions = () => {
  return (
    <div className="policies-page">
      <div className="policy-header">
        <h1>Terms & Conditions</h1>
        <p>Please read these terms carefully before shopping with us</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <h2>📜 Agreement</h2>
          <p>
            By accessing and using the Dawaat website and placing an order, you
            agree to be bound by these Terms & Conditions. If you do not agree
            with any part of these terms, please do not make a purchase.
          </p>
        </section>

        <section className="policy-section">
          <h2>🛒 Product Information</h2>
          <p>
            We strive to provide accurate descriptions and images of our
            products. However, we do not guarantee that colors, descriptions, or
            other content are entirely accurate, complete, or error-free.
          </p>
          <p>
            Product availability is subject to change. We reserve the right to
            limit quantities and discontinue products at our discretion.
          </p>
        </section>

        <section className="policy-section">
          <h2>💳 Ordering and Payment</h2>
          <p>By placing an order, you represent that:</p>
          <ul>
            <li>You are at least 18 years old</li>
            <li>All information provided is accurate and complete</li>
            <li>You have the right to authorize the payment method used</li>
            <li>You are not purchasing for resale</li>
          </ul>
          <p>We reserve the right to refuse or cancel any order at any time.</p>
        </section>

        <section className="policy-section">
          <h2>💰 Pricing</h2>
          <p>
            All prices are in Pakistani Rupees (PKR) unless otherwise stated.
            Prices are subject to change without notice. The price you pay is
            the price in effect at the time of order confirmation.
          </p>
          <p>
            Additional taxes, duties, or shipping fees may apply based on your
            location.
          </p>
        </section>

        <section className="policy-section">
          <h2>📦 Delivery</h2>
          <p>
            We make reasonable efforts to deliver orders on time. However, we
            are not responsible for delays caused by shipping carriers, customs
            clearance, or events beyond our control.
          </p>
          <p>
            Risk of loss transfers to you upon delivery to the shipping carrier.
            We are not responsible for items lost or damaged during shipping by
            the carrier.
          </p>
        </section>

        <section className="policy-section">
          <h2>🚫 Intellectual Property</h2>
          <p>
            All content on our website, including text, graphics, logos, images,
            and designs, is the property of Dawaat or its content suppliers and
            is protected by international copyright laws.
          </p>
          <p>
            You may not reproduce, distribute, or transmit any content without
            our prior written permission.
          </p>
        </section>

        <section className="policy-section">
          <h2>⚖️ Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Dawaat shall not be liable
            for any indirect, incidental, special, or consequential damages
            arising from your use of our website or products.
          </p>
          <p>
            Our total liability shall not exceed the price of the product
            purchased.
          </p>
        </section>

        <section className="policy-section">
          <h2>🚫 User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Engage in fraudulent or deceptive practices</li>
            <li>
              Use the site in any way that could damage, disable, or impair it
            </li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Harass or abuse other users</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>🔐 Account Security</h2>
          <p>
            If you create an account, you are responsible for maintaining the
            confidentiality of your login information and for all activities
            that occur under your account.
          </p>
          <p>
            You agree to notify us immediately of any unauthorized use of your
            account.
          </p>
        </section>

        <section className="policy-section">
          <h2>🔄 Modifications</h2>
          <p>
            We reserve the right to modify these Terms & Conditions at any time.
            Changes will be effective immediately upon posting to the website.
            Your continued use of our site indicates acceptance of updated
            terms.
          </p>
        </section>

        <section className="policy-section">
          <h2>📋 Governing Law</h2>
          <p>
            These Terms & Conditions are governed by the laws of Pakistan. Any
            disputes shall be resolved through amicable discussion or mediation.
          </p>
        </section>

        <section className="policy-section">
          <h2>💬 Contact Us</h2>
          <p>
            If you have questions about these Terms & Conditions, please contact
            us at our email dawaat.pk@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsConditions;
