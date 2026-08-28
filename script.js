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
  const btnEquipmentContinue = document.getElementById("btnEquipmentContinue");

  // Evento: Click en COMENZAR (Pasa a Nueva Operación)
  if (btnStart) {
    btnStart.addEventListener("click", () => {
      Navigation.goTo(Navigation.screens.operation);
    });
  }

  // Evento: Click en CONTINUAR (Pasa de Nueva Operación a Creación de Personaje)
  if (btnContinue) {
    btnContinue.addEventListener("click", () => {
      Navigation.goTo(Navigation.screens.character);
    });
  }

  // Evento: Guardar Personaje y EPP (Pasa a Confirmación de Ingreso)
  if (btnSaveCharacter) {
    btnSaveCharacter.addEventListener("click", () => {
      const nameInput = document.getElementById("playerName");
      const genderInput = document.querySelector('input[name="gender"]:checked');
      const eppCheckboxes = document.querySelectorAll('input[name="epp"]:checked');
      const totalEppAvailable = document.querySelectorAll('input[name="epp"]').length;

      // Validación 1: Nombre
      if (!nameInput || !nameInput.value.trim()) {
        showToast("Por favor, ingresá el nombre del técnico/a.");
        if (nameInput) nameInput.focus();
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

      // Guardar datos en el Estado Global
      gameState.playerName = nameInput.value.trim();
      gameState.gender = genderInput.value;
      gameState.epp = Array.from(eppCheckboxes).map(cb => cb.value);

      // Actualizar datos de pantalla de confirmación
      const displayTitle = document.getElementById("displayPlayerName");
      const displayDetails = document.getElementById("displayPlayerDetails");
      
      if (displayTitle) displayTitle.textContent = `TÉCNICO/A: ${gameState.playerName.toUpperCase()}`;
      if (displayDetails) displayDetails.textContent = `Género: ${gameState.gender} | EPP Verificado (${gameState.epp.length}/6 items)`;

      showToast(`¡Bienvenido/a, ${gameState.playerName}! Equipamiento verificado.`);

      // Avanzar a la pantalla de ingreso autorizado
      Navigation.goTo(Navigation.screens.equipment);
    });
  }

  // Evento: Continuar hacia la próxima etapa de exploración (Provisional)
  if (btnEquipmentContinue) {
    btnEquipmentContinue.addEventListener("click", () => {
      showToast("La fase de exploración geográfica será la próxima etapa.");
    });
  }
});