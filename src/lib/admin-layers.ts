import { z } from "zod";
import { MAX_IMAGE_BYTES, sniffImageType } from "@/lib/admin-shared";

// Pure rules for the transparent square PNGs layered into a customer's Snobi: the Snobi options and
// the items they wear. Runs in the browser (instant feedback) and on the server (the real check).

export const TEMPLATE_URL = "/snobis/template.png";

export interface PngInfo {
  width: number;
  height: number;
  // Whether the file can have see-through pixels at all, not whether it actually does.
  transparency: boolean;
}

const HEADER_BYTES = 33; // 8 signature + 4 length + 4 type + 13 IHDR data + 4 checksum

function chunkType(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

// Reads the PNG header. Null when the bytes aren't a complete PNG header.
export function readPngInfo(bytes: Uint8Array): PngInfo | null {
  if (bytes.length < HEADER_BYTES || sniffImageType(bytes) !== "image/png") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || chunkType(bytes, 12) !== "IHDR") return null;
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width === 0 || height === 0) return null;

  // Colour types 4 and 6 carry an alpha channel; the others need a tRNS chunk before the pixels.
  const colorType = bytes[25];
  let transparency = colorType === 4 || colorType === 6;
  for (let at = HEADER_BYTES; !transparency && at + 8 <= bytes.length;) {
    const type = chunkType(bytes, at + 4);
    if (type === "IDAT" || type === "IEND") break;
    transparency = type === "tRNS";
    at += 12 + view.getUint32(at);
  }
  return { width, height, transparency };
}

export function layerPngProblem(bytes: Uint8Array): string | null {
  if (sniffImageType(bytes) !== "image/png") {
    return "This file isn't a PNG. It has to be a PNG, because only PNGs keep the background transparent.";
  }
  const info = readPngInfo(bytes);
  if (!info) return "This PNG looks damaged. Export it again and retry.";
  if (info.width !== info.height) {
    return `This picture is ${info.width} × ${info.height} pixels. It must be square: the same width and height.`;
  }
  if (!info.transparency) {
    return "This PNG has no transparent background, so it would cover what's behind it. Export it again with transparency on.";
  }
  return null;
}

export type LayerPng = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

export async function readLayerPng(file: FormDataEntryValue | null): Promise<LayerPng> {
  if (!(file instanceof File)) return { ok: false, error: "Choose a PNG to upload" };
  if (file.size === 0) return { ok: false, error: "That file is empty" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "The PNG must be 5 MB or smaller" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = layerPngProblem(bytes);
  return problem ? { ok: false, error: problem } : { ok: true, bytes };
}

export const snobiNamesSchema = z.object({
  nameEn: z
    .string()
    .trim()
    .min(1, "English name is required")
    .max(40, "Keep the name under 40 characters"),
  nameAr: z
    .string()
    .trim()
    .min(1, "Arabic name is required")
    .max(40, "Keep the name under 40 characters"),
});

// The list after moving one id a step earlier (-1) or later (1); unchanged at either end.
export function moveInOrder<T>(ids: readonly T[], id: T, delta: -1 | 1): T[] {
  const next = [...ids];
  const from = next.indexOf(id);
  const a = next[from];
  const b = next[from + delta];
  if (from < 0 || a === undefined || b === undefined) return next;
  next[from] = b;
  next[from + delta] = a;
  return next;
}
