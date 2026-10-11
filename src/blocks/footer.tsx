import { envConfigs } from '@/config';
import { getLocale } from '@/paraglide/runtime.js';
import { bananaText } from '@/blocks/banana-messages';
import { BananaFooter } from '@/components/banana-footer';
import { BuiltWithShipAny } from '@/components/built-with-shipany';
import { FooterLocaleLinks } from '@/components/locale-selector';

export function Footer() {
  const locale = getLocale() === 'zh' ? 'zh' : 'en';
  const text = (key: string) => bananaText(`chrome.${key}`, locale);
  const link = (href: string, key: string) => ({ href, label: text(key) });
  return (
    <BananaFooter
      brand={envConfigs.app_name}
      logo={envConfigs.app_logo}
      description={text('footer_description')}
      contact={link('/contact', 'contact')}
      columns={[
        {
          title: text('resources'),
          links: [
            link('/prompts', 'prompts'),
            link('/prompts/ui', 'ui_prompts'),
            link('/prompts/chinese', 'chinese_prompts'),
            link('/free', 'free'),
            link('/guide', 'guide'),
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
      ]}
      languageControls={<FooterLocaleLinks />}
      copyright={`© ${new Date().getFullYear()} ${envConfigs.app_name}`}
      disclosure={text('independent')}
      attribution={<BuiltWithShipAny appUrl={envConfigs.app_url} />}
    />
  );
}
