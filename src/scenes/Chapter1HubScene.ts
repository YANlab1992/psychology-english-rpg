import Phaser from 'phaser';
import type { Chapter1Content, ChapterQuestion, ChapterStation, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, bodyText, button, COLORS, FONT, heading, panel, progressMeter, toast } from '../ui/theme';
import { isTouchMode, TouchButton, TouchJoystick } from '../ui/touch';

interface StationPoint {
  id: string;
  x: number;
  y: number;
  node: Phaser.GameObjects.Container;
  station?: ChapterStation;
  gate?: boolean;
}

export class Chapter1HubScene extends Phaser.Scene {
  private content!: Chapter1Content;
  private save!: SaveData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private points: StationPoint[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;
  private minimapPlayer!: Phaser.GameObjects.Rectangle;
  private overlay?: Phaser.GameObjects.Container;
  private overlayControls: Phaser.GameObjects.Container[] = [];
  private overlayMode?: 'lesson' | 'question' | 'result';
  private resultState?: { question: ChapterQuestion; selected: number; correct: boolean };
  private activeStation?: ChapterStation;
  private pageIndex = 0;
  private questionIndex = 0;
  private attempts = 0;
  private moveTarget?: Phaser.Math.Vector2;
  private touchMode = false;
  private touchJoystick?: TouchJoystick;
  private touchAction?: TouchButton;
  private touchSprint?: TouchButton;

  constructor() {
    super('Chapter1Hub');
  }

  create(): void {
    this.content = this.registry.get('chapter1-content') as Chapter1Content;
    this.save = this.registry.get('save') as SaveData;
    this.touchMode = isTouchMode();
    this.physics.world.setBounds(0, 0, 1800, 1000);
    this.drawWorld();
    this.createStations();
    this.createPlayer();
    this.createHud();
    this.createTouchControls();
    this.setupInput();
    this.cameras.main.setBounds(0, 0, 1800, 1000);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(420, 8, 38, 48);
  }

  private drawWorld(): void {
    this.add.image(900, 500, 'bg-campus-v4').setDisplaySize(1800, 1000).setDepth(-100);
    this.add.rectangle(900, 500, 1800, 1000, 0x073039, 0.08).setDepth(-99);
    const route = this.add.graphics().setDepth(-5);
    route.lineStyle(18, COLORS.cream, 0.32);
    route.beginPath();
    route.moveTo(880, 830);
    route.lineTo(600, 690);
    route.lineTo(830, 480);
    route.lineTo(1430, 450);
    route.lineTo(1130, 690);
    route.lineTo(1410, 790);
    route.strokePath();
    route.lineStyle(3, COLORS.gold, 0.55);
    route.strokePath();
    this.add.text(900, 105, '湖南师大校园 · 科学地图重建区', {
      fontFamily: FONT, fontSize: '21px', fontStyle: 'bold', color: '#fffbed',
      stroke: '#082630', strokeThickness: 5, backgroundColor: '#082630aa', padding: { x: 14, y: 7 }
    }).setOrigin(0.5).setDepth(4);
  }

  private createStations(): void {
    const positions = [
      { id: 'method', x: 830, y: 480 },
      { id: 'scope', x: 600, y: 690 },
      { id: 'cube', x: 1130, y: 690 },
      { id: 'crisis', x: 1430, y: 450 }
    ];
    positions.forEach((position) => {
      const station = this.content.stations.find((item) => item.id === position.id)!;
      const color = Phaser.Display.Color.HexStringToColor(station.color).color;
      const done = this.save.chapter1.completedStations.includes(station.id);
      const root = this.add.container(position.x, position.y).setDepth(position.y);
      const glow = this.add.circle(0, 0, 68, color, done ? 0.12 : 0.22).setStrokeStyle(4, color, 0.85);
      const shadow = this.add.ellipse(5, 53, 130, 30, COLORS.shadow, 0.28);
      const terminal = this.add.rectangle(0, 4, 112, 104, done ? 0xe7f6df : COLORS.paper)
        .setStrokeStyle(5, COLORS.ink);
      const band = this.add.rectangle(0, -30, 101, 27, color);
      const icon = this.add.text(0, 2, done ? '✓' : station.icon, {
        fontFamily: FONT, fontSize: '35px', fontStyle: 'bold', color: done ? '#287b49' : '#17343b'
      }).setOrigin(0.5);
      const label = this.add.text(0, 83, station.title + '\n' + station.en, {
        fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#fffbed', align: 'center',
        stroke: '#082630', strokeThickness: 4, backgroundColor: '#082630cc', padding: { x: 10, y: 5 }
      }).setOrigin(0.5);
      root.add([glow, shadow, terminal, band, icon, label]);
      if (!done) this.tweens.add({ targets: glow, scale: 1.16, alpha: 0.1, duration: 850, yoyo: true, repeat: -1 });
      this.points.push({ ...position, node: root, station });
    });

    const gateDone = this.allStationsDone();
    const gate = this.add.container(1410, 790).setDepth(790);
    const gateGlow = this.add.circle(0, 0, 75, gateDone ? COLORS.gold : COLORS.muted, 0.18)
      .setStrokeStyle(5, gateDone ? COLORS.gold : COLORS.muted, 0.8);
    const gateBody = this.add.rectangle(0, 0, 128, 112, gateDone ? COLORS.inkDeep : 0x59686a)
      .setStrokeStyle(6, COLORS.cream);
    const gateIcon = this.add.text(0, -5, gateDone ? '⚡' : '4/4', {
      fontFamily: FONT, fontSize: '31px', fontStyle: 'bold', color: gateDone ? '#f4ca69' : '#d4dfd8'
    }).setOrigin(0.5).setName('gate-icon');
    const gateLabel = this.add.text(0, 82, '证据审议厅\nEVIDENCE HALL', {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#fffbed', align: 'center',
      backgroundColor: '#082630d9', padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    gate.add([gateGlow, gateBody, gateIcon, gateLabel]);
    this.points.push({ id: 'gate', x: 1410, y: 790, node: gate, gate: true });
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(880, 830, 'char-axin').setScale(0.61).setDepth(830);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(38, 32).setOffset(33, 116);
  }

  private createHud(): void {
    const hud = panel(this, 20, 18, 525, 132, COLORS.inkDeep, 0.95, 1100).setScrollFactor(0, 0, true);
    (hud.list[2] as Phaser.GameObjects.GameObject & { setVisible: (visible: boolean) => unknown }).setVisible(false);
    this.add.text(46, 35, 'CHAPTER 01 / SCIENCE MAP', {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#79ded0', letterSpacing: 2
    }).setScrollFactor(0).setDepth(1101);
    this.add.text(46, 60, '重建心理学的科学地图', {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#f4ca69'
    }).setScrollFactor(0).setDepth(1101);
    this.questText = this.add.text(46, 99, '', {
      fontFamily: FONT, fontSize: '17px', color: '#fffbed'
    }).setScrollFactor(0).setDepth(1101);
    this.updateQuest();

    const map = panel(this, 1014, 18, 246, 132, COLORS.inkDeep, 0.95, 1100).setScrollFactor(0, 0, true);
    (map.list[2] as Phaser.GameObjects.GameObject & { setVisible: (visible: boolean) => unknown }).setVisible(false);
    this.add.text(1037, 34, 'SCIENCE MAP', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#79ded0' })
      .setScrollFactor(0).setDepth(1101);
    this.add.rectangle(1137, 96, 184, 70, 0x6b9c72).setStrokeStyle(2, COLORS.cream).setScrollFactor(0).setDepth(1101);
    [[1075, 91, COLORS.coral], [1120, 76, COLORS.blue], [1162, 91, COLORS.purple], [1200, 75, COLORS.green]].forEach((m) => {
      this.add.circle(m[0], m[1], 7, m[2]).setScrollFactor(0).setDepth(1102);
    });
    this.minimapPlayer = this.add.rectangle(1137, 116, 7, 7, COLORS.gold).setStrokeStyle(1, COLORS.white)
      .setScrollFactor(0).setDepth(1103);
    button(this, 840, 53, 220, 48, '章节选择', COLORS.blue, () => this.scene.start('Menu'), { depth: 1105, fontSize: 18 })
      .setScrollFactor(0, 0, true);
    this.prompt = this.add.text(640, 656, '', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#17343b',
      backgroundColor: '#fff4d6', padding: { x: 18, y: 10 }, stroke: '#ffffff', strokeThickness: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1110).setVisible(false);
    this.add.text(24, 686, this.touchMode ? '拖动摇杆 / 点击地面移动　右侧按钮调查' : 'WASD / 点击移动　Shift冲刺　F互动', {
      fontFamily: FONT, fontSize: '15px', color: '#fffbed', backgroundColor: '#082630dd', padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(1110);
  }

  private createTouchControls(): void {
    if (!this.touchMode) return;
    this.touchJoystick = new TouchJoystick(this, 104, 590, 66);
    this.touchSprint = new TouchButton(this, 239, 620, 43, '冲刺', COLORS.blue);
    this.touchAction = new TouchButton(this, 1170, 607, 58, '调查', COLORS.coral, () => this.handleAction());
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,F,ENTER,SHIFT,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard?.on('keydown-F', () => this.handleAction());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleAction());
    this.input.keyboard?.on('keydown-ESC', () => this.closeOverlay());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.touchJoystick?.owns(pointer) || this.touchSprint?.owns(pointer) || this.touchAction?.owns(pointer)) return;
      if (this.overlay) {
        this.handleOverlayPointer(pointer);
        return;
      }
      if (pointer.y < 155 || pointer.y > 665) return;
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.moveTarget = new Phaser.Math.Vector2(world.x, world.y);
    });
  }

  update(): void {
    if (!this.player || !this.keys) return;
    const canMove = !this.overlay;
    this.touchJoystick?.setVisible(canMove);
    this.touchSprint?.setVisible(canMove);
    this.touchAction?.setVisible(canMove);
    if (!canMove) {
      this.player.setVelocity(0);
      return;
    }
    const keyX = Number(this.keys.D.isDown || this.cursors.right.isDown) - Number(this.keys.A.isDown || this.cursors.left.isDown);
    const keyY = Number(this.keys.S.isDown || this.cursors.down.isDown) - Number(this.keys.W.isDown || this.cursors.up.isDown);
    const joystick = this.touchJoystick?.vector;
    const dx = joystick && joystick.lengthSq() > 0 ? joystick.x : keyX;
    const dy = joystick && joystick.lengthSq() > 0 ? joystick.y : keyY;
    const speed = this.keys.SHIFT.isDown || this.touchSprint?.isDown ? 270 : 178;
    if (dx !== 0 || dy !== 0) {
      const velocity = new Phaser.Math.Vector2(dx, dy).normalize().scale(speed);
      this.player.setVelocity(velocity.x, velocity.y);
      this.moveTarget = undefined;
      if (dx !== 0) this.player.setFlipX(dx < 0);
    } else if (this.moveTarget) {
      const toward = this.moveTarget.clone().subtract(this.player.getCenter());
      if (toward.length() < 12) {
        this.player.setVelocity(0);
        this.moveTarget = undefined;
      } else {
        toward.normalize().scale(178);
        this.player.setVelocity(toward.x, toward.y);
        this.player.setFlipX(toward.x < 0);
      }
    } else this.player.setVelocity(0);
    this.player.setDepth(Math.round(this.player.y));
    this.player.setAngle(this.player.body instanceof Phaser.Physics.Arcade.Body && this.player.body.speed > 1
      ? Math.sin(this.time.now * 0.018) * 1.8 : 0);
    this.minimapPlayer.setPosition(1045 + (this.player.x / 1800) * 184, 61 + (this.player.y / 1000) * 70);
    const nearest = this.nearestPoint();
    this.prompt.setVisible(Boolean(nearest));
    if (nearest?.gate) this.prompt.setText(this.allStationsDone() ? 'F / 点击：进入证据审议厅' : '完成 4 个学习站后开启');
    else if (nearest?.station) this.prompt.setText('F / 点击：调查 ' + nearest.station.title);
  }

  private nearestPoint(): StationPoint | undefined {
    return this.points
      .map((point) => ({ point, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y) }))
      .filter((item) => item.distance < 125)
      .sort((a, b) => a.distance - b.distance)[0]?.point;
  }

  private handleAction(): void {
    if (this.overlay) return;
    const nearest = this.nearestPoint();
    if (!nearest) return;
    if (nearest.gate) {
      if (this.allStationsDone()) void this.enterBattle();
      else toast(this, '审议厅尚未开启', '先完成四个学习站，重建完整科学地图。', COLORS.coral);
      return;
    }
    if (nearest.station) this.openStation(nearest.station);
  }

  private openStation(station: ChapterStation): void {
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    this.activeStation = station;
    this.pageIndex = 0;
    this.questionIndex = 0;
    this.attempts = 0;
    this.renderLesson();
  }

  private renderLesson(): void {
    this.clearOverlay();
    if (!this.activeStation) return;
    const station = this.activeStation;
    const pageData = station.pages[this.pageIndex];
    const color = Phaser.Display.Color.HexStringToColor(station.color).color;
    this.overlay = panel(this, 140, 62, 1000, 598, COLORS.paper, 1, 1900).setScrollFactor(0, 0, true);
    this.overlayMode = 'lesson';
    this.overlay.add(badge(this, 875, 43, station.en, color, 1902));
    this.overlay.add(heading(this, 52, 35, station.title + ' · ' + pageData.heading, 32));
    this.overlay.add(this.add.text(55, 103, 'ENGLISH SOURCE', {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#248b84', letterSpacing: 2
    }));
    this.overlay.add(bodyText(this, 55, 136, pageData.en, 875, 23));
    this.overlay.add(this.add.rectangle(500, 264, 890, 2, color, 0.45));
    this.overlay.add(this.add.text(55, 287, '概念解释', {
      fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#b5543c'
    }));
    this.overlay.add(bodyText(this, 55, 326, pageData.zh, 875, 21));
    this.overlay.add(this.add.rectangle(500, 433, 880, 62, color, 0.11).setStrokeStyle(3, color, 0.65));
    this.overlay.add(this.add.text(500, 433, pageData.focus, {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#17343b', align: 'center'
    }).setOrigin(0.5));
    this.overlay.add(progressMeter(this, 55, 507, 620, this.pageIndex + 1, station.pages.length + station.challenges.length, color, 1902));
    this.addOverlayControl(button(this, 975, 584, 240, 52,
      this.pageIndex === station.pages.length - 1 ? '开始现场判断' : '下一页', color,
      () => this.advanceLesson(), { depth: 1902, fontSize: 20 }));
    this.addOverlayControl(button(this, 1015, 632, 145, 34, '稍后再来', COLORS.muted, () => this.closeOverlay(), { depth: 1902, fontSize: 14 }));
    this.overlay.setScrollFactor(0, 0, true);
  }

  private renderQuestion(): void {
    this.clearOverlay();
    if (!this.activeStation) return;
    const station = this.activeStation;
    const q = station.challenges[this.questionIndex];
    const color = Phaser.Display.Color.HexStringToColor(station.color).color;
    this.overlay = panel(this, 140, 62, 1000, 598, COLORS.paper, 1, 1900).setScrollFactor(0, 0, true);
    this.overlayMode = 'question';
    this.overlay.add(badge(this, 870, 43, 'FIELD CHECK ' + (this.questionIndex + 1) + '/2', color, 1902));
    this.overlay.add(heading(this, 54, 34, station.title + ' · 现场判断', 34));
    this.overlay.add(bodyText(this, 55, 105, q.prompt, 870, 27));
    q.options.forEach((option, index) => {
      this.addOverlayControl(button(this, 640, 297 + index * 78, 880, 58,
        String.fromCharCode(65 + index) + '. ' + option,
        index % 2 ? COLORS.teal : COLORS.blue,
        () => this.answerQuestion(q, index), { depth: 1902, fontSize: 18 }));
    });
    this.overlay.add(this.add.text(55, 507, '答错不扣分，会提供线索后重试。', {
      fontFamily: FONT, fontSize: '16px', color: '#73969a'
    }));
    this.overlay.add(progressMeter(this, 55, 545, 620, station.pages.length + this.questionIndex + 1,
      station.pages.length + station.challenges.length, color, 1902));
    this.addOverlayControl(button(this, 1015, 612, 145, 36, '退出', COLORS.muted, () => this.closeOverlay(), { depth: 1902, fontSize: 15 }));
    this.overlay.setScrollFactor(0, 0, true);
  }

  private answerQuestion(q: ChapterQuestion, selected: number): void {
    this.attempts += 1;
    const correct = selected === q.answer;
    this.clearOverlay();
    const result = panel(this, 220, 175, 840, 370, correct ? 0xe8f7e9 : 0xffefdf, 1, 1950).setScrollFactor(0, 0, true);
    this.overlayMode = 'result';
    this.resultState = { question: q, selected, correct };
    result.add(heading(this, 48, 36, correct ? '证据连接成功' : '这条线索还没有对齐', 31,
      correct ? '#287b49' : '#b5543c'));
    result.add(bodyText(this, 50, 105, correct ? q.feedback : q.hint, 735, 22));
    if (correct) {
      result.add(this.add.text(50, 235, '正确答案：' + q.options[q.answer], {
        fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#287b49', wordWrap: { width: 700 }
      }));
    }
    this.addOverlayControl(button(this, 910, 485, 220, 50, correct ? '继续' : '带着线索重试',
      correct ? COLORS.green : COLORS.coral,
      () => this.continueResult(), { depth: 1952, fontSize: 19 }));
    result.setScrollFactor(0, 0, true);
    this.overlay = result;
  }

  private async recordAnswer(q: ChapterQuestion, selected: number): Promise<void> {
    const existing = this.save.chapter1.answers.find((item) => item.questionId === q.id);
    if (!existing) this.save.chapter1.answers.push({
      questionId: q.id, selected, correct: true, attempts: this.attempts
    });
    if (!this.activeStation) return;
    if (this.questionIndex < this.activeStation.challenges.length - 1) {
      this.questionIndex += 1;
      this.attempts = 0;
      await saves.save(this.save);
      this.renderQuestion();
      return;
    }
    await this.completeStation(this.activeStation);
  }

  private async completeStation(station: ChapterStation): Promise<void> {
    if (!this.save.chapter1.completedStations.includes(station.id)) {
      this.save.chapter1.completedStations.push(station.id);
      station.terms.forEach((term) => {
        if (!this.save.chapter1.unlockedTerms.includes(term.id)) this.save.chapter1.unlockedTerms.push(term.id);
      });
    }
    await saves.save(this.save);
    this.registry.set('save', this.save);
    this.clearOverlay();
    this.resumeMapCamera();
    const point = this.points.find((item) => item.id === station.id);
    const mark = point?.node.list.find((item) => item instanceof Phaser.GameObjects.Text && (item.text === station.icon || item.text === '✓')) as Phaser.GameObjects.Text | undefined;
    mark?.setText('✓').setColor('#287b49');
    this.updateQuest();
    toast(this, station.title + '修复完成', '收录术语：' + station.terms.map((term) => term.en).join(' · '), Phaser.Display.Color.HexStringToColor(station.color).color);
    this.activeStation = undefined;
    if (this.allStationsDone()) this.unlockGateVisual();
  }

  private updateQuest(): void {
    if (!this.questText) return;
    const done = this.save.chapter1.completedStations.length;
    this.questText.setText(done < this.content.stations.length
      ? '修复学习站 ' + done + ' / ' + this.content.stations.length
      : '科学地图完成：前往证据审议厅');
  }

  private unlockGateVisual(): void {
    const gate = this.points.find((point) => point.gate)?.node;
    const icon = gate?.getByName('gate-icon') as Phaser.GameObjects.Text | null;
    icon?.setText('⚡').setColor('#f4ca69');
    this.tweens.add({ targets: gate, scale: 1.08, duration: 420, yoyo: true, repeat: 2 });
  }

  private allStationsDone(): boolean {
    return this.content.stations.every((station) => this.save.chapter1.completedStations.includes(station.id));
  }

  private closeOverlay(): void {
    this.clearOverlay();
    this.activeStation = undefined;
    this.resumeMapCamera();
  }

  private addOverlayControl(control: Phaser.GameObjects.Container): void {
    control.setScrollFactor(0, 0, true);
    this.overlayControls.push(control);
  }

  private clearOverlay(): void {
    this.overlay?.destroy(true);
    this.overlay = undefined;
    this.overlayControls.forEach((control) => control.destroy(true));
    this.overlayControls = [];
    this.overlayMode = undefined;
    this.resultState = undefined;
  }

  private advanceLesson(): void {
    if (!this.activeStation) return;
    if (this.pageIndex < this.activeStation.pages.length - 1) {
      this.pageIndex += 1;
      this.renderLesson();
    } else {
      this.questionIndex = 0;
      this.attempts = 0;
      this.renderQuestion();
    }
  }

  private continueResult(): void {
    const state = this.resultState;
    if (!state) return;
    this.resultState = undefined;
    this.clearOverlay();
    if (state.correct) void this.recordAnswer(state.question, state.selected);
    else this.renderQuestion();
  }

  private handleOverlayPointer(pointer: Phaser.Input.Pointer): void {
    const x = pointer.x;
    const y = pointer.y;
    if (this.overlayMode === 'lesson') {
      if (x >= 850 && x <= 1100 && y >= 550 && y <= 615) this.advanceLesson();
      else if (x >= 935 && x <= 1095 && y >= 615 && y <= 655) this.closeOverlay();
      return;
    }
    if (this.overlayMode === 'question') {
      if (x >= 190 && x <= 1090) {
        const index = Math.round((y - 297) / 78);
        if (index >= 0 && index < 3 && Math.abs(y - (297 + index * 78)) <= 34 && this.activeStation) {
          this.answerQuestion(this.activeStation.challenges[this.questionIndex], index);
          return;
        }
      }
      if (x >= 935 && x <= 1095 && y >= 590 && y <= 635) this.closeOverlay();
      return;
    }
    if (this.overlayMode === 'result' && x >= 790 && x <= 1030 && y >= 455 && y <= 515) {
      this.continueResult();
    }
  }

  private resumeMapCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
  }

  private async enterBattle(): Promise<void> {
    this.save.stage = 'chapter1_battle';
    await saves.save(this.save);
    this.registry.set('save', this.save);
    this.scene.start('Chapter1Battle');
  }
}
