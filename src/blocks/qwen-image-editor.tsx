import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Download,
  ImagePlus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { QWEN_IMAGE_3_MAX_PROMPT_LENGTH } from '@/config/image-models';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  clearEditorReferenceFiles,
  loadEditorReferenceFiles,
  parseEditorDraft,
  saveEditorReferenceFiles,
} from '@/lib/editor-draft';
import { stageGeneratorPrompt } from '@/lib/prompt-navigation';
import { m } from '@/paraglide/messages.js';
import {
  ImageUploader,
  uploadImageFile,
  type ImageUploaderValue,
} from '@/components/image-uploader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type EditTask = {
  id: string;
  status: string;
  images: Array<{ imageUrl?: string }>;
  errorMessage?: string;
};

export function QwenImageEditor() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState('');
  const [initialPreviews, setInitialPreviews] = useState<string[]>([]);
  const [references, setReferences] = useState<ImageUploaderValue[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [reportedTaskId, setReportedTaskId] = useState<string | null>(null);
  const readyUrls = references
    .filter((item) => item.status === 'uploaded' && item.url)
    .map((item) => item.url as string);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.sessionStorage.getItem('qwenimage3:editor-source') || 'null'
      );
      if (typeof saved?.url === 'string') setInitialPreviews([saved.url]);
      if (typeof saved?.prompt === 'string') setPrompt(saved.prompt);
      window.sessionStorage.removeItem('qwenimage3:editor-source');
    } catch {
      window.sessionStorage.removeItem('qwenimage3:editor-source');
    }
    try {
      const draft = parseEditorDraft(
        window.sessionStorage.getItem('qwenimage3:editor-draft'),
        window.location.origin
      );
      if (draft.prompt) setPrompt(draft.prompt);
      if (draft.imageUrls.length) setInitialPreviews(draft.imageUrls);
      window.sessionStorage.removeItem('qwenimage3:editor-draft');
    } catch {
      window.sessionStorage.removeItem('qwenimage3:editor-draft');
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    void loadEditorReferenceFiles()
      .then(async (files) => {
        if (!files.length) return;
        const urls = await Promise.all(files.map(uploadImageFile));
        setInitialPreviews(urls);
        await clearEditorReferenceFiles();
      })
      .catch(() => toast.error(m['editor.error']()));
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    const raw = window.sessionStorage.getItem('qwenimage3:anonymous-claim');
    if (!raw) return;
    try {
      const claim = JSON.parse(raw);
      if (typeof claim?.token !== 'string') return;
      apiPost('/api/images/anonymous', {
        claim: true,
        token: claim.token,
        prompt: typeof claim.prompt === 'string' ? claim.prompt : '',
      })
        .then(() => {
          window.sessionStorage.removeItem('qwenimage3:anonymous-claim');
          queryClient.invalidateQueries({ queryKey: ['user-images'] });
        })
        .catch(() => undefined);
    } catch {
      window.sessionStorage.removeItem('qwenimage3:anonymous-claim');
    }
  }, [queryClient, session?.user]);

  const taskQuery = useQuery({
    queryKey: ['image-edit-task', taskId],
    queryFn: () => apiGet<EditTask>(`/api/images/${taskId}`),
    enabled: Boolean(taskId),
    refetchInterval: (query) =>
      ['success', 'failed'].includes(query.state.data?.status || '')
        ? false
        : 1400,
  });

  const editMutation = useMutation({
    mutationFn: () =>
      apiPost<{ id: string }>('/api/images/edit', {
        prompt,
        image_urls: readyUrls,
      }),
    onSuccess: ({ id }) => setTaskId(id),
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    const task = taskQuery.data;
    if (!task || task.id === reportedTaskId) return;
    if (task.status === 'success') {
      setReportedTaskId(task.id);
      trackFunnelEvent('image_edit_success');
      toast.success(m['editor.success']());
    } else if (task.status === 'failed') {
      setReportedTaskId(task.id);
      toast.error(task.errorMessage || m['editor.error']());
    }
  }, [reportedTaskId, taskQuery.data]);

  const resultUrl = taskQuery.data?.images?.[0]?.imageUrl;
  const examples = [
    m['editor.example_1'](),
    m['editor.example_2'](),
    m['editor.example_3'](),
  ];
  const isWorking =
    editMutation.isPending ||
    (Boolean(taskId) &&
      !['success', 'failed'].includes(taskQuery.data?.status || ''));

  async function startEdit() {
    if (!session?.user) {
      try {
        await saveEditorReferenceFiles(
          references
            .map((reference) => reference.localFile)
            .filter((file): file is File => Boolean(file))
        );
      } catch {
        toast.error(m['editor.error']());
        return;
      }
      window.sessionStorage.setItem(
        'qwenimage3:editor-draft',
        JSON.stringify({ prompt, imageUrls: readyUrls })
      );
      window.location.href = '/sign-up?callbackUrl=%2Fqwen-image-editor';
      return;
    }
    if (!readyUrls.length || !prompt.trim()) return;
    trackFunnelEvent('image_edit_started', { references: readyUrls.length });
    setTaskId(null);
    editMutation.mutate();
  }

  return (
    <main>
      <section className="border-border border-b px-3 py-12 sm:px-4 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              {m['editor.eyebrow']()}
            </p>
            <h1 className="mt-4 font-serif text-4xl tracking-tight text-balance sm:text-6xl">
              {m['editor.title']()}
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-2xl leading-7">
              {m['editor.description']()}
            </p>
          </div>

          <div className="border-border bg-card mt-10 grid overflow-hidden rounded-3xl border shadow-sm lg:grid-cols-2">
            <div className="space-y-5 p-4 sm:p-7">
              <ImageUploader
                allowMultiple
                maxImages={3}
                maxSizeMB={10}
                defaultPreviews={initialPreviews}
                title={m['editor.upload_title']()}
                emptyHint={m['editor.upload_hint']()}
                onChange={setReferences}
                copy={{
                  previewAlt: m['editor.preview_alt'](),
                  replaceImage: m['editor.replace'](),
                  removeImage: m['editor.remove'](),
                  upload: m['editor.upload'](),
                }}
              />
              <div>
                <label htmlFor="edit-prompt" className="text-sm font-medium">
                  {m['editor.prompt_label']()}
                </label>
                <Textarea
                  id="edit-prompt"
                  value={prompt}
                  maxLength={QWEN_IMAGE_3_MAX_PROMPT_LENGTH}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={m['editor.prompt_placeholder']()}
                  className="mt-2 min-h-32 resize-y"
                />
                <p className="text-muted-foreground mt-1 text-right text-xs">
                  {prompt.length.toLocaleString()}/
                  {QWEN_IMAGE_3_MAX_PROMPT_LENGTH.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={startEdit}
                disabled={
                  isWorking ||
                  (Boolean(session?.user) &&
                    (!readyUrls.length || !prompt.trim()))
                }
                className="min-h-12 w-full rounded-full"
              >
                {isWorking ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {m['editor.working']()}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    {session?.user
                      ? m['editor.submit']()
                      : m['editor.sign_in_submit']()}
                  </>
                )}
              </Button>
              <p className="text-muted-foreground text-xs leading-5">
                {m['editor.model_note']()}
              </p>
            </div>
            <div className="bg-muted/40 flex min-h-[26rem] items-center justify-center border-t p-4 lg:border-t-0 lg:border-l">
              {resultUrl ? (
                <div className="w-full space-y-4">
                  <img
                    src={resultUrl}
                    alt={m['editor.result_alt']()}
                    className="mx-auto max-h-[36rem] w-auto max-w-full rounded-2xl object-contain"
                  />
                  <a
                    href={resultUrl}
                    download
                    onClick={() => trackFunnelEvent('image_download')}
                    className="border-border bg-background mx-auto flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-sm font-semibold"
                  >
                    <Download className="size-4" />
                    {m['editor.download']()}
                  </a>
                </div>
              ) : (
                <div className="text-muted-foreground max-w-xs text-center">
                  <ImagePlus className="mx-auto size-10 opacity-50" />
                  <p className="mt-4 text-sm leading-6">
                    {isWorking
                      ? m['editor.loading_note']()
                      : m['editor.empty_result']()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl space-y-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl tracking-tight">
                {m['editor.what_title']()}
              </h2>
              <p className="text-muted-foreground mt-4 leading-7">
                {m['editor.what_body']()}
              </p>
            </div>
            <div>
              <h2 className="font-serif text-3xl tracking-tight">
                {m['editor.how_title']()}
              </h2>
              <ol className="text-muted-foreground mt-4 list-decimal space-y-2 pl-5 leading-7">
                <li>{m['editor.step_1']()}</li>
                <li>{m['editor.step_2']()}</li>
                <li>{m['editor.step_3']()}</li>
              </ol>
            </div>
          </div>
          <div>
            <h2 className="font-serif text-3xl tracking-tight">
              {m['editor.examples_title']()}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {examples.map((example) => (
                <article
                  key={example}
                  className="border-border bg-card rounded-2xl border p-5"
                >
                  <p className="text-sm leading-6">{example}</p>
                  <Link
                    href="/#generator"
                    onClick={() => stageGeneratorPrompt(example)}
                    className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-semibold"
                  >
                    {m['editor.try_prompt']()}
                    <ArrowRight className="size-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
