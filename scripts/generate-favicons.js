import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Scalable Favicon SVG
// High-contrast, vibrant gold on deep navy with gold border ring.
// Crisp at 16x16 up to 512x512.
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E2442" />
      <stop offset="100%" stop-color="#071424" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Base Rounded Badge -->
  <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#bgGrad)" stroke="url(#goldGrad)" stroke-width="20" />
  
  <!-- Subtle Inner Border Accent -->
  <rect x="42" y="42" width="428" height="428" rx="88" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="4" />

  <!-- Shield Shape -->
  <g filter="url(#subtleShadow)">
    <path
      d="M 256 120
         C 320 120 366 136 376 150
         C 376 250 338 334 256 384
         C 174 334 136 250 136 150
         C 146 136 192 120 256 120 Z"
      fill="url(#goldGrad)"
    />
    
    <!-- Inner Shield Accent -->
    <path
      d="M 256 138
         C 308 138 348 152 358 162
         C 358 244 326 316 256 360
         C 186 316 154 244 154 162
         C 164 152 204 138 256 138 Z"
      fill="#0B1E36"
      opacity="0.12"
    />

    <!-- Verified Checkmark in Crisp Deep Navy -->
    <path
      d="M 206 252 L 244 292 L 314 206"
      fill="none"
      stroke="#0B1E36"
      stroke-width="34"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>`;

// 2. Full Horizontal Brand Logo SVG (Emblem + Wordmark)
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" width="100%" height="100%">
  <defs>
    <linearGradient id="hBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E2442" />
      <stop offset="100%" stop-color="#071424" />
    </linearGradient>
    <linearGradient id="hGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
  </defs>

  <!-- Emblem Icon (128x128 at offset 16,16) -->
  <g transform="translate(16, 16)">
    <rect x="0" y="0" width="128" height="128" rx="28" fill="url(#hBgGrad)" stroke="url(#hGoldGrad)" stroke-width="6" />
    
    <path
      d="M 64 28
         C 82 28 96 33 100 38
         C 100 68 88 92 64 106
         C 40 92 28 68 28 38
         C 32 33 46 28 64 28 Z"
      fill="url(#hGoldGrad)"
    />
    
    <path
      d="M 49 66 L 60 77 L 81 54"
      fill="none"
      stroke="#0B1E36"
      stroke-width="9"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>

  <!-- Typography: Cohesora -->
  <text x="168" y="94" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="62" fill="#0B1E36" letter-spacing="-1.5">Cohesora</text>
  
  <!-- Subtitle Tag -->
  <rect x="472" y="58" width="150" height="30" rx="6" fill="#FEF3C7" stroke="#FCD34D" stroke-width="1.5" />
  <text x="547" y="78" font-family="-apple-system, BlinkMacSystemFont, 'JetBrains Mono', monospace" font-weight="800" font-size="11" fill="#92400E" text-anchor="middle" letter-spacing="0.5">EVIDENCE-FIRST</text>
  
  <text x="170" y="122" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="14" fill="#64748B" letter-spacing="0.2">Evidence-Led Brand Governance &amp; Creative Verification</text>
</svg>`;

async function main() {
  console.log('Writing SVGs to apps/web/public ...');
  
  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'vite.svg'), faviconSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), fullLogoSvg, 'utf8');
  
  const svgBuffer = Buffer.from(faviconSvg);

  console.log('Generating rasterized favicons with sharp...');
  // 16x16 PNG
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('  -> favicon-16x16.png created');

  // 32x32 PNG
  const png32Buffer = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32Buffer);
  console.log('  -> favicon-32x32.png created');

  // 48x48 PNG
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon-48x48.png'));
  console.log('  -> favicon-48x48.png created');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('  -> apple-touch-icon.png created');

  // 192x192 Android Chrome Icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  console.log('  -> android-chrome-192x192.png created');

  // 512x512 Android Chrome Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  console.log('  -> android-chrome-512x512.png created');

  // Create valid standard Windows ICO containing PNG payload (supported by all modern browsers & OS)
  // An ICO header is 6 bytes: [0, 0, 1, 0, 1, 0] (type=1 icon, count=1)
  // Directory entry is 16 bytes:
  // [bWidth, bHeight, bColorCount, bReserved, wPlanes(2), wBitCount(2), dwBytesInRes(4), dwImageOffset(4)]
  const icoHeader = Buffer.alloc(6 + 16);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // image type 1 = icon
  icoHeader.writeUInt16LE(1, 4); // number of images

  // Entry 0 (32x32)
  icoHeader.writeUInt8(32, 6);   // width
  icoHeader.writeUInt8(32, 7);   // height
  icoHeader.writeUInt8(0, 8);    // color count (0 for 256+)
  icoHeader.writeUInt8(0, 9);    // reserved
  icoHeader.writeUInt16LE(1, 10); // color planes
  icoHeader.writeUInt16LE(32, 12); // bits per pixel
  icoHeader.writeUInt32LE(png32Buffer.length, 14); // image size in bytes
  icoHeader.writeUInt32LE(22, 18); // offset where image data starts (6+16=22)

  const icoBuffer = Buffer.concat([icoHeader, png32Buffer]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('  -> favicon.ico created');

  // Web App Manifest
  const manifest = {
    name: "Cohesora — Evidence-Led Brand Governance",
    short_name: "Cohesora",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#0B1E36",
    background_color: "#F8FAFC",
    display: "standalone"
  };
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('  -> site.webmanifest created');

  console.log('All favicon and brand assets generated successfully!');
}

main().catch(err => {
  console.error('Failed to generate favicons:', err);
  process.exit(1);
});
