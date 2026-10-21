export type Locale = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export interface Translations {
  common: {
    appName: string;
    appNameArabic: string;
    tagline: string;
    loading: string;
    save: string;
    saved: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    done: string;
    retry: string;
    search: string;
    filter: string;
    status: string;
    actions: string;
    copy: string;
    copied: string;
    lightMode: string;
    darkMode: string;
    systemMode: string;
    language: string;
    arabic: string;
    english: string;
  };
  navigation: {
    dashboard: string;
    reviews: string;
    approvals: string;
    settings: string;
    onboarding: string;
    designSystem: string;
    logout: string;
  };
  reviews: {
    starCount: string;
    publishedOn: string;
    draftReply: string;
    approveReply: string;
    regenerate: string;
    approved: string;
    rejected: string;
    pendingApproval: string;
    edited: string;
    replyPlaceholder: string;
    noReviews: string;
    noReviewsDesc: string;
  };
  stats: {
    totalReviews: string;
    approvalRate: string;
    avgResponseTime: string;
    ratingAverage: string;
    trendUp: string;
    trendDown: string;
  };
  validation: {
    required: string;
    charLimit: string;
  };
}
