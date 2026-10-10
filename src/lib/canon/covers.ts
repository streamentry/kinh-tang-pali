/**
 * Per-sutta cover images, read from `source/sutta-covers.json`.
 *
 * The registry is the only place a cover is named: the page, the collection index and the
 * credits page all read from here, so an image can never appear without its author and
 * terms. Files are the verified derivatives written by `scripts/sutta-covers.mjs`.
 */
import type { ImageMetadata } from 'astro';
import registry from '../../../source/sutta-covers.json';

export interface SuttaCover {
  uid: string;
  collection: string;
  file: string;
  sourcePage: string;
  author: string | null;
  credit?: string | null;
  license: string;
  licenseShortName?: string;
  licenseUrl: string | null;
  titleVi: string;
  altVi: string;
  whyVi?: string;
  focus?: string;
  asset: string;
}

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/covers/*/*.webp', { eager: true });
const covers = registry.covers as SuttaCover[];

export const coverCollections: readonly string[] = registry.collections;
export const coverDerivativeNote: string = registry.derivative.note;

export function allCovers(): readonly SuttaCover[] {
  return covers;
}

/** The cover for a sutta with its image module, or undefined when it has none. */
export function coverFor(uid: string): (SuttaCover & { image: ImageMetadata }) | undefined {
  const cover = covers.find((entry) => entry.uid === uid);
  const image = cover && files[`/${cover.asset}`]?.default;
  return cover && image ? { ...cover, image } : undefined;
}

/** Human licence label: public-domain marks read as words, CC ids as their usual spelling. */
export function licenceLabel(cover: Pick<SuttaCover, 'license' | 'licenseShortName'>): string {
  if (cover.license === 'PD') return 'Phạm vi công cộng';
  if (cover.license === 'CC0-1.0') return 'CC0';
  return cover.licenseShortName ?? cover.license.replace(/^CC-BY-SA-/, 'CC BY-SA ').replace(/^CC-BY-/, 'CC BY ');
}
