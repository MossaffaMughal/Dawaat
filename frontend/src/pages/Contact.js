import React, { useState } from "react";
import apiClient from "../utils/apiClient";
import "../styles/ContactPage.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await apiClient.post("/contact", formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("Contact error:", err);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Get in Touch</h1>
        <p>We'd love to hear from you! Send us a message anytime.</p>
      </div>

      <div className="contact-content">
        <div className="contact-form-section">
          <h2>Send us a Message</h2>
          {submitted && (
            <div className="success-message">
              ✓ Thank you for reaching out! We'll get back to you soon.
            </div>
          )}
          {error && <div className="error-message">❌ {error}</div>}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="How can we help?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Tell us more..."
                rows="6"
              />
            </div>

            <button type="submit" className="submit-btn">
              Send Message
            </button>
          </form>
        </div>

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
            <h3>💬 Questions & Support</h3>
            <p>Have a question about your order or products?</p>
            <p className="small">
              Check our FAQ section or drop us a message using the form above.
            </p>
          </div>

          <div className="info-box">
            <h3>🤝 Partner with Us</h3>
            <p>Interested in collaborating or wholesale inquiries?</p>
            <p className="small">
              We'd love to work with fellow creators! Reach out with details.
            </p>
          </div>

          <div className="info-box">
            <h3>💝 Feedback</h3>
            <p>
              Your feedback helps us improve! Share your thoughts, suggestions,
              or just say hello.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
