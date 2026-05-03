let currentUser = null;
let currentQuestion = 0;
let timeLeft = 3600;
let misconduct = 0;
let userAnswers = [];

let resultCountdown = 60;
let testId = "";
let timerInterval = null;
let isPaused = false;

// LOGIN
function login() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  let user = students.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    document.getElementById("loginError").innerText = "Invalid login";
    return;
  }

  // ✅ FIXED TIME (8 PM = 20)
  let now = new Date();
  if (now.getHours() !== 13) {
    alert("Test only available at 8 PM");
    return;
  }

  if (!questions || questions.length === 0) {
    alert("No Test Found");
    return;
  }

  currentUser = user;
  startTest();
}

// START TEST
function startTest() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("testBox").style.display = "block";

  enterFullscreen();
  lockInteractions();

  startTimer();
  loadQuestion();
  startCamera();
}

// FULLSCREEN
function enterFullscreen() {
  let el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
}

// EXIT FULLSCREEN DETECT
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    misconduct++;
    handleViolation("Exited fullscreen");
  }
});

// TIMER
function startTimer() {
  timerInterval = setInterval(() => {
    if (isPaused) return;

    timeLeft--;

    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;

    document.getElementById("timer").innerText =
      `${min}:${sec < 10 ? '0'+sec : sec}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishTest();
    }
  }, 1000);
}

// LOAD QUESTION
function loadQuestion() {
  let q = questions[currentQuestion];

  document.getElementById("question").innerText = q.question;

  let html = "";
  q.options.forEach((opt, index) => {
    html += `
      <button onclick="selectOption(${index})"
        class="option-btn btn btn-outline-primary w-100 mb-2">
        ${opt}
      </button>
    `;
  });

  document.getElementById("options").innerHTML = html;
}

// SELECT OPTION
function selectOption(index) {
  userAnswers[currentQuestion] = index;

  let buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn, i) => {
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-outline-primary");

    if (i === index) {
      btn.classList.remove("btn-outline-primary");
      btn.classList.add("btn-primary");
    }
  });
}

// NEXT QUESTION
function nextQuestion() {
  currentQuestion++;

  if (currentQuestion >= questions.length) {
    finishTest();
  } else {
    loadQuestion();
  }
}

// CAMERA
async function startCamera() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch {
    alert("Camera required!");
    stopTest();
  }
}

// TAB SWITCH
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    misconduct++;
    handleViolation("Tab switch detected");
  }
});

// LOCK INTERACTIONS
function lockInteractions() {
  document.addEventListener("contextmenu", e => e.preventDefault());

  ["copy","cut","paste"].forEach(evt =>
    document.addEventListener(evt, e => e.preventDefault())
  );

  document.addEventListener("selectstart", e => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    const blocked =
      e.key === "F12" ||
      (e.ctrlKey && ["c","x","v","u","s","p","a"].includes(e.key.toLowerCase())) ||
      (e.ctrlKey && e.shiftKey && ["i","j","c"].includes(e.key.toLowerCase()));

    if (blocked) {
      e.preventDefault();
      misconduct++;
      handleViolation("Restricted key used");
    }
  });
}

// VIOLATION HANDLER
function handleViolation(reason) {
  alert("⚠️ " + reason);

  if (misconduct >= 3) {
    alert("Test terminated due to cheating");
    stopTest();
  }
}

// STOP TEST
function stopTest() {
  clearInterval(timerInterval);
  document.getElementById("testBox").style.display = "none";
  document.getElementById("failBox").style.display = "block";
}

// FINISH TEST
function finishTest() {
  clearInterval(timerInterval);

  document.getElementById("testBox").style.display = "none";
  document.getElementById("resultBox").style.display = "block";

  let now = new Date();
  testId = `${now.getDate()}M${now.getMinutes()}S${now.getSeconds()}`;

  startResultCountdown();
}

// COUNTDOWN
function startResultCountdown() {
  let interval = setInterval(() => {
    resultCountdown--;

    document.getElementById("resultTimer").innerText =
      `Generating PDF in ${resultCountdown}s`;

    if (resultCountdown <= 0) {
      clearInterval(interval);
      generatePDF();
    }
  }, 1000);
}

// PDF GENERATION (🔥 FIXED SCORE LOGIC)
function generatePDF() {
  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();

  let score = 0;

  // ✅ FIXED HERE
  questions.forEach((q, i) => {
    if (q.options[userAnswers[i]] === q.answer) {
      score++;
    }
  });

  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  const status = percent < 40 ? "FAIL" : "PASS";

  let suggestion = "";
  if (percent < 40) {
    suggestion = "Focus on basics. Revise fundamentals daily.";
  } else if (percent < 70) {
    suggestion = "Good attempt. Practice more MCQs.";
  } else {
    suggestion = "Excellent performance.";
  }

  let y = 20;

  // HEADER
  doc.setFillColor(0, 123, 255);
  doc.rect(0, 0, 210, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("SB NOTES TEST RESULT", 20, 13);

  doc.setTextColor(0, 0, 0);
  y = 30;

  doc.text(`Name: ${currentUser.name}`, 20, y);
  y += 8;

  doc.text(`Email: ${currentUser.email}`, 20, y);
  y += 8;

  doc.text(`Test ID: ${testId}`, 20, y);
  y += 8;

  doc.text(`Score: ${score}/${total} (${percent}%)`, 20, y);
  y += 8;

  doc.text(`Status: ${status}`, 20, y);
  y += 10;

  doc.text(`Performance: ${suggestion}`, 20, y);
  y += 10;

  doc.text(`Misconduct: ${misconduct}`, 20, y);

  // SIGNATURE
  y += 20;
  doc.text("Signature:", 20, y);
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.text("Srinjoy", 20, y);

  // FOOTER
  doc.setFontSize(10);
  doc.text("SB Notes © | srinjoyy.biswass@gmail.com", 20, 290);

  doc.save(`SB-Result-${testId}.pdf`);

  location.reload();
}

// GLOBAL ACCESS (IMPORTANT)
window.login = login;
window.nextQuestion = nextQuestion;
window.selectOption = selectOption;