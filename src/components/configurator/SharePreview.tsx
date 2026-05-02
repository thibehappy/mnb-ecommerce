'use client';

import { useRef, useState } from 'react';
import { Camera, Download, Sparkles } from 'lucide-react';
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
}

interface ShareItem {
  component: BraceletComponent;
  x: number;
  y: number;
  rotation: number;
  radius: number;
}

function shareItems(components: BraceletComponent[]): ShareItem[] {
  if (components.length === 0) return [];

  const cx = 410;
  const cy = 205;
  const rx = 245;
  const ry = 94;
  const start = -Math.PI * 0.92;
  const span = Math.PI * 1.84;

  return components.map((component, index) => {
    const fraction = components.length === 1 ? 0.5 : index / components.length;
    const angle = start + fraction * span;
    const mm = sizeMmOf(component);
    return {
      component,
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
      rotation: (angle * 180) / Math.PI + 90,
      radius: Math.max(13, Math.min(23, mm * 2)),
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
}: SharePreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'working' | 'done' | 'error'>(
    'idle',
  );
  const items = shareItems(components);
  const hasBracelet = components.length > 0;
  const posterTitle = truncateLabel(title, 34).toUpperCase();
  const posterIntention = intention ? truncateLabel(intention, 72) : 'Designed online · Crafted in Paris';

  async function handleDownload() {
    if (!svgRef.current || downloadStatus === 'working') return;

    try {
      setDownloadStatus('working');
      const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '1640');
      svg.setAttribute('height', '780');
      await inlineSvgImages(svg);

      const svgText = new XMLSerializer().serializeToString(svg);
      const svgUrl = URL.createObjectURL(
        new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }),
      );

      try {
        const safeTitle = slugify(title || 'bracelet') || 'bracelet';
        await downloadSvgAsPng(svgUrl, `mnb-${safeTitle}.png`);
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
    <section className="overflow-hidden rounded-2xl border border-[#EEE9E0] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#EEE9E0] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
            <Camera size={14} strokeWidth={2.2} />
            Carte partage
          </div>
          <h3 className="mt-1 font-serif text-[20px] font-black uppercase leading-tight tracking-tight text-[#2D3748]">
            {title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F5F0E8] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
            <Sparkles size={13} strokeWidth={2.2} />
            Prêt à partager
          </div>
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
                ? 'Téléchargée'
                : downloadStatus === 'error'
                  ? 'Réessayer'
                  : 'Télécharger'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 bg-[#F8F4ED] p-3 md:grid-cols-[1fr_280px] md:p-4">
        <div className="relative overflow-hidden rounded-xl bg-[#EFE7DC]">
          <svg
            ref={svgRef}
            viewBox="0 0 820 390"
            className="block w-full"
            role="img"
            aria-label="Carte de partage du bracelet"
          >
            <defs>
              <radialGradient id="shareGlow" cx="50%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.86" />
                <stop offset="64%" stopColor="#EFE7DC" stopOpacity="0.68" />
                <stop offset="100%" stopColor="#D8C7AF" stopOpacity="0.28" />
              </radialGradient>
              <filter id="shareShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="14"
                  stdDeviation="12"
                  floodColor="#2D3748"
                  floodOpacity="0.14"
                />
              </filter>
            </defs>
            <rect width="820" height="390" fill="url(#shareGlow)" />
            <rect x="28" y="24" width="764" height="76" rx="24" fill="#FFFFFF" opacity="0.58" />
            <text
              x="54"
              y="54"
              fill="#A8BED4"
              fontSize="11"
              fontWeight="900"
              letterSpacing="3"
            >
              MY NICE BRACELET · PARIS
            </text>
            <text x="54" y="82" fill="#2D3748" fontSize="25" fontWeight="900">
              {posterTitle}
            </text>
            <text
              x="766"
              y="58"
              textAnchor="end"
              fill="#3D5A73"
              fontSize="13"
              fontWeight="900"
              letterSpacing="2"
            >
              {formatPrice(price)}
            </text>
            <text
              x="766"
              y="82"
              textAnchor="end"
              fill="#718096"
              fontSize="12"
              fontWeight="700"
            >
              {formatCmFromMm(lengthMm)} / {formatCmFromMm(targetMm)}
            </text>
            <ellipse cx="410" cy="225" rx="305" ry="128" fill="#FFFFFF" opacity="0.34" />
            <ellipse
              cx="410"
              cy="205"
              rx="245"
              ry="94"
              fill="none"
              stroke="#A8BED4"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={hasBracelet ? '0' : '7 12'}
              opacity={hasBracelet ? 0.75 : 0.3}
            />

            <g filter="url(#shareShadow)">
              {items.map((item) => (
                <ShareBead key={item.component.slotId} item={item} />
              ))}
              {figurine && (
                <g transform="translate(642 284)">
                  <circle r="35" fill="#FFFFFF" fillOpacity="0.82" />
                  <ShareBead
                    item={{
                      component: figurine,
                      x: 0,
                      y: 0,
                      rotation: -10,
                      radius: 30,
                    }}
                  />
                </g>
              )}
            </g>

            {!hasBracelet && (
              <text
                x="410"
                y="210"
                textAnchor="middle"
                fill="#A8BED4"
                fontSize="18"
                fontWeight="900"
                letterSpacing="4"
              >
                GENEREZ UNE CREATION
              </text>
            )}
            <text x="410" y="356" textAnchor="middle" fill="#718096" fontSize="13" fontWeight="700">
              {posterIntention}
            </text>
          </svg>
        </div>

        <div className="grid content-between gap-3 rounded-xl border border-[#EEE9E0] bg-white p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
              My Nice Bracelet
            </p>
            <h4 className="mt-2 font-serif text-[26px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
              {title}
            </h4>
            {intention && (
              <p className="mt-3 text-[13px] font-semibold italic leading-relaxed text-[#718096]">
                {intention}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Long." value={formatCmFromMm(lengthMm)} />
            <Metric label="Cible" value={formatCmFromMm(targetMm)} />
            <Metric label="Prix" value={formatPrice(price)} />
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
      return item.radius * 4.2;
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
        rx={item.radius * 0.82}
        ry={item.radius * 0.2}
        fill="#2D3748"
        opacity="0.12"
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F8F4ED] px-2.5 py-2">
      <p className="text-[8px] font-black uppercase tracking-widest text-[#A8BED4]">{label}</p>
      <p className="mt-0.5 font-serif text-[16px] font-black text-[#2D3748]">{value}</p>
    </div>
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
  canvas.width = 1640;
  canvas.height = 780;

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
