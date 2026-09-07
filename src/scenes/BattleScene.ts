import Phaser from 'phaser';
import type { BattleSkillContent, PrologueContent, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, button, COLORS, FONT, heading, panel, bodyText, drawPixelBackdrop, progressMeter, toast } from '../ui/theme';

export class BattleScene extends Phaser.Scene {
  private content!: PrologueContent;
  private save!: SaveData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private boss!: Phaser.GameObjects.Container;
  private bossHp = 100;
  private focus = 5;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private used = new Set<string>();
  private pausedForQuestion = false;
  private nextHazardAt = 0;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private focusText!: Phaser.GameObjects.Text;
  private claimText!: Phaser.GameObjects.Text;
  private skillButtons: Phaser.GameObjects.Container[] = [];
  private arena = new Phaser.Geom.Rectangle(285, 220, 710, 345);
  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private moveTarget?: Phaser.Math.Vector2;

  constructor() {
    super('Battle');
  }

  create(): void {
    this.content = this.registry.get('content') as PrologueContent;
    this.save = this.registry.get('save') as SaveData;
    this.save.battleSkillsUsed = [];
    this.save.focusHits = 0;
    this.used.clear();
    this.drawArenaV2();
    this.createActors();
    this.createHud();
    this.setupInput();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.pausedForQuestion || !this.arena.contains(pointer.worldX, pointer.worldY)) return;
      this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
    });
    this.showOpening();
    this.cameras.main.fadeIn(400, 8, 38, 48);
  }

  private drawArenaV2(): void {
    this.add.image(640, 360, 'bg-battle-v4').setDisplaySize(1280, 720).setDepth(-100);
    this.add.rectangle(640, 64, 1280, 128, COLORS.inkDeep, 0.48).setDepth(-20);
    this.add.rectangle(640, 660, 1280, 120, COLORS.inkDeep, 0.44).setDepth(-20);
    const frame = this.add.graphics().setDepth(2);
    frame.lineStyle(3, COLORS.gold, 0.46);
    frame.strokeRect(this.arena.x, this.arena.y, this.arena.width, this.arena.height);
    frame.lineStyle(1, COLORS.cream, 0.28);
    frame.strokeRect(this.arena.x + 7, this.arena.y + 7, this.arena.width - 14, this.arena.height - 14);

    this.add.rectangle(370, 205, 100, 72, COLORS.inkDeep, 0.86)
      .setStrokeStyle(2, COLORS.gold, 0.85).setDepth(7);
    this.timerText = this.add.text(370, 205, '干扰预警\n--', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#f5d77e', align: 'center'
    }).setOrigin(0.5).setDepth(8);
    this.add.text(640, 548, '避开红色预警区 · 用证据回应主张', {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#f8e7b7',
      stroke: '#082630', strokeThickness: 4
    }).setOrigin(0.5).setDepth(8);
  }

  private drawArena(): void {
    drawPixelBackdrop(this, 0x133f49, 0x0b2f39);
    this.add.rectangle(640, 360, 742, 482, COLORS.shadow, 0.32);
    this.add.rectangle(640, 355, 690, 430, 0xe6d2a9).setStrokeStyle(7, COLORS.ink);
    this.add.rectangle(640, 355, 674, 414, 0xf7e6bd, 0.24).setStrokeStyle(2, COLORS.gold, 0.55);
    const g = this.add.graphics();
    g.lineStyle(2, 0xc1a979, 0.6);
    for (let i = 1; i < 8; i += 1) {
      const x = 305 + i * (670 / 8);
      g.lineBetween(x, 150, x, 560);
    }
    for (let i = 1; i < 6; i += 1) {
      const y = 150 + i * (410 / 6);
      g.lineBetween(305, y, 975, y);
    }
    this.add.rectangle(370, 207, 92, 80, 0x7d725f).setStrokeStyle(4, COLORS.ink);
    this.timerText = this.add.text(370, 205, 'NEXT HIT\n--', {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#c6ff72', align: 'center'
    }).setOrigin(0.5);
    this.add.rectangle(905, 485, 90, 70, 0x90734c).setStrokeStyle(4, COLORS.ink);
    this.add.text(905, 485, 'EVIDENCE', {
      fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#fffbed'
    }).setOrigin(0.5);
    this.add.text(640, 542, '移动到安全格 · 红圈结束前离开', {
      fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#806f51'
    }).setOrigin(0.5);
  }

  private createActors(): void {
    this.player = this.physics.add.sprite(500, 430, 'char-axin').setScale(0.62).setDepth(6);
    this.player.body?.setSize(38, 32).setOffset(33, 116);
    this.boss = this.add.container(790, 280).setDepth(6);
    const shadow = this.add.ellipse(0, 58, 120, 28, COLORS.shadow, 0.28);
    const body = this.add.circle(0, 0, 58, 0x303545).setStrokeStyle(6, COLORS.coral);
    const eye1 = this.add.circle(-20, -10, 9, 0xffffff);
    const eye2 = this.add.circle(20, -10, 9, 0xffffff);
    const pupil1 = this.add.circle(-18, -8, 4, COLORS.ink);
    const pupil2 = this.add.circle(22, -8, 4, COLORS.ink);
    const mouth = this.add.arc(0, 20, 24, 0, 180, false, 0x000000, 0).setStrokeStyle(5, 0xffffff);
    const arrows = ['↑', '↙', '?', '→'].map((symbol, i) => this.add.text(
      Math.cos(i * Math.PI / 2) * 74,
      Math.sin(i * Math.PI / 2) * 74,
      symbol,
      { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: i % 2 ? '#f4ca69' : '#e86c5d' }
    ).setOrigin(0.5));
    this.boss.add([shadow, body, eye1, eye2, pupil1, pupil2, mouth, ...arrows]);
    this.tweens.add({ targets: this.boss, y: 291, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: [pupil1, pupil2], x: '+=4', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private createHud(): void {
    this.add.text(640, 28, '读 心 怪', {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#fffbed',
      stroke: '#082630', strokeThickness: 6
    }).setOrigin(0.5);
    badge(this, 205, 45, 'BOSS / MISCONCEPTION', COLORS.coral, 15);
    this.add.rectangle(640, 86, 560, 30, 0x482d2d).setStrokeStyle(4, COLORS.cream);
    this.hpBar = this.add.rectangle(362, 86, 556, 24, COLORS.coral).setOrigin(0, 0.5);
    this.claimText = this.add.text(640, 124, '“心理学就是读心术！”', {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#f4ca69'
    }).setOrigin(0.5);
    this.comboText = this.add.text(928, 118, '证据链 0 / 4', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#79ded0'
    }).setOrigin(1, 0.5);

    const party = panel(this, 20, 150, 250, 410, COLORS.paper, 0.98, 8);
    party.add(this.add.text(28, 24, '行动小队', {
      fontFamily: FONT, fontSize: '23px', fontStyle: 'bold', color: '#17343b'
    }));
    party.add(this.add.sprite(70, 110, 'char-axin').setScale(0.66));
    party.add(this.add.text(125, 80, '阿心', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#17343b' }));
    this.focusText = this.add.text(125, 118, '', { fontFamily: FONT, fontSize: '19px', color: '#248b84' });
    party.add(this.focusText);
    party.add(bodyText(this, 28, 177, '移动或点击场地，躲开红色预警。\n\n按 1–4 或点击技能连接证据。\n\n答错可重试，不扣分。', 192, 17));
    this.updateFocus();

    const evidence = panel(this, 1010, 150, 250, 410, COLORS.paper, 0.98, 8);
    evidence.add(this.add.text(125, 24, '证据板', {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#17343b'
    }).setOrigin(0.5, 0));
    evidence.add(this.add.text(28, 82,
      '○ 准确定义\n\n○ 系统观察\n\n○ 受控比较\n\n○ 限定结论',
      { fontFamily: FONT, fontSize: '19px', color: '#17343b', lineSpacing: 9 }
    ).setName('evidence-list'));

    this.content.battleSkills.forEach((skill, i) => {
      const x = 300 + i * 226;
      const c = button(this, x, 650, 205, 76, `${skill.key}  ${skill.name}\n${skill.en}`,
        Phaser.Display.Color.HexStringToColor(skill.color).color,
        () => this.useSkill(skill),
        { depth: 12, fontSize: 19 });
      this.skillButtons.push(c);
    });
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,ONE,TWO,THREE,FOUR') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  update(time: number): void {
    if (!this.player || !this.keys) return;
    if (this.pausedForQuestion) {
      this.player.setVelocity(0);
      return;
    }
    const dx = Number(this.keys.D.isDown || this.cursors.right.isDown) - Number(this.keys.A.isDown || this.cursors.left.isDown);
    const dy = Number(this.keys.S.isDown || this.cursors.down.isDown) - Number(this.keys.W.isDown || this.cursors.up.isDown);
    const velocity = new Phaser.Math.Vector2(dx, dy).normalize().scale(185);
    if (dx !== 0 || dy !== 0) {
      this.moveTarget = undefined;
      this.player.setVelocity(velocity.x, velocity.y);
    } else if (this.moveTarget) {
      const toward = this.moveTarget.clone().subtract(this.player.getCenter());
      if (toward.length() < 10) { this.player.setVelocity(0); this.moveTarget = undefined; }
      else { toward.normalize().scale(185); this.player.setVelocity(toward.x, toward.y); }
    } else this.player.setVelocity(0);
    this.player.x = Phaser.Math.Clamp(this.player.x, this.arena.left + 20, this.arena.right - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, this.arena.top + 30, this.arena.bottom - 25);

    const shortcuts = [this.keys.ONE, this.keys.TWO, this.keys.THREE, this.keys.FOUR];
    shortcuts.forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) this.useSkill(this.content.battleSkills[i]);
    });
    if (time >= this.nextHazardAt) {
      this.nextHazardAt = time + 2300;
      this.spawnHazard();
    }
    const seconds = Math.max(0, (this.nextHazardAt - time) / 1000);
    this.timerText?.setText(`干扰预警\n${seconds.toFixed(1)}s`);
  }

  private showOpening(): void {
    this.pausedForQuestion = true;
    const overlay = panel(this, 235, 218, 810, 270, COLORS.paper, 1, 40);
    overlay.add(heading(this, 42, 30, '证据交锋', 34));
    overlay.add(bodyText(this, 45, 88,
      '读心怪会不断抛出“想当然”的说法。移动躲避干扰，并使用四种学术动作，把主张拉回证据能够支持的范围。',
      710, 22));
    overlay.add(button(this, 660, 220, 220, 48, '开始交锋', COLORS.teal, () => {
      overlay.destroy(true);
      this.pausedForQuestion = false;
      this.nextHazardAt = this.time.now + 1200;
    }, { depth: 42, fontSize: 20 }));
  }

  private spawnHazard(): void {
    const x = Phaser.Math.Snap.To(Phaser.Math.Between(this.arena.left + 45, this.arena.right - 45), 70);
    const y = Phaser.Math.Snap.To(Phaser.Math.Between(this.arena.top + 45, this.arena.bottom - 45), 60);
    const warning = this.add.circle(x, y, 42, COLORS.coral, 0.18).setStrokeStyle(5, COLORS.coral, 0.9).setDepth(4);
    const inner = this.add.circle(x, y, 25, COLORS.coral, 0.08).setStrokeStyle(2, COLORS.coral, 0.7).setDepth(4);
    const mark = this.add.text(x, y, '!', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#b94238' })
      .setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: [warning, inner, mark], alpha: 0.45, scale: { from: 0.72, to: 1.08 }, duration: 180, yoyo: true, repeat: 4 });
    this.time.delayedCall(1050, () => {
      const hit = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 57;
      warning.setFillStyle(COLORS.coral, 0.85).setScale(1.25);
      inner.setFillStyle(0xfff4d6, 0.75).setScale(1.4);
      mark.setText(hit ? '干扰!' : 'MISS');
      if (hit) {
        this.focus = Math.max(1, this.focus - 1);
        this.save.focusHits += 1;
        this.updateFocus();
        this.cameras.main.shake(170, 0.009);
        toast(this, '受到干扰', '专注下降，但学习进度不会丢失。', COLORS.coral);
      }
      this.time.delayedCall(420, () => { warning.destroy(); inner.destroy(); mark.destroy(); });
    });
  }

  private useSkill(skill: BattleSkillContent): void {
    if (this.pausedForQuestion || this.used.has(skill.id)) return;
    this.pausedForQuestion = true;
    this.claimText.setText(skill.claim);
    const overlay = panel(this, 200, 145, 880, 455, COLORS.paper, 1, 40);
    overlay.add(this.add.text(45, 28, `${skill.name} ${skill.en}`, {
      fontFamily: FONT, fontSize: '27px', fontStyle: 'bold', color: skill.color
    }));
    overlay.add(bodyText(this, 45, 82, skill.prompt, 780, 23));
    skill.options.forEach((option, i) => {
      overlay.add(button(this, 440, 185 + i * 72, 760, 52, `${String.fromCharCode(65 + i)}. ${option}`,
        i % 2 ? COLORS.teal : COLORS.blue,
        () => this.resolveSkill(overlay, skill, i),
        { depth: 42, fontSize: 17 }));
    });
  }

  private resolveSkill(overlay: Phaser.GameObjects.Container, skill: BattleSkillContent, selected: number): void {
    overlay.removeAll(true);
    const correct = selected === skill.answer;
    const title = heading(this, 45, 40, correct ? '证据命中！' : '证据还没有连接上', 32,
      correct ? '#287b49' : '#b5543c');
    const feedback = bodyText(this, 48, 105, correct ? skill.success : skill.retry, 760, 22);
    const next = button(this, 690, 385, 190, 50, correct ? '继续战斗' : '重新判断',
      correct ? COLORS.green : COLORS.coral,
      () => {
        overlay.destroy(true);
        this.pausedForQuestion = false;
        if (correct) this.applyDamage(skill);
      },
      { depth: 42, fontSize: 19 }
    );
    overlay.add([title, feedback, next]);
  }

  private applyDamage(skill: BattleSkillContent): void {
    this.used.add(skill.id);
    this.save.battleSkillsUsed.push(skill.id);
    this.bossHp -= 25;
    this.tweens.add({ targets: this.hpBar, displayWidth: 556 * (this.bossHp / 100), duration: 420, ease: 'Cubic.out' });
    const index = this.content.battleSkills.findIndex((s) => s.id === skill.id);
    this.skillButtons[index].setAlpha(0.42);
    this.tweens.add({ targets: this.boss, x: this.boss.x + 16, duration: 70, yoyo: true, repeat: 4 });
    const damage = this.add.text(this.boss.x, this.boss.y - 90, '-25', {
      fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#e86c5d',
      stroke: '#fffbed', strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: damage, y: damage.y - 52, alpha: 0, duration: 850, ease: 'Cubic.out', onComplete: () => damage.destroy() });
    const ring = this.add.circle(this.boss.x, this.boss.y, 32, 0xffffff, 0).setStrokeStyle(6, COLORS.gold, 0.9).setDepth(18);
    this.tweens.add({ targets: ring, scale: 3.2, alpha: 0, duration: 520, onComplete: () => ring.destroy() });
    this.comboText.setText(`证据链 ${this.used.size} / 4`);
    toast(this, `${skill.name}命中`, skill.success.split('！')[0], Phaser.Display.Color.HexStringToColor(skill.color).color);
    this.updateEvidenceList();
    void saves.save(this.save);
    if (this.bossHp <= 0) {
      this.pausedForQuestion = true;
      this.time.delayedCall(650, () => this.victory());
    }
  }

  private updateEvidenceList(): void {
    const root = this.children.list.find((obj) => obj instanceof Phaser.GameObjects.Container &&
      obj.list.some((child) => child instanceof Phaser.GameObjects.Text && child.name === 'evidence-list')) as Phaser.GameObjects.Container | undefined;
    const list = root?.getByName('evidence-list') as Phaser.GameObjects.Text | null;
    if (!list) return;
    const labels = ['准确定义', '系统观察', '受控比较', '限定结论'];
    list.setText(labels.map((label, i) => `${this.used.has(this.content.battleSkills[i].id) ? '✓' : '○'} ${label}`).join('\n\n'));
  }

  private updateFocus(): void {
    this.focusText?.setText(`专注 ${'●'.repeat(this.focus)}${'○'.repeat(5 - this.focus)}`);
  }

  private victory(): void {
    this.boss.setAlpha(0.25);
    const overlay = panel(this, 230, 190, 820, 340, 0xe8f7e9, 1, 50);
    overlay.add(heading(this, 45, 35, '误会已澄清！', 38, '#287b49'));
    overlay.add(bodyText(this, 48, 105,
      '心理学不是凭直觉读取某个人的心思。它使用科学方法研究行为与心理过程，并且让结论接受证据与重复检验。',
      720, 23));
    overlay.add(progressMeter(this, 48, 238, 500, Math.max(0, 5 - this.save.focusHits), 5, COLORS.green, 52));
    overlay.add(this.add.text(48, 257, `战斗专注：${Math.max(0, 5 - this.save.focusHits)}/5`, {
      fontFamily: FONT, fontSize: '15px', color: '#287b49'
    }));
    overlay.add(button(this, 650, 285, 240, 52, '查看序幕总结', COLORS.green, () => void this.finish(), {
      depth: 52, fontSize: 20
    }));
  }

  private async finish(): Promise<void> {
    this.save.stage = 'complete';
    this.save.completedAt = new Date().toISOString();
    this.unlockTerm('empirical');
    await saves.save(this.save);
    this.registry.set('save', this.save);
    this.scene.start('Ending');
  }

  private unlockTerm(id: string): void {
    if (!this.save.unlockedTerms.includes(id)) this.save.unlockedTerms.push(id);
  }
}
