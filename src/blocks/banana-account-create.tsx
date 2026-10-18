import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { getNanoGeneratorContent } from '@/blocks/nano-site-content';
import { BananaComposer } from '@/components/banana-composer';
import { BananaGenerator } from '@/components/banana-generator';

export function BananaAccountCreate({
  generator = false,
}: {
  generator?: boolean;
}) {
  const { copy, recipes } = getNanoGeneratorContent(getLocale());
  if (generator)
    return (
      <div className="banana-account-generator">
        <BananaGenerator
          copy={copy}
          recipes={recipes}
          returnPath="/settings/generate"
          allModels
        />
      </div>
    );
  return (
    <>
      <BananaComposer
        recipes={recipes}
        copy={{
          title: m['account.create.title'](),
          intro: m['account.create.intro'](),
          placeholder: copy.placeholder,
          prompt: copy.prompt,
          attach: copy.reference,
          model: copy.model,
          continue: m['account.create.continue'](),
          note: m['account.create.note'](),
          library_intro: m['account.create.library_intro'](),
          library: m['account.create.library'](),
        }}
      />
    </>
  );
}
