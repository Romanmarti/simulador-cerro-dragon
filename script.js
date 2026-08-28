/**
 * RECUPERANDO LA CUENCA - Simulador Técnico Educativo
 * Mapa JPG con Nodos Interactivos, Visor 3D Ampliado / Sketchfab y Bucle de Ingresos
 */

const gameState = {
  playerName: "",
  gender: "",
  epp: [],
  budget: 2000000,
  selectedZone: null,
  selectedMethod: null,
  executedMethods: [],
  pos: 0,
  
  // Mapa de 5 Pozos
  selectedWellId: null,
  drilledWellsCount: 0,
  incomePerSecond: 0,
  wellsData: {
    1: { name: "Pozo N-01 (Formación Huamampampa)", depth: "3,800m", cost: 300000, income: 1500, drilled: false },
    2: { name: "Pozo N-02 (Formación Los Monos)", depth: "2,900m", cost: 450000, income: 2500, drilled: false },
    3: { name: "Pozo N-03 (Formación Santa Rosa)", depth: "4,200m", cost: 600000, income: 4000, drilled: false },
    4: { name: "Pozo N-04 (Formación Icla Deep)", depth: "4,600m", cost: 800000, income: 6500, drilled: false },
    5: { name: "Pozo N-05 (Alto Tarija)", depth: "3,400m", cost: 1000000, income: 10000, drilled: false }
  },
  upgrades: {
    trepan: false,
    pump: false
  },
  
  currentScreen: "startScreen"
};

const ZONES_DATA = {
  ramos: { key: "ramos", name: "Área Ramos", basePoS: 30, drillingCost: 800000 },
  aguarague: { key: "aguarague", name: "Yacimiento Aguaragüe", basePoS: 20, drillingCost: 1200000 },
  acambuco: { key: "acambuco", name: "Bloque Acambuco", basePoS: 10, drillingCost: 1500000 }
};

const METHODS_DATA = {
  geoquimica: { key: "geoquimica", name: "Geoquímica de Superficie", cost: 30000, posBonus: 10, report: "Microfiltraciones confirmadas (+10% PoS)." },
  gravimetria: { key: "gravimetria", name: "Gravimetría / Magnetometría", cost: 50000, posBonus: 15, report: "Basamento mapeado (+15% PoS)." },
  sismica2d: { key: "sismica2d", name: "Sísmica 2D", cost: 100000, posBonus: 25, report: "Trampa estructural vista (+25% PoS)." },
  sismica3d: { key: "sismica3d", name: "Sísmica 3D", cost: 200000, posBonus: 40, report: "Cubo 3D de alta precisión (+40% PoS)." }
};

const Navigation = {
  screens: {
    start: "startScreen",
    operation: "operationScreen",
    character: "characterScreen",
    equipment: "equipmentScreen",
    exploration: "explorationScreen",
    fieldMap: "fieldMapScreen",
    gameOver: "gameOverScreen",
    victory: "victoryScreen"
  },

  goTo(screenId) {
    const currentElem = document.getElementById(gameState.currentScreen);
    const targetElem = document.getElementById(screenId);

    if (currentElem) currentElem.classList.remove("active");
    if (targetElem) targetElem.classList.add("active");
    gameState.currentScreen = screenId;
  }
};

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), duration);
}

function updateHUD() {
  document.getElementById("hudBudget").textContent = `$${gameState.budget.toLocaleString()} USD`;
  document.getElementById("hudPoS").textContent = `${gameState.pos}%`;
  
  const mapBudget = document.getElementById("mapBudget");
  const mapIncome = document.getElementById("mapIncome");
  const mapWellsProgress = document.getElementById("mapWellsProgress");

  if (mapBudget) mapBudget.textContent = `$${gameState.budget.toLocaleString()} USD`;
  if (mapIncome) mapIncome.textContent = `+$${gameState.incomePerSecond.toLocaleString()} USD/seg`;
  if (mapWellsProgress) mapWellsProgress.textContent = `${gameState.drilledWellsCount} / 5`;
}

// Bucle de Ingresos Pasivos por Segundo
setInterval(() => {
  if (gameState.currentScreen === "fieldMapScreen" && gameState.incomePerSecond > 0) {
    gameState.budget += gameState.incomePerSecond;
    updateHUD();
    updateDrillButtonState();
  }
}, 1000);

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();

  // Navegación
  document.getElementById("btnStart").addEventListener("click", () => Navigation.goTo(Navigation.screens.operation));
  document.getElementById("btnContinue").addEventListener("click", () => Navigation.goTo(Navigation.screens.character));

  // Crear Personaje
  document.getElementById("btnSaveCharacter").addEventListener("click", () => {
    const nameInput = document.getElementById("playerName");
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const eppCheckboxes = document.querySelectorAll('input[name="epp"]:checked');

    if (!nameInput || !nameInput.value.trim()) return showToast("Ingresá el nombre.");
    if (!genderInput) return showToast("Seleccioná el género.");
    if (eppCheckboxes.length < 6) return showToast("Debés colocar todo el EPP.");

    gameState.playerName = nameInput.value.trim();
    gameState.gender = genderInput.value;
    gameState.epp = Array.from(eppCheckboxes).map(cb => cb.value);

    document.getElementById("displayPlayerName").textContent = `TÉCNICO/A: ${gameState.playerName.toUpperCase()}`;
    document.getElementById("displayPlayerDetails").textContent = `Género: ${gameState.gender} | EPP Verificado (${gameState.epp.length}/6 items)`;

    Navigation.goTo(Navigation.screens.equipment);
  });

  document.getElementById("btnEquipmentContinue").addEventListener("click", () => {
    updateHUD();
    Navigation.goTo(Navigation.screens.exploration);
  });

  // Exploración
  document.querySelectorAll(".zone-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".zone-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      gameState.selectedZone = ZONES_DATA[card.dataset.zone];
      gameState.pos = gameState.selectedZone.basePoS;
      updateHUD();
      checkExplorationButtons();
    });
  });

  document.querySelectorAll(".method-card").forEach(card => {
    card.addEventListener("click", () => {
      if (card.classList.contains("completed")) return;
      document.querySelectorAll(".method-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      gameState.selectedMethod = METHODS_DATA[card.dataset.method];
      checkExplorationButtons();
    });
  });

  function checkExplorationButtons() {
    const btnRunStudy = document.getElementById("btnRunStudy");
    const btnDrillWell = document.getElementById("btnDrillWell");
    if (btnRunStudy) btnRunStudy.disabled = !(gameState.selectedZone && gameState.selectedMethod);
    if (btnDrillWell) btnDrillWell.disabled = !(gameState.selectedZone && gameState.budget >= gameState.selectedZone.drillingCost);
  }

  document.getElementById("btnRunStudy").addEventListener("click", () => {
    const method = gameState.selectedMethod;
    if (gameState.budget < method.cost) return showToast("Presupuesto insuficiente.");

    gameState.budget -= method.cost;
    gameState.pos = Math.min(95, gameState.pos + method.posBonus);

    const activeCard = document.querySelector(`.method-card[data-method="${method.key}"]`);
    if (activeCard) {
      activeCard.classList.remove("selected");
      activeCard.classList.add("completed");
    }
    gameState.selectedMethod = null;

    updateHUD();
    checkExplorationButtons();

    const seismicResult = document.getElementById("seismicResult");
    seismicResult.className = "seismic-result";
    document.getElementById("seismicTitle").textContent = `ESTUDIO: ${method.name.toUpperCase()}`;
    document.getElementById("seismicDetails").textContent = `${method.report} Probabilidad actual de éxito: ${gameState.pos}%.`;
    seismicResult.classList.remove("hidden");
  });

  document.getElementById("btnDrillWell").addEventListener("click", () => {
    const zone = gameState.selectedZone;
    if (gameState.budget < zone.drillingCost) return showToast("Presupuesto insuficiente.");

    gameState.budget -= zone.drillingCost;
    const isSuccess = (Math.floor(Math.random() * 100) + 1) <= gameState.pos;

    updateHUD();

    if (isSuccess) {
      showToast("¡Descubrimiento Exitoso! Entrando al mapa de producción...", 4000);
      Navigation.goTo(Navigation.screens.fieldMap);
    } else {
      document.getElementById("gameOverDetails").textContent = 
        `Se perforó en ${zone.name} con un ${gameState.pos}% de certeza. El pozo resultó seco y se perdieron $${zone.drillingCost.toLocaleString()} USD.`;
      Navigation.goTo(Navigation.screens.gameOver);
    }
  });

  // Interacción Mapa con Imagen JPG y Nodos
  document.querySelectorAll(".well-marker").forEach(marker => {
    marker.addEventListener("click", () => {
      document.querySelectorAll(".well-marker").forEach(m => m.classList.remove("selected"));
      
      const wellId = marker.dataset.well;
      gameState.selectedWellId = wellId;
      const well = gameState.wellsData[wellId];

      marker.classList.add("selected");

      let actualCost = well.cost;
      if (gameState.upgrades.trepan) actualCost *= 0.8;

      document.querySelector(".info-tag").textContent = well.name.toUpperCase();
      document.getElementById("wellInfoText").textContent = 
        `Profundidad: ${well.depth} | Estado: ${well.drilled ? "EN PRODUCCIÓN" : "DISPONIBLE PARA PERFORAR"} | Costo: $${actualCost.toLocaleString()} USD | Rendimiento: +${well.income.toLocaleString()} USD/s.`;

      updateDrillButtonState();
    });
  });

  function updateDrillButtonState() {
    const btnDrill = document.getElementById("btnDrillSelectedWell");
    if (!gameState.selectedWellId) {
      btnDrill.disabled = true;
      btnDrill.querySelector("span").textContent = "SELECCIONÁ UN POZO";
      return;
    }

    const well = gameState.wellsData[gameState.selectedWellId];
    let actualCost = well.cost;
    if (gameState.upgrades.trepan) actualCost *= 0.8;

    if (well.drilled) {
      btnDrill.disabled = true;
      btnDrill.querySelector("span").textContent = "POZO YA EN PRODUCCIÓN";
    } else {
      btnDrill.disabled = gameState.budget < actualCost;
      btnDrill.querySelector("span").textContent = `PERFORAR POZO ($${actualCost.toLocaleString()} USD)`;
    }
  }

  // Perforar Pozo Seleccionado
  document.getElementById("btnDrillSelectedWell").addEventListener("click", () => {
    if (!gameState.selectedWellId) return;

    const well = gameState.wellsData[gameState.selectedWellId];
    let actualCost = well.cost;
    if (gameState.upgrades.trepan) actualCost *= 0.8;

    if (gameState.budget < actualCost) return showToast("Fondos insuficientes.");

    gameState.budget -= actualCost;
    well.drilled = true;
    gameState.drilledWellsCount++;

    let addedIncome = well.income;
    if (gameState.upgrades.pump) addedIncome *= 1.5;

    gameState.incomePerSecond += addedIncome;

    const activeMarker = document.querySelector(`.well-marker[data-well="${gameState.selectedWellId}"]`);
    if (activeMarker) {
      activeMarker.classList.remove("selected");
      activeMarker.classList.add("drilled");
    }

    showToast(`¡Pozo N-0${gameState.selectedWellId} integrado a la red de producción!`);
    updateHUD();
    updateDrillButtonState();

    if (gameState.drilledWellsCount >= 5) {
      setTimeout(() => Navigation.goTo(Navigation.screens.victory), 1500);
    }
  });

  // Mejoras
  document.getElementById("upgTrepan").addEventListener("click", function() {
    if (gameState.upgrades.trepan) return;
    if (gameState.budget < 150000) return showToast("Fondos insuficientes.");

    gameState.budget -= 150000;
    gameState.upgrades.trepan = true;
    this.classList.add("bought");
    showToast("Trépano PDC de diamante equipado: Perforación 20% más barata.");
    updateHUD();
    updateDrillButtonState();
  });

  document.getElementById("upgPump").addEventListener("click", function() {
    if (gameState.upgrades.pump) return;
    if (gameState.budget < 250000) return showToast("Fondos insuficientes.");

    gameState.budget -= 250000;
    gameState.upgrades.pump = true;
    gameState.incomePerSecond = Math.round(gameState.incomePerSecond * 1.5);
    this.classList.add("bought");
    showToast("Variador de Frecuencia VFD instalado: Producción +50%.");
    updateHUD();
  });

  // Modal 3D / Sketchfab
  const modal3D = document.getElementById("modal3D");
  document.getElementById("btnOpen3DModal").addEventListener("click", () => {
    modal3D.classList.remove("hidden");
    
    // Si no pegaste un iframe de Sketchfab dentro del contenedor, se inicializa el modelo Three.js básico
    const container = document.getElementById("canvas3DContainer");
    if (!container.querySelector("iframe") && container.children.length === 0) {
      initThreeJS();
    }
  });

  document.getElementById("btnClose3DModal").addEventListener("click", () => {
    modal3D.classList.add("hidden");
  });

  // Reinicios
  document.getElementById("btnRestart").addEventListener("click", resetGame);
  document.getElementById("btnVictoryRestart").addEventListener("click", resetGame);
});

function resetGame() {
  gameState.budget = 2000000;
  gameState.selectedZone = null;
  gameState.selectedMethod = null;
  gameState.executedMethods = [];
  gameState.pos = 0;
  gameState.selectedWellId = null;
  gameState.drilledWellsCount = 0;
  gameState.incomePerSecond = 0;
  gameState.upgrades.trepan = false;
  gameState.upgrades.pump = false;

  for (let key in gameState.wellsData) {
    gameState.wellsData[key].drilled = false;
  }

  document.querySelectorAll(".well-marker").forEach(marker => {
    marker.classList.remove("drilled", "selected");
  });

  document.querySelectorAll(".upgrade-card").forEach(c => c.classList.remove("bought"));
  document.querySelectorAll(".zone-card").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".method-card").forEach(c => c.classList.remove("selected", "completed"));

  document.querySelector(".info-tag").textContent = "SELECCIONÁ UN POZO EN EL MAPA";
  document.getElementById("wellInfoText").textContent = "Hacé clic sobre las miras del mapa para ver los datos geológicos y perforar.";

  updateHUD();
  Navigation.goTo(Navigation.screens.exploration);
}

// Visualizador 3D Three.js (Fallback si no usas Iframe de Sketchfab)
let scene, camera, renderer, pumpJackGroup;

function initThreeJS() {
  const container = document.getElementById("canvas3DContainer");
  if (container.children.length > 0) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080a);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(6, 4, 8);
  camera.lookAt(0, 1, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x00e5ff, 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  pumpJackGroup = new THREE.Group();

  const baseGeo = new THREE.BoxGeometry(4.5, 0.3, 2.2);
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  pumpJackGroup.add(baseMesh);

  const towerGeo = new THREE.ConeGeometry(1.3, 3.2, 4);
  const towerMat = new THREE.MeshLambertMaterial({ color: 0xe6b800, flatShading: true });
  const towerMesh = new THREE.Mesh(towerGeo, towerMat);
  towerMesh.position.set(0, 1.6, 0);
  pumpJackGroup.add(towerMesh);

  const beamGeo = new THREE.BoxGeometry(4, 0.4, 0.4);
  const beamMat = new THREE.MeshLambertMaterial({ color: 0x00e5ff, flatShading: true });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.position.set(0, 3.2, 0);
  pumpJackGroup.add(beamMesh);

  scene.add(pumpJackGroup);

  function animate() {
    requestAnimationFrame(animate);
    if (pumpJackGroup) pumpJackGroup.rotation.y += 0.008;
    renderer.render(scene, camera);
  }
  animate();
}