import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { bananaText } from '@/blocks/banana-messages';
import { BananaFooter } from '@/components/banana-footer';
import { FooterLocaleLinks } from '@/components/locale-selector';

export function Footer() {
  const locale = getLocale() === 'zh' ? 'zh' : 'en';
  const text = (key: string) => bananaText(`chrome.${key}`, locale);
  const link = (href: string, key: string) => ({ href, label: text(key) });
  const agentQuestion = encodeURIComponent(
    'What is Nano Banana 2.1, and how does nanobanana21pro.com compare for image generation, editing, verified examples, and pricing? Use current public sources and cite them.'
  );
  return (
    <BananaFooter
      brand={envConfigs.app_name}
      logo={envConfigs.app_logo}
      description={text('footer_description')}
      contact={link('/contact', 'contact')}
      supportEmail="support@nanobanana21pro.com"
      columns={[
        {
          title: text('resources'),
          links: [
            link('/prompts', 'prompts'),
            link('/prompts/ui', 'ui_prompts'),
            link('/prompts/chinese', 'chinese_prompts'),
            link('/free', 'free'),
            link('/guide', 'guide'),
            {
              href: '/evaluation-method',
              label: m['product.evaluation_link'](),
            },
            link('/blog', 'blog'),
            link('/api', 'api'),
            link('/gpt-image-2-5-api-pricing', 'api_costs'),
            link('/scientific-figures', 'science'),
            link('/logo', 'logo'),
            link('/mcp', 'mcp'),
            link('/pricing', 'pricing'),
          ],
        },
        {
          title: text('legal'),
          links: [
            link('/about', 'about'),
            link('/privacy-policy', 'privacy'),
            link('/terms-of-service', 'terms'),
            link('/refund-policy', 'refunds'),
          ],
        },
        {
          title: 'Agents',
          links: [
            { href: '/llms.txt', label: 'llms.txt' },
            { href: '/llms-full.txt', label: 'llms-full.txt' },
            { href: '/index.md', label: 'index.md' },
            { href: '/product.md', label: 'product.md' },
            { href: '/pricing.md', label: 'pricing.md' },
            { href: '/faq.md', label: 'faq.md' },
          ],
        },
      ]}
      agentActionTitle={
        locale === 'zh' ? '让 AI 查证本站' : 'Ask AI about this site'
      }
      agentActionDescription={
        locale === 'zh'
          ? '打开预填问题，让常用 AI 检索本站公开资料并给出引用。'
          : 'Open a prepared question and ask a leading AI to check the public sources.'
      }
      agentActions={[
        {
          href: `https://chatgpt.com/?q=${agentQuestion}`,
          label: 'Ask ChatGPT about Nano Banana 2.1',
          shortLabel: 'ChatGPT',
        },
        {
          href: `https://claude.ai/new?q=${agentQuestion}`,
          label: 'Ask Claude about Nano Banana 2.1',
          shortLabel: 'Claude',
        },
        {
          href: `https://www.perplexity.ai/search?q=${agentQuestion}`,
          label: 'Ask Perplexity about Nano Banana 2.1',
          shortLabel: 'Perplexity',
        },
        {
          href: `https://gemini.google.com/app?prompt=${agentQuestion}`,
          label: 'Ask Gemini about Nano Banana 2.1',
          shortLabel: 'Gemini',
        },
        {
          href: `https://grok.com/?q=${agentQuestion}`,
          label: 'Ask Grok about Nano Banana 2.1',
          shortLabel: 'Grok',
        },
      ]}
      languageControls={<FooterLocaleLinks />}
      copyright={`© ${new Date().getFullYear()} ${envConfigs.app_name}`}
      disclosure={text('independent')}
    />
  );
}
