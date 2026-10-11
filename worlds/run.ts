// npm run sparta: build the world, test the agent in Sparta Worlds (3 runs), and write the scorecard
// the app shows (src/app/sparta-report.json). Needs Node 24+ and the AI Gateway env in .env.local.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { scenarios } from './scenarios';

const runs = Number(process.argv[2] ?? 3);
mkdirSync('worlds/out', { recursive: true });
execFileSync('npx', ['tsx', 'worlds/build.ts'], { stdio: 'inherit' });

const started = Date.now();
spawnSync(
  'npx',
  ['worlds', 'passk', '--server', 'auto', '--tasks', 'worlds/tasks.yaml', '--runs', String(runs),
    '--report', 'worlds/out/report.html', '--json-file', 'worlds/out/results.json',
    '--', 'npx', 'tsx', '--env-file=.env.local', 'worlds/agent.ts'],
  { stdio: 'inherit', env: { ...process.env, WORLDS_TELEMETRY: '0' } }
);

interface Finding { code: string; rule_id?: string; field?: string }
interface Task { id: string; pass: boolean; verdict: string; findings: Finding[] }
const results = JSON.parse(readFileSync('worlds/out/results.json', 'utf8')) as {
  status: string;
  results: { run: number; pass: boolean; worlds: { grade?: { tasks: Task[] } }[] }[];
};

const graded = results.results.flatMap(r => r.worlds.flatMap(w => w.grade?.tasks ?? []));
const leaks = graded.flatMap(t => t.findings).filter(f => /forbidden|leak|public_text/i.test(f.code));

const report = {
  ranAt: new Date().toISOString(),
  seconds: Math.round((Date.now() - started) / 1000),
  runs: results.results.length,
  runsPassed: results.results.filter(r => r.pass).length,
  decisions: graded.length,
  correct: graded.filter(t => t.pass).length,
  leaks: leaks.length,
  tasks: scenarios.map(s => {
    const mine = graded.filter(t => t.id === s.id);
    return { id: s.id, name: s.name, kind: s.kind, expect: s.expect, tests: s.tests, passed: mine.filter(t => t.pass).length, total: mine.length };
  })
};
writeFileSync('src/app/sparta-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(`\n${report.correct}/${report.decisions} correct calls, ${report.leaks} leaks, ${report.runsPassed}/${report.runs} clean runs → src/app/sparta-report.json`);
