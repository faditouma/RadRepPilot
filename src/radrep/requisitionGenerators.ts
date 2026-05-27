import { primaryCareContentRegistry } from '../data/primaryCareContentRegistry';
import {
  generateReferralText,
  getMissingEssentials,
  getPrimaryCareTemplate,
  toLegacyReferralTemplate,
} from '../utils/requisitionGenerators';

export { generateReferralText };

export function getReferralTemplate(requestType: string) {
  return toLegacyReferralTemplate(getPrimaryCareTemplate(requestType));
}

export function getMissingReferralFields(form: Parameters<typeof getMissingEssentials>[0]): string[] {
  return getMissingEssentials(form);
}

export const referralTemplates = primaryCareContentRegistry.map(toLegacyReferralTemplate);
