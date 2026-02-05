'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function AcquireProperty() {
  const [formData, setFormData] = useState({
    propertyName: '',
    location: '',
    city: '',
    propertyType: 'residential',
    purchasePrice: '',
    currentValuation: '',
    squareFeet: '',
    yearBuilt: '',
    bedrooms: '',
    bathrooms: '',
    monthlyRent: '',
    annualExpenses: '',
    mortgageAmount: '',
    interestRate: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Property Data:', formData);
    // Here you would typically send the data to your backend
    alert('Property submitted successfully!');
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.backLink}>
              ← Back to Dashboard
            </Link>
            <h1 className={styles.pageTitle}>Acquire Property</h1>
            <p className={styles.subtitle}>Add a new asset to your portfolio</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Basic Information Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Basic Information</h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="propertyName">Property Name</label>
                  <input
                    type="text"
                    id="propertyName"
                    name="propertyName"
                    value={formData.propertyName}
                    onChange={handleChange}
                    placeholder="e.g., The Obsidian Heights"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="propertyType">Property Type</label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    required
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed-use">Mixed Use</option>
                    <option value="industrial">Industrial</option>
                    <option value="land">Land</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="location">Address</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="city">City, Region</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Tribeca, New York"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Financial Information Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Financial Details</h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="purchasePrice">Purchase Price</label>
                  <div className={styles.inputWithPrefix}>
                    <span className={styles.prefix}>$</span>
                    <input
                      type="number"
                      id="purchasePrice"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="currentValuation">Current Valuation</label>
                  <div className={styles.inputWithPrefix}>
                    <span className={styles.prefix}>$</span>
                    <input
                      type="number"
                      id="currentValuation"
                      name="currentValuation"
                      value={formData.currentValuation}
                      onChange={handleChange}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="monthlyRent">Monthly Rental Income</label>
                  <div className={styles.inputWithPrefix}>
                    <span className={styles.prefix}>$</span>
                    <input
                      type="number"
                      id="monthlyRent"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="annualExpenses">Annual Expenses</label>
                  <div className={styles.inputWithPrefix}>
                    <span className={styles.prefix}>$</span>
                    <input
                      type="number"
                      id="annualExpenses"
                      name="annualExpenses"
                      value={formData.annualExpenses}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="mortgageAmount">Mortgage Amount</label>
                  <div className={styles.inputWithPrefix}>
                    <span className={styles.prefix}>$</span>
                    <input
                      type="number"
                      id="mortgageAmount"
                      name="mortgageAmount"
                      value={formData.mortgageAmount}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="interestRate">Interest Rate</label>
                  <div className={styles.inputWithPrefix}>
                    <input
                      type="number"
                      step="0.01"
                      id="interestRate"
                      name="interestRate"
                      value={formData.interestRate}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <span className={styles.suffix}>%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Specifications Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Property Specifications</h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="squareFeet">Square Footage</label>
                  <div className={styles.inputWithPrefix}>
                    <input
                      type="number"
                      id="squareFeet"
                      name="squareFeet"
                      value={formData.squareFeet}
                      onChange={handleChange}
                      placeholder="0"
                    />
                    <span className={styles.suffix}>sq ft</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="yearBuilt">Year Built</label>
                  <input
                    type="number"
                    id="yearBuilt"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    placeholder="2020"
                    min="1800"
                    max="2026"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="bedrooms">Bedrooms</label>
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bathrooms">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    id="bathrooms"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className={styles.section} style={{ gridColumn: '1 / -1' }}>
              <h2 className={styles.sectionTitle}>Additional Details</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">Property Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter detailed description of the property..."
                  rows={5}
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/" className={styles.cancelButton}>
              Cancel
            </Link>
            <button type="submit" className={styles.submitButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Property to Portfolio
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

