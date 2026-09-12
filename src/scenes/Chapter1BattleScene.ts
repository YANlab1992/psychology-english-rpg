import Phaser from 'phaser';
import type { BattleSkillContent, Chapter1Content, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, bodyText, button, COLORS, FONT, heading, panel, progressMeter, toast } from '../ui/theme';
import { isTouchMode, TouchJoystick } from '../ui/touch';

export class Chapter1BattleScene extends Phaser.Scene {
  private content!: Chapter1Content;
  private save!: SaveData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private boss!: Phaser.GameObjects.Container;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private focusText!: Phaser.GameObjects.Text;
  private claimText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private used = new Set<string>();
  private skillButtons: Phaser.GameObjects.Container[] = [];
  private arena = new Phaser.Geom.Rectangle(285, 220, 710, 345);
  private bossHp = 100;
  private focus = 5;
  private nextHazardAt = 0;
  private hazardCount = 0;
  private hazardLabel = '论文干扰';
  private pausedForFeedback = false;
  private questionOpen = false;
  private moveTarget?: Phaser.Math.Vector2;
  private touchMode = false;
  private touchJoystick?: TouchJoystick;

  constructor() {
    super('Chapter1Battle');
  }

  create(): void {
    this.content = this.registry.get('chapter1-content') as Chapter1Content;
    this.save = this.registry.get('save') as SaveData;
    this.touchMode = isTouchMode();
    this.save.chapter1.battleSkillsUsed = [];
    this.save.chapter1.focusHits = 0;
    this.used.clear();
    this.drawArena();
    this.createActors();
    this.createHud();
    this.setupInput();
    if (this.touchMode) this.touchJoystick = new TouchJoystick(this, 104, 625, 54, 30);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.touchJoystick?.owns(pointer)) return;
      if (this.pausedForFeedback || this.questionOpen || !this.arena.contains(pointer.worldX, pointer.worldY)) return;
      this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
    });
    this.showOpening();
    this.cameras.main.fadeIn(420, 8, 38, 48);
  }

  private drawArena(): void {
    this.add.image(640, 360, 'bg-battle-v4').setDisplaySize(1280, 720).setDepth(-100);
    this.add.rectangle(640, 62, 1280, 124, COLORS.inkDeep, 0.55).setDepth(-20);
    this.add.rectangle(640, 660, 1280, 120, COLORS.inkDeep, 0.5).setDepth(-20);
    const frame = this.add.graphics().setDepth(2);
    frame.lineStyle(4, COLORS.gold, 0.55);
    frame.strokeRect(this.arena.x, this.arena.y, this.arena.width, this.arena.height);
    frame.lineStyle(1, COLORS.cream, 0.35);
    frame.strokeRect(this.arena.x + 8, this.arena.y + 8, this.arena.width - 16, this.arena.height - 16);
    this.add.rectangle(370, 205, 110, 72, COLORS.inkDeep, 0.9).setStrokeStyle(2, COLORS.gold).setDepth(7);
    this.timerText = this.add.text(370, 205, '论文干扰\n--', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#f5d77e', align: 'center'
    }).setOrigin(0.5).setDepth(8);
    this.add.text(640, 548, '红圈会锁定当前位置并预判移动 · 一边闪避一边审议证据', {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#f8e7b7',
      stroke: '#082630', strokeThickness: 4
    }).setOrigin(0.5).setDepth(8);
  }

  private createActors(): void {
    this.player = this.physics.add.sprite(485, 430, 'char-axin').setScale(0.62).setDepth(6);
    this.player.body?.setSize(38, 32).setOffset(33, 116);
    this.boss = this.add.container(795, 305).setDepth(6);
    const shadow = this.add.ellipse(0, 66, 150, 30, COLORS.shadow, 0.3);
    const paper = this.add.rectangle(0, 0, 126, 136, 0xffe4c8).setStrokeStyle(7, COLORS.coral);
    const title = this.add.rectangle(0, -46, 104, 24, COLORS.coral);
    const lines = [-22, -2, 18].map((y, i) => this.add.rectangle(0, y, 82 - i * 8, 6, i === 1 ? COLORS.gold : COLORS.muted, 0.8));
    const eye1 = this.add.circle(-27, 38, 10, 0xffffff).setStrokeStyle(3, COLORS.ink);
    const eye2 = this.add.circle(27, 38, 10, 0xffffff).setStrokeStyle(3, COLORS.ink);
    const pupil1 = this.add.circle(-25, 40, 4, COLORS.inkDeep);
    const pupil2 = this.add.circle(29, 40, 4, COLORS.inkDeep);
    const label = this.add.text(0, -47, 'NEW!', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#fffbed' }).setOrigin(0.5);
    this.boss.add([shadow, paper, title, ...lines, eye1, eye2, pupil1, pupil2, label]);
    this.tweens.add({ targets: this.boss, y: 294, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: [pupil1, pupil2], x: '+=5', duration: 480, yoyo: true, repeat: -1 });
  }

  private createHud(): void {
    this.add.text(640, 24, '快 餐 论 文 怪', {
      fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#fffbed',
      stroke: '#082630', strokeThickness: 6
    }).setOrigin(0.5);
    badge(this, 190, 44, 'BOSS / FAST FOOD RESULT', COLORS.coral, 15);
    this.add.rectangle(640, 84, 560, 30, 0x482d2d).setStrokeStyle(4, COLORS.cream);
    this.hpBar = this.add.rectangle(362, 84, 556, 24, COLORS.coral).setOrigin(0, 0.5);
    this.claimText = this.add.text(640, 122, '“新奇就是科学！”', {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#f4ca69'
    }).setOrigin(0.5);
    this.comboText = this.add.text(928, 118, '可信证据 0 / 4', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#79ded0'
    }).setOrigin(1, 0.5);

    const party = panel(this, 20, 150, 250, 410, COLORS.paper, 0.98, 8);
    party.add(this.add.text(28, 23, '审议小队', { fontFamily: FONT, fontSize: '23px', fontStyle: 'bold', color: '#17343b' }));
    party.add(this.add.sprite(70, 110, 'char-axin').setScale(0.66));
    party.add(this.add.text(125, 80, '阿心', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#17343b' }));
    this.focusText = this.add.text(125, 118, '', { fontFamily: FONT, fontSize: '18px', color: '#248b84' });
    party.add(this.focusText);
    party.add(bodyText(this, 28, 176, this.touchMode
      ? '拖动摇杆或点击场地闪避。\n\n直接点击证据卡；选择答案时攻击仍会继续。\n\n答错可重试，进度不会丢失。'
      : 'WASD 或点击场地闪避。\n\n按 1–4 或点击证据卡；选择答案时攻击仍会继续。\n\n答错可重试，进度不会丢失。', 192, 17));
    this.updateFocus();

    const evidence = panel(this, 1010, 150, 250, 410, COLORS.paper, 0.98, 8);
    evidence.add(this.add.text(125, 23, '可信度清单', {
      fontFamily: FONT, fontSize: '23px', fontStyle: 'bold', color: '#17343b'
    }).setOrigin(0.5, 0));
    evidence.add(this.add.text(28, 82, '○ 准确界定\n\n○ 多层整合\n\n○ 独立复现\n\n○ 功效规划', {
      fontFamily: FONT, fontSize: '19px', color: '#17343b', lineSpacing: 9
    }).setName('evidence-list'));

    this.content.battleSkills.forEach((skill, index) => {
      const skillButton = button(this, 300 + index * 226, 650, 205, 76,
        skill.key + '  ' + skill.name + '\n' + skill.en,
        Phaser.Display.Color.HexStringToColor(skill.color).color,
        () => this.useSkill(skill), { depth: 12, fontSize: 18 });
      this.skillButtons.push(skillButton);
    });
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,ONE,TWO,THREE,FOUR') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  update(time: number): void {
    if (!this.player || !this.keys) return;
    this.touchJoystick?.setVisible(!this.pausedForFeedback);
    if (this.pausedForFeedback) {
      this.player.setVelocity(0);
      return;
    }
    const keyX = Number(this.keys.D.isDown || this.cursors.right.isDown) - Number(this.keys.A.isDown || this.cursors.left.isDown);
    const keyY = Number(this.keys.S.isDown || this.cursors.down.isDown) - Number(this.keys.W.isDown || this.cursors.up.isDown);
    const joystick = this.touchJoystick?.vector;
    const dx = joystick && joystick.lengthSq() > 0 ? joystick.x : keyX;
    const dy = joystick && joystick.lengthSq() > 0 ? joystick.y : keyY;
    if (dx !== 0 || dy !== 0) {
      const velocity = new Phaser.Math.Vector2(dx, dy).normalize().scale(190);
      this.player.setVelocity(velocity.x, velocity.y);
      this.moveTarget = undefined;
    } else if (this.moveTarget) {
      const toward = this.moveTarget.clone().subtract(this.player.getCenter());
      if (toward.length() < 10) {
        this.player.setVelocity(0);
        this.moveTarget = undefined;
      } else {
        toward.normalize().scale(190);
        this.player.setVelocity(toward.x, toward.y);
      }
    } else this.player.setVelocity(0);
    this.player.x = Phaser.Math.Clamp(this.player.x, this.arena.left + 20, this.arena.right - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, this.arena.top + 30, this.arena.bottom - 25);
    [this.keys.ONE, this.keys.TWO, this.keys.THREE, this.keys.FOUR].forEach((key, index) => {
      if (Phaser.Input.Keyboard.JustDown(key)) this.useSkill(this.content.battleSkills[index]);
    });
    if (time >= this.nextHazardAt) {
      this.spawnHazard();
      this.nextHazardAt = time + Math.max(1400, 2200 - this.used.size * 150 - (this.questionOpen ? 260 : 0));
    }
    this.timerText.setText(this.hazardLabel + '\n' + Math.max(0, (this.nextHazardAt - time) / 1000).toFixed(1) + 's');
  }

  private showOpening(): void {
    this.pausedForFeedback = true;
    const overlay = panel(this, 230, 205, 820, 305, COLORS.paper, 1, 40);
    overlay.add(heading(this, 45, 30, '终局：可信度审议', 35));
    overlay.add(bodyText(this, 48, 92,
      '快餐论文怪会把“新奇”伪装成“可靠”。红圈多数锁定你当前的位置，部分会预判移动。选择证据时攻击不停：边移动边完成四次科学审议。',
      720, 22));
    overlay.add(button(this, 680, 250, 220, 48, '开始审议', COLORS.teal, () => {
      overlay.destroy(true);
      this.pausedForFeedback = false;
      this.nextHazardAt = this.time.now + 1200;
    }, { depth: 42, fontSize: 20 }));
  }

  private spawnHazard(): void {
    this.hazardCount += 1;
    const randomStrike = this.hazardCount % 5 === 0;
    const predictiveStrike = !randomStrike && this.hazardCount % 3 === 0;
    const body = this.player.body instanceof Phaser.Physics.Arcade.Body ? this.player.body : undefined;
    const lead = predictiveStrike ? 0.4 : 0;
    const margin = 52;
    const rawX = randomStrike ? Phaser.Math.Between(this.arena.left + margin, this.arena.right - margin)
      : this.player.x + (body?.velocity.x ?? 0) * lead + Phaser.Math.Between(-10, 10);
    const rawY = randomStrike ? Phaser.Math.Between(this.arena.top + margin, this.arena.bottom - margin)
      : this.player.y + (body?.velocity.y ?? 0) * lead + Phaser.Math.Between(-10, 10);
    const x = Phaser.Math.Clamp(Phaser.Math.Snap.To(rawX, 10), this.arena.left + margin, this.arena.right - margin);
    const y = Phaser.Math.Clamp(Phaser.Math.Snap.To(rawY, 10), this.arena.top + margin, this.arena.bottom - margin);
    this.hazardLabel = randomStrike ? '随机干扰' : predictiveStrike ? '移动预判' : '位置锁定';
    const warning = this.add.circle(x, y, 43, COLORS.coral, 0.18).setStrokeStyle(5, COLORS.coral, 0.95).setDepth(25);
    const inner = this.add.circle(x, y, 24, COLORS.coral, 0.08).setStrokeStyle(2, COLORS.coral, 0.75).setDepth(25);
    const mark = this.add.text(x, y, predictiveStrike ? '◎' : '!', {
      fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#b94238'
    }).setOrigin(0.5).setDepth(26);
    this.tweens.add({ targets: [warning, inner, mark], alpha: 0.48, scale: { from: 0.7, to: 1.08 }, duration: 170, yoyo: true, repeat: 4 });
    this.time.delayedCall(980, () => {
      if (this.pausedForFeedback) {
        warning.destroy(); inner.destroy(); mark.destroy();
        return;
      }
      const hit = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 58;
      warning.setFillStyle(COLORS.coral, 0.86).setScale(1.25);
      inner.setFillStyle(COLORS.cream, 0.78).setScale(1.45);
      mark.setText(hit ? '干扰!' : 'MISS');
      if (hit) {
        this.focus = Math.max(1, this.focus - 1);
        this.save.chapter1.focusHits += 1;
        this.updateFocus();
        this.cameras.main.shake(160, 0.009);
        toast(this, '受到论文干扰', '专注下降，但已掌握的知识不会丢失。', COLORS.coral);
      }
      this.time.delayedCall(400, () => { warning.destroy(); inner.destroy(); mark.destroy(); });
    });
  }

  private useSkill(skill: BattleSkillContent): void {
    if (this.pausedForFeedback || this.questionOpen || this.used.has(skill.id)) return;
    this.questionOpen = true;
    this.claimText.setText(skill.claim);
    const panelX = this.player.x < 640 ? 610 : 20;
    const overlay = panel(this, panelX, 145, 650, 455, COLORS.paper, 0.97, 40);
    overlay.add(this.add.text(30, 28, skill.name + ' · ' + skill.en, {
      fontFamily: FONT, fontSize: '25px', fontStyle: 'bold', color: skill.color
    }));
    overlay.add(this.add.text(610, 35, '战斗继续 · KEEP MOVING', {
      fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#b5543c'
    }).setOrigin(1, 0));
    overlay.add(bodyText(this, 30, 82, skill.prompt, 590, 21));
    skill.options.forEach((option, index) => {
      overlay.add(button(this, 325, 185 + index * 72, 580, 52,
        String.fromCharCode(65 + index) + '. ' + option,
        index % 2 ? COLORS.teal : COLORS.blue,
        () => this.resolveSkill(overlay, skill, index), { depth: 42, fontSize: 16 }));
    });
  }

  private resolveSkill(overlay: Phaser.GameObjects.Container, skill: BattleSkillContent, selected: number): void {
    this.questionOpen = false;
    this.pausedForFeedback = true;
    overlay.destroy(true);
    const correct = selected === skill.answer;
    const result = panel(this, 230, 190, 820, 340, correct ? 0xe8f7e9 : 0xffefdf, 1, 45);
    result.add(heading(this, 45, 40, correct ? '审议通过：证据命中' : '证据链尚未接通', 31,
      correct ? '#287b49' : '#b5543c'));
    result.add(bodyText(this, 48, 105, correct ? skill.success : skill.retry, 720, 22));
    result.add(button(this, 690, 285, 190, 50, correct ? '继续战斗' : '重新判断',
      correct ? COLORS.green : COLORS.coral, () => {
        result.destroy(true);
        this.pausedForFeedback = false;
        this.nextHazardAt = this.time.now + 850;
        if (correct) this.applyDamage(skill);
      }, { depth: 47, fontSize: 19 }));
  }

  private applyDamage(skill: BattleSkillContent): void {
    this.used.add(skill.id);
    this.save.chapter1.battleSkillsUsed.push(skill.id);
    this.bossHp -= 25;
    this.tweens.add({ targets: this.hpBar, displayWidth: 556 * (this.bossHp / 100), duration: 420 });
    const index = this.content.battleSkills.findIndex((item) => item.id === skill.id);
    this.skillButtons[index].setAlpha(0.42);
    this.tweens.add({ targets: this.boss, x: this.boss.x + 15, duration: 65, yoyo: true, repeat: 4 });
    const damage = this.add.text(this.boss.x, this.boss.y - 100, '-25', {
      fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#e86c5d',
      stroke: '#fffbed', strokeThickness: 3
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: damage, y: damage.y - 48, alpha: 0, duration: 800, onComplete: () => damage.destroy() });
    this.comboText.setText('可信证据 ' + this.used.size + ' / 4');
    this.updateEvidenceList();
    void saves.save(this.save);
    if (this.bossHp <= 0) {
      this.pausedForFeedback = true;
      this.time.delayedCall(600, () => this.victory());
    }
  }

  private updateEvidenceList(): void {
    const root = this.children.list.find((object) => object instanceof Phaser.GameObjects.Container &&
      object.list.some((child) => child instanceof Phaser.GameObjects.Text && child.name === 'evidence-list')) as Phaser.GameObjects.Container | undefined;
    const list = root?.getByName('evidence-list') as Phaser.GameObjects.Text | null;
    const labels = ['准确界定', '多层整合', '独立复现', '功效规划'];
    list?.setText(labels.map((label, index) =>
      (this.used.has(this.content.battleSkills[index].id) ? '✓ ' : '○ ') + label).join('\n\n'));
  }

  private updateFocus(): void {
    this.focusText?.setText('专注 ' + '●'.repeat(this.focus) + '○'.repeat(5 - this.focus));
  }

  private victory(): void {
    this.boss.setAlpha(0.2);
    const overlay = panel(this, 225, 180, 830, 365, 0xe8f7e9, 1, 55);
    overlay.add(heading(this, 48, 35, '科学地图恢复完成！', 37, '#287b49'));
    overlay.add(bodyText(this, 50, 105,
      '你把心理学重新连接成一门整合、多水平的科学，并用独立复现与统计功效守住了证据的可信度。',
      720, 23));
    overlay.add(progressMeter(this, 50, 242, 500, Math.max(0, 5 - this.save.chapter1.focusHits), 5, COLORS.green, 57));
    overlay.add(this.add.text(50, 260, '战斗专注：' + Math.max(0, 5 - this.save.chapter1.focusHits) + '/5', {
      fontFamily: FONT, fontSize: '15px', color: '#287b49'
    }));
    overlay.add(button(this, 685, 310, 240, 52, '查看第一章总结', COLORS.green, () => void this.finish(), {
      depth: 57, fontSize: 20
    }));
  }

  private async finish(): Promise<void> {
    this.save.stage = 'chapter1_complete';
    this.save.chapter1.completedAt = new Date().toISOString();
    await saves.save(this.save);
    this.registry.set('save', this.save);
    this.scene.start('Chapter1Ending');
  }
}
