import Phaser from 'phaser';
import type { Chapter1Content, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, bodyText, button, COLORS, FONT, heading, panel, progressMeter } from '../ui/theme';

export class Chapter1IntroScene extends Phaser.Scene {
  private content!: Chapter1Content;
  private index = 0;
  private card?: Phaser.GameObjects.Container;

  constructor() {
    super('Chapter1Intro');
  }

  create(): void {
    this.content = this.registry.get('chapter1-content') as Chapter1Content;
    this.drawBackdrop();
    this.renderSlide();
    this.input.keyboard?.on('keydown-ENTER', () => void this.next());
    this.input.keyboard?.on('keydown-SPACE', () => void this.next());
    this.cameras.main.fadeIn(420, 8, 38, 48);
  }

  private drawBackdrop(): void {
    this.add.image(640, 360, 'bg-campus-v4').setDisplaySize(1280, 720).setDepth(-10);
    this.add.rectangle(640, 360, 1280, 720, COLORS.inkDeep, 0.63).setDepth(-9);
    for (let i = 0; i < 20; i += 1) {
      const tile = this.add.rectangle(90 + (i % 10) * 122, 70 + Math.floor(i / 10) * 570, 72, 72,
        [COLORS.blue, COLORS.purple, COLORS.green, COLORS.coral][i % 4], 0.16).setAngle(45);
      this.tweens.add({ targets: tile, angle: 405, duration: 9000 + i * 80, repeat: -1 });
    }
    this.add.text(44, 30, 'CHAPTER 01 / PSYCHOLOGY AS A SCIENCE', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#79ded0', letterSpacing: 2
    });
    button(this, 1160, 48, 170, 42, '跳过导入', COLORS.tealDark, () => void this.finish(), { fontSize: 16 });
  }

  private renderSlide(): void {
    this.card?.destroy(true);
    const item = this.content.story[this.index];
    this.card = panel(this, 145, 105, 990, 510, COLORS.paper, 0.995, 10);
    const number = this.add.text(66, 50, '0' + (this.index + 1), {
      fontFamily: FONT, fontSize: '72px', fontStyle: 'bold', color: '#e6a52f'
    });
    const tag = badge(this, 820, 48, item.tag, [COLORS.coral, COLORS.blue, COLORS.purple, COLORS.green][this.index], 12);
    const title = heading(this, 175, 63, item.heading, 38);
    const copy = bodyText(this, 330, 200, item.body, 575, 25);
    const art = this.drawArt(this.index);
    const meter = progressMeter(this, 330, 414, 390, this.index + 1, this.content.story.length, COLORS.gold, 12);
    const dots = this.add.text(525, 447, this.content.story.map((_, i) => i === this.index ? '●' : '○').join('  '), {
      fontFamily: FONT, fontSize: '20px', color: '#248b84'
    }).setOrigin(0.5);
    const next = button(this, 850, 450, 220, 52,
      this.index === this.content.story.length - 1 ? '进入科学地图' : '继续', COLORS.teal,
      () => void this.next(), { depth: 12, fontSize: 21 });
    this.card.add([number, tag, title, copy, art, meter, dots, next]);
  }

  private drawArt(index: number): Phaser.GameObjects.Container {
    const root = this.add.container(205, 300);
    const colors = [COLORS.coral, COLORS.blue, COLORS.purple, COLORS.green];
    root.add(this.add.circle(0, 0, 105, colors[index], 0.12).setStrokeStyle(5, colors[index], 0.75));
    if (index === 0) {
      root.add(this.add.rectangle(0, 8, 124, 100, COLORS.paper).setStrokeStyle(5, COLORS.ink));
      root.add(this.add.text(0, -15, '档 案\nSOS', { fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#b5543c', align: 'center' }).setOrigin(0.5));
    } else if (index === 1) {
      ['?', 'T', 'H', '✓'].forEach((text, i) => {
        root.add(this.add.circle(-72 + i * 48, 0, 20, colors[index], 0.9).setStrokeStyle(3, COLORS.ink));
        root.add(this.add.text(-72 + i * 48, 0, text, { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#fffbed' }).setOrigin(0.5));
        if (i < 3) root.add(this.add.text(-47 + i * 48, 0, '→', { fontFamily: FONT, fontSize: '18px', color: '#17343b' }).setOrigin(0.5));
      });
    } else if (index === 2) {
      for (let y = 0; y < 3; y += 1) for (let x = 0; x < 3; x += 1) {
        root.add(this.add.rectangle(-50 + x * 50 + y * 8, -48 + y * 48, 38, 38,
          [COLORS.blue, COLORS.purple, COLORS.green][(x + y) % 3], 0.86).setStrokeStyle(3, COLORS.ink));
      }
      root.add(this.add.text(0, 82, '3 × 3 × 3', { fontFamily: FONT, fontSize: '21px', fontStyle: 'bold', color: '#17343b' }).setOrigin(0.5));
    } else {
      root.add(this.add.circle(0, 0, 60, 0xffffff, 0).setStrokeStyle(9, COLORS.green));
      root.add(this.add.text(0, 0, '↻', { fontFamily: FONT, fontSize: '70px', fontStyle: 'bold', color: '#287b49' }).setOrigin(0.5));
      root.add(this.add.text(0, 82, 'REPLICATE', { fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#17343b' }).setOrigin(0.5));
    }
    this.tweens.add({ targets: root, y: root.y - 9, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return root;
  }

  private async next(): Promise<void> {
    if (this.index < this.content.story.length - 1) {
      this.index += 1;
      this.renderSlide();
      return;
    }
    await this.finish();
  }

  private async finish(): Promise<void> {
    const save = this.registry.get('save') as SaveData;
    save.stage = 'chapter1_hub';
    await saves.save(save);
    this.registry.set('save', save);
    this.scene.start('Chapter1Hub');
  }
}
