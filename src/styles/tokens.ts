export const radiologyCockpitTokens = {
  colors: {
    core: {
      deepNavy: '#0B1220',
      slate: '#111827',
      background: '#F6F8FB',
      surface: '#FFFFFF',
      border: '#D8E0EA',
      muted: '#64748B',
    },
    semantic: {
      primary: '#2563EB',
      accent: '#06B6D4',
      calculator: '#4F46E5',
      followUp: '#F59E0B',
      normal: '#10B981',
      urgent: '#EF4444',
    },
    states: {
      radiology: '#2563EB',
      calculator: '#4F46E5',
      followUp: '#F59E0B',
      normal: '#10B981',
      urgent: '#EF4444',
      safety: '#F59E0B',
      draft: '#64748B',
      reviewed: '#10B981',
      validated: '#06B6D4',
    },
  },
  badges: {
    implemented: 'normal',
    planned: 'draft',
    draft: 'draft',
    needsReview: 'followUp',
    reviewed: 'normal',
    calculator: 'calculator',
    followUp: 'followUp',
    normal: 'normal',
    urgent: 'urgent',
    prototype: 'followUp',
  },
  cards: {
    radiologyCard: 'radiology',
    calculatorCard: 'calculator',
    followUpCard: 'followUp',
    urgentCard: 'urgent',
    normalCard: 'normal',
  },
} as const;

export type RadiologyCockpitTokens = typeof radiologyCockpitTokens;
