/**
 * SB NOTES - Core Application Logic
 * Optimized for Google Apps Script Backend
 */

var app = angular.module('sbNotesApp', []);

// 1. CONFIGURATION: Fixes CORS/Pre-flight issues with Google Apps Script
app.config(['$httpProvider', function($httpProvider) {
    // Google Apps Script prefers text/plain for POST to avoid CORS pre-flight
    $httpProvider.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8';
}]);

// 2. GLOBAL CONSTANTS
app.constant('CONFIG', {
    // PASTE YOUR DEPLOYED GOOGLE SCRIPT URL HERE
    API_URL: "https://script.google.com/macros/s/AKfycbxYhF5aQiZrSwKMGxQ6EYkNV7nl9gw0UwYT2-iqGzXEixQkK0DIrEycrjsjD5qs19sRjA/exec",
    VERSION: "1.0.0"
});

// 3. SECURITY SERVICE: Checks if user is verified
app.factory('AuthService', function($window) {
    return {
        checkAccess: function() {
            var isLoggedIn = localStorage.getItem('isLoggedIn');
            if (!isLoggedIn) {
                $window.location.href = 'login.html';
            }
        },
        logout: function() {
            localStorage.clear();
            $window.location.href = 'index.html';
        }
    };
});

// 4. COMMON UTILITIES: Anti-Screenshot logic for all pages
app.run(function($rootScope) {
    $rootScope.globalProtect = function() {
        // Disable right-click globally if needed
        document.addEventListener('contextmenu', event => event.preventDefault());
        
        // Clear clipboard on PrintScreen
        document.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen') {
                navigator.clipboard.writeText('Screenshots Restricted - SB Notes');
            }
        });
    };
    $rootScope.globalProtect();
});