const questions = [
  // Programming & Web Development (Easy)
  {
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"],
    answer: "Hyper Text Markup Language"
  },
  {
    question: "Which CSS property is used to change the text color?",
    options: ["text-color", "font-color", "color", "text-style"],
    answer: "color"
  },
  {
    question: "Which symbol is used for single-line comments in JavaScript?",
    options: ["<!-- -->", "//", "/* */", "#"],
    answer: "//"
  },
  {
    question: "What is the correct way to write a JavaScript array?",
    options: ["{1, 2, 3}", "['apple', 'banana', 'orange']", "(1, 2, 3)", "<1, 2, 3>"],
    answer: "['apple', 'banana', 'orange']"
  },
  {
    question: "Which operator is used to compare both value and type in JavaScript?",
    options: ["=", "==", "===", "!="],
    answer: "==="
  },

  // Computer Fundamentals (Easy)
  {
    question: "What is the full form of RAM?",
    options: ["Readily Available Memory", "Random Access Memory", "Read Access Memory", "Run Access Memory"],
    answer: "Random Access Memory"
  },
  {
    question: "Which of the following is an output device?",
    options: ["Keyboard", "Mouse", "Monitor", "Scanner"],
    answer: "Monitor"
  },
  {
    question: "What is the brain of the computer?",
    options: ["RAM", "Hard Disk", "CPU", "Motherboard"],
    answer: "CPU"
  },
  {
    question: "Which of these is a search engine?",
    options: ["Google Chrome", "Google", "Windows", "MS Word"],
    answer: "Google"
  },
  {
    question: "What does URL stand for?",
    options: ["Uniform Resource Locator", "Universal Resource Link", "Uniform Reference Link", "Universal Reference Locator"],
    answer: "Uniform Resource Locator"
  },

  // Operating System (Easy to Moderate)
  {
    question: "Which of the following is an operating system?",
    options: ["Microsoft Word", "Google Chrome", "Linux", "Photoshop"],
    answer: "Linux"
  },
  {
    question: "What does GUI stand for?",
    options: ["Graphical User Interface", "General User Interface", "Graphical Unit Interface", "General Unit Interface"],
    answer: "Graphical User Interface"
  },
  {
    question: "Which key is used to refresh a webpage?",
    options: ["F1", "F5", "F3", "F7"],
    answer: "F5"
  },
  {
    question: "What is the default file extension for a text file in Windows?",
    options: [".doc", ".txt", ".exe", ".jpg"],
    answer: ".txt"
  },
  {
    question: "Which command is used to list files in Linux?",
    options: ["list", "dir", "ls", "show"],
    answer: "ls"
  },

  // Database & SQL (Moderate)
  {
    question: "What does SQL stand for?",
    options: ["Structured Query Language", "Simple Query Language", "Structured Question Language", "Simple Question Language"],
    answer: "Structured Query Language"
  },
  {
    question: "Which command is used to retrieve data from a database?",
    options: ["INSERT", "UPDATE", "SELECT", "DELETE"],
    answer: "SELECT"
  },
  {
    question: "A primary key must be:",
    options: ["Null", "Duplicate", "Unique and Not Null", "Optional"],
    answer: "Unique and Not Null"
  },

  // Networking (Easy to Moderate)
  {
    question: "What does LAN stand for?",
    options: ["Large Area Network", "Local Area Network", "Long Area Network", "Link Area Network"],
    answer: "Local Area Network"
  },
  {
    question: "Which device connects multiple computers in a network?",
    options: ["Switch", "CPU", "RAM", "Monitor"],
    answer: "Switch"
  },
  {
    question: "What does IP stand for?",
    options: ["Internet Protocol", "Internal Protocol", "Internet Program", "Internal Program"],
    answer: "Internet Protocol"
  },

  // MS Office & General (Easy)
  {
    question: "Which software is used to create presentations?",
    options: ["MS Word", "MS Excel", "MS PowerPoint", "MS Access"],
    answer: "MS PowerPoint"
  },
  {
    question: "Which shortcut key is used to copy text?",
    options: ["Ctrl + V", "Ctrl + C", "Ctrl + X", "Ctrl + Z"],
    answer: "Ctrl + C"
  },
  {
    question: "What does PDF stand for?",
    options: ["Printable Document Format", "Portable Document Format", "Program Document File", "Public Document Format"],
    answer: "Portable Document Format"
  },
  {
    question: "Which of the following is a social media platform?",
    options: ["Google", "Instagram", "Microsoft", "Amazon"],
    answer: "Instagram"
  },
  {
    question: "What is the most popular programming language for web development?",
    options: ["Python", "C++", "JavaScript", "Java"],
    answer: "JavaScript"
  }
];

// Optional: Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { questions };
}