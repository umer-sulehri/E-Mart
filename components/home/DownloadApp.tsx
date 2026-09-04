'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const DownloadApp = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <section ref={ref} className={cn('py-4', className)}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[3rem] bg-warning pt-5">
            <div className="flex flex-col items-center gap-8 px-8 py-12 md:flex-row md:justify-center md:gap-12 md:py-16 lg:gap-20">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <h2 className="mb-3 text-3xl font-bold text-secondary-800 md:text-4xl">
                  Download Organic App
                </h2>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-secondary-700">
                  Online Orders made easy, fast and reliable.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="#" title="Download on the App Store" className="block transition-transform hover:scale-105">
                    <Image
                      src="/images/img-app-store.webp"
                      alt="App Store"
                      width={135}
                      height={40}
                      className="h-10 w-auto object-contain"
                    />
                  </a>
                  <a href="#" title="Get it on Google Play" className="block transition-transform hover:scale-105">
                    <Image
                      src="/images/img-google-play.webp"
                      alt="Google Play"
                      width={135}
                      height={40}
                      className="h-10 w-auto object-contain"
                    />
                  </a>
                </div>
              </div>

              <div className="relative flex-shrink-0">
                <Image
                  src="/images/banner-onlineapp.webp"
                  alt="Download our app"
                  width={320}
                  height={280}
                  className="h-auto w-full max-w-[280px] object-contain md:max-w-[320px]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

DownloadApp.displayName = 'DownloadApp';

export default DownloadApp;
