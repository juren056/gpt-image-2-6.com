import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockOpen,
  Redo2,
  Save,
  Share2,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/dynamic';
import type {
  CreativeModelDefinition,
  CreativeOperation,
} from '@/config/creative-studio';
import { CREATIVE_TOOLS, type CreativeToolId } from '@/config/creative-tools';
import { PUBLIC_TOOL_PAGES } from '@/config/public-creative';
import type { StudioProjectState } from '@/modules/creative-projects/service';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  appendAsset,
  applyTemplate,
  createEmptyStudioState,
  createLayer,
  EXPORT_PRESETS,
  sanitizeSvgMarkup,
  STUDIO_TEMPLATES,
} from '@/lib/creative-canvas';
import { CreativeToolTile } from '@/components/creative-visuals';
import { FirstGenerationFeedback } from '@/components/first-generation-feedback';
import {
  ImageUploader,
  uploadImageFile,
  type ImageUploaderValue,
} from '@/components/image-uploader';
import { ModelPicker } from '@/components/model-picker';
import { SiteSelect } from '@/components/site-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ModelView = CreativeModelDefinition & {
  configured: boolean;
  enabled: boolean;
};
type TaskView = {
  id: string;
  status: string;
  images?: Array<{ imageUrl?: string }>;
  errorMessage?: string;
};

export function CreativeStudioWorkspace() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [toolId, setToolId] = useState<CreativeToolId>('T01');
  const [modelId, setModelId] = useState('flux-2-pro');
  const [prompt, setPrompt] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>();
  const [resumeProjectId, setResumeProjectId] = useState<string>();
  const restoredProjectRef = useRef<string | undefined>(undefined);
  const [sourceTaskId, setSourceTaskId] = useState<string>();
  const [projectTitle, setProjectTitle] = useState('Untitled creative project');
  const [state, setState] = useState<StudioProjectState>(
    createEmptyStudioState
  );
  const [past, setPast] = useState<StudioProjectState[]>([]);
  const [future, setFuture] = useState<StudioProjectState[]>([]);
  const [zoom, setZoom] = useState(0.55);
  const [activeTaskId, setActiveTaskId] = useState<string>();
  const [batchProgress, setBatchProgress] = useState<string[]>([]);
  const [svgMarkup, setSvgMarkup] = useState('');
  const [templateId, setTemplateId] = useState<string>(STUDIO_TEMPLATES[0].id);
  const [templateProduct, setTemplateProduct] = useState('');
  const [templateBrand, setTemplateBrand] = useState('');
  const [maskUrl, setMaskUrl] = useState<string>();
  const [maskMode, setMaskMode] = useState<'brush' | 'lasso'>('brush');
  const canvasRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lassoPointsRef = useRef<Array<[number, number]>>([]);
  const batchCancelRef = useRef(false);
  const handledTaskRef = useRef<string | undefined>(undefined);

  const modelsQuery = useQuery({
    queryKey: ['creative-models'],
    queryFn: () => apiGet<ModelView[]>('/api/studio/models'),
  });
  const resumeProject = useQuery({
    queryKey: ['resume-creative-project', session?.user?.id, resumeProjectId],
    queryFn: () =>
      apiGet<{ id: string; title: string; state: StudioProjectState }>(
        `/api/studio/projects/${encodeURIComponent(resumeProjectId!)}`
      ),
    enabled: Boolean(resumeProjectId && session?.user),
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const sourceTask = useQuery({
    queryKey: ['studio-reference-task', session?.user?.id, sourceTaskId],
    queryFn: () =>
      apiGet<TaskView>(`/api/images/${encodeURIComponent(sourceTaskId!)}`),
    enabled: Boolean(sourceTaskId && session?.user),
    retry: 1,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    const urls = sourceTask.data?.images
      ?.map((image) => image.imageUrl)
      .filter((url): url is string => Boolean(url && /^https?:\/\//.test(url)));
    if (urls?.length) setReferences(urls);
  }, [sourceTask.data]);
  useEffect(() => {
    if (
      !resumeProject.data ||
      restoredProjectRef.current === resumeProject.data.id
    )
      return;
    const project = resumeProject.data;
    restoredProjectRef.current = project.id;
    setState(project.state);
    setProjectId(project.id);
    setProjectTitle(project.title);
    setPrompt(project.state.prompt || '');
    if (project.state.modelId) setModelId(project.state.modelId);
    setPast([]);
    setFuture([]);
  }, [resumeProject.data]);
  const taskQuery = useQuery({
    queryKey: ['creative-task', activeTaskId],
    queryFn: () => apiGet<TaskView>(`/api/images/${activeTaskId}`),
    enabled: Boolean(activeTaskId),
    refetchInterval: (query) =>
      ['success', 'failed'].includes(query.state.data?.status || '')
        ? false
        : 1500,
  });
  const activeTool = CREATIVE_TOOLS.find((tool) => tool.id === toolId)!;
  const model = modelsQuery.data?.find((item) => item.id === modelId);
  const selectedAsset = state.assets.find(
    (asset) => asset.id === state.selectedAssetId
  );
  const sourceUrl = references[0] || selectedAsset?.url;
  const compatibleModels = useMemo(
    () =>
      (modelsQuery.data || []).filter(
        (item) =>
          item.productionEnabled &&
          item.enabled &&
          (!activeTool.operation ||
            item.operations.includes(activeTool.operation as CreativeOperation))
      ),
    [activeTool.operation, modelsQuery.data]
  );

  useEffect(() => {
    if (
      compatibleModels.length &&
      !compatibleModels.some((item) => item.id === modelId)
    ) {
      setModelId(compatibleModels[0].id);
    }
  }, [compatibleModels, modelId]);

  useEffect(() => {
    const requestedTool = new URLSearchParams(window.location.search).get(
      'tool'
    );
    const requestedProject = new URLSearchParams(window.location.search).get(
      'project'
    );
    if (requestedProject && requestedProject.length <= 160)
      setResumeProjectId(requestedProject);
    const requestedSource = new URLSearchParams(window.location.search).get(
      'sourceTask'
    );
    if (requestedSource && requestedSource.length <= 160)
      setSourceTaskId(requestedSource);
    if (CREATIVE_TOOLS.some((tool) => tool.id === requestedTool)) {
      setToolId(requestedTool as CreativeToolId);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('image-studio:brand-kit');
      if (!saved) return;
      const brand = JSON.parse(saved) as StudioProjectState['brand'];
      if (brand?.name) setTemplateBrand(brand.name);
      setState((current) => ({ ...current, brand }));
    } catch {
      // Ignore malformed local brand data; project data remains authoritative.
    }
  }, []);

  function commit(next: StudioProjectState) {
    setPast((items) => [...items.slice(-49), state]);
    setFuture([]);
    setState(next);
  }

  function undo() {
    const previous = past.at(-1);
    if (!previous) return;
    setFuture((items) => [state, ...items]);
    setPast((items) => items.slice(0, -1));
    setState(previous);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setPast((items) => [...items, state]);
    setFuture((items) => items.slice(1));
    setState(next);
  }

  function addAssetFromTask(task: TaskView) {
    const url = task.images?.[0]?.imageUrl;
    if (!url) return;
    const next = appendAsset(state, {
      parentAssetId: state.selectedAssetId,
      sourceTaskId: task.id,
      operation: activeTool.operation || toolId,
      url,
    });
    next.layers = [
      ...next.layers,
      createLayer('image', `${toolId} result`, { url }),
    ];
    commit(next);
    setReferences([url]);
  }

  useEffect(() => {
    if (!activeTaskId || handledTaskRef.current === activeTaskId) return;
    if (taskQuery.data?.status === 'success') {
      handledTaskRef.current = activeTaskId;
      addAssetFromTask(taskQuery.data);
      setActiveTaskId(undefined);
      toast.success('Result added to this project.');
    } else if (taskQuery.data?.status === 'failed') {
      handledTaskRef.current = activeTaskId;
      toast.error(
        taskQuery.data.errorMessage ||
          'Provider task failed; credits will be restored.'
      );
      setActiveTaskId(undefined);
    }
  }, [activeTaskId, taskQuery.data?.status]);

  const runMutation = useMutation({
    mutationFn: async () => {
      if (toolId === 'T21') {
        return apiPost<{ id: string }>('/api/studio/run', {
          model: modelId,
          operation: 'generate',
          prompt,
          imageUrls: [],
        });
      }
      if (activeTool.mode === 'utility') {
        if (!sourceUrl) throw new Error('Upload or select a source image');
        return apiPost<{ id: string }>('/api/studio/utility', {
          operation: activeTool.operation,
          imageUrl: sourceUrl,
          scale: 2,
        });
      }
      if (activeTool.mode === 'model') {
        return apiPost<{ id: string }>('/api/studio/run', {
          model: modelId,
          operation: activeTool.operation,
          prompt,
          imageUrls: references.length
            ? references
            : sourceUrl
              ? [sourceUrl]
              : [],
          maskUrl,
        });
      }
      throw new Error('Use the local workflow controls for this tool');
    },
    onSuccess: ({ id }) => setActiveTaskId(id),
    onError: (error: Error) => toast.error(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/studio/projects', {
        id: projectId,
        title: projectTitle,
        previewUrl: selectedAsset?.url,
        state: { ...state, prompt, modelId },
      }),
    onSuccess: (data) => {
      setProjectId(data.id);
      queryClient.invalidateQueries({ queryKey: ['creative-projects'] });
      toast.success('Project saved.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      let id = projectId;
      if (!id) {
        const saved = await apiPost<{ id: string }>('/api/studio/projects', {
          title: projectTitle,
          previewUrl: selectedAsset?.url,
          state: { ...state, prompt, modelId },
        });
        id = saved.id;
        setProjectId(id);
      }
      return apiPost<{ token: string }>('/api/studio/shares', {
        projectId: id,
      });
    },
    onSuccess: ({ token }) => {
      const url = `${window.location.origin}/studio/share/${token}`;
      navigator.clipboard.writeText(url).catch(() => undefined);
      toast.success('A read-only snapshot link was copied.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function maskPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = maskCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) / rect.width) * canvas.width,
      ((event.clientY - rect.top) / rect.height) * canvas.height,
    ] as const;
  }

  function prepareMaskCanvas() {
    const canvas = maskCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return null;
    if (!canvas.dataset.initialized) {
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      canvas.dataset.initialized = 'true';
    }
    return context;
  }

  function beginMask(event: ReactPointerEvent<HTMLCanvasElement>) {
    const context = prepareMaskCanvas();
    if (!context) return;
    const [x, y] = maskPoint(event);
    if (maskMode === 'lasso') {
      lassoPointsRef.current.push([x, y]);
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
      return;
    }
    drawingRef.current = true;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 36;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x, y);
  }

  function moveMask(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || maskMode !== 'brush') return;
    const context = prepareMaskCanvas();
    if (!context) return;
    const [x, y] = maskPoint(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function finishLasso() {
    const context = prepareMaskCanvas();
    const points = lassoPointsRef.current;
    if (!context || points.length < 3) return;
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
    context.closePath();
    context.fill();
    lassoPointsRef.current = [];
  }

  async function uploadMask() {
    const canvas = maskCanvasRef.current;
    if (!canvas?.dataset.initialized) throw new Error('Draw a mask first');
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) throw new Error('Unable to encode mask');
    const url = await uploadImageFile(
      new File([blob], 'studio-mask.png', { type: 'image/png' })
    );
    setMaskUrl(url);
    commit({
      ...state,
      layers: [
        ...state.layers,
        createLayer('mask', `${maskMode} mask`, { url }),
      ],
    });
    toast.success('Mask uploaded and attached to the next edit.');
  }

  function applyLocalWorkflow() {
    if (toolId === 'T05') {
      commit({
        ...state,
        layers: [
          ...state.layers,
          createLayer('shape', 'Product shadow', {
            kind: 'shadow',
            blur: 24,
            opacity: 0.28,
            offsetX: 8,
            offsetY: 18,
            direction: 90,
          }),
        ],
      });
    } else if (toolId === 'T11') {
      commit({
        ...state,
        layers: [
          ...state.layers,
          createLayer('shape', 'Shape layer', {
            shape: 'rectangle',
            fill: '#7c3aed',
          }),
        ],
      });
    } else if (toolId === 'T12') {
      commit({
        ...state,
        layers: [
          ...state.layers,
          createLayer('text', 'Editable text', {
            text: prompt || 'Edit this text',
            price: '',
            font: 'Inter',
            color: '#111827',
            align: 'center',
            lineHeight: 1.2,
          }),
        ],
      });
    } else if (toolId === 'T15') {
      const preset = EXPORT_PRESETS.find((item) => item.id === 'portrait')!;
      commit({
        ...state,
        canvas: { ...state.canvas, width: preset.width, height: preset.height },
      });
    } else if (toolId === 'T16') {
      const brand = {
        name: templateBrand,
        colors: ['#7c3aed', '#111827'],
        fontNames: ['Inter'],
      };
      window.localStorage.setItem(
        'image-studio:brand-kit',
        JSON.stringify(brand)
      );
      commit({ ...state, brand });
    } else if (toolId === 'T19') {
      const safe = sanitizeSvgMarkup(svgMarkup);
      commit({
        ...state,
        layers: [
          ...state.layers,
          createLayer('image', 'Sanitized SVG', { svg: safe }),
        ],
      });
    } else if (toolId === 'T21') {
      setPrompt(
        applyTemplate(templateId, {
          product: templateProduct,
          brand: templateBrand,
        })
      );
    } else if (toolId === 'T22') {
      commit({
        ...state,
        layers: [
          ...state.layers,
          createLayer('mask', 'Sketch reference', {
            strokes: [],
            strength: 0.75,
          }),
        ],
      });
    } else if (toolId === 'T23') {
      commit({
        ...state,
        layers: [
          ...state.layers,
          createLayer('annotation', 'Edit annotations', {
            markers: [
              { number: 1, instruction: prompt || 'Describe change 1' },
            ],
          }),
        ],
      });
    } else if (toolId === 'T25') {
      toast.info(
        selectedAsset
          ? `Working on asset v${selectedAsset.version}; choose the next operation.`
          : 'Generate or upload the first asset to start the lineage.'
      );
    } else {
      toast.info(activeTool.description);
    }
  }

  async function runPipeline() {
    if (!model?.enabled)
      throw new Error('Selected model is not production-enabled');
    const prompts =
      toolId === 'T17'
        ? [
            'Pure white ecommerce main image',
            'Premium studio product photo',
            'Authentic lifestyle product scene',
            'Advertising layout with headline-safe space',
          ]
        : toolId === 'T20'
          ? [
              'Minimal logo mark',
              'Matching app icon',
              'Matching monochrome brand symbol',
            ]
          : [
              prompt || 'Variant A',
              `${prompt || 'Variant'} — alternate composition`,
            ];
    setBatchProgress(prompts.map(() => 'queued'));
    batchCancelRef.current = false;
    for (let index = 0; index < prompts.length; index += 1) {
      if (batchCancelRef.current) {
        setBatchProgress((items) =>
          items.map((item, i) =>
            i >= index && item === 'queued' ? 'canceled-before-submit' : item
          )
        );
        break;
      }
      setBatchProgress((items) =>
        items.map((item, i) => (i === index ? 'submitting' : item))
      );
      try {
        const result = await apiPost<{ id: string }>('/api/studio/run', {
          model: modelId,
          operation: references.length || sourceUrl ? 'edit' : 'generate',
          prompt: `${prompts[index]}. ${prompt}`.trim(),
          imageUrls: references.length
            ? references
            : sourceUrl
              ? [sourceUrl]
              : [],
        });
        setBatchProgress((items) =>
          items.map((item, i) => (i === index ? `task:${result.id}` : item))
        );
      } catch (error) {
        setBatchProgress((items) =>
          items.map((item, i) =>
            i === index
              ? `failed:${error instanceof Error ? error.message : 'error'}`
              : item
          )
        );
      }
    }
  }

  async function exportComposition() {
    const canvas = document.createElement('canvas');
    canvas.width = state.canvas.width;
    canvas.height = state.canvas.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = state.canvas.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (sourceUrl) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(
            new Error('Image cannot be exported because its host blocks CORS')
          );
        image.src = sourceUrl;
      });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    for (const layer of state.layers.filter(
      (item) => item.visible && item.type === 'text'
    )) {
      context.globalAlpha = layer.opacity;
      context.fillStyle = String(layer.data.color || '#111827');
      context.font = `700 64px ${String(layer.data.font || 'sans-serif')}`;
      context.textAlign = 'center';
      context.fillText(
        String(layer.data.text || ''),
        canvas.width / 2,
        canvas.height / 2
      );
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) throw new Error('Export failed');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${projectTitle.replace(/[^a-z0-9]+/gi, '-') || 'studio'}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (resumeProjectId && resumeProject.isPending)
    return (
      <div
        className="flex min-h-64 items-center justify-center gap-3"
        role="status"
      >
        <Loader2 className="animate-spin" />
        {tDynamic('account_assets.loading')}
      </div>
    );
  if (resumeProjectId && resumeProject.isError)
    return (
      <div
        className="flex min-h-64 flex-col items-center justify-center gap-3"
        role="alert"
      >
        <p>{tDynamic('account_assets.project_error')}</p>
        <Button variant="outline" onClick={() => void resumeProject.refetch()}>
          {tDynamic('account_assets.retry')}
        </Button>
      </div>
    );
  if (sourceTaskId && sourceTask.isPending)
    return (
      <div
        className="flex min-h-64 items-center justify-center gap-3"
        role="status"
      >
        <Loader2 className="animate-spin" />
        {tDynamic('account_assets.loading')}
      </div>
    );
  if (sourceTaskId && sourceTask.isError)
    return (
      <div
        className="flex min-h-64 flex-col items-center justify-center gap-3"
        role="alert"
      >
        <p>{tDynamic('account_assets.error')}</p>
        <Button variant="outline" onClick={() => void sourceTask.refetch()}>
          {tDynamic('account_assets.retry')}
        </Button>
      </div>
    );
  return (
    <div className="grid gap-4 p-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Creative tools</CardTitle>
        </CardHeader>
        <CardContent className="grid max-h-[72vh] gap-1 overflow-y-auto">
          {CREATIVE_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setToolId(tool.id)}
              className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs ${tool.id === toolId ? 'bg-primary/10 text-primary ring-primary/20 ring-1' : 'hover:bg-muted'}`}
            >
              <CreativeToolTile
                toolId={tool.id}
                className="size-8 rounded-lg [&_svg]:size-4"
              />
              <span className="min-w-0 truncate">
                {PUBLIC_TOOL_PAGES.find((item) => item.id === tool.id)?.name ||
                  tool.label}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {PUBLIC_TOOL_PAGES.find((item) => item.id === activeTool.id)
                ?.name || activeTool.label}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {activeTool.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!past.length}
              >
                <Undo2 /> Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!future.length}
              >
                <Redo2 /> Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((value) => Math.max(0.2, value - 0.1))}
              >
                −
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((value) => Math.min(1, value + 0.1))}
              >
                +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportComposition().catch((e: Error) =>
                    toast.error(e.message)
                  )
                }
              >
                <Download /> Export PNG
              </Button>
            </div>
            <div className="bg-muted overflow-auto rounded-xl border p-4">
              <div
                ref={canvasRef}
                className="relative mx-auto origin-top overflow-hidden bg-white shadow-xl"
                style={{
                  width: state.canvas.width,
                  height: state.canvas.height,
                  transform: `scale(${zoom})`,
                  marginBottom: -(state.canvas.height * (1 - zoom)),
                  background: state.canvas.background,
                }}
              >
                {sourceUrl ? (
                  <img
                    src={sourceUrl}
                    alt="Selected asset"
                    className="absolute inset-0 size-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground flex size-full items-center justify-center">
                    Upload or generate an asset
                  </div>
                )}
                {['T07', 'T08', 'T09', 'T22', 'T23'].includes(toolId) ? (
                  <canvas
                    ref={maskCanvasRef}
                    width={512}
                    height={512}
                    onPointerDown={beginMask}
                    onPointerMove={moveMask}
                    onPointerUp={() => {
                      drawingRef.current = false;
                    }}
                    onPointerLeave={() => {
                      drawingRef.current = false;
                    }}
                    className="absolute inset-0 size-full cursor-crosshair touch-none opacity-45"
                  />
                ) : null}
                {state.layers
                  .filter((layer) => layer.visible && layer.type === 'text')
                  .map((layer) => (
                    <div
                      key={layer.id}
                      className="absolute inset-x-10 top-1/2 text-center text-6xl font-bold"
                      style={{
                        color: String(layer.data.color || '#111827'),
                        opacity: layer.opacity,
                      }}
                    >
                      {String(layer.data.text || '')}
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source and instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ImageUploader
              allowMultiple
              maxImages={model?.maxReferences || 10}
              title="Reference images (ordered)"
              onChange={(items: ImageUploaderValue[]) =>
                setReferences(
                  items.flatMap((item) => (item.url ? [item.url] : []))
                )
              }
            />
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the required output or edit. Annotations use this text too."
              rows={4}
            />
            {activeTool.mode === 'model' || activeTool.mode === 'pipeline' ? (
              <ModelPicker
                value={modelId}
                options={(compatibleModels.length
                  ? compatibleModels
                  : modelsQuery.data || []
                ).map((item) => ({
                  id: item.id,
                  label: item.label,
                  credits: activeTool.operation
                    ? item.credits[activeTool.operation as CreativeOperation]
                    : undefined,
                }))}
                onChange={setModelId}
                ariaLabel="Model"
              />
            ) : null}
            {toolId === 'T21' ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <SiteSelect
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="border-input rounded-lg border px-2"
                >
                  {STUDIO_TEMPLATES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </SiteSelect>
                <Input
                  value={templateProduct}
                  onChange={(e) => setTemplateProduct(e.target.value)}
                  placeholder="Product"
                />
                <Input
                  value={templateBrand}
                  onChange={(e) => setTemplateBrand(e.target.value)}
                  placeholder="Brand"
                />
              </div>
            ) : null}
            {toolId === 'T19' ? (
              <Textarea
                value={svgMarkup}
                onChange={(e) => setSvgMarkup(e.target.value)}
                placeholder="Paste SVG markup to sanitize, preview and export"
                rows={7}
              />
            ) : null}
            {['T07', 'T08', 'T09', 'T22', 'T23'].includes(toolId) ? (
              <div className="flex flex-wrap items-center gap-2">
                <SiteSelect
                  value={maskMode}
                  onChange={(e) =>
                    setMaskMode(e.target.value as 'brush' | 'lasso')
                  }
                  className="border-input h-9 rounded-lg border px-2 text-sm"
                >
                  <option value="brush">Brush</option>
                  <option value="lasso">Lasso points</option>
                </SiteSelect>
                {maskMode === 'lasso' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={finishLasso}
                  >
                    Close lasso
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    uploadMask().catch((e: Error) => toast.error(e.message))
                  }
                >
                  Attach mask
                </Button>
                <span className="text-muted-foreground text-xs">
                  {maskUrl ? 'Mask ready' : 'White = edit, black = protect'}
                </span>
              </div>
            ) : null}
            {batchProgress.length ? (
              <div className="space-y-1 text-xs">
                {batchProgress.map((status, index) => (
                  <p key={index}>
                    Child {index + 1}: {status}
                  </p>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {activeTool.mode === 'model' ||
              activeTool.mode === 'utility' ||
              toolId === 'T21' ? (
                <Button
                  onClick={() => runMutation.mutate()}
                  disabled={
                    runMutation.isPending ||
                    Boolean(activeTaskId) ||
                    (!model?.enabled && activeTool.mode === 'model')
                  }
                >
                  {runMutation.isPending || activeTaskId ? (
                    <Loader2 className="animate-spin" />
                  ) : null}
                  Start operation
                </Button>
              ) : null}
              {activeTool.mode === 'canvas' || activeTool.mode === 'project' ? (
                <Button onClick={applyLocalWorkflow}>Apply changes</Button>
              ) : null}
              {activeTool.mode === 'pipeline' ? (
                <>
                  <Button
                    onClick={() =>
                      runPipeline().catch((e: Error) => toast.error(e.message))
                    }
                  >
                    Process selected items
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      batchCancelRef.current = true;
                    }}
                  >
                    Cancel queued children
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save /> Save / resume
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => shareMutation.mutate()}
              disabled={shareMutation.isPending}
            >
              <Share2 /> Share snapshot
            </Button>
            <p className="text-muted-foreground text-xs">
              {state.assets.length} saved results · current{' '}
              {selectedAsset ? `version ${selectedAsset.version}` : 'none'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.layers.length ? (
              state.layers
                .slice()
                .reverse()
                .map((layer) => (
                  <div key={layer.id} className="rounded-lg border p-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="min-w-0 flex-1 truncate">
                        {layer.name}
                      </span>
                      <button
                        onClick={() =>
                          commit({
                            ...state,
                            layers: state.layers.map((item) =>
                              item.id === layer.id
                                ? { ...item, visible: !item.visible }
                                : item
                            ),
                          })
                        }
                      >
                        {layer.visible ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          commit({
                            ...state,
                            layers: state.layers.map((item) =>
                              item.id === layer.id
                                ? { ...item, locked: !item.locked }
                                : item
                            ),
                          })
                        }
                      >
                        {layer.locked ? (
                          <Lock className="size-4" />
                        ) : (
                          <LockOpen className="size-4" />
                        )}
                      </button>
                    </div>
                    <input
                      aria-label="Layer opacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) =>
                        commit({
                          ...state,
                          layers: state.layers.map((item) =>
                            item.id === layer.id
                              ? { ...item, opacity: Number(e.target.value) }
                              : item
                          ),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                ))
            ) : (
              <p className="text-muted-foreground text-xs">No layers yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <FirstGenerationFeedback
        taskId={activeTaskId}
        status={taskQuery.data?.status}
        modelId={modelId}
      />
    </div>
  );
}
