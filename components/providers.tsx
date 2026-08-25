'use client';

import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#364127',
            color: '#fff',
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
