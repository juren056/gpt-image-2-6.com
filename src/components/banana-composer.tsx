import { useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Clapperboard,
  FlaskConical,
  Images,
  Layers,
  Package,
  ShieldCheck,
  Sparkles,
  Type,
  Users,
} from 'lucide-react';
import { z } from 'zod';

import { Link, useRouter } from '@/core/i18n/navigation';
import { CREATIVE_MODELS } from '@/config/creative-studio';
import type { NanoRecipe } from '@/components/banana-generator';
import { ModelBrandTile } from '@/components/creative-visuals';
import { SiteSelect } from '@/components/site-select';

const recipeIcons = {
  product: Package,
  poster: Type,
  portrait: Users,
  edit: Layers,
  science: FlaskConical,
  story: Clapperboard,
};

export function BananaComposer({
  copy,
  recipes,
}: {
  copy: Record<string, string>;
  recipes: NanoRecipe[];
}) {
  const router = useRouter();
  const promptRef = useRef<HTMLTextAreaElement>(null);
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
      <div className="banana-composer__emblem" aria-hidden="true">
        <Sparkles size={25} />
      </div>
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
              ref={promptRef}
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
                <Images size={19} aria-hidden="true" />
              </Link>
            )}
          </form.Subscribe>
          <form.Field name="model">
            {(field) => (
              <div className="banana-composer__model">
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    pointerEvents: 'none',
                  }}
                >
                  <ModelBrandTile
                    modelId={field.state.value}
                    className="size-8"
                  />
                </span>
                <SiteSelect
                  aria-label={copy.model}
                  style={{ paddingLeft: 48 }}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </SiteSelect>
                <ChevronDown size={14} aria-hidden="true" />
              </div>
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
                <ArrowUp size={21} aria-hidden="true" />
              </button>
            )}
          </form.Subscribe>
        </div>
      </form>
      <p className="banana-composer__note">
        <ShieldCheck size={14} aria-hidden="true" />
        {copy.note}
      </p>
      <form.Subscribe selector={(s) => s.values.prompt}>
        {(prompt) => (
          <div className="banana-composer__recipes">
            {recipes.slice(0, 6).map((recipe) => {
              const Icon =
                recipeIcons[recipe.id as keyof typeof recipeIcons] || Sparkles;
              const selected = prompt === recipe.prompt;
              return (
                <button
                  key={recipe.id}
                  type="button"
                  data-recipe={recipe.id}
                  aria-pressed={selected}
                  onClick={() => {
                    form.setFieldValue('prompt', recipe.prompt);
                    promptRef.current?.focus();
                  }}
                >
                  <span className="banana-composer__recipe-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="banana-composer__recipe-title">
                    {recipe.title}
                  </span>
                  {selected ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={15} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </form.Subscribe>
      <p className="banana-composer__library">
        {copy.library_intro}{' '}
        <Link href="/settings/prompts">
          <BookOpen size={15} aria-hidden="true" />
          {copy.library}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </p>
    </section>
  );
}
