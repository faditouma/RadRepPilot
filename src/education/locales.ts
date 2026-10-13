// UI localization scaffold. Clinical content has its own locale and approval workflow.
export const educationLabels = {
 'en-CA': {navigation:['Dashboard','Report a Case','Choose Imaging','Learning Library','Review Queue','Progress','Editorial'],profiles:{student:'Medical student',resident:'Radiology resident',referrer:'GP / referring clinician'}},
} as const;
export type EducationLocale = keyof typeof educationLabels;
