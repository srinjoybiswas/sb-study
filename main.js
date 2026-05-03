let currentUser = null;
let currentQuestion = 0;
let timeLeft = 3600; // 1 hour
let misconduct = 0;

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

  // Check time (6 PM only)
  let now = new Date();
  if (now.getHours() !== 20) {
    alert("Test only available at 8 PM(3-MAY-2026)");
    return;
  }

  // Check questions
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

  document.documentElement.requestFullscreen();

  startTimer();
  loadQuestion();
  startCamera();
}

// TIMER
function startTimer() {
  let timer = setInterval(() => {
    timeLeft--;

    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;

    document.getElementById("timer").innerText =
      `${min}:${sec < 10 ? '0'+sec : sec}`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      finishTest();
    }
  }, 1000);
}

// QUESTIONS
function loadQuestion() {
  let q = questions[currentQuestion];

  document.getElementById("question").innerText = q.question;

  let html = "";
  q.options.forEach(opt => {
    html += `<button>${opt}</button><br>`;
  });

  document.getElementById("options").innerHTML = html;
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion >= questions.length) {
    finishTest();
  } else {
    loadQuestion();
  }
}

// CAMERA (basic)
async function startCamera() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch (e) {
    alert("Camera required!");
    stopTest();
  }
}

// TAB SWITCH DETECTION
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    misconduct++;
    checkMisconduct();
  }
});

// MISCONDUCT SYSTEM
function checkMisconduct() {
  if (misconduct >= 30) {
    stopTest();
  }
}

// STOP TEST
function stopTest() {
  document.getElementById("testBox").style.display = "none";
  document.getElementById("failBox").style.display = "block";
}

// FINISH TEST
function finishTest() {
  alert("Test Completed");
  location.reload();
}