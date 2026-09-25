import { writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const colors = {
  tile: [35, 48, 27, 255],
  tileDeep: [25, 34, 20, 255],
  cream: [255, 249, 229, 255],
  creamSoft: [248, 239, 208, 255],
  parchment: [244, 239, 229, 255],
  parchmentLight: [251, 247, 240, 255],
  parchmentDark: [216, 204, 184, 255],
  olive: [77, 87, 56, 255],
  oliveLight: [181, 192, 154, 255],
  oliveSoft: [221, 225, 209, 255],
  wine: [116, 60, 53, 255],
  ink: [36, 35, 31, 255],
  transparent: [0, 0, 0, 0],
};

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function rgbaMix(a, b, t) {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)];
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const index = ((y * png.width) + x) * 4;
  png.data[index] = color[0];
  png.data[index + 1] = color[1];
  png.data[index + 2] = color[2];
  png.data[index + 3] = color[3];
}

function blendPixel(png, x, y, color, alpha = color[3] / 255) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height || alpha <= 0) return;
  const index = ((y * png.width) + x) * 4;
  const inv = 1 - alpha;
  png.data[index] = Math.round((color[0] * alpha) + (png.data[index] * inv));
  png.data[index + 1] = Math.round((color[1] * alpha) + (png.data[index + 1] * inv));
  png.data[index + 2] = Math.round((color[2] * alpha) + (png.data[index + 2] * inv));
  png.data[index + 3] = Math.round(Math.min(255, (color[3] * alpha) + (png.data[index + 3] * inv)));
}

function drawCircle(png, cx, cy, radius, color, alpha = color[3] / 255) {
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const coverage = Math.max(0, Math.min(1, radius + 0.5 - distance));
      if (coverage > 0) blendPixel(png, x, y, color, alpha * coverage);
    }
  }
}

function drawLine(png, x1, y1, x2, y2, width, color, alpha = color[3] / 255) {
  const radius = width / 2;
  const minX = Math.floor(Math.min(x1, x2) - radius - 1);
  const maxX = Math.ceil(Math.max(x1, x2) + radius + 1);
  const minY = Math.floor(Math.min(y1, y2) - radius - 1);
  const maxY = Math.ceil(Math.max(y1, y2) + radius + 1);
  const lengthSq = ((x2 - x1) ** 2) + ((y2 - y1) ** 2);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = Math.max(0, Math.min(1, (((px - x1) * (x2 - x1)) + ((py - y1) * (y2 - y1))) / lengthSq));
      const closestX = x1 + ((x2 - x1) * t);
      const closestY = y1 + ((y2 - y1) * t);
      const distance = Math.hypot(px - closestX, py - closestY);
      const coverage = Math.max(0, Math.min(1, radius + 0.5 - distance));
      if (coverage > 0) blendPixel(png, x, y, color, alpha * coverage);
    }
  }
}

function drawEllipse(png, cx, cy, rx, ry, angle, color, alpha = color[3] / 255) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const radius = Math.max(rx, ry);
  const minX = Math.floor(cx - radius - 1);
  const maxX = Math.ceil(cx + radius + 1);
  const minY = Math.floor(cy - radius - 1);
  const maxY = Math.ceil(cy + radius + 1);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const localX = (dx * cos) + (dy * sin);
      const localY = (-dx * sin) + (dy * cos);
      const value = (localX / rx) ** 2 + (localY / ry) ** 2;
      const edge = 1 - value;
      const coverage = Math.max(0, Math.min(1, edge * Math.min(rx, ry) * 0.38));
      if (coverage > 0) blendPixel(png, x, y, color, alpha * coverage);
    }
  }
}

function drawOpenBook(png, scale, alpha = 1) {
  const left = [
    [304, 364],
    [492, 296],
    [492, 692],
    [292, 760],
  ].map(([x, y]) => [x * scale, y * scale]);
  const right = [
    [532, 296],
    [720, 364],
    [732, 760],
    [532, 692],
  ].map(([x, y]) => [x * scale, y * scale]);

  fillPolygon(png, left, colors.parchmentLight, alpha);
  fillPolygon(png, right, colors.parchmentLight, alpha);
  drawLine(png, 512 * scale, 305 * scale, 512 * scale, 720 * scale, 10 * scale, colors.parchmentDark, alpha * 0.82);
  drawLine(png, 320 * scale, 385 * scale, 493 * scale, 325 * scale, 9 * scale, colors.oliveSoft, alpha * 0.9);
  drawLine(png, 704 * scale, 385 * scale, 531 * scale, 325 * scale, 9 * scale, colors.oliveSoft, alpha * 0.9);
  drawLine(png, 292 * scale, 760 * scale, 492 * scale, 692 * scale, 9 * scale, colors.parchmentDark, alpha);
  drawLine(png, 732 * scale, 760 * scale, 532 * scale, 692 * scale, 9 * scale, colors.parchmentDark, alpha);
  drawLine(png, 356 * scale, 444 * scale, 466 * scale, 405 * scale, 4 * scale, colors.parchmentDark, alpha * 0.65);
  drawLine(png, 558 * scale, 405 * scale, 668 * scale, 444 * scale, 4 * scale, colors.parchmentDark, alpha * 0.65);
  drawLine(png, 356 * scale, 514 * scale, 466 * scale, 474 * scale, 4 * scale, colors.parchmentDark, alpha * 0.55);
  drawLine(png, 558 * scale, 474 * scale, 668 * scale, 514 * scale, 4 * scale, colors.parchmentDark, alpha * 0.55);
}

function fillPolygon(png, points, color, alpha = color[3] / 255) {
  const minY = Math.floor(Math.min(...points.map((point) => point[1])));
  const maxY = Math.ceil(Math.max(...points.map((point) => point[1])));

  for (let y = minY; y <= maxY; y += 1) {
    const nodes = [];
    let previous = points[points.length - 1];
    for (const current of points) {
      if ((current[1] < y && previous[1] >= y) || (previous[1] < y && current[1] >= y)) {
        nodes.push(current[0] + ((y - current[1]) / (previous[1] - current[1])) * (previous[0] - current[0]));
      }
      previous = current;
    }
    nodes.sort((a, b) => a - b);
    for (let i = 0; i < nodes.length; i += 2) {
      if (nodes[i + 1] === undefined) break;
      for (let x = Math.floor(nodes[i]); x <= Math.ceil(nodes[i + 1]); x += 1) {
        blendPixel(png, x, y, color, alpha);
      }
    }
  }
}

function drawCross(png, scale, color = colors.olive, alpha = 1) {
  drawLine(png, 512 * scale, 242 * scale, 512 * scale, 615 * scale, 58 * scale, color, alpha);
  drawLine(png, 404 * scale, 378 * scale, 620 * scale, 378 * scale, 52 * scale, color, alpha);
  drawCircle(png, 512 * scale, 242 * scale, 29 * scale, color, alpha);
  drawCircle(png, 512 * scale, 615 * scale, 29 * scale, color, alpha);
  drawCircle(png, 404 * scale, 378 * scale, 26 * scale, color, alpha);
  drawCircle(png, 620 * scale, 378 * scale, 26 * scale, color, alpha);
}

function drawBranch(png, scale, color = colors.oliveLight, alpha = 1) {
  drawLine(png, 265 * scale, 684 * scale, 420 * scale, 586 * scale, 18 * scale, color, alpha);
  drawLine(png, 420 * scale, 586 * scale, 585 * scale, 508 * scale, 18 * scale, color, alpha);
  drawLine(png, 585 * scale, 508 * scale, 740 * scale, 448 * scale, 18 * scale, color, alpha);
  [
    [338, 639, 48, 19, -0.72],
    [398, 592, 50, 20, 0.64],
    [476, 553, 58, 22, -0.62],
    [554, 514, 54, 21, 0.58],
    [640, 481, 58, 22, -0.47],
    [704, 452, 48, 18, 0.5],
  ].forEach(([cx, cy, rx, ry, angle]) => drawEllipse(png, cx * scale, cy * scale, rx * scale, ry * scale, angle, color, alpha));
}

function drawDoveBranch(png, scale, color = colors.oliveLight, alpha = 1) {
  const s = 0.84;
  const ox = 74;
  const oy = 24;
  const x = (value) => (value * s + ox) * scale;
  const y = (value) => (value * s + oy) * scale;
  const w = (value) => value * s * scale;

  drawLine(png, x(660), y(544), x(888), y(300), w(18), color, alpha);
  drawLine(png, x(746), y(452), x(818), y(364), w(12), color, alpha);
  drawLine(png, x(802), y(392), x(922), y(330), w(12), color, alpha);
  drawLine(png, x(716), y(486), x(820), y(552), w(12), color, alpha);
  drawLine(png, x(682), y(526), x(780), y(620), w(12), color, alpha);
  [
    [780, 394, 38, 78, 0.18],
    [884, 342, 42, 82, 0.92],
    [796, 550, 72, 36, 0.16],
    [742, 616, 66, 30, 0.15],
    [705, 482, 30, 62, -0.08],
  ].forEach(([cx, cy, rx, ry, angle]) => drawEllipse(png, x(cx), y(cy), w(rx), w(ry), angle, color, alpha));
}

function drawDove(png, scale, fill = colors.cream, alpha = 1) {
  const bg = colors.tile;
  const s = 0.84;
  const ox = 74;
  const oy = 24;
  const x = (value) => (value * s + ox) * scale;
  const y = (value) => (value * s + oy) * scale;
  const w = (value) => value * s * scale;
  const p = (points) => points.map(([pointX, pointY]) => [x(pointX), y(pointY)]);

  drawEllipse(png, x(432), y(596), w(226), w(118), -0.12, fill, alpha);
  drawCircle(png, x(586), y(520), w(74), fill, alpha);
  drawEllipse(png, x(542), y(564), w(94), w(82), -0.42, fill, alpha);
  fillPolygon(png, p([[650, 498], [724, 528], [650, 566]]), fill, alpha);

  fillPolygon(png, p([[268, 652], [124, 696], [248, 804], [388, 672]]), fill, alpha);
  drawEllipse(png, x(235), y(742), w(102), w(38), 0.56, fill, alpha);

  drawEllipse(png, x(314), y(482), w(70), w(170), -0.62, fill, alpha);
  drawEllipse(png, x(434), y(396), w(62), w(164), 0.48, fill, alpha);
  fillPolygon(png, p([[340, 512], [472, 318], [522, 558], [430, 548]]), fill, alpha);

  drawLine(png, x(292), y(486), x(486), y(558), w(24), bg, 0.98);
  drawLine(png, x(392), y(438), x(492), y(558), w(23), bg, 0.98);
  drawCircle(png, x(594), y(518), w(16), colors.tileDeep, 1);
}

function drawIcon(size, options = {}) {
  const { transparent = false, monochrome = false, foregroundOnly = false } = options;
  const png = new PNG({ width: size, height: size, colorType: transparent ? 6 : 2 });
  const scale = size / 1024;
  const center = size / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (transparent || foregroundOnly || monochrome) {
        setPixel(png, x, y, colors.transparent);
      } else {
        const distance = Math.hypot(x - center, y - center) / center;
        const bg = rgbaMix(colors.tile, colors.tileDeep, Math.min(distance * 0.9, 1));
        setPixel(png, x, y, bg);
      }
    }
  }

  if (!transparent && !foregroundOnly && !monochrome) {
    drawCircle(png, center, center, 430 * scale, colors.olive, 0.1);
    drawCircle(png, 380 * scale, 426 * scale, 260 * scale, colors.oliveLight, 0.035);
  }

  if (!monochrome) {
    if (foregroundOnly) {
      drawDove(png, scale, colors.cream, 1);
      drawDoveBranch(png, scale, colors.oliveLight, 1);
    } else {
      drawDove(png, scale, colors.creamSoft, 1);
      drawDoveBranch(png, scale, colors.oliveLight, 1);
    }
  } else {
    drawDove(png, scale, colors.ink, 1);
    drawDoveBranch(png, scale, colors.ink, 1);
  }

  return PNG.sync.write(png, { colorType: transparent ? 6 : 2 });
}

writeFileSync('assets/images/icon.png', drawIcon(1024));
writeFileSync('assets/images/splash-icon.png', drawIcon(1024, { transparent: true, foregroundOnly: true }));
writeFileSync('assets/images/android-icon-foreground.png', drawIcon(512, { transparent: true, foregroundOnly: true }));
writeFileSync('assets/images/android-icon-background.png', drawIcon(512));
writeFileSync('assets/images/android-icon-monochrome.png', drawIcon(432, { transparent: true, monochrome: true }));
writeFileSync('assets/images/favicon.png', drawIcon(48));

console.log('Generated app icon assets.');
