import type { PageKey } from '../radrep/types';

export const defaultWorkspacePage: PageKey = 'referral';

export const workspacePageSlugs: Partial<Record<PageKey, string>> = {
  dashboard: 'overview',
  modules: 'reporting',
  calculators: 'calculators',
  referral: 'requisitions',
  imagingGuide: 'imaging-guide',
  builder: 'report-builder',
  gallery: 'examples',
  drafts: 'local-drafts',
  safety: 'safety',
};

const workspaceSlugPages = new Map<string, PageKey>(
  Object.entries(workspacePageSlugs).map(([page, slug]) => [slug, page as PageKey]),
);

export function workspaceSlugToPage(slug?: string): PageKey {
  if (!slug) return defaultWorkspacePage;
  return workspaceSlugPages.get(slug) ?? defaultWorkspacePage;
}

export function workspacePageToRoutePath(page: PageKey): string {
  const slug = workspacePageSlugs[page] ?? workspacePageSlugs[defaultWorkspacePage];
  return slug === workspacePageSlugs[defaultWorkspacePage] ? '/workspace/requisitions' : `/workspace/${slug}`;
}

export function workspacePageToHashPath(page: PageKey): string {
  return `#${workspacePageToRoutePath(page)}`;
}
