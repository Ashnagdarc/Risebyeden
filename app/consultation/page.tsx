'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

type Advisor = {
  id: string;
  name: string;
  title: string;
  specialty: string | null;
  status: 'AVAILABLE' | 'BUSY' | 'INACTIVE';
};

export default function ConsultationPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('portfolio');
  const [message, setMessage] = useState('');
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/client/advisors')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to load advisors');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setAdvisors(data.advisors || []);
      })
      .catch(() => {
        if (isMounted) {
          setStatusMessage('Unable to load advisors.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const availableTimes = useMemo(
    () => [
      '09:00 AM', '10:00 AM', '11:00 AM',
      '02:00 PM', '03:00 PM', '04:00 PM',
    ],
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    if (!selectedDate || !consultationType) {
      setStatusMessage('Select a consultation type and date.');
      return;
    }

    setIsSubmitting(true);

    const response = await fetch('/api/client/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: consultationType,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        notes: message,
        advisorId: selectedAdvisorId,
      }),
    });

    if (response.ok) {
      setStatusMessage('Consultation request submitted. We will reach out shortly.');
      setSelectedDate('');
      setSelectedTime('');
      setMessage('');
      setSelectedAdvisorId(null);
    } else {
      setStatusMessage('Unable to submit request. Please try again.');
    }

    setIsSubmitting(false);
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

              <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Request Consultation'}
              </button>
              {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
            </form>
          </section>

          <section className={styles.consultantsPanel}>
            <h3 className={styles.panelTitle}>Our Advisors</h3>
            <div className={styles.consultantsList}>
              {advisors.length === 0 && (
                <div className={styles.consultantEmpty}>No advisors available yet.</div>
              )}
              {advisors.map((consultant) => {
                const isAvailable = consultant.status === 'AVAILABLE';
                const isSelected = selectedAdvisorId === consultant.id;
                return (
                  <button
                    key={consultant.id}
                    type="button"
                    className={`${styles.consultantCard} ${isSelected ? styles.consultantSelected : ''}`}
                    onClick={() => {
                      if (!isAvailable) {
                        return;
                      }
                      setSelectedAdvisorId(consultant.id);
                    }}
                    disabled={!isAvailable}
                  >
                  <div className={styles.consultantAvatar}>
                    {consultant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={styles.consultantInfo}>
                    <h4 className={styles.consultantName}>{consultant.name}</h4>
                    <p className={styles.consultantRole}>{consultant.title}</p>
                    <p className={styles.consultantSpecialty}>{consultant.specialty || 'Advisory support'}</p>
                  </div>
                  <span className={`${styles.availabilityBadge} ${isAvailable ? styles.available : styles.unavailable}`}>
                    {isAvailable ? 'Available' : 'Busy'}
                  </span>
                </button>
              );
              })}
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
