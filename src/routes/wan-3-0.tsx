import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { seoHead, socialImageUrl } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getWan3Faqs } from '@/blocks/public-faq-copy';
import { Wan3Page } from '@/blocks/wan-3-page';

const path = '/wan-3-0';
const videoPath = '/videos/wan-3-preview.mp4';
const thumbnailPath = '/imgs/showcase/wan-3-preview.webp';

export const Route = createFileRoute('/wan-3-0')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['wan3.meta_title']({}, { locale }),
      description: m['wan3.meta_description']({}, { locale }),
      videoName: m['wan3.video_name']({}, { locale }),
      videoDescription: m['wan3.video_description']({}, { locale }),
      faqItems: getWan3Faqs(locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'article',
          image: thumbnailPath,
          imageWidth: 1280,
          imageHeight: 720,
          datePublished: '2026-08-07',
          dateModified: '2026-10-18',
          extraSchemas: [
            {
              '@type': 'WebApplication',
              name: loaderData.title,
              description: loaderData.description,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript',
              isAccessibleForFree: false,
              featureList: [
                'Native Wan 3.0 text-to-video generation through fal',
                '5, 10 or 15 second video with synchronized audio',
                'Five aspect ratios with camera and motion-rhythm direction',
                'Asynchronous task polling and playable video results',
              ],
            },
            {
              '@type': 'VideoObject',
              name: loaderData.videoName,
              description: loaderData.videoDescription,
              thumbnailUrl: [socialImageUrl(thumbnailPath)],
              uploadDate: '2026-08-06T00:00:00+08:00',
              duration: 'PT30S',
              contentUrl: `${envConfigs.app_url}${videoPath}`,
              embedUrl: `${envConfigs.app_url}${path}#preview`,
              encodingFormat: 'video/mp4',
              width: 1280,
              height: 720,
              isFamilyFriendly: true,
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <Wan3Page />
      <Footer />
    </div>
  ),
});
