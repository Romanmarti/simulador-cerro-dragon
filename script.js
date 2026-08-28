/**
 * RECUPERANDO LA CUENCA - Simulador Técnico
 * Sistema de Probabilidad y Pantalla de Game Over
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
  wellDrilled: false,
  wellSuccess: false,
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
    gameOver: "gameOverScreen",
    production: "productionScreen",
    final: "finalScreen"
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
  const hudBudget = document.getElementById("hudBudget");
  const hudPoS = document.getElementById("hudPoS");

  if (hudBudget) hudBudget.textContent = `$${gameState.budget.toLocaleString()} USD`;
  if (hudPoS) hudPoS.textContent = `${gameState.pos}%`;
}

function resetGame() {
  gameState.budget = 2000000;
  gameState.selectedZone = null;
  gameState.selectedMethod = null;
  gameState.executedMethods = [];
  gameState.pos = 0;
  gameState.wellDrilled = false;
  gameState.wellSuccess = false;

  document.querySelectorAll(".zone-card").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".method-card").forEach(c => c.classList.remove("selected", "completed"));
  
  const seismicResult = document.getElementById("seismicResult");
  if (seismicResult) seismicResult.classList.add("hidden");

  updateHUD();
  Navigation.goTo(Navigation.screens.exploration);
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();

  const btnStart = document.getElementById("btnStart");
  const btnContinue = document.getElementById("btnContinue");
  const btnSaveCharacter = document.getElementById("btnSaveCharacter");
  const btnEquipmentContinue = document.getElementById("btnEquipmentContinue");
  const btnRunStudy = document.getElementById("btnRunStudy");
  const btnDrillWell = document.getElementById("btnDrillWell");
  const btnRestart = document.getElementById("btnRestart");

  if (btnStart) btnStart.addEventListener("click", () => Navigation.goTo(Navigation.screens.operation));
  if (btnContinue) btnContinue.addEventListener("click", () => Navigation.goTo(Navigation.screens.character));

  if (btnSaveCharacter) {
    btnSaveCharacter.addEventListener("click", () => {
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
  }

  if (btnEquipmentContinue) {
    btnEquipmentContinue.addEventListener("click", () => {
      updateHUD();
      Navigation.goTo(Navigation.screens.exploration);
    });
  }

  // Selección de Zona
  document.querySelectorAll(".zone-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".zone-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      gameState.selectedZone = ZONES_DATA[card.dataset.zone];
      gameState.executedMethods = [];
      gameState.pos = gameState.selectedZone.basePoS;

      document.querySelectorAll(".method-card").forEach(mc => mc.classList.remove("completed", "selected"));
      gameState.selectedMethod = null;

      updateHUD();
      checkActionButtons();
    });
  });

  // Selección de Método Prospectivo
  document.querySelectorAll(".method-card").forEach(card => {
    card.addEventListener("click", () => {
      if (card.classList.contains("completed")) return;
      document.querySelectorAll(".method-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      gameState.selectedMethod = METHODS_DATA[card.dataset.method];
      checkActionButtons();
    });
  });

  function checkActionButtons() {
    if (btnRunStudy) btnRunStudy.disabled = !(gameState.selectedZone && gameState.selectedMethod);
    if (btnDrillWell) btnDrillWell.disabled = !(gameState.selectedZone && gameState.budget >= gameState.selectedZone.drillingCost);
  }

  // Ejecutar Estudio
  if (btnRunStudy) {
    btnRunStudy.addEventListener("click", () => {
      const method = gameState.selectedMethod;
      if (gameState.budget < method.cost) return showToast("Presupuesto insuficiente.");

      gameState.budget -= method.cost;
      gameState.pos = Math.min(95, gameState.pos + method.posBonus);
      gameState.executedMethods.push(method.key);

      const activeCard = document.querySelector(`.method-card[data-method="${method.key}"]`);
      if (activeCard) {
        activeCard.classList.remove("selected");
        activeCard.classList.add("completed");
      }
      gameState.selectedMethod = null;

      updateHUD();
      checkActionButtons();

      const seismicResult = document.getElementById("seismicResult");
      if (seismicResult) {
        seismicResult.className = "seismic-result";
        document.getElementById("seismicTitle").textContent = `ESTUDIO: ${method.name.toUpperCase()}`;
        document.getElementById("seismicDetails").textContent = `${method.report} Probabilidad actual de éxito: ${gameState.pos}%.`;
        seismicResult.classList.remove("hidden");
      }
    });
  }

  // Perforar Pozo y Verificación de Game Over
  if (btnDrillWell) {
    btnDrillWell.addEventListener("click", () => {
      const zone = gameState.selectedZone;
      if (gameState.budget < zone.drillingCost) return showToast("Presupuesto insuficiente.");

      gameState.budget -= zone.drillingCost;
      const randomNumber = Math.floor(Math.random() * 100) + 1;
      const isSuccess = randomNumber <= gameState.pos;

      updateHUD();

      if (isSuccess) {
        const seismicResult = document.getElementById("seismicResult");
        seismicResult.className = "seismic-result success";
        document.getElementById("seismicTitle").textContent = "¡DESCUBRIMIENTO EXITOSO!";
        document.getElementById("seismicDetails").textContent = `Se halló reservorio productivo en ${zone.name}. ¡Siguiente etapa disponible!`;
        seismicResult.classList.remove("hidden");
        showToast("¡Éxito en la perforación!", 4000);
      } else {
        // DISPARAR GAME OVER SI ES POZO SECO
        document.getElementById("gameOverDetails").textContent = 
          `Se perforó en ${zone.name} con un ${gameState.pos}% de probabilidad de éxito. El pozo resultó seco y se perdieron $${zone.drillingCost.toLocaleString()} USD.`;
        
        Navigation.goTo(Navigation.screens.gameOver);
      }
    });
  }

  // Botón Reintentar
  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      resetGame();
    });
  }
});