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

// ===== DOM ELEMENTS =====
const lockScreen = document.getElementById(CONFIG.lockScreenId);
const passwordInput = document.getElementById(CONFIG.passwordInputId);
const unlockBtn = document.getElementById(CONFIG.unlockBtnId);
const errorMsg = document.getElementById(CONFIG.errorMsgId);
const lockCard = document.querySelector(CONFIG.lockCardSelector);
const body = document.body;

// ===== UNLOCK FUNCTION =====
function unlockScreen() {
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
    
    if (inputPassword === CONFIG.password) {
        unlockScreen();
    } else {
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
        console.log('❌ Wrong password');
    }
}

// ===== CLEAR ANIMATIONS =====
function clearAnimation() {
    lockCard.classList.remove('shake');
}

function hideError() {
    errorMsg.classList.remove('show');
}

// ===== CHECK IF ALREADY UNLOCKED =====
function initLockScreen() {
    if (localStorage.getItem('sonlinhtuu_unlocked') === 'true') {
        lockScreen.classList.add('unlocked');
        body.classList.remove(CONFIG.bodyLockedClass);
        lockScreen.style.display = 'none';
        console.log('🔓 Already unlocked (from localStorage)');
    }
}

// ===== EVENT LISTENERS =====
unlockBtn.addEventListener('click', verifyPassword);

passwordInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        verifyPassword();
    }
});

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', initLockScreen);
