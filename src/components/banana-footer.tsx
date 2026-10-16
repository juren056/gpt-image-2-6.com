import type { ReactNode } from 'react';

import { Link } from '@/core/i18n/navigation';
import type { BananaNavLink } from '@/components/banana-header';

export function BananaFooter({
  brand,
  logo,
  description,
  contact,
  supportEmail,
  columns,
  languageControls,
  copyright,
  disclosure,
}: {
  brand: string;
  logo: string;
  description: string;
  contact: BananaNavLink;
  supportEmail: string;
  columns: Array<{ title: string; links: BananaNavLink[] }>;
  languageControls: ReactNode;
  copyright: string;
  disclosure: string;
}) {
  return (
    <footer className="banana-footer">
      <div className="banana-footer-inner">
        <div className="banana-footer-columns">
          <div className="banana-footer-brand-area">
            <Link href="/" className="banana-footer-brand">
              <img src={logo} alt="" width={36} height={36} />
              <span>{brand}</span>
            </Link>
            <p>{description}</p>
            <Link href={contact.href} className="banana-footer-contact">
              {contact.label}
            </Link>
            <div>
              <Link
                href={`mailto:${supportEmail}`}
                className="banana-footer-contact break-all"
              >
                {supportEmail}
              </Link>
            </div>
          </div>
          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="banana-footer-column"
            >
              <h2>{column.title}</h2>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="banana-footer-languages">{languageControls}</div>
        <div className="banana-footer-bottom">
          <div>
            <p>{copyright}</p>
            <p>{disclosure}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
