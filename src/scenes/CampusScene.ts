import Phaser from 'phaser';
import type { DialogueLine, EvidenceChallenge, PrologueContent, SaveData } from '../types';
import { saves } from '../services/SaveService';
import { badge, bodyText, button, COLORS, FONT, heading, panel, progressMeter, toast } from '../ui/theme';
import { isTouchMode, TouchButton, TouchJoystick } from '../ui/touch';

type InteractionKind = 'professor' | 'xiaosou' | 'adu' | 'evidence' | 'lab';
interface InteractionPoint {
  id: string;
  kind: InteractionKind;
  x: number;
  y: number;
  node: Phaser.GameObjects.Container;
  label: string;
}

export class CampusScene extends Phaser.Scene {
  private content!: PrologueContent;
  private save!: SaveData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactions: InteractionPoint[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;
  private questMeter?: Phaser.GameObjects.Container;
  private dialogue?: Phaser.GameObjects.Container;
  private dialogueLines: DialogueLine[] = [];
  private dialogueIndex = 0;
  private archive?: Phaser.GameObjects.Container;
  private evidenceOverlay?: Phaser.GameObjects.Container;
  private activeEvidence?: { item: InteractionPoint; challenge: EvidenceChallenge; result?: boolean; correct?: boolean };
  private interactionCooldown = 0;
  private moveTarget?: Phaser.Math.Vector2;
  private minimapPlayer!: Phaser.GameObjects.Rectangle;
  private touchMode = false;
  private touchJoystick?: TouchJoystick;
  private touchAction?: TouchButton;
  private touchSprint?: TouchButton;

  constructor() {
    super('Campus');
  }

  create(): void {
    this.content = this.registry.get('content') as PrologueContent;
    this.save = this.registry.get('save') as SaveData;
    this.touchMode = isTouchMode();
    this.physics.world.setBounds(0, 0, 1800, 1000);
    this.obstacles = this.physics.add.staticGroup();
    this.drawWorldV2();
    this.createActors();
    this.createEvidence();
    this.createPlayer();
    this.createHud();
    this.createTouchControls();
    this.setupInput();
    this.setupPointerMovement();
    this.updateActorStatus();
    this.updateQuest();
    this.cameras.main.setBounds(0, 0, 1800, 1000);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.fadeIn(450, 8, 38, 48);
  }

  private drawWorldV2(): void {
    this.add.image(900, 500, 'bg-campus-v4').setDisplaySize(1800, 1000).setDepth(-100);

    const location = (x: number, y: number, zh: string, en: string): void => {
      this.add.text(x, y, `${zh}  ·  ${en}`, {
        fontFamily: FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#f8e7b7',
        stroke: '#082630',
        strokeThickness: 4,
        backgroundColor: '#082630c8',
        padding: { x: 13, y: 7 }
      }).setOrigin(0.5).setDepth(12);
    };
    location(390, 70, '田家炳教育书院', 'EDUCATION ACADEMY');
    location(1425, 70, '心理实验中心', 'PSYCHOLOGY LAB');
    location(430, 930, '景德楼方向', 'JINGDE BUILDING');
    location(1370, 930, '桃子湖', 'TAOZI LAKE');

    // 隐形碰撞区与现代教学楼主体和桃子湖水面大致对齐，台阶与步道保持可走。
    this.addObstacle(385, 170, 680, 290);
    this.addObstacle(1435, 180, 525, 270);
    this.addObstacle(310, 675, 520, 310);
    this.addObstacle(1450, 860, 650, 260);
  }

  private drawWorld(): void {
    this.add.rectangle(900, 500, 1800, 1000, 0x7fbd70);
    const grass = this.add.graphics();
    grass.fillStyle(0x8dca75, 1);
    for (let y = 0; y < 1000; y += 64) {
      for (let x = 0; x < 1800; x += 64) {
        if ((x / 64 + y / 64) % 2 === 0) grass.fillRect(x, y, 64, 64);
      }
    }
    const path = this.add.graphics();
    path.fillStyle(0xe8d5ab, 1);
    path.fillRect(70, 405, 1660, 255);
    path.fillRect(735, 55, 340, 875);
    path.lineStyle(5, 0xb99660, 0.9);
    path.strokeRect(70, 405, 1660, 255);
    path.strokeRect(735, 55, 340, 875);
    path.lineStyle(2, 0xcab180, 0.52);
    for (let x = 90; x < 1720; x += 58) path.lineBetween(x, 410, x + 28, 655);
    for (let y = 70; y < 920; y += 58) path.lineBetween(740, y, 1070, y + 26);

    this.drawBuilding(315, 218, 470, 270, '心域图书馆', 'LIBRARY', COLORS.blue);
    this.drawBuilding(1480, 220, 430, 275, '心理实验室', 'LAB', COLORS.teal);
    this.drawBuilding(330, 850, 500, 220, '新生服务站', 'STUDENT HUB', COLORS.purple);
    this.drawPond(1375, 815);
    for (let i = 0; i < 25; i += 1) {
      const x = 52 + (i * 149) % 1690;
      const y = i % 2 === 0 ? 348 : 735 + (i % 3) * 72;
      if (x > 1160 && y > 710) continue;
      this.drawTree(x, y, i % 3);
    }
    for (let i = 0; i < 38; i += 1) {
      const x = 35 + (i * 211) % 1720;
      const y = 60 + (i * 97) % 870;
      if ((y > 390 && y < 680) || (x > 710 && x < 1100)) continue;
      const color = [0xfff0a6, 0xf29587, 0xaee8dc][i % 3];
      this.add.circle(x, y, 4, color).setStrokeStyle(1, 0x487d47);
      this.add.rectangle(x, y + 6, 2, 8, 0x487d47);
    }
    const boardShadow = this.add.rectangle(1238, 535, 294, 116, COLORS.shadow, 0.25);
    const board = this.add.rectangle(1230, 526, 294, 116, 0x9f7549).setStrokeStyle(5, COLORS.ink);
    this.add.rectangle(1230, 495, 270, 42, COLORS.gold).setStrokeStyle(3, COLORS.ink);
    this.add.text(1230, 495, '新生提示板 · FIELD NOTE', {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#17343b'
    }).setOrigin(0.5);
    this.add.text(1230, 540, 'Observe first.\nClaim second.', {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#fffbed', align: 'center'
    }).setOrigin(0.5);
    boardShadow.setDepth(1); board.setDepth(2);
  }

  private drawBuilding(x: number, y: number, w: number, h: number, name: string, en: string, color: number): void {
    this.add.rectangle(x + 11, y + 14, w, h, COLORS.shadow, 0.3).setDepth(1);
    this.add.rectangle(x, y, w, h, 0xffedc7).setStrokeStyle(7, COLORS.ink).setDepth(2);
    this.add.triangle(x, y - h / 2 - 42, -w / 2 - 22, 45, w / 2 + 22, 45, 0, 0, 0x315e78)
      .setStrokeStyle(6, COLORS.ink).setDepth(3);
    this.add.rectangle(x, y - h / 2 + 39, w - 26, 66, color).setStrokeStyle(4, COLORS.ink).setDepth(3);
    this.add.text(x, y - h / 2 + 28, name, { fontFamily: FONT, fontSize: '27px', fontStyle: 'bold', color: '#fffbed' })
      .setOrigin(0.5).setDepth(4);
    this.add.text(x, y - h / 2 + 52, en, { fontFamily: FONT, fontSize: '11px', fontStyle: 'bold', color: '#d8fff6', letterSpacing: 3 })
      .setOrigin(0.5).setDepth(4);
    for (const dx of [-w * 0.31, 0, w * 0.31]) {
      this.add.rectangle(x + dx, y + 35, 62, 76, 0xaeddda).setStrokeStyle(4, COLORS.ink).setDepth(3);
      this.add.rectangle(x + dx, y + 21, 52, 8, 0xd8ffff, 0.5).setDepth(4);
    }
    this.addObstacle(x, y - 5, w, h - 15);
  }

  private drawTree(x: number, y: number, variant: number): void {
    this.add.ellipse(x + 7, y + 42, 75, 20, COLORS.shadow, 0.16).setDepth(y - 2);
    this.add.rectangle(x, y + 35, 15, 66, 0x765135).setStrokeStyle(2, 0x4d3a2d).setDepth(y);
    const dark = variant === 0 ? 0x2f824f : 0x377e53;
    this.add.circle(x - 20, y, 32, dark).setStrokeStyle(4, 0x1f6544).setDepth(y + 1);
    this.add.circle(x + 16, y - 4, 36, variant === 2 ? 0x55a65b : 0x43995a).setStrokeStyle(4, 0x1f6544).setDepth(y + 1);
    this.add.circle(x + 5, y - 17, 14, 0x91ce62, 0.8).setDepth(y + 2);
  }

  private drawPond(x: number, y: number): void {
    this.add.ellipse(x + 8, y + 10, 350, 175, COLORS.shadow, 0.25);
    this.add.ellipse(x, y, 350, 175, 0x3c91aa).setStrokeStyle(8, 0x2a6f75);
    this.add.ellipse(x, y - 8, 318, 135, 0x70c9c2, 0.75);
    for (const dx of [-105, -35, 65, 120]) this.add.ellipse(x + dx, y + (dx % 3) * 7, 36, 16, 0x4fa45d).setStrokeStyle(2, 0x28704a);
  }

  private addObstacle(x: number, y: number, width: number, height: number): void {
    const zone = this.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.physics.add.existing(zone, true);
    this.obstacles.add(zone);
  }

  private createActors(): void {
    this.addInteraction('professor', 'professor', 900, 480, '颜教授', 'char-professor', 0.62);
    this.addInteraction('xiaosou', 'xiaosou', 715, 575, '小搜', 'char-xiaosou', 0.6);
    this.addInteraction('adu', 'adu', 1080, 575, '阿读', 'char-adu', 0.6);
    const labDoor = this.add.container(1400, 390).setDepth(390);
    const glow = this.add.rectangle(0, 4, 112, 116, COLORS.teal, 0.12).setStrokeStyle(3, COLORS.teal, 0.65);
    const door = this.add.rectangle(0, 0, 86, 103, 0x315e78).setStrokeStyle(5, COLORS.ink);
    const split = this.add.rectangle(0, 0, 4, 92, COLORS.ink, 0.8);
    const lights = this.add.circle(29, 4, 5, this.save.collectedEvidence.length === 3 ? 0x8ff09a : COLORS.coral);
    const sign = this.add.text(0, -76, '摸底入口 · CHECK-IN', {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#fffbed', backgroundColor: '#17645f', padding: { x: 12, y: 6 }
    }).setOrigin(0.5);
    const lock = this.add.text(0, 3, this.save.collectedEvidence.length === 3 ? 'OPEN' : 'LOCKED', {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#f4ca69'
    }).setOrigin(0.5).setName('lock-label');
    labDoor.add([glow, door, split, lights, sign, lock]);
    this.interactions.push({ id: 'lab', kind: 'lab', x: 1400, y: 390, node: labDoor, label: '进入心理实验室' });
  }

  private addInteraction(id: string, kind: InteractionKind, x: number, y: number, name: string, texture: string, scale: number): void {
    const c = this.add.container(x, y).setDepth(y);
    const glow = this.add.ellipse(0, 25, 70, 28, COLORS.cream, 0.24).setName('glow');
    const sprite = this.add.sprite(0, 0, texture).setScale(scale);
    const label = this.add.text(0, 58, name, {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#f8e7b7',
      backgroundColor: '#082630d9', padding: { x: 9, y: 4 }
    }).setOrigin(0.5);
    const icon = this.add.text(0, -57, '!', {
      fontFamily: FONT, fontSize: '21px', fontStyle: 'bold', color: '#fffbed', backgroundColor: '#e6a52f', padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setName('status-icon');
    c.add([glow, sprite, label, icon]);
    this.tweens.add({ targets: [icon, glow], y: '-=7', alpha: { from: 0.65, to: 1 }, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.interactions.push({ id, kind, x, y, node: c, label: `与${name}交谈` });
  }

  private createEvidence(): void {
    const items = [
      { id: 'behavior', x: 560, y: 430, title: 'Behavior', color: COLORS.coral },
      { id: 'mental_process', x: 1065, y: 725, title: 'Mental process', color: COLORS.purple },
      { id: 'scientific_method', x: 1265, y: 430, title: 'Scientific method', color: COLORS.blue }
    ];
    items.forEach((item) => {
      if (this.save.collectedEvidence.includes(item.id)) return;
      const c = this.add.container(item.x, item.y).setDepth(item.y);
      const outer = this.add.circle(0, 0, 37, item.color, 0.15).setStrokeStyle(3, item.color, 0.75);
      const glow = this.add.circle(0, 0, 28, 0xbaffed, 0.3);
      const shadow = this.add.rectangle(4, 6, 52, 62, COLORS.shadow, 0.3);
      const card = this.add.rectangle(0, 0, 52, 62, COLORS.paper).setStrokeStyle(3, COLORS.ink);
      const band = this.add.rectangle(0, -21, 43, 10, item.color);
      const mark = this.add.text(0, 5, 'Aa', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#17343b' }).setOrigin(0.5);
      const title = this.add.text(0, 53, item.title, {
        fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#17343b', backgroundColor: '#fff4d6', padding: { x: 7, y: 3 }
      }).setOrigin(0.5);
      c.add([outer, glow, shadow, card, band, mark, title]);
      this.tweens.add({ targets: [outer, glow], scale: { from: 0.9, to: 1.18 }, alpha: { from: 0.2, to: 0.55 }, duration: 900, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: [shadow, card, band, mark], y: -6, duration: 780, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.interactions.push({ id: item.id, kind: 'evidence', x: item.x, y: item.y, node: c, label: `调查 ${item.title}` });
    });
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(900, 660, 'char-axin').setScale(0.6).setDepth(660);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(38, 32).setOffset(33, 116);
    this.physics.add.collider(this.player, this.obstacles);
  }

  private createHud(): void {
    const hud = panel(this, 22, 20, 480, 126, COLORS.inkDeep, 0.95, 1100).setScrollFactor(0);
    (hud.list[2] as Phaser.GameObjects.GameObject & { setVisible: (visible: boolean) => unknown }).setVisible(false);
    this.add.text(48, 38, 'CHAPTER 00 / 序幕', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#79ded0', letterSpacing: 2 })
      .setScrollFactor(0).setDepth(1101);
    this.add.text(48, 63, '心理学真的会读心吗？', { fontFamily: FONT, fontSize: '23px', fontStyle: 'bold', color: '#f4ca69' })
      .setScrollFactor(0).setDepth(1101);
    this.questText = this.add.text(48, 99, '', { fontFamily: FONT, fontSize: '17px', color: '#fffbed', wordWrap: { width: 420 } })
      .setScrollFactor(0).setDepth(1101);
    const map = panel(this, 1028, 20, 230, 126, COLORS.inkDeep, 0.95, 1100).setScrollFactor(0);
    (map.list[2] as Phaser.GameObjects.GameObject & { setVisible: (visible: boolean) => unknown }).setVisible(false);
    this.add.text(1048, 34, 'CAMPUS MAP', { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#79ded0', letterSpacing: 2 })
      .setScrollFactor(0).setDepth(1101);
    this.add.rectangle(1142, 94, 172, 66, 0x7fbd70).setStrokeStyle(2, COLORS.cream, 0.8).setScrollFactor(0).setDepth(1101);
    this.add.rectangle(1142, 94, 20, 64, 0xe8d5ab).setScrollFactor(0).setDepth(1102);
    this.add.rectangle(1142, 94, 170, 16, 0xe8d5ab).setScrollFactor(0).setDepth(1102);
    this.add.rectangle(1080, 67, 28, 18, COLORS.blue).setScrollFactor(0).setDepth(1103);
    this.add.rectangle(1206, 67, 27, 18, COLORS.teal).setScrollFactor(0).setDepth(1103);
    this.minimapPlayer = this.add.rectangle(1142, 102, 7, 7, COLORS.coral).setStrokeStyle(1, COLORS.white).setScrollFactor(0).setDepth(1104);
    this.prompt = this.add.text(640, 656, '', {
      fontFamily: FONT, fontSize: '21px', fontStyle: 'bold', color: '#17343b', backgroundColor: '#fff4d6', padding: { x: 18, y: 10 }, stroke: '#ffffff', strokeThickness: 1
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1112).setVisible(false);
    button(this, 910, 57, 190, 48, '学习档案  Tab', COLORS.blue, () => this.toggleArchive(), { depth: 1105, fontSize: 17, icon: '▤' })
      .setScrollFactor(0, 0, true);
    this.add.text(24, 686, this.touchMode ? '拖动摇杆 / 点击地面移动　右侧按钮互动' : 'WASD / 点击移动   Shift冲刺   F互动', {
      fontFamily: FONT, fontSize: '15px', color: '#fffbed', backgroundColor: '#082630dd', padding: { x: 11, y: 6 }
    }).setScrollFactor(0).setDepth(1110);
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,F,ENTER,SHIFT,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-F', () => this.handleActionKey());
    this.input.keyboard!.on('keydown-ENTER', () => this.handleActionKey());
    this.input.keyboard!.on('keydown-TAB', () => { if (!this.dialogue && !this.evidenceOverlay) this.toggleArchive(); });
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.archive) this.toggleArchive();
      else if (this.evidenceOverlay) {
        this.evidenceOverlay.destroy(true);
        this.evidenceOverlay = undefined;
        this.activeEvidence = undefined;
      }
    });
  }

  private createTouchControls(): void {
    if (!this.touchMode) return;
    this.touchJoystick = new TouchJoystick(this, 102, 590, 66);
    this.touchSprint = new TouchButton(this, 238, 620, 43, '冲刺', COLORS.blue);
    this.touchAction = new TouchButton(this, 1170, 607, 58, '互动', COLORS.coral, () => this.handleActionKey());
  }

  private updateTouchControls(): void {
    if (!this.touchMode) return;
    const movementAvailable = !this.dialogue && !this.archive && !this.evidenceOverlay;
    this.touchJoystick?.setVisible(movementAvailable);
    this.touchSprint?.setVisible(movementAvailable);
    this.touchAction?.setVisible(!this.archive && !this.evidenceOverlay);
    if (this.dialogue) this.touchAction?.setLabel('继续');
    else this.touchAction?.setLabel(this.nearestInteraction() ? '互动' : '操作');
  }

  private setupPointerMovement(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.touchJoystick?.owns(pointer) || this.touchSprint?.owns(pointer) || this.touchAction?.owns(pointer)) return;
      if (this.evidenceOverlay && this.activeEvidence) {
        if (!this.activeEvidence.result && pointer.x >= 215 && pointer.x <= 1065) {
          const selected = Math.round((pointer.y - 408) / 65);
          if (selected >= 0 && selected < this.activeEvidence.challenge.options.length
            && Math.abs(pointer.y - (408 + selected * 65)) <= 28) {
            this.resolveEvidence(this.activeEvidence.item, this.activeEvidence.challenge, selected);
          }
        } else if (this.activeEvidence.result && pointer.x >= 785 && pointer.x <= 1015
          && pointer.y >= 445 && pointer.y <= 505) {
          this.finishEvidenceResult();
        }
        return;
      }
      const overHud = pointer.y < 150 || pointer.y > 665;
      if (this.dialogue || this.archive || this.evidenceOverlay || overHud) return;
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.moveTarget = new Phaser.Math.Vector2(world.x, world.y);
    });
  }

  update(): void {
    if (!this.player || !this.keys) return;
    this.updateTouchControls();
    if (this.dialogue || this.archive || this.evidenceOverlay) { this.player.setVelocity(0); return; }
    const keyX = Number(this.keys.D.isDown || this.cursors.right.isDown) - Number(this.keys.A.isDown || this.cursors.left.isDown);
    const keyY = Number(this.keys.S.isDown || this.cursors.down.isDown) - Number(this.keys.W.isDown || this.cursors.up.isDown);
    const touchVector = this.touchJoystick?.vector;
    const usingJoystick = Boolean(touchVector && touchVector.lengthSq() > 0);
    const dx = usingJoystick ? touchVector!.x : keyX;
    const dy = usingJoystick ? touchVector!.y : keyY;
    const speed = this.keys.SHIFT.isDown || this.touchSprint?.isDown ? 265 : 172;
    const velocity = new Phaser.Math.Vector2(dx, dy).normalize().scale(speed);
    if (dx !== 0 || dy !== 0) {
      this.moveTarget = undefined;
      this.player.setVelocity(velocity.x, velocity.y);
    } else if (this.moveTarget) {
      const toward = this.moveTarget.clone().subtract(this.player.getCenter());
      if (toward.length() < 12) { this.player.setVelocity(0); this.moveTarget = undefined; }
      else { toward.normalize().scale(172); this.player.setVelocity(toward.x, toward.y); if (toward.x !== 0) this.player.setFlipX(toward.x < 0); }
    } else this.player.setVelocity(0);
    if (dx !== 0) this.player.setFlipX(dx < 0);
    this.player.setDepth(Math.round(this.player.y));
    const moving = this.player.body instanceof Phaser.Physics.Arcade.Body && this.player.body.speed > 1;
    this.player.setAngle(moving ? Math.sin(this.time.now * 0.018) * 1.8 : 0);
    this.minimapPlayer.setPosition(1057 + (this.player.x / 1800) * 170, 62 + (this.player.y / 1000) * 64);
    const nearest = this.nearestInteraction();
    this.prompt.setVisible(Boolean(nearest));
    if (nearest) this.prompt.setText(this.touchMode ? `互动　${nearest.label}` : `F　${nearest.label}`);
  }

  private handleActionKey(): void {
    const now = this.time.now;
    if (now < this.interactionCooldown) return;
    this.interactionCooldown = now + 180;
    if (this.dialogue) { this.advanceDialogue(); return; }
    if (this.archive || this.evidenceOverlay) return;
    const nearest = this.nearestInteraction();
    if (nearest) this.interact(nearest);
  }

  private nearestInteraction(): InteractionPoint | undefined {
    return this.interactions.map((item) => ({ item, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) }))
      .filter(({ distance }) => distance < 96).sort((a, b) => a.distance - b.distance)[0]?.item;
  }

  private interact(item: InteractionPoint): void {
    if (item.kind === 'professor') {
      const key = this.save.talkedToProfessor ? 'professorAgain' : 'professorFirst';
      if (!this.save.talkedToProfessor) {
        this.save.talkedToProfessor = true;
        this.unlockTerm('psychology');
        void saves.save(this.save);
        toast(this, '任务已更新', '去认识小搜与阿读，组建取证小队。', COLORS.gold);
        this.updateActorStatus(); this.updateQuest();
      }
      this.showDialogue(this.content.dialogues[key]);
    } else if (item.kind === 'xiaosou' || item.kind === 'adu') {
      if (!this.save.talkedToProfessor) {
        this.showDialogue([{ speaker: item.kind === 'xiaosou' ? '小搜' : '阿读', text: '颜教授正在中央广场等你。先领取今天的任务吧。' }]);
        return;
      }
      if (!this.save.talkedToAllies.includes(item.kind)) {
        this.save.talkedToAllies.push(item.kind);
        void saves.save(this.save);
        toast(this, '伙伴加入', `${item.kind === 'xiaosou' ? '小搜' : '阿读'}加入了取证小队。`, COLORS.teal);
        this.updateActorStatus(); this.updateQuest();
      }
      this.showDialogue(this.content.dialogues[item.kind]);
    } else if (item.kind === 'evidence') {
      if (!this.save.talkedToProfessor || this.save.talkedToAllies.length < 2) {
        this.showDialogue([{ speaker: '阿心', text: '这条线索需要完整的取证小队。先与颜教授、小搜和阿读谈谈。' }]);
        return;
      }
      this.showEvidenceChallenge(item);
    } else if (item.kind === 'lab') {
      if (this.save.collectedEvidence.length < 3) this.showDialogue([{ speaker: '实验室门禁', text: `ACCESS DENIED：还缺 ${3 - this.save.collectedEvidence.length} 条科学证据。调查校园中的发光卡片。` }]);
      else void this.enterDiagnostic();
    }
  }

  private showEvidenceChallenge(item: InteractionPoint): void {
    const challenge = this.content.evidenceChallenges.find((c) => c.id === item.id);
    if (!challenge) { this.collectEvidence(item); return; }
    this.evidenceOverlay = panel(this, 150, 78, 980, 585, COLORS.paper, 1, 1200).setScrollFactor(0);
    this.activeEvidence = { item, challenge };
    this.evidenceOverlay.add(heading(this, 50, 30, `现场取证 · ${challenge.title}`, 32));
    this.evidenceOverlay.add(badge(this, 815, 54, challenge.location, COLORS.blue, 1202));
    const noteBg = this.add.rectangle(50, 98, 880, 96, 0xe9f4ee).setOrigin(0).setStrokeStyle(2, COLORS.teal, 0.7);
    const noteLabel = this.add.text(70, 111, 'OBSERVATION / 现场记录', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#248b84', letterSpacing: 1 });
    const note = bodyText(this, 70, 140, challenge.observation, 820, 19);
    const prompt = bodyText(this, 52, 218, challenge.prompt, 875, 23);
    this.evidenceOverlay.add([noteBg, noteLabel, note, prompt]);
    challenge.options.forEach((option, i) => {
      const choice = button(this, 490, 330 + i * 65, 840, 49, `${String.fromCharCode(65 + i)}. ${option}`,
        i % 2 ? COLORS.teal : COLORS.blue, () => this.resolveEvidence(item, challenge, i), { depth: 1202, fontSize: 17 });
      choice.setScrollFactor(0, 0, true);
      this.evidenceOverlay!.add(choice);
    });
    this.evidenceOverlay.add(this.add.text(900, 548, 'Esc 返回', { fontFamily: FONT, fontSize: '14px', color: '#73969a' }).setOrigin(1, 0));
  }

  private resolveEvidence(item: InteractionPoint, challenge: EvidenceChallenge, selected: number): void {
    this.save.evidenceAttempts += 1;
    void saves.save(this.save);
    const correct = selected === challenge.answer;
    this.evidenceOverlay?.destroy(true);
    this.evidenceOverlay = panel(this, 225, 190, 830, 340, correct ? 0xe8f7e9 : 0xffefdf, 1, 1205).setScrollFactor(0);
    this.activeEvidence = { item, challenge, result: true, correct };
    this.evidenceOverlay.add(heading(this, 46, 35, correct ? '证据连接成功' : '先把观察与推断分开', 31, correct ? '#287b49' : '#b5543c'));
    this.evidenceOverlay.add(bodyText(this, 48, 103, correct ? challenge.success : `${challenge.hint}\n\n本次不扣分，可以重新判断。`, 735, 21));
    const action = button(this, 675, 285, 220, 50, correct ? '收入档案' : '重新观察', correct ? COLORS.green : COLORS.coral,
      () => this.finishEvidenceResult(), { depth: 1207, fontSize: 19 });
    action.setScrollFactor(0, 0, true);
    this.evidenceOverlay.add(action);
  }

  private finishEvidenceResult(): void {
    if (!this.activeEvidence?.result) return;
    const { item, challenge, correct } = this.activeEvidence;
    this.evidenceOverlay?.destroy(true);
    this.evidenceOverlay = undefined;
    this.activeEvidence = undefined;
    if (correct) this.collectEvidence(item);
    else this.showEvidenceChallenge(item);
  }

  private collectEvidence(item: InteractionPoint): void {
    if (!this.save.collectedEvidence.includes(item.id)) this.save.collectedEvidence.push(item.id);
    this.unlockTerm(item.id);
    item.node.destroy(true);
    this.interactions = this.interactions.filter((i) => i !== item);
    void saves.save(this.save);
    this.updateQuest();
    const term = this.content.terms.find((t) => t.id === item.id)!;
    toast(this, `术语获得 ${this.save.collectedEvidence.length}/3`, `${term.en} — ${term.zh}`, COLORS.green);
    this.showDialogue([{ speaker: '学习档案', text: `${term.en} — ${term.zh}\n${term.note}` }, { speaker: '阿心', text: '现场信息已经转化为可以解释概念的证据。' }]);
  }

  private unlockTerm(id: string): void {
    if (!this.save.unlockedTerms.includes(id)) this.save.unlockedTerms.push(id);
  }

  private updateActorStatus(): void {
    this.interactions.filter((i) => ['professor', 'xiaosou', 'adu'].includes(i.kind)).forEach((item) => {
      const done = item.kind === 'professor' ? this.save.talkedToProfessor : this.save.talkedToAllies.includes(item.kind);
      const icon = item.node.getByName('status-icon') as Phaser.GameObjects.Text | null;
      if (icon && done) { icon.setText('✓'); icon.setBackgroundColor('#52a568'); }
    });
  }

  private updateQuest(): void {
    this.questMeter?.destroy(true);
    let value = 0;
    if (!this.save.talkedToProfessor) this.questText.setText('主线：前往中央广场，与颜教授交谈');
    else if (this.save.talkedToAllies.length < 2) {
      value = this.save.talkedToAllies.length;
      this.questText.setText(`主线：组建取证小队 ${value}/2`);
      this.questMeter = progressMeter(this, 310, 112, 165, value, 2, COLORS.gold, 1102).setScrollFactor(0);
    } else if (this.save.collectedEvidence.length < 3) {
      value = this.save.collectedEvidence.length;
      this.questText.setText(`主线：完成现场取证 ${value}/3`);
      this.questMeter = progressMeter(this, 310, 112, 165, value, 3, COLORS.green, 1102).setScrollFactor(0);
    } else {
      this.questText.setText('主线：进入右上方心理实验室');
      const lab = this.interactions.find((i) => i.kind === 'lab');
      (lab?.node.getByName('lock-label') as Phaser.GameObjects.Text | null)?.setText('OPEN');
      const light = lab?.node.list[3] as Phaser.GameObjects.Arc | undefined;
      light?.setFillStyle(0x8ff09a);
    }
  }

  private showDialogue(lines: DialogueLine[]): void {
    this.dialogueLines = lines; this.dialogueIndex = 0; this.renderDialogue();
  }

  private renderDialogue(): void {
    this.dialogue?.destroy(true);
    const line = this.dialogueLines[this.dialogueIndex];
    this.dialogue = panel(this, 72, 486, 1136, 190, COLORS.paper, 1, 1250).setScrollFactor(0);
    const portraitKey: Record<string, string> = { '颜教授': 'char-professor', '阿心': 'char-axin', '小搜': 'char-xiaosou', '阿读': 'char-adu' };
    const portrait = portraitKey[line.speaker]
      ? this.add.sprite(74, 92, portraitKey[line.speaker]).setScale(0.72)
      : this.add.text(74, 91, 'Aa', { fontFamily: FONT, fontSize: '33px', fontStyle: 'bold', color: '#248b84' }).setOrigin(0.5);
    const divider = this.add.rectangle(137, 94, 3, 130, COLORS.gold, 0.8);
    const speaker = this.add.text(166, 24, line.speaker, { fontFamily: FONT, fontSize: '23px', fontStyle: 'bold', color: '#e86c5d' });
    const text = bodyText(this, 166, 64, line.text, 890, 22);
    const hint = this.add.text(1068, 148, this.touchMode
      ? `${this.dialogueIndex + 1}/${this.dialogueLines.length}   触碰“继续” ▶`
      : `${this.dialogueIndex + 1}/${this.dialogueLines.length}   F / Enter ▶`, {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#248b84'
    }).setOrigin(1, 0.5);
    this.dialogue.add([portrait, divider, speaker, text, hint]);
  }

  private advanceDialogue(): void {
    if (this.dialogueIndex < this.dialogueLines.length - 1) { this.dialogueIndex += 1; this.renderDialogue(); return; }
    this.dialogue?.destroy(true); this.dialogue = undefined;
  }

  private toggleArchive(): void {
    if (this.archive) { this.archive.destroy(true); this.archive = undefined; return; }
    this.archive = panel(this, 155, 62, 970, 610, COLORS.paper, 1, 1300).setScrollFactor(0);
    this.archive.add(heading(this, 46, 28, '学习档案 · FIELD GUIDE', 32));
    this.archive.add(badge(this, 820, 50, `${this.save.unlockedTerms.length}/5 TERMS`, COLORS.teal, 1302));
    const terms = this.content.terms.filter((t) => this.save.unlockedTerms.includes(t.id));
    const text = terms.length ? terms.map((t, i) => `${i + 1}. ${t.en}  /  ${t.zh}\n${t.note}`).join('\n\n') : '目前还没有术语。先去中央广场与颜教授交谈。';
    this.archive.add(bodyText(this, 50, 96, text, 855, 19));
    this.archive.add(this.add.text(50, 540, '课程来源：教材第1章 · Psychology as a Science', { fontFamily: FONT, fontSize: '14px', color: '#73969a' }));
    const close = button(this, 835, 552, 170, 44, '关闭 Esc', COLORS.coral, () => this.toggleArchive(), { depth: 1302, fontSize: 17 });
    close.setScrollFactor(0, 0, true);
    this.archive.add(close);
  }

  private async enterDiagnostic(): Promise<void> {
    this.cameras.main.fadeOut(350, 8, 38, 48);
    await new Promise((resolve) => this.time.delayedCall(360, resolve));
    this.save.stage = 'diagnostic';
    await saves.save(this.save);
    this.registry.set('save', this.save);
    this.scene.start('Diagnostic');
  }
}
