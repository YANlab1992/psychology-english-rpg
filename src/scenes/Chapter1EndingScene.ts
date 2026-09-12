import Phaser from 'phaser';
import type { Chapter1Content, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, bodyText, button, COLORS, FONT, heading, panel } from '../ui/theme';

export class Chapter1EndingScene extends Phaser.Scene {
  private content!: Chapter1Content;
  private save!: SaveData;

  constructor() {
    super('Chapter1Ending');
  }

  create(): void {
    this.content = this.registry.get('chapter1-content') as Chapter1Content;
    this.save = this.registry.get('save') as SaveData;
    this.drawBackground();
    this.drawSummary();
    this.cameras.main.fadeIn(500, 8, 38, 48);
  }

  private drawBackground(): void {
    this.add.image(640, 360, 'bg-campus-v4').setDisplaySize(1280, 720).setDepth(-10);
    this.add.rectangle(640, 360, 1280, 720, COLORS.inkDeep, 0.72).setDepth(-9);
    for (let i = 0; i < 42; i += 1) {
      const color = [COLORS.teal, COLORS.gold, COLORS.coral, COLORS.blue][i % 4];
      const chip = this.add.rectangle(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 720), 12, 26, color, 0.6)
        .setRotation(Phaser.Math.FloatBetween(-0.8, 0.8));
      this.tweens.add({ targets: chip, y: chip.y + 44, alpha: 0.1, duration: 1400 + i * 22, yoyo: true, repeat: -1 });
    }
  }

  private drawSummary(): void {
    const card = panel(this, 105, 55, 1070, 620, COLORS.paper, 0.995, 10);
    card.add(heading(this, 56, 34, '第一章完成：科学地图已重建', 38));
    card.add(badge(this, 930, 49, 'CHAPTER 01 CLEAR', COLORS.green, 12));
    card.add(bodyText(this, 58, 95,
      '你完成了“科学方法—研究范围—三维魔方—可信度危机”四段知识链，并在实时审议中击败了快餐论文怪。',
      920, 21));

    const firstTry = this.save.chapter1.answers.filter((answer) => answer.attempts === 1).length;
    const stats = [
      { label: '学习站', value: this.save.chapter1.completedStations.length + ' / 4', color: COLORS.blue },
      { label: '首次判断', value: firstTry + ' / 8', color: COLORS.teal },
      { label: '核心术语', value: String(this.save.chapter1.unlockedTerms.length), color: COLORS.purple },
      { label: '战斗专注', value: Math.max(0, 5 - this.save.chapter1.focusHits) + ' / 5', color: COLORS.gold }
    ];
    stats.forEach((stat, index) => {
      const x = 62 + index * 245;
      card.add(this.add.rectangle(x, 210, 216, 98, stat.color, 0.13).setOrigin(0).setStrokeStyle(3, stat.color));
      card.add(this.add.text(x + 108, 228, stat.label, {
        fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#17343b'
      }).setOrigin(0.5, 0));
      card.add(this.add.text(x + 108, 260, stat.value, {
        fontFamily: FONT, fontSize: '29px', fontStyle: 'bold',
        color: Phaser.Display.Color.IntegerToColor(stat.color).rgba
      }).setOrigin(0.5, 0));
    });

    card.add(this.add.text(58, 340, '本章概念地图', {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#b5543c'
    }));
    const conceptLine = '科学方法 → 行为与心理过程 → 多水平整合 → 独立复现与统计功效';
    card.add(this.add.text(535, 392, conceptLine, {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#17343b',
      backgroundColor: '#e9f4df', padding: { x: 20, y: 12 }
    }).setOrigin(0.5));
    card.add(this.add.text(58, 443, '核心学术句', {
      fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#248b84'
    }));
    card.add(this.add.text(58, 476, this.content.reviewSentence, {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#17343b', wordWrap: { width: 940 }
    }));

    card.add(button(this, 180, 557, 250, 52, '导出学习报告', COLORS.blue, () => saves.export(this.save), {
      depth: 12, fontSize: 19
    }));
    card.add(button(this, 535, 557, 250, 52, '返回章节选择', COLORS.teal, () => this.scene.start('Menu'), {
      depth: 12, fontSize: 19
    }));
    card.add(button(this, 890, 557, 250, 52, '重玩第一章', COLORS.coral, async () => {
      const updated = await saves.startChapter1(this.save);
      this.registry.set('save', updated);
      this.scene.start('Chapter1Intro');
    }, { depth: 12, fontSize: 19 }));
  }
}
