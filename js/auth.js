/**
 * SB NOTES - Master Authentication Controller
 * Handles Login, Signup, and Payment Redirect logic.
 */
app.controller('AuthController', function($scope, $http, $window, CONFIG) {
    // 1. Initialize variables
    $scope.user = {};
    $scope.loading = false;
    $scope.errorMessage = "";

    /**
     * --- LOGIN HANDLER ---
     * Validates input and executes the login action.
     */
    $scope.handleLogin = function() {
        if (!$scope.user.email || !$scope.user.password) {
            $scope.errorMessage = "Please enter both email and password.";
            return;
        }
        $scope.executeAuth("login");
    };

    /**
     * --- SIGNUP HANDLER ---
     * Validates passwords and executes the signup action.
     */
    $scope.handleSignup = function() {
        if ($scope.user.password !== $scope.user.confirmPassword) {
            $scope.errorMessage = "Passwords do not match.";
            return;
        }
        $scope.executeAuth("signup");
    };

    /**
     * --- CORE AUTH ENGINE ---
     * Handles the HTTP communication with Google Apps Script.
     */
    $scope.executeAuth = function(actionType) {
        $scope.loading = true;
        $scope.errorMessage = "";

        // Prepare Payload
        // .trim().toLowerCase() is critical to avoid "Invalid Login" errors 
        // caused by accidental spaces or capital letters.
        const payload = {
            action: actionType,
            name: $scope.user.name || "",
            email: $scope.user.email.trim().toLowerCase(),
            password: $scope.user.password.trim(),
            fingerprint: navigator.userAgent // Optional: Helps track devices
        };

        $http.post(CONFIG.API_URL, JSON.stringify(payload))
        .then(function(response) {
            const res = response.data;

            if (res.status === "success") {
                if (actionType === "login") {
                    // Check if Admin has verified the user (Column D in Sheet)
                    if (res.verified) {
                        // Create Session
                        localStorage.setItem('userEmail', payload.email);
                        localStorage.setItem('isLoggedIn', 'true');
                        
                        // Redirect to Study Deck
                        $window.location.href = 'dashboard.html';
                    } else {
                        $scope.errorMessage = "Access Pending: Please ensure payment proof is uploaded and verified.";
                    }
                } else if (actionType === "signup") {
                    // NEW: Redirect to Payment Page after Signup
                    // Store email so the payment page knows which user is uploading proof
                    localStorage.setItem('pendingEmail', payload.email);
                    
                    alert("Registration successful! Redirecting to payment...");
                    $window.location.href = 'payment.html';
                }
            } else {
                // Display error message from Google Script (e.g., "Email already registered")
                $scope.errorMessage = res.message || "An error occurred. Please try again.";
            }
        })
        .catch(function(error) {
            console.error("Auth Error:", error);
            $scope.errorMessage = "Connection failed. Check your internet or API link.";
        })
        .finally(function() {
            $scope.loading = false;
        });
    };

    /**
     * --- LOGOUT ---
     */
    $scope.logout = function() {
        localStorage.clear();
        $window.location.href = 'index.html';
    };
});