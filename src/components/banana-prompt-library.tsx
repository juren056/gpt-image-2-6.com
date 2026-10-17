import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Heart, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/core/i18n/navigation';
import {
  filterPromptExamples,
  promptHandoff,
  type PromptCatalog,
  type PromptExample,
} from '@/lib/prompt-library';
import { SiteSelect } from '@/components/site-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const PAGE_SIZE = 24;
const FAVORITES_KEY = 'banana-prompt-favorites:v1';
export function BananaPromptLibrary({
  copy,
  catalog,
  loading,
  error,
  retry,
  publicView = false,
}: {
  copy: Record<string, string>;
  catalog: PromptCatalog;
  loading: boolean;
  error: boolean;
  retry: () => unknown;
  publicView?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [operation, setOperation] = useState('all');
  const [model, setModel] = useState('all');
  const [sort, setSort] = useState('featured');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PromptExample | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !catalog.items.length) return;
    const requested = new URLSearchParams(window.location.search).get('prompt');
    if (!requested) return;
    const item = catalog.items.find((candidate) => candidate.id === requested);
    if (item) setSelected(item);
  }, [catalog.items]);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || '[]'
      );
      if (Array.isArray(value))
        setFavorites(
          value
            .filter(
              (id): id is string =>
                typeof id === 'string' && /^prompt-[a-f0-9]{16}$/.test(id)
            )
            .slice(0, 10000)
        );
    } catch {
      /* Private browsing may disable persistent storage. */
    }
  }, []);
  const filtered = useMemo(
    () =>
      filterPromptExamples(
        catalog.items,
        { search, category, operation, model, sort, favoritesOnly },
        favorites
      ),
    [
      catalog.items,
      search,
      category,
      operation,
      model,
      sort,
      favoritesOnly,
      favorites,
    ]
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const models = [
    ...new Set(catalog.items.map((item) => item.sourceModel)),
  ].sort();
  const heading = publicView ? <h2>{copy.title}</h2> : <h1>{copy.title}</h1>;
  function reset() {
    setSearch('');
    setCategory('all');
    setOperation('all');
    setModel('all');
    setFavoritesOnly(false);
    setPage(1);
  }
  function toggleFavorite(item: PromptExample) {
    const next = favorites.includes(item.id)
      ? favorites.filter((id) => id !== item.id)
      : [...favorites, item.id];
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      toast.error(copy.storage_error);
    }
  }
  async function copyPrompt(item: PromptExample) {
    try {
      await navigator.clipboard.writeText(item.prompt);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copy_error);
    }
  }
  function usePrompt(item: PromptExample) {
    try {
      sessionStorage.setItem(
        'banana-account:handoff:v1',
        JSON.stringify(promptHandoff(item))
      );
      router.push('/settings/generate?resume=recipe');
    } catch {
      toast.error(copy.storage_error);
    }
  }
  const categoryLabel = (value: string) => copy[`category_${value}`] || value;
  return (
    <section
      className={`banana-workflows banana-prompt-library${publicView ? 'is-public' : ''}`}
      id="prompt-library"
    >
      <header className="banana-prompt-heading">
        <div>
          {heading}
          <p>{copy.body}</p>
        </div>
        <strong className="banana-prompt-total">
          {catalog.total.toLocaleString()} <span>{copy.results}</span>
        </strong>
      </header>
      <div className="banana-workflow-toolbar">
        <label className="banana-assets-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={copy.search}
            aria-label={copy.search}
          />
        </label>
        <label className="banana-workflow-select">
          {copy.type}
          <SiteSelect
            value={operation}
            onChange={(event) => {
              setOperation(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">{copy.all}</option>
            <option value="generate">{copy.generate}</option>
            <option value="edit">{copy.edit}</option>
          </SiteSelect>
        </label>
        <label className="banana-workflow-select">
          {copy.model}
          <SiteSelect
            value={model}
            onChange={(event) => {
              setModel(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">{copy.all}</option>
            {models.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SiteSelect>
        </label>
        <label className="banana-workflow-select">
          {copy.sort}
          <SiteSelect
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="featured">{copy.featured}</option>
            <option value="name">{copy.name}</option>
            <option value="newest">{copy.newest}</option>
          </SiteSelect>
        </label>
      </div>
      <div className="banana-workflow-categories">
        <button
          className={category === 'all' && !favoritesOnly ? 'active' : ''}
          aria-pressed={category === 'all' && !favoritesOnly}
          onClick={() => {
            setCategory('all');
            setFavoritesOnly(false);
            setPage(1);
          }}
        >
          {copy.all} <small>{catalog.total}</small>
        </button>
        {Object.entries(catalog.categories).map(([value, count]) => (
          <button
            key={value}
            className={category === value ? 'active' : ''}
            aria-pressed={category === value}
            onClick={() => {
              setCategory(value);
              setPage(1);
            }}
          >
            {categoryLabel(value)} <small>{count}</small>
          </button>
        ))}
        <button
          className={favoritesOnly ? 'active' : ''}
          aria-pressed={favoritesOnly}
          onClick={() => {
            setFavoritesOnly(!favoritesOnly);
            setPage(1);
          }}
        >
          <Heart size={14} />
          {copy.favorites} <small>{favorites.length}</small>
        </button>
      </div>
      <div className="banana-prompt-status" aria-live="polite">
        <span>
          {filtered.length.toLocaleString()} {copy.results} {copy.of}{' '}
          {catalog.total.toLocaleString()}
          {loading ? ` · ${copy.loading}` : ''}
        </span>
        {error && (
          <span role="alert">
            {copy.error} <button onClick={retry}>{copy.retry}</button>
          </span>
        )}
      </div>
      {!filtered.length ? (
        <div className="banana-assets-empty">
          <Search size={30} />
          <h2>{copy.no_matches}</h2>
          <button onClick={reset}>{copy.reset}</button>
        </div>
      ) : (
        <div className="banana-workflow-grid">
          {visible.map((item) => (
            <article key={item.id} className="banana-workflow-card">
              <div className="banana-workflow-image">
                <button
                  className="banana-prompt-preview"
                  aria-label={`${copy.details}: ${item.title}`}
                  onClick={() => setSelected(item)}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={Math.round((600 * item.height) / item.width)}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
                <span>{categoryLabel(item.category)}</span>
                <button
                  className={`banana-prompt-heart${favorites.includes(item.id) ? 'active' : ''}`}
                  aria-label={`${favorites.includes(item.id) ? copy.unfavorite : copy.favorite}: ${item.title}`}
                  aria-pressed={favorites.includes(item.id)}
                  onClick={() => toggleFavorite(item)}
                >
                  <Heart
                    size={17}
                    fill={favorites.includes(item.id) ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
              <div className="banana-workflow-card-body">
                <button
                  className="banana-prompt-title"
                  onClick={() => setSelected(item)}
                >
                  <h3>{item.title}</h3>
                </button>
                <div className="banana-prompt-credit">{item.sourceModel}</div>
                <p>{item.prompt}</p>
                <div className="banana-workflow-actions">
                  <button
                    className="banana-assets-primary"
                    onClick={() => usePrompt(item)}
                  >
                    <Sparkles size={16} />
                    {copy.use}
                  </button>
                  <button
                    aria-label={`${copy.copy}: ${item.title}`}
                    onClick={() => copyPrompt(item)}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <nav className="banana-prompt-pagination" aria-label={copy.results}>
        <button
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          {copy.previous}
        </button>
        <span>
          {currentPage} / {pages}
        </span>
        <button
          disabled={currentPage === pages}
          onClick={() => setPage(currentPage + 1)}
        >
          {copy.next}
        </button>
      </nav>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="banana-prompt-dialog">
          {selected && (
            <>
              <div className="banana-prompt-detail-image">
                <img
                  src={selected.originalImage}
                  alt={selected.title}
                  width={selected.width}
                  height={selected.height}
                />
                <a
                  href={selected.originalImage}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={14} />
                  {copy.original_image}
                </a>
              </div>
              <div className="banana-prompt-detail-body">
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{selected.sourceModel}</DialogDescription>
                <div className="banana-prompt-detail-meta">
                  <span>{categoryLabel(selected.category)}</span>
                  <span>
                    {selected.width} × {selected.height}
                  </span>
                </div>
                {selected.referenceRequired && (
                  <p className="banana-prompt-reference">
                    {copy.reference_hint}
                  </p>
                )}
                <pre>{selected.prompt}</pre>
                <p className="banana-prompt-adapt">{copy.adapt_hint}</p>
                <div className="banana-workflow-actions">
                  <button
                    className="banana-assets-primary"
                    onClick={() => usePrompt(selected)}
                  >
                    <Sparkles size={16} />
                    {copy.use}
                  </button>
                  <button
                    aria-label={copy.copy}
                    onClick={() => copyPrompt(selected)}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    aria-label={
                      favorites.includes(selected.id)
                        ? copy.unfavorite
                        : copy.favorite
                    }
                    aria-pressed={favorites.includes(selected.id)}
                    onClick={() => toggleFavorite(selected)}
                  >
                    <Heart
                      size={16}
                      fill={
                        favorites.includes(selected.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
