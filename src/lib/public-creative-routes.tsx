import { envConfigs } from '@/config';
import type { CreativeModelId } from '@/config/creative-studio';
import type { CreativeToolId } from '@/config/creative-tools';
import { findPublicModel, findPublicTool } from '@/config/public-creative';
import { seoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { DedicatedToolPage } from '@/components/dedicated-tool-workspace';
import { PublicModelPage } from '@/components/public-model-generator';

export function publicModelRouteOptions(modelId: CreativeModelId) {
  const page = findPublicModel(modelId)!;
  const isPreview = page.availability !== undefined;
  return {
    loader: () => ({ locale: getLocale() }),
    head: ({ loaderData }: { loaderData?: { locale: string } }) =>
      loaderData
        ? seoHead({
            locale: loaderData.locale,
            path: page.path,
            title:
              page.seoTitle ||
              (isPreview
                ? `${page.name} Image Generator — API Preview | ${envConfigs.app_name}`
                : `${page.name} Image Generator & Editor | ${envConfigs.app_name}`),
            description:
              page.seoDescription ||
              (isPreview
                ? `${page.summary} Preview the prepared workspace; generation stays disabled until the official API and pricing are verified.`
                : `${page.summary} Use the dedicated ${page.name} workflow with accurate inputs, reference limits, and server-verified credit pricing.`),
            type: 'website',
            dateModified:
              page.dateModified || (isPreview ? '2026-09-20' : '2026-09-12'),
            image: page.image,
            indexableLocales: ['en'],
            extraSchemas: isPreview
              ? []
              : [
                  {
                    '@type': 'WebApplication',
                    name: page.name,
                    applicationCategory: 'MultimediaApplication',
                    operatingSystem: 'Web',
                  },
                ],
          })
        : {},
    component: () => (
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Header />
        <PublicModelPage modelId={modelId} />
        <Footer />
      </div>
    ),
  };
}

export function publicToolRouteOptions(toolId: CreativeToolId) {
  const tool = findPublicTool(toolId)!;
  return {
    loader: () => ({ locale: getLocale() }),
    head: ({ loaderData }: { loaderData?: { locale: string } }) =>
      loaderData
        ? seoHead({
            locale: loaderData.locale,
            path: tool.path,
            title:
              tool.seoTitle || `${tool.name} Online | ${envConfigs.app_name}`,
            description:
              tool.seoDescription ||
              `${tool.summary} Open a task-specific workspace with visible controls, result preview, and clear processing costs.`,
            type: 'website',
            dateModified: '2026-09-12',
            image: tool.image,
            indexableLocales: ['en'],
            extraSchemas: [
              {
                '@type': 'WebApplication',
                name: tool.name,
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Web',
              },
            ],
          })
        : {},
    component: () => (
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Header />
        <DedicatedToolPage toolId={toolId} />
        <Footer />
      </div>
    ),
  };
}
