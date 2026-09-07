import { readFileSync } from 'node:fs';

const content = JSON.parse(readFileSync(new URL('../public/content/prologue.json', import.meta.url), 'utf8'));
const groups = [
  ...content.diagnostic.map((item) => ({ section: 'diagnostic', ...item })),
  ...content.evidenceChallenges.map((item) => ({ section: 'evidence', ...item })),
  ...content.battleSkills.map((item) => ({ section: 'battle', ...item }))
];

const countWords = (text) => (text.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) ?? []).length;
const failures = [];

for (const group of groups) {
  const counts = group.options.map(countWords);
  const minimum = Math.min(...counts);
  const maximum = Math.max(...counts);
  const correctCount = counts[group.answer];
  const uniqueLongest = correctCount === maximum && counts.filter((count) => count === maximum).length === 1;
  const label = `${group.section}:${group.id}`;
  console.log(`${label.padEnd(28)} words=[${counts.join(', ')}] answer=${group.answer + 1}`);
  if (maximum - minimum > 1) failures.push(`${label}: option word-count spread is ${maximum - minimum}`);
  if (uniqueLongest) failures.push(`${label}: the correct option is uniquely longest`);
}

if (failures.length) {
  console.error(`\nOption-length audit failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`\nOption-length audit passed for ${groups.length} question groups.`);
