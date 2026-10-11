import { useForm } from '@tanstack/react-form';
import { ArrowUp, Images, SlidersHorizontal } from 'lucide-react';
import { z } from 'zod';

import { Link, useRouter } from '@/core/i18n/navigation';
import { CREATIVE_MODELS } from '@/config/creative-studio';
import type { NanoRecipe } from '@/components/banana-generator';

export function BananaComposer({
  copy,
  recipes,
}: {
  copy: Record<string, string>;
  recipes: NanoRecipe[];
}) {
  const router = useRouter();
  const form = useForm({
    defaultValues: { prompt: '', model: 'nano-banana-2.1' },
    validators: {
      onSubmit: z.object({
        prompt: z.string().trim().min(1).max(32000),
        model: z.string(),
      }),
    },
    onSubmit: ({ value }) => {
      router.push(
        `/settings/generate?prompt=${encodeURIComponent(value.prompt.trim())}&model=${encodeURIComponent(value.model)}`
      );
    },
  });
  const models = CREATIVE_MODELS.filter(
    (model) => model.id.startsWith('nano-banana') && model.productionEnabled
  );
  return (
    <section className="banana-composer">
      <h2>{copy.title}</h2>
      <p className="banana-composer__intro">{copy.intro}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="banana-composer__form"
      >
        <form.Field name="prompt">
          {(field) => (
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={copy.placeholder}
              aria-label={copy.prompt}
              maxLength={32000}
              rows={3}
            />
          )}
        </form.Field>
        <div className="banana-composer__controls">
          <form.Subscribe selector={(s) => s.values.prompt}>
            {(prompt) => (
              <Link
                href={`/settings/generate?mode=edit&prompt=${encodeURIComponent(prompt)}`}
                className="banana-composer__attach"
                aria-label={copy.attach}
              >
                <Images size={18} />
              </Link>
            )}
          </form.Subscribe>
          <SlidersHorizontal size={15} aria-hidden />
          <form.Field name="model">
            {(field) => (
              <select
                aria-label={copy.model}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            )}
          </form.Field>
          <form.Subscribe selector={(s) => s.values.prompt}>
            {(prompt) => (
              <button
                type="submit"
                className="banana-composer__send"
                disabled={!prompt.trim()}
                aria-label={copy.continue}
              >
                <ArrowUp size={19} />
              </button>
            )}
          </form.Subscribe>
        </div>
      </form>
      <p className="banana-composer__note">{copy.note}</p>
      <div className="banana-composer__recipes">
        {recipes.slice(0, 6).map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            onClick={() => form.setFieldValue('prompt', recipe.prompt)}
          >
            {recipe.title}
          </button>
        ))}
      </div>
      <p className="banana-composer__library">
        {copy.library_intro}{' '}
        <Link href="/settings/prompts">{copy.library}</Link>
      </p>
    </section>
  );
}
