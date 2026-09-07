import Phaser from 'phaser';
import { COLORS, FONT } from './theme';

export function isTouchMode(): boolean {
  const forced = new URLSearchParams(window.location.search).get('touch');
  if (forced === '1') return true;
  if (forced === '0') return false;
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}

export class TouchJoystick {
  readonly root: Phaser.GameObjects.Container;
  readonly vector = new Phaser.Math.Vector2();
  private readonly knob: Phaser.GameObjects.Arc;
  private activePointer?: number;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    readonly radius = 68,
    depth = 1600
  ) {
    const shadow = scene.add.circle(5, 7, radius + 6, COLORS.shadow, 0.36);
    const base = scene.add.circle(0, 0, radius, COLORS.inkDeep, 0.72)
      .setStrokeStyle(4, COLORS.cream, 0.82);
    const guide = scene.add.circle(0, 0, radius * 0.58, COLORS.teal, 0.12)
      .setStrokeStyle(2, COLORS.teal, 0.8);
    this.knob = scene.add.circle(0, 0, radius * 0.34, COLORS.teal, 0.96)
      .setStrokeStyle(3, COLORS.cream, 0.95);
    const arrows = scene.add.text(0, 0, '＋', {
      fontFamily: FONT, fontSize: `${Math.round(radius * 0.6)}px`, fontStyle: 'bold', color: '#fffbed'
    }).setOrigin(0.5).setAlpha(0.9);
    this.root = scene.add.container(x, y, [shadow, base, guide, this.knob, arrows])
      .setScrollFactor(0, 0, true).setDepth(depth);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  owns(pointer: Phaser.Input.Pointer): boolean {
    return this.activePointer === pointer.id || this.contains(pointer.x, pointer.y);
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible);
    if (!visible) this.reset();
  }

  private contains(px: number, py: number): boolean {
    return this.root.visible && Phaser.Math.Distance.Between(px, py, this.x, this.y) <= this.radius * 1.22;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointer !== undefined || !this.contains(pointer.x, pointer.y)) return;
    this.activePointer = pointer.id;
    this.updateVector(pointer);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (this.activePointer === pointer.id) this.updateVector(pointer);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (this.activePointer === pointer.id) this.reset();
  }

  private updateVector(pointer: Phaser.Input.Pointer): void {
    this.vector.set(pointer.x - this.x, pointer.y - this.y);
    const length = this.vector.length();
    if (length > this.radius) this.vector.scale(this.radius / length);
    this.knob.setPosition(this.vector.x * 0.68, this.vector.y * 0.68);
    this.vector.scale(1 / this.radius);
    if (this.vector.length() < 0.12) this.vector.set(0, 0);
  }

  private reset(): void {
    this.activePointer = undefined;
    this.vector.set(0, 0);
    this.knob.setPosition(0, 0);
  }

  private destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointermove', this.onMove, this);
    this.scene.input.off('pointerup', this.onUp, this);
  }
}

export class TouchButton {
  readonly root: Phaser.GameObjects.Container;
  isDown = false;
  private activePointer?: number;
  private readonly label: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    readonly radius: number,
    text: string,
    fill: number,
    private readonly onTap?: () => void,
    depth = 1600
  ) {
    const shadow = scene.add.circle(5, 7, radius + 5, COLORS.shadow, 0.4);
    const rim = scene.add.circle(0, 0, radius + 3, COLORS.inkDeep, 0.96)
      .setStrokeStyle(2, COLORS.gold, 0.9);
    const body = scene.add.circle(0, 0, radius, fill, 0.97)
      .setStrokeStyle(3, COLORS.cream, 0.9);
    const shine = scene.add.ellipse(0, -radius * 0.45, radius * 1.2, 5, COLORS.white, 0.3);
    this.label = scene.add.text(0, 0, text, {
      fontFamily: FONT, fontSize: `${Math.max(16, Math.round(radius * 0.43))}px`, fontStyle: 'bold',
      color: '#fffbed', stroke: '#17343b', strokeThickness: 3, align: 'center'
    }).setOrigin(0.5);
    this.root = scene.add.container(x, y, [shadow, rim, body, shine, this.label])
      .setScrollFactor(0, 0, true).setDepth(depth);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  owns(pointer: Phaser.Input.Pointer): boolean {
    return this.activePointer === pointer.id || this.contains(pointer.x, pointer.y);
  }

  setLabel(text: string): void {
    this.label.setText(text);
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible);
    if (!visible) this.release();
  }

  private contains(px: number, py: number): boolean {
    return this.root.visible && Phaser.Math.Distance.Between(px, py, this.x, this.y) <= this.radius * 1.2;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointer !== undefined || !this.contains(pointer.x, pointer.y)) return;
    this.activePointer = pointer.id;
    this.isDown = true;
    this.root.setScale(0.94);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (this.activePointer !== pointer.id) return;
    const tapped = this.contains(pointer.x, pointer.y);
    this.release();
    if (tapped) this.onTap?.();
  }

  private release(): void {
    this.activePointer = undefined;
    this.isDown = false;
    this.root.setScale(1);
  }

  private destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointerup', this.onUp, this);
  }
}
