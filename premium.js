// ===== CONFIGURATION =====
const CONFIG = {
    password: 'sonlinhtuu2024',      // 🔐 Mật khẩu
    lockScreenId: 'lock-screen',
    passwordInputId: 'password-input',
    unlockBtnId: 'unlock-btn',
    errorMsgId: 'error-msg',
    lockCardSelector: '.lock-card',
    bodyLockedClass: 'locked'
};

// ===== INITIALIZE AFTER DOM LOADED =====
function initPasswordLock() {
    // ===== DOM ELEMENTS =====
    const lockScreen = document.getElementById(CONFIG.lockScreenId);
    const passwordInput = document.getElementById(CONFIG.passwordInputId);
    const unlockBtn = document.getElementById(CONFIG.unlockBtnId);
    const errorMsg = document.getElementById(CONFIG.errorMsgId);
    const lockCard = document.querySelector(CONFIG.lockCardSelector);
    const body = document.body;

    // ===== CHECK IF ELEMENTS EXIST =====
    if (!lockScreen || !passwordInput || !unlockBtn || !errorMsg) {
        console.error('❌ Lock screen elements not found!');
        return;
    }

    console.log('✅ Lock screen initialized');

    // ===== UNLOCK FUNCTION =====
    function unlockScreen_action() {
        lockScreen.classList.add('unlocked');
        
        setTimeout(() => {
            body.classList.remove(CONFIG.bodyLockedClass);
            lockScreen.style.display = 'none';
        }, 800);
        
        localStorage.setItem('sonlinhtuu_unlocked', 'true');
        console.log('✅ Website unlocked!');
    }

    // ===== VERIFY PASSWORD =====
    function verifyPassword() {
        const inputPassword = passwordInput.value.trim();
        console.log('🔑 Password entered:', inputPassword);
        
        if (inputPassword === CONFIG.password) {
            console.log('✅ Password correct!');
            unlockScreen_action();
        } else {
            console.log('❌ Wrong password');
            errorMsg.classList.add('show');
            lockCard.classList.add('shake');
            
            setTimeout(() => {
                lockCard.classList.remove('shake');
            }, 400);
            
            setTimeout(() => {
                errorMsg.classList.remove('show');
            }, 3000);
            
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // ===== CHECK IF ALREADY UNLOCKED =====
    function checkUnlockedStatus() {
        if (localStorage.getItem('sonlinhtuu_unlocked') === 'true') {
            lockScreen.classList.add('unlocked');
            body.classList.remove(CONFIG.bodyLockedClass);
            lockScreen.style.display = 'none';
            console.log('🔓 Already unlocked (from localStorage)');
        }
    }

    // ===== EVENT LISTENERS =====
    unlockBtn.addEventListener('click', () => {
        console.log('🖱️ Button clicked');
        verifyPassword();
    });

    passwordInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            console.log('⌨️ Enter pressed');
            verifyPassword();
        }
    });

    // ===== INIT =====
    checkUnlockedStatus();
}

// ===== RUN WHEN DOM IS READY =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordLock);
} else {
    initPasswordLock();
}
