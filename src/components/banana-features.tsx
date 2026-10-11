import { Images, RectangleHorizontal, Type } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  prepareBananaGenerator,
  type BananaGeneratorSelection,
} from '@/lib/banana-generator-navigation';

import '@/styles/banana-features.css';

export interface BananaFeature {
  id: 'references' | 'text' | 'ratios';
  title: string;
  body: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
  selection?: BananaGeneratorSelection;
}

export interface BananaFeaturesSectionProps {
  eyebrow: string;
  heading: string;
  subtitle: string;
  illustrationCaption: string;
  features: BananaFeature[];
}

const featureIcons = {
  references: Images,
  text: Type,
  ratios: RectangleHorizontal,
};

export function BananaFeaturesSection({
  eyebrow,
  heading,
  subtitle,
  illustrationCaption,
  features,
}: BananaFeaturesSectionProps) {
  return (
    <section
      id="features"
      className="banana-features"
      aria-labelledby="banana-features-heading"
    >
      <div className="banana-container">
        <header className="banana-features-header">
          <p className="banana-eyebrow">{eyebrow}</p>
          <h2 id="banana-features-heading" className="banana-section-heading">
            {heading}
          </h2>
          <p className="banana-features-subtitle">{subtitle}</p>
        </header>
        <div className="banana-features-rows">
          {features.map((feature) => {
            const Icon = featureIcons[feature.id];
            return (
              <article className="banana-feature-row" key={feature.id}>
                <div className="banana-feature-copy">
                  <span className="banana-feature-icon" aria-hidden="true">
                    <Icon size={24} strokeWidth={1.8} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                  <Link
                    href={feature.href}
                    onClick={(event) => {
                      if (feature.selection) {
                        event.preventDefault();
                        prepareBananaGenerator(feature.selection);
                      }
                    }}
                    className="banana-button"
                  >
                    {feature.cta}
                  </Link>
                </div>
                <figure className="banana-feature-figure">
                  <div className="banana-feature-image">
                    <img
                      src={feature.image}
                      alt={feature.imageAlt}
                      width={720}
                      height={540}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <figcaption>{illustrationCaption}</figcaption>
                </figure>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
