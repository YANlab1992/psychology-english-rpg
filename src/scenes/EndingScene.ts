import Phaser from 'phaser';
import type { PrologueContent, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, button, COLORS, FONT, heading, panel, bodyText, drawPixelBackdrop } from '../ui/theme';

export class EndingScene extends Phaser.Scene {
  private save!: SaveData;
  private content!: PrologueContent;

  constructor() {
    super('Ending');
  }

  create(): void {
    this.save = this.registry.get('save') as SaveData;
    this.content = this.registry.get('content') as PrologueContent;
    this.drawBackground();
    this.drawSummary();
    this.cameras.main.fadeIn(500, 8, 38, 48);
  }

  private drawBackground(): void {
    drawPixelBackdrop(this, COLORS.inkDeep, 0x164b55);
    for (let i = 0; i < 52; i += 1) {
      const color = [COLORS.teal, COLORS.gold, COLORS.coral, COLORS.blue][i % 4];
      const rect = this.add.rectangle(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 720), 8, 22, color, 0.55)
        .setRotation(Phaser.Math.FloatBetween(-0.8, 0.8));
      this.tweens.add({ targets: rect, y: rect.y + 40, alpha: 0.12, duration: 1500 + i * 17, yoyo: true, repeat: -1 });
    }
  }

  private drawSummary(): void {
    const card = panel(this, 125, 70, 1030, 590, COLORS.paper, 0.995, 10);
    card.add(heading(this, 58, 38, '序幕完成：科学之门已开启', 38));
    card.add(badge(this, 890, 53, 'PROLOGUE CLEAR', COLORS.green, 12));
    card.add(bodyText(this, 60, 100,
      '你没有用“更响亮的说法”击败读心怪，而是建立了定义、观察、比较和限定四条证据链。',
      900, 22));

    const correct = this.save.diagnostic.filter((r) => r.correct).length;
    const stats = [
      { label: '摸底正确', value: `${correct} / ${this.save.diagnostic.length}`, color: COLORS.blue },
      { label: '收集术语', value: `${this.save.unlockedTerms.length}`, color: COLORS.teal },
      { label: '证据技能', value: `${this.save.battleSkillsUsed.length} / 4`, color: COLORS.green },
      { label: '躲避干扰', value: `${Math.max(0, 5 - this.save.focusHits)} / 5`, color: COLORS.gold }
    ];
    stats.forEach((stat, i) => {
      const x = 80 + i * 225;
      card.add(this.add.rectangle(x, 225, 195, 105, stat.color, 0.14).setOrigin(0).setStrokeStyle(3, stat.color));
      card.add(this.add.text(x + 97, 245, stat.label, {
        fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#17343b'
      }).setOrigin(0.5, 0));
      card.add(this.add.text(x + 97, 282, stat.value, {
        fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(stat.color).rgba
      }).setOrigin(0.5, 0));
    });

    const title = correct === this.save.diagnostic.length && this.save.focusHits === 0
      ? '科学侦探 · 完美取证'
      : correct >= Math.ceil(this.save.diagnostic.length * 0.75)
        ? '科学侦探 · 证据敏锐'
        : '科学侦探 · 持续成长';
    card.add(this.add.text(515, 190, title, {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#c27d1f', backgroundColor: '#fff0c9', padding: { x: 14, y: 5 }
    }).setOrigin(0.5));

    card.add(this.add.text(60, 370, '本次掌握的核心句', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#e86c5d'
    }));
    card.add(this.add.text(60, 408,
      'Psychology is the scientific study of behavior and mental processes.',
      { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#17343b', wordWrap: { width: 900 } }
    ));
    card.add(this.add.text(60, 456, '下一章预告：用 describe · explain · predict · modify 四个目标认识心理科学。', {
      fontFamily: FONT, fontSize: '16px', color: '#248b84', fontStyle: 'bold'
    }));

    card.add(button(this, 180, 520, 250, 54, '导出学习报告', COLORS.blue, () => saves.export(this.save), {
      depth: 12, fontSize: 20
    }));
    card.add(button(this, 510, 520, 250, 54, '返回主菜单', COLORS.teal, () => this.scene.start('Menu'), {
      depth: 12, fontSize: 20
    }));
    card.add(button(this, 840, 520, 250, 54, '重新体验', COLORS.coral, async () => {
      const fresh = await saves.reset();
      this.registry.set('save', fresh);
      this.scene.start('Intro');
    }, { depth: 12, fontSize: 20 }));
  }
}
