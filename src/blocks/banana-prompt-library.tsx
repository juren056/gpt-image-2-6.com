import { useQuery } from '@tanstack/react-query';

import { tDynamic } from '@/core/i18n/dynamic';
import { PROMPT_LIBRARY_MANIFEST } from '@/config/prompt-library-manifest';
import { apiGet } from '@/lib/api-client';
import type { PromptCatalog } from '@/lib/prompt-library';
import { BananaPromptLibrary } from '@/components/banana-prompt-library';

import '@/styles/banana-assets.css';
import '@/styles/banana-prompt-library.css';

const keys = [
  'title',
  'body',
  'search',
  'all',
  'type',
  'generate',
  'edit',
  'sort',
  'featured',
  'name',
  'newest',
  'model',
  'favorites',
  'favorite',
  'unfavorite',
  'details',
  'copy',
  'copied',
  'copy_error',
  'use',
  'results',
  'of',
  'previous',
  'next',
  'no_matches',
  'reset',
  'loading',
  'error',
  'retry',
  'source',
  'creator',
  'original_image',
  'community',
  'reference_hint',
  'adapt_hint',
  'attribution',
  'changes',
  'storage_error',
  'category_Photography',
  'category_Illustration',
  'category_Ecommerce',
  'category_Food',
  'category_Social',
  'category_Design',
  'category_Architecture',
  'category_Brand',
  'category_Science',
  'category_Characters',
] as const;

export function AccountPromptLibrary({
  publicView = false,
}: {
  publicView?: boolean;
}) {
  const query = useQuery({
    queryKey: ['community-prompt-library', PROMPT_LIBRARY_MANIFEST.revision],
    queryFn: () =>
      apiGet<PromptCatalog>(
        `/data/prompt-library-v1.json?v=${PROMPT_LIBRARY_MANIFEST.revision}`
      ),
    initialData: () =>
      ({
        ...PROMPT_LIBRARY_MANIFEST,
        items: PROMPT_LIBRARY_MANIFEST.featured,
      }) as PromptCatalog,
    initialDataUpdatedAt: 0,
    staleTime: Infinity,
    refetchOnMount: 'always',
    retry: 1,
  });
  return (
    <BananaPromptLibrary
      copy={Object.fromEntries(
        keys.map((key) => [key, tDynamic(`prompt_library.${key}`)])
      )}
      catalog={query.data}
      loading={query.isFetching}
      error={query.isError}
      retry={() => query.refetch()}
      publicView={publicView}
    />
  );
}
