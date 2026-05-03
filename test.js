// ================= TEST LOGIC =================
let currentUser = null;
let currentQuestion = 0;
let timeLeft = 3600; // 60 minutes
let userAnswers = [];
let timerInterval = null;
let testStartTime = null;

// DOM Elements
const loginBox = document.getElementById("loginBox");
const testBox = document.getElementById("testBox");
const resultBox = document.getElementById("resultBox");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const timerDisplay = document.getElementById("timer");
const questionText = document.getElementById("question");
const optionsContainer = document.getElementById("options");
const questionCounter = document.getElementById("questionCounter");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");


// ================= QUESTIONS (25 MCQs) - REPLACE THIS SECTION =================
const questions = [
    // Question 1
    { 
        question: "What does HTML stand for?", 
        options: ["Hyper Text Markup Language", "High Tech Language", "Hyper Tool Markup Language", "Home Tool Language"], 
        answer: "Hyper Text Markup Language" 
    },
    // Question 2
    { 
        question: "Which language is used for styling web pages?", 
        options: ["HTML", "CSS", "Java", "Python"], 
        answer: "CSS" 
    },
    // Question 3
    { 
        question: "Which is a programming language?", 
        options: ["HTTP", "HTML", "JavaScript", "URL"], 
        answer: "JavaScript" 
    },
    // Question 4
    { 
        question: "Which tag is used for a hyperlink?", 
        options: ["<link>", "<a>", "<href>", "<h>"], 
        answer: "<a>" 
    },
    // Question 5
    { 
        question: "Which symbol is used for comments in JS?", 
        options: ["//", "#", "<!-- -->", "**"], 
        answer: "//" 
    },
    // Question 6
    { 
        question: "What is CPU?", 
        options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Control Processing Unit"], 
        answer: "Central Processing Unit" 
    },
    // Question 7
    { 
        question: "RAM stands for?", 
        options: ["Random Access Memory", "Read Access Memory", "Run Access Memory", "Rapid Access Memory"], 
        answer: "Random Access Memory" 
    },
    // Question 8
    { 
        question: "Which is an input device?", 
        options: ["Monitor", "Keyboard", "Printer", "Speaker"], 
        answer: "Keyboard" 
    },
    // Question 9
    { 
        question: "Which is an output device?", 
        options: ["Mouse", "Scanner", "Monitor", "Keyboard"], 
        answer: "Monitor" 
    },
    // Question 10
    { 
        question: "Brain of computer?", 
        options: ["RAM", "CPU", "Hard Disk", "Motherboard"], 
        answer: "CPU" 
    },
    // Question 11
    { 
        question: "Which OS is open source?", 
        options: ["Windows", "Linux", "MacOS", "DOS"], 
        answer: "Linux" 
    },
    // Question 12
    { 
        question: "Shortcut to refresh?", 
        options: ["F2", "F5", "F10", "F7"], 
        answer: "F5" 
    },
    // Question 13
    { 
        question: "Default extension of text file?", 
        options: [".doc", ".txt", ".exe", ".pdf"], 
        answer: ".txt" 
    },
    // Question 14
    { 
        question: "GUI means?", 
        options: ["Graphical User Interface", "General User Interface", "Graphical Unit Interface", "General Unit Interface"], 
        answer: "Graphical User Interface" 
    },
    // Question 15
    { 
        question: "Command to list files in Linux?", 
        options: ["ls", "dir", "list", "show"], 
        answer: "ls" 
    },
    // Question 16
    { 
        question: "SQL stands for?", 
        options: ["Structured Query Language", "Simple Query Language", "Structured Question Language", "System Query Language"], 
        answer: "Structured Query Language" 
    },
    // Question 17
    { 
        question: "Command to fetch data from database?", 
        options: ["INSERT", "DELETE", "SELECT", "UPDATE"], 
        answer: "SELECT" 
    },
    // Question 18
    { 
        question: "Primary key must be?", 
        options: ["Null", "Duplicate", "Unique", "Optional"], 
        answer: "Unique" 
    },
    // Question 19
    { 
        question: "LAN stands for?", 
        options: ["Local Area Network", "Large Area Network", "Long Area Network", "Link Area Network"], 
        answer: "Local Area Network" 
    },
    // Question 20
    { 
        question: "IP stands for?", 
        options: ["Internet Protocol", "Internal Protocol", "Internet Program", "Internal Program"], 
        answer: "Internet Protocol" 
    },
    // Question 21
    { 
        question: "Which is presentation software?", 
        options: ["Word", "Excel", "PowerPoint", "Access"], 
        answer: "PowerPoint" 
    },
    // Question 22
    { 
        question: "Shortcut to copy?", 
        options: ["Ctrl+V", "Ctrl+C", "Ctrl+X", "Ctrl+Z"], 
        answer: "Ctrl+C" 
    },
    // Question 23
    { 
        question: "PDF stands for?", 
        options: ["Portable Document Format", "Print Document File", "Public Data File", "Program Data Format"], 
        answer: "Portable Document Format" 
    },
    // Question 24
    { 
        question: "Which is social media platform?", 
        options: ["Google", "Instagram", "Microsoft", "Amazon"], 
        answer: "Instagram" 
    },
    // Question 25
    { 
        question: "Most used web programming language?", 
        options: ["C++", "Java", "Python", "JavaScript"], 
        answer: "JavaScript" 
    }
];

// ================= LOGIN FUNCTION =================
function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        loginError.innerText = "Please enter email and password";
        return;
    }

    // Find user in students array (from student.js)
    const user = students.find(s => s.email === email && s.password === password);

    if (!user) {
        loginError.innerText = "Invalid email or password";
        return;
    }

    currentUser = user;
    startTest();
}

// ================= START TEST =================
function startTest() {
    // Hide login, show test
    loginBox.style.display = "none";
    testBox.style.display = "block";
    
    // Initialize
    currentQuestion = 0;
    userAnswers = new Array(questions.length).fill(null);
    testStartTime = new Date();
    
    // Start timer
    startTimer();
    
    // Load first question
    loadQuestion();
    
    // Update navigation buttons
    updateNavButtons();
}

// ================= TIMER FUNCTION =================
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishTest();
        } else {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
            
            // Warning when 5 minutes left
            if (timeLeft === 300) {
                showToast("⚠️ 5 minutes remaining!", "warning");
            }
        }
    }, 1000);
}

// ================= LOAD QUESTION =================
function loadQuestion() {
    const q = questions[currentQuestion];
    questionText.innerText = q.question;
    
    // Update question counter
    questionCounter.innerText = `Question ${currentQuestion + 1} of ${questions.length}`;
    
    // Generate options HTML
    let html = "";
    q.options.forEach((opt, index) => {
        const isSelected = (userAnswers[currentQuestion] === index);
        const selectedClass = isSelected ? 'btn-primary selected' : 'btn-outline-primary';
        html += `
            <button onclick="selectOption(${index})" 
                class="btn ${selectedClass} w-100 mb-2 text-start option-btn"
                style="border-radius: 12px; padding: 12px 16px; font-weight: normal;">
                <span style="font-weight: bold; display: inline-block; width: 30px;">${String.fromCharCode(65+index)}.</span> 
                ${escapeHtml(opt)}
            </button>
        `;
    });
    optionsContainer.innerHTML = html;
    
    // Update navigation buttons
    updateNavButtons();
}

// ================= SELECT OPTION =================
function selectOption(index) {
    userAnswers[currentQuestion] = index;
    loadQuestion(); // Reload to show selected state
}

// ================= NEXT QUESTION =================
function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
    }
}

// ================= PREVIOUS QUESTION =================
function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

// ================= UPDATE NAVIGATION BUTTONS =================
function updateNavButtons() {
    // Previous button state
    prevBtn.disabled = (currentQuestion === 0);
    
    // Next/Submit button state
    if (currentQuestion === questions.length - 1) {
        nextBtn.style.display = "none";
        submitBtn.style.display = "block";
    } else {
        nextBtn.style.display = "block";
        submitBtn.style.display = "none";
    }
}

// ================= FINISH TEST =================
function finishTest() {
    // Stop timer
    if (timerInterval) clearInterval(timerInterval);
    
    // Calculate score
    let score = 0;
    let incorrectAnswers = [];
    
    questions.forEach((q, i) => {
        const selectedIndex = userAnswers[i];
        if (selectedIndex !== null && q.options[selectedIndex] === q.answer) {
            score++;
        } else if (selectedIndex !== null) {
            incorrectAnswers.push({
                number: i + 1,
                question: q.question,
                userAnswer: q.options[selectedIndex],
                correctAnswer: q.answer
            });
        } else {
            incorrectAnswers.push({
                number: i + 1,
                question: q.question,
                userAnswer: "Not Answered",
                correctAnswer: q.answer
            });
        }
    });
    
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    const endTime = new Date();
    const duration = Math.floor((endTime - testStartTime) / 1000);
    const durationMinutes = Math.floor(duration / 60);
    const durationSeconds = duration % 60;
    
    // Hide test, show result
    testBox.style.display = "none";
    resultBox.style.display = "block";
    
    // Generate and show premium result
    showPremiumResult(score, total, percentage, endTime, durationMinutes, durationSeconds, incorrectAnswers);
}

// ================= PREMIUM RESULT WITH PDF =================
function showPremiumResult(score, total, percentage, endTime, durationMinutes, durationSeconds, incorrectAnswers) {
    const resultContainer = document.getElementById("resultContent");
    const status = percentage >= 60 ? "PASSED" : "FAILED";
    const grade = percentage >= 90 ? "A+" : percentage >= 75 ? "A" : percentage >= 60 ? "B" : percentage >= 45 ? "C" : "D";
    
    // Generate incorrect questions HTML
    let incorrectHtml = '';
    if (incorrectAnswers.length === 0) {
        incorrectHtml = '<div class="text-center text-success my-3"><strong>✨ PERFECT SCORE! All answers are correct. ✨</strong></div>';
    } else {
        incorrectHtml = `
            <div class="mt-4">
                <h5 class="text-warning">📋 Incorrect Answers Review</h5>
                <div class="table-responsive">
                    <table class="table table-sm table-bordered">
                        <thead class="table-dark">
                            <tr><th>#</th><th>Question</th><th>Your Answer</th><th>Correct Answer</th></tr>
                        </thead>
                        <tbody>
                            ${incorrectAnswers.map(inc => `
                                <tr>
                                    <td>${inc.number}</td>
                                    <td>${escapeHtml(inc.question.substring(0, 60))}${inc.question.length > 60 ? '...' : ''}</td>
                                    <td class="text-danger">${escapeHtml(inc.userAnswer)}</td>
                                    <td class="text-success">${escapeHtml(inc.correctAnswer)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Main result HTML
    resultContainer.innerHTML = `
        <div class="premium-result-card" id="pdfContent" style="background: white; border-radius: 20px; padding: 30px; border: 2px solid #1e40af; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <!-- Header with SB Notes Branding -->
            <div style="text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="font-size: 14px; color: #1e40af;">📅 ${new Date().toLocaleDateString()}</div>
                    <div style="background: #1e40af; color: white; padding: 5px 15px; border-radius: 30px; font-weight: bold;">TEST ID: ${currentUser.testId || 'SB' + Math.floor(Math.random()*10000)}</div>
                </div>
                <h1 style="color: #1e40af; font-weight: bold; margin: 0;">📘 SB NOTES</h1>
                <p style="color: #475569; margin: 5px 0;">Premium Examination Certificate</p>
                <p style="font-size: 12px; color: #64748b;">© 2025 SB Notes — All Rights Reserved</p>
            </div>
            
            <!-- Student Details -->
            <div style="background: #f0f9ff; border-radius: 16px; padding: 15px; margin-bottom: 20px; border-left: 5px solid #1e40af;">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                    <div><strong>👤 Student Name:</strong> ${escapeHtml(currentUser.name)}</div>
                    <div><strong>📧 Email:</strong> ${escapeHtml(currentUser.email)}</div>
                </div>
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-top: 8px;">
                    <div><strong>🆓 Test ID:</strong> ${currentUser.testId || 'N/A'}</div>
                    <div><strong>⏱️ Duration:</strong> ${durationMinutes}m ${durationSeconds}s</div>
                </div>
            </div>
            
            <!-- Score Section with Circular Gauge -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="position: relative; width: 160px; height: 160px; margin: 0 auto;">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" stroke-width="12"/>
                        <circle cx="80" cy="80" r="70" fill="none" stroke="#1e40af" stroke-width="12" 
                            stroke-dasharray="440" stroke-dashoffset="${440 - (440 * percentage / 100)}" 
                            stroke-linecap="round" transform="rotate(-90 80 80)"/>
                        <text x="80" y="85" text-anchor="middle" font-size="28" font-weight="bold" fill="#1e40af">${percentage}%</text>
                        <text x="80" y="105" text-anchor="middle" font-size="12" fill="#64748b">Score</text>
                    </svg>
                </div>
                <div style="margin-top: 10px;">
                    <span style="font-size: 32px; font-weight: bold; color: #1e40af;">${score}/${total}</span>
                    <br>
                    <span class="badge ${percentage >= 60 ? 'bg-success' : 'bg-danger'}" style="font-size: 16px; padding: 5px 20px;">${status} | Grade: ${grade}</span>
                </div>
            </div>
            
            <!-- Performance Summary -->
            <div style="display: flex; justify-content: space-around; text-align: center; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 16px;">
                <div><strong>📊 Correct</strong><br><span style="font-size: 24px; color: #10b981;">${score}</span></div>
                <div><strong>❌ Incorrect</strong><br><span style="font-size: 24px; color: #ef4444;">${total - score}</span></div>
                <div><strong>📝 Total</strong><br><span style="font-size: 24px; color: #1e40af;">${total}</span></div>
            </div>
            
            ${incorrectHtml}
            
            <!-- Footer with Study Tips -->
            <div style="margin-top: 25px; padding: 15px; background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 16px; color: white; text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <span>📚 Keep Learning</span>
                    <span>⭐ Stay Consistent</span>
                    <span>🎯 Aim for Excellence</span>
                </div>
                <p style="margin-top: 10px; font-size: 11px; opacity: 0.8;">This certificate is system generated and digitally verified by SB Notes Examination Authority</p>
            </div>
        </div>
    `;
    
    // Add download button event
    const downloadBtn = document.getElementById("downloadPDF");
    if (downloadBtn) {
        downloadBtn.onclick = () => downloadPremiumPDF();
    }
    
    // Add restart button event
    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn) {
        restartBtn.onclick = () => location.reload();
    }
}

// ================= DOWNLOAD PREMIUM PDF =================
function downloadPremiumPDF() {
    const element = document.getElementById("pdfContent");
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `SB_Notes_Result_${currentUser.name.replace(/\s/g, '_')}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
    
    // Show success toast
    showToast("✅ PDF downloaded successfully!", "success");
}

// ================= UTILITY FUNCTIONS =================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer") || createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-white bg-${type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'primary'} border-0`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.zIndex = "9999";
    toast.style.minWidth = "250px";
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

function createToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.style.position = "fixed";
        container.style.bottom = "20px";
        container.style.right = "20px";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }
    return container;
}

// ================= KEYBOARD NAVIGATION =================
document.addEventListener("keydown", function(e) {
    if (testBox.style.display === "block") {
        if (e.key === "ArrowRight" && currentQuestion < questions.length - 1) {
            nextQuestion();
        } else if (e.key === "ArrowLeft" && currentQuestion > 0) {
            prevQuestion();
        }
    }
});

// ================= EXPOSE GLOBAL FUNCTIONS =================
window.login = login;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.selectOption = selectOption;
window.finishTest = finishTest;
window.downloadPremiumPDF = downloadPremiumPDF;