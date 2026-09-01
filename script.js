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
    } else if (screenId === "victoryScreen") {
      setTimeout(initVictoryAnimation, 50);
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

/* MOTOR DE MAPA PIXEL ART & JOYSTICK MÓVIL */
let canvas, ctx;
let player = { x: 200, y: 200, speed: 5 };
let keys = {};
let hoverWell = null;
let animTimer = 0;

let joystickActive = false;
let joystickVector = { x: 0, y: 0 };
let joystickTouchId = null;

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

  // Activar controles táctiles de joystick si es dispositivo móvil
  const joystickEl = document.getElementById("virtualJoystick");
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    joystickEl.classList.remove("hidden");
    setupVirtualJoystick();
  } else {
    joystickEl.classList.add("hidden");
  }

  gameLoop();
}

function setupVirtualJoystick() {
  const base = document.getElementById("joystickBase");
  const stick = document.getElementById("joystickStick");

  base.ontouchstart = (e) => {
    e.preventDefault();
    joystickActive = true;
    joystickTouchId = e.targetTouches[0].identifier;
    updateJoystickPos(e.targetTouches[0]);
  };

  window.ontouchmove = (e) => {
    if (!joystickActive) return;
    for (let i = 0; i < e.targetTouches.length; i++) {
      if (e.targetTouches[i].identifier === joystickTouchId) {
        updateJoystickPos(e.targetTouches[i]);
        break;
      }
    }
  };

  window.ontouchend = (e) => {
    if (!joystickActive) return;
    let released = true;
    for (let i = 0; i < e.targetTouches.length; i++) {
      if (e.targetTouches[i].identifier === joystickTouchId) {
        released = false;
        break;
      }
    }
    if (released) {
      joystickActive = false;
      joystickVector = { x: 0, y: 0 };
      stick.style.transform = `translate(0px, 0px)`;
    }
  };
}

function updateJoystickPos(touch) {
  const base = document.getElementById("joystickBase");
  const stick = document.getElementById("joystickStick");
  const rect = base.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = touch.clientX - centerX;
  let dy = touch.clientY - centerY;
  const dist = Math.hypot(dx, dy);
  const maxRadius = 40;

  if (dist > maxRadius) {
    dx = (dx / dist) * maxRadius;
    dy = (dy / dist) * maxRadius;
  }

  stick.style.transform = `translate(${dx}px, ${dy}px)`;
  joystickVector = { x: dx / maxRadius, y: dy / maxRadius };
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
    if (Math.hypot(mouseX - well.x, mouseY - well.y) < 55) {
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
    if (Math.hypot(player.x - well.x, player.y - well.y) < 75) {
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

  if (joystickActive) {
    player.x += joystickVector.x * player.speed;
    player.y += joystickVector.y * player.speed;
  }

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

  // Terreno patagónico / norteño
  ctx.fillStyle = "#1e2e17";
  ctx.fillRect(0, 0, w, h);

  // Caminos de tierra
  ctx.fillStyle = "#5c4028";
  const w1 = gameState.wellsData[1];
  const w2 = gameState.wellsData[2];
  const w3 = gameState.wellsData[3];
  const w4 = gameState.wellsData[4];
  const w5 = gameState.wellsData[5];

  ctx.fillRect(w1.x, w1.y - 18, w2.x - w1.x, 36);
  ctx.fillRect(w1.x, w3.y - 18, w2.x - w1.x, 36);
  ctx.fillRect(w1.x - 18, w1.y, 36, w4.y - w1.y);
  ctx.fillRect(w2.x - 18, w2.y, 36, w5.y - w2.y);

  for (let key in gameState.wellsData) {
    drawPumpjackWell(gameState.wellsData[key]);
  }

  drawDetailedPlayer();
}

/**
 * PUMPJACK (APARATO DE BOMBEO MECÁNICO) EN PIXEL ART DETALLADO
 */
function drawPumpjackWell(well) {
  ctx.save();
  ctx.translate(well.x, well.y);

  if (hoverWell && hoverWell.id === well.id) {
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(-45, -45, 90, 90);
  }

  if (well.status === "active") {
    // Base de cemento / estructura
    ctx.fillStyle = "#4a4e51";
    ctx.fillRect(-30, -10, 60, 20);

    // Cabezal de pozo (Wellhead)
    ctx.fillStyle = "#718096";
    ctx.fillRect(-8, -22, 16, 14);

    // Samson post (Torre central de soporte)
    ctx.fillStyle = "#2d3748";
    ctx.fillRect(-6, -38, 12, 28);

    // Balancín oscilante (Beam) accionado por motor
    const angle = Math.sin(animTimer * 2.5) * 0.22;
    ctx.save();
    ctx.translate(0, -38);
    ctx.rotate(angle);
    ctx.fillStyle = "#d69e2e";
    ctx.fillRect(-35, -5, 70, 10);
    ctx.restore();

    // Cabeza de caballo (Horsehead) y barra pulida con movimiento
    const headYOffset = Math.sin(animTimer * 2.5) * 6;
    ctx.fillStyle = "#e53e3e";
    ctx.fillRect(22, -44 + headYOffset, 8, 22);

    // Luz LED indicadora de pozo activo
    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(0, -52, 6, 0, Math.PI * 2);
    ctx.fill();

    // Nombre del Pozo
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(well.name, 0, 36);
  } else {
    // Pozo Bloqueado
    ctx.fillStyle = "rgba(15, 20, 25, 0.95)";
    ctx.fillRect(-35, -35, 70, 70);
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(-35, -35, 70, 70);

    ctx.fillStyle = "#ff4444";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔒", 0, 8);

    ctx.fillStyle = "#8a99ad";
    ctx.font = "bold 11px monospace";
    ctx.fillText(well.name, 0, 48);
  }

  ctx.restore();
}

/**
 * PERSONAJE DETALLADO CON EPP COMPLETO (CASCO, LENTES, CHALECO, GUANTES, BOTAS)
 */
function drawDetailedPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Sombra en el suelo
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Botas de seguridad (Negras/Gris oscuro con punta S3)
  ctx.fillStyle = "#1a202c";
  ctx.fillRect(-9, 10, 7, 6);
  ctx.fillRect(2, 10, 7, 6);
  ctx.fillStyle = "#cbd5e0"; // puntera de acero
  ctx.fillRect(-9, 14, 7, 2);
  ctx.fillRect(2, 14, 7, 2);

  // Ropa ignífuga (Azul marino / mameluco industrial)
  ctx.fillStyle = "#2b6cb0";
  ctx.fillRect(-9, -4, 18, 15);

  // Chaleco de alta visibilidad reflectante (Naranja vial con tiras amarillas)
  ctx.fillStyle = "#dd6b20";
  ctx.fillRect(-11, -5, 22, 13);
  ctx.fillStyle = "#ecc94b"; // Faja reflectante
  ctx.fillRect(-11, -1, 22, 3);

  // Guantes de trabajo (Color marrón cuero)
  ctx.fillStyle = "#b7791f";
  ctx.fillRect(-14, 0, 4, 6);
  ctx.fillRect(10, 0, 4, 6);

  // Cuello / Cabeza
  ctx.fillStyle = "#fbd38d";
  ctx.fillRect(-5, -12, 10, 8);

  // Lentes de protección (Gafas de seguridad oscuras/transparentes)
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(-4, -10, 8, 3);

  // Casco de seguridad (Color amarillo reglamentario EPP)
  ctx.fillStyle = "#ecc94b";
  ctx.fillRect(-8, -20, 16, 9);
  // Visera del casco
  ctx.fillRect(-10, -13, 20, 3);

  ctx.restore();
}

/* ANIMACIÓN DE VICTORIA: CAMIÓN PETROLERO */
let vicCanvas, vicCtx;
let truckX = -150;

function initVictoryAnimation() {
  vicCanvas = document.getElementById("victoryCanvas");
  if (!vicCanvas) return;

  const rect = vicCanvas.getBoundingClientRect();
  vicCanvas.width = rect.width || 800;
  vicCanvas.height = rect.height || 220;
  vicCtx = vicCanvas.getContext("2d");

  truckX = -150;
  requestAnimationFrame(victoryLoop);
}

function victoryLoop() {
  if (gameState.currentScreen !== "victoryScreen") return;

  truckX += 2.5;
  if (truckX > vicCanvas.width + 150) {
    truckX = -150;
  }

  renderVictoryScene();
  requestAnimationFrame(victoryLoop);
}

function renderVictoryScene() {
  const w = vicCanvas.width;
  const h = vicCanvas.height;

  // Cielo del yacimiento atardecer
  vicCtx.fillStyle = "#1a120b";
  vicCtx.fillRect(0, 0, w, h);

  // Suelo y ruta petrolera
  vicCtx.fillStyle = "#2f3e46";
  vicCtx.fillRect(0, h - 70, w, 70);
  vicCtx.fillStyle = "#e2e8f0"; // Línea central de ruta
  for (let i = 0; i < w; i += 40) {
    vicCtx.fillRect((i - (truckX * 0.5)) % w, h - 38, 20, 4);
  }

  // Dibujar camión cisterna con petróleo transportado
  vicCtx.save();
  const truckY = h - 110;
  vicCtx.translate(truckX, truckY);

  // Cabina del camión (Color rojo/industrial)
  vicCtx.fillStyle = "#c53030";
  vicCtx.fillRect(70, 10, 45, 35);
  // Parabrisas
  vicCtx.fillStyle = "#63b3ed";
  vicCtx.fillRect(95, 14, 18, 16);
  // Humo de escape
  vicCtx.fillStyle = "rgba(255,255,255,0.4)";
  vicCtx.beginPath();
  vicCtx.arc(118, 10, 6 + Math.random() * 4, 0, Math.PI * 2);
  vicCtx.fill();

  // Cisterna / Tanque de petróleo (Color aluminio/acero con leyenda CRUDO)
  vicCtx.fillStyle = "#a0aec0";
  vicCtx.fillRect(-70, 12, 140, 36);
  vicCtx.fillStyle = "#1a202c";
  vicCtx.font = "bold 11px monospace";
  vicCtx.textAlign = "center";
  vicCtx.fillText("PETRÓLEO VACA MUERTA", 0, 34);

  // Ruedas del camión (Neumáticos negros con llanta gris)
  vicCtx.fillStyle = "#1a202c";
  vicCtx.beginPath();
  vicCtx.arc(-45, 48, 11, 0, Math.PI * 2);
  vicCtx.arc(-20, 48, 11, 0, Math.PI * 2);
  vicCtx.arc(85, 48, 11, 0, Math.PI * 2);
  vicCtx.fill();

  vicCtx.fillStyle = "#cbd5e0";
  vicCtx.beginPath();
  vicCtx.arc(-45, 48, 4, 0, Math.PI * 2);
  vicCtx.arc(-20, 48, 4, 0, Math.PI * 2);
  vicCtx.arc(85, 48, 4, 0, Math.PI * 2);
  vicCtx.fill();

  // Técnico asomado en la cabina con su casco amarillo
  vicCtx.fillStyle = "#fbd38d";
  vicCtx.fillRect(85, 18, 8, 10);
  vicCtx.fillStyle = "#ecc94b"; // Casco
  vicCtx.fillRect(83, 15, 12, 5);

  vicCtx.restore();
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