import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import fetch from 'node-fetch';

const TARGET_DIR = path.resolve(process.cwd(), 'public/assets/sprites');

const assets = [
  ['https://www.photopea.com/g/vy3FNFhM', 'berry_tiles.png'],
  ['https://www.photopea.com/g/UM2UnKkw', 'ui_elements.png'],
  ['https://www.photopea.com/g/-49_XMgp', 'power_ups.png'],
  ['https://www.photopea.com/g/r5nMYw3Q', 'yujigo_sprites.png'],
  ['https://www.photopea.com/g/HPD_YfBG', 'world_map_elements.png'],
  ['https://www.photopea.com/g/D5Vnm9mJ', 'kirumi_sprites.png'],
  ['https://www.photopea.com/g/QnBUr2zQ', 'npc_sprites.png'],
];

const IMAGE_URL_PATTERNS = [
  /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
  /https?:\\/\\/[^"'\s>]+\.(?:png|jpe?g|webp)(?:\?[^"'\s>]*)?/i,
  /"(https?:\\/\\/[^"']+\/api\/[^"']+)"/i,
];

const requestHeaders = {
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function absolutize(baseUrl, candidate) {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

async function extractImageUrl(pageUrl) {
  const res = await fetch(pageUrl, { headers: requestHeaders, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to fetch share page (${res.status} ${res.statusText})`);
  }

  const html = await res.text();
  for (const pattern of IMAGE_URL_PATTERNS) {
    const match = html.match(pattern);
    if (!match) continue;
    const candidate = match[1] ?? match[0];
    const absolute = absolutize(pageUrl, candidate.replace(/\\\//g, '/'));
    if (absolute) return absolute;
  }

  throw new Error('Could not find an image URL in the shared page HTML');
}

async function downloadBinary(url) {
  const res = await fetch(url, { headers: { ...requestHeaders, accept: 'image/*,*/*;q=0.8' }, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status} ${res.statusText})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  await mkdir(TARGET_DIR, { recursive: true });

  for (const [shareUrl, filename] of assets) {
    process.stdout.write(`Downloading ${filename} ... `);
    try {
      const imageUrl = await extractImageUrl(shareUrl);
      const binary = await downloadBinary(imageUrl);
      await writeFile(path.join(TARGET_DIR, filename), binary);
      process.stdout.write(`done (${imageUrl})\n`);
    } catch (error) {
      process.stdout.write('failed\n');
      console.error(`  ${filename}: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }

  const obstaclesFile = path.join(TARGET_DIR, 'obstacles_tiles.png');
  try {
    await access(obstaclesFile);
    console.log('✓ obstacles_tiles.png found.');
  } catch {
    console.warn('⚠ obstacles_tiles.png is missing. Please place /public/assets/sprites/obstacles_tiles.png manually (1024x1024, 8x5 grid).');
  }
}

await main();
