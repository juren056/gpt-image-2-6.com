import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';
import { SiteFooter, type FooterColumn } from '@/components/site-footer';

export function Footer() {
  const columns: FooterColumn[] = [
    {
      title: m['landing.footer.product'](),
      links: [
        { label: m['landing.nav.generator'](), href: '/#generator' },
        { label: m['landing.nav.gallery'](), href: '/#gallery' },
        { label: m['landing.nav.pricing'](), href: '/pricing' },
      ],
    },
    {
      title: m['tools.common.tools'](),
      links: [
        { label: m['tools.common.all_tools'](), href: '/tools' },
        {
          label: m['minimax_h3.title'](),
          href: '/minimax-h3',
        },
        {
          label: m['seedance25.title'](),
          href: '/seedance-2-5',
        },
        {
          label: tDynamic('seedance_draft.nav_label'),
          href: '/seedance-2-5-draft-mode',
        },
        {
          label: m['tools.poster.link_label'](),
          href: '/ai-poster-generator',
        },
        {
          label: m['tools.product_photo.link_label'](),
          href: '/ai-product-photo-generator',
        },
        {
          label: m['tools.youtube_thumbnail.link_label'](),
          href: '/ai-youtube-thumbnail-generator',
        },
        {
          label: m['tools.video.link_label'](),
          href: '/ai-video-generator',
        },
        {
          label: m['tools.background_remover.link_label'](),
          href: '/image-background-remover',
        },
      ],
    },
    {
      title: m['landing.footer.legal'](),
      links: [
        { label: 'About', href: '/about' },
        { label: m['landing.footer.privacy'](), href: '/privacy-policy' },
        { label: m['landing.footer.terms'](), href: '/terms-of-service' },
        { label: m['landing.footer.refunds'](), href: '/refund-policy' },
        { label: m['landing.footer.contact'](), href: '/contact' },
      ],
    },
  ];

  return (
    <SiteFooter tagline={m['landing.footer.tagline']()} columns={columns} />
  );
}
