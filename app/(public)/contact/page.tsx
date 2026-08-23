'use client';

import { useState } from 'react';

const inputStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', company: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const flat = data?.error;
        const first = flat && typeof flat === 'object' ? Object.values(flat).flat()[0] : null;
        throw new Error(typeof first === 'string' ? first : data?.error ?? 'Failed to send message.');
      }
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '', company: '' });
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    }
  };

  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-2">Contact Us</h1>
          <p className="text-body-secondary mb-4">
            Questions about an order, a product, or your account? Send us a message and
            we&apos;ll get back to you within one business day.
          </p>

          {status === 'sent' ? (
            <div className="alert alert-success" role="status">
              Thanks for reaching out! Your message has been sent — we&apos;ll reply to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot field — hidden from humans */}
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={update('company')}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="contact-name" className="form-label">Your Name</label>
                  <input
                    id="contact-name"
                    className="form-control"
                    style={inputStyle}
                    value={form.name}
                    onChange={update('name')}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="contact-email" className="form-label">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-control"
                    style={inputStyle}
                    value={form.email}
                    onChange={update('email')}
                    required
                    maxLength={200}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="contact-subject" className="form-label">Subject</label>
                  <input
                    id="contact-subject"
                    className="form-control"
                    style={inputStyle}
                    value={form.subject}
                    onChange={update('subject')}
                    required
                    minLength={3}
                    maxLength={150}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="contact-message" className="form-label">Message</label>
                  <textarea
                    id="contact-message"
                    className="form-control"
                    style={{ ...inputStyle, minHeight: '160px' }}
                    value={form.message}
                    onChange={update('message')}
                    required
                    minLength={10}
                    maxLength={5000}
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send Message'}
                  </button>
                  {error && (
                    <p className="text-danger small mt-2 mb-0" role="alert">{error}</p>
                  )}
                </div>
              </div>
            </form>
          )}

          <hr className="my-5" />
          <div className="row g-4">
            <div className="col-md-4">
              <h5>Support Hours</h5>
              <p className="text-body-secondary mb-0">Monday – Saturday, 9am – 9pm (PKT)</p>
            </div>
            <div className="col-md-4">
              <h5>Phone</h5>
              <p className="text-body-secondary mb-0">+92 300 000 0000</p>
            </div>
            <div className="col-md-4">
              <h5>Email</h5>
              <p className="text-body-secondary mb-0">support@e-mart.app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
