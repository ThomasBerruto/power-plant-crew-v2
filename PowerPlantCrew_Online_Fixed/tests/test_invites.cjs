// Node-only tests for the real TS invite helper. No browser/server required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/invite.ts'),'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exported = {exports:{}};
new Function('module','exports','require',compiled)(exported,exported.exports,require);
const {makeLobbyInvite} = exported.exports;
const publicLobby = makeLobbyInvite('ab3d5e','https://powerplantcrew.vercel.app');
assert.equal(publicLobby.url, 'https://powerplantcrew.vercel.app/?room=AB3D5E');
assert.equal(publicLobby.publicHttps, true);
for(const site of ['http://localhost:5173','http://192.168.1.10:5173','https://10.0.0.1','http://mygame.com']) {
 const invite = makeLobbyInvite('ABC123',site);
 assert.equal(invite.publicHttps,false,site);
}
assert.equal(makeLobbyInvite('ABC123','http://localhost:5173','https://team.vercel.app').publicHttps,true);
assert.equal(makeLobbyInvite('ABC123','https://public.example','/bad').publicHttps,false);
console.log('6 invite checks passed');
