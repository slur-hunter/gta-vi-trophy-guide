// GTA VI Trophy Guide — the entry program (Node 22, standard library only).
//
// What it does: it hands the guide in. It copies this repository's app/ and
// screenshots/ into the output directory and writes dossier.json there with
// the kit's vendored library, vendor/makefun-frontend.ts, which must stay
// exactly as the kit ships it: the scorer rebuilds the dossier with its own
// copy and compares the two byte for byte.
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader's container MAKEFUN_OUTPUT_DIR is unset, so /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

// The caps are the scorer's own (reference/gate.json): the text cap shapes the
// dossier's bytes; the others refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB, or app/ past 993 files and
// directories or 48 MiB. app/ counts beside /output's own 1,000-entry cap.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes)`);
