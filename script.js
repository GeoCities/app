// Constants
const API_BASE_URL = 'https://api.web3.bio';
const DEFAULT_AVATAR = 'https://raw.githubusercontent.com/GeoCities/Ads/main/Ads/Nyan%20Cat%20-%20GeoCities.gif';

// Get DOM elements
const bgColorPicker = document.getElementById('bg-color');
const textColorPicker = document.getElementById('text-color');
const borderColorPicker = document.getElementById('border-color');
const effectSelect = document.getElementById('effect-select');
const themeToggle = document.getElementById('theme-toggle');

// Utility functions
function showLoading() {
    document.querySelector('.loading-spinner').style.display = 'block';
}

function hideLoading() {
    document.querySelector('.loading-spinner').style.display = 'none';
}

function showError(message) {
    const errorElement = document.querySelector('.error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    document.querySelector('.error-message').style.display = 'none';
}

function createDefaultAvatar(letter) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--background-color').trim() || '#000000';
    const textColor = computedStyle.getPropertyValue('--primary-color').trim() || '#ffffff';
    const borderColor = computedStyle.getPropertyValue('--border-color').trim() || '#ffffff';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = textColor;
    
    // Store the original letter in a data attribute for theme toggle
    if (letter) {
        canvas.dataset.originalLetter = letter;
    }
    
    // Check if the letter is an emoji (surrogate pair or emoji character)
    const isEmoji = letter && (/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(letter) || 
                            /[\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u.test(letter));
    
    if (isEmoji) {
        // For emojis, use a larger font size
        ctx.font = '120px sans-serif';
    } else {
        // For regular characters
        ctx.font = 'bold 100px sans-serif';
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Use the original character without converting to uppercase for emojis
    // For regular characters, convert to uppercase
    const displayChar = letter ? (isEmoji ? letter : letter.toUpperCase()) : '?';
    ctx.fillText(displayChar, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
}

function setAvatar(avatarUrl, originalLetter) {
    const navLogo = document.getElementById('nav-logo-img');
    const favicon = document.getElementById('favicon');
    
    const url = avatarUrl || DEFAULT_AVATAR;
    navLogo.src = url;
    favicon.href = url;
    
    // Track if this is a default avatar (for color updates)
    if (avatarUrl && avatarUrl.startsWith('data:image/png;base64')) {
        navLogo.dataset.isDefaultAvatar = 'true';
        // Store the original letter for theme toggling
        if (originalLetter) {
            navLogo.dataset.originalLetter = originalLetter;
        }
    } else {
        navLogo.dataset.isDefaultAvatar = 'false';
        delete navLogo.dataset.originalLetter;
    }
}

// Initialize GeoCities avatar
async function initializeGeoCitiesAvatar() {
    try {
        setAvatar(DEFAULT_AVATAR);
        
        const response = await fetch(`${API_BASE_URL}/profile/ens/geocities.eth`);
        if (response.ok) {
            const data = await response.json();
            if (data.avatar) {
                setAvatar(data.avatar);
            }
        }
    } catch (error) {
        console.error('Error fetching GeoCities avatar:', error);
    }
}

// Helper function to reset colors to default theme colors
function resetToDefaultThemeColors() {
    const isLight = document.body.dataset.theme === 'light';
    
    const defaultDark = {
        background: '#000000',
        text: '#ffffff',
        border: '#ffffff'
    };
    
    const defaultLight = {
        background: '#ffffff',
        text: '#000000',
        border: '#000000'
    };
    
    // Use the default colors based on the current theme state
    const defaults = isLight ? defaultLight : defaultDark;
    
    // Update color picker values
    if (bgColorPicker) bgColorPicker.value = defaults.background;
    if (textColorPicker) textColorPicker.value = defaults.text;
    if (borderColorPicker) borderColorPicker.value = defaults.border;
    
    // Update CSS variables directly
    document.documentElement.style.setProperty('--background-color', defaults.background);
    document.documentElement.style.setProperty('--primary-color', defaults.text);
    document.documentElement.style.setProperty('--border-color', defaults.border);
    
    // Reset effect select
    if (effectSelect) effectSelect.value = 'none';
}

// Theme toggle functionality
function toggleTheme() {
    const isLight = document.body.dataset.theme === 'light';
    
    // Update theme
    document.body.dataset.theme = isLight ? '' : 'light';
    themeToggle.textContent = isLight ? 'Light' : 'Dark';
    
    // Reset to default theme colors
    resetToDefaultThemeColors();
    
    // Reset all effects
    removeAllEffects();
    
    // If there's a default avatar, regenerate it with the new theme colors
    const navLogoImg = document.getElementById('nav-logo-img');
    if (navLogoImg && navLogoImg.dataset.isDefaultAvatar === 'true') {
        // Use the stored original letter if available
        const originalLetter = navLogoImg.dataset.originalLetter || '?';
        const defaultAvatar = createDefaultAvatar(originalLetter);
        setAvatar(defaultAvatar, originalLetter);
    }
}

// Style-related functions
function applyCustomStyles(e) {
    const bgColorPicker = document.getElementById('bg-color');
    const textColorPicker = document.getElementById('text-color');
    const borderColorPicker = document.getElementById('border-color');

    if (!bgColorPicker || !textColorPicker || !borderColorPicker) return;

    // Update only the specific CSS variable that changed
    const target = e?.target || event?.target;
    if (target) {
        switch(target.id) {
            case 'bg-color':
                document.documentElement.style.setProperty('--background-color', bgColorPicker.value);
                break;
            case 'text-color':
                document.documentElement.style.setProperty('--primary-color', textColorPicker.value);
                break;
            case 'border-color':
                document.documentElement.style.setProperty('--border-color', borderColorPicker.value);
                break;
        }
    }
    
    // If there's an ENS name with no avatar, regenerate the default avatar with new colors
    const navLogoImg = document.getElementById('nav-logo-img');
    if (navLogoImg && navLogoImg.dataset.isDefaultAvatar === 'true') {
        const firstLetter = navLogoImg.dataset.letter || '?';
        const defaultAvatar = createDefaultAvatar(firstLetter);
        setAvatar(defaultAvatar);
        navLogoImg.dataset.isDefaultAvatar = 'true';
        navLogoImg.dataset.letter = firstLetter;
    }
}

function handleEffectChange() {
    removeAllEffects();
    
    switch(effectSelect.value) {
        case 'glow':
            applyGlowEffect();
            break;
        case 'snow':
            addSnowEffect();
            break;
        case 'stars':
            applyStarsEffect();
            break;
        case 'rainbow':
            applyRainbowEffect();
            break;
        case 'matrix':
            applyMatrixEffect();
            break;
        case 'fireflies':
            applyFirefliesEffect();
            break;
        case 'confetti':
            applyConfettiEffect();
            break;
        case 'neon':
            applyNeonEffect();
            break;
        case 'vaporware':
            applyVaporwareEffect();
            break;
    }
}

function removeAllEffects() {
    removeSnowEffect();
    removeGlowEffect();
    removeStarsEffect();
    removeRainbowEffect();
    removeMatrixEffect();
    removeFirefliesEffect();
    removeConfettiEffect();
    removeNeonEffect();
    removeVaporwareEffect();
}

function applyGlowEffect() {
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button'
    );
    elements.forEach(el => {
        // Static glow at the low end of the animation
        el.style.boxShadow = `0 0 5px ${borderColorPicker.value}, 0 0 10px ${borderColorPicker.value}`;
        // Remove animation
        el.style.animation = 'none';
    });
}

function removeGlowEffect() {
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select'
    );
    elements.forEach(el => {
        el.style.boxShadow = 'none';
        el.style.animation = 'none';
    });
}

function addSnowEffect() {
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    snowContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
    `;

    for (let i = 0; i < 50; i++) {
        const snow = document.createElement('div');
        const size = Math.random() * 8 + 2;  // Same size for width and height
        snow.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: var(--primary-color);
            border-radius: 50%;
            pointer-events: none;
            animation: snowFall ${Math.random() * 5 + 10}s linear infinite;
            left: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.6 + 0.4};
            animation-delay: -${Math.random() * 5}s;
        `;
        snowContainer.appendChild(snow);
    }

    document.body.appendChild(snowContainer);
}

function removeSnowEffect() {
    const snowContainer = document.getElementById('snow-container');
    if (snowContainer) {
        snowContainer.remove();
    }
}

function applyStarsEffect() {
    const starsContainer = document.createElement('div');
    starsContainer.id = 'stars-container';
    starsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 50;
        overflow: hidden;
    `;
    
    const starColors = ['#ffffff', '#ffff00', '#00ffff', '#ff00ff'];
    
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2 + 1;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const animDuration = Math.random() * 3 + 2;
        const animDelay = Math.random() * 2;
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        
        star.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            left: ${left}%;
            top: ${top}%;
            opacity: ${Math.random() * 0.8 + 0.2};
            pointer-events: none;
            animation: starTwinkle ${animDuration}s ease-in-out infinite;
            animation-delay: -${animDelay}s;
        `;
        
        starsContainer.appendChild(star);
    }
    
    document.body.appendChild(starsContainer);
}

function removeStarsEffect() {
    const starsContainer = document.getElementById('stars-container');
    if (starsContainer) {
        starsContainer.remove();
    }
}

function applyRainbowEffect() {
    // First, remove any existing rainbow effect
    removeRainbowEffect();
    
    // Get all elements that should have the rainbow effect
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button, ' +
        '.profile-record hr'
    );
    
    // First clear any existing animations
    elements.forEach(el => {
        el.style.animation = 'none';
    });
    
    // Force a reflow to ensure all animations are cleared
    void document.body.offsetHeight;
    
    // Create the style element with the animation
    const styleSheet = document.createElement('style');
    styleSheet.id = 'rainbow-effect-style';
    styleSheet.textContent = `
        @keyframes rainbowBorder {
            0% { border-color: #ff0000; }
            16.666% { border-color: #ff8000; }
            33.333% { border-color: #ffff00; }
            50% { border-color: #00ff00; }
            66.666% { border-color: #0000ff; }
            83.333% { border-color: #8000ff; }
            100% { border-color: #ff0000; }
        }
    `;
    document.head.appendChild(styleSheet);
    
    // Apply the rainbow effect to all elements with a small delay
    setTimeout(() => {
        elements.forEach(el => {
            el.style.animation = 'rainbowBorder 3s linear infinite';
        });
        
        // Force another reflow to ensure all animations start at the same time
        void document.body.offsetHeight;
    }, 50);
}

function removeRainbowEffect() {
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button'
    );
    elements.forEach(el => {
        el.style.animation = '';
        el.style.borderColor = ''; // Reset border color
    });
    
    // Remove any existing rainbow style
    const existingStyle = document.getElementById('rainbow-effect-style');
    if (existingStyle) {
        existingStyle.remove();
    }
}

function applyMatrixEffect() {
    const matrixContainer = document.createElement('div');
    matrixContainer.id = 'matrix-container';
    matrixContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 40;
        overflow: hidden;
        opacity: 0.15;
    `;
    
    const characters = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const columns = Math.floor(window.innerWidth / 30);
    
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        const duration = Math.random() * 4 + 7.92;
        column.style.cssText = `
            position: absolute;
            top: -100px;
            left: ${i * 30}px;
            color: #00ff00;
            font-family: monospace;
            font-size: 18px;
            line-height: 18px;
            animation: matrixFall ${duration}s linear infinite;
            animation-delay: -${Math.random() * 8}s;
            text-shadow: 0 0 8px #00ff00, 0 0 15px #00ff00, 0 0 20px #00ff00;
        `;
        
        let text = '';
        const length = 35;
        for (let j = 0; j < length; j++) {
            const char = characters[Math.floor(Math.random() * characters.length)];
            if (j < 2 && Math.random() > 0.5) {
                text += `<span style="color: #ffffff; text-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff, 0 0 30px #ffffff;">${char}</span><br>`;
            } else {
                text += `${char}<br>`;
            }
        }
        column.innerHTML = text;
        matrixContainer.appendChild(column);
    }
    
    const matrixStyle = document.createElement('style');
    matrixStyle.textContent = `
        @keyframes matrixFall {
            0% {
                transform: translateY(-100%);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(matrixStyle);
    
    document.body.appendChild(matrixContainer);
}

function removeMatrixEffect() {
    const matrixContainer = document.getElementById('matrix-container');
    if (matrixContainer) {
        matrixContainer.remove();
    }
}

function applyFirefliesEffect() {
    const firefliesContainer = document.createElement('div');
    firefliesContainer.id = 'fireflies-container';
    firefliesContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 40;
        overflow: hidden;
    `;
    
    for (let i = 0; i < 30; i++) {
        const firefly = document.createElement('div');
        const size = Math.random() * 4 + 2;
        firefly.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: #ffff00;
            border-radius: 50%;
            box-shadow: 0 0 ${size * 2}px #ffff00;
            animation: fireflyFloat ${Math.random() * 4 + 3}s ease-in-out infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.6 + 0.4};
        `;
        firefliesContainer.appendChild(firefly);
    }
    
    const fireflyStyle = document.createElement('style');
    fireflyStyle.textContent = `
        @keyframes fireflyFloat {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
            50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
            75% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
        }
    `;
    document.head.appendChild(fireflyStyle);
    document.body.appendChild(firefliesContainer);
}

function removeFirefliesEffect() {
    const container = document.getElementById('fireflies-container');
    if (container) {
        container.remove();
    }
}

function applyConfettiEffect() {
    const confettiContainer = document.createElement('div');
    confettiContainer.id = 'confetti-container';
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 40;
        overflow: hidden;
    `;
    
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 10 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${Math.random() * 100}%;
            top: -${size}px;
            animation: confettiFall ${Math.random() * 3 + 2}s linear infinite;
            animation-delay: -${Math.random() * 5}s;
            transform: rotate(${Math.random() * 360}deg);
        `;
        confettiContainer.appendChild(confetti);
    }
    
    const confettiStyle = document.createElement('style');
    confettiStyle.textContent = `
        @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
        }
    `;
    document.head.appendChild(confettiStyle);
    document.body.appendChild(confettiContainer);
}

function removeConfettiEffect() {
    const container = document.getElementById('confetti-container');
    if (container) {
        container.remove();
    }
}

function applyNeonEffect() {
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button'
    );
    elements.forEach(el => {
        el.style.textShadow = `0 0 5px ${borderColorPicker.value}, 0 0 10px ${borderColorPicker.value}`;
        el.style.boxShadow = `0 0 5px ${borderColorPicker.value}, 0 0 10px ${borderColorPicker.value}`;
        el.style.animation = 'none'; // Remove animation to make it static like glow effect
    });
    
    // Remove any existing neon style
    const existingStyle = document.getElementById('neon-effect-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Add static neon effect (no breathing animation)
    const neonStyle = document.createElement('style');
    neonStyle.id = 'neon-effect-style';
    neonStyle.textContent = `
        .nav-logo, .search-input, .search-button, #theme-toggle, 
        .profile-records, .profile-record, .profile-header-image, .footer, 
        .color-button, .effect-select, .follow-button, .control-button, 
        .download-website-button, .deploy-website-button, .connect-website-button {
            text-shadow: 0 0 5px ${borderColorPicker.value}, 0 0 10px ${borderColorPicker.value};
            box-shadow: 0 0 5px ${borderColorPicker.value}, 0 0 10px ${borderColorPicker.value};
        }
    `;
    document.head.appendChild(neonStyle);
}

function removeNeonEffect() {
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button'
    );
    elements.forEach(el => {
        el.style.textShadow = '';
        el.style.boxShadow = '';
        el.style.animation = '';
    });
    
    // Remove any existing neon style
    const existingStyle = document.getElementById('neon-effect-style');
    if (existingStyle) {
        existingStyle.remove();
    }
}

function removeGlowEffect() {
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button'
    );
    elements.forEach(el => {
        el.style.boxShadow = '';
        el.style.animation = '';
    });
}

function applyVaporwareEffect() {
    document.body.style.background = 'linear-gradient(45deg, #ff00ff, #00ffff)';
    document.body.style.backgroundSize = '100% 100%';
    
    const navBar = document.querySelector('.nav-bar');
    if (navBar) {
        navBar.style.backgroundColor = 'transparent';
        navBar.style.borderColor = '#ffffff';
    }
}

function removeVaporwareEffect() {
    document.body.style.background = '';
    document.body.style.backgroundSize = '';
    
    const navBar = document.querySelector('.nav-bar');
    if (navBar) {
        navBar.style.backgroundColor = '';
        navBar.style.borderColor = '';
    }
}

// Add the download functionality
async function generateDownload() {
    try {
        // Get current profile data
        const profileNameElement = document.querySelector('.profile-record .record-value');
        if (!profileNameElement) {
            throw new Error('No profile data found to download');
        }

        const ensName = profileNameElement.textContent;
        const avatarUrl = document.getElementById('nav-logo-img').src;
        
        // Get current styling
        const currentStyles = {
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim(),
            textColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
            currentEffect: effectSelect ? effectSelect.value : 'none'
        };

        // Fetch the download-template.html file
        const response = await fetch('download-template.html');
        if (!response.ok) {
            // If we can't fetch the template, use a fallback approach
            throw new Error('Could not load template file - using fallback');
        }
        
        // Get the template content
        let templateHtml = await response.text();
        
        // Replace placeholders in the template
        templateHtml = templateHtml.replace(/ENS_NAME_TITLE_PLACEHOLDER/g, ensName);
        templateHtml = templateHtml.replace(/FAVICON_SRC_PLACEHOLDER/g, avatarUrl);
        templateHtml = templateHtml.replace(/AVATAR_SRC_PLACEHOLDER/g, avatarUrl);
        
        // Add CSS variables for colors
        const cssVariables = `
            --primary-color: ${currentStyles.textColor};
            --background-color: ${currentStyles.backgroundColor};
            --border-color: ${currentStyles.borderColor};
        `;
        templateHtml = templateHtml.replace(/\/\* Default variables that will be replaced by THEME_CSS_VARIABLES_PLACEHOLDER \*\/[^\}]+\}/s, 
            `/* Default variables that will be replaced by THEME_CSS_VARIABLES_PLACEHOLDER */
            ${cssVariables}
        }`);
        
        // Add effect styles if selected
        if (currentStyles.currentEffect !== 'none') {
            const effectStyles = generateEffectStyles(currentStyles.currentEffect);
            templateHtml = templateHtml.replace(/\/\* EFFECT_STYLES_PLACEHOLDER \*\//g, effectStyles);
            
            // Add effect initialization code
            const effectInitCode = generateEffectInitCode(currentStyles.currentEffect);
            if (effectInitCode) {
                // Find the script section at the end of the file
                const scriptIndex = templateHtml.lastIndexOf('<script>');
                if (scriptIndex !== -1) {
                    const scriptEndIndex = templateHtml.indexOf('</script>', scriptIndex);
                    if (scriptEndIndex !== -1) {
                        // Insert the effect initialization code before the script end tag
                        templateHtml = templateHtml.substring(0, scriptEndIndex) + 
                            '\n' + effectInitCode + '\n' + 
                            templateHtml.substring(scriptEndIndex);
                    }
                }
            }
        }
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(templateHtml));
        
        // Format the filename as <ens or basename>.eth.html
        let filename = ensName.toLowerCase();
        // If it doesn't already end with .eth, add it
        if (!filename.endsWith('.eth')) {
            filename = `${filename}.eth`;
        }
        // Add .html extension
        filename = `${filename}.html`;
        downloadLink.setAttribute('download', filename);
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
    } catch (error) {
        console.error('Error generating download:', error);
        
        // If we couldn't fetch the template, try an alternative approach
        if (error.message.includes('using fallback')) {
            try {
                await downloadUsingXHR();
                return;
            } catch (xhrError) {
                console.error('XHR fallback failed:', xhrError);
            }
        }
        
        const errorToast = document.createElement('div');
        errorToast.textContent = 'Error downloading website: ' + error.message;
        errorToast.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 2000;
        `;
        document.body.appendChild(errorToast);
        setTimeout(() => {
            errorToast.style.opacity = '0';
            errorToast.style.transition = 'opacity 0.5s ease';
            setTimeout(() => document.body.removeChild(errorToast), 500);
        }, 3000);
    }
}

// Alternative download method using XMLHttpRequest
async function downloadUsingXHR() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'download-template.html', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        // Get current profile data
                        const profileNameElement = document.querySelector('.profile-record .record-value');
                        if (!profileNameElement) {
                            reject(new Error('No profile data found to download'));
                            return;
                        }
                        
                        const ensName = profileNameElement.textContent;
                        const avatarUrl = document.getElementById('nav-logo-img').src;
                        
                        // Get current styling
                        const currentStyles = {
                            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim(),
                            textColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
                            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
                            currentEffect: effectSelect ? effectSelect.value : 'none'
                        };
                        
                        let templateHtml = xhr.responseText;
                        
                        // Replace placeholders
                        templateHtml = templateHtml.replace(/<!--ENS_NAME_TITLE_PLACEHOLDER-->/g, ensName);
                        templateHtml = templateHtml.replace(/<!--FAVICON_SRC_PLACEHOLDER-->/g, avatarUrl);
                        templateHtml = templateHtml.replace(/<!--AVATAR_SRC_PLACEHOLDER-->/g, avatarUrl);
                        
                        // Add CSS variables for colors
                        const cssVariables = `
                            --primary-color: ${currentStyles.textColor};
                            --background-color: ${currentStyles.backgroundColor};
                            --border-color: ${currentStyles.borderColor};
                        `;
                        templateHtml = templateHtml.replace(/\/\* Default variables that will be replaced by THEME_CSS_VARIABLES_PLACEHOLDER \*\/[^\}]+\}/s, 
                            `/* Default variables that will be replaced by THEME_CSS_VARIABLES_PLACEHOLDER */
                            ${cssVariables}
                        }`);
                        
                        // Add effect styles if selected
                        if (currentStyles.currentEffect !== 'none') {
                            const effectStyles = generateEffectStyles(currentStyles.currentEffect);
                            templateHtml = templateHtml.replace(/\/\* EFFECT_STYLES_PLACEHOLDER \*\//g, effectStyles);
                            
                            // Add effect initialization code
                            const effectInitCode = generateEffectInitCode(currentStyles.currentEffect);
                            if (effectInitCode) {
                                // Find the script section at the end of the file
                                const scriptIndex = templateHtml.lastIndexOf('<script>');
                                if (scriptIndex !== -1) {
                                    const scriptEndIndex = templateHtml.indexOf('</script>', scriptIndex);
                                    if (scriptEndIndex !== -1) {
                                        // Insert the effect initialization code before the script end tag
                                        templateHtml = templateHtml.substring(0, scriptEndIndex) + 
                                            '\n' + effectInitCode + '\n' + 
                                            templateHtml.substring(scriptEndIndex);
                                    }
                                }
                            }
                        }
                        
                        // Create download link
                        const downloadLink = document.createElement('a');
                        downloadLink.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(templateHtml));
                        
                        // Format the filename as <ens or basename>.eth.html
                        let filename = ensName.toLowerCase();
                        // If it doesn't already end with .eth, add it
                        if (!filename.endsWith('.eth')) {
                            filename = `${filename}.eth`;
                        }
                        // Add .html extension
                        filename = `${filename}.html`;
                        downloadLink.setAttribute('download', filename);
                        
                        // Trigger download
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`Failed to load template: ${xhr.status}`));
                }
            }
        };
        xhr.send();
    });
}

// Helper function to generate effect styles
function generateEffectStyles(effectName) {
    switch(effectName) {
        case 'neon':
            return `
                .nav-logo, .profile-records, .profile-record, .profile-header-image, .footer, .follow-button, .search-button, .search-input, .color-button, .effect-select, .control-button, .download-website-button, .deploy-website-button, .connect-website-button {
                    box-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color);
                    text-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color);
                }
            `;
        case 'matrix':
            return `
                @keyframes matrixFall {
                    0% {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }

                .matrix-effect {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    z-index: 40;
                    overflow: hidden;
                    opacity: 0.15;
                }

                .matrix-column {
                    position: absolute;
                    top: -100px;
                    color: #00ff00;
                    font-family: monospace;
                    font-size: 18px;
                    line-height: 18px;
                    white-space: nowrap;
                    text-shadow: 0 0 8px #00ff00, 0 0 15px #00ff00, 0 0 20px #00ff00;
                    animation: matrixFall linear infinite;
                }
            `;
        case 'glow':
            return `
                .nav-logo, .profile-records, .profile-record, .profile-header-image, .footer, .follow-button, .search-button, .search-input, .color-button, .effect-select, .control-button, .download-website-button, .deploy-website-button, .connect-website-button {
                    box-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color);
                }
            `;
        case 'snow':
            return `
                @keyframes snowFall {
                    0% { transform: translateY(-100px) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(360deg); }
                }
                .snow-container {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    pointer-events: none;
                    z-index: 50;
                    overflow: hidden;
                }
                .snowflake {
                    position: absolute;
                    background: var(--primary-color);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: snowFall linear infinite;
                }
            `;
        case 'stars':
            return `
                @keyframes starTwinkle {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
                .stars-container {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    pointer-events: none;
                    z-index: 50;
                    overflow: hidden;
                }
                .star {
                    position: absolute;
                    background: #ffffff;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: starTwinkle ease-in-out infinite;
                }
            `;
        case 'rainbow':
            // For the main site only - not included in the downloaded template
            // The downloaded template will use its own JavaScript-applied animation
            return `
                @keyframes rainbowBorder {
                    0% { border-color: #ff0000; }
                    16.666% { border-color: #ff8000; }
                    33.333% { border-color: #ffff00; }
                    50% { border-color: #00ff00; }
                    66.666% { border-color: #0000ff; }
                    83.333% { border-color: #8000ff; }
                    100% { border-color: #ff0000; }
                }
                
                /* Main site animation - not included in downloaded template */
                .rainbow-effect-main-site {
                    animation: rainbowBorder 3s linear infinite;
                }
            `;
        case 'fireflies':
            return `
                @keyframes fireflyFloat {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(var(--x1), var(--y1)); }
                    50% { transform: translate(var(--x2), var(--y2)); }
                    75% { transform: translate(var(--x3), var(--y3)); }
                }
                .fireflies-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    z-index: 40;
                    overflow: hidden;
                }
                .firefly {
                    position: absolute;
                    background: #ffff00;
                    border-radius: 50%;
                    box-shadow: 0 0 var(--size) #ffff00;
                    pointer-events: none;
                    animation: fireflyFloat ease-in-out infinite;
                }
            `;
        case 'confetti':
            return `
                @keyframes confettiFall {
                    0% { transform: translateY(-100vh) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(360deg); }
                }
                .confetti-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    z-index: 40;
                    overflow: hidden;
                }
                .confetti {
                    position: absolute;
                    pointer-events: none;
                    animation: confettiFall linear infinite;
                }
            `;
        case 'neon':
            return `
                @keyframes neonPulse {
                    0%, 100% { opacity: 1; text-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color); }
                    50% { opacity: 0.8; text-shadow: 0 0 10px var(--border-color), 0 0 20px var(--border-color); }
                }
                .nav-logo, .profile-records, .profile-record, .profile-header-image, .footer {
                    text-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color);
                    box-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color);
                    animation: neonPulse 1.5s ease-in-out infinite;
                }
            `;
        case 'vaporware':
            return `
                body {
                    background: linear-gradient(45deg, #ff00ff, #00ffff);
                    background-size: 100% 100%;
                }
                .nav-bar {
                    background: transparent;
                    border-color: #ffffff;
                }
            `;
        default:
            return '';
    }
}

// Helper function to generate JavaScript code for effects
function generateEffectInitCode(effectName) {
    let code = '';
    
    switch(effectName) {
        case 'glow':
            // Glow effect is CSS-only, no JS needed
            break;
            
        case 'snow':
            code = `
            function initializeSnowEffect() {
                // Remove any existing snow container to avoid duplicates
                const existingContainer = document.querySelector('.snow-container');
                if (existingContainer) {
                    existingContainer.remove();
                }
                
                const container = document.createElement('div');
                container.className = 'snow-container';
                document.body.appendChild(container);
                
                // Ensure container stays fixed even during scroll
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.pointerEvents = 'none';
                container.style.zIndex = '50';

                for (let i = 0; i < 50; i++) {
                    const snowflake = document.createElement('div');
                    snowflake.className = 'snowflake';
                    const size = Math.random() * 5 + 3;
                    snowflake.style.width = size + 'px';
                    snowflake.style.height = size + 'px';
                    snowflake.style.left = Math.random() * 100 + '%';
                    snowflake.style.opacity = Math.random() * 0.6 + 0.4;
                    snowflake.style.animationDuration = (Math.random() * 5 + 10) + 's';
                    snowflake.style.animationDelay = -Math.random() * 5 + 's';
                    container.appendChild(snowflake);
                }
            }
            initializeSnowEffect();
            `;
            break;
            
        case 'stars':
            code = `
            function initializeStarsEffect() {
                // Remove any existing stars container to avoid duplicates
                const existingContainer = document.querySelector('.stars-container');
                if (existingContainer) {
                    existingContainer.remove();
                }
                
                const container = document.createElement('div');
                container.className = 'stars-container';
                document.body.appendChild(container);
                
                // Ensure container stays fixed even during scroll
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.pointerEvents = 'none';
                container.style.zIndex = '50';

                const starColors = ['#ffffff', '#ffff00', '#00ffff', '#ff00ff'];
                for (let i = 0; i < 100; i++) {
                    const star = document.createElement('div');
                    star.className = 'star';
                    const size = Math.random() * 2 + 1;
                    star.style.width = size + 'px';
                    star.style.height = size + 'px';
                    star.style.left = Math.random() * 100 + '%';
                    star.style.top = Math.random() * 100 + '%';
                    star.style.background = starColors[Math.floor(Math.random() * starColors.length)];
                    star.style.animation = 'starTwinkle ' + (Math.random() * 3 + 2) + 's ease-in-out infinite';
                    star.style.animationDelay = -Math.random() * 2 + 's';
                    container.appendChild(star);
                }
            }
            initializeStarsEffect();
            `;
            break;
            
        case 'rainbow':
            // Rainbow effect is CSS-only, no JS needed
            break;
            
        case 'matrix':
            code = `
            function initializeMatrixEffect() {
                // Create matrix container
                const container = document.createElement('div');
                container.className = 'matrix-effect';
                document.body.appendChild(container);
                
                // Matrix characters - Japanese katakana and special characters
                const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯﾞﾟ｢｣･ｰ";
                // Add some traditional matrix characters as fallback
                if (!chars.length) {
                    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
                }
                
                // Create matrix columns
                for (let i = 0; i < 30; i++) {
                    const column = document.createElement('div');
                    column.className = 'matrix-column';
                    
                    // Set column properties
                    column.style.left = Math.random() * 100 + '%';
                    column.style.animationDuration = (Math.random() * 10 + 10) + 's';
                    column.style.animationDelay = -Math.random() * 5 + 's';
                    
                    // Add random characters to the column
                    const columnLength = Math.floor(Math.random() * 20) + 10;
                    for (let j = 0; j < columnLength; j++) {
                        const char = document.createElement('div');
                        char.textContent = chars[Math.floor(Math.random() * chars.length)];
                        char.style.opacity = (1 - j / columnLength).toFixed(2);
                        column.appendChild(char);
                    }
                    
                    container.appendChild(column);
                }
            }
            
            // Initialize matrix effect
            document.addEventListener('DOMContentLoaded', initializeMatrixEffect);
            // Also initialize immediately for browsers that might execute script before DOM is fully loaded
            initializeMatrixEffect();
            `;
            break;
            
        case 'fireflies':
            code = `
            // Create fireflies container
            const firefliesContainer = document.createElement('div');
            firefliesContainer.className = 'fireflies-container';
            firefliesContainer.style.cssText = "
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            ";
            
            // Create fireflies
            for (let i = 0; i < 30; i++) {
                const firefly = document.createElement('div');
                firefly.className = 'firefly';
                const size = Math.random() * 4 + 2;
                const duration = Math.random() * 10 + 5;
                
                // Random movement coordinates
                const x1 = (Math.random() * 200 - 100) + 'px';
                const y1 = (Math.random() * 200 - 100) + 'px';
                const x2 = (Math.random() * 200 - 100) + 'px';
                const y2 = (Math.random() * 200 - 100) + 'px';
                const x3 = (Math.random() * 200 - 100) + 'px';
                const y3 = (Math.random() * 200 - 100) + 'px';
                
                firefly.style.cssText = "
                    width: " + size + "px;
                    height: " + size + "px;
                    left: " + (Math.random() * 100) + "%;
                    top: " + (Math.random() * 100) + "%;
                    --size: " + size + "px;
                    --x1: " + x1 + ";
                    --y1: " + y1 + ";
                    --x2: " + x2 + ";
                    --y2: " + y2 + ";
                    --x3: " + x3 + ";
                    --y3: " + y3 + ";
                    animation-duration: " + duration + "s;
                    animation-delay: -" + (Math.random() * 5) + "s;
                ";
                
                firefliesContainer.appendChild(firefly);
            }
            
            document.body.appendChild(firefliesContainer);
            `;
            break;
            
        case 'confetti':
            code = `
            // Create confetti container
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            confettiContainer.style.cssText = "
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
                overflow: hidden;
            ";
            
            // Confetti colors
            const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
            
            // Create confetti pieces
            for (let i = 0; i < 100; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                const size = Math.random() * 10 + 5;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const left = Math.random() * 100;
                const duration = Math.random() * 5 + 5;
                const delay = Math.random() * 5;
                
                confetti.style.cssText = "
                    width: " + size + "px;
                    height: " + size + "px;
                    background-color: " + color + ";
                    top: -10vh;
                    left: " + left + "%;
                    animation-duration: " + duration + "s;
                    animation-delay: -" + delay + "s;
                ";
                
                confettiContainer.appendChild(confetti);
            }
            
            document.body.appendChild(confettiContainer);
            `;
            break;
            
        case 'neon':
            // Neon effect is CSS-only, no JS needed
            break;
            
        case 'vaporware':
            // Vaporware effect is CSS-only, no JS needed
            break;
    }
    
    return code;
}

// Profile-related functions
async function fetchProfile(query) {
    try {
        showLoading();
        hideError();
        
        // Remove any existing register button container
        const existingRegisterContainer = document.querySelector('.register-container');
        if (existingRegisterContainer) {
            existingRegisterContainer.remove();
        }
        
        // Format the query
        query = query.trim().toLowerCase();
        if (!query) {
            throw new Error('Please enter a name to search.');
        }
        if (/\s/.test(query)) {
            throw new Error('Name cannot contain spaces.');
        }

        const ensName = (query.endsWith('.eth') || query.endsWith('.base.eth')) ? query : `${query}.eth`;
        
        // Determine the correct API endpoint for web3.bio
        let url = `${API_BASE_URL}/profile/ens/${ensName}`;
        if (ensName.endsWith('.base.eth')) {
            url = `${API_BASE_URL}/profile/basenames/${ensName}`;
        }

        // Also determine the ethfollow.xyz API endpoint
        const ethFollowUrl = `https://api.ethfollow.xyz/api/v1/users/${ensName}/stats`;
        
        try {
            // Fetch profile data from web3.bio
            const profileResponse = await fetch(url);
            
            // Initialize ethfollow data with default values
            let ethFollowData = { followers_count: '0', following_count: '0' };
            
            // Try to fetch ethfollow data (but don't fail if this API is unavailable)
            try {
                const ethFollowResponse = await fetch(ethFollowUrl);
                if (ethFollowResponse.ok) {
                    ethFollowData = await ethFollowResponse.json();
                    console.log('Ethfollow data fetched successfully:', ethFollowData);
                } else {
                    console.warn('Ethfollow API returned non-OK response:', ethFollowResponse.status);
                }
            } catch (ethFollowError) {
                console.warn('Could not fetch ethfollow data:', ethFollowError);
                // Continue with default values if ethfollow API fails
            }
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                
                // Merge the ethfollow data with the profile data
                // Log the ethfollow data for debugging
                console.log('Raw ethfollow data:', JSON.stringify(ethFollowData));
                
                const mergedData = {
                    ...profileData,
                    ethFollow: {
                        followers: ethFollowData.followers_count || '0',
                        following: ethFollowData.following_count || '0'
                    }
                };
                
                // Log the merged data for debugging
                console.log('Merged data ethFollow:', JSON.stringify(mergedData.ethFollow));
                
                displayProfile(mergedData, ensName);
            } else if (profileResponse.status === 404) {
                displayUnregisteredProfile(ensName);
            } else {
                let errorText = `Error: ${profileResponse.statusText}`;
                try {
                    const errorData = await profileResponse.json();
                    errorText = errorData?.message || errorData?.error || `Error ${profileResponse.status}: ${profileResponse.statusText}`;
                    if (errorText.toLowerCase().includes("invalid name")) {
                        errorText = `Invalid name format: ${ensName}`;
                    } else if (profileResponse.status >= 500) {
                        errorText = "Server error. Please try again later.";
                    }
                } catch (e) {}
                throw new Error(errorText);
            }
        } catch (error) {
            if (error.message.includes('Profile not found')) {
                displayUnregisteredProfile(ensName);
            } else {
                throw error;
            }
        }
    } catch (error) {
        showError(error.message);
        document.getElementById('profile-page').style.display = 'none';
    } finally {
        hideLoading();
    }
}

function displayProfile(data, ensName) {
    const profilePage = document.getElementById('profile-page');
    const container = document.querySelector('.container');
    const profileRecords = document.querySelector('.profile-records');
    const headerImage = document.querySelector('.profile-header-image');
    const controlButtons = document.querySelectorAll('.control-button');
    
    // Store the current effect before clearing anything
    const currentEffect = effectSelect ? effectSelect.value : 'none';
    
    // Hide homepage content and show profile page
    if (container) container.style.display = 'none';
    if (profilePage) profilePage.style.display = 'flex';
    
    // Show control panel buttons for registered profiles
    controlButtons.forEach(button => {
        button.style.display = 'flex';
    });
    
    // Add Follow button to nav bar for registered profiles
    updateNavBar(ensName, true);
    
    // Clear existing records
    if (profileRecords) profileRecords.innerHTML = '';
    
    // Update avatar
    if (data.avatar) {
        setAvatar(data.avatar);
    } else {
        const firstLetter = ensName.charAt(0);
        const defaultAvatar = createDefaultAvatar(firstLetter);
        setAvatar(defaultAvatar);
        
        // Store the letter for later regeneration if colors change
        const navLogo = document.getElementById('nav-logo-img');
        if (navLogo) {
            navLogo.dataset.letter = firstLetter;
        }
    }
    
    // Update header image if exists
    if (headerImage) {
        if (data.header) {
            headerImage.style.display = 'block';
            headerImage.innerHTML = `<img src="${data.header}" alt="${ensName} header">`;
        } else {
            headerImage.style.display = 'none';
            headerImage.innerHTML = '';
        }
    }

    // Add records in specific order
    // 1. Identity (ENS/Basename)
    const isBase = ensName.endsWith('.base.eth');
    addProfileRecord(isBase ? 'Basename' : 'ENS', ensName);

    // 2. Display Name (if different from ENS)
    if (data.displayName && data.displayName !== ensName) {
        addProfileRecord('Name', data.displayName);
    }

    // 3. Followers/Following from ethfollow.xyz API
    console.log('Display profile data:', JSON.stringify(data.ethFollow));
    
    if (data.ethFollow && (data.ethFollow.followers !== '0' || data.ethFollow.following !== '0')) {
        // Use ethfollow.xyz data if available and not zero
        console.log('Using ethfollow data:', data.ethFollow.followers, data.ethFollow.following);
        addProfileRecord('Followers', data.ethFollow.followers);
        addProfileRecord('Following', data.ethFollow.following);
    } else if (data.social) {
        // Fallback to original social data if ethfollow data is not available
        const followers = data.social.follower !== undefined ? data.social.follower : 0;
        const following = data.social.following !== undefined ? data.social.following : 0;
        console.log('Using social data:', followers, following);
        addProfileRecord('Followers', followers);
        addProfileRecord('Following', following);
    } else {
        console.log('No follower data available, using zeros');
        addProfileRecord('Followers', 0);
        addProfileRecord('Following', 0);
    }

    // 4. Location
    if (data.location) {
        addProfileRecord('Location', data.location);
    }

    // 5. Status
    if (data.status) {
        addProfileRecord('Status', data.status);
    }

    // 6. Bio (Description)
    if (data.description) {
        addProfileRecord('Bio', data.description);
    }

    // 7. Email
    if (data.email) {
        addProfileRecord('Email', data.email);
    }

    // 8. Website
    if (data.links?.website?.handle) {
        const url = data.links.website.link || normalizeUrl(data.links.website.handle);
        addProfileRecord('Website', data.links.website.handle, true, url);
    }

    // 9. Social Links (alphabetically sorted)
    const socialLinks = [];
    if (data.links) {
        Object.entries(data.links).forEach(([platform, linkData]) => {
            if (platform !== 'website' && linkData.handle) {
                let label = '';
                let url = '';

                // Determine label and URL based on platform
                switch (platform) {
                    case 'twitter':
                        label = 'Twitter';
                        url = `https://x.com/${linkData.handle}`;
                        break;
                    case 'github':
                        label = 'GitHub';
                        url = `https://github.com/${linkData.handle}`;
                        break;
                    case 'discord':
                        label = 'Discord';
                        url = `https://discord.com/users/${linkData.handle}`;
                        break;
                    case 'telegram':
                        label = 'Telegram';
                        url = `https://t.me/${linkData.handle}`;
                        break;
                    case 'farcaster':
                        label = 'Farcaster';
                        url = normalizeUrl(linkData.handle);
                        break;
                    default:
                        label = platform.charAt(0).toUpperCase() + platform.slice(1);
                        url = linkData.link || normalizeUrl(linkData.handle);
                }

                socialLinks.push({ label, handle: linkData.handle, url });
            }
        });
    }

    // Sort and add social links
    socialLinks.sort((a, b) => a.label.localeCompare(b.label));
    socialLinks.forEach(link => {
        addProfileRecord(link.label, link.handle, true, link.url);
    });

    // 10. Created Date (always last)
    if (data.createdAt) {
        let formattedDate = data.createdAt;
        try {
            const date = new Date(data.createdAt);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (err) {}
        addProfileRecord('Created', formattedDate);
    }

    // Show download, deploy, and connect buttons
    const downloadContainer = document.querySelector('.download-website-container');
    if (downloadContainer) downloadContainer.style.display = 'block';
    
    // Reapply the current effect after a short delay to ensure all elements are rendered
    setTimeout(() => {
        if (currentEffect && currentEffect !== 'none') {
            // First remove any existing effects
            removeAllEffects();
            
            // Then reapply the current effect
            switch(currentEffect) {
                case 'glow':
                    applyGlowEffect();
                    break;
                case 'snow':
                    addSnowEffect();
                    break;
                case 'stars':
                    applyStarsEffect();
                    break;
                case 'rainbow':
                    applyRainbowEffect();
                    break;
                case 'matrix':
                    applyMatrixEffect();
                    break;
                case 'fireflies':
                    applyFirefliesEffect();
                    break;
                case 'confetti':
                    applyConfettiEffect();
                    break;
                case 'neon':
                    applyNeonEffect();
                    break;
                case 'vaporware':
                    applyVaporwareEffect();
                    break;
            }
        }
    }, 100); // Small delay to ensure DOM is updated
}

// Helper function to normalize URLs
function normalizeUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
        return 'https://' + url;
    }
    return url;
}

// Function to update the navigation bar based on the current view
function updateNavBar(name, isRegistered) {
    // Remove any existing follow button
    const existingFollowButton = document.getElementById('follow-button');
    if (existingFollowButton) {
        existingFollowButton.remove();
    }
    
    // Get the navbar and theme toggle button
    const navBar = document.querySelector('.nav-bar');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Create nav-buttons container if it doesn't exist
    let navButtons = document.querySelector('.nav-buttons');
    if (!navButtons) {
        navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';
        navBar.appendChild(navButtons);
    }
    
    // If there's no theme toggle in the nav-buttons, move it there
    if (themeToggle && themeToggle.parentElement !== navButtons) {
        navButtons.appendChild(themeToggle);
    }
    
    // Add the Follow button for homepage or registered profiles
    if (name === 'home' || isRegistered) {
        const followButton = document.createElement('a');
        followButton.id = 'follow-button';
        followButton.className = 'follow-button';
        followButton.textContent = 'Follow';
        followButton.target = '_blank';
        followButton.rel = 'noopener noreferrer';
        
        // Set the appropriate URL based on whether it's homepage or a profile
        if (name === 'home') {
            followButton.href = 'https://efp.app/geocities.eth';
        } else {
            followButton.href = `https://efp.app/${name}`;
        }
        
        // Insert the follow button before the theme toggle
        navButtons.insertBefore(followButton, themeToggle);
    }
}

function displayUnregisteredProfile(ensName) {
    const profilePage = document.getElementById('profile-page');
    const container = document.querySelector('.container');
    const profileRecords = document.querySelector('.profile-records');
    const headerImage = document.querySelector('.profile-header-image');
    const controlButtons = document.querySelectorAll('.control-button');
    
    // Hide homepage content and show profile page
    if (container) container.style.display = 'none';
    if (profilePage) profilePage.style.display = 'flex';
    
    // Clear existing records
    if (profileRecords) profileRecords.innerHTML = '';
    
    // Reset to default theme colors based on current theme
    resetToDefaultThemeColors();
    
    // Remove any active effects
    removeAllEffects();
    
    // Update nav bar - remove follow button for unregistered profiles
    updateNavBar(ensName, false);
    
    // Create default avatar from first letter
    const firstLetter = ensName.charAt(0);
    const defaultAvatar = createDefaultAvatar(firstLetter);
    setAvatar(defaultAvatar, firstLetter);
    
    // Hide header image
    if (headerImage) {
        headerImage.style.display = 'none';
        headerImage.innerHTML = '';
    }
    
    // Hide control panel buttons for unregistered profiles
    controlButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    // Determine if this is a Basename or ENS name
    const isBasename = ensName.endsWith('.base.eth');
    
    // Add appropriate name record based on type
    if (isBasename) {
        addProfileRecord('Basename', ensName);
    } else {
        addProfileRecord('ENS', ensName);
    }
    
    // Add unregistered message
    addProfileRecord('Status', 'Unregistered');
    
    // Create register button container if it doesn't exist
    let registerContainer = document.querySelector('.register-container');
    if (!registerContainer) {
        registerContainer = document.createElement('div');
        registerContainer.className = 'register-container';
        profilePage.appendChild(registerContainer);
    }
    
    // Add register button with appropriate link and text
    const registerButton = document.createElement('a');
    registerButton.className = 'register-button';
    
    if (isBasename) {
        // For Basenames, use the Base names URL format
        const basenameWithoutSuffix = ensName.replace('.base.eth', '');
        registerButton.href = `https://www.base.org/names?claim=${basenameWithoutSuffix}`;
        registerButton.textContent = 'Register Basename';
    } else {
        // For ENS names, use the ENS domains URL format
        registerButton.href = `https://app.ens.domains/${ensName}`;
        registerButton.textContent = 'Register ENS';
    }
    
    registerButton.target = '_blank';
    registerButton.rel = 'noopener noreferrer';
    registerContainer.innerHTML = '';
    registerContainer.appendChild(registerButton);
    
    // Hide download, deploy, and connect buttons
    const downloadContainer = document.querySelector('.download-website-container');
    if (downloadContainer) downloadContainer.style.display = 'none';
}

function addProfileRecord(label, value, isLink = false, href = '') {
    const profileRecords = document.querySelector('.profile-records');
    if (!profileRecords) return;
    
    const record = document.createElement('div');
    record.className = 'profile-record';
    
    const labelElement = document.createElement('div');
    labelElement.className = 'record-label';
    labelElement.textContent = label;
    
    const valueElement = document.createElement('div');
    valueElement.className = 'record-value';
    
    if (isLink) {
        const link = document.createElement('a');
        link.href = href || (value.startsWith('http') ? value : `https://${value}`);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = value;
        valueElement.appendChild(link);
    } else {
        valueElement.textContent = value;
    }
    
    record.appendChild(labelElement);
    record.appendChild(valueElement);
    profileRecords.appendChild(record);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize GeoCities avatar
    initializeGeoCitiesAvatar();
    
    // Initialize the homepage nav bar with Follow button
    updateNavBar('home', true);
    
    // Setup nav logo click handler
    setupNavLogoClickHandler();
    
    // Add search event listeners
    const searchInputs = document.querySelectorAll('.search-input');
    const searchButtons = document.querySelectorAll('.search-button');
    
    searchButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input && input.value.trim()) {
                fetchProfile(input.value.trim());
            }
        });
    });
    
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                fetchProfile(input.value.trim());
            }
        });
    });
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Style customization
    if (bgColorPicker) {
        // Listen for both change and input events for immediate updates
        bgColorPicker.addEventListener('change', (e) => {
            if (e.isTrusted) applyCustomStyles(e);
        });
        bgColorPicker.addEventListener('input', (e) => {
            if (e.isTrusted) applyCustomStyles(e);
        });
    }
    
    // Download button will be set up later with other website buttons
    if (textColorPicker) {
        textColorPicker.addEventListener('change', (e) => {
            if (e.isTrusted) applyCustomStyles(e);
        });
        textColorPicker.addEventListener('input', (e) => {
            if (e.isTrusted) applyCustomStyles(e);
        });
    }
    if (borderColorPicker) {
        borderColorPicker.addEventListener('change', (e) => {
            if (e.isTrusted) applyCustomStyles(e);
        });
        borderColorPicker.addEventListener('input', (e) => {
            if (e.isTrusted) applyCustomStyles(e);
        });
    }
    if (effectSelect) {
        effectSelect.addEventListener('change', handleEffectChange);
    }
    
    // Download, Deploy, and Connect buttons
    const downloadButton = document.querySelector('.download-website-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', (e) => {
            e.preventDefault();
            generateDownload();
        });
    }
    
    // Connect Website button - dynamically set URL based on ENS or Basename
    const connectButton = document.querySelector('.connect-website-button');
    if (connectButton) {
        connectButton.addEventListener('click', function() {
            // Find the first profile record which should be either ENS or Basename
            const profileRecords = document.querySelectorAll('.profile-record');
            if (profileRecords.length > 0) {
                const firstRecord = profileRecords[0];
                const labelElement = firstRecord.querySelector('.record-label');
                const valueElement = firstRecord.querySelector('.record-value');
                
                if (labelElement && valueElement) {
                    const label = labelElement.textContent;
                    const name = valueElement.textContent;
                    
                    if (name) {
                        // Determine if this is a Basename or ENS name
                        window.open(`https://app.ens.domains/${name}`, '_blank', 'noopener,noreferrer');
                    }
                }
            }
        });
    }
    
    // Initialize color pickers
    initializeColorPickers();
});

// Function to initialize color pickers with correct default values
function initializeColorPickers() {
    // Set default colors based on dark theme (initial theme)
    if (bgColorPicker) bgColorPicker.value = '#000000'; // Black for background
    if (textColorPicker) textColorPicker.value = '#ffffff'; // White for text
    if (borderColorPicker) borderColorPicker.value = '#ffffff'; // White for border
    
    // Apply these colors to the CSS variables
    document.documentElement.style.setProperty('--background-color', '#000000');
    document.documentElement.style.setProperty('--primary-color', '#ffffff');
    document.documentElement.style.setProperty('--border-color', '#ffffff');
}

// Navigation
function setupNavLogoClickHandler() {
    const navLogo = document.querySelector('.nav-logo');
    if (!navLogo) return;
    
    // Remove any existing click handlers
    const newNavLogo = navLogo.cloneNode(true);
    navLogo.parentNode.replaceChild(newNavLogo, navLogo);
    
    // Add the click handler
    newNavLogo.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.reload(); // Refresh the page
    });
}

function generateDownloadableHTML(profile, ensName) {
    // Get current theme and neighborhood
    const isLight = document.body.dataset.theme === 'light';
    
    // Get current theme colors
    const backgroundColor = getComputedStyle(document.body).getPropertyValue('--background-color');
    const textColor = getComputedStyle(document.body).getPropertyValue('--primary-color');
    const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
    
    // Get avatar URL
    const avatarUrl = document.getElementById('nav-logo-img').src;
    
    // Get header image if it exists
    const headerHTML = profile.header ? 
        `<div class="profile-header-image"><img src="${profile.header}" alt="${ensName} header"></div>` : 
        '';
    
    // Generate records HTML using the same rules as the main site
    let recordsHTML = '';
    
    // Add ENS record first
    const isBase = ensName.endsWith('.base.eth');
    const displayLabel = isBase ? 'Base Name' : 'ENS';
    recordsHTML += generateRecordHTML(displayLabel, ensName);
    
    // Add display name if different from ENS
    if (profile.displayName && profile.displayName !== ensName) {
        recordsHTML += generateRecordHTML('Name', profile.displayName);
    }
    
    // Add dynamic followers/following with ethfollow.xyz API
    const followersCountId = `${ensName.replace(/[^a-zA-Z0-9]/g, '_')}_followers`;
    const followingCountId = `${ensName.replace(/[^a-zA-Z0-9]/g, '_')}_following`;
    
    // Create HTML with placeholders that will be populated by JavaScript
    recordsHTML += `<div class="profile-record">
        <div class="record-label">Followers</div>
        <div class="record-value" id="${followersCountId}">Loading...</div>
    </div>`;
    
    recordsHTML += `<div class="profile-record">
        <div class="record-label">Following</div>
        <div class="record-value" id="${followingCountId}">Loading...</div>
    </div>`;
    
    // Add other standard fields
    if (profile.location) recordsHTML += generateRecordHTML('Location', profile.location);
    if (profile.status) recordsHTML += generateRecordHTML('Status', profile.status);
    if (profile.description) recordsHTML += generateRecordHTML('Bio', profile.description);
    
    // Add website if exists
    if (profile.links?.website?.handle) {
        const websiteUrl = profile.links.website.link || normalizeUrl(profile.links.website.handle);
        recordsHTML += generateRecordHTML('Website', profile.links.website.handle, true, websiteUrl);
    }
    
    // Add email if exists
    if (profile.email) recordsHTML += generateRecordHTML('Email', profile.email);
    
    // Process all other links
    if (profile.links) {
        Object.entries(profile.links).forEach(([platform, data]) => {
            if (platform !== 'website' && data.handle) {
                const label = data.sources?.[0]?.charAt(0).toUpperCase() + data.sources?.[0]?.slice(1) || 
                            platform.charAt(0).toUpperCase() + platform.slice(1);
                recordsHTML += generateRecordHTML(label, data.handle, true, data.link || normalizeUrl(data.handle));
            }
        });
    }
    
    // Add created date if exists
    if (profile.createdAt) {
        let formattedDate = profile.createdAt;
        try {
            const date = new Date(profile.createdAt);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (err) {}
        recordsHTML += generateRecordHTML('Created', formattedDate);
    }
    
    // Create JavaScript to fetch ethfollow.xyz data
    const ethFollowScript = `
        // Fetch followers and following counts from ethfollow.xyz
        async function fetchEthFollowData() {
            try {
                const response = await fetch('https://api.ethfollow.xyz/api/v1/users/${ensName}/stats');
                if (response.ok) {
                    const data = await response.json();
                    
                    // Update the followers and following counts
                    const followersElement = document.getElementById('${followersCountId}');
                    const followingElement = document.getElementById('${followingCountId}');
                    
                    if (followersElement) {
                        followersElement.textContent = data.followers_count || '0';
                    }
                    
                    if (followingElement) {
                        followingElement.textContent = data.following_count || '0';
                    }
                } else {
                    // If API fails, set default values
                    setDefaultFollowCounts();
                }
            } catch (error) {
                console.error('Error fetching ethfollow data:', error);
                // If API fails, set default values
                setDefaultFollowCounts();
            }
        }
        
        function setDefaultFollowCounts() {
            const followersElement = document.getElementById('${followersCountId}');
            const followingElement = document.getElementById('${followingCountId}');
            
            if (followersElement) {
                followersElement.textContent = '0';
            }
            
            if (followingElement) {
                followingElement.textContent = '0';
            }
        }
        
        // Call the function when the page loads
        document.addEventListener('DOMContentLoaded', fetchEthFollowData);
    `;

    // Create HTML content for the profile
    let htmlContent = `
        <!-- Profile content would go here -->
        <!-- This is a placeholder since download functionality has been removed -->
    `;
    
    return htmlContent;
}

// Helper function to generate record HTML
function generateRecordHTML(label, value, isLink = false, href = '') {
    if (value === undefined || value === null || value === '') return '';
    
    const valueHTML = isLink ? 
        `<a href="${href}" target="_blank" rel="noopener noreferrer">${value}</a>` : 
        value;
    
    return `
        <div class="profile-record">
            <div class="record-label">${label}</div>
            <div class="record-value">${valueHTML}</div>
        </div>
    `;
}

// Helper function to normalize URLs
function normalizeUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
        return 'https://' + url;
    }
    return url;
}

// Helper function to get font family based on neighborhood
function getFontFamily(neighborhood) {
    if (neighborhood === 'area51') return "'Orbitron', sans-serif";
    if (neighborhood === 'athens') return "'Georgia', serif";
    return "sans-serif";
}

// Add PWA support functions
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }
}

// Function to generate icons from avatar
async function generateIcons(avatarUrl) {
    const sizes = [192, 512];
    const icons = [];

    for (const size of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Create a circular mask
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Load and draw the avatar
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = avatarUrl;
        });

        // Draw the image with proper scaling
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        icons.push({
            src: canvas.toDataURL('image/png'),
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'any maskable'
        });
    }

    return icons;
}

// Function to generate dynamic manifest for downloaded profiles
async function generateProfileManifest(ensName, avatarUrl) {
    const icons = await generateIcons(avatarUrl);
    return {
        name: ensName,
        short_name: ensName,
        description: `${ensName} Web3 Profile`,
        start_url: '/',
        display: 'standalone',
        background_color: getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim(),
        theme_color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
        icons: icons
    };
}



// PWA support functions
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

// Function to create PWA icons from the GeoCities avatar
async function createPWAIcons(avatarUrl) {
    try {
        // Fetch the avatar image
        const response = await fetch(avatarUrl);
        const blob = await response.blob();
        
        // Create an image element to load the avatar
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        
        await new Promise(resolve => {
            img.onload = resolve;
        });
        
        // Create canvases for different icon sizes
        const sizes = [192, 512];
        
        for (const size of sizes) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Draw the avatar on the canvas
            ctx.drawImage(img, 0, 0, size, size);
            
            // Convert to blob and save to cache
            canvas.toBlob(async (iconBlob) => {
                // Store in cache for service worker
                const cache = await caches.open('geocities-v1');
                await cache.put(`/icons/icon-${size}x${size}.png`, new Response(iconBlob));
                
                // Also update the manifest icons in cache
                const manifestResponse = await fetch('/manifest.json');
                const manifestData = await manifestResponse.json();
                await cache.put('/manifest.json', new Response(JSON.stringify(manifestData)));
                
                console.log(`Created ${size}x${size} PWA icon from avatar`);
            }, 'image/png');
        }
    } catch (error) {
        console.error('Error creating PWA icons:', error);
    }
}

// Initialize PWA support when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Register service worker for main site
    registerServiceWorker();
    
    // Initialize the GeoCities avatar and create PWA icons
    initializeGeoCitiesAvatar().then(() => {
        // Get the current avatar URL from the favicon
        const avatarUrl = document.getElementById('favicon').href;
        if (avatarUrl) {
            createPWAIcons(avatarUrl);
        }
    });
});
