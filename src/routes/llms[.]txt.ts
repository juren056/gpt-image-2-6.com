import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale } from '@/paraglide/runtime.js';
import { getLocalPosts, mergePosts } from '@/content/posts';

const STATIC_PAGES: { path: string; title: string; description: string }[] = [
  {
    path: '',
    title: 'AI Image Generator',
    description:
      'Official AI Image release information and a live generator with verified model access',
  },
  {
    path: '/pricing',
    title: 'AI Image Pricing and Credit Plans',
    description:
      'Monthly subscriptions, Alipay prepaid memberships and one-time credit packs for the AI Image generator',
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
    path: '/blog',
    title: 'AI Image Guides and Updates',
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
          '- Access: Third-party image model endpoints configured by the site operator',
          '- Default model: FLUX.2 [pro]',
          '- Credits per image: 8',
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
