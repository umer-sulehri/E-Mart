'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full bg-secondary text-white">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:justify-between sm:px-6 lg:px-12">
        <p className="text-center text-sm text-white/80 sm:text-left">
          We use cookies to enhance your experience. By continuing to visit this
          site you agree to our use of cookies.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/privacy-policy"
            className="text-sm text-white/60 underline hover:text-white transition-colors"
          >
            Learn More
          </Link>
          <button
            onClick={accept}
            className="rounded bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
