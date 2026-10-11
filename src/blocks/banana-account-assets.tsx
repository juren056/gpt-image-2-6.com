import { tDynamic } from '@/core/i18n/dynamic';
import { PUBLIC_TOOL_PAGES } from '@/config/public-creative';
import { getLocale } from '@/paraglide/runtime.js';
import { AccountPromptLibrary } from '@/blocks/banana-prompt-library';
import { nanoSiteText } from '@/blocks/nano-site-messages';
import { BananaAssets } from '@/components/banana-assets';
import {
  BananaWorkflowLibrary,
  type WorkflowRecipe,
} from '@/components/banana-workflow-library';

import '@/styles/banana-assets.css';

const keys = [
  'my_assets',
  'all',
  'favorites',
  'history',
  'collections',
  'new_collection',
  'library_hint',
  'items',
  'search',
  'refresh',
  'projects',
  'retry',
  'no_projects',
  'generations',
  'loading',
  'error',
  'no_matches',
  'empty_title',
  'empty_body',
  'search_hint',
  'create',
  'open',
  'favorite',
  'unfavorite',
  'load_more',
  'library_error',
  'detail',
  'fullscreen',
  'regenerate',
  'regenerate_hint',
  'reference',
  'download',
  'collection',
  'none',
  'prompt',
  'copy',
  'copied',
  'copy_error',
  'model',
  'credits',
  'created',
  'status',
  'status_success',
  'status_failed',
  'status_canceled',
  'status_pending',
  'status_processing',
  'collection_hint',
  'collection_name',
  'saving',
  'save',
  'preview',
  'storage_error',
  'prompts_title',
  'prompts_body',
  'skills_title',
  'skills_body',
  'tools_title',
  'tools_body',
  'type',
  'generate',
  'edit',
  'sort',
  'featured',
  'name_sort',
  'categories',
  'category_Brand',
  'category_Ecommerce',
  'category_Social',
  'category_Characters',
  'category_Science',
  'category_Create',
  'category_Product',
  'category_Enhance',
  'category_Design',
  'category_Workflow',
  'reset',
  'open_tool',
  'use_prompt',
  'recipes_note',
  'tools_note',
] as const;
export function accountAssetsCopy() {
  return Object.fromEntries(
    [
      ...keys,
      'upscale',
      'remove_background',
      'trash',
      'kinds',
      'character',
      'product',
      'style',
      'restore',
      'move_trash',
      'kind',
      'unclassified',
    ].map((key) => [key, tDynamic(`account_assets.${key}`)])
  );
}
export function AccountAssets({ history = false }: { history?: boolean }) {
  return <BananaAssets copy={accountAssetsCopy()} history={history} />;
}
export function AccountWorkflowLibrary({
  kind,
}: {
  kind: 'prompts' | 'skills' | 'tools';
}) {
  if (kind === 'prompts') return <AccountPromptLibrary />;
  const locale = getLocale() === 'zh' ? 'zh' : 'en';
  const definitions = [
    ['product', 'Ecommerce', '/imgs/showcase/cobalt-perfume.webp'],
    ['poster', 'Social', '/imgs/tool-cards/ai-image-generator.webp'],
    ['portrait', 'Characters', '/images/workflows/case-character.svg'],
    ['edit', 'Characters', '/imgs/seo/ecommerce-campaign-board.webp'],
    ['science', 'Science', '/imgs/showcase/cliff-library.webp'],
    ['story', 'Social', '/images/workflows/case-social.svg'],
    ['logo', 'Brand', '/imgs/tool-cards/ai-logo-generator.webp'],
  ];
  const recipes: WorkflowRecipe[] = definitions.map(
    ([id, category, image]) => ({
      id,
      category,
      image,
      title: nanoSiteText(`prompt_${id}`, locale),
      prompt: nanoSiteText(`prompt_${id}_body`, locale),
      operation: id === 'edit' ? 'edit' : 'generate',
    })
  );
  const tools = PUBLIC_TOOL_PAGES.map((tool) => ({
    id: tool.id,
    category: tool.category,
    image: tool.cardImage,
    title: tDynamic(`account_assets.tool_${tool.id}_title`),
    description: tDynamic(`account_assets.tool_${tool.id}_body`),
  }));
  return (
    <BananaWorkflowLibrary
      copy={accountAssetsCopy()}
      kind={kind}
      recipes={recipes}
      tools={tools}
    />
  );
}
