/**
 * RECUPERANDO LA CUENCA - Simulador Técnico
 * Estado Global y Control de Navegación
 */

// 1. ESTADO GLOBAL DEL JUEGO
const gameState = {
  playerName: "",
  gender: "",
  epp: [],
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
  const btnSaveCharacter = document.getElementById("btnSaveCharacter");

  // Evento: Click en COMENZAR
  if (btnStart) {
    btnStart.addEventListener("click", () => {
      Navigation.goTo(Navigation.screens.operation);
    });
  }

  // Evento: Click en CONTINUAR (Pasa a la creación del personaje)
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

      // Validación 1: Nombre
      if (!nameInput.value.trim()) {
        showToast("Por favor, ingresá el nombre del técnico/a.");
        nameInput.focus();
        return;
      }

      // Validación 2: Género
      if (!genderInput) {
        showToast("Por favor, seleccioná tu identidad/género.");
        return;
      }

      // Validación 3: EPP Completo
      if (eppCheckboxes.length < totalEppAvailable) {
        showToast("¡Atención! Para ingresar al yacimiento debés colocar todo el EPP obligatorio.");
        return;
      }

      // Guardar en el Estado Global
      gameState.playerName = nameInput.value.trim();
      gameState.gender = genderInput.value;
      gameState.epp = Array.from(eppCheckboxes).map(cb => cb.value);

      showToast(`¡Bienvenido/a, ${gameState.playerName}! Equipamiento verificado.`);
      
      // La siguiente pantalla (equipmentScreen) se llamará en la próxima etapa
      console.log("Estado actualizado:", gameState);
    });
  }
});