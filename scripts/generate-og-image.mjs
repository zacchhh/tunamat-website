import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const WIDTH = 1200;
const HEIGHT = 630;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// Draw gradient background matching the site's purple theme
const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
gradient.addColorStop(0, '#1a1040');
gradient.addColorStop(0.5, '#2d1b69');
gradient.addColorStop(1, '#1a1040');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Load and draw the fish logo
const fishImg = await loadImage(join(root, 'logo/fish_background.png'));

// Draw fish image centered, scaled to fit nicely (use as background, slightly faded)
const fishSize = 380;
const fishX = (WIDTH - fishSize) / 2;
const fishY = 40;
ctx.globalAlpha = 0.15;
ctx.drawImage(fishImg, fishX, fishY, fishSize, fishSize);
ctx.globalAlpha = 1.0;

// Draw the fish logo again smaller and more prominent at top
const logoSize = 140;
const logoX = (WIDTH - logoSize) / 2;
const logoY = 80;
ctx.drawImage(fishImg, logoX, logoY, logoSize, logoSize);

// "TUNA ATHLETICS" brand name
ctx.fillStyle = '#ffffff';
ctx.font = '600 28px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('TUNA ATHLETICS', WIDTH / 2, 265);

// Headline: "Plan. Build. Flow."
ctx.font = '800 72px sans-serif';
ctx.fillStyle = '#ffffff';
ctx.fillText('Plan. Build. Flow.', WIDTH / 2, 370);

// Subheadline / CTA
ctx.font = '400 26px sans-serif';
ctx.fillStyle = '#c4b5fd';
ctx.fillText('Class planning apps for group fitness instructors', WIDTH / 2, 430);

// Subtle bottom accent line
const accentGradient = ctx.createLinearGradient(WIDTH / 2 - 200, 0, WIDTH / 2 + 200, 0);
accentGradient.addColorStop(0, 'rgba(124, 92, 252, 0)');
accentGradient.addColorStop(0.5, 'rgba(124, 92, 252, 0.8)');
accentGradient.addColorStop(1, 'rgba(124, 92, 252, 0)');
ctx.fillStyle = accentGradient;
ctx.fillRect(WIDTH / 2 - 200, 460, 400, 2);

// "tunaathletics.com" at bottom
ctx.font = '400 20px sans-serif';
ctx.fillStyle = '#9898a0';
ctx.fillText('tunaathletics.com', WIDTH / 2, 560);

// Save
const buffer = canvas.toBuffer('image/png');
writeFileSync(join(root, 'logo/og-image.png'), buffer);
console.log('Generated logo/og-image.png (1200x630)');
