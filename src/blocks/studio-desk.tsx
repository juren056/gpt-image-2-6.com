import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  FolderOpen,
  Loader2,
  Save,
  Share2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/lookups/studio_desk';
import { Link } from '@/core/i18n/navigation';
import type { CreativeToolId } from '@/config/creative-tools';
import { PUBLIC_TOOL_PAGES } from '@/config/public-creative';
import type { StudioProjectState } from '@/modules/creative-projects/service';
import { apiGet, apiPost } from '@/lib/api-client';
import { appendAsset, createEmptyStudioState } from '@/lib/creative-canvas';
import {
  readDeskMetadata,
  safeStudioSource,
  STUDIO_TOOL_LAYOUTS,
  type StudioDeskMetadata,
  type StudioToolDraft,
} from '@/lib/studio-desk';
import { getLocale } from '@/paraglide/runtime.js';
import { CreativeToolTile } from '@/components/creative-visuals';
import { DedicatedToolWorkspace } from '@/components/dedicated-tool-workspace';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import '@/styles/studio-desk.css';

type DeskState = StudioProjectState & { workspace?: StudioDeskMetadata };
const COPY_KEYS = [
  'choose',
  'project',
  'newProject',
  'save',
  'share',
  'close',
  'assets',
  'noAssets',
  'draft',
  'saved',
  'saveError',
  'loading',
  'retry',
  'restoreError',
  'library',
  'source',
  'result',
  'pending',
  'examples',
  'controls',
  'input',
  'output',
  'inspect',
  'upload',
  'uploadHint',
  'tryExample',
  'download',
  'compare',
  'transparency',
  'layoutPreview',
  'recipePrivate',
  'unavailable',
  'draw',
  'shared',
  'rename',
  'resume',
  'shareNotice',
  'queue',
  'runLog',
  'processing',
  'results',
  'brandLogo',
  'retryFailed',
  'localExports',
] as const;
const GROUPS = ['Create', 'Product', 'Enhance', 'Design', 'Workflow'] as const;

export function StudioDesk() {
  const { data: session } = useSession();
  const client = useQueryClient();
  const locale = getLocale();
  const copy = Object.fromEntries(
    COPY_KEYS.map((key) => [key, tDynamic(`studio_desk.${key}`)])
  );
  const [toolId, setToolId] = useState<CreativeToolId>('T01');
  const [project, setProject] = useState<DeskState>(createEmptyStudioState);
  const [drafts, setDrafts] = useState<StudioDeskMetadata['drafts']>({});
  const [title, setTitle] = useState(copy.newProject);
  const [projectId, setProjectId] = useState<string>();
  const [resumeId, setResumeId] = useState<string>();
  const [sourceTaskId, setSourceTaskId] = useState<string>();
  const [tray, setTray] = useState(false);
  const [busy, setBusy] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const restored = useRef<string | undefined>(undefined);
  const observedDrafts = useRef<Record<string, string>>({});
  const active = PUBLIC_TOOL_PAGES.find((tool) => tool.id === toolId)!;
  const source = project.assets.find(
    (asset) => asset.id === project.selectedAssetId
  )?.url;
  const storageKey = session?.user
    ? `studio-desk:v2:${session.user.id}`
    : undefined;

  useEffect(() => {
    if (!storageKey) return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('tool');
    const requestedProject = params.get('project');
    const requestedSource = params.get('sourceTask');
    if (requestedProject && requestedProject.length <= 160)
      setResumeId(requestedProject);
    else
      try {
        const saved = JSON.parse(
          window.sessionStorage.getItem(storageKey) || 'null'
        );
        if (
          saved &&
          saved.project?.version === 1 &&
          Array.isArray(saved.project.assets) &&
          saved.project.assets.every((asset: { url?: string }) =>
            safeStudioSource(asset.url)
          ) &&
          saved.project.canvas &&
          Array.isArray(saved.project.layers)
        ) {
          const metadata = readDeskMetadata(saved.workspace);
          if (metadata) {
            setProject(saved.project);
            setDrafts(metadata.drafts);
            const requestedTool = new URLSearchParams(
              window.location.search
            ).get('tool');
            setToolId(
              requestedTool && Object.hasOwn(STUDIO_TOOL_LAYOUTS, requestedTool)
                ? (requestedTool as CreativeToolId)
                : metadata.activeTool
            );
            setTitle(String(saved.title || copy.newProject).slice(0, 120));
            setProjectId(saved.projectId);
          }
        }
      } catch {
        /* A malformed browser draft never blocks a fresh project. */
      }
    if (requested && Object.hasOwn(STUDIO_TOOL_LAYOUTS, requested))
      setToolId(requested as CreativeToolId);
    if (requestedSource && requestedSource.length <= 160)
      setSourceTaskId(requestedSource);
    setReady(true);
  }, [storageKey]);

  const resumed = useQuery({
    queryKey: ['resume-creative-project', session?.user?.id, resumeId],
    queryFn: () =>
      apiGet<{ id: string; title: string; state: DeskState }>(
        `/api/studio/projects/${encodeURIComponent(resumeId!)}`
      ),
    enabled: Boolean(resumeId && session?.user),
    retry: 1,
  });
  useEffect(() => {
    if (!resumed.data || restored.current === resumed.data.id) return;
    restored.current = resumed.data.id;
    setProject(resumed.data.state);
    setProjectId(resumed.data.id);
    setTitle(resumed.data.title);
    const metadata = readDeskMetadata(resumed.data.state.workspace);
    observedDrafts.current = {};
    if (metadata) {
      setDrafts(metadata.drafts);
      const requestedTool = new URLSearchParams(window.location.search).get(
        'tool'
      );
      setToolId(
        requestedTool && Object.hasOwn(STUDIO_TOOL_LAYOUTS, requestedTool)
          ? (requestedTool as CreativeToolId)
          : metadata.activeTool
      );
    } else
      setDrafts({
        T01: {
          prompt: resumed.data.state.prompt,
          modelId: resumed.data.state.modelId,
        },
      });
    setEpoch((value) => value + 1);
    setDirty(false);
  }, [resumed.data]);
  const sourceTask = useQuery({
    queryKey: ['studio-reference-task', session?.user?.id, sourceTaskId],
    queryFn: () =>
      apiGet<{ images?: { imageUrl?: string }[] }>(
        `/api/images/${encodeURIComponent(sourceTaskId!)}`
      ),
    enabled: Boolean(sourceTaskId && session?.user),
    retry: 1,
  });

  const addResult = useCallback(
    (url: string, taskId?: string) => {
      const safe = safeStudioSource(url);
      if (!safe) return;
      setProject((current) =>
        current.assets.some((asset) => asset.url === safe)
          ? current
          : appendAsset(current, {
              parentAssetId: current.selectedAssetId,
              sourceTaskId: taskId,
              operation: toolId,
              url: safe,
            })
      );
      setDirty(true);
    },
    [toolId]
  );
  useEffect(() => {
    const url = sourceTask.data?.images?.[0]?.imageUrl;
    if (url) {
      addResult(url, sourceTaskId);
      setEpoch((value) => value + 1);
    }
  }, [sourceTask.data, sourceTaskId]);
  const onDraft = useCallback(
    (draft: StudioToolDraft) => {
      const serialized = JSON.stringify(draft);
      const previous = observedDrafts.current[toolId];
      observedDrafts.current[toolId] = serialized;
      if (previous && previous !== serialized) setDirty(true);
      setDrafts((current) =>
        JSON.stringify(current[toolId]) === serialized
          ? current
          : { ...current, [toolId]: draft }
      );
    },
    [toolId]
  );
  const onSource = useCallback((url: string) => addResult(url), [addResult]);
  useEffect(() => {
    if (!ready || !storageKey || resumed.isFetching) return;
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            project,
            title,
            projectId,
            workspace: { activeTool: toolId, drafts },
          })
        );
      } catch {
        /* Remote save stays available when browser storage is full. */
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [
    project,
    title,
    projectId,
    drafts,
    toolId,
    storageKey,
    ready,
    resumed.isFetching,
  ]);

  function chooseTool(id: CreativeToolId) {
    if (busy) return;
    setToolId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('tool', id);
    window.history.replaceState(null, '', url);
    setDirty(true);
  }
  const workspaceState = () => ({
    ...project,
    prompt: drafts[toolId]?.prompt,
    modelId: drafts[toolId]?.modelId,
    workspace: { activeTool: toolId, drafts },
  });
  const save = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/studio/projects', {
        id: projectId,
        title,
        previewUrl: source,
        state: workspaceState(),
      }),
    onSuccess: (data) => {
      setProjectId(data.id);
      setDirty(false);
      client.invalidateQueries({ queryKey: ['creative-projects'] });
      client.invalidateQueries({ queryKey: ['account-projects'] });
      const url = new URL(window.location.href);
      url.searchParams.set('project', data.id);
      url.searchParams.set('tool', toolId);
      window.history.replaceState(null, '', url);
      toast.success(copy.saved);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const share = useMutation({
    mutationFn: async () => {
      const saved = await apiPost<{ id: string }>('/api/studio/projects', {
        id: projectId,
        title,
        previewUrl: source,
        state: workspaceState(),
      });
      setProjectId(saved.id);
      return apiPost<{ token: string }>('/api/studio/shares', {
        projectId: saved.id,
      });
    },
    onSuccess: async ({ token }) => {
      const url = `${window.location.origin}/studio/share/${token}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success(copy.shared);
      } catch {
        toast.error(copy.shareNotice);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const toolCopy = useMemo(
    () => ({
      ...copy,
      empty: tDynamic(`studio_desk.${toolId}.empty`),
      hint: tDynamic(`studio_desk.${toolId}.hint`),
      stage: tDynamic(`studio_desk.${toolId}.stage`),
    }),
    [toolId, locale]
  );
  const toolName = (id: CreativeToolId) => tDynamic(`studio_desk.${id}.name`);
  if (
    !ready ||
    (resumeId && resumed.isPending) ||
    (sourceTaskId && sourceTask.isPending)
  )
    return (
      <div className="studio-loading" role="status">
        <Loader2 className="animate-spin" />
        {copy.loading}
      </div>
    );
  if (resumed.isError || sourceTask.isError)
    return (
      <div className="studio-loading" role="alert">
        <p>{copy.restoreError}</p>
        <Button
          onClick={() =>
            void (resumed.isError ? resumed.refetch() : sourceTask.refetch())
          }
        >
          {copy.retry}
        </Button>
      </div>
    );
  return (
    <div className="studio-desk">
      <h1 className="sr-only">{toolName(toolId)}</h1>
      <header className="studio-desk-header">
        <div className="studio-tool-choice">
          {' '}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="studio-tool-trigger"
              aria-label={copy.choose}
              disabled={busy}
            >
              <CreativeToolTile
                toolId={toolId}
                className="size-9 rounded-lg [&_svg]:size-5"
              />
              <span>{toolName(toolId)}</span>
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="studio-tool-menu" align="start">
              {GROUPS.map((group) => (
                <DropdownMenuGroup key={group}>
                  <DropdownMenuLabel>
                    {tDynamic(`studio_desk.group.${group}`)}
                  </DropdownMenuLabel>
                  {PUBLIC_TOOL_PAGES.filter(
                    (tool) => tool.category === group
                  ).map((tool) => (
                    <DropdownMenuItem
                      key={tool.id}
                      onClick={() => chooseTool(tool.id)}
                      className="studio-tool-menu-item"
                      aria-current={tool.id === toolId ? 'true' : undefined}
                    >
                      <CreativeToolTile
                        toolId={tool.id}
                        className="size-8 shrink-0 rounded-lg [&_svg]:size-4"
                      />
                      <span>{toolName(tool.id)}</span>
                      {tool.id === toolId && (
                        <Check
                          className="studio-tool-selected"
                          size={16}
                          aria-hidden
                        />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="studio-project-actions">
          <span>
            {dirty ? copy.draft : projectId ? copy.saved : copy.draft}
          </span>
          <Button
            variant="outline"
            disabled={busy || save.isPending}
            onClick={() => save.mutate()}
          >
            <Save size={16} />
            {copy.save}
          </Button>
          <Button
            variant={tray ? 'secondary' : 'outline'}
            onClick={() => setTray((value) => !value)}
            aria-expanded={tray}
            aria-controls="studio-project-tray"
          >
            <FolderOpen size={16} />
            {copy.project}
          </Button>
        </div>
      </header>
      <nav className="studio-tool-groups" aria-label={copy.choose}>
        {GROUPS.map((group) => (
          <button
            type="button"
            key={group}
            disabled={busy}
            aria-pressed={active.category === group}
            onClick={() =>
              chooseTool(
                PUBLIC_TOOL_PAGES.find((tool) => tool.category === group)!.id
              )
            }
          >
            {tDynamic(`studio_desk.group.${group}`)}
          </button>
        ))}
        <span>{copy.resume}</span>
      </nav>
      <div className={`studio-desk-body ${tray ? 'studio-with-project' : ''}`}>
        <DedicatedToolWorkspace
          key={`${toolId}-${epoch}`}
          toolId={toolId}
          studio={{
            copy: toolCopy,
            initialDraft: drafts[toolId],
            sourceUrl: safeStudioSource(source),
            onDraft,
            onResult: addResult,
            onSource,
            onBusy: setBusy,
          }}
        />
        {tray && (
          <aside id="studio-project-tray" className="studio-project-tray">
            <div>
              <h2>{copy.project}</h2>
              <button
                type="button"
                onClick={() => setTray(false)}
                aria-label={copy.close}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              {copy.rename}
              <Input
                value={title}
                maxLength={120}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
              />
            </label>
            <p>{copy.resume}</p>
            <Button
              variant="outline"
              onClick={() => share.mutate()}
              disabled={share.isPending || busy}
            >
              <Share2 size={16} />
              {copy.share}
            </Button>
            <small>{copy.shareNotice}</small>
            <h3>
              {copy.assets} · {project.assets.length}
            </h3>
            <div className="studio-asset-tray">
              {project.assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  disabled={busy}
                  aria-pressed={asset.id === project.selectedAssetId}
                  onClick={() => {
                    setProject((current) => ({
                      ...current,
                      selectedAssetId: asset.id,
                    }));
                    setEpoch((value) => value + 1);
                  }}
                >
                  <img
                    src={asset.url}
                    alt={`${copy.source} ${asset.version}`}
                    loading="lazy"
                  />
                  <span>
                    {asset.operation} · v{asset.version}
                  </span>
                </button>
              ))}
              {!project.assets.length && <p>{copy.noAssets}</p>}
            </div>
            <Link href="/settings/assets">{copy.assets}</Link>
          </aside>
        )}
      </div>
    </div>
  );
}
