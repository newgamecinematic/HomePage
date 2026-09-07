window.ATLAS = (() => {
  const data = window.ATLAS_DATA;
  const worlds = data.worlds;
  const regions = data.regions;
  const defaultWorld = data.defaultWorld;
  const worldUrl = id => `./world.html?id=${encodeURIComponent(id)}`;
  const regionUrl = (world, id) => `./region.html?world=${encodeURIComponent(world)}&id=${encodeURIComponent(id)}`;
  const characterUrl = (world, region, id) => `./character.html?world=${encodeURIComponent(world)}&region=${encodeURIComponent(region)}&id=${encodeURIComponent(id)}`;
  function read(key) {
    try { return JSON.parse(sessionStorage.getItem(`atlas:${key}`)); } catch { return null; }
  }
  function write(key, value) {
    try { sessionStorage.setItem(`atlas:${key}`, JSON.stringify(value)); } catch { /* Storage is optional. */ }
  }
  function resolveWorld(id) {
    const key = Object.hasOwn(worlds, id) ? id : defaultWorld;
    return { worldKey: key, world: worlds[key], invalidWorld: Boolean(id && key !== id) };
  }
  function resolveRegion(worldId, regionId) {
    const worldResult = resolveWorld(worldId);
    const firstRegion = worldResult.world.regions[0];
    const key = worldResult.world.regions.includes(regionId) && Object.hasOwn(regions, regionId) ? regionId : firstRegion;
    return { ...worldResult, key, region: regions[key], invalid: worldResult.invalidWorld || Boolean(regionId && key !== regionId) };
  }
  function resolveCharacter(worldId, regionId, characterId) {
    const result = resolveRegion(worldId, regionId);
    const character = result.region.characters.find(item => item.id === characterId) || result.region.characters[0] || null;
    return { ...result, character, invalid: result.invalid || Boolean(characterId && character?.id !== characterId) };
  }
  function syncNavigation(worldKey, regionKey, characterId) {
    const { world } = resolveWorld(worldKey);
    const key = world.regions.includes(regionKey) ? regionKey : world.regions[0];
    const region = regions[key];
    const id = characterId || region.characters[0]?.id;
    document.querySelectorAll('.rail-menu a[aria-label="World"]').forEach(a => a.href = worldUrl(worldKey));
    document.querySelectorAll('.rail-menu a[aria-label="Regions"]').forEach(a => a.href = regionUrl(worldKey, key));
    document.querySelectorAll('.rail-menu a[aria-label="Characters"]').forEach(a => a.href = characterUrl(worldKey, key, id || ""));
    document.querySelectorAll('.rail-menu a.active').forEach(a => a.setAttribute('aria-current', 'page'));
    write('selection', { world: worldKey, region: key, character: id });
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
  return { worlds, regions, defaultWorld, worldUrl, regionUrl, characterUrl, read, write, resolveWorld, resolveRegion, resolveCharacter, syncNavigation, notice, cameraState };
})();
