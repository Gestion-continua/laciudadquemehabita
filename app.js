// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://bcpstmfxemrcidwgthxx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cauPjclntOUrIeeQxpftAg_icxWbiVD";

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// MAPA DE IMÁGENES POR CATEGORÍA
const CATEGORY_BACKGROUNDS = {
  "Historia y Arquitectura": "images/historia.jpg",
  "Comunas y Barrios": "images/barrios.jpg",
  "Leyendas Urbanas": "images/leyendas.jpg",
  "Cultura y Gastronomía": "images/cultura.jpg",
  "Provincia de Bs. As.": "images/provincia.jpg"
};

// FRASES LITERARIAS SOBRE BUENOS AIRES
const FRASES_BUENOS_AIRES = [
  {
    frase: "A mí se me hace cuento que empezó Buenos Aires: la juzgo tan eterna como el agua y como el aire.",
    autor: "Jorge Luis Borges",
    libro: "Fundación mítica de Buenos Aires"
  },
  {
    frase: "Buenos Aires es una ciudad que a veces duele, pero siempre espera con la luz encendida en alguna esquina.",
    autor: "Alejandro Dolina",
    libro: "El Ángel Gris"
  },
  {
    frase: "Buenos Aires es una ciudad monstruosa y fascinante, donde la soledad se multiplica en cada esquina y en cada madrugada de niebla.",
    autor: "Ernesto Sábato",
    libro: "Sobre héroes y tumbas"
  },
  {
    frase: "Andábamos sin buscarnos, pero sabiendo que andábamos para encontrarnos por las calles de Buenos Aires.",
    autor: "Julio Cortázar",
    libro: "Rayuela"
  },
  {
    frase: "En Flores los ángeles son grises, los amigos se reúnen en los cafés a discutir sobre lo imposible, y la nostalgia es una forma de la felicidad.",
    autor: "Alejandro Dolina",
    libro: "El Ángel Gris"
  },
  {
    frase: "Las calles de Buenos Aires ya son mi entraña. No las ávidas calles de la tierra avasadora, sino las calles disecadas por el hábito.",
    autor: "Jorge Luis Borges",
    libro: "Fervor de Buenos Aires"
  }
];

const QUESTIONS_PER_ROUND = 10;
let allQuestions = [];
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let correctCount = 0;

let timerInterval = null;
let secondsElapsed = 0;
let currentUser = null;

window.addEventListener('DOMContentLoaded', () => {
  showScreen('screen-start');
  loadQuestions();
  setupEmailListener();
});

function setupEmailListener() {
  const emailInput = document.getElementById('reg-email');
  const adminInput = document.getElementById('reg-admin');

  if (emailInput && adminInput) {
    const checkTesterField = () => {
      const email = emailInput.value.trim().toLowerCase();
      const isTester = email.endsWith('@gestionar.com') || email.endsWith('@octopus.com.ar') || email.includes('@gestionar') || email.includes('@octopus');

      if (isTester) {
        adminInput.value = "usuario tester";
        adminInput.disabled = true;
        adminInput.style.backgroundColor = "#222";
        adminInput.style.color = "#f39c12";
      } else {
        if (adminInput.value === "usuario tester") {
          adminInput.value = "";
        }
        adminInput.disabled = false;
        adminInput.style.backgroundColor = "#000";
        adminInput.style.color = "#fff";
      }
      validateForm();
    };

    emailInput.addEventListener('input', checkTesterField);
    emailInput.addEventListener('change', checkTesterField);
    emailInput.addEventListener('keyup', checkTesterField);
  }
}

async function loadQuestions() {
  try {
    const response = await fetch('preguntas.json');
    if(!response.ok) throw new Error("No se pudo cargar preguntas.json");
    allQuestions = await response.json();
  } catch (err) {
    console.warn("Cargando preguntas de reserva local por error en fetch:", err);
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

function openTermsModal() {
  const emailInput = document.getElementById('reg-email');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const isTester = email.endsWith('@gestionar.com') || email.endsWith('@octopus.com.ar') || email.includes('@gestionar') || email.includes('@octopus');

  if (!isTester && localStorage.getItem('quiz_played') === 'true') {
    showScreen('screen-already-played');
    loadLeaderboard('already-played-leaderboard');
    return;
  }

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
  const adminInput = document.getElementById('reg-admin');
  const admin = adminInput ? adminInput.value.trim() : '';

  const checkAge = document.getElementById('check-age')?.checked || false;
  const checkAdmin = document.getElementById('check-admin')?.checked || false;
  const checkTerms = document.getElementById('check-terms')?.checked || false;
  const checkPenalty = document.getElementById('check-penalty')?.checked || false;

  const btnConfirm = document.getElementById('btn-confirm-start');

  const inputsValid = name !== '' && lastname !== '' && email.includes('@') && phone !== '' && admin !== '';
  const checksValid = checkAge && checkAdmin && checkTerms && checkPenalty;

  if (btnConfirm) {
    btnConfirm.disabled = !(inputsValid && checksValid);
  }
}

async function confirmAndStart() {
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const isTester = email.endsWith('@gestionar.com') || email.endsWith('@octopus.com.ar') || email.includes('@gestionar') || email.includes('@octopus');

  if (!isTester && supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('participantes')
        .select('id')
        .eq('email', email);

      if (data && data.length > 0) {
        alert("Este correo electrónico ya ha sido registrado en una participación previa.");
        localStorage.setItem('quiz_played', 'true');
        closeTermsModal();
        showScreen('screen-already-played');
        loadLeaderboard('already-played-leaderboard');
        return;
      }
    } catch(err) {
      console.warn("No se pudo verificar el correo en Supabase:", err);
    }
  }

  const adminInput = document.getElementById('reg-admin');
  currentUser = {
    nombre: document.getElementById('reg-name').value.trim(),
    apellido: document.getElementById('reg-lastname').value.trim(),
    email: email,
    telefono: document.getElementById('reg-phone').value.trim(),
    administracion: isTester ? "usuario tester" : (adminInput ? adminInput.value.trim() : '')
  };

  closeTermsModal();
  startQuiz();
}

function startQuiz() {
  const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
  const selected = shuffledQuestions.slice(0, QUESTIONS_PER_ROUND);

  currentQuestions = selected.map(q => {
    const correctText = q.opciones[q.correcta];
    const optionsCopy = [...q.opciones];
    const shuffledOptions = optionsCopy.sort(() => Math.random() - 0.5);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);

    return {
      ...q,
      opciones: shuffledOptions,
      correcta: newCorrectIndex
    };
  });

  currentIndex = 0;
  score = 0;
  correctCount = 0;
  secondsElapsed = 0;

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

function renderQuestion() {
  const q = currentQuestions[currentIndex];

  const bgImg = document.getElementById('bg-image');
  if (bgImg && CATEGORY_BACKGROUNDS[q.categoria]) {
    bgImg.src = CATEGORY_BACKGROUNDS[q.categoria];
  }

  const progressFill = document.getElementById('progress-fill');
  if (progressFill) {
    const progressPercent = ((currentIndex) / QUESTIONS_PER_ROUND) * 100;
    progressFill.style.width = `${progressPercent}%`;
  }

  document.getElementById('quiz-category').textContent = `> ${q.categoria.toUpperCase()}`;
  document.getElementById('quiz-question').textContent = q.pregunta;
  document.getElementById('counter-display').textContent =
    `${String(currentIndex + 1).padStart(2, '0')}/${String(Math.min(currentQuestions.length, QUESTIONS_PER_ROUND)).padStart(2, '0')}`;

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = '';

  q.opciones.forEach((opcion, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-item';
    btn.innerHTML = `<span class="option-prefix">[0${idx + 1}]</span> <span>${opcion}</span>`;
    btn.onclick = () => handleAnswer(idx, btn);
    optionsContainer.appendChild(btn);
  });
}

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

function obtenerFraseAleatoria() {
  const idx = Math.floor(Math.random() * FRASES_BUENOS_AIRES.length);
  return FRASES_BUENOS_AIRES[idx];
}

async function finishQuiz() {
  stopTimer();

  const email = currentUser ? currentUser.email.toLowerCase() : '';
  const isTester = email.endsWith('@gestionar.com') || email.endsWith('@octopus.com.ar') || email.includes('@gestionar') || email.includes('@octopus');

  if (!isTester) {
    localStorage.setItem('quiz_played', 'true');
  }

  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.width = '100%';

  const accuracy = Math.round((correctCount / currentQuestions.length) * 100);
  document.getElementById('res-score').textContent = score;
  document.getElementById('res-accuracy').textContent = `${accuracy}%`;

  // Renderizado de la cita literaria al azar
  const fraseContainer = document.getElementById('frase-literaria-container');
  if (fraseContainer) {
    const cita = obtenerFraseAleatoria();
    fraseContainer.innerHTML = `
      <div class="tarjeta-literaria">
        <div class="comilla-icono">“</div>
        <p class="frase-texto">${cita.frase}</p>
        <div class="autor-info">
          <span class="autor-nombre">— ${cita.autor}</span>
          <span class="autor-libro">${cita.libro}</span>
        </div>
      </div>
    `;
  }

  const footerStatus = document.getElementById('footer-status');
  if (footerStatus) footerStatus.textContent = 'STATUS: FINISHED';

  if (supabaseClient && currentUser) {
    try {
      await supabaseClient.from('participantes').insert([
        {
          nombre: currentUser.nombre,
          apellido: currentUser.apellido,
          email: currentUser.email,
          telefono: currentUser.telefono,
          administracion: currentUser.administracion,
          score: score,
          accuracy: accuracy,
          tiempo_segundos: secondsElapsed
        }
      ]);
    } catch (err) {
      console.error("Error guardando datos en Supabase:", err);
    }
  }

  showScreen('screen-results');
  loadLeaderboard('leaderboard-body');
}

async function loadLeaderboard(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('participantes')
      .select('nombre, apellido, score, tiempo_segundos')
      .order('score', { ascending: false })
      .order('tiempo_segundos', { ascending: true })
      .limit(5);

    if (error || !data || data.length === 0) {
      container.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">No hay registros cargados aún</td></tr>`;
      return;
    }

    container.innerHTML = data.map((item, index) => `
      <tr>
        <td><strong>#${index + 1}</strong></td>
        <td>${item.nombre} ${item.apellido ? item.apellido.charAt(0) + '.' : ''}</td>
        <td><strong>${item.score} pts</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">Error al conectar con el ranking</td></tr>`;
  }
}

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
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) targetScreen.classList.add('active');
}