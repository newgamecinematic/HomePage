const worldViewer = document.querySelector('#world-model');
const archiveDialog = document.querySelector('#contact-dialog');
const atlas = window.ATLAS;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let navigating = false, pointerStart = null, moved = false, transitionTimer;
let restoring = true;
// Derive both 3D hotspots and the keyboard/mobile list from the same content.
worldViewer.querySelectorAll('[data-project]').forEach(pin => pin.remove());
const picker = document.querySelector('.region-picker');
picker.replaceChildren();
Object.entries(atlas.regions).forEach(([key, region], index) => {
  const pin = document.createElement('button');
  pin.className = 'map-pin'; pin.style.setProperty('--pin', region.accent);
  pin.slot = `hotspot-${key}`; pin.dataset.project = key;
  pin.dataset.normal = '0 1 0';
  const dot = document.createElement('span'); dot.className = 'pin-dot';
  const label = document.createElement('span'); label.className = 'pin-label';
  const name = document.createElement('span'); name.textContent = region.name;
  const category = document.createElement('small'); category.textContent = 'REGION';
  name.append(category); label.append(name); pin.append(dot, label); worldViewer.append(pin);
  const link = document.createElement('button'); link.type = 'button'; link.dataset.regionLink = key;
  link.textContent = `${String(index + 1).padStart(2, '0')} · ${region.name}`; picker.append(link);
});
function saveCamera() {
  if (restoring || navigating || typeof worldViewer.getCameraOrbit !== 'function') return;
  const { theta, phi, radius } = worldViewer.getCameraOrbit();
  const { x, y, z } = worldViewer.getCameraTarget();
  atlas.write('camera', { orbit: [theta, phi, radius], target: [x, y, z] });
}
function restoreCamera() {
  const saved = atlas.cameraState(atlas.read('camera'));
  if (saved) {
    worldViewer.cameraOrbit = `${saved.orbit[0]}rad ${saved.orbit[1]}rad ${saved.orbit[2]}m`;
    worldViewer.cameraTarget = saved.target.map(value => `${value}m`).join(' ');
    worldViewer.jumpCameraToGoal();
  }
  restoring = false;
}
function selectRegion(key) {
  if (navigating || !Object.hasOwn(atlas.regions, key)) return;
  saveCamera(); navigating = true;
  atlas.syncNavigation(key);
  const go = () => { location.href = atlas.regionUrl(key); };
  if (reducedMotion.matches || typeof worldViewer.getCameraOrbit !== 'function' || !worldViewer.loaded) { go(); return; }
  worldViewer.cameraTarget = atlas.regions[key].view.target;
  worldViewer.cameraOrbit = atlas.regions[key].view.orbit;
  document.body.classList.add('region-transition');
  transitionTimer = setTimeout(go, 650);
}
worldViewer.addEventListener('pointerdown', event => {
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId }; moved = false;
}, true);
worldViewer.addEventListener('pointermove', event => {
  if (pointerStart?.id === event.pointerId && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) moved = true;
}, true);
worldViewer.addEventListener('pointercancel', () => { moved = true; pointerStart = null; }, true);
document.querySelectorAll('#world-model [data-project]').forEach(button => {
  const key = button.dataset.project;
  button.dataset.position = atlas.regions[key].position;
  button.setAttribute('aria-label', `${atlas.regions[key].name} 지역으로 이동`);
  button.addEventListener('click', event => {
    event.stopPropagation();
    if (event.detail !== 0 && moved) return;
    selectRegion(key);
  });
});
document.querySelectorAll('[data-region-link]').forEach(button => button.addEventListener('click', () => selectRegion(button.dataset.regionLink)));
worldViewer.addEventListener('load', restoreCamera);
customElements.whenDefined('model-viewer').then(() => { if (worldViewer.loaded) restoreCamera(); });
worldViewer.addEventListener('camera-change', saveCamera);
window.addEventListener('pagehide', saveCamera);
window.addEventListener('pageshow', () => {
  clearTimeout(transitionTimer); navigating = false;
  document.body.classList.remove('region-transition');
  if (worldViewer.loaded) restoreCamera();
});
document.querySelector('#reset-camera').addEventListener('click', () => {
  if (navigating) return;
  worldViewer.setAttribute('camera-orbit', '0deg 48deg 17m');
  worldViewer.setAttribute('camera-target', 'auto auto auto');
});
atlas.syncNavigation(atlas.resolveRegion(atlas.read('selection')?.region).key);
mountAtlasScene(worldViewer, './assets/demo-world.glb');
document.querySelectorAll('[data-open-contact]').forEach(button => button.addEventListener('click', () => archiveDialog.showModal()));
document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
archiveDialog.addEventListener('click', event => {
  if (event.target !== archiveDialog) return;
  const rect = archiveDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) archiveDialog.close();
});
