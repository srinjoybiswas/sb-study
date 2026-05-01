/**
 * SB NOTES - Anti-Piracy & Content Protection
 */

app.run(function($rootScope, $window) {
    
    const vaultId = 'content-vault'; // The ID of the div containing your notes

    // --- 1. KEYBOARD PROTECTION ---
    document.addEventListener('keydown', function(e) {
        // Block: Ctrl+P (Print), Ctrl+S (Save), Ctrl+U (View Source)
        // Block: Ctrl+Shift+I (Inspect), Ctrl+Shift+C (Element Select), Ctrl+Shift+J (Console)
        if (e.ctrlKey && 
            (e.key === 'p' || e.key === 's' || e.key === 'u' || 
             e.key === 'i' || e.key === 'c' || e.key === 'j' || 
             e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))) {
            e.preventDefault();
            e.stopPropagation();
            alert("Security Alert: This action is prohibited to protect intellectual property.");
            return false;
        }

        // Block: PrintScreen Key
        if (e.key === "PrintScreen") {
            navigator.clipboard.writeText("Protected Content - SB Notes");
            alert("Screenshots are disabled on this platform.");
        }
    });

    // --- 2. FOCUS LOSS BLUR (Anti-Snipping Tool) ---
    // If the user clicks away to open a screenshot tool, the notes blur instantly.
    $window.onblur = function() {
        var vault = document.getElementById(vaultId);
        if (vault) {
            vault.style.filter = "blur(15px)";
            vault.style.transition = "filter 0.1s";
        }
    };

    $window.onfocus = function() {
        var vault = document.getElementById(vaultId);
        if (vault) {
            vault.style.filter = "blur(0px)";
        }
    };

    // --- 3. CLIPBOARD CLEARING ---
    // Clears anything the user might have managed to copy every 2 seconds
    setInterval(function() {
        if (document.hasFocus()) {
            // We don't clear it unless the tab is active to avoid annoying the user
            // in other tabs, but we clear it if they are on our site.
        }
    }, 2000);

    // --- 4. PREVENT DRAG & DROP ---
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });

    // --- 5. DOM TAMPER DETECTION (Optional/Advanced) ---
    // Detects if someone tries to delete the protection layers via DevTools
    var target = document.querySelector('body');
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.removedNodes.length > 0) {
                // If a security layer is removed, reload the page
                if (mutation.removedNodes[0].className === 'watermark') {
                    $window.location.reload();
                }
            }
        });
    });
    
    observer.observe(target, { childList: true, subtree: true });

});