const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '../src/renderer/App.vue');
const s = fs.readFileSync(p);
console.log('encoding: Buffer length', s.length);
const str = s.toString('utf8');
const lines = str.split(/\r?\n/);
for (let i = 0; i < Math.min(lines.length, 20); i++) {
  console.log((i+1).toString().padStart(3, ' ')+':', lines[i]);
}
const lineIndex = 5 - 1;
const line = lines[lineIndex] || '';
console.log('\nLine 5 raw char codes:');
for (let i = 0; i < line.length; i++) {
  process.stdout.write((line.charCodeAt(i)).toString() + ' ');
}
console.log('\n\nContext with visible markers:');
console.log(line.split('').map(c => (c.charCodeAt(0)>127?`[${c.charCodeAt(0)}]`:c)).join(''));
