'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function ConsultationPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('portfolio');
  const [message, setMessage] = useState('');

  const availableTimes = [
    '09:00 AM', '10:00 AM', '11:00 AM', 
    '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  const consultants = [
    {
      name: 'Sarah Chen',
      role: 'Senior Portfolio Advisor',
      specialty: 'High-value acquisitions',
      available: true
    },
    {
      name: 'Michael Torres',
      role: 'Investment Strategist',
      specialty: 'Market analysis & timing',
      available: true
    },
    {
      name: 'Elena Kozlov',
      role: 'Real Estate Analyst',
      specialty: 'Commercial properties',
      available: false
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle booking logic
    alert('Consultation request submitted successfully!');
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Schedule</p>
            <h1 className={styles.pageTitle}>Book Consultation</h1>
            <p className={styles.subtitle}>Connect with our expert advisors for personalized investment guidance.</p>
          </div>
        </header>

        <div className={styles.grid}>
          <section className={styles.formPanel}>
            <h3 className={styles.panelTitle}>Schedule Your Session</h3>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.fieldGroup}>
                <label htmlFor="consultationType" className={styles.label}>Consultation Type</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="portfolio"
                      checked={consultationType === 'portfolio'}
                      onChange={(e) => setConsultationType(e.target.value)}
                    />
                    <div className={styles.radioContent}>
                      <span className={styles.radioTitle}>Portfolio Review</span>
                      <span className={styles.radioDesc}>Comprehensive analysis of your holdings</span>
                    </div>
                  </label>
                  <label className={styles.radioOption}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="acquisition"
                      checked={consultationType === 'acquisition'}
                      onChange={(e) => setConsultationType(e.target.value)}
                    />
                    <div className={styles.radioContent}>
                      <span className={styles.radioTitle}>Acquisition Strategy</span>
                      <span className={styles.radioDesc}>Explore new investment opportunities</span>
                    </div>
                  </label>
                  <label className={styles.radioOption}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="market"
                      checked={consultationType === 'market'}
                      onChange={(e) => setConsultationType(e.target.value)}
                    />
                    <div className={styles.radioContent}>
                      <span className={styles.radioTitle}>Market Insights</span>
                      <span className={styles.radioDesc}>Current trends and forecasts</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.dateTimeRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="date" className={styles.label}>Preferred Date</label>
                  <input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.input}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="time" className={styles.label}>Preferred Time</label>
                  <select
                    id="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className={styles.select}
                    aria-label="Select time"
                  >
                    <option value="">Select time</option>
                    {availableTimes.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="message" className={styles.label}>Additional Notes</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={styles.textarea}
                  rows={4}
                  placeholder="Share any specific topics or questions you'd like to discuss..."
                />
              </div>

              <button type="submit" className={styles.primaryButton}>
                Request Consultation
              </button>
            </form>
          </section>

          <section className={styles.consultantsPanel}>
            <h3 className={styles.panelTitle}>Our Advisors</h3>
            <div className={styles.consultantsList}>
              {consultants.map((consultant, index) => (
                <div key={index} className={styles.consultantCard}>
                  <div className={styles.consultantAvatar}>
                    {consultant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={styles.consultantInfo}>
                    <h4 className={styles.consultantName}>{consultant.name}</h4>
                    <p className={styles.consultantRole}>{consultant.role}</p>
                    <p className={styles.consultantSpecialty}>{consultant.specialty}</p>
                  </div>
                  <span className={`${styles.availabilityBadge} ${consultant.available ? styles.available : styles.unavailable}`}>
                    {consultant.available ? 'Available' : 'Busy'}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.infoCard}>
              <h4 className={styles.infoTitle}>What to Expect</h4>
              <ul className={styles.infoList}>
                <li>30-minute virtual session</li>
                <li>Personalized investment advice</li>
                <li>Access to exclusive market reports</li>
                <li>Follow-up action plan via email</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
