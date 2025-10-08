"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const Homepage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const styles = {
    // Base styles matching the existing theme
    container: {
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#333333',
      lineHeight: '1.6'
    },
    
    // Navigation styles
    nav: {
      background: '#ffffff',
      borderBottom: '1px solid #cccccc',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    navContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#333333',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    logoIcon: {
      color: '#ffd700',
      fontSize: '28px'
    },
    navLinks: {
      display: 'flex',
      gap: '2rem',
      alignItems: 'center'
    },
    navLink: {
      color: '#666666',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s ease'
    },
    ctaButton: {
      background: '#ffd700',
      color: '#333333',
      padding: '12px 24px',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer'
    },

    // Hero section styles
    hero: {
      background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
      padding: '6rem 0',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    heroContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
      position: 'relative',
      zIndex: 2
    },
    heroTitle: {
      fontSize: '3.5rem',
      fontWeight: '700',
      color: '#333333',
      marginBottom: '1.5rem',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.8s ease'
    },
    heroSubtitle: {
      fontSize: '1.25rem',
      color: '#666666',
      marginBottom: '2.5rem',
      maxWidth: '600px',
      margin: '0 auto 2.5rem auto',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.8s ease 0.2s'
    },
    heroButtons: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.8s ease 0.4s'
    },
    primaryButton: {
      background: '#ffd700',
      color: '#333333',
      padding: '16px 32px',
      borderRadius: '12px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '18px',
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    secondaryButton: {
      background: 'transparent',
      color: '#333333',
      padding: '16px 32px',
      borderRadius: '12px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '18px',
      border: '2px solid #cccccc',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },

    // Features section styles
    features: {
      padding: '6rem 0',
      background: '#ffffff'
    },
    featuresContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem'
    },
    sectionTitle: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#333333',
      textAlign: 'center',
      marginBottom: '3rem'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem'
    },
    featureCard: {
      background: '#f5f5f5',
      padding: '2rem',
      borderRadius: '12px',
      textAlign: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      border: '1px solid #e0e0e0'
    },
    featureIcon: {
      fontSize: '3rem',
      color: '#ffd700',
      marginBottom: '1rem'
    },
    featureTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#333333',
      marginBottom: '1rem'
    },
    featureDescription: {
      color: '#666666',
      lineHeight: '1.6'
    },

    // How it works section
    howItWorks: {
      padding: '6rem 0',
      background: '#f5f5f5'
    },
    stepsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      marginTop: '3rem'
    },
    stepCard: {
      background: '#ffffff',
      padding: '2rem',
      borderRadius: '12px',
      textAlign: 'center',
      position: 'relative',
      border: '1px solid #e0e0e0'
    },
    stepNumber: {
      background: '#ffd700',
      color: '#333333',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      fontSize: '18px',
      margin: '0 auto 1rem auto'
    },
    stepTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#333333',
      marginBottom: '1rem'
    },
    stepDescription: {
      color: '#666666',
      lineHeight: '1.6'
    },

    // CTA section
    cta: {
      padding: '6rem 0',
      background: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
      color: '#ffffff',
      textAlign: 'center'
    },
    ctaTitle: {
      fontSize: '2.5rem',
      fontWeight: '700',
      marginBottom: '1rem'
    },
    ctaDescription: {
      fontSize: '1.25rem',
      marginBottom: '2rem',
      opacity: 0.9
    },

    // Footer
    footer: {
      background: '#333333',
      color: '#ffffff',
      padding: '3rem 0 1rem 0'
    },
    footerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem'
    },
    footerSection: {
      marginBottom: '2rem'
    },
    footerTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#ffd700'
    },
    footerLink: {
      color: '#cccccc',
      textDecoration: 'none',
      display: 'block',
      marginBottom: '0.5rem',
      transition: 'color 0.2s ease'
    },
    footerBottom: {
      borderTop: '1px solid #555555',
      paddingTop: '1rem',
      textAlign: 'center',
      color: '#cccccc'
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <Link href="/" style={styles.logo}>
            <span style={styles.logoIcon}>📊</span>
            FinScreener Pro
          </Link>
          <div style={styles.navLinks}>
            <Link href="#features" style={styles.navLink}>Features</Link>
            <Link href="#how-it-works" style={styles.navLink}>How It Works</Link>
            <Link href="#pricing" style={styles.navLink}>Pricing</Link>
            <Link href="/" style={styles.ctaButton}>
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContainer}>
          <h1 style={styles.heroTitle}>
            Professional Stock Screening Made Simple
          </h1>
          <p style={styles.heroSubtitle}>
            Discover undervalued stocks with our advanced financial analysis tools. 
            Screen global markets, analyze fundamentals, and make informed investment decisions.
          </p>
          <div style={styles.heroButtons}>
            <Link href="/" style={styles.primaryButton}>
              <span>🚀</span>
              Start Screening
            </Link>
            <a href="#features" style={styles.secondaryButton}>
              <span>📖</span>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.features}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.sectionTitle}>Powerful Features for Smart Investing</h2>
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🔍</div>
              <h3 style={styles.featureTitle}>Advanced Screening</h3>
              <p style={styles.featureDescription}>
                Filter stocks by P/E ratio, P/B ratio, debt-to-equity, ROE, and more. 
                Find undervalued opportunities across global markets.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📊</div>
              <h3 style={styles.featureTitle}>Financial Analysis</h3>
              <p style={styles.featureDescription}>
                Deep dive into company financials with DCF valuation, ratio analysis, 
                and comprehensive financial health assessments.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🌍</div>
              <h3 style={styles.featureTitle}>Global Markets</h3>
              <p style={styles.featureDescription}>
                Access stocks from major indices worldwide including S&P 500, CAC 40, 
                FTSE 100, and many more international markets.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📈</div>
              <h3 style={styles.featureTitle}>Real-time Data</h3>
              <p style={styles.featureDescription}>
                Get up-to-date financial data and market information to make 
                timely investment decisions based on current market conditions.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>💾</div>
              <h3 style={styles.featureTitle}>Export & Save</h3>
              <p style={styles.featureDescription}>
                Export your screening results to Excel, save screening criteria, 
                and track your analysis history for future reference.
              </p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>⚡</div>
              <h3 style={styles.featureTitle}>Fast & Reliable</h3>
              <p style={styles.featureDescription}>
                Lightning-fast screening engine with reliable data sources. 
                Get results in seconds, not minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={styles.howItWorks}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.stepsGrid}>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.stepTitle}>Set Your Criteria</h3>
              <p style={styles.stepDescription}>
                Define your screening parameters including P/E ratio, P/B ratio, 
                debt levels, and profitability metrics.
              </p>
            </div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.stepTitle}>Choose Your Market</h3>
              <p style={styles.stepDescription}>
                Select from major global indices or specific markets 
                you want to analyze for investment opportunities.
              </p>
            </div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.stepTitle}>Run the Screen</h3>
              <p style={styles.stepDescription}>
                Execute your screening criteria and get a filtered list 
                of stocks that match your investment requirements.
              </p>
            </div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>4</div>
              <h3 style={styles.stepTitle}>Analyze Results</h3>
              <p style={styles.stepDescription}>
                Review detailed financial analysis, DCF valuations, 
                and key metrics for each qualifying stock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.ctaTitle}>Ready to Find Your Next Investment?</h2>
          <p style={styles.ctaDescription}>
            Join thousands of investors who use FinScreener Pro to discover undervalued opportunities.
          </p>
          <Link href="/" style={{...styles.primaryButton, fontSize: '20px', padding: '20px 40px'}}>
            <span>🎯</span>
            Start Screening Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>FinScreener Pro</h4>
            <p style={{color: '#cccccc', lineHeight: '1.6'}}>
              Professional stock screening and financial analysis platform 
              for smart investors worldwide.
            </p>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Features</h4>
            <a href="#" style={styles.footerLink}>Stock Screening</a>
            <a href="#" style={styles.footerLink}>Financial Analysis</a>
            <a href="#" style={styles.footerLink}>DCF Valuation</a>
            <a href="#" style={styles.footerLink}>Global Markets</a>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Resources</h4>
            <a href="#" style={styles.footerLink}>Documentation</a>
            <a href="#" style={styles.footerLink}>API Reference</a>
            <a href="#" style={styles.footerLink}>Support</a>
            <a href="#" style={styles.footerLink}>Blog</a>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Company</h4>
            <a href="#" style={styles.footerLink}>About Us</a>
            <a href="#" style={styles.footerLink}>Contact</a>
            <a href="#" style={styles.footerLink}>Privacy Policy</a>
            <a href="#" style={styles.footerLink}>Terms of Service</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>&copy; 2024 FinScreener Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;