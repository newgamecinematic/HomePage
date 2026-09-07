window.ATLAS = (() => {
  const regions = window.ATLAS_DATA.regions;
  const firstRegion = Object.keys(regions)[0];
  const regionUrl = id => `./region.html?id=${encodeURIComponent(id)}`;
  const characterUrl = (region, id) => `./character.html?region=${encodeURIComponent(region)}&id=${encodeURIComponent(id)}`;
  function read(key) {
    try { return JSON.parse(sessionStorage.getItem(`atlas:${key}`)); } catch { return null; }
  }
  function write(key, value) {
    try { sessionStorage.setItem(`atlas:${key}`, JSON.stringify(value)); } catch { /* Storage is optional. */ }
  }
  function resolveRegion(id) {
    const key = Object.hasOwn(regions, id) ? id : firstRegion;
    return { key, region: regions[key], invalid: Boolean(id && key !== id) };
  }
  function resolveCharacter(regionId, characterId) {
    const result = resolveRegion(regionId);
    const character = result.region.characters.find(item => item.id === characterId) || result.region.characters[0] || null;
    return { ...result, character, invalid: result.invalid || Boolean(characterId && character?.id !== characterId) };
  }
  function syncNavigation(key, characterId) {
    const { region } = resolveRegion(key);
    const id = characterId || region.characters[0]?.id;
    document.querySelectorAll('.rail-menu a[aria-label="Regions"]').forEach(a => a.href = regionUrl(key));
    document.querySelectorAll('.rail-menu a[aria-label="Characters"]').forEach(a => a.href = characterUrl(key, id || ""));
    document.querySelectorAll('.rail-menu a.active').forEach(a => a.setAttribute('aria-current', 'page'));
    write('selection', { region: key, character: id });
  }
  function notice(invalid) {
    if (!invalid) return;
    const p = document.createElement('p');
    p.className = 'route-notice'; p.setAttribute('role', 'status');
    p.textContent = '요청한 기록이 없어 첫 번째 기록을 표시합니다.';
    document.querySelector('.inner-copy').prepend(p);
  }
  function cameraState(value) {
    if (!value || !Array.isArray(value.orbit) || !Array.isArray(value.target)) return null;
    if (value.orbit.length !== 3 || value.target.length !== 3 || ![...value.orbit, ...value.target].every(Number.isFinite)) return null;
    if (value.orbit[2] < 7 || value.orbit[2] > 24) return null;
    return value;
  }
  return { regions, regionUrl, characterUrl, read, write, resolveRegion, resolveCharacter, syncNavigation, notice, cameraState };
})();
