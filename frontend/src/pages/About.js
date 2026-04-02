import React from "react";
import "../styles/About.css";

const About = () => {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>دوات - Dawaat</h1>
        <p>Where words meet warmth, and creativity flows!</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Welcome to Our Tribe</h2>
          <p>
            We're a tiny haven for writers, journalers, and dreamers like you.
            =) At Dawaat, we brew love and care into every order, crafting cute
            and quirky products that spark joy and inspire imagination.
          </p>
          <p>
            Dawaat was born from a passion for quality stationery and the belief
            that everyday items can be extraordinary. We create premium journals
            and bookmarks that inspire creativity and help people express their
            individuality.
          </p>
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <ul className="offerings-list">
            <li>
              <strong>Customised notebooks and journals</strong> waiting for
              your stories
            </li>
            <li>
              <strong>Bookmarks</strong> to hold your place, and your heart
            </li>
            <li>
              Beautifully crafted A5 journals with smooth-finish, yellow pages
            </li>
            <li>
              Spiral bound designs for effortless writing and page-turning
            </li>
            <li>Premium 100gsm paper with 70 pages (140 sides)</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            To celebrate the beauty of putting pen to paper. We believe in the
            power of handwritten words and provide a space where storytellers,
            poets, and scribblers can capture their thoughts, dreams, and
            inspirations. Each product is a thoughtful blend of form and
            function, designed to be your perfect companion for daily musings,
            poetry, journaling, and life's precious moments.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Values</h2>
          <ul className="values-list">
            <li>
              <strong>Love & Care:</strong> Brewed into every order with
              attention to detail
            </li>
            <li>
              <strong>Creativity:</strong> Unique, quirky designs that spark joy
              and inspire imagination
            </li>
            <li>
              <strong>Quality:</strong> Premium materials and thoughtful
              craftsmanship
            </li>
            <li>
              <strong>Community:</strong> Building a tribe of storytellers,
              poets, and dreamers
            </li>
          </ul>
        </section>

        <section className="about-section cta-section">
          <h2>Join Our Tribe & Get in Touch</h2>
          <p>
            Explore, indulge, and let's get writing! Whether you're jotting down
            life's precious moments, poetry, or simply letting your creativity
            flow—your stories deserve a beautiful companion.
          </p>
          <p>
            <strong>Connect with us:</strong>
            <br />
            📧 Email:{" "}
            <a href="mailto:dawaat.pk@gmail.com">dawaat.pk@gmail.com</a>
            <br />
            📱 WhatsApp:{" "}
            <a
              href="https://wa.me/923354023791"
              target="_blank"
              rel="noopener noreferrer"
            >
              +92 335 4023791
            </a>
            <br />
            📸 Instagram:{" "}
            <a
              href="https://instagram.com/dawaat.pk"
              target="_blank"
              rel="noopener noreferrer"
            >
              @dawaat.pk
            </a>
          </p>
          <p>
            <em>
              Because every word matters. Every story matters. You matter.
            </em>
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
