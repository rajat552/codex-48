export const CHANNEL_DEFINITIONS = {
  social: {
    key: 'social',
    short: 'Social Media',
    full: 'Social Media (Instagram, LinkedIn, X)',
    category: 'Digital Social Networks',
    scopeDescription: 'Feeds, reels, stories, carousel posts, and sponsored advertisements across Instagram, LinkedIn, and X (Twitter).',
    rulesSummary: 'Evaluates hyperbolic wording, promotional condition validity (threshold qualifications), and required disclaimers.'
  },
  print: {
    key: 'print',
    short: 'Print Media',
    full: 'Print Media / Billboard',
    category: 'Physical & Out-of-Home',
    scopeDescription: 'Billboards, magazine spreads, physical posters, in-store displays, product packaging, and printed mailers.',
    rulesSummary: 'Enforces mandatory legal footnotes (*T&C apply), physical disclaimer contrast standards, and promotional eligibility statements.'
  },
  email: {
    key: 'email',
    short: 'Marketing Email',
    full: 'Marketing Email',
    category: 'Direct CRM & Lifecycle',
    scopeDescription: 'Email newsletters, automated onboarding sequences, promotional announcements, and re-engagement messaging.',
    rulesSummary: 'Verifies email subject line truthfulness, unsubscribes/T&C references, and claims evidence.'
  },
  web: {
    key: 'web',
    short: 'Web Landing Page',
    full: 'Web Landing Page',
    category: 'Digital Web Surfaces',
    scopeDescription: 'Public conversion landing pages, e-commerce product banners, homepage heroes, and microsites.',
    rulesSummary: 'Evaluates WCAG 2.2 AA visual contrast (4.5:1 text / 3:1 graphical minimums), alt-text, and product claims evidence.'
  },
  landing_page: {
    key: 'web',
    short: 'Web Landing Page',
    full: 'Web Landing Page',
    category: 'Digital Web Surfaces',
    scopeDescription: 'Public conversion landing pages, e-commerce product banners, homepage heroes, and microsites.',
    rulesSummary: 'Evaluates WCAG 2.2 AA visual contrast (4.5:1 text / 3:1 graphical minimums), alt-text, and product claims evidence.'
  },
  sms: {
    key: 'sms',
    short: 'SMS / Messaging',
    full: 'SMS / Messaging',
    category: 'Direct Push & Messaging',
    scopeDescription: 'Short promotional text messages, WhatsApp Business broadcasts, and push notifications.',
    rulesSummary: 'Enforces character length limits, required opt-out disclaimers, and prohibited predatory terminology.'
  },
  general: {
    key: 'general',
    short: 'General',
    full: 'General / All Channels',
    category: 'Omnichannel Universal',
    scopeDescription: 'Universal multi-channel assets deployed across web, print, email, and social networks simultaneously.',
    rulesSummary: 'Checked against all global active brand governance rules and foundational brand standards.'
  }
};

export function getChannelInfo(rawChannel) {
  if (!rawChannel) {
    return {
      key: 'all',
      short: 'All Channels',
      full: 'All Channels (General Scope)',
      category: 'Omnichannel',
      scopeDescription: 'Universal guidelines applied across all published marketing surfaces.',
      rulesSummary: 'All active workspace brand rules apply.'
    };
  }

  const normalized = String(rawChannel).trim().toLowerCase();
  if (CHANNEL_DEFINITIONS[normalized]) {
    return CHANNEL_DEFINITIONS[normalized];
  }

  if (normalized.includes('social') || normalized.includes('instagram') || normalized.includes('linkedin') || normalized.includes('twitter')) {
    return CHANNEL_DEFINITIONS.social;
  }
  if (normalized.includes('print') || normalized.includes('billboard')) {
    return CHANNEL_DEFINITIONS.print;
  }
  if (normalized.includes('email') || normalized.includes('newsletter')) {
    return CHANNEL_DEFINITIONS.email;
  }
  if (normalized.includes('web') || normalized.includes('landing') || normalized.includes('site')) {
    return CHANNEL_DEFINITIONS.web;
  }
  if (normalized.includes('sms') || normalized.includes('message') || normalized.includes('whatsapp')) {
    return CHANNEL_DEFINITIONS.sms;
  }

  const titleCase = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return {
    key: normalized,
    short: titleCase,
    full: `${titleCase} Distribution Channel`,
    category: 'Custom Channel Scope',
    scopeDescription: `Campaign materials configured for ${titleCase} publication.`,
    rulesSummary: `Checked against brand rules with ${titleCase} channel scope.`
  };
}
