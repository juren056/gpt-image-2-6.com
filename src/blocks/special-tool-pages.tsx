import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import {
  AiVideoPage,
  BackgroundRemoverPage,
  YouTubeThumbnailPage,
  type SpecialToolPageCopy,
} from '@/components/special-tool-pages';
import type {
  BackgroundWorkspaceCopy,
  VideoWorkspaceCopy,
  YouTubeWorkspaceCopy,
} from '@/components/special-tool-workspaces';

type SpecialKind = 'youtube_thumbnail' | 'video' | 'background_remover';

const PATHS: Record<SpecialKind, string> = {
  youtube_thumbnail: '/ai-youtube-thumbnail-generator',
  video: '/ai-video-generator',
  background_remover: '/image-background-remover',
};

function commonWorkspace() {
  return {
    signIn: m['tools.special.sign_in'](),
    credits: m['tools.special.credits']({ credits: '{credits}' }),
    creditsLoading: m['tools.special.credits_loading'](),
    buyCredits: m['tools.special.buy_credits'](),
    generating: m['tools.special.generating'](),
    ready: m['tools.special.ready'](),
    failed: m['tools.special.failed'](),
  };
}

function pageCopy(kind: SpecialKind): SpecialToolPageCopy {
  const relatedKinds = (
    ['youtube_thumbnail', 'video', 'background_remover'] as const
  ).filter((candidate) => candidate !== kind);

  return {
    breadcrumbHome: m['tools.common.home'](),
    breadcrumbTools: m['tools.common.tools'](),
    eyebrow: tDynamic(`tools.${kind}.eyebrow`),
    title: tDynamic(`tools.${kind}.title`),
    description: tDynamic(`tools.${kind}.description`),
    primaryAction: tDynamic(`tools.${kind}.primary_action`),
    disclosure: tDynamic(`tools.${kind}.disclosure`),
    toolTitle: tDynamic(`tools.${kind}.tool_title`),
    toolDescription: tDynamic(`tools.${kind}.tool_description`),
    exampleTitle: tDynamic(`tools.${kind}.example_title`),
    exampleCaption: tDynamic(`tools.${kind}.example_caption`),
    sections: Array.from({ length: 4 }, (_, index) => ({
      title: tDynamic(`tools.${kind}.section_${index + 1}_title`),
      body: tDynamic(`tools.${kind}.section_${index + 1}_body`),
      bullets: Array.from({ length: 2 }, (__, bulletIndex) =>
        tDynamic(`tools.${kind}.section_${index + 1}_bullet_${bulletIndex + 1}`)
      ),
    })),
    faqTitle: m['tools.common.faq_title'](),
    faqs: Array.from({ length: 5 }, (_, index) => ({
      question: tDynamic(`tools.${kind}.faq_${index + 1}_question`),
      answer: tDynamic(`tools.${kind}.faq_${index + 1}_answer`),
    })),
    relatedTitle: m['tools.common.related_title'](),
    related: [
      ...(kind === 'video'
        ? [
            {
              href: '/minimax-h3',
              label: m['minimax_h3.title'](),
            },
            {
              href: '/seedance-2-5',
              label: m['seedance25.title'](),
            },
          ]
        : []),
      ...relatedKinds.map((relatedKind) => ({
        href: PATHS[relatedKind],
        label: tDynamic(`tools.${relatedKind}.link_label`),
      })),
      {
        href: '/tools',
        label: m['tools.common.all_tools'](),
      },
    ],
  };
}

function youtubeWorkspace(): YouTubeWorkspaceCopy {
  return {
    ...commonWorkspace(),
    titleLabel: m['tools.youtube_thumbnail.field_title'](),
    titlePlaceholder: m['tools.youtube_thumbnail.field_title_placeholder'](),
    subjectLabel: m['tools.youtube_thumbnail.field_subject'](),
    subjectPlaceholder:
      m['tools.youtube_thumbnail.field_subject_placeholder'](),
    hookLabel: m['tools.youtube_thumbnail.field_hook'](),
    hookPlaceholder: m['tools.youtube_thumbnail.field_hook_placeholder'](),
    moodLabel: m['tools.youtube_thumbnail.field_mood'](),
    moods: Array.from({ length: 4 }, (_, index) => ({
      label: tDynamic(`tools.youtube_thumbnail.mood_${index + 1}_label`),
      prompt: tDynamic(`tools.youtube_thumbnail.mood_${index + 1}_prompt`),
    })),
    generate: m['tools.youtube_thumbnail.generate'](),
    resultLabel: m['tools.youtube_thumbnail.result_label'](),
    empty: m['tools.youtube_thumbnail.result_empty'](),
    cost: m['tools.youtube_thumbnail.cost'](),
  };
}

function videoWorkspace(): VideoWorkspaceCopy {
  return {
    ...commonWorkspace(),
    sceneLabel: m['tools.video.field_scene'](),
    scenePlaceholder: m['tools.video.field_scene_placeholder'](),
    cameraLabel: m['tools.video.field_camera'](),
    cameras: Array.from({ length: 4 }, (_, index) => ({
      label: tDynamic(`tools.video.camera_${index + 1}_label`),
      prompt: tDynamic(`tools.video.camera_${index + 1}_prompt`),
    })),
    rhythmLabel: m['tools.video.field_rhythm'](),
    rhythms: Array.from({ length: 3 }, (_, index) => ({
      label: tDynamic(`tools.video.rhythm_${index + 1}_label`),
      prompt: tDynamic(`tools.video.rhythm_${index + 1}_prompt`),
    })),
    formatLabel: m['tools.video.field_format'](),
    durationLabel: m['tools.video.field_duration'](),
    generate: m['tools.video.generate'](),
    emptyTitle: m['tools.video.result_empty_title'](),
    emptyBody: m['tools.video.result_empty_body'](),
    cost: m['tools.video.cost'](),
    subscribe: m['tools.video.subscribe'](),
  };
}

function backgroundWorkspace(): BackgroundWorkspaceCopy {
  return {
    ...commonWorkspace(),
    uploadTitle: m['tools.background_remover.upload_title'](),
    uploadHint: m['tools.background_remover.upload_hint'](),
    remove: m['tools.background_remover.remove'](),
    resultTitle: m['tools.background_remover.result_title'](),
    resultHint: m['tools.background_remover.result_hint'](),
    download: m['tools.background_remover.download'](),
    beforeAlt: m['tools.background_remover.before_alt'](),
    afterAlt: m['tools.background_remover.after_alt'](),
    cost: m['tools.background_remover.cost'](),
  };
}

export function YouTubeThumbnailToolPage() {
  return (
    <YouTubeThumbnailPage
      copy={pageCopy('youtube_thumbnail')}
      workspace={youtubeWorkspace()}
    />
  );
}

export function AiVideoToolPage() {
  return <AiVideoPage copy={pageCopy('video')} workspace={videoWorkspace()} />;
}

export function BackgroundRemoverToolPage() {
  return (
    <>
      <BackgroundRemoverPage
        copy={pageCopy('background_remover')}
        workspace={backgroundWorkspace()}
      />
    </>
  );
}

export function getSpecialToolFaqs(kind: SpecialKind, locale: string) {
  const localized = (key: string) => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function'
      ? (fn as (inputs: object, options: { locale: string }) => string)(
          {},
          { locale }
        )
      : key;
  };
  return Array.from({ length: 5 }, (_, index) => ({
    question: localized(`tools.${kind}.faq_${index + 1}_question`),
    answer: localized(`tools.${kind}.faq_${index + 1}_answer`),
  }));
}
