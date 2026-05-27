import { primaryCareContentRegistry } from '../data/primaryCareContentRegistry';
import { toLegacyReferralTemplate } from '../utils/requisitionGenerators';

export const primaryCareRequestTemplates = primaryCareContentRegistry.map(toLegacyReferralTemplate);
