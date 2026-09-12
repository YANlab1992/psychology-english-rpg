import Phaser from 'phaser';
import type { Chapter1Content, PrologueContent } from '../types';
import { saves } from '../services/SaveService';
import { makePixelCharacterTexture, makeQCharacterTextures, COLORS } from '../ui/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.json('prologue-content', './content/prologue.json');
    this.load.json('chapter1-content', './content/chapter1.json');
    this.load.image('bg-menu-v2', './assets/art/menu-keyart-v2.png');
    this.load.image('bg-campus-v2', './assets/art/campus-map-v2.png');
    this.load.image('bg-battle-v2', './assets/art/evidence-hall-v2.png');
    this.load.image('bg-campus-v3', './assets/art/campus-map-v3.png');
    this.load.image('bg-battle-v3', './assets/art/evidence-hall-v3.png');
    this.load.image('bg-campus-v4', './assets/art/campus-map-v4.png');
    this.load.image('bg-battle-v4', './assets/art/evidence-hall-v4.png');
    this.load.image('character-lineup-v3', './assets/art/character-lineup-v3.png');
  }

  async create(): Promise<void> {
    makeQCharacterTextures(this, 'character-lineup-v3', ['char-axin', 'char-xiaosou', 'char-adu', 'char-professor']);
    // 只有在外部图片加载失败时才启用代码绘制的轻量备用角色。
    makePixelCharacterTexture(this, 'char-axin', COLORS.coral, 0x5b382e, 'none');
    makePixelCharacterTexture(this, 'char-xiaosou', COLORS.teal, 0x26343d, 'glass');
    makePixelCharacterTexture(this, 'char-adu', COLORS.blue, 0x4b3327, 'paper');
    makePixelCharacterTexture(this, 'char-professor', 0x6b5547, 0xe8e3d9, 'book');

    const content = this.cache.json.get('prologue-content') as PrologueContent;
    const chapter1 = this.cache.json.get('chapter1-content') as Chapter1Content;
    const save = await saves.load();
    this.registry.set('content', content);
    this.registry.set('chapter1-content', chapter1);
    this.registry.set('save', save);
    document.body.classList.add('game-ready');
    const localPreview = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
    const preview = localPreview ? new URLSearchParams(window.location.search).get('scene') : null;
    const previewScenes = new Set([
      'Menu', 'Intro', 'Campus', 'Diagnostic', 'Battle', 'Ending',
      'Chapter1Intro', 'Chapter1Hub', 'Chapter1Battle', 'Chapter1Ending'
    ]);
    this.scene.start(preview && previewScenes.has(preview) ? preview : 'Menu');
  }
}
