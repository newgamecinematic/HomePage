const atlas = window.ATLAS;
const params = new URLSearchParams(location.search);
const { worldKey, world, key: regionKey, region, character, invalid } = atlas.resolveCharacter(params.get('world'), params.get('region'), params.get('id'));
if (invalid) history.replaceState(null, '', atlas.characterUrl(worldKey, regionKey, character?.id || ''));
atlas.notice(invalid); atlas.syncNavigation(worldKey, regionKey, character?.id);
document.title = `${character?.name || '미등록 인물'} — ATLAS`;
document.documentElement.style.setProperty('--accent', region.accent);
for (const [id, value] of Object.entries({
  'crumb-world': world.name.toUpperCase(),
  'crumb-region': region.name.toUpperCase(), 'crumb-character': character?.name.toUpperCase() || 'CHARACTER',
  'character-title': character?.name || '미등록 인물', 'character-description': character?.description || '이 지역에는 아직 기록된 인물이 없습니다.',
  'character-role': character?.role || '—', 'character-region': region.name, 'character-record': character?.firstRecord || '—',
  'rail-era': world.era, 'era-mark': `CHARACTER ARCHIVE · ERA ${world.era}`, 'character-era': `ERA ${world.era}`
})) document.getElementById(id).textContent = value;
document.querySelector('#crumb-world-link').href = atlas.worldUrl(worldKey);
document.querySelector('#crumb-region-link').href = atlas.regionUrl(worldKey, regionKey);
document.querySelector('#back-region').href = atlas.regionUrl(worldKey, regionKey);
const viewer = document.querySelector('#character-model');
viewer.alt = `${character?.name || ''} 3D 캐릭터 모델`;
mountAtlasScene(viewer, character?.model || null);
