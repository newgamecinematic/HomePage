const atlas = window.ATLAS;
const params = new URLSearchParams(location.search);
const { key: regionKey, region, character, invalid } = atlas.resolveCharacter(params.get('region'), params.get('id'));
if (invalid) history.replaceState(null, '', atlas.characterUrl(regionKey, character?.id || ''));
atlas.notice(invalid); atlas.syncNavigation(regionKey, character?.id);
document.title = `${character?.name || '미등록 인물'} — ATLAS`;
document.documentElement.style.setProperty('--accent', region.accent);
for (const [id, value] of Object.entries({
  'crumb-region': region.name.toUpperCase(), 'crumb-character': character?.name.toUpperCase() || 'CHARACTER',
  'character-title': character?.name || '미등록 인물', 'character-description': character?.description || '이 지역에는 아직 기록된 인물이 없습니다.',
  'character-role': character?.role || '—', 'character-region': region.name, 'character-record': character?.firstRecord || '—'
})) document.getElementById(id).textContent = value;
document.querySelector('#crumb-region-link').href = atlas.regionUrl(regionKey);
document.querySelector('#back-region').href = atlas.regionUrl(regionKey);
const viewer = document.querySelector('#character-model');
viewer.alt = `${character?.name || ''} 3D 캐릭터 모델`;
mountAtlasScene(viewer, character?.model || null);
