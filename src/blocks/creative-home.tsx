import type { ReactNode } from 'react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocalizedTools } from '@/blocks/tool-catalog';
import { ToolMarketplace } from '@/blocks/tool-marketplace';
import { CreativeHomeShell } from '@/components/creative-home-shell';
import { CreativeInspiration } from '@/components/creative-inspiration';
import { LocaleSelector } from '@/components/locale-selector';
import { SiteUserMenu } from '@/components/site-user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

export function CreativeHome({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const tools = getLocalizedTools();
  return (
    <CreativeHomeShell
      signedIn={Boolean(session?.user)}
      name={envConfigs.app_name}
      logo={envConfigs.app_logo}
      tools={tools}
      copy={{
        home: m['studio.home'](),
        tools: m['studio.tools'](),
        search: m['studio.search'](),
        empty: m['studio.empty'](),
        pricing: m['studio.pricing'](),
        prompts: m['studio.prompts'](),
        signIn: m['studio.sign_in'](),
        menu: m['studio.menu'](),
        create: m['studio.create'](),
        explore: m['studio.explore'](),
      }}
      controls={
        <>
          <LocaleSelector />
          <ThemeToggle />
          {session?.user ? (
            <SiteUserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
          ) : (
            <Link
              href="/sign-in"
              className="bg-foreground text-background rounded-full px-4 py-2 text-xs font-semibold"
            >
              {m['studio.sign_in']()}
            </Link>
          )}
        </>
      }
    >
      <main className="mx-auto max-w-[1280px] px-4 pb-8 sm:px-8">
        <div className="flex items-end justify-between gap-4 py-7 sm:py-9">
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              {m['studio.eyebrow']()}
            </p>
            <h1 className="text-[2rem] leading-tight font-semibold tracking-tight sm:text-[2.5rem]">
              {m['studio.headline']()}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
              {m['studio.description']()}
            </p>
          </div>
        </div>
        <section
          id="generator"
          className="scroll-mt-20"
          aria-label={m['landing.generator.title']()}
        >
          <ToolMarketplace studio />
        </section>
        <CreativeInspiration
          title={m['studio.inspiration']()}
          description={m['studio.inspiration_description']()}
          usePrompt={m['studio.use_prompt']()}
          toolsTitle={m['studio.tools']()}
          allTools={m['landing.tools_launchpad.view_all']()}
          tools={tools}
          filters={[
            { value: 'all', label: m['studio.all']() },
            { value: 'product', label: m['studio.product']() },
            { value: 'art', label: m['studio.art']() },
          ]}
          cards={[
            {
              title: m['studio.card_product'](),
              category: 'product',
              image: '/imgs/generated/feature-generate-1783598708214.png',
              prompt: m['landing.generator.example_1'](),
            },
            {
              title: m['studio.card_world'](),
              category: 'art',
              image: '/imgs/generated/hero-1783598692895.png',
              prompt: m['landing.generator.example_2'](),
            },
            {
              title: m['studio.card_design'](),
              category: 'art',
              image: '/imgs/generated/feature-styles-1783598714340.png',
              prompt: m['landing.generator.example_3'](),
            },
            {
              title: m['studio.card_campaign'](),
              category: 'product',
              image: '/imgs/tools/ai-product-photo-showcase.webp',
              prompt: m['studio.campaign_prompt'](),
            },
          ]}
        />
        {children}
      </main>
    </CreativeHomeShell>
  );
}
