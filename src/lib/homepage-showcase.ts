export type CommunityShowcaseItem = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
  category: string;
  sourceModel: string;
  kind: 'community';
};

export type SiteTestShowcaseItem = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
  category: string;
  sourceModel: string;
  kind: 'site-test';
  originalOutput: string;
  prompt: string;
  operation: string;
  aspectRatio?: string;
  resolution: string;
  inputs: string[];
};

export type HomepageShowcaseItem = CommunityShowcaseItem | SiteTestShowcaseItem;

export type HomepageShowcaseCatalog = {
  revision: string;
  total: number;
  items: CommunityShowcaseItem[];
};

export function mixHomepageShowcase(
  community: readonly CommunityShowcaseItem[],
  siteTests: readonly SiteTestShowcaseItem[]
): HomepageShowcaseItem[] {
  if (!community.length) return [...siteTests];
  const result: HomepageShowcaseItem[] = [...community];
  const interval = Math.max(1, Math.floor(result.length / siteTests.length));
  siteTests.forEach((item, index) => {
    result.splice(Math.min(index * interval, result.length), 0, item);
  });
  return result;
}

export function wrapShowcaseIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}
