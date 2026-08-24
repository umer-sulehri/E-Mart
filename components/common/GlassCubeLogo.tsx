'use client';

interface GlassCubeLogoProps {
  size?: number;
  className?: string;
}

export function GlassCubeLogo({ size = 50, className = '' }: GlassCubeLogoProps) {
  const half = size / 2;
  const fontSize = Math.round(size * 0.44);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div className="w-full h-full relative" style={{ perspective: 400 }}>
        <div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d', animation: 'cubeSpin 8s infinite linear' }}
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-black/20" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', transform: `translateZ(${half}px)`, fontSize, fontWeight: 'bold', color: 'white' }}>E</div>
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-black/20" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', transform: `rotateY(180deg) translateZ(${half}px)`, fontSize, fontWeight: 'bold', color: '#FFF9EB' }}>M</div>
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-black/20" style={{ background: 'linear-gradient(135deg, #FFF9EB, var(--color-primary))', transform: `rotateY(90deg) translateZ(${half}px)`, fontSize, fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>A</div>
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-black/20" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), #FFF9EB)', transform: `rotateY(-90deg) translateZ(${half}px)`, fontSize, fontWeight: 'bold', color: 'var(--color-primary)' }}>R</div>
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-black/20" style={{ background: 'linear-gradient(135deg, var(--color-primary), #FFF9EB)', transform: `rotateX(90deg) translateZ(${half}px)`, fontSize, fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>T</div>
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-black/20" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', transform: `rotateX(-90deg) translateZ(${half}px)`, fontSize, fontWeight: 'bold', color: '#FFF9EB' }}>●</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes cubeSpin {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          25% { transform: rotateX(90deg) rotateY(90deg); }
          50% { transform: rotateX(180deg) rotateY(180deg); }
          75% { transform: rotateX(270deg) rotateY(270deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
