import Phaser from 'phaser';

export const COLORS = {
  ink: 0x17343b,
  inkDeep: 0x082630,
  cream: 0xfff4d6,
  paper: 0xfffbec,
  teal: 0x248b84,
  tealDark: 0x17645f,
  blue: 0x3d94c6,
  coral: 0xe86c5d,
  green: 0x52a568,
  gold: 0xe6a52f,
  purple: 0x8466b3,
  shadow: 0x061c24,
  white: 0xffffff,
  muted: 0x73969a
} as const;

export const FONT = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';
export const TITLE_FONT = '"STKaiti", "KaiTi", "Microsoft YaHei", serif';

export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number = COLORS.paper,
  alpha = 0.97,
  depth = 10
): Phaser.GameObjects.Container {
  const dark = fill === COLORS.ink || fill === COLORS.inkDeep;
  const frameColor = dark ? COLORS.gold : COLORS.ink;
  const shadow = scene.add.rectangle(8, 10, width, height, COLORS.shadow, 0.42).setOrigin(0);
  const body = scene.add.rectangle(0, 0, width, height, fill, alpha)
    .setOrigin(0)
    .setStrokeStyle(5, frameColor, 1);
  const accent = scene.add.rectangle(8, 8, 8, height - 16, COLORS.gold, 1).setOrigin(0);
  const inner = scene.add.rectangle(7, 7, width - 14, height - 14, 0, 0)
    .setOrigin(0).setStrokeStyle(1, dark ? COLORS.cream : COLORS.gold, 0.48);
  const topLine = scene.add.rectangle(18, 11, width - 31, 2, COLORS.white, dark ? 0.2 : 0.42).setOrigin(0);
  const cornerA = scene.add.rectangle(width - 15, 15, 8, 8, COLORS.gold, 0.92).setAngle(45);
  const cornerB = scene.add.rectangle(width - 15, height - 15, 8, 8, COLORS.gold, 0.92).setAngle(45);
  return scene.add.container(x, y, [shadow, body, accent, inner, topLine, cornerA, cornerB]).setDepth(depth);
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  fill: number,
  onClick: () => void,
  options: { fontSize?: number; depth?: number; icon?: string } = {}
): Phaser.GameObjects.Container {
  const depth = options.depth ?? 20;
  const shadow = scene.add.rectangle(5, 7, width, height, COLORS.shadow, 0.48).setOrigin(0.5);
  const rim = scene.add.rectangle(0, 0, width + 6, height + 6, COLORS.inkDeep, 0.96)
    .setOrigin(0.5).setStrokeStyle(2, COLORS.gold, 0.8);
  const body = scene.add.rectangle(0, 0, width, height, fill, 1)
    .setOrigin(0.5)
    .setStrokeStyle(2, COLORS.cream, 0.72);
  const inner = scene.add.rectangle(0, 0, width - 10, height - 10, 0, 0)
    .setStrokeStyle(1, COLORS.inkDeep, 0.4);
  const shine = scene.add.rectangle(0, -height * 0.3, width - 16, 2, COLORS.white, 0.34);
  const knot = scene.add.rectangle(-width / 2 + 17, 0, 8, 8, COLORS.gold, 0.95).setAngle(45);
  const text = scene.add.text(0, 0, `${options.icon ? `${options.icon}  ` : ''}${label}`, {
    fontFamily: FONT,
    fontSize: `${options.fontSize ?? 24}px`,
    fontStyle: 'bold',
    color: '#fffbed',
    stroke: '#17343b',
    strokeThickness: 3,
    align: 'center'
  }).setOrigin(0.5);

  const c = scene.add.container(x, y, [shadow, rim, body, inner, shine, knot, text]).setDepth(depth);
  body.setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      c.setScale(1.035);
      body.setFillStyle(Phaser.Display.Color.ValueToColor(fill).brighten(12).color);
    })
    .on('pointerout', () => {
      c.setScale(1);
      body.setFillStyle(fill);
    })
    .on('pointerdown', () => c.setScale(0.98))
    .on('pointerup', () => {
      c.setScale(1);
      onClick();
    });
  return c;
}

export function badge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  fill: number = COLORS.teal,
  depth = 20
): Phaser.GameObjects.Container {
  const width = Math.max(92, label.length * 19 + 30);
  const shadow = scene.add.rectangle(3, 4, width, 34, COLORS.shadow, 0.3).setOrigin(0.5);
  const body = scene.add.rectangle(0, 0, width, 34, fill, 1).setOrigin(0.5).setStrokeStyle(2, COLORS.gold, 0.92);
  const inner = scene.add.rectangle(0, 0, width - 8, 26, 0, 0).setStrokeStyle(1, COLORS.cream, 0.4);
  const copy = scene.add.text(0, 0, label, {
    fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#fffbed'
  }).setOrigin(0.5);
  return scene.add.container(x, y, [shadow, body, inner, copy]).setDepth(depth);
}

export function progressMeter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  value: number,
  max: number,
  color: number,
  depth = 20
): Phaser.GameObjects.Container {
  const track = scene.add.rectangle(0, 0, width, 16, COLORS.inkDeep, 0.9).setOrigin(0, 0.5).setStrokeStyle(2, COLORS.cream, 0.8);
  const fill = scene.add.rectangle(3, 0, Math.max(0, (width - 6) * Phaser.Math.Clamp(value / max, 0, 1)), 10, color)
    .setOrigin(0, 0.5);
  const shine = scene.add.rectangle(4, -3, Math.max(0, fill.width - 2), 2, COLORS.white, 0.35).setOrigin(0, 0.5);
  return scene.add.container(x, y, [track, fill, shine]).setDepth(depth);
}

export function toast(
  scene: Phaser.Scene,
  title: string,
  copy: string,
  color: number = COLORS.teal
): Phaser.GameObjects.Container {
  const root = panel(scene, 785, 116, 450, 108, COLORS.paper, 0.99, 2000).setScrollFactor(0).setAlpha(0);
  const icon = scene.add.circle(45, 53, 24, color).setStrokeStyle(3, COLORS.ink);
  const iconText = scene.add.text(45, 53, '✓', { fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#fffbed' }).setOrigin(0.5);
  const h = scene.add.text(82, 22, title, { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#17343b' });
  const b = scene.add.text(82, 55, copy, { fontFamily: FONT, fontSize: '15px', color: '#31525a', wordWrap: { width: 330 } });
  root.add([icon, iconText, h, b]);
  scene.tweens.add({ targets: root, alpha: 1, x: 775, duration: 220, ease: 'Back.out' });
  scene.time.delayedCall(2400, () => scene.tweens.add({
    targets: root, alpha: 0, x: 800, duration: 220, onComplete: () => root.destroy(true)
  }));
  return root;
}

export function drawPixelBackdrop(scene: Phaser.Scene, top: number, bottom: number): void {
  scene.add.rectangle(640, 360, 1280, 720, top);
  for (let i = 0; i < 18; i += 1) {
    const y = i * 40;
    const mix = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(top), Phaser.Display.Color.IntegerToColor(bottom), 18, i
    );
    scene.add.rectangle(640, y + 20, 1280, 40, Phaser.Display.Color.GetColor(mix.r, mix.g, mix.b));
  }
  const grid = scene.add.graphics();
  grid.lineStyle(1, COLORS.white, 0.035);
  for (let x = 0; x <= 1280; x += 32) grid.lineBetween(x, 0, x, 720);
  for (let y = 0; y <= 720; y += 32) grid.lineBetween(0, y, 1280, y);
}

export function heading(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 34,
  color = '#17343b'
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: TITLE_FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    stroke: color === '#fffbed' ? '#17343b' : '#fff4d6',
    strokeThickness: 3
  });
}

export function bodyText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  width: number,
  size = 22,
  color = '#17343b'
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    lineSpacing: 10,
    wordWrap: { width, useAdvancedWrap: true }
  });
}

export function makeQCharacterTextures(
  scene: Phaser.Scene,
  sheetKey: string,
  outputKeys: string[]
): void {
  if (!scene.textures.exists(sheetKey)) return;
  const source = scene.textures.get(sheetKey).getSourceImage() as HTMLImageElement;
  const cellWidth = source.width / outputKeys.length;
  const cropY = Math.round(source.height * 0.075);
  const cropHeight = Math.round(source.height * 0.82);
  const cropInset = cellWidth * 0.07;
  const cropWidth = cellWidth - cropInset * 2;

  outputKeys.forEach((key, index) => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 104, 156);
    if (!texture) return;
    const ctx = texture.context;
    ctx.clearRect(0, 0, 104, 156);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, index * cellWidth + cropInset, cropY, cropWidth, cropHeight, 0, 0, 104, 156);
    texture.refresh();
  });
}

export function makePixelCharacterTexture(
  scene: Phaser.Scene,
  key: string,
  shirt: number,
  hair: number,
  accessory?: 'glass' | 'paper' | 'book' | 'none'
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, 40, 56);
  g.fillStyle(COLORS.shadow, 0.24);
  g.fillEllipse(20, 52, 32, 7);
  // 深色像素轮廓让角色在复杂背景上保持可读。
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(7, 48, 12, 5);
  g.fillRect(21, 48, 12, 5);
  g.fillRect(8, 40, 11, 11);
  g.fillRect(21, 40, 11, 11);
  g.fillRoundedRect(6, 23, 28, 25, 5);
  g.fillCircle(20, 16, 15);
  // 鞋、长裤与衣摆采用三阶明暗，而不是单一色块。
  g.fillStyle(0x3f332f, 1);
  g.fillRect(8, 49, 11, 3);
  g.fillRect(22, 49, 11, 3);
  g.fillStyle(0x52606a, 1);
  g.fillRect(10, 40, 8, 9);
  g.fillRect(22, 40, 8, 9);
  g.fillStyle(0x35444d, 1);
  g.fillRect(15, 43, 3, 6);
  g.fillRect(22, 43, 3, 6);
  const shirtDark = Phaser.Display.Color.IntegerToColor(shirt).darken(26).color;
  const shirtLight = Phaser.Display.Color.IntegerToColor(shirt).brighten(19).color;
  g.fillStyle(shirt, 1);
  g.fillRoundedRect(8, 25, 24, 20, 4);
  g.fillStyle(shirtDark, 1);
  g.fillRect(8, 37, 24, 8);
  g.fillRect(9, 27, 5, 12);
  g.fillStyle(shirtLight, 1);
  g.fillRect(16, 26, 3, 12);
  g.fillRect(13, 25, 14, 2);
  g.fillStyle(COLORS.gold, 1);
  g.fillRect(19, 27, 2, 16);
  g.fillRect(10, 39, 20, 2);
  // 手臂、脸部和发型保留明确轮廓与高光。
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(4, 28, 6, 15);
  g.fillRect(30, 28, 6, 15);
  g.fillStyle(0xffcfad, 1);
  g.fillRect(5, 29, 4, 12);
  g.fillRect(31, 29, 4, 12);
  g.fillCircle(20, 17, 12);
  g.fillStyle(0xffe1c5, 1);
  g.fillRect(11, 14, 18, 7);
  g.fillStyle(hair, 1);
  g.fillRoundedRect(7, 3, 26, 14, 7);
  g.fillRect(7, 11, 5, 11);
  g.fillRect(28, 11, 5, 11);
  g.fillStyle(Phaser.Display.Color.IntegerToColor(hair).brighten(18).color, 1);
  g.fillRect(12, 5, 10, 3);
  g.fillRect(9, 9, 4, 5);
  g.fillStyle(COLORS.inkDeep, 1);
  g.fillRect(14, 17, 3, 3);
  g.fillRect(23, 17, 3, 3);
  g.fillStyle(0xd65d62, 1);
  g.fillRect(18, 22, 5, 1);
  g.fillStyle(0xffffff, 0.72);
  g.fillRect(14, 16, 1, 1);
  g.fillRect(23, 16, 1, 1);
  if (accessory === 'glass') {
    g.lineStyle(3, 0xf4d35e, 1);
    g.strokeCircle(34, 32, 7);
    g.lineBetween(29, 37, 24, 43);
  } else if (accessory === 'paper') {
    g.fillStyle(0xffffff, 1);
    g.fillRect(29, 29, 9, 13);
    g.lineStyle(1, COLORS.blue, 1);
    g.lineBetween(31, 33, 36, 33);
    g.lineBetween(31, 36, 36, 36);
  } else if (accessory === 'book') {
    g.fillStyle(COLORS.purple, 1);
    g.fillRect(28, 31, 11, 13);
    g.lineStyle(2, COLORS.cream, 1);
    g.lineBetween(33, 31, 33, 44);
  }
  g.generateTexture(key, 40, 56);
  g.destroy();
}
