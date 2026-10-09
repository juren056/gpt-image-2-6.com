import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { QwenImageEditor } from '@/blocks/qwen-image-editor';

export const Route = createFileRoute('/qwen-image-editor')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['editor.meta_title']({}, { locale }),
      description: m['editor.meta_description']({}, { locale }),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/qwen-image-editor',
          type: 'website',
          dateModified: '2026-09-04',
          extraSchemas: [
            {
              '@type': 'WebApplication',
              name: 'Qwen Image Editor',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <QwenImageEditor />
      <Footer />
    </div>
  ),
});
