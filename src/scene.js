window.mountAtlasScene = (viewer, source) => {
  const panel = document.createElement('div');
  panel.className = 'scene-state'; panel.setAttribute('role', 'status');
  panel.setAttribute('aria-live', 'polite');
  const label = document.createElement('p');
  const retry = document.createElement('button');
  retry.type = 'button'; retry.textContent = '다시 불러오기'; retry.hidden = true;
  panel.append(label, retry); viewer.parentElement.append(panel);
  let timer;
  const fail = () => {
    clearTimeout(timer); panel.hidden = false; retry.hidden = false;
    viewer.setAttribute('aria-busy', 'false');
    label.textContent = '3D 모델을 불러오지 못했습니다. 연결 상태를 확인해 주세요.';
  };
  const ready = () => {
    clearTimeout(timer); panel.hidden = true; viewer.setAttribute('aria-busy', 'false');
  };
  viewer.addEventListener('load', ready);
  viewer.addEventListener('error', fail);
  function load() {
    clearTimeout(timer); panel.hidden = false; retry.hidden = true;
    viewer.hidden = !source;
    if (!source) {
      label.textContent = '캐릭터 모델 준비 중';
      viewer.parentElement.querySelector('.viewer-instruction')?.setAttribute('hidden', '');
      return;
    }
    label.textContent = '3D 모델을 불러오는 중…'; viewer.setAttribute('aria-busy', 'true');
    timer = setTimeout(fail, 20000);
    // Wait for upgrade before assigning a property, so its setter is not shadowed.
    customElements.whenDefined('model-viewer').then(() => {
      viewer.src = source;
      if (viewer.loaded) ready();
    });
  }
  retry.addEventListener('click', () => {
    if (!customElements.get('model-viewer')) { location.reload(); return; }
    viewer.removeAttribute('src');
    requestAnimationFrame(load);
  });
  load();
};
