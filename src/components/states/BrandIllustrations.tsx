import React from 'react';

/**
 * Clean inline SVG brand illustrations using Radd's color palette:
 * Primary deep teal (#0F5E63), Accent amber (#F5A623), off-white (#F2F7F6).
 */

export const NotFoundIllustration: React.FC<{ className?: string }> = ({ className = 'w-40 h-40' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="20" y="30" width="160" height="140" rx="24" fill="var(--primary)" fillOpacity="0.08" stroke="var(--primary)" strokeWidth="3" strokeDasharray="6 6" />
    <circle cx="100" cy="90" r="36" fill="var(--surface)" stroke="var(--border)" strokeWidth="3" />
    <path d="M85 85L115 115M115 85L85 115" stroke="var(--danger)" strokeWidth="4" strokeLinecap="round" />
    <path d="M125 115L150 140" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" />
    <circle cx="50" cy="55" r="5" fill="var(--accent)" />
    <circle cx="155" cy="50" r="4" fill="var(--primary)" />
  </svg>
);

export const ServerErrorIllustration: React.FC<{ className?: string }> = ({ className = 'w-40 h-40' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="30" y="40" width="140" height="120" rx="20" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="3" />
    <rect x="45" y="60" width="110" height="20" rx="6" fill="var(--primary)" fillOpacity="0.1" />
    <circle cx="60" cy="70" r="4" fill="var(--accent)" />
    <circle cx="75" cy="70" r="4" fill="var(--primary)" />
    <circle cx="100" cy="115" r="24" fill="var(--danger)" fillOpacity="0.15" stroke="var(--danger)" strokeWidth="3" />
    <path d="M100 105V117M100 123V125" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const GoogleRevokedIllustration: React.FC<{ className?: string }> = ({ className = 'w-40 h-40' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="25" y="35" width="150" height="130" rx="24" fill="var(--primary)" fillOpacity="0.06" stroke="var(--border)" strokeWidth="3" />
    <circle cx="100" cy="85" r="32" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" />
    {/* Key or disconnected plug shape */}
    <path d="M88 85H112M100 73V97" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    <rect x="50" y="130" width="100" height="12" rx="6" fill="var(--primary)" fillOpacity="0.2" />
    <circle cx="100" cy="148" r="4" fill="var(--danger)" />
  </svg>
);

export const TrialEndedIllustration: React.FC<{ className?: string }> = ({ className = 'w-40 h-40' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="100" cy="100" r="70" fill="var(--accent)" fillOpacity="0.1" stroke="var(--accent)" strokeWidth="3" strokeDasharray="8 8" />
    <circle cx="100" cy="100" r="45" fill="var(--surface)" stroke="var(--border)" strokeWidth="3" />
    {/* Clock hands showing expired hour */}
    <path d="M100 75V100L118 110" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    <circle cx="100" cy="100" r="5" fill="var(--primary)" />
  </svg>
);

export const PermissionDeniedIllustration: React.FC<{ className?: string }> = ({ className = 'w-40 h-40' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="35" y="45" width="130" height="110" rx="20" fill="var(--surface-raised)" stroke="var(--border)" strokeWidth="3" />
    <rect x="70" y="80" width="60" height="50" rx="10" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="3" />
    <path d="M80 80V65C80 54 90 46 100 46C110 46 120 54 120 65V80" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="100" cy="105" r="4" fill="var(--primary)" />
  </svg>
);

export const NoReviewsIllustration: React.FC<{ className?: string }> = ({ className = 'w-40 h-40' }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="30" y="40" width="140" height="100" rx="18" fill="var(--primary)" fillOpacity="0.08" stroke="var(--border)" strokeWidth="3" />
    <path d="M60 140L45 160V140H30" fill="var(--surface)" />
    {/* Five stars in amber */}
    <circle cx="65" cy="75" r="5" fill="var(--accent)" />
    <circle cx="82.5" cy="75" r="5" fill="var(--accent)" />
    <circle cx="100" cy="75" r="5" fill="var(--accent)" />
    <circle cx="117.5" cy="75" r="5" fill="var(--accent)" />
    <circle cx="135" cy="75" r="5" fill="var(--accent)" />
    <rect x="55" y="100" width="90" height="10" rx="5" fill="var(--primary)" fillOpacity="0.2" />
  </svg>
);
