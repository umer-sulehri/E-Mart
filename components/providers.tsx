'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { logger } from '@/lib/logger';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason instanceof Error) {
        logger.error('UnhandledRejection', {
          message: reason.message,
          stack: reason.stack,
        });
      } else {
        logger.error('UnhandledRejection', reason);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      {children}
      {/* Anchored bottom-centre on phones: `top-right` lands on the sticky
          header, and `gutter` clears the fixed mobile bottom nav. */}
      <Toaster
        position="bottom-center"
        gutter={72}
        containerStyle={{ padding: '0 8px' }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#364127',
            color: '#fff',
            maxWidth: 'calc(100vw - 2rem)',
          },
          success: {
            iconTheme: {
              primary: '#6BB252',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#F95F09',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
