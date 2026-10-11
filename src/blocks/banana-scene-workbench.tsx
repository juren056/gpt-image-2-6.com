import { workflowCopy } from '@/blocks/workflow-copy';
import { BananaProjectResume } from '@/components/banana-project-resume';
import { BananaSceneWorkbench } from '@/components/banana-scene-workbench';

export function SceneWorkbench({ account = false }: { account?: boolean }) {
  const copy = workflowCopy();
  const scenes = [
    {
      id: 'product',
      title: copy.product_title,
      description: copy.product_description,
      prompt: copy.product_prompt,
      hint: copy.product_hint,
      href: '/blog/product-photo-prompts',
      ratio: '1:1',
      mode: 'edit' as const,
    },
    {
      id: 'character',
      title: copy.character_title,
      description: copy.character_description,
      prompt: copy.character_prompt,
      hint: copy.character_hint,
      href: '/blog/consistent-characters',
      ratio: '3:4',
      mode: 'edit' as const,
    },
    {
      id: 'social',
      title: copy.social_title,
      description: copy.social_description,
      prompt: copy.social_prompt,
      hint: copy.social_hint,
      href: '/prompts',
      ratio: '16:9',
      mode: 'generate' as const,
    },
    {
      id: 'poster',
      title: copy.poster_title,
      description: copy.poster_description,
      prompt: copy.poster_prompt,
      hint: copy.poster_hint,
      href: '/blog/readable-text-in-ai-images',
      ratio: '3:4',
      mode: 'generate' as const,
    },
    {
      id: 'science',
      title: copy.science_title,
      description: copy.science_description,
      prompt: copy.science_prompt,
      hint: copy.science_hint,
      href: '/scientific-figures',
      ratio: '4:3',
      mode: 'generate' as const,
    },
    {
      id: 'logo',
      title: copy.logo_title,
      description: copy.logo_description,
      prompt: copy.logo_prompt,
      hint: copy.logo_hint,
      href: '/logo',
      ratio: '1:1',
      mode: 'generate' as const,
    },
  ];
  return (
    <>
      {account && <BananaProjectResume copy={copy} />}
      <BananaSceneWorkbench
        scenes={scenes}
        heading={copy.title}
        intro={copy.intro}
        start={copy.start}
        guide={copy.guide}
        example={copy.example}
        account={account}
      />
    </>
  );
}
