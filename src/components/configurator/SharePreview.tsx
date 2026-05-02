'use client';

import { useRef, useState } from 'react';
import { Camera, Copy, Download, Sparkles } from 'lucide-react';
import type { BraceletComponent } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { sizeMmOf } from '@/lib/store/configurator';
import { formatCmFromMm, formatPrice } from '@/lib/utils/format';

interface SharePreviewProps {
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
  title: string;
  intention?: string;
  lengthMm: number;
  targetMm: number;
  price: number;
  onCopyLink?: () => void;
  copyStatus?: string | null;
}

interface ShareItem {
  component: BraceletComponent;
  x: number;
  y: number;
  rotation: number;
  radius: number;
}

const STORY_WIDTH = 540;
const STORY_HEIGHT = 960;
const EXPORT_SCALE = 2;

function shareItems(components: BraceletComponent[]): ShareItem[] {
  if (components.length === 0) return [];

  const cx = STORY_WIDTH / 2;
  const cy = 500;
  const rx = 188;
  const ry = 78;
  const start = -Math.PI * 0.94;
  const span = Math.PI * 1.88;

  return components.map((component, index) => {
    const fraction = components.length === 1 ? 0.5 : index / Math.max(1, components.length - 1);
    const angle = start + fraction * span;
    const mm = sizeMmOf(component);
    return {
      component,
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
      rotation: (angle * 180) / Math.PI + 90,
      radius: Math.max(12, Math.min(21, mm * 1.9)),
    };
  });
}

export function SharePreview({
  components,
  figurine,
  title,
  intention,
  lengthMm,
  targetMm,
  price,
  onCopyLink,
  copyStatus,
}: SharePreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'working' | 'done' | 'error'>(
    'idle',
  );
  const items = shareItems(components);
  const hasBracelet = components.length > 0;
  const posterTitle = truncateLabel(title, 30).toUpperCase();
  const posterIntention = intention
    ? truncateLabel(intention, 90)
    : 'Créé en ligne · Assemblé à Paris par nos soins';
  const posterTitleLines = splitSvgText(posterTitle, 18, 2);
  const posterIntentionLines = splitSvgText(posterIntention, 42, 2);

  async function handleDownload() {
    if (!svgRef.current || downloadStatus === 'working') return;

    try {
      setDownloadStatus('working');
      const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', String(STORY_WIDTH * EXPORT_SCALE));
      svg.setAttribute('height', String(STORY_HEIGHT * EXPORT_SCALE));
      await inlineSvgImages(svg);

      const svgText = new XMLSerializer().serializeToString(svg);
      const svgUrl = URL.createObjectURL(
        new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }),
      );

      try {
        const safeTitle = slugify(title || 'bracelet') || 'bracelet';
        await downloadSvgAsPng(svgUrl, `mnb-story-${safeTitle}.png`);
        setDownloadStatus('done');
        window.setTimeout(() => setDownloadStatus('idle'), 2200);
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } catch {
      setDownloadStatus('error');
      window.setTimeout(() => setDownloadStatus('idle'), 2600);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#EEE9E0] bg-white shadow-sm">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
            <Camera size={14} strokeWidth={2.2} />
            Carte partage
          </div>
          <p className="mt-1 text-[12px] font-semibold italic text-[#718096]">
            Copier le lien ou exporter une image.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F5F0E8] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
            <Sparkles size={13} strokeWidth={2.2} />
            Prêt à partager
          </div>
          <button
            type="button"
            onClick={onCopyLink}
            disabled={!hasBracelet || !onCopyLink}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#EEE9E0] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D3748] transition hover:border-[#A8BED4] hover:text-[#3D5A73] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Copy size={13} strokeWidth={2.2} />
            {copyStatus === 'Lien copié' ? 'Lien copié' : 'Copier le lien'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadStatus === 'working'}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#EEE9E0] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#2D3748] transition hover:border-[#A8BED4] hover:text-[#3D5A73] disabled:cursor-wait disabled:opacity-60"
          >
            <Download size={13} strokeWidth={2.2} />
            {downloadStatus === 'working'
              ? 'Préparation'
              : downloadStatus === 'done'
                ? 'Image prête'
                : downloadStatus === 'error'
                  ? 'Réessayer'
                  : 'Exporter image'}
          </button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
      >
        <div className="mx-auto w-full max-w-[280px] md:max-w-[300px]">
          <div className="overflow-hidden rounded-[1.5rem] bg-[#2D3748] p-1.5 shadow-[0_18px_45px_rgba(45,55,72,0.16)]">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${STORY_WIDTH} ${STORY_HEIGHT}`}
              className="block w-full rounded-[1.15rem]"
              role="img"
              aria-label="Carte story du bracelet"
            >
              <defs>
                <radialGradient id="storyGlow" cx="50%" cy="32%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
                  <stop offset="54%" stopColor="#F5F0E8" stopOpacity="0.96" />
                  <stop offset="100%" stopColor="#D8C7AF" stopOpacity="1" />
                </radialGradient>
                <linearGradient id="storyPanel" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.84" />
                  <stop offset="100%" stopColor="#F5F0E8" stopOpacity="0.7" />
                </linearGradient>
                <filter id="storyShadow" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow
                    dx="0"
                    dy="16"
                    stdDeviation="13"
                    floodColor="#2D3748"
                    floodOpacity="0.15"
                  />
                </filter>
              </defs>

              <rect width={STORY_WIDTH} height={STORY_HEIGHT} fill="url(#storyGlow)" />
              <circle cx="84" cy="108" r="48" fill="#3D5A73" opacity="0.12" />
              <circle cx="468" cy="764" r="118" fill="#FFFFFF" opacity="0.26" />
              <rect x="34" y="34" width="472" height="892" rx="42" fill="none" stroke="#FFFFFF" strokeOpacity="0.48" />

              <g>
                <text x="58" y="86" fill="#3D5A73" fontSize="12" fontWeight="900" letterSpacing="4">
                  MY NICE BRACELET
                </text>
                <text x="58" y="112" fill="#A8BED4" fontSize="10" fontWeight="900" letterSpacing="5">
                  PARIS BOUTIQUE
                </text>
                <text x="482" y="91" textAnchor="end" fill="#2D3748" fontSize="22" fontWeight="900">
                  {formatPrice(price)}
                </text>
              </g>

              <rect x="48" y="156" width="444" height="156" rx="34" fill="url(#storyPanel)" />
              <text x="74" y="204" fill="#2D3748" fontSize="34" fontWeight="900">
                {posterTitleLines.map((line, index) => (
                  <tspan key={line} x="74" dy={index === 0 ? 0 : 38}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text x="74" y={posterTitleLines.length > 1 ? 278 : 252} fill="#718096" fontSize="15" fontWeight="700">
                {posterIntentionLines.map((line, index) => (
                  <tspan key={line} x="74" dy={index === 0 ? 0 : 21}>
                    {line}
                  </tspan>
                ))}
              </text>

              <ellipse cx="270" cy="548" rx="222" ry="112" fill="#FFFFFF" opacity="0.35" />
              <ellipse
                cx="270"
                cy="500"
                rx="188"
                ry="78"
                fill="none"
                stroke="#A8BED4"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={hasBracelet ? '0' : '8 14'}
                opacity={hasBracelet ? 0.72 : 0.34}
              />

              <g filter="url(#storyShadow)">
                {items.map((item) => (
                  <ShareBead key={item.component.slotId} item={item} />
                ))}
                {figurine && (
                  <g transform="translate(418 620)">
                    <circle r="39" fill="#FFFFFF" fillOpacity="0.82" />
                    <ShareBead
                      item={{
                        component: figurine,
                        x: 0,
                        y: 0,
                        rotation: -10,
                        radius: 31,
                      }}
                    />
                  </g>
                )}
              </g>

              {!hasBracelet && (
                <text
                  x="270"
                  y="506"
                  textAnchor="middle"
                  fill="#A8BED4"
                  fontSize="17"
                  fontWeight="900"
                  letterSpacing="5"
                >
                  GÉNÉREZ UNE CRÉATION
                </text>
              )}

              <g>
                <rect x="58" y="748" width="424" height="96" rx="28" fill="#FFFFFF" opacity="0.72" />
                <text x="82" y="790" fill="#A8BED4" fontSize="10" fontWeight="900" letterSpacing="4">
                  LONGUEUR
                </text>
                <text x="82" y="820" fill="#2D3748" fontSize="23" fontWeight="900">
                  {formatCmFromMm(lengthMm)}
                </text>
                <text x="286" y="790" fill="#A8BED4" fontSize="10" fontWeight="900" letterSpacing="4">
                  CIBLE
                </text>
                <text x="286" y="820" fill="#2D3748" fontSize="23" fontWeight="900">
                  {formatCmFromMm(targetMm)}
                </text>
              </g>
              <text x="270" y="894" textAnchor="middle" fill="#3D5A73" fontSize="13" fontWeight="900" letterSpacing="3">
                MYNICEBRACELET.COM
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

function imageBoxRadius(item: ShareItem): number {
  if (item.component.kind === 'charm') return item.radius * 1.35;
  const bead = BEAD_BY_ID[item.component.refId];
  switch (bead?.shape) {
    case 'heart':
    case 'star':
    case 'flower':
    case 'bow':
      return item.radius * 1.65;
    case 'tube':
    case 'cube':
      return item.radius * 3.2;
    default:
      return item.radius * 4.1;
  }
}

function ShareBead({ item }: { item: ShareItem }) {
  const bead = item.component.kind === 'bead' ? BEAD_BY_ID[item.component.refId] : null;
  const charm = item.component.kind === 'charm' ? CHARM_BY_ID[item.component.refId] : null;
  const image = bead?.images[0] ?? charm?.images[0];
  const boxRadius = imageBoxRadius(item);

  return (
    <g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}>
      <ellipse
        cx="0"
        cy={item.radius * 0.82}
        rx={item.radius * 0.86}
        ry={item.radius * 0.21}
        fill="#2D3748"
        opacity="0.13"
      />
      {image ? (
        <image
          href={image}
          x={-boxRadius}
          y={-boxRadius}
          width={boxRadius * 2}
          height={boxRadius * 2}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <circle r={item.radius * 0.62} fill="#7CADA6" stroke="#FFFFFF" strokeWidth="2" />
      )}
    </g>
  );
}

async function inlineSvgImages(svg: SVGSVGElement) {
  const images = Array.from(svg.querySelectorAll('image'));
  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute('href') ??
        image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

      if (!href || href.startsWith('data:')) return;

      const absoluteHref = new URL(href, window.location.origin).toString();
      const response = await fetch(absoluteHref);
      if (!response.ok) throw new Error(`Unable to fetch ${absoluteHref}`);

      image.setAttribute('href', await blobToDataUrl(await response.blob()));
    }),
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read image blob'));
    reader.readAsDataURL(blob);
  });
}

async function downloadSvgAsPng(svgUrl: string, filename: string) {
  const image = await loadImage(svgUrl);
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH * EXPORT_SCALE;
  canvas.height = STORY_HEIGHT * EXPORT_SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to export PNG'));
    }, 'image/png');
  });

  const url = URL.createObjectURL(png);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to render share card'));
    image.src = src;
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function truncateLabel(value: string, maxLength: number): string {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function splitSvgText(value: string, maxChars: number, maxLines: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  const remaining = words.slice(lines.join(' ').split(/\s+/).filter(Boolean).length);
  if (remaining.length > 0 && lines.length > 0) {
    const last = lines[lines.length - 1] ?? '';
    lines[lines.length - 1] = `${last.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
  }
  return lines.length > 0 ? lines : [value.slice(0, maxChars)];
}
