const atlas = window.ATLAS;
const { key: regionKey, region, invalid } = atlas.resolveRegion(new URLSearchParams(location.search).get('id'));
if (invalid) history.replaceState(null, '', atlas.regionUrl(regionKey));
atlas.notice(invalid); atlas.syncNavigation(regionKey);
document.title = `${region.name} — ATLAS`;
document.documentElement.style.setProperty('--accent', region.accent);
for (const [id, value] of Object.entries({
  'crumb-region': region.name.toUpperCase(), chapter: region.chapter.toUpperCase(),
  'region-title': region.name, 'region-description': region.description,
  'region-type': region.type, 'region-faction': region.faction, 'region-record': region.firstRecord,
  'roster-count': String(region.characters.length).padStart(2, '0')
})) document.getElementById(id).textContent = value;
const viewer = document.querySelector('#region-model');
viewer.alt = `${region.name} 3D 지역 모델`;
mountAtlasScene(viewer, region.model);
const roster = document.querySelector('#roster');
region.characters.forEach((character, index) => {
  const link = document.createElement('a'); link.href = atlas.characterUrl(regionKey, character.id);
  const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = String(index + 1).padStart(2, '0');
  const text = document.createElement('span');
  const name = document.createElement('b'); name.textContent = character.name;
  const role = document.createElement('small'); role.textContent = character.role;
  const arrow = document.createElement('em'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
  text.append(name, role); link.append(avatar, text, arrow); roster.append(link);
});
if (!region.characters.length) roster.textContent = '아직 기록된 인물이 없습니다.';
