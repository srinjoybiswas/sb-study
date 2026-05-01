/**
 * SB NOTES - Authentication Controller
 * Handles Login and Signup actions with Google Apps Script backend
 */
app.controller('AuthController', function($scope, $http, $window, CONFIG) {
    // 1. Initialize variables
    $scope.user = {};
    $scope.loading = false;
    $scope.errorMessage = "";

    // --- LOGIN FUNCTION ---
    $scope.handleLogin = function() {
        if (!$scope.user.email || !$scope.user.password) {
            $scope.errorMessage = "Please enter both email and password.";
            return;
        }

        $scope.prepareAndSend("login");
    };

    // --- SIGNUP FUNCTION ---
    $scope.handleSignup = function() {
        if ($scope.user.password !== $scope.user.confirmPassword) {
            $scope.errorMessage = "Passwords do not match.";
            return;
        }

        $scope.prepareAndSend("signup");
    };

    // --- SHARED BACKEND ENGINE ---
    $scope.prepareAndSend = function(actionType) {
        $scope.loading = true;
        $scope.errorMessage = "";

        // Normalize data for Google Sheets consistency
        const payload = {
            action: actionType,
            name: $scope.user.name || "",
            email: $scope.user.email.trim().toLowerCase(),
            password: $scope.user.password.trim(),
            fingerprint: navigator.userAgent // Basic security tracking
        };

        $http.post(CONFIG.API_URL, JSON.stringify(payload))
        .then(function(response) {
            const res = response.data;

            if (res.status === "success") {
                if (actionType === "login") {
                    // Logic for verified users (Handles CAPS TRUE from sheet)
                    if (res.verified) {
                        localStorage.setItem('userEmail', payload.email);
                        localStorage.setItem('isLoggedIn', 'true');
                        $window.location.href = 'dashboard.html';
                    } else {
                        $scope.errorMessage = "Payment pending or verification in progress.";
                    }
                } else {
                    // Success for Signup: Redirect to login or payment proof page
                    alert("Account created successfully! Please Log In.");
                    $window.location.href = 'login.html';
                }
            } else {
                $scope.errorMessage = res.message || "Action failed. Please try again.";
            }
        })
        .catch(function(error) {
            console.error("Auth Error:", error);
            $scope.errorMessage = "Connection error. Check your internet or API deployment.";
        })
        .finally(function() {
            $scope.loading = false;
        });
    };
});