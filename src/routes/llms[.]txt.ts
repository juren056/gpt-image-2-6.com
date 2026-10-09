import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale } from '@/paraglide/runtime.js';
import { getLocalPosts, mergePosts } from '@/content/posts';

const STATIC_PAGES: { path: string; title: string; description: string }[] = [
  {
    path: '',
    title: 'Qwen Image 3.0 Generator',
    description:
      'Official Qwen Image 3.0 release information and a live generator with verified model access',
  },
  {
    path: '/pricing',
    title: 'Qwen Image Pricing and Credit Plans',
    description:
      'Monthly subscriptions, Alipay prepaid memberships and one-time credit packs for the Qwen Image 3 generator',
  },
  {
    path: '/guides',
    title: 'Qwen Image 3.0 Guides',
    description:
      'A structured learning center for creators and developers covering prompts, text, ecommerce, API access, local workflows and model comparison',
  },
  {
    path: '/qwen-image-3-1',
    title: 'Qwen Image 3.1 Release Date and API Status',
    description:
      'Source-checked Qwen Image 3.1 announcement, 2026 release window, API availability, model ID, pricing and launch updates',
  },
  {
    path: '/seedance-2-5',
    title: 'Seedance 2.5 Free AI Video Generator',
    description:
      'Free Seedance 2.5 prompt builder and transparent integration status, with paid Seedance 2.0 generation available now',
  },
  {
    path: '/seedance-2-5-draft-mode',
    title: 'Seedance 2.5 Draft Mode',
    description:
      'Interactive draft workflow planner and cost calculator with clearly disclosed API verification status',
  },
  {
    path: '/wan-3-0',
    title: 'Wan 3.0 AI Video Generator and Preview Guide',
    description:
      'Native Wan 3.0 generator with prompt, camera, pacing, aspect ratio, duration and synchronized-audio controls',
  },
  {
    path: '/ai-video-generator',
    title: 'Seedance 2.0 AI Video Generator',
    description:
      'Paid Seedance 2.0 text-to-video generation through fal with native audio and 720p output',
  },
  {
    path: '/qwen-image-3-prompts',
    title: 'Qwen Image 3.0 Prompts',
    description:
      'Post-release prompt patterns with confirmed 3.0 capabilities separated from untested guidance',
  },
  {
    path: '/qwen-image-3-api',
    title: 'Qwen Image 3.0 API',
    description:
      'Live Qwen Image 3 API details, server-side integration, task polling, storage and pricing',
  },
  {
    path: '/qwen-image-3-open-source',
    title: 'Qwen Image 3.0 Open-Source Status',
    description:
      'Source-checked status of model weights, model cards, repositories, licenses and local downloads',
  },
  {
    path: '/qwen-image-3-text-rendering',
    title: 'Qwen Image 3.0 Text Rendering',
    description:
      'Practical prompting and review methods for Chinese, English and multilingual text in generated images',
  },
  {
    path: '/qwen-image-3-for-ecommerce',
    title: 'Qwen Image 3.0 for Ecommerce',
    description:
      'A production workflow for product scenes, marketplace graphics, localized ads and accuracy review',
  },
  {
    path: '/qwen-image-3-comfyui',
    title: 'Qwen Image 3.0 ComfyUI',
    description:
      'Verified weights and ComfyUI workflow availability after the official 3.0 announcement',
  },
  {
    path: '/qwen-image-3-vs-qwen-image-2',
    title: 'Qwen Image 3.0 vs Qwen Image 2.0',
    description:
      'Officially confirmed 3.0 capabilities compared with tested Qwen Image 2.0 behavior',
  },
  {
    path: '/blog',
    title: 'Qwen Image 3.0 Guides and Updates',
    description:
      'Verified release updates, prompt guides, workflow notes and transparent integration progress',
  },
];

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const { app_url, app_name, app_description } = envConfigs;

        let posts = getLocalPosts(baseLocale);
        try {
          const { listPublishedArticles } =
            await import('@/modules/posts/service');
          const rows = await listPublishedArticles().catch(() => []);
          const dbPosts = rows.map((row) => ({
            slug: row.slug,
            title: row.title || row.slug,
            description: row.description || '',
            createdAt: new Date(row.createdAt).toISOString(),
            source: 'db' as const,
          }));
          posts = mergePosts(dbPosts, posts);
        } catch {
          // Database unreachable — local posts still listed.
        }

        const lines: string[] = [
          `# ${app_name}`,
          '',
          `> ${app_description}`,
          '',
          '## Current Image Model',
          '',
          '- Access: Verified third-party model endpoint',
          '- Default model: Qwen Image 3.0 (`alibaba/qwen-image-3/text-to-image`)',
          '- Optional models: Qwen Image 2 Standard and Qwen Image 2 Pro',
          '- Credits per image: 4 (Standard), 5 (Qwen Image 3), or 10 (Pro)',
          '- Status: Live',
          '',
          '## Pages',
          '',
          ...STATIC_PAGES.map(
            (p) => `- [${p.title}](${app_url}${p.path}): ${p.description}`
          ),
        ];

        if (posts.length > 0) {
          lines.push('', '## Blog Posts', '');
          for (const post of posts) {
            lines.push(
              `- [${post.title}](${app_url}/blog/${post.slug}): ${post.description}`
            );
          }
        }

        lines.push('');

        return new Response(lines.join('\n'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
