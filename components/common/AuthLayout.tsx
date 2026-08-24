import { GlassCubeLogo } from '@/components/common/GlassCubeLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}

export function AuthLayout({ children, title, maxWidth = '420px' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'linear-gradient(180deg, var(--color-primary), var(--color-text-primary))' }}>
      <div
        className="w-full animate-[fadeIn_0.5s_ease]"
        style={{
          maxWidth,
          background: 'var(--color-surface)',
          padding: '35px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <GlassCubeLogo size={50} />
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-widest" style={{ color: 'var(--color-text-primary)' }}>E-MART</h1>
            <p className="text-[9px] tracking-[3px] font-medium uppercase opacity-70" style={{ color: 'var(--color-text-primary)' }}>ONLINE MARKETPLACE</p>
          </div>
        </div>

        {/* Title */}
        {title && (
          <h2
            className="text-center text-2xl font-semibold mb-6 pb-2.5"
            style={{
              color: 'var(--color-text-primary)',
              borderBottom: '2px solid var(--color-primary)',
            }}
          >
            {title}
          </h2>
        )}

        {children}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
