const atlas = window.ATLAS;
const params = new URLSearchParams(location.search);
const { worldKey, world, key: regionKey, region, invalid } = atlas.resolveRegion(params.get('world'), params.get('id'));
if (invalid) history.replaceState(null, '', atlas.regionUrl(worldKey, regionKey));
atlas.notice(invalid); atlas.syncNavigation(worldKey, regionKey);
document.title = `${region.name} — ATLAS`;
document.documentElement.style.setProperty('--accent', region.accent);
for (const [id, value] of Object.entries({
  'crumb-world': world.name.toUpperCase(),
  'crumb-region': region.name.toUpperCase(), chapter: region.chapter.toUpperCase(),
  'region-title': region.name, 'region-description': region.description,
  'region-type': region.type, 'region-faction': region.faction, 'region-record': region.firstRecord,
  'roster-count': String(region.characters.length).padStart(2, '0'),
  'rail-era': world.era, 'era-mark': `${world.name.toUpperCase()} · ERA ${world.era}`,
  'region-era': `ERA ${world.era}`
})) document.getElementById(id).textContent = value;
document.querySelector('#crumb-world-link').href = atlas.worldUrl(worldKey);
document.querySelector('#back-world').href = atlas.worldUrl(worldKey);
const viewer = document.querySelector('#region-model');
viewer.alt = `${region.name} 3D 지역 모델`;
mountAtlasScene(viewer, region.model);
const roster = document.querySelector('#roster');
region.characters.forEach((character, index) => {
  const link = document.createElement('a'); link.href = atlas.characterUrl(worldKey, regionKey, character.id);
  const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = String(index + 1).padStart(2, '0');
  const text = document.createElement('span');
  const name = document.createElement('b'); name.textContent = character.name;
  const role = document.createElement('small'); role.textContent = character.role;
  const arrow = document.createElement('em'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
  text.append(name, role); link.append(avatar, text, arrow); roster.append(link);
});
if (!region.characters.length) roster.textContent = '아직 기록된 인물이 없습니다.';
