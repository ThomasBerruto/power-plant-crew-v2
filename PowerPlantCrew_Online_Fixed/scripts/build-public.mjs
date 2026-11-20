/** Build a reproducible public game against the selected production database.
 * Prevents `spacetime dev`'s .env.local from silently redirecting QR lobbies.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const text = readFileSync(new URL('../.env.production',import.meta.url),'utf8');
const values = Object.fromEntries(text.split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>{
  const split=l.indexOf('=');
  if(split<1)throw new Error('Bad line in .env.production');
  return [l.slice(0,split).trim(),l.slice(split+1).trim()];
}));
const db=values.VITE_SPACETIMEDB_DB_NAME;
const host=values.VITE_SPACETIMEDB_HOST;
if (!/^[a-z][a-z0-9-]*$/.test(db??'')) throw new Error('Invalid production database name in .env.production');
if (host!=='https://maincloud.spacetimedb.com') throw new Error('Production host must point at SpacetimeDB Maincloud');
console.log(`Building public frontend for SpacetimeDB ${db} on ${host}`);
if(process.argv.includes('--dry-run'))process.exit(0);
const child=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{
  stdio:'inherit',shell:process.platform==='win32',env:{...process.env,...values}
});
if(child.error)throw child.error;
process.exit(child.status??1);
