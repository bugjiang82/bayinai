const ASPECT_RATIO_MAP: Record<string, number> = {
  "1:1": 1,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "3:2": 3 / 2,
  "2:3": 2 / 3,
  "21:9": 21 / 9,
};

function parseAspectRatio(aspectRatio: string): number {
  if (ASPECT_RATIO_MAP[aspectRatio]) return ASPECT_RATIO_MAP[aspectRatio];
  const parts = aspectRatio.split(":").map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return parts[0] / parts[1];
  }
  return 1;
}

function roundTo16(n: number): number {
  return Math.round(n / 16) * 16;
}

const SIZE_OVERRIDES: Record<string, string> = {
  "16:9": "1792x1024",
  "9:16": "1024x1792",
  "21:9": "1792x1024",
};

export function getImage2Size(aspectRatio: string, imageSize: string = "1K"): string {
  if (SIZE_OVERRIDES[aspectRatio]) return SIZE_OVERRIDES[aspectRatio];

  const r = parseAspectRatio(aspectRatio);

  const is2K = imageSize === "2K";
  const targetPixels = is2K ? 3686400 : 1048576;

  let width = Math.round(Math.sqrt(targetPixels * r));
  let height = Math.round(Math.sqrt(targetPixels / r));

  width = roundTo16(width);
  height = roundTo16(height);

  width = Math.max(width, 1024);
  height = Math.max(height, 1024);

  const ratio = width / height;
  if (ratio > 3) {
    width = roundTo16(height * 3);
  } else if (ratio < 1 / 3) {
    height = roundTo16(width * 3);
  }

  let totalPixels = width * height;
  if (totalPixels > 8294400) {
    const scale = Math.sqrt(8294400 / totalPixels);
    width = roundTo16(width * scale);
    height = roundTo16(height * scale);
  } else if (totalPixels < 655360) {
    const scale = Math.sqrt(655360 / totalPixels);
    width = roundTo16(width * scale);
    height = roundTo16(height * scale);
  }

  return `${width}x${height}`;
}