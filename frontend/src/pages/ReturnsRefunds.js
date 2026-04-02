import React from "react";
import "../styles/PoliciesPage.css";

const ReturnsRefunds = () => {
  return (
    <div className="policies-page">
      <div className="policy-header">
        <h1>Returns & Refunds Policy</h1>
        <p>Our commitment to your satisfaction</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <h2>✨ Our Satisfaction Promise</h2>
          <p>
            At Dawaat, we stand behind the quality of our products. If you're
            not completely satisfied with your purchase, we're here to help.
            Your happiness is our priority!
          </p>
        </section>

        <section className="policy-section">
          <h2>⏰ Return Window</h2>
          <p>
            You have <strong>30 days from the date of delivery</strong> to
            initiate a return or exchange.
          </p>
          <p>
            Items must be returned in original, unworn condition with all
            original packaging and materials.
          </p>
        </section>

        <section className="policy-section">
          <h2>🔄 Return Process</h2>
          <p>To initiate a return:</p>
          <ol>
            <li>
              Contact us at <strong>dawaat.pk@gmail.com</strong> with your order
              number
            </li>
            <li>Provide details about why you'd like to return the item</li>
            <li>Receive return shipping instructions</li>
            <li>Ship the item back to us in its original condition</li>
            <li>
              Once received and inspected, we'll process your refund or exchange
            </li>
          </ol>
        </section>

        <section className="policy-section">
          <h2>💰 Refund Amount</h2>
          <p>
            Upon approved returns, you'll receive a refund of the product price
            minus the original shipping cost. Return shipping is the
            responsibility of the customer unless the return is due to our
            error.
          </p>
          <p>
            Refunds are typically processed within 7-10 business days after we
            receive and inspect your returned item.
          </p>
        </section>

        <section className="policy-section">
          <h2>❌ Non-Returnable Items</h2>
          <p>The following items cannot be returned:</p>
          <ul>
            <li>Items with visible signs of use or damage</li>
            <li>Personalized or customized products</li>
            <li>Items without original packaging</li>
            <li>Items outside the 30-day return window</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>🔄 Exchanges</h2>
          <p>
            If you'd like to exchange your item for a different size, color, or
            product, we're happy to help! Contact us with your request, and
            we'll guide you through the exchange process.
          </p>
          <p>
            If the new item is a different price, you'll pay the difference (or
            receive a refund) accordingly.
          </p>
        </section>

        <section className="policy-section">
          <h2>🚫 Damaged or Defective Items</h2>
          <p>
            If you receive a damaged or defective item, please contact us
            immediately with photos of the damage. We'll replace or refund your
            item at no cost to you, including return shipping.
          </p>
          <p>
            Report damage within <strong>7 days of delivery</strong> for
            expedited resolution.
          </p>
        </section>

        <section className="policy-section">
          <h2>❓ Questions About Returns?</h2>
          <p>
            We're here to help! Email us at <strong>dawaat.pk@gmail.com</strong>{" "}
            with with any questions or concerns about our returns policy.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ReturnsRefunds;
