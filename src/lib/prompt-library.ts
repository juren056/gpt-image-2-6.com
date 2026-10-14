export type PromptExample = {
  id: string;
  title: string;
  prompt: string;
  originalPrompt?: string;
  category: string;
  tags: readonly string[];
  image: string;
  originalImage: string;
  sourceImage: string;
  sourceModel: string;
  operation: 'generate' | 'edit';
  referenceRequired: boolean;
  author: string;
  authorUrl: string;
  sourceUrl: string;
  collection: string;
  collectionUrl: string;
  license: string;
  licenseUrl: string;
  changes: string;
  date: string;
  popularity: number;
  width: number;
  height: number;
};
export type PromptCatalog = {
  revision: string;
  total: number;
  categories: Record<string, number>;
  items: readonly PromptExample[];
};
export type PromptFilters = {
  search: string;
  category: string;
  operation: string;
  model: string;
  favoritesOnly: boolean;
  sort: string;
};
export function filterPromptExamples(
  items: readonly PromptExample[],
  filters: PromptFilters,
  favorites: readonly string[]
) {
  const words = filters.search
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const result = items.filter((item) => {
    const text =
      `${item.title} ${item.prompt} ${item.category} ${item.tags.join(' ')} ${item.author} ${item.sourceModel}`.toLocaleLowerCase();
    return (
      (filters.category === 'all' || item.category === filters.category) &&
      (filters.operation === 'all' || item.operation === filters.operation) &&
      (filters.model === 'all' || item.sourceModel === filters.model) &&
      (!filters.favoritesOnly || favorites.includes(item.id)) &&
      words.every((word) => text.includes(word))
    );
  });
  if (filters.sort === 'name')
    result.sort((a, b) => a.title.localeCompare(b.title));
  if (filters.sort === 'newest')
    result.sort(
      (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
    );
  return result;
}
export function promptHandoff(item: PromptExample) {
  return {
    prompt: item.prompt,
    model: 'nano-banana-2.1',
    operation: item.operation,
    aspectRatio: '1:1',
    resolution: '1K',
    outputCount: 1,
    imageUrls: [],
  };
}
