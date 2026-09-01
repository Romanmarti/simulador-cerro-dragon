/**
 * RECUPERANDO LA CUENCA - Cuenca del Noroeste
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
  
  wellsCount: 5,
  unlockedWellsCount: 1,
  questionsAnswered: 0,
  totalProduction: 1250,
  
  wellsData: {
    1: { id: 1, name: "Pozo N-01", status: "active", x: 200, y: 150, prod: 1250 },
    2: { id: 2, name: "Pozo N-02", status: "locked", x: 1400, y: 150, prod: 1000, reqQuestion: 1 },
    3: { id: 3, name: "Pozo N-03", status: "locked", x: 800, y: 400, prod: 1150, reqQuestion: 2 },
    4: { id: 4, name: "Pozo N-04", status: "locked", x: 200, y: 650, prod: 800,  reqQuestion: 3 },
    5: { id: 5, name: "Pozo N-05", status: "locked", x: 1400, y: 650, prod: 800,  reqQuestion: 4 }
  },

  currentScreen: "startScreen"
};

const QUIZ_QUESTIONS = [
  {
    id: 1,
    category: "EXPLORACIÓN",
    targetWell: 2,
    question: "¿Cuál de estos métodos se utiliza para obtener información sobre las estructuras geológicas del subsuelo mediante la emisión de ondas físicas?",
    options: [
      { text: "A) Gravimetría", correct: false },
      { text: "B) Sísmica", correct: true },
      { text: "C) Filtración", correct: false },
      { text: "D) Destilación", correct: false }
    ],
    explanation: "La sísmica de exploración permite mapear capas del subsuelo emitiendo ondas de sonido y registrando su retorno."
  },
  {
    id: 2,
    category: "GEOLOGÍA DE RESERVORIO",
    targetWell: 3,
    question: "¿Qué propiedad de la roca determina el espacio disponible en sus poros para almacenar hidrocarburos?",
    options: [
      { text: "A) Porosidad", correct: true },
      { text: "B) Dureza", correct: false },
      { text: "C) Viscosidad", correct: false },
      { text: "D) Elasticidad", correct: false }
    ],
    explanation: "La porosidad mide el volumen de huecos o poros dentro de la roca capaces de contener fluidos."
  },
  {
    id: 3,
    category: "PERFORACIÓN",
    targetWell: 4,
    question: "¿Cuál es la función principal del fluido o lodo de perforación?",
    options: [
      { text: "A) Enfriar la herramienta de corte y remover los recortes de roca", correct: true },
      { text: "B) Quemar los gases sobrantes", correct: false },
      { text: "C) Aumentar la viscosidad del crudo extraído", correct: false },
      { text: "D) Separar el petróleo del agua", correct: false }
    ],
    explanation: "El lodo lubrica el trépano, enfría la herramienta y saca la roca molida hacia la superficie."
  },
  {
    id: 4,
    category: "PRODUCCIÓN",
    targetWell: 5,
    question: "¿Qué equipo de superficie se utiliza habitualmente para extraer petróleo mediante bombeo mecánico?",
    options: [
      { text: "A) Aparato de Bombeo Mecánico (Pumpjack / Balancín)", correct: true },
      { text: "B) Torre de refinación", correct: false },
      { text: "C) Antorcha de gas", correct: false },
      { text: "D) Centrifugadora de aire", correct: false }
    ],
    explanation: "El Aparato de Bombeo Mecánico mueve alternativamente la bomba sumergida para subir el petróleo a la superficie."
  }
];

const ZONES_DATA = {
  ramos: { key: "ramos", name: "Campo Ramos", basePoS: 30, drillingCost: 800000 },
  aguarague: { key: "aguarague", name: "Yacimiento Aguaragüe", basePoS: 20, drillingCost: 1200000 },
  acambuco: { key: "acambuco", name: "Bloque Acambuco", basePoS: 10, drillingCost: 1500000 }
};

const METHODS_DATA = {
  geoquimica: { key: "geoquimica", name: "Geoquímica de Superficie", cost: 30000, posBonus: 10, report: "Evidencia de hidrocarburos (+10% PoS)." },
  gravimetria: { key: "gravimetria", name: "Gravimetría", cost: 50000, posBonus: 15, report: "Anomalía de densidad detectada (+15% PoS)." },
  sismica2d: { key: "sismica2d", name: "Sísmica 2D", cost: 100000, posBonus: 25, report: "Estructura anticlinal identificada (+25% PoS)." },
  sismica3d: { key: "sismica3d", name: "Sísmica 3D", cost: 200000, posBonus: 40, report: "Modelo tridimensional preciso (+40% PoS)." }
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

    if (screenId === "fieldMapScreen") {
      setTimeout(initPixelMap, 50);
    }
  }
};

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

function updateHUD() {
  document.getElementById("hudBudget").textContent = `$${gameState.budget.toLocaleString()} USD`;
  document.getElementById("hudPoS").textContent = `${gameState.pos}%`;
  
  const wProg = document.getElementById("mapWellsProgress");
  const mInc = document.getElementById("mapIncome");
  const mQuiz = document.getElementById("mapQuizProgress");

  if (wProg) wProg.textContent = `${gameState.unlockedWellsCount}/5`;
  if (mInc) mInc.textContent = `${gameState.totalProduction.toLocaleString()} bbl/d`;
  if (mQuiz) mQuiz.textContent = `${gameState.questionsAnswered}/4`;
}

let canvas, ctx;
let player = { x: 200, y: 200, speed: 6 };
let keys = {};
let hoverWell = null;
let animTimer = 0;

function initPixelMap() {
  canvas = document.getElementById("pixelCanvas");
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || 1600;
  canvas.height = rect.height || 800;

  ctx = canvas.getContext("2d");

  const w = canvas.width;
  const h = canvas.height;

  gameState.wellsData[1].x = Math.round(w * 0.12);
  gameState.wellsData[1].y = Math.round(h * 0.18);

  gameState.wellsData[2].x = Math.round(w * 0.88);
  gameState.wellsData[2].y = Math.round(h * 0.18);

  gameState.wellsData[3].x = Math.round(w * 0.50);
  gameState.wellsData[3].y = Math.round(h * 0.50);

  gameState.wellsData[4].x = Math.round(w * 0.12);
  gameState.wellsData[4].y = Math.round(h * 0.82);

  gameState.wellsData[5].x = Math.round(w * 0.88);
  gameState.wellsData[5].y = Math.round(h * 0.82);

  player.x = gameState.wellsData[1].x + 40;
  player.y = gameState.wellsData[1].y;

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  canvas.removeEventListener("mousemove", handleMouseMove);
  canvas.removeEventListener("click", handleCanvasClick);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("click", handleCanvasClick);

  gameLoop();
}

function handleKeyDown(e) {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "e" && gameState.currentScreen === "fieldMapScreen") {
    interactWithNearbyWell();
  }
}

function handleKeyUp(e) {
  keys[e.key.toLowerCase()] = false;
}

function handleMouseMove(e) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

  hoverWell = null;
  for (let key in gameState.wellsData) {
    const well = gameState.wellsData[key];
    if (Math.hypot(mouseX - well.x, mouseY - well.y) < 45) {
      hoverWell = well;
      break;
    }
  }

  const infoText = document.getElementById("wellInfoText");
  if (hoverWell && infoText) {
    canvas.style.cursor = "pointer";
    if (hoverWell.status === "active") {
      infoText.textContent = `${hoverWell.name.toUpperCase()} - [EN PRODUCCIÓN] (${hoverWell.prod} bbl/d)`;
    } else {
      infoText.textContent = `${hoverWell.name.toUpperCase()} - 🔒 BLOQUEADO. Hacé clic o acercate y presioná [E] para responder.`;
    }
  } else {
    canvas.style.cursor = "default";
  }
}

function handleCanvasClick() {
  if (hoverWell) triggerWellInteraction(hoverWell);
}

function interactWithNearbyWell() {
  for (let key in gameState.wellsData) {
    const well = gameState.wellsData[key];
    if (Math.hypot(player.x - well.x, player.y - well.y) < 70) {
      triggerWellInteraction(well);
      return;
    }
  }
  showToast("Acercate a un pozo bloqueado para interactuar.");
}

function triggerWellInteraction(well) {
  if (well.status === "active") {
    showToast(`${well.name} ya está en producción.`);
    return;
  }

  const qObj = QUIZ_QUESTIONS[gameState.questionsAnswered];
  if (!qObj) return;

  if (well.id !== qObj.targetWell) {
    showToast(`Desbloqueá primero el Pozo N-0${qObj.targetWell} en orden secuencial.`);
    return;
  }

  openQuizModal(qObj);
}

function updatePlayerPosition() {
  if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
  if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
  if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
  if (keys["d"] || keys["arrowright"]) player.x += player.speed;

  player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
  player.y = Math.max(30, Math.min(canvas.height - 30, player.y));
}

function gameLoop() {
  if (gameState.currentScreen !== "fieldMapScreen") return;

  animTimer += 0.08;
  updatePlayerPosition();
  renderPixelMap();

  requestAnimationFrame(gameLoop);
}

function renderPixelMap() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#2d441e";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#5c4028";
  
  const w1 = gameState.wellsData[1];
  const w2 = gameState.wellsData[2];
  const w3 = gameState.wellsData[3];
  const w4 = gameState.wellsData[4];
  const w5 = gameState.wellsData[5];

  ctx.fillRect(w1.x, w1.y - 15, w2.x - w1.x, 30);
  ctx.fillRect(w1.x, w3.y - 15, w2.x - w1.x, 30);
  ctx.fillRect(w1.x - 15, w1.y, 30, w4.y - w1.y);
  ctx.fillRect(w2.x - 15, w2.y, 30, w5.y - w2.y);

  for (let key in gameState.wellsData) {
    drawWell(gameState.wellsData[key]);
  }

  drawPlayer();
}

function drawWell(well) {
  ctx.save();
  ctx.translate(well.x, well.y);

  if (hoverWell && hoverWell.id === well.id) {
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(-35, -35, 70, 70);
  }

  if (well.status === "active") {
    ctx.fillStyle = "#4a4e51";
    ctx.fillRect(-26, -15, 52, 32);

    ctx.fillStyle = "#d69e2e";
    ctx.fillRect(-12, -24, 10, 26);

    const offset = Math.sin(animTimer * 3) * 7;
    ctx.fillStyle = "#e53e3e";
    ctx.fillRect(-26, -28 + offset, 10, 14);

    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(0, -35, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(well.name, 0, 34);
  } else {
    ctx.fillStyle = "rgba(15, 20, 25, 0.9)";
    ctx.fillRect(-30, -30, 60, 60);
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(-30, -30, 60, 60);

    ctx.fillStyle = "#ff4444";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔒", 0, 6);

    ctx.fillStyle = "#8a99ad";
    ctx.font = "bold 11px monospace";
    ctx.fillText(well.name, 0, 42);
  }

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dd6b20";
  ctx.fillRect(-10, -10, 20, 22);

  ctx.fillStyle = "#ecc94b";
  ctx.fillRect(-11, -22, 22, 12);

  ctx.fillStyle = "#fbd38d";
  ctx.fillRect(-7, -14, 14, 7);

  ctx.restore();
}

function openQuizModal(qObj) {
  const quizModal = document.getElementById("quizModal");
  document.getElementById("quizCategoryBadge").textContent = `🛢 ETAPA ${qObj.id}: ${qObj.category}`;
  document.getElementById("quizTitle").textContent = `DESBLOQUEO DE POZO N-0${qObj.targetWell}`;
  document.getElementById("quizQuestionText").textContent = qObj.question;

  const container = document.getElementById("quizOptionsContainer");
  container.innerHTML = "";

  const fb = document.getElementById("quizFeedback");
  const btnRetry = document.getElementById("btnRetryQuiz");
  fb.classList.add("hidden");
  btnRetry.classList.add("hidden");

  qObj.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "btn-quiz-option";
    btn.textContent = opt.text;
    btn.onclick = () => handleQuizAnswer(opt, qObj);
    container.appendChild(btn);
  });

  quizModal.classList.remove("hidden");
}

function handleQuizAnswer(opt, qObj) {
  const fb = document.getElementById("quizFeedback");
  const title = document.getElementById("quizFeedbackTitle");
  const text = document.getElementById("quizFeedbackText");
  const btnRetry = document.getElementById("btnRetryQuiz");

  fb.classList.remove("hidden");

  if (opt.correct) {
    fb.className = "quiz-feedback-box success";
    title.textContent = "✓ ¡RESPUESTA CORRECTA!";
    text.textContent = qObj.explanation;
    
    // Ocultar botón reintentar si es correcto
    btnRetry.classList.add("hidden");

    const well = gameState.wellsData[qObj.targetWell];
    well.status = "active";
    gameState.unlockedWellsCount++;
    gameState.questionsAnswered++;
    gameState.totalProduction += well.prod;

    updateHUD();

    setTimeout(() => {
      document.getElementById("quizModal").classList.add("hidden");
      if (gameState.unlockedWellsCount >= 5) {
        document.getElementById("vicActiveWells").textContent = `${gameState.unlockedWellsCount}/5`;
        document.getElementById("vicQuestions").textContent = `${gameState.questionsAnswered}/4`;
        document.getElementById("vicTotalProd").textContent = `${gameState.totalProduction.toLocaleString()} bbl/d`;
        Navigation.goTo(Navigation.screens.victory);
      }
    }, 2000);
  } else {
    fb.className = "quiz-feedback-box error";
    title.textContent = "✕ INCORRECTO";
    text.textContent = `${qObj.explanation} Volvé a intentarlo.`;
    
    // Mostrar el botón reintentar solo en error
    btnRetry.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnStart").onclick = () => Navigation.goTo(Navigation.screens.operation);
  document.getElementById("btnContinue").onclick = () => Navigation.goTo(Navigation.screens.character);

  document.getElementById("btnSaveCharacter").onclick = () => {
    const name = document.getElementById("playerName").value.trim();
    const gender = document.querySelector('input[name="gender"]:checked');
    const epp = document.querySelectorAll('input[name="epp"]:checked');

    if (!name) return showToast("Ingresá tu nombre.");
    if (!gender) return showToast("Seleccioná tu género.");
    if (epp.length < 6) return showToast("Seleccioná todo el EPP obligatorio.");

    gameState.playerName = name;
    gameState.gender = gender.value;

    document.getElementById("displayPlayerName").textContent = `TÉCNICO/A: ${name.toUpperCase()}`;
    document.getElementById("displayPlayerDetails").textContent = `EPP Completo (${epp.length}/6). Autorizado para ingresar.`;

    Navigation.goTo(Navigation.screens.equipment);
  };

  document.getElementById("btnEquipmentContinue").onclick = () => {
    updateHUD();
    Navigation.goTo(Navigation.screens.exploration);
  };

  document.querySelectorAll(".zone-card").forEach(c => {
    c.onclick = () => {
      document.querySelectorAll(".zone-card").forEach(z => z.classList.remove("selected"));
      c.classList.add("selected");
      gameState.selectedZone = ZONES_DATA[c.dataset.zone];
      gameState.pos = gameState.selectedZone.basePoS;
      updateHUD();
      checkExploButtons();
    };
  });

  document.querySelectorAll(".method-card").forEach(c => {
    c.onclick = () => {
      if (c.classList.contains("completed")) return;
      document.querySelectorAll(".method-card").forEach(m => m.classList.remove("selected"));
      c.classList.add("selected");
      gameState.selectedMethod = METHODS_DATA[c.dataset.method];
      checkExploButtons();
    };
  });

  function checkExploButtons() {
    document.getElementById("btnRunStudy").disabled = !(gameState.selectedZone && gameState.selectedMethod);
    document.getElementById("btnDrillWell").disabled = !(gameState.selectedZone && gameState.budget >= gameState.selectedZone.drillingCost);
  }

  document.getElementById("btnRunStudy").onclick = () => {
    const m = gameState.selectedMethod;
    if (gameState.budget < m.cost) return showToast("Presupuesto insuficiente.");

    gameState.budget -= m.cost;
    gameState.pos = Math.min(95, gameState.pos + m.posBonus);

    const card = document.querySelector(`.method-card[data-method="${m.key}"]`);
    if (card) { card.classList.remove("selected"); card.classList.add("completed"); }

    gameState.selectedMethod = null;
    updateHUD();
    checkExploButtons();

    const res = document.getElementById("seismicResult");
    res.classList.remove("hidden");
    document.getElementById("seismicTitle").textContent = m.name.toUpperCase();
    document.getElementById("seismicDetails").textContent = `${m.report} Probabilidad actual: ${gameState.pos}%.`;
  };

  document.getElementById("btnDrillWell").onclick = () => {
    const z = gameState.selectedZone;
    if (gameState.budget < z.drillingCost) return showToast("Presupuesto insuficiente.");

    gameState.budget -= z.drillingCost;
    const success = (Math.floor(Math.random() * 100) + 1) <= gameState.pos;
    updateHUD();

    if (success) {
      showToast("¡Pozo exitoso! Ingresando al área...");
      Navigation.goTo(Navigation.screens.fieldMap);
    } else {
      const panel = document.getElementById("gameOverPanel");
      panel.classList.remove("panel-game-over");
      void panel.offsetWidth; 
      panel.classList.add("panel-game-over");

      document.getElementById("gameOverDetails").textContent = 
        `Se realizó la perforación en ${z.name} con una probabilidad del ${gameState.pos}%. El pozo resultó seco y se consumió el capital de trabajo.`;
      
      Navigation.goTo(Navigation.screens.gameOver);
    }
  };

  document.getElementById("btnCloseQuizModal").onclick = () => document.getElementById("quizModal").classList.add("hidden");
  document.getElementById("btnRetryQuiz").onclick = () => document.getElementById("quizFeedback").classList.add("hidden");

  document.getElementById("btnOpen3DModal").onclick = () => document.getElementById("modal3D").classList.remove("hidden");
  document.getElementById("btnClose3DModal").onclick = () => document.getElementById("modal3D").classList.add("hidden");

  document.getElementById("btnRestart").onclick = resetGame;
  document.getElementById("btnVictoryRestart").onclick = resetGame;
});

function resetGame() {
  gameState.budget = 2000000;
  gameState.selectedZone = null;
  gameState.selectedMethod = null;
  gameState.pos = 0;
  gameState.unlockedWellsCount = 1;
  gameState.questionsAnswered = 0;
  gameState.totalProduction = 1250;

  gameState.wellsData[1].status = "active";
  for (let i = 2; i <= 5; i++) gameState.wellsData[i].status = "locked";

  document.querySelectorAll(".zone-card").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".method-card").forEach(c => c.classList.remove("selected", "completed"));

  updateHUD();
  Navigation.goTo(Navigation.screens.exploration);
}