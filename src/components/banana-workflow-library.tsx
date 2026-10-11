import { useState } from 'react';
import { Copy, Search, Sparkles, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/core/i18n/navigation';

export type WorkflowRecipe = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  image: string;
  operation: 'generate' | 'edit';
};
export type WorkflowTool = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
};
export function BananaWorkflowLibrary({
  copy,
  recipes = [],
  tools = [],
  kind,
}: {
  copy: Record<string, string>;
  recipes?: WorkflowRecipe[];
  tools?: WorkflowTool[];
  kind: 'prompts' | 'skills' | 'tools';
}) {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [operation, setOperation] = useState('all');
  const [sort, setSort] = useState('featured');
  const isTools = kind === 'tools';
  const rows = isTools ? tools : recipes;
  const categories = [...new Set(rows.map((item) => item.category))];
  const filtered = rows.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      `${item.title} ${'description' in item ? item.description : item.prompt}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (isTools ||
        operation === 'all' ||
        ('operation' in item && item.operation === operation))
  );
  if (sort === 'name') filtered.sort((a, b) => a.title.localeCompare(b.title));
  function useRecipe(recipe: WorkflowRecipe) {
    try {
      sessionStorage.setItem(
        'banana-account:handoff:v1',
        JSON.stringify({
          prompt: recipe.prompt,
          model: 'nano-banana-2.1',
          operation: recipe.operation,
          imageUrls: [],
        })
      );
      router.push('/settings/generate?resume=recipe');
    } catch {
      toast.error(copy.storage_error);
    }
  }
  return (
    <section className={`banana-workflows banana-workflows-${kind}`}>
      <header>
        <h1>{copy[`${kind}_title`]}</h1>
        <p>{copy[`${kind}_body`]}</p>
      </header>
      <div className="banana-workflow-toolbar">
        <label className="banana-assets-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.search}
            aria-label={copy.search}
          />
        </label>
        {kind === 'prompts' && (
          <label className="banana-workflow-select">
            {copy.type}
            <select
              value={operation}
              onChange={(event) => setOperation(event.target.value)}
            >
              <option value="all">{copy.all}</option>
              <option value="generate">{copy.generate}</option>
              <option value="edit">{copy.edit}</option>
            </select>
          </label>
        )}
        <label className="banana-workflow-select">
          {copy.sort}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">{copy.featured}</option>
            <option value="name">{copy.name_sort}</option>
          </select>
        </label>
      </div>
      <div className="banana-workflow-categories" aria-label={copy.categories}>
        <button
          className={category === 'all' ? 'active' : ''}
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
        >
          {copy.all}
        </button>
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? 'active' : ''}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {copy[`category_${item}`] || item}
          </button>
        ))}
      </div>
      {!filtered.length ? (
        <div className="banana-assets-empty">
          <Search size={30} />
          <h2>{copy.no_matches}</h2>
          <p>{copy.search_hint}</p>
          <button
            onClick={() => {
              setCategory('all');
              setSearch('');
              setOperation('all');
            }}
          >
            {copy.reset}
          </button>
        </div>
      ) : (
        <div className="banana-workflow-grid">
          {filtered.map((item) => (
            <article key={item.id} className="banana-workflow-card">
              <div className="banana-workflow-image">
                <img src={item.image} alt="" loading="lazy" />
                <span>
                  {copy[`category_${item.category}`] || item.category}
                </span>
              </div>
              <div className="banana-workflow-card-body">
                <h2>{item.title}</h2>
                <p>{'description' in item ? item.description : item.prompt}</p>
                {isTools ? (
                  <Link
                    href={`/settings/studio?tool=${item.id}`}
                    className="banana-assets-primary"
                  >
                    <WandSparkles size={16} />
                    {copy.open_tool}
                  </Link>
                ) : (
                  <div className="banana-workflow-actions">
                    <button
                      className="banana-assets-primary"
                      onClick={() => useRecipe(item as WorkflowRecipe)}
                    >
                      <Sparkles size={16} />
                      {copy.use_prompt}
                    </button>
                    <button
                      aria-label={`${copy.copy}: ${item.title}`}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            (item as WorkflowRecipe).prompt
                          );
                          toast.success(copy.copied);
                        } catch {
                          toast.error(copy.copy_error);
                        }
                      }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="banana-workflow-note">
        {copy[isTools ? 'tools_note' : 'recipes_note']}
      </p>
    </section>
  );
}
