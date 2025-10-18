  // --- JavaScript Logic ---

        const contentData = [
            // --- Semister 1: Year 2025 (Foundation) - 2 Subjects ---
            {id:"sem1-sub1", title:"C-Programming", genre:"Programming", year:2025, rating:9.0, pdfLink:"#404", modules: []},
            {id:"sem1-sub2", title:"Digital Electronics", genre:"Hardware", year:2025, rating:8.5, pdfLink:"assets/pdfs/Digital_Electronics_Handbook.pdf", modules: []},
            
            // --- Semister 2: Year 2025 (Web Dev & Architecture) - 2 Subjects ---
            {id:"sem2-sub1", title:"HTML, CSS, & JavaScript", genre:"Web Dev", year:2025, rating:9.2, pdfLink:"assets/pdfs/Web_Fundamentals_Guide.pdf", modules: []},
            {id:"sem2-sub2", title:"Computer Architecture", genre:"Core CS", year:2025, rating:8.8, pdfLink:"assets/pdfs/Computer_Architecture_Book.pdf", modules: []},
            
            // --- Semister 3: Year 2026 (DSA, Python, Constitution, Marketing) - 4 Subjects ---
            {
                id:"sem3-sub1", 
                title:"Data Struct. & Algo. (C)", 
                genre:"Algorithms", 
                year:2026, 
                rating:9.5, 
                pdfLink:"assets/pdfs/DSA_Notes_Full.pdf", 
                modules:[
                    // SRINJOY: These modules open the watermark form and then link to the requested files
                    { title: "Module 1: Basic Data Structures", pdfLink: "assets/pdfs/3RD-SEM/M-1.pdf" },
                    { title: "Module 2: Advanced Data Structures", pdfLink: "assets/pdfs/3RD-SEM/M-2.pdf" },
                    { title: "Module 3: Algorithms and Analysis", pdfLink: "assets/pdfs/3RD-SEM/M-3.pdf" },
                ]
            }, 
            {
                id:"sem3-sub2", 
                title:"Python Programming", 
                genre:"Programming", 
                year:2026, 
                rating:9.1, 
                pdfLink:"assets/pdfs/python.pdf", 
                modules: []
            },
            {
                id:"sem3-sub3", 
                title:"Indian Constitution", 
                genre:"AECC", 
                year:2026, 
                rating:9.1, 
                pdfLink:"assets/pdfs/Python_for_Data.pdf", 
                modules: [
                    { title: "Module 1: Introduction to Constitution", pdfLink: "assets/pdfs/3RD-SEM/INDIAN CONSTITUTION/M1.pdf" },
                    { title: "Module 2: Union Executive", pdfLink: "assets/pdfs/3RD-SEM/INDIAN CONSTITUTION/M2.pdf" },
                    // Corrected PDF link typo here, assuming M-1.pdf was meant to be 3RD-SEM/M-1.pdf
                    { title: "Module 3: State and Local Governments", pdfLink: "assets/pdfs/3RD-SEM/INDIAN CONSTITUTION/M3.pdf" },
                ]
            },
            {
                id:"sem3-sub4", 
                title:"Principal of Marketing", 
                genre:"MIM", 
                year:2026, 
                rating:9.0, 
                pdfLink:"assets/pdfs/Marketing_Principles.pdf", // Changed to a unique placeholder link
                modules: [
                    { title: "Module 1", pdfLink: "assets/pdfs/3RD-SEM/PRINCIPAL OF MAKETING/M1.pdf" },
                    { title: "Module 2", pdfLink: "assets/pdfs/3RD-SEM/PRINCIPAL OF MAKETING/M2.pdf" },
                    { title: "Module 3", pdfLink: "assets/pdfs/3RD-SEM/PRINCIPAL OF MAKETING/M3.pdf"},
                    { title: "Module 4", pdfLink: "assets/pdfs/3RD-SEM/PRINCIPAL OF MAKETING/M4.pdf"},
                    { title: "Module 5", pdfLink: "assets/pdfs/3RD-SEM/PRINCIPAL OF MAKETING/M5.pdf"},
                ]
            },
            
            // --- Semister 4: Year 2026 (OS & DBMS) - 3 Subjects ---
            {id:"sem4-sub1", title:"Operating Systems", genre:"Core CS", year:2026, rating:8.7, pdfLink:"assets/pdfs/OS_Principles.pdf", modules: []},
            {id:"sem4-sub2", title:"Database Management (DBMS)", genre:"Data", year:2026, rating:8.9, pdfLink:"assets/pdfs/DBMS_Concepts.pdf", modules: []},
            {id:"sem4-sub3", title:"Software Engineering", genre:"Methodology", year:2026, rating:8.4, pdfLink:"assets/pdfs/Software_Engineering_Practices.pdf", modules: []},

            // --- Semister 5: Year 2027 (Engineering) - 2 Subjects ---
            {id:"sem5-sub1", title:"Advanced Networks", genre:"Networking", year:2027, rating:9.0, pdfLink:"assets/pdfs/Computer_Networks_Protocols.pdf", modules: []},
            {id:"sem5-sub2", title:"Mobile App Development", genre:"Development", year:2027, rating:8.5, pdfLink:"assets/pdfs/Mobile_App_Notes.pdf", modules: []},

            // --- Semister 6: Year 2027 (Emerging Tech) - 2 Subjects ---
            {id:"sem6-sub1", title:"Artificial Intelligence", genre:"AI/ML", year:2027, rating:9.3, pdfLink:"assets/pdfs/AI_Fundamentals.pdf", modules: []},
            {id:"sem6-sub2", title:"Compiler Design", genre:"Core CS", year:2027, rating:8.6, pdfLink:"assets/pdfs/Compiler_Design_Theory.pdf", modules: []},

            // --- Semister 7: Year 2028 (Advanced Dev) - 2 Subjects ---
            {id:"sem7-sub1", title:"Cloud Computing", genre:"Emerging", year:2028, rating:8.5, pdfLink:"assets/pdfs/Cloud_Tech_Basics.pdf", modules: []},
            {id:"sem7-sub2", title:"Cyber Security & Cryptography", genre:"Security", year:2028, rating:8.8, pdfLink:"assets/pdfs/Cyber_Security_Handbook.pdf", modules: []},
            
            // --- Semister 8: Year 2028 (Finals) - 2 Subjects ---
            {id:"sem8-sub1", title:"Major Project / Thesis", genre:"Final", year:2028, rating:9.7, pdfLink:"assets/pdfs/Thesis_Guidelines.pdf", modules: []},
            {id:"sem8-sub2", title:"Professional Ethics & Law", genre:"Ethics", year:2028, rating:8.2, pdfLink:"assets/pdfs/Ethics_and_Law_for_IT.pdf", modules: []}
        ];

        let selectedPdfUrl = "";

        /**
         * Creates the HTML markup for a single subject card.
         * @param {object} item - The subject data object.
         * @returns {HTMLElement} The created subject card element.
         */
        function createSubjectCard(item) {
            const card = document.createElement("a");
            card.href = "#";
            card.className = "subject-card";
            card.dataset.id = item.id;
            card.dataset.pdfLink = item.pdfLink;

            // Determine which semester the subject belongs to (e.g., "sem1", "sem2", etc.)
            const semesterNumberMatch = item.id.match(/sem(\d+)/);
            const semesterNumber = semesterNumberMatch ? parseInt(semesterNumberMatch[1]) : 0;

            // Event listener to handle click logic
            card.addEventListener('click', (e) => {
                e.preventDefault();

                // 1. Handle Hardcoded 404 Error 
                if (item.pdfLink === "#404") {
                    alert("Error: The requested resource is not available (404 Not Found).");
                    return;
                }
                
                // 2. Handle UNAVAILABLE Notes for Sem 5-8 
                if (semesterNumber > 4) {
                    showNotesUnavailableModal();
                    return;
                }

                // 3. Module List Flow (For subjects with modules defined)
                if (item.modules && item.modules.length > 0) {
                    showModuleModal(item);
                } else {
                    // 4. Default to Watermark/Direct Access for subjects without modules
                    selectedPdfUrl = item.pdfLink;
                    showWatermarkModal();
                }
            });
            
            const posterContent = `<i class="fa-solid fa-file-pdf"></i>`;

            card.innerHTML = `
                <div class="subject-poster">
                    ${posterContent}
                    <div class="subject-rating">${item.rating}</div>
                </div>
                <div class="subject-info">
                    <h3 class="subject-title">${item.title}</h3>
                    <div class="subject-meta">
                        <span>${item.genre}</span>
                        <span>${item.year || ""}</span>
                    </div>
                </div>
            `;
            return card;
        }

        /**
         * Generates and inserts subject cards into the specified container.
         * @param {string} containerId - The ID of the HTML container element.
         * @param {Array<object>} items - The list of subject data objects.
         */
        function generateCards(containerId, items) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container not found for ID: ${containerId}`);
                return;
            }
            container.innerHTML = "";
            items.forEach(item => {
                container.appendChild(createSubjectCard(item));
            });
        }
        
        // --- Modal Control Functions ---

        function showModuleModal(subject) {
            document.getElementById('modalSubjectTitle').textContent = `Modules for ${subject.title}`;
            const modulesListContainer = document.getElementById('modulesList');
            modulesListContainer.innerHTML = ''; // Clear previous list

            subject.modules.forEach(module => {
                const moduleItem = document.createElement('div');
                moduleItem.className = 'modal-list-item';
                moduleItem.innerHTML = `
                    <span>${module.title}</span>
                    <i class="fa-solid fa-book text-lg text-secondary-color"></i>
                `;
                moduleItem.onclick = () => {
                    selectedPdfUrl = module.pdfLink;
                    closeModuleModal();
                    showWatermarkModal();
                };
                modulesListContainer.appendChild(moduleItem);
            });
            
            document.getElementById('moduleModal').style.display = 'flex';
        }

        function closeModuleModal() {
            document.getElementById('moduleModal').style.display = 'none';
        }
        
        function showWatermarkModal() {
            document.getElementById('watermarkModal').style.display = 'flex';
        }
        
        function closeWatermarkModal() {
            document.getElementById('watermarkModal').style.display = 'none';
        }
        
        function showNotesUnavailableModal() {
            document.getElementById('notesUnavailableModal').style.display = 'flex';
        }
        
        function closeNotesUnavailableModal() {
            document.getElementById('notesUnavailableModal').style.display = 'none';
        }


        /**
         * Simulates client-side watermarking and opens the PDF.
         */
        function accessDocument() {
            const name = document.getElementById('userName').value.trim();
            const phone = document.getElementById('userPhone').value.trim();

            if (!name || !phone) {
                alert("Please enter both your name and phone number.");
                return;
            }

            // Construct a URL with parameters for the watermark
            const finalUrl = `${selectedPdfUrl}?user=${encodeURIComponent(name)}&id=${encodeURIComponent(phone)}`;

            // Open the document
            window.open(finalUrl, '_blank');

            // Close the modal and reset input fields
            closeWatermarkModal();
            document.getElementById('userName').value = '';
            document.getElementById('userPhone').value = '';
        }

        // Global functions to allow them to be called from the inline onclick in the modals
        window.accessDocument = accessDocument;
        window.closeModuleModal = closeModuleModal;
        window.closeWatermarkModal = closeWatermarkModal;
        window.closeNotesUnavailableModal = closeNotesUnavailableModal;

        /**
         * Splits the contentData into sections and calls generateCards for each.
         */
        function initializeSemesters(data) {
            // Define the number of subjects for each semester based on the contentData array provided.
            const semesterMap = {
                1: 2, 
                2: 2, 
                3: 4, // <-- CRITICAL FIX: Set to 4 to include all four Sem 3 subjects
                4: 3, 
                5: 2, 
                6: 2, 
                7: 2, 
                8: 2  
            };

            let dataIndex = 0;
            for (let i = 1; i <= 8; i++) {
                const containerId = `semister-${i}-container`;
                const itemsPerSection = semesterMap[i] || 0;
                
                const sectionData = data.slice(dataIndex, dataIndex + itemsPerSection);
                dataIndex += itemsPerSection;
                
                generateCards(containerId, sectionData);
            }
        }

        // Close modals when clicking outside of them
        document.addEventListener('DOMContentLoaded', () => {
            initializeSemesters(contentData);
            const modals = [
                document.getElementById('moduleModal'),
                document.getElementById('watermarkModal'),
                document.getElementById('notesUnavailableModal')
            ];

            window.onclick = function(event) {
                modals.forEach(modal => {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                });
            }
        });