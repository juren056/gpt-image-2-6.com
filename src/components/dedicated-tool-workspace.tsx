import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { CREATIVE_MODELS } from '@/config/creative-studio';
import type { CreativeToolId } from '@/config/creative-tools';
import {
  findPublicTool,
  PUBLIC_TOOL_PAGES,
  type PublicPanelType,
} from '@/config/public-creative';
import { apiGet, apiPost } from '@/lib/api-client';
import { sanitizeSvgMarkup } from '@/lib/creative-canvas';
import {
  safeStudioSource,
  STUDIO_TOOL_LAYOUTS,
  type StudioDeskContext,
  type StudioToolDraft,
} from '@/lib/studio-desk';
import { CreativeToolTile } from '@/components/creative-visuals';
import {
  GeneratorGuideSections,
  GeneratorPageHero,
} from '@/components/generator-page-sections';
import {
  ImageUploader,
  uploadImageFile,
  type ImageUploaderValue,
} from '@/components/image-uploader';
import { ModelPicker } from '@/components/model-picker';
import { StudioToolStage } from '@/components/studio-tool-stage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Task = {
  id: string;
  status: string;
  images?: Array<{ imageUrl?: string }>;
  errorMessage?: string;
};
type Layer = {
  id: string;
  name: string;
  src: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};
type BatchDownload = { name: string; url: string; taskId?: string };

const PANEL_GUIDANCE: Record<
  PublicPanelType,
  { input: string; output: string; tip: string; limitation: string }
> = {
  generate: {
    input:
      'Write the subject first, then add setting, composition, light, and the details that must be preserved.',
    output:
      'A newly generated image in the selected shape, ready to download or refine in another tool.',
    tip: 'Describe one clear focal point before adding style words.',
    limitation:
      'A prompt describes intent, not an exact layout contract. Check small text, hands, labels, and repeated details before publishing.',
  },
  edit: {
    input:
      'Upload a clean reference and describe both the requested change and what must remain untouched.',
    output:
      'A revised image that uses the uploaded reference as the visual starting point.',
    tip: 'Separate the change from the preservation instruction in two short sentences.',
    limitation:
      'Large changes can alter identity, geometry, or typography. Compare the output against the source at full size.',
  },
  upload: {
    input:
      'Upload one well-exposed PNG, JPEG, or WebP with a clear subject and visible edges.',
    output:
      'A processed image with an immediate preview and the appropriate downloadable file.',
    tip: 'Use the highest-quality original available; avoid screenshots with compression artifacts.',
    limitation:
      'Hair, glass, reflections, motion blur, and low-contrast edges may require cleanup after automatic processing.',
  },
  background: {
    input:
      'Upload the subject, then choose a local color treatment or describe a generated scene.',
    output:
      'A new composition with the subject placed over the selected background.',
    tip: 'Match background direction and brightness to the light already present on the subject.',
    limitation:
      'A generated scene may not match the original perspective or contact shadow perfectly. Inspect the subject boundary before export.',
  },
  shadow: {
    input:
      'Upload a cutout or product image and set shadow direction, softness, opacity, and offset.',
    output: 'A local PNG composition with an adjustable grounding shadow.',
    tip: 'Keep the darkest part close to the contact point and soften the shadow as it travels away.',
    limitation:
      'The shadow is a controlled visual layer, not a full physical lighting simulation.',
  },
  relight: {
    input:
      'Choose a lighting setup and describe the mood while naming important colors and materials to preserve.',
    output: 'A relit version of the source image using the selected model.',
    tip: 'Ask for one dominant light direction instead of mixing several lighting styles.',
    limitation:
      'Strong relighting can change subtle material colors or facial detail. Review critical brand and identity features.',
  },
  mask: {
    input:
      'Upload the image, paint only the editable region, and describe the removal or replacement.',
    output: 'A revised image where processing is focused on the painted mask.',
    tip: 'Include a small margin around the object so the model can rebuild surrounding texture.',
    limitation:
      'A mask guides the edit but does not guarantee pixel-perfect boundaries on complex overlaps.',
  },
  outpaint: {
    input:
      'Upload an image, set a larger canvas, choose the anchor, and describe the surroundings to extend.',
    output:
      'An expanded composition that keeps the original image inside the new boundary.',
    tip: 'Mention architecture, horizon, light direction, and repeating textures visible near the original edge.',
    limitation:
      'New areas are generated guesses. Do not treat invented details as a factual continuation of a real scene.',
  },
  layers: {
    input:
      'Add multiple images, then order, move, rotate, hide, lock, and fade each layer.',
    output: 'A flattened composition exported from the visible layer stack.',
    tip: 'Lock finished layers before adjusting another element to avoid accidental movement.',
    limitation:
      'The exported image is flattened; keep source files if you expect to rebuild the composition later.',
  },
  text: {
    input:
      'Upload an image and enter the exact text, size, color, alignment, and position.',
    output:
      'A raster export with independently positioned browser-rendered text.',
    tip: 'Keep important copy inside a safe margin and preview it at mobile size.',
    limitation:
      'The exported text becomes part of the image and is no longer editable after download.',
  },
  canvas: {
    input:
      'Upload an image, then crop, rotate, zoom, or flip it in the local editor.',
    output: 'A locally rendered edit without starting a paid AI task.',
    tip: 'Set the final crop before fine alignment so you do not repeat positioning work.',
    limitation:
      'Local transforms do not reconstruct missing pixels or increase real image detail.',
  },
  batch: {
    input:
      'Upload a group of supported images and review the queued operation before processing.',
    output:
      'Individual optimized files with item-level status and failed-only retry.',
    tip: 'Group files with similar dimensions and purpose so the same operation is appropriate for all of them.',
    limitation:
      'Browser memory limits vary. Split very large batches rather than risking a failed tab.',
  },
  resize: {
    input:
      'Upload one source, choose an output set, and select contain, cover, or padded fit.',
    output: 'Multiple platform-ready dimensions derived from the same source.',
    tip: 'Use contain when nothing may be cropped; use cover when edge cropping is acceptable.',
    limitation:
      'Resizing changes dimensions but cannot recover detail that is missing from a small original.',
  },
  brand: {
    input:
      'Add the approved brand name, logo, colors, and font direction you want to reuse.',
    output:
      'A reusable browser-side brand reference for supported design workflows.',
    tip: 'Use exact color values and one approved logo asset instead of several near-duplicates.',
    limitation:
      'A brand kit organizes inputs; it does not replace a formal identity system or trademark review.',
  },
  'product-set': {
    input:
      'Upload one clear product reference, select the required scenes, and add a concise campaign direction.',
    output:
      'Separate white, studio, lifestyle, or ad-layout tasks with visible per-image cost.',
    tip: 'Use a reference where the silhouette, material, and important product details are easy to inspect.',
    limitation:
      'Generated product imagery can alter labels or geometry. Verify every commercial detail against the real product.',
  },
  vectorize: {
    input:
      'Upload flat artwork with distinct edges and a limited number of colors.',
    output:
      'A traced SVG containing editable shapes rather than an embedded bitmap.',
    tip: 'Logos, icons, and flat illustrations trace more cleanly than photographs or textured art.',
    limitation:
      'Complex texture and fine photographic detail can create noisy paths that still need manual cleanup in a vector editor.',
  },
  svg: {
    input:
      'Paste or upload safe SVG markup, then adjust its primary color and export width.',
    output: 'Sanitized SVG markup that can be previewed and downloaded.',
    tip: 'Use simple paths and viewBox-based sizing so the artwork scales predictably.',
    limitation:
      'Unsafe scripts and active content are removed; unsupported SVG features may not survive sanitization.',
  },
  logo: {
    input:
      'Define the brand name, industry, logo type, and a restrained visual direction.',
    output:
      'A generated logo concept that can be reviewed as a starting point.',
    tip: 'Ask for a simple silhouette and test it at favicon size before adding detail.',
    limitation:
      'Generated marks require originality, trademark, spelling, and small-size checks before business use.',
  },
  templates: {
    input:
      'Choose a design pattern and replace its project fields with your own content.',
    output: 'A prepared handoff into the matching generator or editor.',
    tip: 'Pick the template by communication goal, not just by decoration.',
    limitation:
      'Templates speed up structure but still need copy, accessibility, and brand review.',
  },
  sketch: {
    input:
      'Draw or upload a readable sketch, then describe materials, style, and the intended finished scene.',
    output: 'A generated image guided by the supplied sketch structure.',
    tip: 'Use bold, unambiguous shapes and remove construction marks that should not influence the result.',
    limitation:
      'Sketch guidance is approximate; small spatial relationships can shift during generation.',
  },
  annotate: {
    input:
      'Add arrows, boxes, or brush marks and match each annotation to a numbered edit instruction.',
    output: 'An edited image guided by the marked areas and written request.',
    tip: 'Give each mark one job and write instructions in the same numeric order.',
    limitation:
      'Overlapping marks or vague instructions make it harder to associate an edit with the correct region.',
  },
  prompt: {
    input:
      'Choose a recipe, fill only the reusable variables, and write the stable creative direction.',
    output:
      'A structured prompt recipe that can be copied without private variable values.',
    tip: 'Keep variable names concrete, such as product, audience, setting, and required text.',
    limitation:
      'A prompt recipe improves consistency but cannot remove variation between model runs.',
  },
  workflow: {
    input:
      'Arrange the image steps in order and review the maximum credit estimate before running.',
    output:
      'A visible sequence with inspectable results at each completed stage.',
    tip: 'Put destructive or generative steps before final text and export operations.',
    limitation:
      'Each AI step can introduce variation. Inspect intermediate outputs instead of assuming the whole chain succeeded.',
  },
};

const AI_TOOL_OPERATION: Partial<Record<CreativeToolId, string>> = {
  T01: 'generate',
  T02: 'edit',
  T04: 'replace-background',
  T06: 'relight',
  T07: 'remove-object',
  T08: 'repaint',
  T09: 'outpaint',
  T20: 'generate',
  T22: 'edit',
  T23: 'edit',
};
const UTILITY_OPERATION: Partial<
  Record<CreativeToolId, 'remove-background' | 'upscale' | 'vectorize'>
> = {
  T03: 'remove-background',
  T10: 'upscale',
  T18: 'vectorize',
};

function downloadBlob(content: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeSvgPreview(markup: string) {
  try {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      sanitizeSvgMarkup(markup)
    )}`;
  } catch {
    return '';
  }
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [metadata, encoded] = dataUrl.split(',');
  const mime = metadata.match(/data:([^;]+)/)?.[1] || 'image/png';
  const bytes = atob(encoded);
  const buffer = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1)
    buffer[index] = bytes.charCodeAt(index);
  return new File([buffer], filename, { type: mime });
}

async function loadImage(src: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = src;
  await image.decode();
  return image;
}

async function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
      'image/png'
    )
  );
}

function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

export function DedicatedToolWorkspace({
  toolId,
  studio,
}: {
  toolId: CreativeToolId;
  studio?: StudioDeskContext;
}) {
  const initial = useRef(studio?.initialDraft || {}).current;
  const studioRef = useRef(studio);
  studioRef.current = studio;
  const tool = findPublicTool(toolId)!;
  const { data: session } = useSession();
  const [uploads, setUploads] = useState<ImageUploaderValue[]>(() => {
    const urls = initial.uploadUrls?.length
      ? initial.uploadUrls
      : studio?.sourceUrl
        ? [studio.sourceUrl]
        : [];
    return urls.map((url, index) => ({
      id: `preset-${url}-${index}`,
      preview: url,
      url,
      status: 'uploaded',
    }));
  });
  const [handoffPreview, setHandoffPreview] = useState<string | undefined>(
    initial.uploadUrls?.[0] || studio?.sourceUrl
  );
  const [exampleVersion, setExampleVersion] = useState(0);
  const [prompt, setPrompt] = useState(initial.prompt ?? '');
  const [modelId, setModelId] = useState(
    initial.modelId ?? (studio ? 'nano-banana-2.1' : 'gpt-image-2.5-sunburst')
  );
  const [taskId, setTaskId] = useState<string | undefined>(
    initial.resultTaskId
  );
  const [color, setColor] = useState(initial.color ?? '#6d4aff');
  const [color2, setColor2] = useState(initial.color2 ?? '#f5efe8');
  const [amount, setAmount] = useState(initial.amount ?? 45);
  const [amount2, setAmount2] = useState(initial.amount2 ?? 24);
  const [x, setX] = useState(initial.x ?? 50);
  const [y, setY] = useState(initial.y ?? 78);
  const [text, setText] = useState(initial.text ?? 'Your headline');
  const [fontSize, setFontSize] = useState(initial.fontSize ?? 48);
  const [rotation, setRotation] = useState(initial.rotation ?? 0);
  const [flipX, setFlipX] = useState(initial.flipX ?? false);
  const [flipY, setFlipY] = useState(initial.flipY ?? false);
  const [crop, setCrop] = useState(initial.crop ?? 100);
  const [fit, setFit] = useState<'contain' | 'cover' | 'extend'>(
    initial.fit ?? 'contain'
  );
  const [outputSet, setOutputSet] = useState(initial.outputSet ?? 'social');
  const [scale, setScale] = useState<2 | 4>(initial.scale ?? 2);
  const [svgWidth, setSvgWidth] = useState(initial.svgWidth ?? 640);
  const [lighting, setLighting] = useState(
    initial.lighting ?? 'Warm window light'
  );
  const [selectionMode, setSelectionMode] = useState<'brush' | 'eraser'>(
    initial.selectionMode ?? 'brush'
  );
  const [drawingData, setDrawingData] = useState(initial.drawingData ?? '');
  const [svg, setSvg] = useState(
    initial.svg ??
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><path fill="#6d4aff" d="M32 32h256v116H32z"/><circle fill="#fff" cx="160" cy="90" r="38"/></svg>'
  );
  const [brand, setBrand] = useState(
    initial.brand ?? {
      name: '',
      font: 'Inter',
      primary: '#6d4aff',
      secondary: '#f5efe8',
    }
  );
  const [brandLogoUploads, setBrandLogoUploads] = useState<
    ImageUploaderValue[]
  >(() =>
    initial.brandLogoUrl
      ? [
          {
            id: 'saved-brand-logo',
            preview: initial.brandLogoUrl,
            url: initial.brandLogoUrl,
            status: 'uploaded',
          },
        ]
      : []
  );

  useEffect(() => {
    if (studio) return;
    if (
      ['T01', 'T16', 'T19', 'T20', 'T21', 'T24'].includes(toolId) ||
      new URLSearchParams(window.location.search).get('source') !==
        'last-output'
    )
      return;
    try {
      const saved = JSON.parse(
        window.sessionStorage.getItem('image-studio:last-output') || 'null'
      ) as { imageUrl?: string; createdAt?: number } | null;
      if (
        !saved?.imageUrl ||
        !/^https?:\/\//.test(saved.imageUrl) ||
        Date.now() - (saved.createdAt || 0) > 86_400_000
      )
        return;
      const preset = {
        id: 'last-output',
        preview: saved.imageUrl,
        url: saved.imageUrl,
        status: 'uploaded' as const,
      };
      setHandoffPreview(saved.imageUrl);
      setUploads([preset]);
    } catch {
      // Ignore stale or malformed session handoff data.
    }
  }, [toolId]);
  const [selectedOutputs, setSelectedOutputs] = useState(
    initial.selectedOutputs ?? ['Studio', 'Lifestyle']
  );
  const [steps, setSteps] = useState(
    initial.steps ?? ['Remove background', 'Upscale']
  );
  const [statuses, setStatuses] = useState<string[]>(initial.statuses ?? []);
  const [batchDownloads, setBatchDownloads] = useState<BatchDownload[]>(
    initial.outputs ?? []
  );
  const [failedBatchItems, setFailedBatchItems] = useState<number[]>([]);
  const batchQueueSignature = JSON.stringify(
    uploads.map((item) => [item.id, item.url, item.preview])
  );
  const previousBatchQueue = useRef(batchQueueSignature);
  useEffect(() => {
    if (previousBatchQueue.current !== batchQueueSignature) {
      previousBatchQueue.current = batchQueueSignature;
      setFailedBatchItems([]);
      // A changed queue requires a fresh run; completed exports remain downloadable.
      setStatuses([]);
    }
  }, [batchQueueSignature]);
  const [flowBusy, setFlowBusy] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(initial.layers ?? []);
  const [noteMode, setNoteMode] = useState<'arrow' | 'box' | 'brush'>(
    initial.noteMode ?? 'arrow'
  );
  const [template, setTemplate] = useState(
    initial.template ?? 'Product launch'
  );
  const [industry, setIndustry] = useState(initial.industry ?? '');
  const [logoStyle, setLogoStyle] = useState(initial.logoStyle ?? 'Wordmark');
  const previewRef = useRef<HTMLDivElement>(null);

  const source = uploads.find((item) => item.status === 'uploaded' && item.url);
  const preview = source?.preview || source?.url;
  const taskQuery = useQuery({
    queryKey: ['dedicated-tool-task', taskId],
    queryFn: () => apiGet<Task>(`/api/images/${taskId}`),
    enabled: Boolean(taskId),
    refetchInterval: (query) =>
      ['success', 'failed'].includes(query.state.data?.status || '')
        ? false
        : 1500,
  });
  const resultUrl =
    taskQuery.data?.images?.[0]?.imageUrl ||
    (taskId === initial.resultTaskId && taskQuery.data?.status !== 'failed'
      ? initial.resultUrl
      : undefined);
  const operation = AI_TOOL_OPERATION[toolId];
  const utility = UTILITY_OPERATION[toolId];
  const utilityAvailability = useQuery({
    queryKey: ['creative-utility-availability'],
    queryFn: () =>
      apiGet<Record<string, { enabled: boolean; credits: number }>>(
        '/api/studio/utility'
      ),
    enabled: Boolean(utility),
  });
  const utilityStatus = utility
    ? utilityAvailability.data?.[utility]
    : undefined;
  const compatibleModels = useMemo(
    () =>
      CREATIVE_MODELS.filter(
        (model) => !operation || model.operations.includes(operation as never)
      ),
    [operation]
  );
  const activeModel =
    compatibleModels.find((model) => model.id === modelId) ||
    compatibleModels[0];

  useEffect(() => {
    if (activeModel && activeModel.id !== modelId) setModelId(activeModel.id);
  }, [activeModel, modelId]);

  useEffect(() => {
    if (toolId !== 'T11') return;
    const mapped = uploads
      .filter((item) => item.status === 'uploaded' && item.url)
      .map((item, index) => ({
        id: item.id,
        name: `Image ${index + 1}`,
        src: item.preview || item.url!,
        opacity: 100,
        visible: true,
        locked: false,
        x: 50,
        y: 50,
        scale: 100,
        rotation: 0,
      }));
    setLayers((current) =>
      mapped.map((layer) => {
        const previous =
          current.find((item) => item.src === layer.src) ||
          initial.layers?.find((item) => item.src === layer.src);
        return previous ? { ...previous, id: layer.id } : layer;
      })
    );
  }, [toolId, uploads]);

  useEffect(() => {
    if (taskQuery.data?.status === 'failed')
      toast.error(taskQuery.data.errorMessage || 'The operation failed.');
  }, [taskQuery.data?.errorMessage, taskQuery.data?.status]);

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user)
        throw new Error('Sign in to run paid image processing.');
      if (utility) {
        if (!source?.url) throw new Error('Upload an image first.');
        const imageUrl = new URL(source.url, window.location.origin).href;
        return apiPost<{ id: string }>('/api/studio/utility', {
          operation: utility,
          imageUrl,
          scale,
        });
      }
      if (operation && activeModel) {
        let sourceUrl = source?.url;
        let maskUrl: string | undefined;
        if (['T07', 'T08', 'T23'].includes(toolId) && !drawingData)
          throw new Error('Draw the editable area before submitting.');
        if (drawingData && toolId === 'T22' && !sourceUrl) {
          sourceUrl = await uploadImageFile(
            dataUrlToFile(drawingData, 'sketch.png')
          );
        }
        if (drawingData && ['T07', 'T08', 'T23'].includes(toolId)) {
          maskUrl = await uploadImageFile(
            dataUrlToFile(drawingData, 'selection-mask.png')
          );
        }
        if (operation !== 'generate' && !sourceUrl)
          throw new Error('Upload an image first.');
        if (sourceUrl)
          sourceUrl = new URL(sourceUrl, window.location.origin).href;
        const finalPrompt =
          toolId === 'T20'
            ? `${logoStyle} logo for ${brand.name || 'a new brand'} in ${industry || 'a modern industry'}. ${prompt}`
            : toolId === 'T06'
              ? `${lighting}. ${prompt}`
              : toolId === 'T09'
                ? `Extend the image to a ${x * 20} by ${y * 20} canvas. Preserve the original image exactly. ${prompt}`
                : toolId === 'T22'
                  ? `Follow the sketch structure at ${amount}% strength. ${prompt}`
                  : prompt;
        if (!finalPrompt.trim())
          throw new Error('Describe the result you want.');
        return apiPost<{ id: string }>('/api/studio/run', {
          model: activeModel.id,
          operation,
          prompt: finalPrompt,
          imageUrls: sourceUrl ? [sourceUrl] : [],
          size: activeModel.sizes[0],
          outputFormat: 'png',
          maskUrl,
        });
      }
      throw new Error(
        'This operation runs locally; use its export or save action.'
      );
    },
    onSuccess: ({ id }) => setTaskId(id),
    onError: (error: Error) => toast.error(error.message),
  });
  const isWorking =
    runMutation.isPending ||
    flowBusy ||
    (Boolean(taskId) &&
      !['success', 'failed'].includes(taskQuery.data?.status || ''));

  function runRemote() {
    if (!session?.user) {
      window.sessionStorage.setItem(
        'image-studio:tool-draft',
        JSON.stringify({ toolId, prompt, modelId })
      );
      window.location.href = `/sign-up?callbackUrl=${encodeURIComponent(tool.path)}`;
      return;
    }
    setTaskId(undefined);
    runMutation.mutate();
  }

  async function waitForTask(id: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const task = await apiGet<Task>(`/api/images/${id}`);
      if (task.status === 'success') {
        const url = task.images?.[0]?.imageUrl;
        if (!url)
          throw new Error('The completed task did not return an image.');
        return url;
      }
      if (task.status === 'failed')
        throw new Error(task.errorMessage || 'The image task failed.');
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }
    throw new Error(
      'The task is still running. Check your history for the result.'
    );
  }

  function requireSignIn() {
    if (session?.user) return false;
    window.sessionStorage.setItem(
      'image-studio:tool-draft',
      JSON.stringify({ toolId, prompt, modelId })
    );
    window.location.href = `/sign-up?callbackUrl=${encodeURIComponent(tool.path)}`;
    return true;
  }

  async function runProductSet() {
    if (requireSignIn() || !source?.url) {
      if (session?.user) toast.error('Upload a product image first.');
      return;
    }
    if (!selectedOutputs.length) {
      toast.error('Choose at least one output.');
      return;
    }
    const model =
      CREATIVE_MODELS.find(
        (item) => item.id === modelId && item.operations.includes('edit')
      ) || CREATIVE_MODELS.find((item) => item.operations.includes('edit'))!;
    setFlowBusy(true);
    setStatuses([]);
    setBatchDownloads([]);
    const completed: BatchDownload[] = [];
    try {
      for (let index = 0; index < selectedOutputs.length; index += 1) {
        const output = selectedOutputs[index];
        setStatuses((current) => [...current, `${output}: submitted`]);
        const task = await apiPost<{ id: string }>('/api/studio/run', {
          model: model.id,
          operation: 'edit',
          prompt: `Create a ${output.toLowerCase()} product image. Keep the product identity, shape, label, and proportions unchanged. ${prompt}`,
          imageUrls: [new URL(source.url, window.location.origin).href],
          size: model.sizes[0],
          outputFormat: 'png',
        });
        const url = await waitForTask(task.id);
        completed.push({ name: `${output}.png`, url, taskId: task.id });
        setBatchDownloads([...completed]);
        studioRef.current?.onResult(url, task.id);
        setStatuses((current) => [
          ...current.filter((status) => !status.startsWith(`${output}:`)),
          `${output}: completed`,
        ]);
      }
    } catch (error) {
      const failedOutput = selectedOutputs[completed.length];
      setStatuses((current) => [
        ...current.filter((status) => !status.startsWith(`${failedOutput}:`)),
        `${failedOutput}: failed`,
      ]);
      toast.error(error instanceof Error ? error.message : 'Image set failed.');
    } finally {
      setFlowBusy(false);
    }
  }

  async function addTextAsset(imageUrl: string) {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');
    ctx.drawImage(image, 0, 0);
    ctx.fillStyle = color;
    ctx.font = `700 ${Math.max(12, fontSize)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, (x / 100) * canvas.width, (y / 100) * canvas.height);
    return uploadImageFile(
      new File([await canvasBlob(canvas)], 'workflow-text.png', {
        type: 'image/png',
      })
    );
  }

  async function runWorkflow() {
    if (requireSignIn() || !source?.url) {
      if (session?.user) toast.error('Upload an image first.');
      return;
    }
    if (!steps.length) {
      toast.error('Add at least one step.');
      return;
    }
    const relightModel =
      CREATIVE_MODELS.find(
        (item) => item.id === modelId && item.operations.includes('relight')
      ) || CREATIVE_MODELS.find((item) => item.operations.includes('relight'))!;
    setFlowBusy(true);
    setStatuses([]);
    setBatchDownloads([]);
    const completed: BatchDownload[] = [];
    let currentUrl = new URL(source.url, window.location.origin).href;
    try {
      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        let stepTaskId: string | undefined;
        const prefix = `Step ${index + 1}: ${step}`;
        setStatuses((current) => [...current, `${prefix} · running`]);
        if (step === 'Remove background' || step === 'Upscale') {
          const task = await apiPost<{ id: string }>('/api/studio/utility', {
            operation: step === 'Upscale' ? 'upscale' : 'remove-background',
            imageUrl: currentUrl,
            scale,
          });
          currentUrl = await waitForTask(task.id);
          stepTaskId = task.id;
        } else if (step === 'Relight') {
          const task = await apiPost<{ id: string }>('/api/studio/run', {
            model: relightModel.id,
            operation: 'relight',
            prompt: `${lighting}. Keep subject identity and geometry unchanged. ${prompt}`,
            imageUrls: [currentUrl],
            size: relightModel.sizes[0],
            outputFormat: 'png',
          });
          currentUrl = await waitForTask(task.id);
          stepTaskId = task.id;
        } else if (step === 'Add text') {
          currentUrl = await addTextAsset(currentUrl);
        } else if (step !== 'Export') {
          throw new Error(`Unsupported workflow step: ${step}`);
        }
        completed.push({
          name: `${index + 1}-${step}.png`,
          url: currentUrl,
          taskId: stepTaskId,
        });
        setBatchDownloads([...completed]);
        studioRef.current?.onResult(currentUrl, stepTaskId);
        setStatuses((current) => [
          ...current.filter((status) => !status.startsWith(prefix)),
          `${prefix} · completed`,
        ]);
      }
    } catch (error) {
      const failedPrefix = `Step ${completed.length + 1}: ${steps[completed.length]}`;
      setStatuses((current) => [
        ...current.filter((status) => !status.startsWith(failedPrefix)),
        `${failedPrefix} · failed`,
      ]);
      toast.error(error instanceof Error ? error.message : 'Workflow failed.');
    } finally {
      setFlowBusy(false);
    }
  }

  async function exportLocal() {
    if (toolId === 'T19') {
      const safe = sanitizeSvgMarkup(svg)
        .replace(/\swidth\s*=\s*(?:"[^"]*"|'[^']*')/i, '')
        .replace(/<svg\b/i, `<svg width="${Math.max(1, svgWidth)}"`);
      downloadBlob(safe, 'image/svg+xml', 'edited-artwork.svg');
      return;
    }
    if (!preview) {
      toast.error('Upload an image first.');
      return;
    }
    if (toolId === 'T11') {
      const visibleLayers = layers.filter((layer) => layer.visible);
      if (!visibleLayers.length) {
        toast.error('Keep at least one layer visible.');
        return;
      }
      const images = await Promise.all(
        visibleLayers.map((layer) => loadImage(layer.src))
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(...images.map((image) => image.naturalWidth));
      canvas.height = Math.max(...images.map((image) => image.naturalHeight));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      images.forEach((image, index) => {
        const layer = visibleLayers[index];
        ctx.save();
        ctx.globalAlpha = visibleLayers[index].opacity / 100;
        ctx.translate(
          (layer.x / 100) * canvas.width,
          (layer.y / 100) * canvas.height
        );
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.scale / 100, layer.scale / 100);
        ctx.drawImage(
          image,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        );
        ctx.restore();
      });
      const url = URL.createObjectURL(await canvasBlob(canvas));
      triggerDownload(url, 'layer-composite.png');
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const image = await loadImage(preview);
    const canvas = document.createElement('canvas');
    const resizePresets: Record<string, Array<[string, number, number]>> = {
      social: [
        ['instagram-post', 1080, 1080],
        ['instagram-story', 1080, 1920],
      ],
      youtube: [
        ['youtube-thumbnail', 1280, 720],
        ['youtube-community', 1080, 1080],
      ],
      store: [
        ['store-square', 1200, 1200],
        ['store-landscape', 1600, 900],
      ],
    };
    if (toolId === 'T15') {
      for (const [name, width, height] of resizePresets[outputSet]) {
        canvas.width = width;
        canvas.height = height;
        const resized = canvas.getContext('2d');
        if (!resized) continue;
        resized.clearRect(0, 0, width, height);
        const ratio =
          fit === 'cover'
            ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
            : Math.min(
                width / image.naturalWidth,
                height / image.naturalHeight
              );
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        if (fit === 'extend') {
          resized.fillStyle = color2;
          resized.fillRect(0, 0, width, height);
        }
        resized.drawImage(
          image,
          (width - drawWidth) / 2,
          (height - drawHeight) / 2,
          drawWidth,
          drawHeight
        );
        const url = URL.createObjectURL(await canvasBlob(canvas));
        triggerDownload(url, `${name}.png`);
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      return;
    }
    canvas.width = Math.max(1, image.naturalWidth);
    canvas.height = Math.max(1, image.naturalHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (toolId === 'T04') {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.save();
    if (toolId === 'T05') {
      ctx.shadowColor = `rgba(0,0,0,${amount / 100})`;
      ctx.shadowBlur = amount2;
      ctx.shadowOffsetX = Math.round((x - 50) / 2);
      ctx.shadowOffsetY = Math.round((y - 50) / 2);
    }
    if (toolId === 'T13') {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      const cropScale = 100 / crop;
      ctx.scale(cropScale, cropScale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (toolId === 'T12') {
      ctx.fillStyle = color;
      ctx.font = `700 ${Math.max(12, fontSize)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, (x / 100) * canvas.width, (y / 100) * canvas.height);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (blob) downloadBlob(blob, 'image/png', `${tool.path.slice(1)}.png`);
  }

  async function runLocalFlow(retryFailed = false) {
    if (toolId === 'T16') {
      window.localStorage.setItem(
        'image-studio:brand-kit',
        JSON.stringify({
          ...brand,
          logo: brandLogoUploads.find((item) => item.url)?.url || null,
        })
      );
      toast.success('Brand kit saved in this browser.');
      return;
    }
    if (toolId === 'T24') {
      window.localStorage.setItem(
        'image-studio:prompt-recipe',
        JSON.stringify({ template, brand: brand.name, industry, prompt })
      );
      toast.success('A private recipe copy was saved in this browser.');
      return;
    }
    if (toolId === 'T14') {
      setFlowBusy(true);
      if (!retryFailed) {
        setStatuses([]);
        setBatchDownloads((items) => {
          items.forEach((item) => URL.revokeObjectURL(item.url));
          return [];
        });
      }
      const failed: number[] = [];
      try {
        const completed: BatchDownload[] = retryFailed
          ? [...batchDownloads]
          : [];
        for (let index = 0; index < uploads.length; index += 1) {
          if (retryFailed && !failedBatchItems.includes(index)) continue;
          const item = uploads[index];
          setStatuses((current) => [
            ...current.filter(
              (status) => !status.startsWith(`Image ${index + 1}:`)
            ),
            `Image ${index + 1}: processing`,
          ]);
          try {
            const image = await loadImage(item.preview || item.url!);
            const canvas = document.createElement('canvas');
            const ratio = Math.min(1, 1600 / image.naturalWidth);
            canvas.width = Math.round(image.naturalWidth * ratio);
            canvas.height = Math.round(image.naturalHeight * ratio);
            canvas
              .getContext('2d')
              ?.drawImage(image, 0, 0, canvas.width, canvas.height);
            completed.push({
              name: `optimized-${index + 1}.png`,
              url: URL.createObjectURL(await canvasBlob(canvas)),
            });
            setBatchDownloads([...completed]);
            setStatuses((current) => [
              ...current.filter(
                (status) => !status.startsWith(`Image ${index + 1}:`)
              ),
              `Image ${index + 1}: completed`,
            ]);
          } catch {
            failed.push(index);
            setStatuses((current) => [
              ...current.filter(
                (status) => !status.startsWith(`Image ${index + 1}:`)
              ),
              `Image ${index + 1}: failed`,
            ]);
          }
        }
        setFailedBatchItems(failed);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Batch processing failed.'
        );
      } finally {
        setFlowBusy(false);
      }
      return;
    }
    if (toolId === 'T21') {
      window.sessionStorage.setItem(
        'image-studio:selected-template',
        JSON.stringify({ template, brand: brand.name, prompt })
      );
      const destinations: Record<string, string> = {
        'Product launch': '/ai-product-photo-generator',
        'Event poster': '/ai-poster-generator',
        'Video cover': '/ai-youtube-thumbnail-generator',
        'Minimal logo': '/ai-logo-generator',
      };
      window.location.href = destinations[template] || '/ai-image-generator';
      return;
    }
    void exportLocal();
  }

  async function copyRedactedRecipe() {
    const shareCopy = {
      template,
      variables: ['brand', 'audience'],
      direction: prompt,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(shareCopy, null, 2));
      toast.success('A redacted recipe was copied without private values.');
    } catch {
      toast.error('Clipboard access is unavailable in this browser.');
    }
  }

  const draft: StudioToolDraft = useMemo(
    () => ({
      prompt,
      modelId,
      color,
      color2,
      amount,
      amount2,
      x,
      y,
      text,
      fontSize,
      rotation,
      flipX,
      flipY,
      crop,
      fit,
      outputSet,
      scale,
      svgWidth,
      lighting,
      svg,
      brand,
      selectedOutputs,
      steps,
      template,
      industry,
      logoStyle,
      layers,
      drawingData,
      drawingSourceUrl:
        toolId === 'T22' ? '' : preview || studio?.sourceUrl || '',
      selectionMode,
      noteMode,
      uploadUrls: uploads
        .filter((item) => item.status === 'uploaded' && item.url)
        .map((item) => item.url!),
      brandLogoUrl:
        brandLogoUploads.find((item) => item.status === 'uploaded')?.url || '',
      resultUrl,
      resultTaskId: taskId,
      outputs: batchDownloads.filter((item) =>
        Boolean(safeStudioSource(item.url))
      ),
      statuses,
    }),
    [
      prompt,
      modelId,
      color,
      color2,
      amount,
      amount2,
      x,
      y,
      text,
      fontSize,
      rotation,
      flipX,
      flipY,
      crop,
      fit,
      outputSet,
      scale,
      svgWidth,
      lighting,
      svg,
      brand,
      selectedOutputs,
      steps,
      template,
      industry,
      logoStyle,
      layers,
      drawingData,
      selectionMode,
      noteMode,
      uploads,
      brandLogoUploads,
      preview,
      studio?.sourceUrl,
      resultUrl,
      taskId,
      batchDownloads,
      statuses,
    ]
  );
  useEffect(() => {
    studioRef.current?.onDraft(draft);
  }, [draft]);
  useEffect(() => {
    studioRef.current?.onBusy(isWorking);
  }, [isWorking]);
  const reportedResult = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      resultUrl &&
      taskQuery.data?.status === 'success' &&
      reportedResult.current !== resultUrl
    ) {
      reportedResult.current = resultUrl;
      studioRef.current?.onResult(resultUrl, taskId);
    }
  }, [resultUrl, taskId, taskQuery.data?.status]);

  const needsUpload = !['T01', 'T16', 'T19', 'T20', 'T21', 'T24'].includes(
    toolId
  );
  const allowsMultiple = ['T11', 'T14'].includes(toolId);

  return (
    <div
      className={
        studio
          ? `studio-tool-workspace studio-layout-${STUDIO_TOOL_LAYOUTS[toolId]}`
          : 'border-border bg-card shadow-foreground/5 mt-10 grid max-w-full overflow-hidden rounded-[2rem] border shadow-2xl lg:grid-cols-[minmax(0,26rem)_1fr]'
      }
    >
      <div
        className={
          studio ? 'studio-tool-controls' : 'min-w-0 space-y-5 p-4 sm:p-7'
        }
      >
        <div
          className={
            studio
              ? 'studio-controls-heading'
              : 'border-border bg-muted/20 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b px-4 py-4 sm:-mx-7 sm:-mt-7 sm:px-7 sm:py-5'
          }
        >
          <div className="flex items-center gap-3">
            <CreativeToolTile toolId={toolId} />
            <div>
              <p className="text-sm font-semibold">{tool.name}</p>
              <p className="text-muted-foreground text-xs">
                {studio?.copy.controls || 'Configure the input'}
              </p>
            </div>
          </div>
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[.12em] uppercase">
            {studio ? studio.copy.input : 'Step 01'}
          </span>
        </div>
        {needsUpload ? (
          <div className="space-y-2">
            <ImageUploader
              key={`${toolId}-${exampleVersion}-${handoffPreview || 'upload'}`}
              allowMultiple={allowsMultiple}
              maxImages={allowsMultiple ? 20 : 1}
              maxSizeMB={10}
              title={
                studio?.copy.upload ||
                (allowsMultiple ? 'Upload images' : 'Start with an image')
              }
              emptyHint="PNG, JPG or WebP, up to 10MB each."
              defaultPreviews={
                exampleVersion
                  ? [tool.image]
                  : allowsMultiple && initial.uploadUrls?.length
                    ? initial.uploadUrls
                    : toolId === 'T11' && initial.layers?.length
                      ? initial.layers.map((layer) => layer.src)
                      : handoffPreview
                        ? [handoffPreview]
                        : undefined
              }
              onChange={(items) => {
                setUploads(items);
                const url = items.find(
                  (item) => item.status === 'uploaded' && item.url
                )?.url;
                if (url) studioRef.current?.onSource?.(url);
              }}
            />
            <button
              type="button"
              onClick={() => setExampleVersion((version) => version + 1)}
              className="text-primary min-h-10 text-xs font-semibold"
            >
              {studio?.copy.tryExample || 'Use an example image'}
            </button>
          </div>
        ) : null}

        {[
          'T01',
          'T02',
          'T06',
          'T07',
          'T08',
          'T09',
          'T20',
          'T22',
          'T23',
        ].includes(toolId) ? (
          <div>
            <p className="mb-2 text-sm font-semibold">Model</p>
            <ModelPicker
              value={activeModel?.id}
              options={compatibleModels.map((model) => ({
                id: model.id,
                label: model.label,
                credits:
                  model.credits[
                    (operation || 'generate') as keyof typeof model.credits
                  ],
              }))}
              onChange={setModelId}
              ariaLabel="Model"
            />
          </div>
        ) : null}

        {toolId === 'T04' ? (
          <>
            <FieldTitle>Background</FieldTitle>
            <div className="grid grid-cols-2 gap-3">
              <Color label="Start color" value={color} onChange={setColor} />
              <Color label="End color" value={color2} onChange={setColor2} />
            </div>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Optional: describe a generated scene instead of a local gradient"
            />
          </>
        ) : null}
        {toolId === 'T05' ? (
          <>
            <FieldTitle>Shadow controls</FieldTitle>
            <Range label="Opacity" value={amount} onChange={setAmount} />
            <Range
              label="Blur"
              value={amount2}
              max={80}
              onChange={setAmount2}
            />
            <Range label="Horizontal offset" value={x} onChange={setX} />
            <Range label="Vertical offset" value={y} onChange={setY} />
          </>
        ) : null}
        {toolId === 'T06' ? (
          <>
            <FieldTitle>Lighting setup</FieldTitle>
            <select
              value={lighting}
              onChange={(event) => setLighting(event.target.value)}
              className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
            >
              <option>Warm window light</option>
              <option>Clean product studio</option>
              <option>Soft overcast daylight</option>
            </select>
          </>
        ) : null}
        {['T07', 'T08'].includes(toolId) ? (
          <>
            <FieldTitle>Selection</FieldTitle>
            <div className="grid grid-cols-2 gap-2">
              {(['brush', 'eraser'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectionMode(item)}
                  className={`min-h-11 rounded-xl border text-sm capitalize ${selectionMode === item ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Range
              label="Brush size"
              value={amount2}
              max={80}
              onChange={setAmount2}
            />
            {!studio && (
              <DrawingCanvas
                mode={selectionMode}
                brushSize={amount2}
                onChange={setDrawingData}
                label="Paint the editable area in white"
              />
            )}
          </>
        ) : null}
        {toolId === 'T09' ? (
          <>
            <FieldTitle>New canvas boundary</FieldTitle>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Width"
                value={x * 20}
                onChange={(value) =>
                  setX(Math.max(32, Math.min(204, Math.round(value / 20))))
                }
              />
              <NumberInput
                label="Height"
                value={y * 20}
                onChange={(value) =>
                  setY(Math.max(32, Math.min(204, Math.round(value / 20))))
                }
              />
            </div>
            <p className="text-muted-foreground text-xs">
              The original image remains protected in the selected anchor
              position.
            </p>
          </>
        ) : null}
        {toolId === 'T10' ? (
          <>
            <FieldTitle>Upscale size</FieldTitle>
            <div className="grid grid-cols-2 gap-2">
              {([2, 4] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScale(value)}
                  className={`min-h-11 rounded-xl border text-sm font-semibold ${scale === value ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                >
                  {value}×
                </button>
              ))}
            </div>
          </>
        ) : null}
        {toolId === 'T11' ? (
          <LayerControls layers={layers} setLayers={setLayers} />
        ) : null}
        {toolId === 'T12' ? (
          <>
            <FieldTitle>Text style</FieldTitle>
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Color label="Text color" value={color} onChange={setColor} />
              <label className="text-xs font-semibold">
                Font size
                <Input
                  type="number"
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="mt-2"
                />
              </label>
            </div>
            <Range label="Horizontal position" value={x} onChange={setX} />
            <Range label="Vertical position" value={y} onChange={setY} />
          </>
        ) : null}
        {toolId === 'T13' ? (
          <>
            <FieldTitle>Quick edits</FieldTitle>
            <Range
              label="Rotation"
              value={rotation + 180}
              max={360}
              onChange={(value) => setRotation(value - 180)}
            />
            <Range
              label="Crop / zoom"
              value={crop}
              min={50}
              onChange={setCrop}
            />
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFlipX((value) => !value)}
                className={`min-h-11 rounded-xl border text-sm ${flipX ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                Flip X
              </button>
              <button
                type="button"
                onClick={() => setFlipY((value) => !value)}
                className={`min-h-11 rounded-xl border text-sm ${flipY ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                Flip Y
              </button>
              <button
                type="button"
                onClick={() => {
                  setRotation(0);
                  setFlipX(false);
                  setFlipY(false);
                  setCrop(100);
                }}
                className="border-border min-h-11 rounded-xl border text-sm"
              >
                Reset
              </button>
            </div>
          </>
        ) : null}
        {toolId === 'T14' ? (
          <>
            <FieldTitle>Batch operation</FieldTitle>
            <div className="border-border bg-muted/40 rounded-xl border p-3 text-sm">
              Resize oversized images to a maximum width of 1,600 px and export
              optimized PNG files locally.
            </div>
            <p className="text-muted-foreground text-xs">
              {uploads.length} items · item-level progress and failed-only retry
            </p>
          </>
        ) : null}
        {toolId === 'T15' ? (
          <>
            <FieldTitle>Output set</FieldTitle>
            <select
              value={outputSet}
              onChange={(event) => setOutputSet(event.target.value)}
              className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
            >
              <option value="social">Instagram post + story</option>
              <option value="youtube">YouTube thumbnail + community</option>
              <option value="store">Store square + landscape</option>
            </select>
            <div className="grid grid-cols-3 gap-2">
              {(['contain', 'cover', 'extend'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFit(value)}
                  className={`min-h-11 rounded-xl border text-xs capitalize ${fit === value ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                >
                  {value === 'extend' ? 'Pad' : value}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs leading-5">
              Pad adds canvas without inventing pixels. For generative
              extension, use the{' '}
              <Link
                href="/ai-image-extender"
                className="text-primary font-semibold"
              >
                AI Image Extender
              </Link>
              .
            </p>
          </>
        ) : null}
        {toolId === 'T16' ? (
          <>
            <ImageUploader
              maxImages={1}
              maxSizeMB={5}
              title="Optional brand logo"
              emptyHint="PNG, JPG or WebP. Signed-in uploads can be reused."
              defaultPreviews={
                initial.brandLogoUrl ? [initial.brandLogoUrl] : undefined
              }
              onChange={setBrandLogoUploads}
            />
            <BrandFields brand={brand} setBrand={setBrand} />
          </>
        ) : null}
        {toolId === 'T17' ? (
          <>
            <FieldTitle>Choose the image set</FieldTitle>
            <CheckList
              values={['White background', 'Studio', 'Lifestyle', 'Ad layout']}
              selected={selectedOutputs}
              setSelected={setSelectedOutputs}
            />
            <p className="text-muted-foreground text-xs">
              Estimated tasks: {selectedOutputs.length}. Estimated cost:{' '}
              {(CREATIVE_MODELS.find(
                (item) =>
                  item.id === modelId && item.operations.includes('edit')
              )?.credits.edit || 0) * selectedOutputs.length}{' '}
              credits.
            </p>
            <label className="block text-sm font-semibold">
              Model
              <select
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
                className="border-border bg-background mt-2 min-h-11 w-full rounded-xl border px-3"
              >
                {CREATIVE_MODELS.filter((model) =>
                  model.operations.includes('edit')
                ).map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label} · {model.credits.edit} credits each
                  </option>
                ))}
              </select>
            </label>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Optional campaign direction; product identity remains locked"
            />
          </>
        ) : null}
        {toolId === 'T18' ? (
          <div className="border-border bg-muted/40 rounded-xl border p-3 text-sm leading-6">
            The vector service traces the uploaded artwork and returns an SVG.
            Detail and path smoothing are selected automatically by the
            provider.
          </div>
        ) : null}
        {toolId === 'T19' ? (
          <>
            <FieldTitle>SVG source</FieldTitle>
            <Textarea
              value={svg}
              onChange={(event) => setSvg(event.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
            <div className="grid grid-cols-2 gap-3">
              <Color
                label="Primary color"
                value={color}
                onChange={(value) => {
                  setColor(value);
                  setSvg((current) => current.replace(/#[0-9a-f]{6}/i, value));
                }}
              />
              <NumberInput
                label="Export width"
                value={svgWidth}
                onChange={setSvgWidth}
              />
            </div>
          </>
        ) : null}
        {toolId === 'T20' ? (
          <>
            <BrandFields brand={brand} setBrand={setBrand} />
            <label className="block text-sm font-semibold">
              Industry
              <Input
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                className="mt-2"
              />
            </label>
            <label className="block text-sm font-semibold">
              Logo type
              <select
                value={logoStyle}
                onChange={(event) => setLogoStyle(event.target.value)}
                className="border-border bg-background mt-2 min-h-11 w-full rounded-xl border px-3"
              >
                <option>Wordmark</option>
                <option>Icon</option>
                <option>Combination mark</option>
              </select>
            </label>
          </>
        ) : null}
        {toolId === 'T21' ? (
          <>
            <FieldTitle>Choose a template</FieldTitle>
            <div className="grid gap-2">
              {[
                'Product launch',
                'Event poster',
                'Video cover',
                'Minimal logo',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTemplate(item)}
                  className={`min-h-11 rounded-xl border px-3 text-left text-sm ${template === item ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Input
              value={brand.name}
              onChange={(event) =>
                setBrand((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Brand or project name"
            />
          </>
        ) : null}
        {toolId === 'T22' ? (
          <>
            <FieldTitle>Sketch input</FieldTitle>
            {!studio && (
              <DrawingCanvas
                mode="brush"
                brushSize={Math.max(2, amount2)}
                onChange={setDrawingData}
                label="Draw a sketch, or upload one above"
                light
              />
            )}
            <Range
              label="Follow sketch structure"
              value={amount}
              onChange={setAmount}
            />
          </>
        ) : null}
        {toolId === 'T23' ? (
          <>
            <FieldTitle>Annotation tools</FieldTitle>
            <div className="grid grid-cols-3 gap-2">
              {(['arrow', 'box', 'brush'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setNoteMode(value)}
                  className={`min-h-11 rounded-xl border text-sm capitalize ${noteMode === value ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="1. Replace the marked label. 2. Remove the boxed item..."
            />
            {!studio && (
              <DrawingCanvas
                mode={noteMode}
                brushSize={
                  noteMode === 'box' ? 22 : noteMode === 'arrow' ? 12 : amount2
                }
                onChange={setDrawingData}
                label={`Draw the ${noteMode} annotation area in white`}
              />
            )}
          </>
        ) : null}
        {toolId === 'T24' ? (
          <>
            <FieldTitle>Prompt recipe</FieldTitle>
            <select
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
            >
              <option>Product campaign</option>
              <option>Poster</option>
              <option>Editorial scene</option>
            </select>
            <Input
              value={brand.name}
              onChange={(event) =>
                setBrand((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="{brand}"
            />
            <Input
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder="{audience}"
            />
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe reusable visual directions"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyRedactedRecipe()}
              className="min-h-11 w-full rounded-full"
            >
              Copy redacted share recipe
            </Button>
          </>
        ) : null}
        {toolId === 'T25' ? (
          <>
            <WorkflowFields steps={steps} setSteps={setSteps} />
            <p className="border-border bg-muted/40 rounded-xl border p-3 text-xs leading-5">
              Estimated maximum charge:{' '}
              {steps.reduce((total, step) => {
                if (step === 'Remove background') return total + 3;
                if (step === 'Upscale') return total + (scale === 4 ? 8 : 5);
                if (step === 'Relight') {
                  const model =
                    CREATIVE_MODELS.find(
                      (item) =>
                        item.id === modelId &&
                        item.operations.includes('relight')
                    ) ||
                    CREATIVE_MODELS.find((item) =>
                      item.operations.includes('relight')
                    );
                  return total + (model?.credits.relight || 0);
                }
                return total;
              }, 0)}{' '}
              credits. Local text and export steps cost 0 credits.
            </p>
            {steps.includes('Relight') ? (
              <label className="block text-sm font-semibold">
                Relight model
                <select
                  value={modelId}
                  onChange={(event) => setModelId(event.target.value)}
                  className="border-border bg-background mt-2 min-h-11 w-full rounded-xl border px-3"
                >
                  {CREATIVE_MODELS.filter((model) =>
                    model.operations.includes('relight')
                  ).map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label} · {model.credits.relight} credits
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {steps.includes('Add text') ? (
              <Input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Text added by the workflow"
              />
            ) : null}
          </>
        ) : null}

        {operation && !['T04'].includes(toolId) ? (
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              toolId === 'T20'
                ? 'Optional visual direction'
                : 'Describe the exact result while naming what must stay unchanged'
            }
            rows={4}
          />
        ) : null}

        {toolId === 'T17' ? (
          <Button
            type="button"
            onClick={() => void runProductSet()}
            disabled={isWorking || !source || !selectedOutputs.length}
            className="min-h-12 w-full rounded-full"
          >
            {isWorking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {session?.user
              ? `Generate ${selectedOutputs.length} images`
              : 'Sign in to continue'}
          </Button>
        ) : toolId === 'T25' ? (
          <Button
            type="button"
            onClick={() => void runWorkflow()}
            disabled={isWorking || !source || !steps.length}
            className="min-h-12 w-full rounded-full"
          >
            {isWorking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {session?.user ? 'Run reviewed workflow' : 'Sign in to continue'}
          </Button>
        ) : toolId === 'T04' ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void exportLocal()}
              disabled={!source}
              className="min-h-12 rounded-full"
            >
              <Download className="size-4" />
              Export local background
            </Button>
            <Button
              type="button"
              onClick={runRemote}
              disabled={isWorking || !prompt.trim()}
              className="min-h-12 rounded-full"
            >
              {isWorking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {session?.user
                ? `Generate scene · ${activeModel?.credits['replace-background']} credits`
                : 'Sign in for AI scene'}
            </Button>
          </div>
        ) : operation || utility ? (
          <Button
            type="button"
            onClick={runRemote}
            disabled={
              isWorking ||
              Boolean(utility && (!source || !utilityStatus?.enabled)) ||
              Boolean(
                operation &&
                operation !== 'generate' &&
                !source &&
                !(toolId === 'T22' && drawingData)
              ) ||
              Boolean(
                operation &&
                !['T06', 'T09', 'T20', 'T22'].includes(toolId) &&
                !prompt.trim()
              ) ||
              Boolean(['T07', 'T08', 'T23'].includes(toolId) && !drawingData)
            }
            className="min-h-12 w-full rounded-full"
          >
            {isWorking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {utility && utilityAvailability.isLoading
              ? 'Checking availability…'
              : utility && !utilityStatus?.enabled
                ? 'Awaiting production acceptance'
                : session?.user
                  ? `${tool.action}${utilityStatus ? ` · ${utilityStatus.credits} credits` : activeModel?.credits[operation as keyof typeof activeModel.credits] ? ` · ${activeModel.credits[operation as keyof typeof activeModel.credits]} credits` : ''}`
                  : 'Sign in to continue'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void runLocalFlow()}
            disabled={
              isWorking ||
              (toolId === 'T14' && uploads.length === 0) ||
              (needsUpload && toolId !== 'T14' && !source)
            }
            className="min-h-12 w-full rounded-full"
          >
            <Download className="size-4" />
            {tool.action}
          </Button>
        )}
        <p className="text-muted-foreground text-xs leading-5">
          Local previews and exports do not start a paid generation. Paid
          operations show their model and credit quote before submission.
        </p>
      </div>

      <div
        ref={previewRef}
        className={
          studio
            ? 'studio-tool-stage'
            : 'bg-muted/35 border-border min-h-80 min-w-0 border-t p-4 sm:p-7 lg:min-h-[36rem] lg:border-t-0 lg:border-l'
        }
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[.14em] uppercase">
              {studio?.copy.stage || 'Result preview'}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {studio?.copy.inspect ||
                'Inspect the output before downloading or continuing.'}
            </p>
          </div>
          <span className="border-border bg-background rounded-full border px-2.5 py-1 text-[10px] font-semibold">
            {studio ? studio.copy.output : 'Step 02'}
          </span>
        </div>
        {studio ? (
          <StudioToolStage
            toolId={toolId}
            copy={studio.copy}
            source={preview || studio.sourceUrl}
            result={resultUrl}
            draft={draft}
            outputs={batchDownloads}
            statuses={statuses}
            isWorking={isWorking}
            queuedInputs={uploads.map((item, index) => ({
              name: `Image ${index + 1}`,
              url: item.preview || item.url || '',
            }))}
            onPrompt={setPrompt}
            drawing={
              ['T07', 'T08', 'T22', 'T23'].includes(toolId) ? (
                <DrawingCanvas
                  key={
                    toolId === 'T22'
                      ? 'sketch'
                      : preview || studio.sourceUrl || 'empty'
                  }
                  mode={toolId === 'T23' ? noteMode : selectionMode}
                  brushSize={Math.max(2, amount2)}
                  onChange={setDrawingData}
                  initialData={
                    toolId === 'T22' ||
                    initial.drawingSourceUrl ===
                      (preview || studio.sourceUrl || '')
                      ? initial.drawingData
                      : undefined
                  }
                  label={studio.copy.draw}
                  light={toolId === 'T22'}
                  backdrop={
                    toolId === 'T22' ? undefined : preview || studio.sourceUrl
                  }
                />
              ) : undefined
            }
          >
            <Preview
              toolId={toolId}
              preview={resultUrl || preview}
              color={color}
              color2={color2}
              amount={amount}
              amount2={amount2}
              x={x}
              y={y}
              text={text}
              fontSize={fontSize}
              rotation={rotation}
              fit={fit}
              svg={svg}
              layers={layers}
              noteMode={noteMode}
              template={template}
              brand={brand.name}
              statuses={statuses}
              downloads={batchDownloads}
              flipX={flipX}
              flipY={flipY}
              crop={crop}
              isWorking={isWorking}
            />
          </StudioToolStage>
        ) : (
          <Preview
            toolId={toolId}
            preview={resultUrl || preview}
            color={color}
            color2={color2}
            amount={amount}
            amount2={amount2}
            x={x}
            y={y}
            text={text}
            fontSize={fontSize}
            rotation={rotation}
            fit={fit}
            svg={svg}
            layers={layers}
            noteMode={noteMode}
            template={template}
            brand={brand.name}
            statuses={statuses}
            downloads={batchDownloads}
            flipX={flipX}
            flipY={flipY}
            crop={crop}
            isWorking={isWorking}
          />
        )}
        {studio && toolId === 'T14' && (
          <>
            <p className="studio-stage-note">{studio.copy.localExports}</p>
            {failedBatchItems.length > 0 && (
              <Button
                type="button"
                disabled={isWorking}
                onClick={() => void runLocalFlow(true)}
              >
                {studio.copy.retryFailed} · {failedBatchItems.length}
              </Button>
            )}
          </>
        )}
        {studio &&
          resultUrl &&
          taskQuery.data?.status === 'success' &&
          toolId !== 'T18' && (
            <a
              href={`/api/images/${encodeURIComponent(taskId!)}/download`}
              className="studio-result-download"
            >
              <Download size={16} />
              {studio.copy.download}
            </a>
          )}
        {toolId === 'T18' &&
        taskId &&
        taskQuery.data?.status === 'success' &&
        resultUrl ? (
          <a
            href={`/api/images/${encodeURIComponent(taskId)}/download`}
            className="bg-primary text-primary-foreground mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"
          >
            <Download className="size-4" />
            Download traced file
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Preview(props: {
  toolId: CreativeToolId;
  preview?: string;
  color: string;
  color2: string;
  amount: number;
  amount2: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  rotation: number;
  fit: string;
  svg: string;
  layers: Layer[];
  noteMode: string;
  template: string;
  brand: string;
  statuses: string[];
  downloads: BatchDownload[];
  flipX: boolean;
  flipY: boolean;
  crop: number;
  isWorking: boolean;
}) {
  if (props.isWorking)
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  if (props.toolId === 'T19') {
    const previewUrl = safeSvgPreview(props.svg);
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground mb-3 text-sm">
          Sanitized vector preview
        </p>
        <div className="border-border bg-background flex min-h-72 items-center justify-center rounded-2xl border p-6">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Sanitized SVG preview"
              className="max-h-80 max-w-full"
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter a valid SVG document to preview it.
            </p>
          )}
        </div>
      </div>
    );
  }
  if (['T14', 'T16', 'T17', 'T20', 'T21', 'T24', 'T25'].includes(props.toolId))
    return (
      <div className="mx-auto flex min-h-[28rem] max-w-2xl items-center">
        <div className="border-border bg-background w-full rounded-3xl border p-6 sm:p-8">
          <p className="text-primary text-xs font-semibold tracking-[.16em] uppercase">
            Live setup preview
          </p>
          <h3 className="mt-4 font-serif text-3xl">
            {props.toolId === 'T14'
              ? 'Batch progress'
              : props.toolId === 'T17'
                ? 'Product set progress'
                : props.toolId === 'T25'
                  ? 'Workflow progress'
                  : props.brand || props.template}
          </h3>
          <p className="text-muted-foreground mt-3 leading-7">
            {props.toolId === 'T25'
              ? 'Your workflow stays inspectable step by step. Paid steps are never run from page load.'
              : 'Fill the task-specific fields on the left. This preview updates before you save or generate.'}
          </p>
          {props.statuses.length ? (
            <ul className="mt-6 grid gap-2">
              {props.statuses.map((status) => (
                <li
                  key={status}
                  className="bg-muted flex items-center gap-2 rounded-xl p-3 text-sm"
                >
                  <Check className="size-4 text-emerald-600" />
                  {status}
                </li>
              ))}
            </ul>
          ) : null}
          {props.downloads.length ? (
            <div className="mt-5 grid gap-2">
              {props.downloads.map((download) => (
                <a
                  key={`${download.name}-${download.url}`}
                  href={download.url}
                  download={download.name}
                  className="border-border text-primary flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-semibold"
                >
                  {download.name}
                  <Download className="size-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  if (!props.preview)
    return (
      <div className="flex min-h-[28rem] items-center justify-center text-center">
        <div>
          <Upload className="text-muted-foreground mx-auto size-10" />
          <h3 className="mt-4 text-lg font-semibold">Start with an image</h3>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
            Upload your own file above. The workspace stays compact until an
            image is ready.
          </p>
        </div>
      </div>
    );
  const imageStyle =
    props.toolId === 'T05'
      ? {
          filter: `drop-shadow(${Math.round((props.x - 50) / 2)}px ${Math.round((props.y - 50) / 2)}px ${props.amount2}px rgba(0,0,0,${props.amount / 100}))`,
        }
      : props.toolId === 'T13'
        ? {
            transform: `rotate(${props.rotation}deg) scale(${props.flipX ? -1 : 1}, ${props.flipY ? -1 : 1}) scale(${100 / props.crop})`,
          }
        : undefined;
  return (
    <div className="mx-auto flex min-h-[28rem] max-w-3xl items-center justify-center">
      <div
        className="relative max-h-[32rem] w-fit max-w-full overflow-hidden rounded-2xl border border-white/30 shadow-sm"
        style={
          props.toolId === 'T04'
            ? {
                background: `linear-gradient(135deg, ${props.color}, ${props.color2})`,
              }
            : undefined
        }
      >
        {props.toolId === 'T11' ? (
          <div className="relative min-h-80 min-w-80">
            {props.layers
              .filter((layer) => layer.visible)
              .map((layer) => (
                <img
                  key={layer.id}
                  src={layer.src}
                  alt={layer.name}
                  style={{
                    opacity: layer.opacity / 100,
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale / 100})`,
                  }}
                  className="absolute max-h-[30rem] max-w-full object-contain"
                />
              ))}
          </div>
        ) : (
          <img
            src={props.preview}
            alt="Tool preview"
            style={{
              ...imageStyle,
              objectFit: props.fit === 'cover' ? 'cover' : 'contain',
            }}
            className="max-h-[32rem] max-w-full"
          />
        )}
        {props.toolId === 'T12' ? (
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-bold whitespace-pre-wrap"
            style={{
              left: `${props.x}%`,
              top: `${props.y}%`,
              color: props.color,
              fontSize: `${Math.max(12, props.fontSize / 2)}px`,
            }}
          >
            {props.text}
          </span>
        ) : null}
        {props.toolId === 'T23' ? (
          <div
            className={`pointer-events-none absolute top-1/3 left-1/3 border-4 border-red-500 ${props.noteMode === 'box' ? 'h-24 w-32' : 'h-12 w-12 rounded-full'}`}
          >
            <span className="absolute -top-4 -left-4 flex size-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
              1
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FieldTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold">{children}</h3>;
}
function Range({
  label,
  value,
  onChange,
  max = 100,
  min = 0,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <span className="text-muted-foreground float-right">{value}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary mt-2 h-11 w-full"
      />
    </label>
  );
}
function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-border mt-2 h-11 w-full rounded-xl border bg-transparent p-1"
      />
    </label>
  );
}
function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange?: (value: number) => void;
}) {
  return (
    <label className="text-xs font-semibold">
      {label}
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange?.(Number(event.target.value))}
        readOnly={!onChange}
        className="mt-2"
      />
    </label>
  );
}

function DrawingCanvas({
  mode,
  brushSize,
  onChange,
  label,
  light = false,
  backdrop,
  initialData,
}: {
  mode: 'brush' | 'eraser' | 'arrow' | 'box';
  brushSize: number;
  onChange: (dataUrl: string) => void;
  label: string;
  light?: boolean;
  backdrop?: string;
  initialData?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 320 });
  const drawingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const baselineHasDrawing = useRef(false);

  const reset = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = light ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    baselineHasDrawing.current = false;
    onChange('');
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const previous = historyRef.current.pop();
    if (!canvas || !ctx || !previous) return;
    ctx.putImageData(previous, 0, 0);
    onChange(
      historyRef.current.length || baselineHasDrawing.current
        ? canvas.toDataURL('image/png')
        : ''
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = light ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    baselineHasDrawing.current = false;
    let cancelled = false;
    if (initialData) {
      const saved = new Image();
      saved.onload = () => {
        if (cancelled) return;
        ctx.drawImage(saved, 0, 0, canvas.width, canvas.height);
        baselineHasDrawing.current = true;
        onChange(canvas.toDataURL('image/png'));
      };
      saved.src = initialData;
    } else onChange('');
    return () => {
      cancelled = true;
    };
    // Restore the tool's saved monochrome drawing, never bake in the source image.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [light, dimensions.width, dimensions.height]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  };

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    const current = point(event);
    startPointRef.current = current;
    snapshotRef.current = ctx.getImageData(
      0,
      0,
      event.currentTarget.width,
      event.currentTarget.height
    );
    historyRef.current = [
      ...historyRef.current.slice(-19),
      snapshotRef.current,
    ];
    ctx.beginPath();
    ctx.moveTo(current.x, current.y);
  };

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    const current = point(event);
    if ((mode === 'arrow' || mode === 'box') && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = light ? '#222222' : '#ffffff';
      ctx.lineWidth = Math.max(2, brushSize);
      if (mode === 'box') {
        ctx.strokeRect(
          startPointRef.current.x,
          startPointRef.current.y,
          current.x - startPointRef.current.x,
          current.y - startPointRef.current.y
        );
      } else {
        const angle = Math.atan2(
          current.y - startPointRef.current.y,
          current.x - startPointRef.current.x
        );
        const head = Math.max(14, brushSize * 1.7);
        ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
        ctx.lineTo(current.x, current.y);
        ctx.lineTo(
          current.x - head * Math.cos(angle - Math.PI / 6),
          current.y - head * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(
          current.x - head * Math.cos(angle + Math.PI / 6),
          current.y - head * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
      return;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, brushSize);
    ctx.strokeStyle =
      mode === 'eraser' ? '#000000' : light ? '#222222' : '#ffffff';
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
  };

  const finish = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    draw(event);
    drawingRef.current = false;
    onChange(event.currentTarget.toDataURL('image/png'));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={undo}
            className="text-primary text-xs font-semibold"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-primary text-xs font-semibold"
          >
            Clear
          </button>
        </span>
      </div>
      <div className="studio-drawing-surface" style={{ position: 'relative' }}>
        {backdrop && (
          <img
            src={backdrop}
            alt="Reference for region selection"
            onLoad={(e) => {
              const image = e.currentTarget;
              const ratio = Math.min(
                1,
                2048 / Math.max(image.naturalWidth, image.naturalHeight)
              );
              setDimensions({
                width: Math.max(1, Math.round(image.naturalWidth * ratio)),
                height: Math.max(1, Math.round(image.naturalHeight * ratio)),
              });
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            position: 'relative',
            aspectRatio: `${dimensions.width}/${dimensions.height}`,
            mixBlendMode: backdrop ? 'screen' : undefined,
            opacity: backdrop ? 0.6 : 1,
          }}
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={finish}
          onPointerCancel={finish}
          className="border-border bg-background aspect-[2/1] w-full touch-none rounded-2xl border"
          aria-label={label}
        />
      </div>
    </div>
  );
}
function BrandFields({
  brand,
  setBrand,
}: {
  brand: { name: string; font: string; primary: string; secondary: string };
  setBrand: Dispatch<
    SetStateAction<{
      name: string;
      font: string;
      primary: string;
      secondary: string;
    }>
  >;
}) {
  return (
    <>
      <FieldTitle>Brand details</FieldTitle>
      <Input
        value={brand.name}
        onChange={(event) =>
          setBrand((current) => ({ ...current, name: event.target.value }))
        }
        placeholder="Brand name"
      />
      <label className="block text-sm font-semibold">
        Font
        <select
          value={brand.font}
          onChange={(event) =>
            setBrand((current) => ({ ...current, font: event.target.value }))
          }
          className="border-border bg-background mt-2 min-h-11 w-full rounded-xl border px-3"
        >
          <option>Inter</option>
          <option>Libre Baskerville</option>
          <option>System Sans</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Color
          label="Primary"
          value={brand.primary}
          onChange={(value) =>
            setBrand((current) => ({ ...current, primary: value }))
          }
        />
        <Color
          label="Secondary"
          value={brand.secondary}
          onChange={(value) =>
            setBrand((current) => ({ ...current, secondary: value }))
          }
        />
      </div>
    </>
  );
}
function CheckList({
  values,
  selected,
  setSelected,
}: {
  values: string[];
  selected: string[];
  setSelected: (value: string[]) => void;
}) {
  return (
    <div className="grid gap-2">
      {values.map((value) => (
        <label
          key={value}
          className="border-border flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm"
        >
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={(event) =>
              setSelected(
                event.target.checked
                  ? [...selected, value]
                  : selected.filter((item) => item !== value)
              )
            }
          />
          {value}
        </label>
      ))}
    </div>
  );
}
function LayerControls({
  layers,
  setLayers,
}: {
  layers: Layer[];
  setLayers: Dispatch<SetStateAction<Layer[]>>;
}) {
  const update = (id: string, patch: Partial<Layer>, allowLocked = false) =>
    setLayers((items) =>
      items.map((item) =>
        item.id === id && (!item.locked || allowLocked)
          ? { ...item, ...patch }
          : item
      )
    );
  return (
    <>
      <FieldTitle>Layers</FieldTitle>
      <div className="grid gap-2">
        {layers.map((layer, index) => (
          <div key={layer.id} className="border-border rounded-xl border p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  update(layer.id, { visible: !layer.visible }, true)
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
                  update(layer.id, { locked: !layer.locked }, true)
                }
              >
                {layer.locked ? (
                  <Lock className="size-4" />
                ) : (
                  <LockOpen className="size-4" />
                )}
              </button>
              <span className="min-w-0 flex-1 truncate text-sm">
                {layer.name}
              </span>
              <button
                disabled={layer.locked || index === 0}
                onClick={() =>
                  setLayers((items) => {
                    const next = [...items];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    return next;
                  })
                }
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                disabled={layer.locked || index === layers.length - 1}
                onClick={() =>
                  setLayers((items) => {
                    const next = [...items];
                    [next[index + 1], next[index]] = [
                      next[index],
                      next[index + 1],
                    ];
                    return next;
                  })
                }
              >
                <ArrowDown className="size-4" />
              </button>
            </div>
            <Range
              label="Opacity"
              value={layer.opacity}
              disabled={layer.locked}
              onChange={(value) => update(layer.id, { opacity: value })}
            />
            <div className="grid grid-cols-2 gap-x-3">
              <Range
                label="Horizontal"
                value={layer.x}
                disabled={layer.locked}
                onChange={(value) => update(layer.id, { x: value })}
              />
              <Range
                label="Vertical"
                value={layer.y}
                disabled={layer.locked}
                onChange={(value) => update(layer.id, { y: value })}
              />
              <Range
                label="Scale"
                value={layer.scale}
                min={10}
                max={200}
                disabled={layer.locked}
                onChange={(value) => update(layer.id, { scale: value })}
              />
              <Range
                label="Rotation"
                value={layer.rotation + 180}
                max={360}
                disabled={layer.locked}
                onChange={(value) =>
                  update(layer.id, { rotation: value - 180 })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
function WorkflowFields({
  steps,
  setSteps,
}: {
  steps: string[];
  setSteps: Dispatch<SetStateAction<string[]>>;
}) {
  return (
    <>
      <FieldTitle>Workflow steps</FieldTitle>
      <div className="grid gap-2">
        {steps.map((step, index) => (
          <div
            key={`${step}-${index}`}
            className="border-border flex min-h-11 items-center gap-2 rounded-xl border px-3"
          >
            <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <span className="flex-1 text-sm">{step}</span>
            <button
              onClick={() =>
                setSteps((items) =>
                  items.filter((_, itemIndex) => itemIndex !== index)
                )
              }
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <select
        onChange={(event) => {
          if (event.target.value)
            setSteps((items) => [...items, event.target.value]);
          event.target.value = '';
        }}
        className="border-border bg-background min-h-11 w-full rounded-xl border px-3"
      >
        <option value="">Add a step…</option>
        <option>Remove background</option>
        <option>Relight</option>
        <option>Upscale</option>
        <option>Add text</option>
        <option>Export</option>
      </select>
      <p className="text-muted-foreground text-xs">
        Review every step and its cost before running. Completed steps remain
        inspectable.
      </p>
    </>
  );
}

export function DedicatedToolPage({ toolId }: { toolId: CreativeToolId }) {
  const tool = findPublicTool(toolId)!;
  const guide = PANEL_GUIDANCE[tool.panel];
  const isRemote =
    Boolean(AI_TOOL_OPERATION[toolId] || UTILITY_OPERATION[toolId]) ||
    ['T17', 'T25'].includes(toolId);
  const related = PUBLIC_TOOL_PAGES.filter(
    (candidate) =>
      candidate.id !== toolId && candidate.category === tool.category
  ).slice(0, 3);
  return (
    <main className="flex-1">
      <GeneratorPageHero
        breadcrumbs={[
          { href: '/', label: 'Home' },
          { href: '/tools', label: 'AI tools' },
          { label: tool.name },
        ]}
        eyebrow={`${tool.category} workflow`}
        title={tool.name}
        description={tool.summary}
        image={tool.cardImage || tool.image}
        imageAlt={`${tool.name} example showing the intended workflow result`}
        icon={
          <CreativeToolTile
            toolId={toolId}
            className="size-12 rounded-2xl [&_svg]:size-6"
          />
        }
        primaryLabel={tool.action}
        note={
          isRemote
            ? 'Preview inputs first. The selected model and credit quote are shown before a paid request.'
            : 'This workflow runs in your browser and does not start a paid generation task.'
        }
        badges={[
          isRemote ? 'Tracked AI task' : 'Local preview',
          isRemote ? 'Visible credit quote' : 'No credits to export',
          'Purpose-built controls',
        ]}
        exampleLabel="Site-owned example"
      />

      <section id="generator" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                Working area
              </p>
              <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-5xl">
                Make the result here
              </h2>
            </div>
            <p className="text-muted-foreground max-w-3xl text-lg leading-8">
              {guide.input} The result panel stays beside the controls on large
              screens and moves below them on smaller devices.
            </p>
          </div>
          <DedicatedToolWorkspace toolId={toolId} />
        </div>
      </section>

      <GeneratorGuideSections
        title={`What a useful ${tool.name.toLowerCase()} result should give you`}
        description={`${tool.summary} The workflow is organized around a usable output, not a decorative demo.`}
        outcomes={[
          {
            title: 'A suitable source',
            description: guide.input,
          },
          {
            title: 'Controls with a clear purpose',
            description: `${guide.tip} Settings remain visible so the result can be repeated or adjusted.`,
          },
          {
            title: 'An export you can use',
            description: guide.output,
          },
        ]}
        steps={[
          {
            title: 'Prepare the input',
            description: guide.input,
          },
          {
            title: 'Set the important controls',
            description:
              'Choose only the model, dimensions, mask, style, or layout controls relevant to this task.',
          },
          {
            title: 'Review cost and boundaries',
            description: isRemote
              ? 'Confirm the visible credit quote and the details that must remain unchanged before submitting.'
              : 'Preview the local change before exporting; no paid generation is started.',
          },
          {
            title: 'Inspect and continue',
            description:
              'Check edges, text, identity, product details, and output size, then download or move to the next editing tool.',
          },
        ]}
        tips={[
          guide.tip,
          'Start from the cleanest, largest source available.',
          isRemote
            ? 'Name what must stay unchanged, not only what should change.'
            : 'Preview at the final display size before downloading.',
          'Keep the original file so you can compare or restart safely.',
        ]}
        limitation={guide.limitation}
        faqs={[
          {
            question: `What should I upload for ${tool.name}?`,
            answer: guide.input,
          },
          {
            question: 'Does using this page cost credits?',
            answer: isRemote
              ? 'Uploading and preparing the request do not charge credits. A paid operation shows its model and credit quote before submission.'
              : 'No. This workflow performs its preview and export locally in your browser.',
          },
          {
            question: 'What will I receive?',
            answer: guide.output,
          },
          {
            question: 'What should I check before publishing?',
            answer: guide.limitation,
          },
        ]}
        related={related.map((item) => ({
          href: item.path,
          title: item.name,
          description: item.summary,
          image: item.cardImage,
        }))}
      />
    </main>
  );
}
