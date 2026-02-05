'use client';'use client';



































































































































































































































































































































}  );    </div>      </main>        </form>          </div>            </button>              Add Property to Portfolio              </svg>                <line x1="5" y1="12" x2="19" y2="12"></line>                <line x1="12" y1="5" x2="12" y2="19"></line>              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">            <button type="submit" className={styles.submitButton}>            </button>              Cancel            <button type="button" className={styles.cancelButton}>          <div className={styles.formActions}>          </div>            </div>              </div>                />                  rows={5}                  placeholder="Enter detailed description of the property..."                  onChange={handleChange}                  value={formData.description}                  name="description"                  id="description"                <textarea                <label htmlFor="description">Property Description</label>              <div className={styles.formGroup}>                            <h2 className={styles.sectionTitle}>Additional Details</h2>            <div className={styles.section} style={{ gridColumn: '1 / -1' }}>            {/* Additional Details Section */}            </div>              </div>                </div>                  />                    min="0"                    placeholder="0"                    onChange={handleChange}                    value={formData.bathrooms}                    name="bathrooms"                    id="bathrooms"                    step="0.5"                    type="number"                  <input                  <label htmlFor="bathrooms">Bathrooms</label>                <div className={styles.formGroup}>                </div>                  />                    min="0"                    placeholder="0"                    onChange={handleChange}                    value={formData.bedrooms}                    name="bedrooms"                    id="bedrooms"                    type="number"                  <input                  <label htmlFor="bedrooms">Bedrooms</label>                <div className={styles.formGroup}>              <div className={styles.formRow}>              </div>                </div>                  />                    max="2026"                    min="1800"                    placeholder="2020"                    onChange={handleChange}                    value={formData.yearBuilt}                    name="yearBuilt"                    id="yearBuilt"                    type="number"                  <input                  <label htmlFor="yearBuilt">Year Built</label>                <div className={styles.formGroup}>                </div>                  </div>                    <span className={styles.suffix}>sq ft</span>                    />                      placeholder="0"                      onChange={handleChange}                      value={formData.squareFeet}                      name="squareFeet"                      id="squareFeet"                      type="number"                    <input                  <div className={styles.inputWithPrefix}>                  <label htmlFor="squareFeet">Square Footage</label>                <div className={styles.formGroup}>              <div className={styles.formRow}>                            <h2 className={styles.sectionTitle}>Property Specifications</h2>            <div className={styles.section}>            {/* Property Specifications Section */}            </div>              </div>                </div>                  </div>                    <span className={styles.suffix}>%</span>                    />                      placeholder="0"                      onChange={handleChange}                      value={formData.interestRate}                      name="interestRate"                      id="interestRate"                      step="0.01"                      type="number"                    <input                  <div className={styles.inputWithPrefix}>                  <label htmlFor="interestRate">Interest Rate</label>                <div className={styles.formGroup}>                </div>                  </div>                    />                      placeholder="0"                      onChange={handleChange}                      value={formData.mortgageAmount}                      name="mortgageAmount"                      id="mortgageAmount"                      type="number"                    <input                    <span className={styles.prefix}>$</span>                  <div className={styles.inputWithPrefix}>                  <label htmlFor="mortgageAmount">Mortgage Amount</label>                <div className={styles.formGroup}>              <div className={styles.formRow}>              </div>                </div>                  </div>                    />                      placeholder="0"                      onChange={handleChange}                      value={formData.annualExpenses}                      name="annualExpenses"                      id="annualExpenses"                      type="number"                    <input                    <span className={styles.prefix}>$</span>                  <div className={styles.inputWithPrefix}>                  <label htmlFor="annualExpenses">Annual Expenses</label>                <div className={styles.formGroup}>                </div>                  </div>                    />                      placeholder="0"                      onChange={handleChange}                      value={formData.monthlyRent}                      name="monthlyRent"                      id="monthlyRent"                      type="number"                    <input                    <span className={styles.prefix}>$</span>                  <div className={styles.inputWithPrefix}>                  <label htmlFor="monthlyRent">Monthly Rental Income</label>                <div className={styles.formGroup}>              <div className={styles.formRow}>              </div>                </div>                  </div>                    />                      required                      placeholder="0"                      onChange={handleChange}                      value={formData.currentValuation}                      name="currentValuation"                      id="currentValuation"                      type="number"                    <input                    <span className={styles.prefix}>$</span>                  <div className={styles.inputWithPrefix}>                  <label htmlFor="currentValuation">Current Valuation</label>                <div className={styles.formGroup}>                </div>                  </div>                    />                      required                      placeholder="0"                      onChange={handleChange}                      value={formData.purchasePrice}                      name="purchasePrice"                      id="purchasePrice"                      type="number"                    <input                    <span className={styles.prefix}>$</span>                  <div className={styles.inputWithPrefix}>                  <label htmlFor="purchasePrice">Purchase Price</label>                <div className={styles.formGroup}>              <div className={styles.formRow}>                            <h2 className={styles.sectionTitle}>Financial Details</h2>            <div className={styles.section}>            {/* Financial Information Section */}            </div>              </div>                </div>                  />                    required                    placeholder="e.g., Tribeca, New York"                    onChange={handleChange}                    value={formData.city}                    name="city"                    id="city"                    type="text"                  <input                  <label htmlFor="city">City, Region</label>                <div className={styles.formGroup}>                </div>                  />                    required                    placeholder="Street address"                    onChange={handleChange}                    value={formData.location}                    name="location"                    id="location"                    type="text"                  <input                  <label htmlFor="location">Address</label>                <div className={styles.formGroup}>              <div className={styles.formRow}>              </div>                </div>                  </select>                    <option value="land">Land</option>                    <option value="industrial">Industrial</option>                    <option value="mixed-use">Mixed Use</option>                    <option value="commercial">Commercial</option>                    <option value="residential">Residential</option>                  >                    required                    onChange={handleChange}                    value={formData.propertyType}                    name="propertyType"                    id="propertyType"                  <select                  <label htmlFor="propertyType">Property Type</label>                <div className={styles.formGroup}>                </div>                  />                    required                    placeholder="e.g., The Obsidian Heights"                    onChange={handleChange}                    value={formData.propertyName}                    name="propertyName"                    id="propertyName"                    type="text"                  <input                  <label htmlFor="propertyName">Property Name</label>                <div className={styles.formGroup}>              <div className={styles.formRow}>                            <h2 className={styles.sectionTitle}>Basic Information</h2>            <div className={styles.section}>            {/* Basic Information Section */}          <div className={styles.formGrid}>        <form onSubmit={handleSubmit} className={styles.form}>        </header>          </div>            <p className={styles.subtitle}>Add a new asset to your portfolio</p>            <h1 className={styles.pageTitle}>Acquire Property</h1>            <span className={styles.backLink}>← Back to Dashboard</span>          <div>        <header className={styles.header}>      <main className={styles.main}>            <Sidebar />    <div className={styles.container}>  return (  };    alert('Property submitted successfully!');    // Here you would typically send the data to your backend    console.log('Property Data:', formData);    e.preventDefault();  const handleSubmit = (e: React.FormEvent) => {  };    });      [e.target.name]: e.target.value,      ...formData,    setFormData({  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {  });    description: '',    interestRate: '',    mortgageAmount: '',    annualExpenses: '',    monthlyRent: '',    bathrooms: '',    bedrooms: '',    yearBuilt: '',    squareFeet: '',    currentValuation: '',    purchasePrice: '',    propertyType: 'residential',    city: '',    location: '',    propertyName: '',  const [formData, setFormData] = useState({export default function AcquireProperty() {import styles from './page.module.css';import Sidebar from '@/components/Sidebar';import { useState } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function AcquireProperty() {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    country: '',
    type: 'residential',
    valuation: '',
    capRate: '',
    appreciation: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Property data:', formData);
    // Handle form submission
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.backLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Portfolio
            </Link>
            <h1 className={styles.title}>Acquire Property</h1>
            <p className={styles.subtitle}>Add a new asset to your portfolio</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Property Details Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Property Details</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="name">Property Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="The Obsidian Heights"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Tribeca"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="New York"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="type">Property Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="mixed-use">Mixed Use</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the property..."
                  rows={4}
                />
              </div>
            </div>

            {/* Financial Metrics Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Financial Metrics</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="valuation">Valuation</label>
                <div className={styles.inputGroup}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    type="number"
                    id="valuation"
                    name="valuation"
                    value={formData.valuation}
                    onChange={handleChange}
                    placeholder="4200000"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="capRate">Cap Rate</label>
                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    id="capRate"
                    name="capRate"
                    value={formData.capRate}
                    onChange={handleChange}
                    placeholder="5.2"
                    step="0.1"
                    required
                  />
                  <span className={styles.inputSuffix}>%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="appreciation">Expected Appreciation</label>
                <div className={styles.inputGroup}>
                  <input
                    type="number"
                    id="appreciation"
                    name="appreciation"
                    value={formData.appreciation}
                    onChange={handleChange}
                    placeholder="22.4"
                    step="0.1"
                    required
                  />
                  <span className={styles.inputSuffix}>%</span>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <div>
                  <p className={styles.infoTitle}>Metric Guidelines</p>
                  <p className={styles.infoText}>Cap rates typically range from 4-10%. Higher cap rates indicate higher returns but may also indicate higher risk.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <Link href="/" className={styles.cancelButton}>
              Cancel
            </Link>
            <button type="submit" className={styles.submitButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Add Property to Portfolio
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
