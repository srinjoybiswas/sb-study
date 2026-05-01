/**
 * SB NOTES - Login Controller
 * Handles user authentication and verification status
 */
app.controller('LoginController', function($scope, $http, $window, CONFIG) {
    // 1. Initialize variables
    $scope.user = {};
    $scope.loading = false;
    $scope.errorMessage = "";

    // 2. Main Login Function
    $scope.handleLogin = function() {
        // Basic Validation: Don't send empty data
        if (!$scope.user.email || !$scope.user.password) {
            $scope.errorMessage = "Please enter both email and password.";
            return;
        }

        $scope.loading = true;
        $scope.errorMessage = "";

        // Prepare the Data (The Payload)
        // .trim() removes accidental spaces
        // .toLowerCase() ensures "SRINJOY@gmail.com" matches "srinjoy@gmail.com"
        const payload = {
            action: "login",
            email: $scope.user.email.trim().toLowerCase(),
            password: $scope.user.password.trim()
        };

        // 3. Send POST request to Google Apps Script
        $http.post(CONFIG.API_URL, JSON.stringify(payload))
        .then(function(response) {
            // Check if the script found the user
            if (response.data.status === "success") {
                
                // CHECK VERIFICATION (Handles your CAPS TRUE from the sheet)
                if (response.data.verified) {
                    // Save Session Data
                    localStorage.setItem('userEmail', payload.email);
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    // SUCCESS: Send to Dashboard
                    $window.location.href = 'dashboard.html';
                } else {
                    // CASE: User exists but Column D is not TRUE
                    $scope.errorMessage = "Payment pending or verification in progress. Access denied.";
                }

            } else {
                // CASE: Wrong email or password
                $scope.errorMessage = response.data.message || "Invalid credentials.";
            }
        })
        .catch(function(error) {
            // CASE: API URL is wrong or internet is down
            console.error("Login Error:", error);
            $scope.errorMessage = "Connection error. Please check your internet or API link.";
        })
        .finally(function() {
            // Always stop the loading spinner
            $scope.loading = false;
        });
    };
});