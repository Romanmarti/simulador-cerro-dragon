/**
 * RECUPERANDO LA CUENCA - Simulador Técnico
 * Estado Global y Control de Navegación
 */

// 1. ESTADO GLOBAL DEL JUEGO
const gameState = {
  playerName: "",
  gender: "",
  epp: [],
  budget: 1500000, // Presupuesto inicial incrementado ($1.5M USD)
  selectedZone: null,
  selectedMethod: null,
  explorationHistory: [],
  drillingCost: 0,
  currentScreen: "startScreen"
};

// Datos de Zonas (Bloques)
const ZONES_DATA = {
  aguarague: {
    name: "Yacimiento Aguaragüe",
    depth: 4200,
    drillingCost: 1200000,
    target: "Gas y Condensado (Formación Huamampampa)"
  },
  ramos: {
    name: "Área Ramos",
    depth: 2800,
    drillingCost: 850000,
    target: "Gas Natural (Formación Tupambi)"
  },
  acambuco: {
    name: "Bloque Acambuco",
    depth: 5100,
    drillingCost: 1800000,
    target: "Gas de Alta Presión (Formación Santa Rosa)"
  }
};

// Datos de Métodos Prospectivos
const METHODS_DATA = {
  geoquimica: {
    name: "Geoquímica de Superficie",
    cost: 30000,
    report: "Se detectaron anomalias de hidrocarburos ligeros (C1-C4) en muestras de suelo. Confirma la existencia de un sistema petrolero activo."
  },
  gravimetria: {
    name: "Gravimetría / Magnetometría",
    cost: 50000,
    report: "El mapa de anomalías de gravedad del basamento sugiere un alto estructural promisor delimitado por fallas profundas."
  },
  sismica2d: {
    name: "Sísmica 2D",
    cost: 100000,
    report: "Cortes 2D revelan una clara estructura anticlinal. Se observa una probable falla sellante en el flanco este."
  },
  sismica3d: {
    name: "Sísmica 3D",
    cost: 200000,
    report: "Cubo 3D de alta resolución finalizado. Se identifica un 'Bright Spot' claro con cierre estructural definido. Precisión óptima para definir la locación del pozo exploratorio."
  }
};

// 2. CONTROL DE NAVEGACIÓN
const Navigation = {
  screens: {
    start: "startScreen",
    operation: "operationScreen",
    character: "characterScreen",
    equipment: "equipmentScreen",
    exploration: "explorationScreen",
    drilling: "drillingScreen",
    production: "productionScreen",
    final: "finalScreen"
  },

  goTo(screenId) {
    const currentElem = document.getElementById(gameState.currentScreen);
    const targetElem = document.getElementById(screenId);

    if (!targetElem) {
      console.warn(`La pantalla "${screenId}" aún no está implementada.`);
      return;
    }

    if (currentElem) {
      currentElem.classList.remove("active");
    }

    targetElem.classList.add("active");
    gameState.currentScreen = screenId;
  }
};

// 3. TOAST Y HUD
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}

function updateBudgetUI() {
  const hudBudget = document.getElementById("hudBudget");
  if (hudBudget) {
    hudBudget.textContent = `$${gameState.budget.toLocaleString()} USD`;
  }
}

// 4. INICIALIZACIÓN Y EVENTOS
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar iconos Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  const btnStart = document.getElementById("btnStart");
  const btnContinue = document.getElementById("btnContinue");
  const btnSaveCharacter = document.getElementById("btnSaveCharacter");
  const btnEquipmentContinue = document.getElementById("btnEquipmentContinue");
  const btnRunSeismic = document.getElementById("btnRunSeismic");
  const btnGoToDrilling = document.getElementById("btnGoToDrilling");

  if (btnStart) {
    btnStart.addEventListener("click", () => Navigation.goTo(Navigation.screens.operation));
  }

  if (btnContinue) {
    btnContinue.addEventListener("click", () => Navigation.goTo(Navigation.screens.character));
  }

  if (btnSaveCharacter) {
    btnSaveCharacter.addEventListener("click", () => {
      const nameInput = document.getElementById("playerName");
      const genderInput = document.querySelector('input[name="gender"]:checked');
      const eppCheckboxes = document.querySelectorAll('input[name="epp"]:checked');

      if (!nameInput || !nameInput.value.trim()) {
        showToast("Por favor, ingresá el nombre del técnico/a.");
        return;
      }
      if (!genderInput) {
        showToast("Por favor, seleccioná tu identidad/género.");
        return;
      }
      if (eppCheckboxes.length < 6) {
        showToast("¡Atención! Debés colocar todo el EPP obligatorio.");
        return;
      }

      gameState.playerName = nameInput.value.trim();
      gameState.gender = genderInput.value;
      gameState.epp = Array.from(eppCheckboxes).map(cb => cb.value);

      const displayTitle = document.getElementById("displayPlayerName");
      const displayDetails = document.getElementById("displayPlayerDetails");
      
      if (displayTitle) displayTitle.textContent = `TÉCNICO/A: ${gameState.playerName.toUpperCase()}`;
      if (displayDetails) displayDetails.textContent = `Género: ${gameState.gender} | EPP Verificado (${gameState.epp.length}/6 items)`;

      showToast(`¡Bienvenido/a, ${gameState.playerName}! Equipamiento verificado.`);
      Navigation.goTo(Navigation.screens.equipment);
    });
  }

  if (btnEquipmentContinue) {
    btnEquipmentContinue.addEventListener("click", () => {
      updateBudgetUI();
      Navigation.goTo(Navigation.screens.exploration);
    });
  }

  // Selección de Zona
  const zoneCards = document.querySelectorAll(".zone-card");
  zoneCards.forEach(card => {
    card.addEventListener("click", () => {
      zoneCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      gameState.selectedZone = ZONES_DATA[card.dataset.zone];
      checkActionState();
    });
  });

  // Selección de Método Prospectivo
  const methodCards = document.querySelectorAll(".method-card");
  methodCards.forEach(card => {
    card.addEventListener("click", () => {
      methodCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      gameState.selectedMethod = METHODS_DATA[card.dataset.method];
      checkActionState();
    });
  });

  function checkActionState() {
    if (btnRunSeismic) {
      btnRunSeismic.disabled = !(gameState.selectedZone && gameState.selectedMethod);
    }
  }

  // Ejecutar Estudio
  if (btnRunSeismic) {
    btnRunSeismic.addEventListener("click", () => {
      const zone = gameState.selectedZone;
      const method = gameState.selectedMethod;

      if (gameState.budget < method.cost) {
        showToast("Presupuesto insuficiente para este método prospectivo.");
        return;
      }

      gameState.budget -= method.cost;
      gameState.explorationHistory.push({ zone: zone.name, method: method.name });
      updateBudgetUI();

      const seismicResult = document.getElementById("seismicResult");
      const seismicTitle = document.getElementById("seismicTitle");
      const seismicDetails = document.getElementById("seismicDetails");

      if (seismicResult && seismicTitle && seismicDetails) {
        seismicTitle.textContent = `REPORTE: ${method.name.toUpperCase()} - ${zone.name.toUpperCase()}`;
        seismicDetails.textContent = `${method.report} | Objetivo: ${zone.target}. Costo estimado de Perforación: $${zone.drillingCost.toLocaleString()} USD.`;
        seismicResult.classList.remove("hidden");
      }

      showToast(`Estudio ejecutado. Presupuesto restado: -$${method.cost.toLocaleString()} USD`);

      btnRunSeismic.classList.add("hidden");
      if (btnGoToDrilling) {
        btnGoToDrilling.classList.remove("hidden");
      }
    });
  }

  // Avanzar a Perforación
  if (btnGoToDrilling) {
    btnGoToDrilling.addEventListener("click", () => {
      showToast("Comienza la Etapa 3: Perforación del Pozo Exploratorio.");
    });
  }
});