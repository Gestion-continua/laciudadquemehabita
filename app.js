// MAPA DE IMÁGENES POR CATEGORÍA
const CATEGORY_BACKGROUNDS = {
  "Historia y Arquitectura": "images/historia.jpg",
  "Comunas y Barrios": "images/barrios.jpg",
  "Leyendas Urbanas": "images/leyendas.jpg",
  "Cultura y Gastronomía": "images/cultura.jpg",
  "Provincia de Bs. As.": "images/provincia.jpg"
};

const QUESTIONS_PER_ROUND = 10;
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let correctCount = 0;

let timerInterval = null;
let secondsElapsed = 0;

// Almacenar datos del participante activo
let currentUser = null;

// Cargar preguntas desde JSON o fallback
async function loadQuestions() {
  try {
    const response = await fetch('preguntas.json');
    if(!response.ok) throw new Error("No se pudo cargar preguntas.json");
    allQuestions = await response.json();
  } catch (err) {
    console.warn("Cargando preguntas de reserva local:", err);
    allQuestions = [
      {
        id: 1,
        categoria: "Leyendas Urbanas",
        pregunta: "¿Qué mitología o leyenda urbana rodea a 'Rufina Cambaceres' en Cementerio de la Recoleta?",
        opciones: [
          "Padeció catalepsia y se cree que fue sepultada con vida",
          "Su fantasma baila tango en la entrada",
          "Guardaba el mapa de un tesoro colonial"
        ],
        correcta: 0
      },
      {
        id: 2,
        categoria: "Historia y Arquitectura",
        pregunta: "¿En qué año se inauguró el Obelisco de Buenos Aires?",
        opciones: ["1910", "1936", "1950"],
        correcta: 1
      }
    ];
  }
}

// FUNCIONES DEL MODAL Y REGISTRO
function openTermsModal() {
  const modal = document.getElementById('terms-modal');
  if(modal) modal.classList.add('active');
}

function closeTermsModal() {
  const modal = document.getElementById('terms-modal');
  if(modal) modal.classList.remove('active');
}

function validateForm() {
  const name = document.getElementById('reg-name')?.value.trim() || '';
  const lastname = document.getElementById('reg-lastname')?.value.trim() || '';
  const email = document.getElementById('reg-email')?.value.trim() || '';
  const phone = document.getElementById('reg-phone')?.value.trim() || '';
  const admin = document.getElementById('reg-admin')?.value.trim() || '';

  const checkAge = document.getElementById('check-age')?.checked || false;
  const checkAdmin = document.getElementById('check-admin')?.checked || false;
  const checkTerms = document.getElementById('check-terms')?.checked || false;
  const checkPenalty = document.getElementById('check-penalty')?.checked || false;

  const btnConfirm = document.getElementById('btn-confirm-start');

  // Evaluar que todos los campos y los 4 checkboxes estén completos
  const inputsValid = name !== '' && 
                      lastname !== '' && 
                      email.includes('@') && 
                      phone !== '' && 
                      admin !== '';

  const checksValid = checkAge && checkAdmin && checkTerms && checkPenalty;

  if (btnConfirm) {
    btnConfirm.disabled = !(inputsValid && checksValid);
  }
}

function confirmAndStart() {
  currentUser = {
    nombre: document.getElementById('reg-name').value.trim(),
    apellido: document.getElementById('reg-lastname').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    telefono: document.getElementById('reg-phone').value.trim(),
    administracion: document.getElementById('reg-admin').value.trim()
  };

  closeTermsModal();
  startQuiz();
}

// Iniciar Quiz
function startQuiz() {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  currentQuestions = shuffled.slice(0, QUESTIONS_PER_ROUND);
  
  currentIndex = 0;
  score = 0;
  correctCount = 0;
  secondsElapsed = 0;

  // Cambiar fondo de video (Intro) a imagen
  const bgVid = document.getElementById('bg-video');
  const bgImg = document.getElementById('bg-image');
  if (bgVid) bgVid.classList.remove('active');
  if (bgImg) bgImg.classList.add('active');

  startTimer();
  showScreen('screen-quiz');
  
  const footerStatus = document.getElementById('footer-status');
  if (footerStatus) footerStatus.textContent = 'STATUS: RUNNING';
  
  renderQuestion();
}

// Renderizar Pregunta Activa
function renderQuestion() {
  const q = currentQuestions[currentIndex];

  // Actualizar imagen de fondo por categoría
  const bgImg = document.getElementById('bg-image');
  if (bgImg && CATEGORY_BACKGROUNDS[q.categoria]) {
    bgImg.src = CATEGORY_BACKGROUNDS[q.categoria];
  }
  
  // Actualizar barra de progreso
  const progressFill = document.getElementById('progress-fill');
  if (progressFill) {
    const progressPercent = ((currentIndex) / QUESTIONS_PER_ROUND) * 100;
    progressFill.style.width = `${progressPercent}%`;
  }

  // Textos y Contador
  document.getElementById('quiz-category').textContent = `> ${q.categoria.toUpperCase()}`;
  document.getElementById('quiz-question').textContent = q.pregunta;
  document.getElementById('counter-display').textContent = 
    `${String(currentIndex + 1).padStart(2, '0')}/${String(Math.min(currentQuestions.length, QUESTIONS_PER_ROUND)).padStart(2, '0')}`;

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = '';

  // Opciones de Respuesta
  q.opciones.forEach((opcion, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-item';
    btn.innerHTML = `<span class="option-prefix">[0${idx + 1}]</span> <span>${opcion}</span>`;
    btn.onclick = () => handleAnswer(idx, btn);
    optionsContainer.appendChild(btn);
  });
}

// Procesar Respuesta y Efectos Visuales
function handleAnswer(selectedIndex, selectedBtn) {
  const q = currentQuestions[currentIndex];
  const allBtns = document.querySelectorAll('.option-item');
  const flashLayer = document.getElementById('feedback-flash');
  const mainWrapper = document.getElementById('main-wrapper');
  
  allBtns.forEach(btn => btn.disabled = true);

  if(selectedIndex === q.correcta) {
    selectedBtn.classList.add('correct');
    score += 100;
    correctCount++;
    if (flashLayer) flashLayer.className = 'flash-layer flash-correct';
  } else {
    selectedBtn.classList.add('incorrect');
    allBtns[q.correcta].classList.add('correct');

    if (flashLayer) flashLayer.className = 'flash-layer flash-incorrect';
    if (mainWrapper) mainWrapper.classList.add('shake');
  }

  setTimeout(() => {
    if (flashLayer) flashLayer.className = 'flash-layer';
    if (mainWrapper) mainWrapper.classList.remove('shake');
  }, 400);

  setTimeout(() => {
    currentIndex++;
    if(currentIndex < currentQuestions.length) {
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 1300);
}

// Finalizar Quiz
function finishQuiz() {
  stopTimer();
  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.width = '100%';
  
  document.getElementById('res-score').textContent = score;
  
  const accuracy = Math.round((correctCount / currentQuestions.length) * 100);
  document.getElementById('res-accuracy').textContent = `${accuracy}%`;

  const footerStatus = document.getElementById('footer-status');
  if (footerStatus) footerStatus.textContent = 'STATUS: FINISHED';
  
  showScreen('screen-results');
}

// Control del temporizador
function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const secs = String(secondsElapsed % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  if(timerInterval) clearInterval(timerInterval);
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

loadQuestions();