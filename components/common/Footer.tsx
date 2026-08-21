'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useSocialLinks } from '@/hooks/useSocialLinks';
import { CloseIcon } from '@/components/icons';

function PopupModal({ isOpen, onClose, title, content }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-primary hover:text-error transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="w-7 h-7" />
        </button>
        <h3 className="text-xl font-bold text-text-primary pr-10 pb-3 border-b-2 border-border mb-4">
          {title}
        </h3>
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {content}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslations();
  const [popup, setPopup] = useState<{ open: boolean; title: string; content: string }>({
    open: false, title: '', content: '',
  });
  const { data: socialLinks = [] } = useSocialLinks();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const showPopup = (key: string) => {
    const title = t(`popup.${key}.title`);
    const content = t(`popup.${key}.content`);
    setPopup({ open: true, title, content });
  };

  const handleSubscribe = () => {
    if (email && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <>
      <footer className="bg-surface border-t-2 border-border mt-auto" role="contentinfo">
        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1: Get to Know Us */}
            <div className="w-full">
              <h4 className="text-base font-bold text-text-primary mb-4 pb-3 border-b-2 border-primary/30">
                {t('footer.getToKnowUs')}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { key: 'about', label: t('footer.aboutUs') },
                  { key: 'careers', label: t('footer.careers') },
                  { key: 'press', label: t('footer.pressReleases') },
                  { key: 'sitemap', label: t('footer.ourBlog') },
                  { key: 'privacy', label: t('footer.sustainability') },
                  { key: 'terms', label: t('footer.investorRelations') },
                ].map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => showPopup(item.key)}
                      className="text-sm text-text-secondary hover:text-primary-dark hover:pl-1 transition-all duration-300 cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Customer Care */}
            <div className="w-full">
              <h4 className="text-base font-bold text-text-primary mb-4 pb-3 border-b-2 border-primary/30">
                {t('footer.customerCare')}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { key: 'contact', label: t('footer.helpCenter') },
                  { key: 'returns', label: t('footer.returnsRefunds') },
                  { key: 'shipping', label: t('footer.shippingInfo') },
                  { key: 'faq', label: t('footer.faqs') },
                  { key: 'contact', label: t('footer.contactUs') },
                  { key: 'warranty', label: t('footer.warrantyPolicy') },
                ].map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => showPopup(item.key)}
                      className="text-sm text-text-secondary hover:text-primary-dark hover:pl-1 transition-all duration-300 cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Follow Us */}
            {socialLinks.length > 0 && (
            <div className="w-full">
              <h4 className="text-base font-bold text-text-primary mb-4 pb-3 border-b-2 border-primary/30">
                {t('footer.followUs')}
              </h4>
              <p className="text-sm text-text-secondary mb-3">{t('footer.followUsDesc')}</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${link.label}`}
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center bg-surface-alt border border-border rounded-full text-text-secondary hover:bg-primary hover:text-text-inverse hover:border-primary transition-all duration-300 text-xs font-bold"
                  >
                    {link.icon.charAt(0).toUpperCase()}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="text-primary">&#9742;</span>
                  <button onClick={() => showPopup('contact')} className="hover:text-primary-dark transition-colors cursor-pointer">
                    {t('footer.phone')}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="text-primary">&#9993;</span>
                  <button onClick={() => showPopup('contact')} className="hover:text-primary-dark transition-colors cursor-pointer">
                    {t('footer.email')}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="text-primary">&#128205;</span>
                  <button onClick={() => showPopup('contact')} className="hover:text-primary-dark transition-colors cursor-pointer">
                    {t('footer.address')}
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Column 4: Newsletter & App */}
            <div className="w-full">
              <h4 className="text-base font-bold text-text-primary mb-4 pb-3 border-b-2 border-primary/30">
                {t('footer.stayUpdated')}
              </h4>
              <p className="text-sm text-text-secondary mb-3">{t('footer.newsletterDesc')}</p>
              <div className="flex flex-col gap-2 mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.enterEmail')}
                  aria-label={t('footer.enterEmail')}
                  className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-text-primary placeholder:text-text-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                  onClick={handleSubscribe}
                  className="w-full px-3 py-2.5 bg-primary text-text-inverse font-semibold rounded-lg hover:bg-primary-dark transition-all duration-300 text-sm"
                >
                  {subscribed ? '✓ Subscribed!' : t('footer.subscribe')}
                </button>
              </div>

              <h4 className="text-sm font-bold text-text-primary mb-3">{t('footer.downloadApp')}</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => showPopup('appstore')}
                  className="flex items-center gap-1.5 bg-bg border border-border px-3 py-2 rounded-lg text-text-secondary text-xs hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  <span>&#63743;</span> {t('footer.appStore')}
                </button>
                <button
                  onClick={() => showPopup('googleplay')}
                  className="flex items-center gap-1.5 bg-bg border border-border px-3 py-2 rounded-lg text-text-secondary text-xs hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  <span>&#9654;</span> {t('footer.googlePlay')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-text-secondary text-center sm:text-left">
              {t('footer.copyright')} |{' '}
              <button onClick={() => showPopup('privacy')} className="hover:text-primary-dark transition-colors cursor-pointer">
                {t('footer.privacy')}
              </button>{' '}
              |{' '}
              <button onClick={() => showPopup('terms')} className="hover:text-primary-dark transition-colors cursor-pointer">
                {t('footer.terms')}
              </button>{' '}
              |{' '}
              <button onClick={() => showPopup('sitemap')} className="hover:text-primary-dark transition-colors cursor-pointer">
                {t('footer.sitemap')}
              </button>
            </p>
            <div className="flex items-center gap-3 text-xl text-text-secondary">
              {['Visa', 'MC', 'Amex', 'PayPal', 'JazzCash', 'EasyPaisa'].map((p) => (
                <button
                  key={p}
                  className="hover:text-primary-dark transition-colors cursor-pointer text-[10px] font-bold bg-bg border border-border px-2 py-1 rounded"
                  aria-label={p}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Popup Modal */}
      <PopupModal
        isOpen={popup.open}
        onClose={() => setPopup({ open: false, title: '', content: '' })}
        title={popup.title}
        content={popup.content}
      />
    </>
  );
}
