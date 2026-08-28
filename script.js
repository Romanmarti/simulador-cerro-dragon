/**
 * RECUPERANDO LA CUENCA - Simulador Técnico
 * Estado Global y Control de Navegación
 */

// 1. ESTADO GLOBAL DEL JUEGO
const gameState = {
  playerName: "",
  gender: "",
  epp: [],
  budget: 500000, // Presupuesto inicial en USD
  exploration: [],
  selectedZone: null,
  selectedWell: null,
  production: 0,
  money: 0,
  currentScreen: "startScreen"
};

// Configuración de las zonas exploratorias
const ZONES_DATA = {
  aguarague: {
    name: "Yacimiento Aguaragüe",
    cost: 120000,
    risk: "Medio",
    report: "Análisis sísmico exitoso. Se detecta una trampa estructural anticlinal en la Formación Huamampampa con alta probabilidad de acumulación de gas natural y condensado."
  },
  ramos: {
    name: "Área Ramos",
    cost: 180000,
    risk: "Bajo",
    report: "Sismología 3D de alta resolución completada. Se confirman horizontes productivos tradicionales con excelente permeabilidad y bajo riesgo geológico."
  },
  acambuco: {
    name: "Bloque Acambuco",
    cost: 150000,
    risk: "Alto",
    report: "Estructuras profundas identificadas. Presenta alta anomalía de amplitud sísmica (Bright Spot), lo que sugiere reservorio de alto impacto pero con presión extrema."
  }
};

// 2. SISTEMA DE GESTIÓN DE PANTALLAS (Router/Scene Controller)
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

// 3. SISTEMA DE NOTIFICACIONES / TOAST
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}

// Actualizar visualización del presupuesto
function updateBudgetUI() {
  const hudBudget = document.getElementById("hudBudget");
  if (hudBudget) {
    hudBudget.textContent = `$${gameState.budget.toLocaleString()} USD`;
  }
}

// 4. INICIALIZACIÓN Y EVENTOS
document.addEventListener("DOMContentLoaded", () => {
  const btnStart = document.getElementById("btnStart");
  const btnContinue = document.getElementById("btnContinue");
  const btnSaveCharacter = document.getElementById("btnSaveCharacter");
  const btnEquipmentContinue = document.getElementById("btnEquipmentContinue");
  const btnRunSeismic = document.getElementById("btnRunSeismic");
  const btnGoToDrilling = document.getElementById("btnGoToDrilling");

  // Evento: Click en COMENZAR
  if (btnStart) {
    btnStart.addEventListener("click", () => {
      Navigation.goTo(Navigation.screens.operation);
    });
  }

  // Evento: Click en CONTINUAR
  if (btnContinue) {
    btnContinue.addEventListener("click", () => {
      Navigation.goTo(Navigation.screens.character);
    });
  }

  // Evento: Guardar Personaje y EPP
  if (btnSaveCharacter) {
    btnSaveCharacter.addEventListener("click", () => {
      const nameInput = document.getElementById("playerName");
      const genderInput = document.querySelector('input[name="gender"]:checked');
      const eppCheckboxes = document.querySelectorAll('input[name="epp"]:checked');
      const totalEppAvailable = document.querySelectorAll('input[name="epp"]').length;

      if (!nameInput || !nameInput.value.trim()) {
        showToast("Por favor, ingresá el nombre del técnico/a.");
        if (nameInput) nameInput.focus();
        return;
      }

      if (!genderInput) {
        showToast("Por favor, seleccioná tu identidad/género.");
        return;
      }

      if (eppCheckboxes.length < totalEppAvailable) {
        showToast("¡Atención! Para ingresar al yacimiento debés colocar todo el EPP obligatorio.");
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

  // Evento: Continuar a Exploración
  if (btnEquipmentContinue) {
    btnEquipmentContinue.addEventListener("click", () => {
      updateBudgetUI();
      Navigation.goTo(Navigation.screens.exploration);
    });
  }

  // Selección de Tarjetas de Zona
  const zoneCards = document.querySelectorAll(".zone-card");
  zoneCards.forEach(card => {
    card.addEventListener("click", () => {
      zoneCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      const zoneKey = card.dataset.zone;
      gameState.selectedZone = ZONES_DATA[zoneKey];

      if (btnRunSeismic) {
        btnRunSeismic.disabled = false;
      }
    });
  });

  // Evento: Realizar Estudio Sísmico
  if (btnRunSeismic) {
    btnRunSeismic.addEventListener("click", () => {
      if (!gameState.selectedZone) {
        showToast("Por favor, seleccioná un área primero.");
        return;
      }

      const zone = gameState.selectedZone;

      if (gameState.budget < zone.cost) {
        showToast("Presupuesto insuficiente para realizar el estudio sísmico en esta zona.");
        return;
      }

      // Descontar costo y guardar exploración
      gameState.budget -= zone.cost;
      gameState.exploration.push(zone.name);
      updateBudgetUI();

      // Mostrar Reporte Sísmico
      const seismicResult = document.getElementById("seismicResult");
      const seismicTitle = document.getElementById("seismicTitle");
      const seismicDetails = document.getElementById("seismicDetails");

      if (seismicResult && seismicTitle && seismicDetails) {
        seismicTitle.textContent = `REPORTE SÍSMICO 3D - ${zone.name.toUpperCase()}`;
        seismicDetails.textContent = zone.report;
        seismicResult.classList.remove("hidden");
      }

      showToast(`Estudio realizado en ${zone.name}. Presupuesto actualizado.`);

      // Habilitar siguiente etapa
      btnRunSeismic.classList.add("hidden");
      if (btnGoToDrilling) {
        btnGoToDrilling.classList.remove("hidden");
      }
    });
  }

  // Evento: Ir a Perforación (Provisional)
  if (btnGoToDrilling) {
    btnGoToDrilling.addEventListener("click", () => {
      showToast("La etapa de Perforación de Pozos será el próximo paso.");
    });
  }
});