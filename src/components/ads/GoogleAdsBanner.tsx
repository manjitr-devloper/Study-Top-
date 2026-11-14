import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

interface GoogleAdsBannerProps {
  slot?: 'dashboard' | 'leaderboard' | 'social_feed' | 'profile';
  className?: string;
}

export const GoogleAdsBanner: React.FC<GoogleAdsBannerProps> = ({
  slot = 'dashboard',
  className = ''
}) => {
  const [adConfig, setAdConfig] = useState<{
    enabled: boolean;
    publisherEmail: string;
    publisherName: string;
    adSenseClientId: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/ads/config')
      .then(r => r.json())
      .then(data => setAdConfig(data))
      .catch(() => {
        setAdConfig({
          enabled: true,
          publisherEmail: 'manjitranjan180513@gmail.com',
          publisherName: 'Manjit Ranjan (Google Developer)',
          adSenseClientId: 'ca-pub-studytop-manjitranjan'
        });
      });
  }, []);

  useEffect(() => {
    if (!adConfig?.adSenseClientId) return;
    try {
      const w = window as any;
      if (w.adsbygoogle && Array.isArray(w.adsbygoogle)) {
        w.adsbygoogle.push({});
      }
    } catch (_) {}
  }, [adConfig]);

  const campaigns = {
    dashboard: {
      headline: 'Google Cloud & Gemini AI for Students — Build Smarter Study Workflows',
      body: 'Accelerate exam revision with source-grounded notes, instant math verification, and cloud notebooks.',
      cta: 'Explore Study Tools',
      href: 'https://ai.google.dev'
    },
    leaderboard: {
      headline: 'Google Career Certificates & Academic Scholarships',
      body: 'Earn industry-recognized credentials in Data Analytics, AI Essentials, and Cybersecurity alongside your studies.',
      cta: 'Learn More',
      href: 'https://grow.google'
    },
    social_feed: {
      headline: 'Study Top Pro Community · Powered by Google Developer Ecosystem',
      body: 'Share point-wise revision notes, challenge peers on the Global Leaderboard, and unlock verified scholar badges.',
      cta: 'View Leaderboard',
      href: '#leaderboard'
    },
    profile: {
      headline: 'Verify Your Academic Identity on Study Top (@username)',
      body: 'Build your academic portfolio with verified study hours, quiz mastery badges, and global subject rankings.',
      cta: 'Customize Handle',
      href: '#profile'
    }
  };

  const activeCopy = campaigns[slot] || campaigns.dashboard;

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all ${className}`}
      aria-label="Google Ads Sponsored Placement"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
            <span className="text-slate-600 font-bold">Sponsored · Google Ads</span>
            <span aria-hidden="true">·</span>
            <span>Publisher: {adConfig?.publisherEmail || 'manjitranjan180513@gmail.com'}</span>
          </div>
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{activeCopy.headline}</span>
          </h4>
          <p className="text-xs text-slate-600">{activeCopy.body}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={activeCopy.href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <span>{activeCopy.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Standard Google AdSense container for production AdSense script binding */}
      <ins
        className="adsbygoogle hidden"
        data-ad-client={adConfig?.adSenseClientId || 'ca-pub-studytop-manjitranjan'}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
