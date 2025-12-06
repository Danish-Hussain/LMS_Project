#!/usr/bin/env node
/*
  scripts/migrate-views-to-sanity.js

  Usage:
    node scripts/migrate-views-to-sanity.js --dry-run
    node scripts/migrate-views-to-sanity.js --apply

  Environment variables needed for --apply:
    SANITY_PROJECT_ID, SANITY_DATASET, SANITY_WRITE_TOKEN

  The script reads data/views.json and for each slug attempts to find a
  Sanity `post` document by slug.current and then patches its `views` number.
  By default it runs in dry-run mode and only prints the planned operations.
*/

const fs = require('fs');
const path = require('path');
const fetch = globalThis.fetch || require('node-fetch');

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dryRun = !apply;

  const repoRoot = path.resolve(__dirname, '..');
  const viewsFile = path.join(repoRoot, 'data', 'views.json');

  if (!fs.existsSync(viewsFile)) {
    console.error('data/views.json not found at', viewsFile);
    process.exit(1);
  }

  let viewsData;
  try {
    viewsData = JSON.parse(fs.readFileSync(viewsFile, 'utf8'));
  } catch (err) {
    console.error('Failed to read/parse data/views.json:', err.message);
    process.exit(1);
  }

  const slugs = Object.keys(viewsData);
  if (slugs.length === 0) {
    console.log('No slugs found in data/views.json');
    return;
  }

  console.log(`Loaded ${slugs.length} slugs from data/views.json`);

  if (dryRun) console.log('Running in dry-run mode (no network writes). Use --apply to perform writes.');

  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';
  const token = process.env.SANITY_WRITE_TOKEN;

  if (apply && (!projectId || !token)) {
    console.error('To apply changes you must set SANITY_PROJECT_ID and SANITY_WRITE_TOKEN');
    process.exit(2);
  }

  async function findDocIdForSlug(slug) {
    // Query Sanity for a post with matching slug.current
    const q = `*[_type == "post" && slug.current == "${slug}"][0]._id`;
    const url = `https://${projectId}.api.sanity.io/v1/data/query/${dataset}?query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Sanity query failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    // result may be null or a string
    return json.result || null;
  }

  async function patchDocViews(docId, views) {
    const url = `https://${projectId}.api.sanity.io/v1/data/mutate/${dataset}?returnIds=true`;
    const body = {mutations: [{patch: {id: docId, set: {views}}}]};
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sanity mutate failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  }

  const summary = {found: 0, patched: 0, missing: 0, errors: []};

  for (const slug of slugs) {
    const views = viewsData[slug];
    console.log(`\nSlug: ${slug} -> views: ${views}`);
    if (dryRun) {
      console.log(`  [dry-run] Would look up post with slug.current == "${slug}" and set views=${views}`);
      continue;
    }

    try {
      const docId = await findDocIdForSlug(slug);
      if (!docId) {
        console.warn(`  No Sanity document found for slug "${slug}"`);
        summary.missing++;
        continue;
      }
      summary.found++;
      console.log(`  Found docId: ${docId} — patching views=${views} ...`);
      const resp = await patchDocViews(docId, views);
      console.log(`  Patched: `, resp);
      summary.patched++;
    } catch (err) {
      console.error(`  Error processing slug ${slug}:`, err.message);
      summary.errors.push({slug, error: err.message});
    }
  }

  console.log('\nDone. Summary:', summary);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
