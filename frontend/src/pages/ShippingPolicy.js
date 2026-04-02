import React from "react";
import "../styles/PoliciesPage.css";

const ShippingPolicy = () => {
  return (
    <div className="policies-page">
      <div className="policy-header">
        <h1>Shipping Policy</h1>
        <p>Information about our delivery process and shipping options</p>
      </div>

      <div className="policy-content">
        <section className="policy-section">
          <h2>📦 Shipping Methods</h2>
          <p>
            We offer reliable shipping services to ensure your precious Dawaat
            products arrive safely and on time. We partner with trusted
            logistics providers to deliver your orders with care.
          </p>
          <ul>
            <li>
              <strong>Standard Shipping:</strong> Typically 5-7 business days
            </li>
            <li>
              <strong>Express Shipping:</strong> Typically 2-3 business days
              (where available)
            </li>
            <li>
              <strong>Local Pickup:</strong> Available in selected locations
            </li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>⏱️ Processing Time</h2>
          <p>
            All orders are processed and prepared for shipment within 2-3
            business days from the date of purchase. Custom orders may require
            additional time.
          </p>
          <p>
            Once your order ships, you'll receive a tracking number via email so
            you can monitor delivery progress.
          </p>
        </section>

        <section className="policy-section">
          <h2>🌍 Shipping Locations</h2>
          <p>
            We currently ship within Pakistan and internationally. Shipping
            costs and delivery times vary by location.
          </p>
          <p>
            For international orders, additional customs duties or import taxes
            may apply based on your country's regulations. The buyer is
            responsible for these additional costs.
          </p>
        </section>

        <section className="policy-section">
          <h2>📍 Delivery Address</h2>
          <p>
            Please provide an accurate and complete delivery address during
            checkout. We are not responsible for packages delivered to incorrect
            addresses if they were delivered as instructed.
          </p>
          <p>
            If you need to change your address, contact us immediately at{" "}
            <strong>dawaat.pk@gmail.com</strong> within 24 hours of placing your
            order. order.
          </p>
        </section>

        <section className="policy-section">
          <h2>🚚 Delivery Issues</h2>
          <p>
            If your package is lost, damaged, or significantly delayed, please
            contact us with your order number and tracking information. We'll
            investigate and work with our shipping partner to resolve the issue.
          </p>
          <p>
            Claims for lost or damaged packages must be reported within 7 days
            of the expected delivery date.
          </p>
        </section>

        <section className="policy-section">
          <h2>💌 Packaging Care</h2>
          <p>
            All items are carefully packed to ensure they arrive in perfect
            condition. We use eco-friendly materials when possible, maintaining
            our commitment to sustainability.
          </p>
        </section>

        <section className="policy-section">
          <h2>❓ Questions?</h2>
          <p>
            For any shipping-related inquiries, please reach out to us at
            <strong>dawaat.pk@gmail.com</strong>. We're here to help!
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;
