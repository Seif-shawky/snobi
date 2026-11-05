import { describe, expect, it } from "vitest";
import { passwordSchema } from "@/lib/account-rules";
import {
  customerSearch,
  generateTempPassword,
  moderationMessage,
} from "@/lib/admin-customer-rules";
import {
  layerPngProblem,
  moveInOrder,
  readLayerPng,
  readPngInfo,
  snobiNamesSchema,
} from "@/lib/admin-layers";
import { MAX_IMAGE_BYTES } from "@/lib/admin-shared";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
// Checksums aren't read, so zeros are fine.
const chunk = (type: string, data: number[] = []) => [
  ...u32(data.length),
  ...ascii(type),
  ...data,
  0,
  0,
  0,
  0,
];
function png(width: number, height: number, colorType = 6, ...chunks: number[][]) {
  return new Uint8Array([
    ...SIGNATURE,
    ...chunk("IHDR", [...u32(width), ...u32(height), 8, colorType, 0, 0, 0]),
    ...chunks.flat(),
    ...chunk("IDAT", [1, 2, 3]),
    ...chunk("IEND"),
  ]);
}

describe("readPngInfo", () => {
  it("reads a valid square PNG", () => {
    expect(readPngInfo(png(512, 512))).toEqual({ width: 512, height: 512, transparency: true });
  });

  it("reads a non-square PNG, including sizes past 16 bits", () => {
    expect(readPngInfo(png(70_000, 300))).toMatchObject({ width: 70_000, height: 300 });
  });

  it("works on a view into a larger buffer", () => {
    const whole = png(64, 64);
    const padded = new Uint8Array(whole.length + 10);
    padded.set(whole, 10);
    expect(readPngInfo(padded.subarray(10))).toMatchObject({ width: 64, height: 64 });
  });

  it("rejects files that aren't PNGs", () => {
    expect(readPngInfo(new Uint8Array([0xff, 0xd8, 0xff, ...new Array(40).fill(0)]))).toBeNull();
    expect(readPngInfo(new Uint8Array(40))).toBeNull();
  });

  it("rejects a truncated header", () => {
    expect(readPngInfo(new Uint8Array(0))).toBeNull();
    expect(readPngInfo(new Uint8Array(SIGNATURE))).toBeNull();
    expect(readPngInfo(png(512, 512).subarray(0, 20))).toBeNull();
    expect(readPngInfo(png(512, 512).subarray(0, 32))).toBeNull();
  });

  it("rejects a PNG whose first chunk isn't a valid header", () => {
    const bytes = png(512, 512);
    bytes[12] = ascii("X")[0]!;
    expect(readPngInfo(bytes)).toBeNull();
    expect(readPngInfo(png(0, 512))).toBeNull();
  });

  it("knows which PNGs can be transparent", () => {
    expect(readPngInfo(png(8, 8, 2))?.transparency).toBe(false);
    expect(readPngInfo(png(8, 8, 3))?.transparency).toBe(false);
    expect(readPngInfo(png(8, 8, 4))?.transparency).toBe(true);
    expect(readPngInfo(png(8, 8, 3, chunk("PLTE", [0, 0, 0]), chunk("tRNS", [0])))).toMatchObject({
      transparency: true,
    });
  });

  it("survives a chunk that claims to run past the end of the file", () => {
    const bytes = png(8, 8, 2).subarray(0, 37);
    bytes.set(u32(4_000_000_000), 33);
    expect(readPngInfo(bytes)?.transparency).toBe(false);
  });
});

describe("layerPngProblem", () => {
  it("accepts a transparent square PNG", () => {
    expect(layerPngProblem(png(512, 512))).toBeNull();
  });

  it("explains each rejection", () => {
    expect(layerPngProblem(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toMatch(/isn't a PNG/);
    expect(layerPngProblem(png(512, 500))).toMatch(/512 × 500.*must be square/);
    expect(layerPngProblem(png(512, 512, 2))).toMatch(/no transparent background/);
    expect(layerPngProblem(png(512, 512).subarray(0, 20))).toMatch(/damaged/);
  });
});

describe("readLayerPng", () => {
  // jsdom's File has no arrayBuffer().
  const file = (bytes: Uint8Array) =>
    Object.assign(new File([bytes.slice()], "snobi.png", { type: "image/png" }), {
      arrayBuffer: async () => bytes.slice().buffer,
    });

  it("returns the bytes of a good file", async () => {
    const bytes = png(512, 512);
    const result = await readLayerPng(file(bytes));
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect([...result.bytes]).toEqual([...bytes]);
  });

  it("rejects a missing, empty or oversized file", async () => {
    expect(await readLayerPng(null)).toMatchObject({ ok: false });
    expect(await readLayerPng("text")).toMatchObject({ ok: false });
    expect(await readLayerPng(file(new Uint8Array(0)))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/empty/),
    });
    expect(await readLayerPng(file(new Uint8Array(MAX_IMAGE_BYTES + 1)))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/5 MB/),
    });
  });

  it("goes by the bytes, not the reported type", async () => {
    expect(await readLayerPng(file(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/isn't a PNG/),
    });
  });
});

describe("snobiNamesSchema", () => {
  it("trims and requires both names", () => {
    expect(snobiNamesSchema.parse({ nameEn: " The Fez ", nameAr: " أبو طربوش " })).toEqual({
      nameEn: "The Fez",
      nameAr: "أبو طربوش",
    });
    expect(snobiNamesSchema.safeParse({ nameEn: "  ", nameAr: "x" }).success).toBe(false);
    expect(snobiNamesSchema.safeParse({ nameEn: "x", nameAr: "" }).success).toBe(false);
    expect(snobiNamesSchema.safeParse({ nameEn: null, nameAr: "x" }).success).toBe(false);
  });
});

describe("moveInOrder", () => {
  it("swaps with the neighbour", () => {
    expect(moveInOrder(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveInOrder(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
  });

  it("leaves the ends and unknown ids alone", () => {
    expect(moveInOrder(["a", "b"], "a", -1)).toEqual(["a", "b"]);
    expect(moveInOrder(["a", "b"], "b", 1)).toEqual(["a", "b"]);
    expect(moveInOrder(["a", "b"], "z", 1)).toEqual(["a", "b"]);
  });
});

describe("generateTempPassword", () => {
  it("is three groups of four readable characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateTempPassword()).toMatch(
        /^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/,
      );
    }
  });

  it("never uses characters that look alike", () => {
    const seen = Array.from({ length: 200 }, generateTempPassword).join("");
    expect(seen).not.toMatch(/[ilo01]/);
  });

  it("is accepted as a customer password", () => {
    expect(passwordSchema.safeParse(generateTempPassword()).success).toBe(true);
  });

  it("doesn't repeat", () => {
    const all = Array.from({ length: 1000 }, generateTempPassword);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("customerSearch", () => {
  it("is null when empty", () => {
    expect(customerSearch("   ")).toBeNull();
  });

  it("searches names only for text", () => {
    expect(customerSearch(" Mona ")).toEqual({ name: "%Mona%", digits: null });
  });

  it("matches the stored mobile format however it's typed", () => {
    for (const typed of ["01012345678", "+20 10 1234 5678", "00201012345678", "201012345678"]) {
      expect(customerSearch(typed)?.digits).toBe("%01012345678%");
    }
    expect(customerSearch("٠١٠١٢")?.digits).toBe("%01012%");
    expect(customerSearch("5678")?.digits).toBe("%5678%");
    expect(customerSearch("+2010")?.digits).toBe("%010%");
  });

  it("doesn't treat a partial number starting with 20 as a country code", () => {
    expect(customerSearch("2055")?.digits).toBe("%2055%");
  });

  it("escapes LIKE wildcards", () => {
    expect(customerSearch("100%_a\\")?.name).toBe("%100\\%\\_a\\\\%");
  });
});

describe("moderationMessage", () => {
  it("has a fallback for unknown codes", () => {
    expect(moderationMessage("display_name_taken")).toMatch(/Snobi/);
    expect(moderationMessage("nope")).toBeTruthy();
  });
});
