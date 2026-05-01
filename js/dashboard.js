/**
 * SB NOTES - Dashboard Logic
 * Handles dynamic department extraction and note filtering.
 */
app.controller('DashboardController', function($scope, $window, $http, CONFIG) {
    // 1. Initialization
    $scope.userEmail = localStorage.getItem('userEmail');
    $scope.allNotes = [];      // Stores everything from the sheet
    $scope.departments = [];   // Extracted uniquely from data
    $scope.selectedDept = "";  // Filters the list (empty string = All)
    $scope.loading = true;

    // 2. Security Check: Protect the route
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        $window.location.href = 'login.html';
    }

    /**
     * Fetch all data from the Google Apps Script
     */
    $scope.init = function() {
        $scope.loading = true;
        
        // Calls the doGet(e) function in your script with ?action=getNotes
        $http.get(CONFIG.API_URL + "?action=getNotes")
        .then(function(response) {
            // response.data should be an array of note objects
            $scope.allNotes = response.data;
            
            // --- DYNAMIC DEPARTMENT EXTRACTION ---
            // 1. Get all 'dept' values: ['BCA', 'Physics', 'BCA', 'Civil']
            const rawDepts = $scope.allNotes.map(note => note.dept);
            
            // 2. Use Set to remove duplicates and sort alphabetically
            // Results in: ['BCA', 'Civil', 'Physics']
            $scope.departments = [...new Set(rawDepts)].sort(); 
        })
        .catch(function(err) {
            console.error("Dashboard Fetch Error:", err);
            alert("Failed to load study deck. Please check your API deployment.");
        })
        .finally(function() {
            $scope.loading = false;
        });
    };

    /**
     * Filter Logic
     */
    $scope.selectDept = function(dept) {
        $scope.selectedDept = dept;
    };

    /**
     * Navigation to Viewer
     */
    $scope.viewNote = function(note) {
        // Save the specific note object so the viewer page knows what to display
        localStorage.setItem('currentNote', JSON.stringify(note));
        $window.location.href = 'notes-viewer.html';
    };

    /**
     * Session Termination
     */
    $scope.logout = function() {
        localStorage.clear();
        $window.location.href = 'index.html';
    };

    // Run the initialization
    $scope.init();
});