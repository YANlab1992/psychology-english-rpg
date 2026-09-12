import Phaser from 'phaser';
import type { Chapter1Content, PrologueContent, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, button, COLORS, FONT, heading, panel, bodyText } from '../ui/theme';

export class MenuScene extends Phaser.Scene {
  private save!: SaveData;
  private content!: PrologueContent;
  private chapter1!: Chapter1Content;
  private modal?: Phaser.GameObjects.Container;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.content = this.registry.get('content') as PrologueContent;
    this.chapter1 = this.registry.get('chapter1-content') as Chapter1Content;
    this.save = this.registry.get('save') as SaveData;
    this.drawKeyArt();
    this.drawTitle();
    this.drawCharacters();
    this.drawMenu();
    this.drawProgress();
    this.cameras.main.fadeIn(500, 8, 38, 48);
  }

  private drawKeyArt(): void {
    this.add.image(640, 360, 'bg-campus-v4').setDisplaySize(1280, 720);
    this.add.rectangle(235, 360, 510, 720, COLORS.cream, 0.1);
    this.add.rectangle(640, 704, 1280, 32, COLORS.inkDeep, 0.18);
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(COLORS.inkDeep, COLORS.inkDeep, COLORS.inkDeep, COLORS.inkDeep, 0.24, 0, 0.12, 0);
    vignette.fillRect(0, 0, 500, 720);
  }

  private drawCampus(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x8fd5c7);
    for (let i = 0; i < 9; i += 1) {
      const band = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x75c5bd), Phaser.Display.Color.ValueToColor(0xc4e5c5), 9, i
      );
      this.add.rectangle(640, 42 + i * 38, 1280, 40, Phaser.Display.Color.GetColor(band.r, band.g, band.b));
    }
    for (let i = 0; i < 5; i += 1) {
      const cloud = this.add.container(100 + i * 280, 74 + (i % 2) * 52);
      cloud.add([
        this.add.rectangle(0, 0, 96, 20, 0xffffff, 0.55),
        this.add.rectangle(-22, -14, 45, 22, 0xffffff, 0.55),
        this.add.rectangle(19, -9, 58, 29, 0xffffff, 0.55)
      ]);
      this.tweens.add({ targets: cloud, x: cloud.x + 85, duration: 9000 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.add.rectangle(640, 525, 1280, 390, 0xb7d98c);
    for (let x = 0; x < 1280; x += 64) {
      this.add.rectangle(x + 32, 525 + ((x / 64) % 2) * 14, 64, 390, 0x8fc777, 0.18);
    }
    this.add.rectangle(640, 565, 860, 310, 0xe6d3aa).setStrokeStyle(5, 0xc2aa7a);
    for (let i = 0; i < 14; i += 1) {
      const x = 40 + i * 96;
      const y = i % 2 ? 500 : 470;
      this.add.circle(x, y, 34, i % 3 === 0 ? 0x69ad5a : 0x3c8c58).setStrokeStyle(5, 0x28704a);
      this.add.rectangle(x, y + 42, 12, 42, 0x8b5e3b);
    }
    this.drawBuilding(640, 210, 420, 230, '图 书 馆', COLORS.blue);
    this.drawBuilding(1050, 275, 270, 190, '心理实验室', COLORS.teal);
    this.add.rectangle(640, 560, 310, 120, 0xd1b985, 0.4)
      .setStrokeStyle(4, 0xa88753, 0.55);
    this.add.circle(640, 560, 45, 0xefd897, 0.7).setStrokeStyle(3, 0xa88753);
    this.add.circle(640, 560, 18, COLORS.teal, 0.5);
    for (const x of [490, 790]) {
      this.add.rectangle(x, 522, 10, 74, 0x315e78).setStrokeStyle(2, COLORS.ink);
      this.add.circle(x, 480, 18, 0xffe7a0, 0.7).setStrokeStyle(3, COLORS.ink);
    }
  }

  private drawBuilding(x: number, y: number, w: number, h: number, label: string, accent: number): void {
    this.add.rectangle(x + 7, y + 9, w, h, COLORS.shadow, 0.24);
    this.add.rectangle(x, y, w, h, 0xfff0ce).setStrokeStyle(6, COLORS.ink);
    this.add.triangle(x, y - h / 2 - 58, -w / 2 - 20, 58, w / 2 + 20, 58, 0, 0, 0x315e78)
      .setStrokeStyle(6, COLORS.ink);
    this.add.rectangle(x, y - 26, w - 52, 48, accent).setStrokeStyle(4, COLORS.ink);
    this.add.text(x, y - 26, label, {
      fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#fffbed'
    }).setOrigin(0.5);
    for (const dx of [-w * 0.3, 0, w * 0.3]) {
      this.add.rectangle(x + dx, y + 48, 54, 80, 0xbbe7e4).setStrokeStyle(4, COLORS.ink);
    }
  }

  private drawTitle(): void {
    panel(this, 42, 34, 520, 176, COLORS.paper, 0.96, 6);
    const title = heading(this, 74, 54, this.content.title, 50, '#71391f').setDepth(7);
    title.setStroke('#fff0c9', 6);
    this.add.text(78, 121, this.content.subtitle, {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#17645f'
    }).setDepth(7);
    this.add.text(78, 161, '读懂证据，而不是猜中心思', {
      fontFamily: FONT,
      fontSize: '18px',
      color: '#cf5d4f'
    }).setDepth(7);
    badge(this, 446, 21, 'CHAPTER 00–01', COLORS.coral, 9);
  }

  private drawCharacters(): void {
    const chars = [
      { x: 600, key: 'char-axin', name: '阿心', color: '#df6658' },
      { x: 745, key: 'char-xiaosou', name: '小搜', color: '#238f86' },
      { x: 890, key: 'char-adu', name: '阿读', color: '#3d83b3' }
    ];
    chars.forEach((c, i) => {
      this.add.ellipse(c.x + 4, 536, 92, 22, COLORS.shadow, 0.2).setDepth(4);
      this.add.sprite(c.x, 442 + (i % 2) * 5, c.key).setScale(1.2).setDepth(5);
      this.add.text(c.x, 552, c.name, {
        fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#fffbed',
        backgroundColor: c.color, padding: { x: 12, y: 4 }
      }).setOrigin(0.5).setDepth(6);
    });
  }

  private drawMenu(): void {
    const x = 245;
    button(this, x, 284, 390, 66, '开始游戏 / 章节选择', COLORS.gold, () => this.showChapterSelect(),
      { icon: '▶', fontSize: 23 });

    const stageLabel: Record<SaveData['stage'], string> = {
      intro: '序幕故事', campus: '校园取证', diagnostic: '无惩罚摸底', battle: '序幕证据战', complete: '序幕总结',
      chapter1_intro: '第一章导入', chapter1_hub: '第一章科学地图',
      chapter1_battle: '第一章可信度审议', chapter1_complete: '第一章总结'
    };
    button(this, x, 366, 390, 62, `继续 · ${stageLabel[this.save.stage]}`, COLORS.teal, () => this.continueGame(), {
      icon: '◆', fontSize: 24
    });
    button(this, x, 444, 390, 62, '学习档案', COLORS.blue, () => this.showArchive(), {
      icon: '▤', fontSize: 24
    });
    button(this, x, 522, 390, 62, '操作说明', COLORS.purple, () => this.showControls(), {
      icon: '?', fontSize: 24
    });
  }

  private drawProgress(): void {
    const p = panel(this, 52, 612, 1176, 76, COLORS.paper, 0.97, 7);
    (p.list[2] as Phaser.GameObjects.GameObject & { setVisible: (visible: boolean) => unknown }).setVisible(false);
    const stages = ['序幕', '科学方法', '研究范围', '三维魔方', '可信度'];
    const chapterProgress = this.save.chapter1.completedStations.length;
    const current = this.save.stage.startsWith('chapter1') ? Math.min(4, chapterProgress + 1) : 0;
    stages.forEach((stage, i) => {
      const x = 145 + i * 235;
      this.add.circle(x, 650, 16, i <= current ? COLORS.teal : 0xb3c1b5).setDepth(8);
      if (i < stages.length - 1) {
        this.add.rectangle(x + 118, 650, 194, 7, i < current ? COLORS.teal : 0xc7c9b8).setDepth(8);
      }
      this.add.text(x, 674, stage, {
        fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#17343b'
      }).setOrigin(0.5).setDepth(8);
    });
  }

  private continueGame(): void {
    const target: Record<SaveData['stage'], string> = {
      intro: 'Intro', campus: 'Campus', diagnostic: 'Diagnostic', battle: 'Battle', complete: 'Ending',
      chapter1_intro: 'Chapter1Intro', chapter1_hub: 'Chapter1Hub',
      chapter1_battle: 'Chapter1Battle', chapter1_complete: 'Chapter1Ending'
    };
    this.scene.start(target[this.save.stage]);
  }

  private showChapterSelect(): void {
    if (this.modal) return;
    this.modal = panel(this, 145, 72, 990, 575, COLORS.paper, 0.995, 50);
    this.modal.add(heading(this, 48, 30, '选择游戏入口', 38).setDepth(51));
    this.modal.add(bodyText(this, 50, 82,
      '“从头开始”会清空当前本地进度；章节游玩可直接进入指定章节，并保留其他章节记录。',
      875, 18).setDepth(51));

    const full = panel(this, 48, 143, 894, 105, 0xfff1c8, 1, 51);
    full.add(this.add.text(35, 20, '从头开始', {
      fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: '#71391f'
    }));
    full.add(this.add.text(35, 59, '序章 → 第一章，按主线连续游玩', {
      fontFamily: FONT, fontSize: '17px', color: '#31525a'
    }));
    full.add(button(this, 755, 52, 220, 54, '开始完整旅程', COLORS.gold, () => void this.startFromBeginning(), {
      depth: 53, fontSize: 19, icon: '▶'
    }));

    this.modal.add(this.add.text(50, 278, '特定章节游玩', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#248b84'
    }));
    const prologue = panel(this, 48, 320, 420, 150, COLORS.paper, 1, 51);
    prologue.add(badge(this, 78, 32, 'CHAPTER 00', COLORS.coral, 52));
    prologue.add(this.add.text(28, 58, '序幕：心理学真的会读心吗？', {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#17343b'
    }));
    prologue.add(this.add.text(28, 91, '定义 · 取证 · 无惩罚摸底', {
      fontFamily: FONT, fontSize: '15px', color: '#73969a'
    }));
    prologue.add(button(this, 320, 118, 160, 42, '进入序幕', COLORS.coral, () => void this.startPrologue(), {
      depth: 53, fontSize: 16
    }));

    const chapter = panel(this, 522, 320, 420, 150, 0xeaf6ef, 1, 51);
    chapter.add(badge(this, 78, 32, 'CHAPTER 01', COLORS.green, 52));
    chapter.add(this.add.text(28, 58, this.chapter1.title, {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#17343b'
    }));
    chapter.add(this.add.text(28, 91, '科学地图 · 三维魔方 · 证据审议', {
      fontFamily: FONT, fontSize: '15px', color: '#73969a'
    }));
    chapter.add(button(this, 320, 118, 160, 42, '进入第一章', COLORS.green, () => void this.startChapter1(), {
      depth: 53, fontSize: 16
    }));
    this.modal.add(button(this, 865, 530, 150, 40, '取消', COLORS.muted, () => this.closeModal(), {
      depth: 53, fontSize: 16
    }));
  }

  private async startFromBeginning(): Promise<void> {
    this.save = await saves.reset();
    this.registry.set('save', this.save);
    this.scene.start('Intro');
  }

  private async startPrologue(): Promise<void> {
    const chapter1Record = this.save.chapter1;
    this.save = await saves.reset();
    this.save.chapter1 = chapter1Record;
    await saves.save(this.save);
    this.registry.set('save', this.save);
    this.scene.start('Intro');
  }

  private async startChapter1(): Promise<void> {
    this.save = await saves.startChapter1(this.save);
    this.registry.set('save', this.save);
    this.scene.start('Chapter1Intro');
  }

  private showArchive(): void {
    if (this.modal) return;
    this.modal = panel(this, 190, 95, 900, 530, COLORS.paper, 0.99, 50);
    this.modal.add(heading(this, 45, 30, '学习档案', 36).setDepth(51));
    const prologueTerms = this.content.terms.filter((term) => this.save.unlockedTerms.includes(term.id));
    const chapterTerms = this.chapter1.stations.flatMap((station) => station.terms)
      .filter((term) => this.save.chapter1.unlockedTerms.includes(term.id));
    const terms = [...prologueTerms, ...chapterTerms];
    const summary = terms.length
      ? terms.slice(0, 8).map((term) => `◆ ${term.en}　${term.zh}\n   ${term.note}`).join('\n\n')
      : '尚未收集术语。可从章节选择进入序幕或第一章。';
    this.modal.add(bodyText(this, 48, 95, summary, 800, 21).setDepth(51));
    const correct = this.save.diagnostic.filter((r) => r.correct).length;
    this.modal.add(this.add.text(48, 444,
      `序幕取证 ${this.save.collectedEvidence.length}/3　摸底 ${correct}/${this.save.diagnostic.length}` +
      `　第一章学习站 ${this.save.chapter1.completedStations.length}/4`, {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#248b84'
    }));
    this.modal.add(button(this, 780, 475, 160, 48, '关闭', COLORS.coral, () => this.closeModal(), { depth: 52 }));
  }

  private showControls(): void {
    if (this.modal) return;
    this.modal = panel(this, 190, 95, 900, 530, COLORS.paper, 0.99, 50);
    this.modal.add(heading(this, 45, 30, '操作说明', 36).setDepth(51));
    const help = [
      '移动：WASD / 方向键',
      '鼠标或触屏：点击地图移动',
      '互动：F 或 Enter',
      '冲刺：Shift',
      '学习档案：Tab',
      '证据战：移动躲避干扰，数字键 1–4 或点击技能',
      '第一章：调查四个学习站，再进入可信度审议战',
      '',
      '这是无惩罚序幕。答错会得到分层提示，不会降低课程成绩。'
    ].join('\n');
    this.modal.add(bodyText(this, 48, 95, help, 800, 23).setDepth(51));
    this.modal.add(button(this, 780, 475, 160, 48, '关闭', COLORS.coral, () => this.closeModal(), { depth: 52 }));
  }

  private closeModal(): void {
    this.modal?.destroy(true);
    this.modal = undefined;
  }
}
