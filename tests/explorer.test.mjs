import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

async function setup(storage = new Map()) {
  const context = { window: {}, sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  for (const file of ['content.js', 'navigation.js']) runInNewContext(await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8'), context);
  return context.window.ATLAS;
}
test('every region resolves to its own environment and own character', async () => {
  const atlas = await setup();
  const paths = new Set();
  for (const [key, region] of Object.entries(atlas.regions)) {
    assert.equal(atlas.resolveRegion(key).key, key);
    paths.add(region.model);
    for (const character of region.characters) {
      assert.equal(atlas.resolveCharacter(key, character.id).character.id, character.id);
      assert.equal(character.model, null, 'Unprovided characters must not use a sample robot');
    }
  }
  assert.equal(paths.size, 3);
});
test('unknown and prototype keys resolve safely; foreign character does not leak between regions', async () => {
  const atlas = await setup();
  for (const id of ['unknown', '__proto__', 'constructor']) {
    assert.equal(atlas.resolveRegion(id).key, 'grove');
    assert.equal(atlas.resolveRegion(id).invalid, true);
  }
  assert.equal(atlas.resolveCharacter('grove', 'warden').character.id, 'oracle');
  assert.equal(atlas.resolveCharacter('grove', 'warden').invalid, true);
  assert.equal(atlas.resolveRegion(null).invalid, false);
});
test('empty region roster is handled without throwing', async () => {
  const atlas = await setup();
  atlas.regions.grove.characters = [];
  assert.equal(atlas.resolveCharacter('grove', 'missing').character, null);
});
test('device-local camera survives navigation and corrupt values are ignored', async () => {
  const storage = new Map(); const atlas = await setup(storage);
  const camera = { orbit: [1, 0.8, 17], target: [0, 1, 0] };
  atlas.write('camera', camera);
  assert.equal(JSON.stringify(atlas.cameraState(atlas.read('camera'))), JSON.stringify(camera));
  storage.set('atlas:camera', 'not json'); assert.equal(atlas.read('camera'), null);
  for (const value of [{}, { orbit:[0,1,0], target:[0,0,0] }, { orbit:[0,NaN,17], target:[0,0,0] }]) assert.equal(atlas.cameraState(value), null);
});
test('each extracted GLB contains only its own island and valid referenced binary ranges', async () => {
  const atlas = await setup();
  for (const region of Object.values(atlas.regions)) {
    const data = await readFile(new URL(`../src/${region.model}`, import.meta.url));
    assert.equal(data.readUInt32LE(8), data.length);
    const json = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)));
    assert.equal(json.materials.length, 1);
    assert.ok(json.meshes[0].primitives.length > 1);
    for (const p of json.meshes[0].primitives) assert.equal(p.material, 0);
    for (const view of json.bufferViews) assert.ok(view.byteOffset + view.byteLength <= json.buffers[0].byteLength);
    assert.ok(json.nodes[0].translation.every(Number.isFinite));
  }
});
test('all page assets resolve and shared scripts load before route scripts', async () => {
  for (const [page, script] of [['index', 'script'], ['region', 'region'], ['character', 'character']]) {
    const html = await readFile(new URL(`../src/${page}.html`, import.meta.url), 'utf8');
    for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+\.(?:js|css|png|glb))"/g)) await readFile(new URL(`../src/${match[1]}`, import.meta.url));
    assert.ok(html.indexOf('./content.js') < html.indexOf('./navigation.js'));
    assert.ok(html.indexOf('./scene.js') < html.indexOf(`./${script}.js`));
    assert.ok(html.includes('./explorer.css'));
    assert.ok(!html.includes('auto-rotate'));
  }
});
test('scene has honest empty state and handles loading failure / retry / success', async () => {
  class Element {
    constructor() { this.listeners = {}; this.children = []; this.attrs = {}; this.hidden = false; }
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    emit(type) { for (const listener of this.listeners[type] || []) listener(); }
    append(...children) { this.children.push(...children); }
    setAttribute(key, value) { this.attrs[key] = value; }
    removeAttribute(key) { delete this.attrs[key]; }
    querySelector() { return null; }
  }
  const context = { window: {}, document: { createElement: () => new Element() },
    customElements: { whenDefined: () => Promise.resolve(), get: () => true },
    setTimeout: () => 1, clearTimeout: () => {}, requestAnimationFrame: fn => fn() };
  runInNewContext(await readFile(new URL('../src/scene.js', import.meta.url), 'utf8'), context);
  const viewer = new Element(); viewer.parentElement = new Element();
  context.window.mountAtlasScene(viewer, null);
  assert.equal(viewer.hidden, true);
  assert.equal(viewer.parentElement.children[0].children[0].textContent, '캐릭터 모델 준비 중');
  const readyViewer = new Element(); readyViewer.parentElement = new Element();
  context.window.mountAtlasScene(readyViewer, './assets/region-grove.glb');
  await Promise.resolve();
  assert.equal(readyViewer.src, './assets/region-grove.glb');
  const panel = readyViewer.parentElement.children[0];
  readyViewer.emit('error'); assert.equal(panel.children[1].hidden, false);
  panel.children[1].emit('click'); assert.equal(panel.children[1].hidden, true);
  readyViewer.emit('load'); assert.equal(panel.hidden, true);
});
