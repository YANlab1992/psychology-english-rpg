import Phaser from 'phaser';
import type { PrologueContent, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, button, COLORS, FONT, heading, panel, bodyText, progressMeter } from '../ui/theme';

export class IntroScene extends Phaser.Scene {
  private slide = 0;
  private content!: PrologueContent;
  private card!: Phaser.GameObjects.Container;

  constructor() {
    super('Intro');
  }

  create(): void {
    this.content = this.registry.get('content') as PrologueContent;
    this.cameras.main.setBackgroundColor(COLORS.inkDeep);
    this.drawBackdrop();
    this.renderSlide();
    this.cameras.main.fadeIn(420, 8, 38, 48);
    this.input.keyboard?.on('keydown-ENTER', () => this.next());
    this.input.keyboard?.on('keydown-SPACE', () => this.next());
  }

  private drawBackdrop(): void {
    for (let i = 0; i < 44; i += 1) {
      const x = Phaser.Math.Between(0, 1280);
      const y = Phaser.Math.Between(0, 720);
      const r = Phaser.Math.Between(2, 6);
      this.add.circle(x, y, r, i % 3 === 0 ? COLORS.gold : COLORS.teal, 0.24);
    }
    this.add.rectangle(640, 18, 1240, 8, COLORS.gold, 0.75);
    this.add.rectangle(640, 702, 1240, 8, COLORS.teal, 0.75);
    this.add.text(48, 36, 'PROLOGUE / 心域档案', {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#79ded0', letterSpacing: 3
    });
    button(this, 1160, 47, 160, 40, '跳过剧情', COLORS.tealDark, () => void this.finishIntro(), { depth: 15, fontSize: 15 });
    const g = this.add.graphics();
    g.lineStyle(3, COLORS.teal, 0.22);
    for (let i = 0; i < 18; i += 1) {
      const x1 = Phaser.Math.Between(0, 1280);
      const y1 = Phaser.Math.Between(0, 720);
      g.lineBetween(x1, y1, Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 720));
    }
  }

  private renderSlide(): void {
    this.card?.destroy(true);
    const item = this.content.story[this.slide];
    this.card = panel(this, 150, 105, 980, 505, COLORS.paper, 0.99, 10);
    const number = this.add.text(66, 52, `0${this.slide + 1}`, {
      fontFamily: FONT, fontSize: '70px', fontStyle: 'bold', color: '#e6a52f'
    }).setDepth(11);
    const h = heading(this, 180, 61, item.heading, 36).setDepth(11);
    const divider = this.add.rectangle(500, 155, 820, 5, COLORS.teal, 0.7).setDepth(11);
    const art = this.drawSlideArt(this.slide);
    const b = bodyText(this, 300, 200, item.body, 595, 25).setDepth(11);
    const dots = this.add.text(490, 451, this.content.story.map((_, i) => i === this.slide ? '●' : '○').join('  '), {
      fontFamily: FONT, fontSize: '21px', color: '#248b84'
    }).setOrigin(0.5).setDepth(11);
    const next = button(this, 850, 452, 210, 52,
      this.slide === this.content.story.length - 1 ? '进入校园' : '继续',
      COLORS.teal,
      () => this.next(),
      { depth: 12, fontSize: 21 }
    );
    const progress = progressMeter(this, 300, 486, 380, this.slide + 1, this.content.story.length, COLORS.gold, 12);
    const chapter = badge(this, 845, 44, `SCENE ${this.slide + 1}/${this.content.story.length}`, COLORS.coral, 12);
    this.card.add([number, h, divider, art, b, dots, next, progress, chapter]);
  }

  private drawSlideArt(index: number): Phaser.GameObjects.Container {
    const c = this.add.container(168, 290).setDepth(11);
    const colors = [COLORS.blue, COLORS.coral, COLORS.gold, COLORS.teal];
    c.add(this.add.circle(0, 0, 88, colors[index % colors.length], 0.15).setStrokeStyle(4, colors[index % colors.length], 0.75));
    if (index === 0) {
      c.add(this.add.rectangle(0, 8, 105, 92, 0xffedc7).setStrokeStyle(5, COLORS.ink));
      c.add(this.add.triangle(0, -67, -68, 48, 68, 48, 0, 0, 0x315e78).setStrokeStyle(5, COLORS.ink));
      c.add(this.add.text(0, 8, '心域\n学院', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#17343b', align: 'center' }).setOrigin(0.5));
    } else if (index === 1) {
      c.add(this.add.circle(0, 0, 56, 0x303545).setStrokeStyle(6, COLORS.coral));
      c.add(this.add.text(0, -2, '? ! ?', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#fffbed' }).setOrigin(0.5));
    } else if (index === 2) {
      c.add(this.add.rectangle(0, 0, 108, 92, 0xb98a58).setStrokeStyle(5, COLORS.ink));
      c.add(this.add.text(0, -19, '1879', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#fffbed' }).setOrigin(0.5));
      c.add(this.add.text(0, 24, 'LAB', { fontFamily: FONT, fontSize: '21px', fontStyle: 'bold', color: '#f4ca69' }).setOrigin(0.5));
    } else {
      [-42, 0, 42].forEach((x, i) => c.add(this.add.rectangle(x, 0, 32, 46, [COLORS.coral, COLORS.purple, COLORS.blue][i]).setStrokeStyle(3, COLORS.ink)));
      c.add(this.add.text(0, 58, 'EVIDENCE', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#17343b' }).setOrigin(0.5));
    }
    this.tweens.add({ targets: c, y: c.y - 8, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return c;
  }

  private async next(): Promise<void> {
    if (this.slide < this.content.story.length - 1) {
      this.slide += 1;
      this.renderSlide();
      return;
    }
    await this.finishIntro();
  }

  private async finishIntro(): Promise<void> {
    const save = this.registry.get('save') as SaveData;
    save.stage = 'campus';
    await saves.save(save);
    this.registry.set('save', save);
    this.scene.start('Campus');
  }
}
