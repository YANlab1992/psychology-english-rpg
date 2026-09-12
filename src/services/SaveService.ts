import type { Chapter1Save, SaveData } from '../types';

const DB_NAME = 'psychology-english-rpg';
const STORE_NAME = 'saves';
const SAVE_KEY = 'prologue';
const FALLBACK_KEY = 'psy-rpg-prologue-save';

function freshChapter1(): Chapter1Save {
  return {
    completedStations: [],
    unlockedTerms: [],
    answers: [],
    battleSkillsUsed: [],
    focusHits: 0
  };
}

function freshSave(): SaveData {
  return {
    version: 3,
    stage: 'intro',
    talkedToProfessor: false,
    talkedToAllies: [],
    collectedEvidence: [],
    unlockedTerms: [],
    diagnostic: [],
    battleSkillsUsed: [],
    focusHits: 0,
    evidenceAttempts: 0,
    chapter1: freshChapter1(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeSave(value?: Partial<SaveData>): SaveData {
  const base = freshSave();
  if (!value) return base;
  const migrated: SaveData = {
    ...base,
    ...value,
    version: 3,
    talkedToAllies: Array.isArray(value.talkedToAllies) ? value.talkedToAllies : [],
    collectedEvidence: Array.isArray(value.collectedEvidence) ? value.collectedEvidence : [],
    unlockedTerms: Array.isArray(value.unlockedTerms) ? value.unlockedTerms : [],
    diagnostic: Array.isArray(value.diagnostic) ? value.diagnostic : [],
    battleSkillsUsed: Array.isArray(value.battleSkillsUsed) ? value.battleSkillsUsed : [],
    evidenceAttempts: value.evidenceAttempts ?? 0,
    chapter1: {
      ...freshChapter1(),
      ...(value.chapter1 ?? {}),
      completedStations: Array.isArray(value.chapter1?.completedStations) ? value.chapter1.completedStations : [],
      unlockedTerms: Array.isArray(value.chapter1?.unlockedTerms) ? value.chapter1.unlockedTerms : [],
      answers: Array.isArray(value.chapter1?.answers) ? value.chapter1.answers : [],
      battleSkillsUsed: Array.isArray(value.chapter1?.battleSkillsUsed) ? value.chapter1.battleSkillsUsed : [],
      focusHits: value.chapter1?.focusHits ?? 0
    }
  };
  // 兼容序幕原型存档：已经取证的玩家视为完成伙伴教程。
  if (migrated.collectedEvidence.length > 0 && migrated.talkedToAllies.length === 0) {
    migrated.talkedToAllies = ['xiaosou', 'adu'];
  }
  return migrated;
}

class SaveService {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  async load(): Promise<SaveData> {
    try {
      const db = await this.open();
      const value = await new Promise<SaveData | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(SAVE_KEY);
        request.onsuccess = () => resolve(request.result as SaveData | undefined);
        request.onerror = () => reject(request.error);
      });
      return normalizeSave(value);
    } catch {
      const raw = localStorage.getItem(FALLBACK_KEY);
      return raw ? normalizeSave(JSON.parse(raw) as Partial<SaveData>) : freshSave();
    }
  }

  async save(data: SaveData): Promise<void> {
    data.updatedAt = new Date().toISOString();
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(data, SAVE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(data));
    }
  }

  async reset(): Promise<SaveData> {
    const data = freshSave();
    await this.save(data);
    return data;
  }

  async startChapter1(current?: SaveData): Promise<SaveData> {
    const data = current ? normalizeSave(current) : await this.load();
    data.stage = 'chapter1_intro';
    data.chapter1 = freshChapter1();
    await this.save(data);
    return data;
  }

  export(data: SaveData): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `心理学英语大冒险-学习报告-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const saves = new SaveService();
