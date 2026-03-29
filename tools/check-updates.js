// tools/check-updates.js
// Usage:
//   node tools/check-updates.js              → check all manga for new chapters
//   node tools/check-updates.js --download   → check and prompt to download new chapters
//   node tools/check-updates.js <slug|uuid>  → check a single manga only
//   node tools/check-updates.js <slug|uuid> --download

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const DATA_PATH = path.join(__dirname, '../data/manga.json');
const MANGA_DIR = path.join(__dirname, '../assets/manga');

// ── Helpers ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJsonSafe(url, label = '') {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'MangaView CLI' }
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`[${label}] Response error (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function sanitizeTitle(title) {
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ /g, '_');
}

// ── Partial chapter filtering ────────────────────────────
// When a whole-number chapter exists (e.g. "14"), its decimal siblings
// (14.5, 14.6) are partial translator splits of the same content.
// Skip them — the whole number is the complete version.
// If ONLY decimals exist for a base (e.g. 1.1, 1.2 with no "1"), keep them.

function filterPartialChapters(chapters) {
  const numbers = new Set(chapters.map(c => c.number));

  return chapters.filter(c => {
    const num = parseFloat(c.number);
    if (!Number.isInteger(num)) {
      const base = Math.floor(num).toString();
      if (numbers.has(base)) {
        return false; // skip partial — complete version exists
      }
    }
    return true;
  });
}

// ── Fetch remote chapters with full metadata from MangaDex ──

async function fetchRemoteChapterData(mangaUuid) {
  const chapters = [];
  const groups = {};
  let offset = 0;
  const limit = 100;

  while (true) {
    const url =
      `https://api.mangadex.org/chapter?manga=${mangaUuid}` +
      `&translatedLanguage[]=en&order[chapter]=asc&limit=${limit}&offset=${offset}` +
      `&includes[]=scanlation_group`;

    const json = await fetchJsonSafe(url, `fetchRemoteChapterData(${mangaUuid})`);
    if (!json.data || !json.data.length) break;

    // Collect scanlation group names from includes
    if (Array.isArray(json.included)) {
      json.included.forEach(item => {
        if (item.type === 'scanlation_group') {
          groups[item.id] = item.attributes.name;
        }
      });
    }

    for (const ch of json.data) {
      const num = ch.attributes.chapter;
      // Skip chapters with no number (null/empty)
      if (num == null || num === '') continue;
      const rel = (ch.relationships || []).find(r => r.type === 'scanlation_group');
      const gid = rel?.id;
      chapters.push({ id: ch.id, number: num.toString(), groupId: gid });
    }

    offset += limit;
    if (offset >= (json.total || 0)) break;
    await sleep(350); // rate-limit courtesy
  }

  // Fetch any missing group names
  const missing = [...new Set(chapters.map(c => c.groupId).filter(Boolean))].filter(id => !groups[id]);
  for (const id of missing) {
    try {
      const grp = await fetchJsonSafe(`https://api.mangadex.org/group/${id}`, 'getGroup');
      groups[id] = grp.data.attributes.name;
    } catch {
      groups[id] = 'Unknown Scanlator';
    }
  }

  // Enrich entries with group name
  const enriched = chapters.map(c => ({
    id:        c.id,
    number:    c.number,
    groupId:   c.groupId,
    groupName: c.groupId == null
      ? 'No Scanlator'
      : (groups[c.groupId] || 'Unknown Scanlator')
  }));

  // Filter out partial chapters when the complete version exists
  return filterPartialChapters(enriched);
}

// Convenience: extract just the unique chapter numbers as a Set
function getRemoteChapterNumbers(chapterData) {
  return new Set(chapterData.map(c => c.number));
}

// ── Scan local chapter folders on disk ───────────────────

function getLocalChaptersFromDisk(manga) {
  const safeTitle = sanitizeTitle(manga.title);
  const dir = path.join(MANGA_DIR, safeTitle);
  if (!fs.existsSync(dir)) return new Set();

  return new Set(
    fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.startsWith('ch-'))
      .map(d => d.name.replace('ch-', ''))
  );
}

// ── Diff logic ───────────────────────────────────────────

function diffChapters(local, remote) {
  const newChapters = [];
  for (const ch of remote) {
    if (!local.has(ch)) newChapters.push(ch);
  }
  // sort numerically
  newChapters.sort((a, b) => parseFloat(a) - parseFloat(b));
  return newChapters;
}

// ── Pretty output ────────────────────────────────────────

function pad(str, len) {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

// ── Main ─────────────────────────────────────────────────

(async () => {
  const args = process.argv.slice(2);
  let shouldDownload = args.includes('--download');
  let autoDownloadAll = false;
  const positional = args.filter(a => a !== '--download');
  const targetFilter = positional[0] || null;

  if (!fs.existsSync(DATA_PATH)) {
    console.error('❌ manga.json not found at', DATA_PATH);
    process.exit(1);
  }

  const mangaList = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const toCheck = targetFilter
    ? mangaList.filter(m => m.slug === targetFilter || m.uuid === targetFilter || m.id === targetFilter)
    : mangaList;

  if (!toCheck.length) {
    console.error(`❌ No manga matched "${targetFilter}".`);
    process.exit(1);
  }

  console.log(`\n🔍 Checking ${toCheck.length} manga for updates...\n`);
  console.log(`${pad('STATUS', 6)}  ${pad('TITLE', 45)}  DETAILS`);
  console.log('─'.repeat(80));

  const allUpdates = []; // { manga, newChapters[], chapterData[] }

  for (const manga of toCheck) {
    if (!manga.uuid) {
      console.log(`  ⚠️   ${pad(manga.title, 45)}  No UUID — skipped`);
      continue;
    }

    try {
      const chapterData = await fetchRemoteChapterData(manga.uuid);
      const remote = getRemoteChapterNumbers(chapterData);

      // Prefer disk scan over manga.json chapterFolders so we catch
      // chapters that were downloaded but not yet synced to the JSON
      const local = getLocalChaptersFromDisk(manga);

      // Also merge anything listed in chapterFolders (covers edge cases)
      if (Array.isArray(manga.chapterFolders)) {
        manga.chapterFolders.forEach(ch => local.add(ch.toString()));
      }

      const newChapters = diffChapters(local, remote);

      if (newChapters.length === 0) {
        console.log(`  ✅   ${pad(manga.title, 45)}  Up to date (${local.size} chapters)`);
      } else {
        const preview = newChapters.length <= 8
          ? newChapters.join(', ')
          : newChapters.slice(0, 6).join(', ') + ` ... +${newChapters.length - 6} more`;
        console.log(`  ⬆️   ${pad(manga.title, 45)}  ${newChapters.length} new: ${preview}`);
        allUpdates.push({ manga, newChapters, chapterData });
      }
    } catch (err) {
      console.log(`  ❌   ${pad(manga.title, 45)}  Error: ${err.message.slice(0, 60)}`);
    }

    // Small delay between manga to respect MangaDex rate limits
    await sleep(500);
  }

  console.log('─'.repeat(80));

  if (allUpdates.length === 0) {
    console.log('\n🎉 Everything is up to date!\n');
    return;
  }


  console.log(`\n📊 Summary: ${allUpdates.length} manga with new chapters available.\n`);

  if (!shouldDownload) {
    const ans = await prompt('Download new chapters? (y/n): ');

    if (ans.toLowerCase() !== 'y') {
      console.log('\n💡 You can also run with --download next time to skip this prompt.\n');
      return;
    }

    shouldDownload = true;
  }

  // ── Download flow ────────────────────────────────────

  // Resolves which chapter ID(s) to download for a given chapter number.
  // Scanlator choice is remembered within a single manga only — each new
  // manga resets so you always get asked on the first multi-scanlator chapter.
  async function resolveChapterIds(chNum, chapterData, preferredGroupId, downloadAllGroups) {
    const entries = chapterData.filter(c => c.number === chNum);

    if (entries.length === 0) return { ids: [], preferredGroupId, downloadAllGroups };
    if (entries.length === 1) return { ids: [entries[0].id], preferredGroupId, downloadAllGroups };

    // Multiple scanlators for this chapter
    if (downloadAllGroups) {
      return { ids: entries.map(e => e.id), preferredGroupId, downloadAllGroups };
    }

    if (preferredGroupId) {
      const preferred = entries.filter(c => c.groupId === preferredGroupId);
      if (preferred.length) {
        console.log(`   📥 Chapter ${chNum} — Translator: ${preferred[0].groupName}`);
        return { ids: preferred.map(e => e.id), preferredGroupId, downloadAllGroups };
      }
      // Preferred group doesn't have this chapter — fall through to prompt
    }

    // Prompt user to pick scanlator (auto-remembered for THIS manga only)
    console.log(`\n   🚩 Chapter ${chNum} available from:`);
    entries.forEach((c, i) => console.log(`      [${i + 1}] ${c.groupName}`));
    console.log(`      [a] all\n`);

    const ans = await prompt(`      Select (1-${entries.length} or a): `);

    if (ans.toLowerCase() === 'a') {
      console.log(`   📥 Downloading from all translators`);
      return { ids: entries.map(e => e.id), preferredGroupId, downloadAllGroups: true };
    }

    const idx = parseInt(ans, 10) - 1;
    const choice = entries[idx];
    if (choice) {
      console.log(`   📥 Translator: ${choice.groupName} (remembered for remaining chapters)`);
      return { ids: [choice.id], preferredGroupId: choice.groupId, downloadAllGroups };
    }

    console.log('      ⚠️ Invalid choice, using first scanlator.');
    console.log(`   📥 Translator: ${entries[0].groupName} (remembered for remaining chapters)`);
    return { ids: [entries[0].id], preferredGroupId: entries[0].groupId, downloadAllGroups };
  }

  // Downloads chapters for a single manga. Scanlator preference is local —
  // it resets for the next manga so you always get asked fresh.
  async function downloadMangaUpdates({ manga, newChapters, chapterData }) {
    let preferredGroupId = null;
    let downloadAllGroups = false;

    // Check if there's only one scanlation group for the new chapters
    const relevantEntries = chapterData.filter(c => newChapters.includes(c.number));
    const uniqueGroups = [...new Set(relevantEntries.map(c => c.groupId).filter(Boolean))];
    const uniqueGroupNames = [...new Set(relevantEntries.map(c => c.groupName))];
    if (uniqueGroups.length <= 1) {
      console.log(`   ℹ️  Only one source: ${uniqueGroupNames[0] || 'Unknown'} — no scanlator prompt needed.`);
    }

    for (const chNum of newChapters) {
      const result = await resolveChapterIds(chNum, chapterData, preferredGroupId, downloadAllGroups);
      preferredGroupId = result.preferredGroupId;
      downloadAllGroups = result.downloadAllGroups;

      for (const chapterId of result.ids) {
        try {
          console.log(`   ⬇️  Downloading chapter ${chNum}...`);
          execSync(
            `node tools/download-chapter.js ${chapterId}`,
            { stdio: 'inherit' }
          );
        } catch (err) {
          console.error(`   ❌ Failed to download chapter ${chNum}: ${err.message}`);
        }
        await sleep(750);
      }
    }

    // Regenerate chapter folders after download
    try {
      execSync(
        `node tools/generate-chapter-folders.js ${manga.uuid}`,
        { stdio: 'inherit' }
      );
    } catch {
      // non-critical
    }

    console.log(`   ✅ Done with ${manga.title}`);
  }

  // Per-manga loop — always asks for confirmation.
  // "all" skips remaining manga confirmations but scanlator choices still reset per manga.
  for (let i = 0; i < allUpdates.length; i++) {
    const update = allUpdates[i];
    console.log(`\n📚 ${update.manga.title} — ${update.newChapters.length} new chapter(s)`);
    console.log(`   Chapters: ${update.newChapters.join(', ')}`);

    let ans;
    if (autoDownloadAll) {
      console.log('   Auto-downloading...');
      ans = 'y';
    } else {
      ans = await prompt('   Download? (y/n/all/skip-rest): ');
    }

    if (ans.toLowerCase() === 'skip-rest') {
      console.log('⏭️  Skipping remaining manga.');
      break;
    }

    if (ans.toLowerCase() === 'n') {
      console.log('   Skipped.');
      continue;
    }

    if (ans.toLowerCase() === 'all') {
      autoDownloadAll = true;
    }

    // Fresh scanlator preference for each manga
    await downloadMangaUpdates(update);
  }

  console.log('\n🎉 Update check complete.\n');
})();