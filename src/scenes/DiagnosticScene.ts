import Phaser from 'phaser';
import type { DiagnosticQuestion, PrologueContent, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, button, COLORS, FONT, heading, panel, bodyText, drawPixelBackdrop, progressMeter } from '../ui/theme';

export class DiagnosticScene extends Phaser.Scene {
  private content!: PrologueContent;
  private save!: SaveData;
  private index = 0;
  private score = 0;
  private startedAt = 0;
  private card?: Phaser.GameObjects.Container;
  private answered = false;

  constructor() {
    super('Diagnostic');
  }

  create(): void {
    this.content = this.registry.get('content') as PrologueContent;
    this.save = this.registry.get('save') as SaveData;
    this.save.diagnostic = [];
    this.drawBackground();
    this.renderQuestion();
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.answered) return;
      const keys = ['1', '2', '3', '4', 'a', 'b', 'c', 'd'];
      const hit = keys.indexOf(event.key.toLowerCase());
      if (hit >= 0) {
        const selected = hit % 4;
        const q = this.content.diagnostic[this.index];
        if (selected < q.options.length) this.answer(q, selected);
      }
    });
    this.cameras.main.fadeIn(420, 8, 38, 48);
  }

  private drawBackground(): void {
    drawPixelBackdrop(this, COLORS.inkDeep, 0x164b55);
    for (let i = 0; i < 12; i += 1) {
      this.add.rectangle(55 + i * 112, 650, 76, 140 + (i % 4) * 34, i % 2 ? 0x174b56 : 0x1f5f65, 0.65);
    }
    badge(this, 130, 38, 'LOW-STAKES', COLORS.green, 5);
    this.add.text(640, 36, '无惩罚摸底 · DIAGNOSTIC', {
      fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#fffbed'
    }).setOrigin(0.5);
    this.add.text(640, 82, '答错不会扣分；系统只用结果调整后续提示。', {
      fontFamily: FONT, fontSize: '19px', color: '#79ded0'
    }).setOrigin(0.5);
    this.add.text(1160, 38, '数字键 1–4 / A–D', { fontFamily: FONT, fontSize: '14px', color: '#79ded0' }).setOrigin(0.5);
  }

  private renderQuestion(): void {
    this.card?.destroy(true);
    this.answered = false;
    this.startedAt = performance.now();
    const q = this.content.diagnostic[this.index];
    this.card = panel(this, 145, 120, 990, 530, COLORS.paper, 0.995, 10);

    const skillBadge = this.add.text(55, 42, `${q.skill}能力`, {
      fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#fffbed',
      backgroundColor: '#248b84', padding: { x: 12, y: 7 }
    });
    const progress = this.add.text(910, 45, `${this.index + 1} / ${this.content.diagnostic.length}`, {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#17343b'
    }).setOrigin(1, 0);
    const prompt = bodyText(this, 55, 105, q.prompt, 870, 28);
    const meter = progressMeter(this, 55, 82, 855, this.index + 1, this.content.diagnostic.length, COLORS.gold, 12);
    this.card.add([skillBadge, progress, meter, prompt]);

    q.options.forEach((option, i) => {
      const color = i % 2 === 0 ? COLORS.blue : COLORS.teal;
      const optionButton = button(this, 495, 218 + i * 68, 850, 52, `${i + 1} / ${String.fromCharCode(65 + i)}. ${option}`, color,
        () => this.answer(q, i), { depth: 12, fontSize: 18 });
      this.card!.add(optionButton);
    });
  }

  private answer(q: DiagnosticQuestion, selected: number): void {
    if (this.answered) return;
    this.answered = true;
    const correct = selected === q.answer;
    if (correct) this.score += 1;
    this.save.diagnostic.push({
      questionId: q.id,
      selected,
      correct,
      responseMs: Math.round(performance.now() - this.startedAt)
    });
    void saves.save(this.save);

    const overlay = panel(this, 225, 218, 830, 300, correct ? 0xe8f7e9 : 0xffefdf, 1, 40);
    const title = heading(this, 45, 32, correct ? '✓ 回答正确 · Evidence connected' : '再建立一条线索', 29, correct ? '#287b49' : '#b5543c');
    const feedback = bodyText(this, 48, 92,
      `${q.feedback}\n\n正确答案：${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`,
      730, 21);
    const next = button(this, 690, 250, 190, 48,
      this.index === this.content.diagnostic.length - 1 ? '查看结果' : '下一题',
      correct ? COLORS.green : COLORS.coral,
      () => {
        overlay.destroy(true);
        this.next();
      },
      { depth: 42, fontSize: 19 }
    );
    overlay.add([title, feedback, next]);
  }

  private next(): void {
    if (this.index < this.content.diagnostic.length - 1) {
      this.index += 1;
      this.renderQuestion();
    } else {
      this.showSummary();
    }
  }

  private showSummary(): void {
    this.card?.destroy(true);
    this.card = panel(this, 180, 120, 920, 500, COLORS.paper, 1, 20);
    const title = heading(this, 55, 42, '摸底完成', 38);
    const score = this.add.text(460, 130, `${this.score} / ${this.content.diagnostic.length}`, {
      fontFamily: FONT, fontSize: '72px', fontStyle: 'bold', color: '#248b84'
    }).setOrigin(0.5);
    const copy = bodyText(this, 92, 205,
      '这不是成绩，而是你的起点。系统已经记录你的作答与反应时间。下一步，把刚刚找到的概念用于一场真正的“证据交锋”。',
      740, 24);
    const avg = this.save.diagnostic.length
      ? Math.round(this.save.diagnostic.reduce((sum, item) => sum + item.responseMs, 0) / this.save.diagnostic.length / 100) / 10
      : 0;
    const timing = this.add.text(460, 322, `平均思考时间 ${avg.toFixed(1)} 秒 · 仅用于自我反馈`, {
      fontFamily: FONT, fontSize: '17px', color: '#73969a'
    }).setOrigin(0.5);
    const next = button(this, 460, 390, 310, 58, '进入证据战', COLORS.gold, () => void this.enterBattle(), {
      depth: 22, fontSize: 24, icon: '⚡'
    });
    this.card.add([title, score, copy, timing, next]);
  }

  private async enterBattle(): Promise<void> {
    this.save.stage = 'battle';
    await saves.save(this.save);
    this.registry.set('save', this.save);
    this.scene.start('Battle');
  }
}
