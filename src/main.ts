import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { IntroScene } from './scenes/IntroScene';
import { CampusScene } from './scenes/CampusScene';
import { DiagnosticScene } from './scenes/DiagnosticScene';
import { BattleScene } from './scenes/BattleScene';
import { EndingScene } from './scenes/EndingScene';
import { Chapter1IntroScene } from './scenes/Chapter1IntroScene';
import { Chapter1HubScene } from './scenes/Chapter1HubScene';
import { Chapter1BattleScene } from './scenes/Chapter1BattleScene';
import { Chapter1EndingScene } from './scenes/Chapter1EndingScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#082630',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    activePointers: 3
  },
  scene: [
    BootScene, MenuScene, IntroScene, CampusScene, DiagnosticScene, BattleScene, EndingScene,
    Chapter1IntroScene, Chapter1HubScene, Chapter1BattleScene, Chapter1EndingScene
  ]
};

new Phaser.Game(config);
