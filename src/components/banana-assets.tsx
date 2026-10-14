import { useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Copy,
  Download,
  Folder,
  FolderPlus,
  ImageIcon,
  Loader2,
  Maximize2,
  Package,
  Palette,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Undo2,
  User,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import { normalizeGeneratorDraft } from '@/lib/generator-entry';
import { TextField } from '@/components/form-field';
import { SiteSelect } from '@/components/site-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AssetTask = {
  id: string;
  prompt: string;
  model: string;
  status: string;
  costCredits: number;
  createdAt: string;
  images: Array<{ imageUrl?: string }>;
  options?: Record<string, string | number>;
  errorMessage?: string;
};
type LibraryItem = {
  taskId: string;
  favorite: boolean;
  collectionId: string | null;
  trashed: boolean;
  kind: 'character' | 'product' | 'style' | null;
};
type Library = {
  items: LibraryItem[];
  collections: Array<{ id: string; name: string }>;
};
type Project = { id: string; title: string; image: string; updatedAt: string };
const terminal = ['success', 'failed', 'canceled'];

export function BananaAssets({
  copy,
  history = false,
}: {
  copy: Record<string, string>;
  history?: boolean;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const detailRef = useRef<HTMLElement | null>(null);
  const tasksQuery = useInfiniteQuery({
    queryKey: ['account-assets', userId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiGet<{ items: AssetTask[] }>(`/api/images/?page=${pageParam}&limit=50`),
    getNextPageParam: (last, pages) =>
      last.items.length === 50 ? pages.length + 1 : undefined,
    enabled: Boolean(userId),
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) =>
        page.items.some((task) => !terminal.includes(task.status))
      )
        ? 5000
        : false,
  });
  const library = useQuery({
    queryKey: ['account-library', userId],
    queryFn: () => apiGet<Library>('/api/assets/library'),
    enabled: Boolean(userId),
  });
  const projects = useQuery({
    queryKey: ['account-projects', userId],
    queryFn: () => apiGet<Project[]>('/api/studio/projects'),
    enabled: Boolean(userId),
  });
  const update = useMutation({
    mutationFn: (item: LibraryItem) =>
      apiPost<LibraryItem>('/api/assets/library', { action: 'item', ...item }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['account-library', userId] }),
    onError: (error: Error) => toast.error(error.message),
  });
  const form = useForm({
    defaultValues: { name: '' },
    validators: {
      onSubmit: z.object({ name: z.string().trim().min(1).max(60) }),
    },
    onSubmit: async ({ value }) => {
      try {
        const collection = await apiPost<{ id: string }>(
          '/api/assets/library',
          { action: 'collection', name: value.name }
        );
        await queryClient.invalidateQueries({
          queryKey: ['account-library', userId],
        });
        setCollectionOpen(false);
        setFilter(collection.id);
        form.reset();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : copy.error);
      }
    },
  });
  const tasks = tasksQuery.data?.pages.flatMap((page) => page.items) || [];
  const items = new Map(
    (library.data?.items || []).map((item) => [item.taskId, item])
  );
  const visible = tasks.filter((task) => {
    const item = items.get(task.id);
    return (
      (filter === 'trash'
        ? item?.trashed
        : !item?.trashed &&
          (filter === 'all' ||
            (filter === 'favorites'
              ? item?.favorite
              : ['character', 'product', 'style'].includes(filter)
                ? item?.kind === filter
                : item?.collectionId === filter))) &&
      `${task.prompt} ${task.model}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  const selected = visible.find((task) => task.id === selectedId) || visible[0];
  const selectedMeta = selected
    ? items.get(selected.id) || {
        taskId: selected.id,
        favorite: false,
        collectionId: null,
        trashed: false,
        kind: null,
      }
    : undefined;
  const title = [
    'favorites',
    'trash',
    'character',
    'product',
    'style',
  ].includes(filter)
    ? copy[filter]
    : library.data?.collections.find((collection) => collection.id === filter)
        ?.name || copy.all;
  const loading = tasksQuery.isPending && Boolean(userId);

  function continueAsset(task: AssetTask, reference: boolean) {
    try {
      const urls = task.images
        .map((image) => image.imageUrl)
        .filter((url): url is string =>
          Boolean(url && /^https?:\/\//.test(url))
        );
      sessionStorage.setItem(
        'banana-account:handoff:v1',
        JSON.stringify(
          normalizeGeneratorDraft(
            {
              prompt: task.prompt,
              model: task.model,
              operation: reference ? 'edit' : 'generate',
              aspectRatio: task.options?.aspect_ratio,
              resolution: task.options?.resolution,
              outputCount: task.options?.num_images ?? 1,
              imageUrls: reference ? urls : [],
            },
            'nano-banana-2.1',
            true
          )
        )
      );
      void router.push('/settings/generate?resume=asset');
    } catch {
      toast.error(copy.storage_error);
    }
  }
  async function copyPrompt(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copy_error);
    }
  }

  return (
    <div className={`banana-assets ${history ? 'is-history' : ''}`}>
      {!history && (
        <aside className="banana-assets-nav">
          <div className="banana-assets-nav-title">
            <h2>{copy.my_assets}</h2>
            <button
              type="button"
              title={copy.new_collection}
              aria-label={copy.new_collection}
              onClick={() => setCollectionOpen(true)}
            >
              <FolderPlus size={18} />
            </button>
          </div>
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            <ImageIcon size={18} />
            {copy.all}
            <span>
              {tasks.filter((task) => !items.get(task.id)?.trashed).length}
              {tasksQuery.hasNextPage ? '+' : ''}
            </span>
          </button>
          <button
            className={filter === 'favorites' ? 'active' : ''}
            onClick={() => setFilter('favorites')}
          >
            <Star size={18} />
            {copy.favorites}
            <span>
              {
                tasks.filter(
                  (task) =>
                    items.get(task.id)?.favorite && !items.get(task.id)?.trashed
                ).length
              }
            </span>
          </button>
          <Link href="/settings/history">
            <RefreshCw size={18} />
            {copy.history}
          </Link>
          <button
            className={filter === 'trash' ? 'active' : ''}
            onClick={() => setFilter('trash')}
          >
            <Trash2 size={18} />
            {copy.trash}
            <span>
              {tasks.filter((task) => items.get(task.id)?.trashed).length}
            </span>
          </button>
          <div className="banana-assets-nav-title collections">
            <span>{copy.kinds}</span>
          </div>
          {(
            [
              { id: 'character', Icon: User },
              { id: 'product', Icon: Package },
              { id: 'style', Icon: Palette },
            ] as const
          ).map(({ id, Icon }) => (
            <button
              className={filter === id ? 'active' : ''}
              key={id}
              onClick={() => setFilter(id)}
            >
              <Icon size={18} />
              {copy[id]}
              <span>
                {
                  tasks.filter(
                    (task) =>
                      !items.get(task.id)?.trashed &&
                      items.get(task.id)?.kind === id
                  ).length
                }
              </span>
            </button>
          ))}
          <div className="banana-assets-nav-title collections">
            <span>{copy.collections}</span>
            <button
              type="button"
              aria-label={copy.new_collection}
              onClick={() => setCollectionOpen(true)}
            >
              <FolderPlus size={16} />
            </button>
          </div>
          {(library.data?.collections || []).map((collection) => (
            <button
              key={collection.id}
              className={filter === collection.id ? 'active' : ''}
              onClick={() => setFilter(collection.id)}
            >
              <Folder size={17} />
              <span className="collection-name">{collection.name}</span>
            </button>
          ))}
          {!library.data?.collections.length && (
            <button className="muted" onClick={() => setCollectionOpen(true)}>
              <FolderPlus size={17} />
              {copy.new_collection}
            </button>
          )}
          <p className="banana-assets-note">{copy.library_hint}</p>
        </aside>
      )}
      <section className="banana-assets-main">
        <div className="banana-assets-heading">
          <h1>{history ? copy.history : title}</h1>
          <span>
            {visible.length}
            {tasksQuery.hasNextPage ? '+' : ''} {copy.items}
          </span>
        </div>
        <div className="banana-assets-search">
          <Search size={18} />
          <input
            aria-label={copy.search}
            placeholder={copy.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            aria-label={copy.refresh}
            type="button"
            onClick={() => void tasksQuery.refetch()}
            disabled={tasksQuery.isFetching}
          >
            <RefreshCw
              size={17}
              className={tasksQuery.isFetching ? 'animate-spin' : ''}
            />
          </button>
        </div>
        {history && (
          <div className="banana-projects">
            <h2>{copy.projects}</h2>
            {projects.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : projects.isError ? (
              <button onClick={() => void projects.refetch()}>
                {copy.retry}
              </button>
            ) : projects.data?.length ? (
              <div className="banana-project-grid">
                {projects.data
                  .filter((project) =>
                    project.title.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((project) => (
                    <Link
                      href={`/settings/studio?project=${encodeURIComponent(project.id)}`}
                      key={project.id}
                      className="banana-project-card"
                    >
                      {project.image ? (
                        <img src={project.image} alt="" loading="lazy" />
                      ) : (
                        <Folder size={26} />
                      )}
                      <strong>{project.title}</strong>
                      <span>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
              </div>
            ) : (
              <p>{copy.no_projects}</p>
            )}
          </div>
        )}
        {history && (
          <h2 className="banana-history-subtitle">{copy.generations}</h2>
        )}
        {loading ? (
          <div className="banana-assets-empty" role="status">
            <Loader2 className="animate-spin" />
            <p>{copy.loading}</p>
          </div>
        ) : tasksQuery.isError ? (
          <div className="banana-assets-empty" role="alert">
            <p>{copy.error}</p>
            <button onClick={() => void tasksQuery.refetch()}>
              {copy.retry}
            </button>
          </div>
        ) : !visible.length ? (
          <div className="banana-assets-empty">
            <ImageIcon size={36} />
            <h2>
              {search || filter !== 'all' ? copy.no_matches : copy.empty_title}
            </h2>
            <p>
              {search || filter !== 'all' ? copy.search_hint : copy.empty_body}
            </p>
            <Link className="banana-assets-primary" href="/settings/generate">
              {copy.create}
            </Link>
          </div>
        ) : (
          <div className="banana-asset-grid">
            {visible.map((task) => (
              <div
                className={`banana-asset-card ${selected?.id === task.id ? 'selected' : ''}`}
                key={task.id}
              >
                <button
                  className="banana-asset-open"
                  aria-label={`${copy.open}: ${task.prompt}`}
                  onClick={() => {
                    setSelectedId(task.id);
                    if (window.matchMedia('(max-width: 1100px)').matches)
                      requestAnimationFrame(() => {
                        detailRef.current?.scrollIntoView({
                          behavior: window.matchMedia(
                            '(prefers-reduced-motion: reduce)'
                          ).matches
                            ? 'instant'
                            : 'smooth',
                          block: 'start',
                        });
                        detailRef.current?.focus({ preventScroll: true });
                      });
                  }}
                >
                  {task.images[0]?.imageUrl ? (
                    <img
                      src={task.images[0].imageUrl}
                      alt={task.prompt}
                      loading="lazy"
                    />
                  ) : (
                    <div className="banana-asset-placeholder">
                      {!terminal.includes(task.status) ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <ImageIcon />
                      )}
                      <span>
                        {copy[`status_${task.status}`] || task.status}
                      </span>
                    </div>
                  )}
                  <span className="banana-asset-card-caption">
                    {task.prompt}
                  </span>
                </button>
                {library.data && (
                  <button
                    className={`banana-asset-star ${items.get(task.id)?.favorite ? 'active' : ''}`}
                    aria-label={
                      items.get(task.id)?.favorite
                        ? copy.unfavorite
                        : copy.favorite
                    }
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({
                        taskId: task.id,
                        favorite: !items.get(task.id)?.favorite,
                        collectionId: items.get(task.id)?.collectionId || null,
                        kind: items.get(task.id)?.kind || null,
                        trashed: Boolean(items.get(task.id)?.trashed),
                      })
                    }
                  >
                    <Star
                      size={16}
                      fill={
                        items.get(task.id)?.favorite ? 'currentColor' : 'none'
                      }
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {tasksQuery.hasNextPage && (
          <button
            className="banana-assets-load"
            onClick={() => void tasksQuery.fetchNextPage()}
            disabled={tasksQuery.isFetchingNextPage}
          >
            {tasksQuery.isFetchingNextPage ? copy.loading : copy.load_more}
          </button>
        )}
        {library.isError && (
          <div className="banana-assets-notice" role="alert">
            {copy.library_error}
            <button onClick={() => void library.refetch()}>{copy.retry}</button>
          </div>
        )}
      </section>
      {selected && (
        <aside
          className="banana-assets-detail"
          aria-label={copy.detail}
          ref={detailRef}
          tabIndex={-1}
        >
          <div className="banana-assets-preview">
            {selected.images[0]?.imageUrl ? (
              <>
                <img src={selected.images[0].imageUrl} alt={selected.prompt} />
                <button
                  type="button"
                  aria-label={copy.fullscreen}
                  onClick={() => setPreviewOpen(true)}
                >
                  <Maximize2 size={18} />
                </button>
              </>
            ) : (
              <div className="banana-asset-placeholder">
                <ImageIcon />
                <span>
                  {copy[`status_${selected.status}`] || selected.status}
                </span>
              </div>
            )}
          </div>
          {!selectedMeta?.trashed && (
            <button
              className="banana-assets-regenerate"
              onClick={() => continueAsset(selected, false)}
            >
              <RefreshCw size={17} />
              <span>
                <strong>{copy.regenerate}</strong>
                <small>{copy.regenerate_hint}</small>
              </span>
            </button>
          )}
          {!selectedMeta?.trashed && selected.images[0]?.imageUrl && (
            <div className="banana-assets-actions">
              <button onClick={() => continueAsset(selected, true)}>
                <WandSparkles size={16} />
                {copy.reference}
              </button>
              <a
                href={`/api/images/${encodeURIComponent(selected.id)}/download`}
              >
                <Download size={16} />
                {copy.download}
              </a>
              <Link
                href={`/settings/studio?tool=T10&sourceTask=${encodeURIComponent(selected.id)}`}
              >
                {copy.upscale}
              </Link>
              <Link
                href={`/settings/studio?tool=T03&sourceTask=${encodeURIComponent(selected.id)}`}
              >
                {copy.remove_background}
              </Link>
            </div>
          )}
          {selectedMeta && library.data && (
            <div className="banana-assets-organize">
              <button
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({
                    ...selectedMeta,
                    trashed: !selectedMeta.trashed,
                  })
                }
              >
                {selectedMeta.trashed ? (
                  <Undo2 size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
                {selectedMeta.trashed ? copy.restore : copy.move_trash}
              </button>
              <button
                className={selectedMeta.favorite ? 'active' : ''}
                aria-label={
                  selectedMeta.favorite ? copy.unfavorite : copy.favorite
                }
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({
                    ...selectedMeta,
                    favorite: !selectedMeta.favorite,
                  })
                }
              >
                <Star
                  size={18}
                  fill={selectedMeta.favorite ? 'currentColor' : 'none'}
                />
                {copy.favorites}
              </button>
              <label>
                {copy.kind}
                <SiteSelect
                  value={selectedMeta.kind || ''}
                  disabled={update.isPending}
                  onChange={(event) =>
                    update.mutate({
                      ...selectedMeta,
                      kind: event.target.value
                        ? (event.target.value as LibraryItem['kind'])
                        : null,
                    })
                  }
                >
                  <option value="">{copy.unclassified}</option>
                  {['character', 'product', 'style'].map((kind) => (
                    <option value={kind} key={kind}>
                      {copy[kind]}
                    </option>
                  ))}
                </SiteSelect>
              </label>
              <label>
                {copy.collection}
                <SiteSelect
                  value={selectedMeta.collectionId || ''}
                  disabled={update.isPending}
                  onChange={(event) =>
                    update.mutate({
                      ...selectedMeta,
                      collectionId: event.target.value || null,
                    })
                  }
                >
                  <option value="">{copy.none}</option>
                  {library.data.collections.map((collection) => (
                    <option value={collection.id} key={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </SiteSelect>
              </label>
            </div>
          )}
          <div className="banana-assets-prompt">
            <div>
              <span>{copy.prompt}</span>
              <button onClick={() => void copyPrompt(selected.prompt)}>
                <Copy size={14} />
                {copy.copy}
              </button>
            </div>
            <p>{selected.prompt}</p>
          </div>
          <dl className="banana-assets-meta">
            <div>
              <dt>{copy.model}</dt>
              <dd>{selected.model}</dd>
            </div>
            <div>
              <dt>{copy.credits}</dt>
              <dd>{selected.costCredits}</dd>
            </div>
            <div>
              <dt>{copy.created}</dt>
              <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>{copy.status}</dt>
              <dd>{copy[`status_${selected.status}`] || selected.status}</dd>
            </div>
          </dl>
          {selected.errorMessage && (
            <p role="alert" className="banana-assets-notice">
              {selected.errorMessage}
            </p>
          )}
        </aside>
      )}
      <Dialog open={collectionOpen} onOpenChange={setCollectionOpen}>
        <DialogContent className="banana-account banana-assets-dialog">
          <DialogHeader>
            <DialogTitle>{copy.new_collection}</DialogTitle>
            <DialogDescription>{copy.collection_hint}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <form.Field name="name">
              {(field) => (
                <TextField field={field} label={copy.collection_name} />
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(busy) => (
                <button
                  className="banana-assets-primary mt-4"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? copy.saving : copy.save}
                </button>
              )}
            </form.Subscribe>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="banana-account banana-assets-dialog max-h-[90vh] sm:max-w-5xl">
          <DialogTitle>{copy.preview}</DialogTitle>
          <DialogDescription className="sr-only">
            {selected?.prompt}
          </DialogDescription>
          {selected?.images[0]?.imageUrl && (
            <img
              className="max-h-[76vh] w-full object-contain"
              src={selected.images[0].imageUrl}
              alt={selected.prompt}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
