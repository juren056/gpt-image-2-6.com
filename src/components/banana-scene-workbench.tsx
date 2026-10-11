import { useState } from 'react';
import {
  ArrowRight,
  FlaskConical,
  Image,
  LayoutTemplate,
  ShoppingBag,
  Type,
  Users,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { prepareBananaGenerator } from '@/lib/banana-generator-navigation';

export type CreativeScene = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  hint: string;
  href: string;
  ratio: string;
  mode: 'generate' | 'edit';
};
const icons = [ShoppingBag, Users, Image, Type, FlaskConical, LayoutTemplate];
export function BananaSceneWorkbench({
  heading,
  intro,
  start,
  guide,
  example,
  scenes,
  account = false,
}: {
  heading: string;
  intro: string;
  start: string;
  guide: string;
  example: string;
  scenes: CreativeScene[];
  account?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const scene = scenes[selected];
  const Icon = icons[selected];
  const selection = {
    model: 'nano-banana-pro',
    mode: scene.mode,
    prompt: scene.prompt,
    aspectRatio: scene.ratio,
    scene: scene.id,
  };
  function selectScene() {
    trackFunnelEvent('prompt_used', {
      scene: scene.id,
      source: 'scene-workbench',
    });
    prepareBananaGenerator(selection);
  }
  return (
    <section
      className="scene-workbench banana-container"
      id="creative-scenes"
      aria-label={heading}
    >
      <div className="scene-workbench-copy">
        <h1>{heading}</h1>
        <p>{intro}</p>
        <div className="scene-selector" role="group" aria-label={heading}>
          {scenes.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              {item.title}
            </button>
          ))}
        </div>
        {account ? (
          <Link
            className="banana-button"
            href={`/settings/generate?scene=${scene.id}&model=nano-banana-pro&mode=${scene.mode}&ratio=${scene.ratio}&prompt=${encodeURIComponent(scene.prompt)}`}
          >
            {start}
            <ArrowRight size={17} />
          </Link>
        ) : (
          <button type="button" className="banana-button" onClick={selectScene}>
            {start}
            <ArrowRight size={17} />
          </button>
        )}
      </div>
      <div className="scene-brief" aria-live="polite">
        <div className="scene-brief-heading">
          <Icon size={24} aria-hidden />
          <h2>{scene.title}</h2>
          <span>{scene.ratio}</span>
        </div>
        <p>{scene.description}</p>
        <div className={`scene-art scene-art--${scene.id}`} aria-hidden="true">
          <svg viewBox="0 0 480 210" fill="none">
            <rect
              x="12"
              y="12"
              width="456"
              height="186"
              rx="12"
              stroke="currentColor"
              strokeOpacity=".22"
            />
            <path
              d="M30 175H450M120 30V175M360 30V175"
              stroke="currentColor"
              strokeOpacity=".12"
            />
            <circle
              cx="240"
              cy="101"
              r="58"
              fill="currentColor"
              fillOpacity=".06"
            />
            {scene.id === 'product' ? (
              <>
                <path
                  d="M211 143V68Q211 52 228 52H251Q269 52 269 68V143Q269 154 258 154H222Q211 154 211 143Z"
                  fill="var(--primary)"
                />
                <path
                  d="M228 52V40H252V52M223 95H257M223 106H246"
                  stroke="var(--primary-foreground)"
                  strokeWidth="5"
                />
              </>
            ) : scene.id === 'character' ? (
              <>
                <circle cx="240" cy="76" r="22" fill="var(--primary)" />
                <path
                  d="M197 152Q197 107 240 107Q283 107 283 152Z"
                  fill="var(--primary)"
                />
              </>
            ) : scene.id === 'social' ? (
              <>
                <rect
                  x="193"
                  y="66"
                  width="94"
                  height="76"
                  rx="6"
                  stroke="var(--primary)"
                  strokeWidth="5"
                />
                <circle cx="216" cy="88" r="9" fill="var(--primary)" />
                <path
                  d="M203 131L229 106L246 119L263 97L277 131"
                  stroke="var(--primary)"
                  strokeWidth="4"
                />
              </>
            ) : scene.id === 'poster' ? (
              <>
                <rect
                  x="209"
                  y="47"
                  width="62"
                  height="110"
                  rx="3"
                  fill="var(--primary)"
                />
                <path
                  d="M221 67H259M221 79H250M221 134H259M222 92L240 119L257 92"
                  stroke="var(--primary-foreground)"
                  strokeWidth="4"
                />
              </>
            ) : scene.id === 'science' ? (
              <>
                <circle
                  cx="215"
                  cy="128"
                  r="17"
                  stroke="var(--primary)"
                  strokeWidth="4"
                />
                <circle
                  cx="267"
                  cy="128"
                  r="17"
                  stroke="var(--primary)"
                  strokeWidth="4"
                />
                <circle cx="241" cy="70" r="17" fill="var(--primary)" />
                <path
                  d="M232 87L222 110M251 87L260 110M232 128H250"
                  stroke="var(--primary)"
                  strokeWidth="4"
                />
              </>
            ) : (
              <>
                <path
                  d="M202 149Q184 61 278 50Q291 141 202 149Z"
                  fill="var(--primary)"
                />
                <path
                  d="M202 149L254 83M228 116V85M228 116H257"
                  stroke="var(--primary-foreground)"
                  strokeWidth="4"
                />
              </>
            )}
            <rect
              x="46"
              y="42"
              width="60"
              height="44"
              rx="4"
              fill="currentColor"
              fillOpacity=".12"
            />
            <path
              d="M59 70L73 55L94 73"
              stroke="currentColor"
              strokeOpacity=".6"
            />
            <path
              d="M378 64H431M378 78H412M378 126H431M378 140H418"
              stroke="currentColor"
              strokeOpacity=".35"
              strokeWidth="5"
            />
            <path
              d="M143 103H177M168 96L177 103L168 110M303 103H337M328 96L337 103L328 110"
              stroke="currentColor"
              strokeOpacity=".55"
              strokeWidth="2"
            />
          </svg>
        </div>
        <p className="scene-example-label">{example}</p>
        <blockquote>{scene.prompt}</blockquote>
        <p className="scene-hint">{scene.hint}</p>
        <Link href={scene.href}>
          {guide}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
