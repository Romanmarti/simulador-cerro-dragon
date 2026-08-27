// --- ESTADO GLOBAL Y SIMULACIÓN ---
const state = {
  budget: 50.0, // En Millones USD
  reserves: 100.0, // MMbbl
  oilPrice: 75,
  year: 2026,
  month: 1,
  wells: [],
  selectedWellId: 'CD-101',
  history: {
    labels: [],
    oil: [],
    gas: [],
    pressure: [],
    budget: []
  }
};

// --- DATOS INICIALES DE POZOS ---
const initialWellsData = [
  { id: 'CD-101', lat: -45.75, lng: -68.15, type: 'Convencional', target: 'Comodoro Rivadavia', depth: 1600, status: 'Activo', oilRate: 250, gasRate: 5000, waterInj: 0, bottomPress: 180, cost: 12000, date: '2022-03' },
  { id: 'CD-102', lat: -45.78, lng: -68.20, type: 'Convencional', target: 'Comodoro Rivadavia', depth: 1550, status: 'Activo', oilRate: 180, gasRate: 3500, waterInj: 0, bottomPress: 160, cost: 11000, date: '2023-01' },
  { id: 'CD-103', lat: -45.72, lng: -68.10, type: 'No Convencional', target: 'D-129', depth: 2800, status: 'Activo', oilRate: 600, gasRate: 15000, waterInj: 0, bottomPress: 240, cost: 25000, date: '2024-08' },
  { id: 'INJ-01', lat: -45.76, lng: -68.17, type: 'Convencional', target: 'Comodoro Rivadavia', depth: 1620, status: 'Inyector', oilRate: 0, gasRate: 0, waterInj: 1200, bottomPress: 210, cost: 8000, date: '2023-06' }
];

state.wells = JSON.parse(JSON.stringify(initialWellsData));

// --- MOTOR THREE.JS (SUBSUPERFICIE Y BOMBA AIB DETALLADA) ---
let subScene, subCamera, subRenderer, subControls;
let wellModelGroup;

// Componentes móviles del AIB
let beamMesh = null;
let rodMesh = null;
let crankMesh = null;
let fluidParticlesMesh = null;

function initSubsurface3D() {
  const container = document.getElementById('three-canvas-container');
  
  subScene = new THREE.Scene();
  subScene.background = new THREE.Color(0x0a0e14);

  subCamera = new THREE.PerspectiveCamera(50, container.clientWidth / (container.clientHeight || 1), 0.1, 1000);
  subCamera.position.set(30, 25, 40);

  subRenderer = new THREE.WebGLRenderer({ antialias: true });
  subRenderer.setSize(container.clientWidth, container.clientHeight);
  subRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(subRenderer.domElement);

  subControls = new THREE.OrbitControls(subCamera, subRenderer.domElement);
  subControls.enableDamping = true;
  subControls.target.set(0, 10, 0); // Apuntar al centro del pozo

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  subScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(30, 50, 30);
  subScene.add(dirLight);

  // Terreno / Grilla de Superficie
  const gridHelper = new THREE.GridHelper(60, 20, 0x00d2ff, 0x2c3848);
  gridHelper.position.y = 20;
  subScene.add(gridHelper);

  // Capa Somera (Comodoro Rivadavia)
  const layer1Geo = new THREE.BoxGeometry(60, 4, 60);
  const layer1Mat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, transparent: true, opacity: 0.4 });
  const layer1 = new THREE.Mesh(layer1Geo, layer1Mat);
  layer1.position.y = 5;
  subScene.add(layer1);

  // Capa Profunda (D-129)
  const layer2Geo = new THREE.BoxGeometry(60, 4, 60);
  const layer2Mat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, transparent: true, opacity: 0.5 });
  const layer2 = new THREE.Mesh(layer2Geo, layer2Mat);
  layer2.position.y = -15;
  subScene.add(layer2);

  wellModelGroup = new THREE.Group();
  subScene.add(wellModelGroup);

  updateSubsurfaceWell3D();
}

function resizeSubsurfaceCanvas() {
  const container = document.getElementById('three-canvas-container');
  if (container && subRenderer && subCamera) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width > 0 && height > 0) {
      subCamera.aspect = width / height;
      subCamera.updateProjectionMatrix();
      subRenderer.setSize(width, height);
    }
  }
}

function updateSubsurfaceWell3D() {
  if (!wellModelGroup) return;

  // Limpiar modelos anteriores
  while (wellModelGroup.children.length > 0) {
    wellModelGroup.remove(wellModelGroup.children[0]);
  }

  beamMesh = null;
  rodMesh = null;
  crankMesh = null;
  fluidParticlesMesh = null;

  const currentWell = state.wells.find(w => w.id === state.selectedWellId) || state.wells[0];
  const isDeep = currentWell.target === 'D-129';
  const depthLength = isDeep ? 38 : 20;

  // --- 1. TUBERÍA Y CASING ---
  const pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, depthLength, 16);
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
  const pipe = new THREE.Mesh(pipeGeo, pipeMat);
  pipe.position.y = 20 - (depthLength / 2);
  wellModelGroup.add(pipe);

  // --- 2. ESTRUCTURA DE SUPERFICIE ---
  if (currentWell.status === 'Inyector') {
    // Cabeza de Inyección / Árbol de Navidad
    const treeGeo = new THREE.CylinderGeometry(0.6, 0.6, 4, 12);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, metalness: 0.5 });
    const tree = new THREE.Mesh(treeGeo, treeMat);
    tree.position.y = 22;
    wellModelGroup.add(tree);

    const valveGeo = new THREE.BoxGeometry(2.5, 0.6, 0.6);
    const valve = new THREE.Mesh(valveGeo, treeMat);
    valve.position.y = 22.5;
    wellModelGroup.add(valve);
  } else {
    // APARATO DE BOMBEO MECÁNICO (AIB)
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xdd6b20, metalness: 0.6, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.8 });

    // Torre SAMSON / Estructura A
    const towerGeo = new THREE.CylinderGeometry(0.3, 2.0, 7, 4);
    const tower = new THREE.Mesh(towerGeo, steelMat);
    tower.position.set(-2, 23.5, 0);
    wellModelGroup.add(tower);

    // Base del motor
    const baseGeo = new THREE.BoxGeometry(9, 0.8, 3.5);
    const base = new THREE.Mesh(baseGeo, darkMat);
    base.position.set(-3, 20.4, 0);
    wellModelGroup.add(base);

    // Balancín (Beam)
    const beamGeo = new THREE.BoxGeometry(8, 0.8, 0.8);
    beamMesh = new THREE.Mesh(beamGeo, steelMat);
    beamMesh.position.set(-2, 27, 0);
    wellModelGroup.add(beamMesh);

    // Cabeza de Mula (Horsehead)
    const headGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.8, 12, 1, false, 0, Math.PI);
    const head = new THREE.Mesh(headGeo, steelMat);
    head.rotation.z = Math.PI / 2;
    head.position.set(4, 0, 0);
    beamMesh.add(head);

    // Vástago de Bombeo (Rod)
    const rodGeo = new THREE.CylinderGeometry(0.12, 0.12, 8, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });
    rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.position.set(0, 23, 0);
    wellModelGroup.add(rodMesh);

    // Manivela
    const crankGeo = new THREE.BoxGeometry(2.5, 0.5, 0.5);
    crankMesh = new THREE.Mesh(crankGeo, darkMat);
    crankMesh.position.set(-6, 22, 0);
    wellModelGroup.add(crankMesh);
  }

  // --- 3. FLUIDOS / PARTÍCULAS ---
  if (currentWell.status !== 'Inactivo' && currentWell.status !== 'Abandonado') {
    const pCount = 70;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 1] = 20 - Math.random() * depthLength;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pColor = currentWell.status === 'Inyector' ? 0x00d2ff : 0x38a169;
    const pMat = new THREE.PointsMaterial({ color: pColor, size: 0.6 });
    fluidParticlesMesh = new THREE.Points(pGeo, pMat);
    wellModelGroup.add(fluidParticlesMesh);
  }
}

// --- MOTOR THREE.JS (SÍSMICA 3D ANIMADA) ---
let seismicScene, seismicCamera, seismicRenderer, seismicControls;
let seismicCube, seismicMaterial;
let sliceX = 0.5, sliceZ = 0.5;

function initSeismic3D() {
  const container = document.getElementById('seismic-3d-container');
  seismicScene = new THREE.Scene();
  seismicScene.background = new THREE.Color(0x0d1117);

  seismicCamera = new THREE.PerspectiveCamera(55, container.clientWidth / (container.clientHeight || 1), 0.1, 1000);
  seismicCamera.position.set(45, 35, 45);

  seismicRenderer = new THREE.WebGLRenderer({ antialias: true });
  seismicRenderer.setSize(container.clientWidth, container.clientHeight);
  seismicRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(seismicRenderer.domElement);

  seismicControls = new THREE.OrbitControls(seismicCamera, seismicRenderer.domElement);
  seismicControls.enableDamping = true;

  const canvas3d = document.createElement('canvas');
  canvas3d.width = 256;
  canvas3d.height = 256;
  const ctx = canvas3d.getContext('2d');

  const seismicTexture = new THREE.CanvasTexture(canvas3d);
  const boxGeo = new THREE.BoxGeometry(30, 20, 30);
  
  seismicMaterial = new THREE.MeshBasicMaterial({
    map: seismicTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });

  seismicCube = new THREE.Mesh(boxGeo, seismicMaterial);
  seismicScene.add(seismicCube);

  const wireframe = new THREE.WireframeGeometry(boxGeo);
  const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x00d2ff, opacity: 0.5, transparent: true }));
  seismicScene.add(line);

  document.getElementById('seismic-slice-x').addEventListener('input', (e) => sliceX = e.target.value / 100);
  document.getElementById('seismic-slice-z').addEventListener('input', (e) => sliceZ = e.target.value / 100);

  function animateSeismicTexture(time) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, 256, 256);

    const t = time * 0.003;
    for (let y = 0; y < 256; y += 4) {
      const wave = Math.sin(y * 0.1 + t) * Math.cos(y * 0.05 - t);
      const intensity = Math.floor((wave + 1) * 127);
      
      let r = intensity > 128 ? (intensity - 128) * 2 : 0;
      let b = intensity < 128 ? (128 - intensity) * 2 : 0;
      let g = 255 - Math.abs(intensity - 128) * 2;

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(0, y, 256 * sliceX, 3);
    }
    seismicTexture.needsUpdate = true;
  }

  return animateSeismicTexture;
}

function resizeSeismicCanvas() {
  const container = document.getElementById('seismic-3d-container');
  if (container && seismicRenderer && seismicCamera) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width > 0 && height > 0) {
      seismicCamera.aspect = width / height;
      seismicCamera.updateProjectionMatrix();
      seismicRenderer.setSize(width, height);
    }
  }
}

let updateSeismicFn;

// --- BUCLE DE ANIMACIÓN GLOBAL ---
function animate(time) {
  requestAnimationFrame(animate);

  const activeWell = state.wells.find(w => w.id === state.selectedWellId) || state.wells[0];
  if (activeWell && activeWell.status === 'Activo') {
    const angle = Math.sin(time * 0.004) * 0.22;
    
    if (beamMesh) beamMesh.rotation.z = angle;
    if (rodMesh) rodMesh.position.y = 23 + Math.sin(time * 0.004) * 0.9;
    if (crankMesh) crankMesh.rotation.z = time * 0.004;
  }

  if (fluidParticlesMesh) {
    const pos = fluidParticlesMesh.geometry.attributes.position.array;
    const direction = activeWell.status === 'Inyector' ? -0.12 : 0.12;

    for (let i = 1; i < pos.length; i += 3) {
      pos[i] += direction;
      if (pos[i] > 20) pos[i] = 0;
      if (pos[i] < 0) pos[i] = 20;
    }
    fluidParticlesMesh.geometry.attributes.position.needsUpdate = true;
  }

  if (subControls) subControls.update();
  if (subRenderer && subScene && subCamera) subRenderer.render(subScene, subCamera);

  if (seismicControls) seismicControls.update();
  if (updateSeismicFn) updateSeismicFn(time);
  if (seismicRenderer && seismicScene && seismicCamera) seismicRenderer.render(seismicScene, seismicCamera);
}

// --- MAPA LEAFLET TOPOGRÁFICO ---
let map, markersGroup;

function initMap() {
  map = L.map('leaflet-map').setView([-45.75, -68.15], 11);

  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: © OpenStreetMap, SRTM | Map style: © OpenTopoMap'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);
  renderWellMarkers();
}

function renderWellMarkers() {
  markersGroup.clearLayers();

  state.wells.forEach(well => {
    let color = '#38a169';
    if (well.status === 'Inyector') color = '#00d2ff';
    if (well.status === 'Inactivo' || well.status === 'Abandonado') color = '#e53e3e';

    const marker = L.circleMarker([well.lat, well.lng], {
      radius: 9,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });

    marker.on('click', () => selectWell(well.id));
    marker.bindTooltip(`<b>${well.id}</b><br>${well.status}`, { permanent: false });
    markersGroup.addLayer(marker);
  });
}

function selectWell(id) {
  state.selectedWellId = id;
  const well = state.wells.find(w => w.id === id);
  if (!well) return;

  document.getElementById('well-side-panel').classList.remove('hidden');
  document.getElementById('panel-well-name').innerText = well.id;
  document.getElementById('panel-well-status').innerText = well.status;
  document.getElementById('panel-well-type').innerText = well.type;
  document.getElementById('panel-well-target').innerText = well.target;
  document.getElementById('panel-well-depth').innerText = `${well.depth} m`;
  document.getElementById('panel-well-oil').innerText = `${well.oilRate} BOPD`;
  document.getElementById('panel-well-gas').innerText = `${well.gasRate} m³/d`;
  document.getElementById('panel-well-press').innerText = `${well.bottomPress} psi`;
  document.getElementById('panel-well-cost').innerText = `$${well.cost}/mes`;
  document.getElementById('panel-well-date').innerText = well.date;

  const injCtrl = document.getElementById('injector-controls');
  if (well.status === 'Inyector') {
    injCtrl.classList.remove('hidden');
    document.getElementById('slider-water-rate').value = well.waterInj;
    document.getElementById('val-water-rate').innerText = well.waterInj;
  } else {
    injCtrl.classList.add('hidden');
  }

  updateSubsurfaceWell3D();
}

// --- SIMULACIÓN Y LÓGICA ---
function stepMonth() {
  let totalOil = 0;
  let totalGas = 0;
  let totalInj = 0;
  let totalOpex = 0;

  state.wells.forEach(well => {
    if (well.status === 'Activo') {
      well.oilRate = Math.max(0, Math.round(well.oilRate * 0.985));
      well.gasRate = Math.max(0, Math.round(well.gasRate * 0.985));
      well.bottomPress = Math.max(50, Math.round(well.bottomPress * 0.99));

      totalOil += well.oilRate;
      totalGas += well.gasRate;
    } else if (well.status === 'Inyector') {
      totalInj += well.waterInj;
      state.wells.filter(w => w.status === 'Activo').forEach(w => {
        w.bottomPress = Math.min(300, w.bottomPress + 1);
      });
    }
    if (well.status !== 'Abandonado') {
      totalOpex += well.cost;
    }
  });

  const monthlyOilProd = (totalOil * 30) / 1000000;
  const revenue = (totalOil * 30 * state.oilPrice) / 1000000;
  const opexMM = totalOpex / 1000000;
  state.budget = state.budget + revenue - opexMM;
  state.reserves = Math.max(0, state.reserves - monthlyOilProd);

  state.month++;
  if (state.month > 12) {
    state.month = 1;
    state.year++;
  }

  const dateStr = `${state.year}-M${state.month < 10 ? '0' + state.month : state.month}`;
  state.history.labels.push(dateStr);
  state.history.oil.push(totalOil);
  state.history.gas.push(totalGas);
  state.history.pressure.push(state.wells.reduce((acc, w) => acc + w.bottomPress, 0) / (state.wells.length || 1));
  state.history.budget.push(state.budget);

  updateUI(totalOil, totalGas, totalInj);
}

function updateUI(totalOil = 0, totalGas = 0, totalInj = 0) {
  document.getElementById('kpi-budget').innerText = `$${state.budget.toFixed(1)}M`;
  document.getElementById('kpi-oil-prod').innerText = `${totalOil} BOPD`;
  document.getElementById('kpi-gas-prod').innerText = `${totalGas} m³/d`;
  document.getElementById('kpi-water-inj').innerText = `${totalInj} BWPD`;
  document.getElementById('kpi-time').innerText = `AÑO ${state.year} - M${state.month < 10 ? '0' + state.month : state.month}`;

  document.getElementById('reserves-text').innerText = `${state.reserves.toFixed(1)} MMbbl`;
  document.getElementById('reserves-bar').style.width = `${(state.reserves / 100) * 100}%`;

  if (state.selectedWellId) selectWell(state.selectedWellId);
  renderWellMarkers();
  updateCharts();
}

// --- GRÁFICOS CHART.JS ---
let charts = {};

function initCharts() {
  const chartConfig = (label, color) => ({
    type: 'line',
    data: { labels: state.history.labels, datasets: [{ label, data: [], borderColor: color, tension: 0.2, fill: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#88a0b8' } } } }
  });

  charts.oil = new Chart(document.getElementById('chart-oil'), chartConfig('Producción Petróleo (BOPD)', '#38a169'));
  charts.gas = new Chart(document.getElementById('chart-gas'), chartConfig('Producción Gas (m³/d)', '#3182ce'));
  charts.press = new Chart(document.getElementById('chart-pressure'), chartConfig('Presión Promedio Reservorio (psi)', '#dd6b20'));
  charts.finance = new Chart(document.getElementById('chart-finance'), chartConfig('Presupuesto ($M USD)', '#00d2ff'));
}

function updateCharts() {
  charts.oil.data.labels = state.history.labels;
  charts.oil.data.datasets[0].data = state.history.oil;
  charts.oil.update();

  charts.gas.data.labels = state.history.labels;
  charts.gas.data.datasets[0].data = state.history.gas;
  charts.gas.update();

  charts.press.data.labels = state.history.labels;
  charts.press.data.datasets[0].data = state.history.pressure;
  charts.press.update();

  charts.finance.data.labels = state.history.labels;
  charts.finance.data.datasets[0].data = state.history.budget;
  charts.finance.update();
}

function showToast(title, msg) {
  const toast = document.getElementById('event-toast');
  document.getElementById('toast-title').innerText = title;
  document.getElementById('toast-body').innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// --- EVENTOS E INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSubsurface3D();
  updateSeismicFn = initSeismic3D();
  initCharts();

  window.addEventListener('resize', () => {
    resizeSubsurfaceCanvas();
    resizeSeismicCanvas();
  });

  // Manejo de pestañas con ajuste explícito de tamaño para Three.js
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      
      btn.classList.add('active');
      const targetTab = btn.dataset.tab;
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'tab-subsurface') {
        setTimeout(resizeSubsurfaceCanvas, 50);
      } else if (targetTab === 'tab-seismic') {
        setTimeout(resizeSeismicCanvas, 50);
      } else if (targetTab === 'tab-map' && map) {
        setTimeout(() => map.invalidateSize(), 50);
      }
    });
  });

  // Botones
  document.getElementById('btn-step-month').addEventListener('click', () => stepMonth());
  document.getElementById('btn-step-year').addEventListener('click', () => {
    for (let i = 0; i < 12; i++) stepMonth();
  });

  document.getElementById('btn-start-campaign').addEventListener('click', () => {
    showToast('CAMPAÑA INICIADA', 'Ejecutando simulación proyectada a 10 años...');
    for (let i = 0; i < 120; i++) stepMonth();
  });

  document.getElementById('slider-oil-price').addEventListener('input', (e) => {
    state.oilPrice = parseFloat(e.target.value);
    document.getElementById('oil-price-display').innerText = `$${state.oilPrice}`;
  });

  document.getElementById('slider-water-rate').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-water-rate').innerText = val;
    const well = state.wells.find(w => w.id === state.selectedWellId);
    if (well) well.waterInj = val;
  });

  document.getElementById('btn-open-drill-modal').addEventListener('click', () => {
    document.getElementById('modal-drill').classList.remove('hidden');
  });
  document.getElementById('close-drill-modal').addEventListener('click', () => {
    document.getElementById('modal-drill').classList.add('hidden');
  });

  document.getElementById('form-drill').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('drill-type').value;
    const cost = type === 'No Convencional' ? 5.0 : 2.5;

    if (state.budget < cost) {
      showToast('ERROR', 'Presupuesto insuficiente para perforar.');
      return;
    }

    state.budget -= cost;
    const name = document.getElementById('drill-name').value + (state.wells.length + 1);
    const target = document.getElementById('drill-target').value;

    state.wells.push({
      id: name,
      lat: -45.75 + (Math.random() - 0.5) * 0.1,
      lng: -68.15 + (Math.random() - 0.5) * 0.1,
      type: type,
      target: target,
      depth: target === 'D-129' ? 2800 : 1600,
      status: 'Activo',
      oilRate: type === 'No Convencional' ? 500 : 200,
      gasRate: type === 'No Convencional' ? 12000 : 4000,
      waterInj: 0,
      bottomPress: 220,
      cost: 15000,
      date: `${state.year}-${state.month}`
    });

    document.getElementById('modal-drill').classList.add('hidden');
    showToast('POZO PERFORADO', `Se ha completado la perforación del pozo ${name}.`);
    updateUI();
  });

  document.getElementById('close-well-panel').addEventListener('click', () => {
    document.getElementById('well-side-panel').classList.add('hidden');
  });

  document.getElementById('btn-action-workover').addEventListener('click', () => {
    if (state.budget < 0.5) return showToast('ERROR', 'Fondo insuficiente ($0.5M).');
    const well = state.wells.find(w => w.id === state.selectedWellId);
    if (well && well.status === 'Activo') {
      state.budget -= 0.5;
      well.oilRate += 150;
      well.bottomPress += 40;
      showToast('WORKOVER EXITOSO', `Estimulación completada en ${well.id}.`);
      updateUI();
    }
  });

  document.getElementById('btn-action-convert').addEventListener('click', () => {
    const well = state.wells.find(w => w.id === state.selectedWellId);
    if (well) {
      well.status = 'Inyector';
      well.oilRate = 0;
      well.gasRate = 0;
      well.waterInj = 1000;
      showToast('POZO CONVERTIDO', `${well.id} ahora funciona como inyector.`);
      updateUI();
    }
  });

  document.getElementById('btn-action-abandon').addEventListener('click', () => {
    const well = state.wells.find(w => w.id === state.selectedWellId);
    if (well) {
      well.status = 'Abandonado';
      well.oilRate = 0;
      well.gasRate = 0;
      well.waterInj = 0;
      showToast('POZO ABANDONADO', `${well.id} ha sido clausurado.`);
      updateUI();
    }
  });

  stepMonth();
  requestAnimationFrame(animate);
});