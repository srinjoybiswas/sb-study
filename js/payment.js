/**
 * SB NOTES - Payment & Verification Logic
 */

app.controller('PaymentController', function($scope, $http, $window, CONFIG) {
    
    $scope.loading = false;
    $scope.fileSelected = false;
    $scope.uploadStatus = "";

    // 1. Handle File Selection UI
    $scope.onFileSelect = function(element) {
        $scope.$apply(function() {
            if (element.files.length > 0) {
                $scope.fileSelected = true;
                $scope.selectedFileName = element.files[0].name;
                $scope.uploadStatus = "Image selected: " + $scope.selectedFileName;
            }
        });
    };

    // 2. Submit Payment Proof
    $scope.submitPayment = function() {
        var fileInput = document.getElementById('fileInput');
        if (!fileInput.files.length) {
            alert("Please select a screenshot of your payment first.");
            return;
        }

        $scope.loading = true;
        var file = fileInput.files[0];
        var reader = new FileReader();

        // Convert image to Base64 to send to Google Apps Script
        reader.onloadend = function() {
            var base64String = reader.result.split(',')[1];
            var userEmail = localStorage.getItem('pendingEmail') || localStorage.getItem('userEmail');

            var payload = {
                action: "uploadPayment",
                email: userEmail,
                imageBlob: base64String,
                fileName: "PAYMENT_" + userEmail.split('@')[0] + "_" + Date.now() + ".png"
            };

            $http.post(CONFIG.API_URL, payload)
            .then(function(response) {
                if (response.data.status === "success") {
                    alert("Payment submitted! Our team will verify it within 2-4 hours.");
                    $window.location.href = 'index.html'; // Redirect to home/login
                } else {
                    alert("Error: " + response.data.message);
                }
            })
            .catch(function() {
                alert("Upload failed. Please ensure the image is under 2MB.");
            })
            .finally(function() {
                $scope.loading = false;
            });
        };

        reader.readAsDataURL(file);
    };
});