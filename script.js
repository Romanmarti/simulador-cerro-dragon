/**
 * RECUPERANDO LA CUENCA - Simulador Técnico
 * Estado Global y Control de Navegación
 */

// 1. ESTADO GLOBAL DEL JUEGO
const gameState = {
  playerName: "",
  gender: "",
  budget: 0,
  exploration: [],
  selectedZone: null,
  selectedWell: null,
  production: 0,
  money: 0,
  currentScreen: "startScreen"
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

// 4. INICIALIZACIÓN Y EVENTOS
document.addEventListener("DOMContentLoaded", () => {
  const btnStart = document.getElementById("btnStart");
  const btnContinue = document.getElementById("btnContinue");

  if (btnStart) {
    btnStart.addEventListener("click", () => {
      Navigation.goTo(Navigation.screens.operation);
    });
  }

  if (btnContinue) {
    btnContinue.addEventListener("click", () => {
      showToast("La creación del personaje será la próxima etapa.");
    });
  }
});