import React from "react";
import "../styles/ContactPage.css";

const Contact = () => {
  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Get in Touch</h1>
        <p>We'd love to hear from you.</p>
      </div>

      <div className="contact-content single-column">
        <div className="contact-info-section">
          <h2>Other Ways to Reach Us</h2>

          <div className="info-box">
            <h3>📧 Email</h3>
            <p>
              <a href="mailto:dawaat.pk@gmail.com">dawaat.pk@gmail.com</a>
            </p>
            <p className="small">We'll respond within 24 hours</p>
          </div>

          <div className="info-box">
            <h3>📱 WhatsApp</h3>
            <p>
              <a
                href="https://wa.me/923354023791"
                target="_blank"
                rel="noopener noreferrer"
              >
                +92 335 4023791
              </a>
            </p>
            <p className="small">Chat with us for quick responses</p>
          </div>

          <div className="info-box">
            <h3>📸 Instagram</h3>
            <p>
              <a
                href="https://instagram.com/dawaat.pk"
                target="_blank"
                rel="noopener noreferrer"
              >
                @dawaat.pk
              </a>
            </p>
            <p className="small">Follow for updates and inspiration</p>
          </div>

          <div className="info-box">
            <h3>🤝 Partner with Us</h3>
            <p>Interested in collaborating or wholesale inquiries?</p>
            <p className="small">
              We'd love to work with fellow creators! Reach out on WhatsApp at{" "}
              <a
                href="https://wa.me/923354023791"
                target="_blank"
                rel="noopener noreferrer"
              >
                +92 335 4023791
              </a>
              .
            </p>
          </div>

          <div className="info-box">
            <h3>💝 Feedback</h3>
            <p>
              Your feedback helps us improve! Share your thoughts, suggestions,
              or just say hello.
            </p>
            <p className="small">
              Email us at{" "}
              <a href="mailto:dawaat.pk@gmail.com">dawaat.pk@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
