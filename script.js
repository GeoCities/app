// Constants
const API_BASE_URL = 'https://api.web3.bio';
const DEFAULT_AVATAR = 'https://raw.githubusercontent.com/GeoCities/Ads/main/Ads/Nyan%20Cat%20-%20GeoCities.gif';

// ENS names for the grid
// Fixed priority ENS names that will always appear in specific positions
const FIXED_PRIORITY_ENS_NAMES = [
    'ens.eth',           // Always 1st
    'geocities.eth',     // Always 2nd
    'geocities.base.eth', // Always 3rd
    'efp.eth',           // Always 4th
    'base.eth',          // Always 5th
    'enspunks.eth',      // Always 6th
];

// Priority ENS names that will be randomized on each page load
const RANDOMIZABLE_PRIORITY_ENS_NAMES = [
    'vitalik.eth',
    'likebutton.eth',
    'brianarmstrong.eth',
    'jesse.base.eth',
    'nick.eth',
    'mely.eth',
    'art.mely.eth',
    'drea.eth',
    'lcfr.eth',
    'brantly.eth',
    'caveman.eth'
];

// Combined priority array for backward compatibility
const PRIORITY_ENS_NAMES = [...FIXED_PRIORITY_ENS_NAMES, ...RANDOMIZABLE_PRIORITY_ENS_NAMES];

// Other ENS names that will be shuffled
const OTHER_ENS_NAMES = [
    'shabbat.eth', 'furyan.eth',
    'magnum.eth', 'ethgalaxy.eth', 'sean3.eth', 'hid.eth', 'artiefishal.eth',
    'thenftverse.eth', 'cheeseworld.eth', '2️⃣2️⃣.eth', 'flexter.eth', 'thegoat.eth',
    'going.eth', 'sargent.eth', '👨‍🎤.eth',
    'broke.eth', 'thecap.eth', 'odie.eth', '184.eth', '4444.eth',
    'web3go.eth', 'web3come.eth', 'dwr.eth', 'kevforking.eth', 'pol.eth',
    'kias.eth', 'keith.eth', 'shipoffools.eth', 'webhash.eth',
    '1985.eth', 'namesys.eth', '0xneelam.eth',
    'thehedgehog.eth', '$ron.eth', 'master.eth',
    'gnosis.eth', 'satoshi.dev.eth', 'meta8.eth', 'pepe.eth'
];

// Combined array for backward compatibility
const ENS_NAMES = [...PRIORITY_ENS_NAMES, ...OTHER_ENS_NAMES];

// ENS on-chain contract addresses
const ENS_REGISTRAR = '0x253553366Da8546fC250F225fe3d25d0C782303b';
const ENS_PUBLIC_RESOLVER = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63';
const ENS_REVERSE_REGISTRAR = '0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb';

// Optional 1% protocol fee on tips — destination resolves to geocities.eth on-chain
// or the mapped address below. Leave empty to disable the fee entirely.
const GEOCITIES_FEE_RECIPIENT = 'geocities.eth';
const GEOCITIES_FEE_BPS = 100; // 1.00%

function _formatFeeAmount(amountStr, tokenSymbol) {
    const amt = parseFloat(amountStr);
    if (!isFinite(amt) || amt <= 0) return null;
    const fee = amt * (GEOCITIES_FEE_BPS / 10000);
    const decimals = (tokenSymbol === 'USDC' || tokenSymbol === 'USDT') ? 6 : 8;
    const rounded = parseFloat(fee.toFixed(decimals));
    if (rounded <= 0) return null;
    return String(rounded);
}

// Token definitions (symbol → address + decimals)
const TOKENS = {
    ETH:  { symbol: 'ETH',  address: null,                                           decimals: 18 },
    USDC: { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6  },
    USDT: { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6  },
    DAI:  { symbol: 'DAI',  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    WETH: { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    ENS:  { symbol: 'ENS',  address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72', decimals: 18 },
};
const PARASWAP_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
// ParaSwap Partner Program revenue share. `partner` identifies GeoCities in the
// dashboard; `partnerFeeBps` + `partnerAddress` split the spread to treasury.
// Set PARASWAP_PARTNER_ADDRESS once enrolled — until then the fee is zero and
// the partner string is informational only.
const PARASWAP_PARTNER = 'geocities';
const PARASWAP_PARTNER_FEE_BPS = 50; // 0.5%
const PARASWAP_PARTNER_ADDRESS = ''; // fill in after partner enrollment
let _lastSwapQuote = null;

// EIP-6963 multi-wallet discovery — collected at startup
const _eip6963Providers = [];
window.addEventListener('eip6963:announceProvider', (event) => {
    if (!_eip6963Providers.find(p => p.info.uuid === event.detail.info.uuid)) {
        _eip6963Providers.push(event.detail);
    }
});
window.dispatchEvent(new Event('eip6963:requestProvider'));

// WalletConnect v2 config. One projectId covers every major wallet — QR on
// desktop, native deep-link (managed by WalletConnect's own infra) on mobile.
// Create a free projectId at https://cloud.reown.com and paste it below.
// The WalletConnect row is hidden in the connect modal until this is set.
const WALLETCONNECT_PROJECT_ID = ''; // ← fill in from https://cloud.reown.com
const _WC_CDN = 'https://esm.sh/@walletconnect/ethereum-provider@2.17.0';

let _wcProvider = null;
let _wcProviderPromise = null;

// Lazy-load @walletconnect/ethereum-provider. Only pays the ~400KB cost +
// opens a relay WebSocket when the user actually clicks the WalletConnect row.
async function _getWalletConnectProvider() {
    if (_wcProvider) return _wcProvider;
    if (!WALLETCONNECT_PROJECT_ID) {
        throw new Error('WalletConnect projectId not set. Get one at cloud.reown.com and set WALLETCONNECT_PROJECT_ID in script.js.');
    }
    if (_wcProviderPromise) return _wcProviderPromise;
    _wcProviderPromise = (async () => {
        const mod = await import(_WC_CDN);
        const EthereumProvider = mod.EthereumProvider || mod.default?.EthereumProvider || mod.default;
        const provider = await EthereumProvider.init({
            projectId: WALLETCONNECT_PROJECT_ID,
            chains: [1],
            showQrModal: true,
            metadata: {
                name: 'GeoCities',
                description: 'ENS identity platform',
                url: window.location.origin || window.location.href,
                icons: [`${window.location.origin}/icons/icon-192x192.png`],
            },
            rpcMap: { 1: 'https://cloudflare-eth.com' },
        });
        _wcProvider = provider;
        return provider;
    })();
    try {
        return await _wcProviderPromise;
    } finally {
        _wcProviderPromise = null;
    }
}

async function _connectWalletConnect() {
    closeWalletModal();
    try {
        const provider = await _getWalletConnectProvider();
        // If a previous session persisted in localStorage, accounts are already
        // populated — skip the connect prompt and just resume.
        if (!provider.session) {
            await provider.connect();
        }
        const accounts = provider.accounts?.length
            ? provider.accounts
            : await provider.request({ method: 'eth_accounts' });
        if (!accounts?.length) return;
        _connectedWallet = {
            address: accounts[0],
            provider,
            info: { name: 'WalletConnect', rdns: 'com.walletconnect' },
        };
        _attachProviderListeners(provider);
        // Wallet-initiated disconnect — clear UI state
        provider.on?.('disconnect', () => {
            if (_connectedWallet?.provider === provider) {
                _detachProviderListeners(provider);
                _connectedWallet = null;
                updateWalletUI();
            }
        });
        updateWalletUI();
    } catch (e) {
        console.warn('WalletConnect connect failed:', e);
        if (typeof e?.message === 'string' && e.message.includes('projectId not set')) {
            alert(e.message);
        }
    }
}


let gridResizeHandler = null;
let gridObserver = null;

// Profile state
let _currentProfileAddress = null;
let _currentProfileEnsName = null;
let _currentProfileData = null;
// _connectedWallet: null when disconnected, else { address, provider, info }.
// `provider` is the exact EIP-1193 provider the user picked in the modal —
// critical when multiple wallets inject into window.ethereum.
let _connectedWallet = null;

// Return the EIP-1193 provider to route requests through. Prefers the user's
// chosen provider; falls back to window.ethereum for pre-connect reads.
function _getWalletProvider() {
    return _connectedWallet?.provider || window.ethereum || null;
}

// Prompt the wallet to switch networks before running a mainnet-only action
// (ENS registrar, ParaSwap, EFP, resolver writes). Throws if the user rejects
// so the caller can surface a clear inline error.
async function _ensureChain(chainIdHex = '0x1') {
    const provider = _getWalletProvider();
    if (!provider) throw new Error('No wallet connected');
    const current = await provider.request({ method: 'eth_chainId' });
    if (current === chainIdHex) return;
    try {
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
    } catch (err) {
        // 4902: chain not added to the wallet yet. Only mainnet is required
        // today, which every wallet ships with — so surface a real error.
        if (err?.code === 4902) throw new Error('Add Ethereum mainnet to your wallet and try again.');
        throw err;
    }
}

// Turn raw wallet/RPC errors into strings a human would write. Unknown errors
// fall back to a generic line — the raw message still goes to console.error.
function _formatTxError(err) {
    if (!err) return 'Something went wrong.';
    const code = err.code ?? err.error?.code;
    const msg = (err.shortMessage || err.reason || err.error?.message || err.message || String(err)).toLowerCase();
    if (code === 4001 || code === 'ACTION_REJECTED' || msg.includes('user rejected') || msg.includes('user denied')) {
        return 'You cancelled the transaction.';
    }
    if (code === 4902 || msg.includes('unrecognized chain')) return 'This network isn\u2019t in your wallet yet — approve the prompt to add it.';
    if (msg.includes('insufficient funds')) return 'Not enough ETH to cover gas + amount.';
    if (msg.includes('insufficient allowance')) return 'Token approval missing — try again to approve first.';
    if (msg.includes('nonce too low') || msg.includes('replacement') || msg.includes('underpriced')) {
        return 'A pending tx is still confirming — wait a moment and retry.';
    }
    if (msg.includes('network') && msg.includes('error')) return 'Network hiccup — try again.';
    if (msg.includes('missing revert data') || msg.includes('cannot estimate gas')) return 'Transaction would fail — double-check the amount and try again.';
    if (msg.includes('nameunavailable') || msg.includes('already registered')) return 'That name is already registered.';
    if (msg.includes('commitmenttoonew') || msg.includes('commitment too new')) return 'Wait a few more seconds before registering.';
    if (msg.includes('commitmenttooold') || msg.includes('commitment too old')) return 'Commitment expired — start the registration over.';
    const fallback = err.shortMessage || err.reason || err.message;
    return fallback ? String(fallback).slice(0, 140) : 'Something went wrong.';
}

// ─── Transaction toast stack ────────────────────────────────────────────────
// Global, per-tx visual feedback that survives modal close. Each tx-initiating
// action opens a toast, updates it on receipt, and auto-dismisses on success.
const _txToast = (() => {
    let stack = null;
    let seq = 0;
    const ensureStack = () => {
        if (stack) return stack;
        stack = document.getElementById('tx-toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'tx-toast-stack';
            document.body.appendChild(stack);
        }
        return stack;
    };
    const explorerUrl = (hash) => `https://etherscan.io/tx/${hash}`;
    const add = ({ title = 'Transaction', sub = 'Waiting for wallet…' } = {}) => {
        const root = ensureStack();
        const el = document.createElement('div');
        el.className = 'tx-toast';
        el.innerHTML = `
            <button class="tx-toast-close" aria-label="Dismiss">\u00d7</button>
            <div class="tx-toast-title"></div>
            <div class="tx-toast-sub"></div>`;
        const titleEl = el.querySelector('.tx-toast-title');
        const subEl = el.querySelector('.tx-toast-sub');
        titleEl.textContent = title;
        subEl.textContent = sub;
        el.querySelector('.tx-toast-close').addEventListener('click', () => dismiss());
        root.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        const id = ++seq;
        let autoDismiss = null;
        const clearAuto = () => { if (autoDismiss) { clearTimeout(autoDismiss); autoDismiss = null; } };
        const dismiss = () => {
            clearAuto();
            el.classList.remove('show');
            setTimeout(() => el.remove(), 200);
        };
        const update = (patch = {}) => {
            if (patch.title) titleEl.textContent = patch.title;
            if (patch.sub !== undefined) {
                if (patch.txHash) {
                    const short = `${patch.txHash.slice(0,10)}\u2026`;
                    subEl.innerHTML = `${_escapeHtmlText(patch.sub)} <a href="${explorerUrl(patch.txHash)}" target="_blank" rel="noopener noreferrer">${short}</a>`;
                } else {
                    subEl.textContent = patch.sub;
                }
            } else if (patch.txHash) {
                const short = `${patch.txHash.slice(0,10)}\u2026`;
                subEl.innerHTML = `<a href="${explorerUrl(patch.txHash)}" target="_blank" rel="noopener noreferrer">${short}</a>`;
            }
            if (patch.kind === 'error') { el.classList.remove('tx-success'); el.classList.add('tx-error'); }
            else if (patch.kind === 'success') { el.classList.remove('tx-error'); el.classList.add('tx-success'); }
            if (patch.autoDismissMs) {
                clearAuto();
                autoDismiss = setTimeout(dismiss, patch.autoDismissMs);
            }
        };
        return { id, update, dismiss };
    };
    return { add };
})();

function _escapeHtmlText(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ENS on-chain fetch helpers (Keccak-256 + resolver calls via Cloudflare gateway)

function _keccak256(data) {
    const RATE = 136;
    const RCL = new Int32Array([
        0x00000001, 0x00008082, 0x0000808a, 0x80008000,
        0x0000808b, 0x80000001, 0x80008081, 0x00008009,
        0x0000008a, 0x00000088, 0x80008009, 0x8000000a,
        0x8000808b, 0x0000008b, 0x00008089, 0x00008003,
        0x00008002, 0x00000080, 0x0000800a, 0x8000000a,
        0x80008081, 0x00008080, 0x80000001, 0x80008008
    ]);
    const RCH = new Int32Array([
        0, 0, 0x80000000, 0x80000000,
        0, 0, 0x80000000, 0x80000000,
        0, 0, 0, 0,
        0, 0x80000000, 0x80000000, 0x80000000,
        0x80000000, 0x80000000, 0, 0x80000000,
        0x80000000, 0x80000000, 0, 0x80000000
    ]);
    const ROT = [0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
    const sl = new Int32Array(25), sh = new Int32Array(25);

    function rot(lo, hi, n) {
        if (n === 0) return [lo, hi];
        if (n < 32) return [(lo << n) | (hi >>> (32 - n)), (hi << n) | (lo >>> (32 - n))];
        if (n === 32) return [hi, lo];
        n -= 32;
        return [(hi << n) | (lo >>> (32 - n)), (lo << n) | (hi >>> (32 - n))];
    }

    function f() {
        const cl = new Int32Array(5), ch = new Int32Array(5);
        const bl = new Int32Array(25), bh = new Int32Array(25);
        for (let r = 0; r < 24; r++) {
            for (let x = 0; x < 5; x++) {
                cl[x] = sl[x] ^ sl[x+5] ^ sl[x+10] ^ sl[x+15] ^ sl[x+20];
                ch[x] = sh[x] ^ sh[x+5] ^ sh[x+10] ^ sh[x+15] ^ sh[x+20];
            }
            for (let x = 0; x < 5; x++) {
                const [rl, rh] = rot(cl[(x+1)%5], ch[(x+1)%5], 1);
                const dl = cl[(x+4)%5] ^ rl, dh = ch[(x+4)%5] ^ rh;
                for (let y = 0; y < 5; y++) { sl[x+5*y] ^= dl; sh[x+5*y] ^= dh; }
            }
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    const [rl, rh] = rot(sl[x+5*y], sh[x+5*y], ROT[x+5*y]);
                    const t = y + 5*((2*x+3*y)%5);
                    bl[t] = rl; bh[t] = rh;
                }
            }
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    const i = x+5*y;
                    sl[i] = bl[i] ^ (~bl[(x+1)%5+5*y] & bl[(x+2)%5+5*y]);
                    sh[i] = bh[i] ^ (~bh[(x+1)%5+5*y] & bh[(x+2)%5+5*y]);
                }
            }
            sl[0] ^= RCL[r]; sh[0] ^= RCH[r];
        }
    }

    const pad = RATE - (data.length % RATE);
    const msg = new Uint8Array(data.length + pad);
    msg.set(data);
    msg[data.length] = 0x01;
    msg[msg.length - 1] |= 0x80;

    for (let off = 0; off < msg.length; off += RATE) {
        for (let i = 0; i < 17; i++) {
            const b = off + i * 8;
            sl[i] ^= msg[b] | (msg[b+1] << 8) | (msg[b+2] << 16) | (msg[b+3] << 24);
            sh[i] ^= msg[b+4] | (msg[b+5] << 8) | (msg[b+6] << 16) | (msg[b+7] << 24);
        }
        f();
    }

    const out = new Uint8Array(32);
    for (let i = 0; i < 4; i++) {
        const lo = sl[i] >>> 0, hi = sh[i] >>> 0;
        for (let b = 0; b < 4; b++) out[i*8+b] = (lo >>> (b*8)) & 0xff;
        for (let b = 0; b < 4; b++) out[i*8+4+b] = (hi >>> (b*8)) & 0xff;
    }
    return out;
}

function _ensNamehash(name) {
    let node = new Uint8Array(32);
    if (!name) return node;
    const labels = name.toLowerCase().split('.');
    for (let i = labels.length - 1; i >= 0; i--) {
        const labelHash = _keccak256(new TextEncoder().encode(labels[i]));
        const combined = new Uint8Array(64);
        combined.set(node);
        combined.set(labelHash, 32);
        node = _keccak256(combined);
    }
    return node;
}

function _toHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function _encodeTextCall(namehashHex, key) {
    const keyBytes = new TextEncoder().encode(key);
    const keyPad = Math.ceil(keyBytes.length / 32) * 32;
    const out = new Uint8Array(4 + 32 + 32 + 32 + keyPad);
    out[0] = 0x59; out[1] = 0xd1; out[2] = 0xd4; out[3] = 0x3c;
    for (let i = 0; i < 32; i++) out[4 + i] = parseInt(namehashHex.slice(i*2, i*2+2), 16);
    out[4 + 32 + 31] = 64;
    const kl = keyBytes.length;
    out[4 + 64 + 29] = (kl >> 16) & 0xff;
    out[4 + 64 + 30] = (kl >> 8) & 0xff;
    out[4 + 64 + 31] = kl & 0xff;
    out.set(keyBytes, 4 + 96);
    return '0x' + _toHex(out);
}

async function _ethCall(to, data) {
    const r = await fetch('https://cloudflare-eth.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_call', params: [{ to, data }, 'latest'], id: 1 })
    });
    const j = await r.json();
    return j.result || null;
}

function _decodeAbiString(hex) {
    if (!hex || hex === '0x') return '';
    const d = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (d.length < 128) return '';
    const len = parseInt(d.slice(64, 128), 16);
    if (!len || len > 10000 || d.length < 128 + len * 2) return '';
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = parseInt(d.slice(128 + i*2, 130 + i*2), 16);
    return new TextDecoder().decode(bytes);
}

async function fetchENSNumericTextRecords(ensName) {
    try {
        const nhBytes = _ensNamehash(ensName);
        const nhHex = _toHex(nhBytes);
        const resolverResult = await _ethCall(
            '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
            '0x0178b8bf' + nhHex
        );
        if (!resolverResult || resolverResult.length < 42) return {};
        const resolver = '0x' + resolverResult.slice(-40);
        if (/^0x0+$/.test(resolver)) return {};
        const calls = Array.from({ length: 20 }, (_, i) => {
            const key = String(i);
            return _ethCall(resolver, _encodeTextCall(nhHex, key))
                .then(r => ({ key, value: _decodeAbiString(r) }))
                .catch(() => ({ key, value: '' }));
        });
        const results = await Promise.all(calls);
        const records = {};
        for (const { key, value } of results) {
            if (value) records[key] = value;
        }
        return records;
    } catch (e) {
        console.warn('ENS on-chain fetch failed:', e);
        return {};
    }
}

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
        
        // Fetch the profile data with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${API_BASE_URL}/profile/ens/geocities.eth`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

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
    
    // Remove any custom color styles
    const customStyleEl = document.getElementById('custom-color-styles');
    if (customStyleEl) {
        customStyleEl.textContent = '';
    }
    
    // Update CSS variables directly
    document.documentElement.style.removeProperty('--background-color');
    document.documentElement.style.removeProperty('--primary-color');
    document.documentElement.style.removeProperty('--border-color');
    
    // Re-apply default theme colors without !important
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
    
    // Reset all effects and ensure effect select is set to 'none'
    removeAllEffects();
    if (effectSelect) {
        effectSelect.value = 'none';
    }
    
    // Reset dropdown color pickers and effect select if they exist
    const navBgColor = document.getElementById('nav-bg-color');
    const navTextColor = document.getElementById('nav-text-color');
    const navBorderColor = document.getElementById('nav-border-color');
    const navEffectSelect = document.getElementById('nav-effect-select');
    
    if (navBgColor) {
        navBgColor.value = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
    }
    
    if (navTextColor) {
        navTextColor.value = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    }
    
    if (navBorderColor) {
        navBorderColor.value = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    }
    
    if (navEffectSelect) {
        navEffectSelect.value = 'none';
    }
    
    // If there's a default avatar in the nav, regenerate it with the new theme colors
    const navLogoImg = document.getElementById('nav-logo-img');
    if (navLogoImg && navLogoImg.dataset.isDefaultAvatar === 'true') {
        // Use the stored original letter if available
        const originalLetter = navLogoImg.dataset.originalLetter || '?';
        const defaultAvatar = createDefaultAvatar(originalLetter);
        setAvatar(defaultAvatar, originalLetter);
    }
    
    // Update all default avatars in the ENS grid
    updateENSGridAvatars();
}

// Function to update all default avatars in the ENS grid when theme changes
function updateENSGridAvatars() {
    // Find all avatar images in the ENS grid
    const avatarImages = document.querySelectorAll('.ens-avatar img');
    
    // Update each default avatar with new theme colors
    avatarImages.forEach(img => {
        if (img.dataset.isDefaultAvatar === 'true' && img.dataset.originalLetter) {
            // Regenerate the default avatar with the new theme colors
            const defaultAvatar = createDefaultAvatar(img.dataset.originalLetter);
            img.src = defaultAvatar;
        }
    });
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
        // Create a style element to override theme variables with !important
        let customStyleEl = document.getElementById('custom-color-styles');
        if (!customStyleEl) {
            customStyleEl = document.createElement('style');
            customStyleEl.id = 'custom-color-styles';
            document.head.appendChild(customStyleEl);
        }
        
        // Get current values
        const bgColor = bgColorPicker.value;
        const textColor = textColorPicker.value;
        const borderColor = borderColorPicker.value;
        
        // Apply the styles with !important to override theme settings
        customStyleEl.textContent = `
            :root {
                --background-color: ${bgColor} !important;
                --primary-color: ${textColor} !important;
                --border-color: ${borderColor} !important;
            }
            body {
                background-color: ${bgColor} !important;
                color: ${textColor} !important;
            }
            .nav-bar, .profile-records, .footer, .search-container, .search-input, 
            .search-button, #theme-toggle, .profile-record, .profile-header-image, 
            .download-website-container, .control-button, #follow-button, .follow-button,
            .download-website-button, .deploy-website-button, .connect-website-button,
            .effect-select, #effect-select, .effect-control, select, option,
            #bg-color, #text-color, #border-color, .color-picker, .color-button, input[type="color"],
            .ens-grid-container, .ens-profile, .ens-name, .ens-avatar,
            .dropdown-btn, .dropdown-content, .dropdown-section, .dropdown-controls,
            .dropdown-website-button, #nav-bg-color, #nav-text-color, #nav-border-color, 
            #nav-effect-select, .dropdown-section h4 {
                background-color: ${bgColor} !important;
                color: ${textColor} !important;
                border-color: ${borderColor} !important;
            }
            
            /* Specifically target all dropdown buttons including Edit Records and Follow */
            .dropdown-button, #nav-edit-records, #nav-efp-link, #nav-download-website, #nav-connect-website {
                background-color: ${bgColor} !important;
                color: ${textColor} !important;
                border-color: ${borderColor} !important;
            }
            
            /* Specifically target the button text and labels */
            .button-text, .control-button span, .dropdown-button, .dropdown-section h4,
            #nav-effect-select, .effect-select, .dropdown-controls-col .control-button span {
                color: ${textColor} !important;
            }
            
            /* Specifically target the search input placeholder */
            .search-input::placeholder {
                color: ${textColor} !important;
                opacity: 0.7 !important;
            }
            
            /* Specifically target the avatar border */
            .nav-logo {
                border: 1px solid ${borderColor} !important;
            }
            .nav-logo img {
                border-color: ${borderColor} !important;
            }
            
            /* Ensure light mode also applies these styles */
            [data-theme="light"] .dropdown-button,
            [data-theme="light"] #nav-edit-records,
            [data-theme="light"] #nav-efp-link,
            [data-theme="light"] #nav-download-website,
            [data-theme="light"] #nav-connect-website {
                background-color: ${bgColor} !important;
                color: ${textColor} !important;
                border-color: ${borderColor} !important;
            }
        `;
        
        // Also update the CSS variables as a fallback
        document.documentElement.style.setProperty('--background-color', bgColor, 'important');
        document.documentElement.style.setProperty('--primary-color', textColor, 'important');
        document.documentElement.style.setProperty('--border-color', borderColor, 'important');
    }
    
    // Apply changes immediately to all elements
    document.body.style.setProperty('background-color', bgColor, 'important');
    document.querySelectorAll('.download-website-container, .control-button').forEach(el => {
        el.style.setProperty('background-color', bgColor, 'important');
    });
    
    // If there's an ENS name with no avatar, regenerate the default avatar with new colors
    const navLogoImg = document.getElementById('nav-logo-img');
    if (navLogoImg && navLogoImg.dataset.isDefaultAvatar === 'true') {
        // Use the originalLetter property that was set in setAvatar function
        const originalLetter = navLogoImg.dataset.originalLetter || '?';
        const defaultAvatar = createDefaultAvatar(originalLetter);
        setAvatar(defaultAvatar, originalLetter);
        navLogoImg.dataset.isDefaultAvatar = 'true';
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
        '.download-website-button, .deploy-website-button, .connect-website-button, ' +
        '.dropdown-btn, .dropdown-content, .dropdown-section, .dropdown-controls, ' +
        '.dropdown-website-button, #settings-dropdown-btn, .dropdown-button'
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
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button, ' +
        '.dropdown-btn, .dropdown-content, .dropdown-section, .dropdown-controls, ' +
        '.dropdown-website-button, #settings-dropdown-btn, .dropdown-button'
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
            background: #ffffff; /* Always white, regardless of text color */
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
        '.profile-record hr, .dropdown-btn, .dropdown-content, .dropdown-section, ' +
        '.dropdown-controls, .dropdown-website-button, #settings-dropdown-btn, .dropdown-section h4, ' +
        '.dropdown-button'
    );
    
    // Define the main rainbow colors
    const colors = [
        [255, 0, 0],     // Red
        [255, 128, 0],   // Orange
        [255, 255, 0],   // Yellow
        [0, 255, 0],     // Green
        [0, 0, 255],     // Blue
        [128, 0, 255],   // Purple
        [255, 0, 0]      // Back to red (for smooth loop)
    ];
    
    // Total animation duration in milliseconds
    const animationDuration = 3000; // 3 seconds for a full cycle
    const fps = 60; // Frames per second for smooth animation
    const interval = 1000 / fps; // Interval between frames in ms
    
    // Track animation progress
    let startTime = Date.now();
    
    // Helper function to interpolate between two colors
    function interpolateColor(color1, color2, factor) {
        const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
        const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
        const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Store the interval ID so we can clear it later
    window.rainbowInterval = setInterval(() => {
        // Calculate current position in the animation
        const elapsed = (Date.now() - startTime) % animationDuration;
        const position = elapsed / animationDuration * (colors.length - 1);
        
        // Determine which two colors to interpolate between
        const index = Math.floor(position);
        const nextIndex = (index + 1) % colors.length;
        
        // Calculate interpolation factor between the two colors (0-1)
        const factor = position - index;
        
        // Get the interpolated color
        const color = interpolateColor(colors[index], colors[nextIndex], factor);
        
        // Apply the color to all elements
        elements.forEach(el => {
            el.style.setProperty('border-color', color, 'important');
        });
    }, interval);
}

function removeRainbowEffect() {
    // Clear the interval if it exists
    if (window.rainbowInterval) {
        clearInterval(window.rainbowInterval);
        window.rainbowInterval = null;
    }
    
    // Reset border colors on all elements
    const elements = document.querySelectorAll(
        '.nav-logo, .search-input, .search-button, #theme-toggle, ' +
        '.profile-records, .profile-record, .profile-header-image, .footer, ' +
        '.color-button, .effect-select, .follow-button, .control-button, ' +
        '.download-website-button, .deploy-website-button, .connect-website-button, ' +
        '.profile-record hr, .dropdown-btn, .dropdown-content, .dropdown-section, ' +
        '.dropdown-controls, .dropdown-website-button, #settings-dropdown-btn, .dropdown-section h4, ' +
        '.dropdown-button'
    );
    
    elements.forEach(el => {
        el.style.removeProperty('border-color');
    });
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
        opacity: 0.5; /* Adjusted opacity */
    `;
    
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const columns = Math.floor(window.innerWidth / 20); /* Adjusted column calculation */
    
    // Create style for the matrix effect
    const matrixStyle = document.createElement('style');
    matrixStyle.textContent = `
        @keyframes matrixFall {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            70% { opacity: 1; } /* Adjusted keyframes */
            100% { transform: translateY(100vh); opacity: 0; } /* Adjusted keyframes */
        }
    `;
    document.head.appendChild(matrixStyle);
    
    // Create columns
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        const duration = Math.random() * 6 + 8; /* Adjusted duration */
        
        column.style.cssText = `
            position: absolute;
            top: -100px; /* Keep starting position */
            left: ${i * 20}px; /* Adjusted spacing */
            color: #22FF22;
            font-family: monospace;
            font-size: 16px; /* Adjusted font size */
            line-height: 16px; /* Adjusted line height */
            animation: matrixFall ${duration}s linear infinite;
            animation-delay: -${Math.random() * 10}s; /* Keep delay */
            text-shadow: 0 0 8px #22FF22, 0 0 15px #22FF22, 0 0 20px #22FF22;
            padding: 0 5px; /* Keep padding */
        `;
        
        let text = '';
        const length = 60; // Keep column length
        
        for (let j = 0; j < length; j++) {
            const char = characters[Math.floor(Math.random() * characters.length)];
            const opacity = Math.max(0.1, 1 - (j / length)); /* Adjusted opacity logic */
            
            // Refined bright wake effect
            if (j === 0) {
                text += `<span style="color: #FFFFFF; text-shadow: 0 0 5px #E0FFE0, 0 0 15px #E0FFE0, 0 0 25px #80FF80, 0 0 35px #22FF22; opacity: 1;">${char}</span><br>`;
            } else if (j === 1) {
                text += `<span style="color: #E0FFE0; text-shadow: 0 0 5px #22FF22, 0 0 10px #22FF22; opacity: ${opacity};">${char}</span><br>`;
            } else if (j === 2) {
                text += `<span style="color: #C0FFC0; text-shadow: 0 0 5px #22FF22; opacity: ${opacity};">${char}</span><br>`;
            } else if (j >= 3 && j <= 5) {
                text += `<span style="color: #A0FFA0; opacity: ${opacity};">${char}</span><br>`;
            } else {
                // Standard characters
                text += `<span style="color: #22FF22; opacity: ${opacity};">${char}</span><br>`;
            }
        }
        
        column.innerHTML = text;
        matrixContainer.appendChild(column);
    }
    
    document.body.appendChild(matrixContainer);
    
    // Set up character changing for a more dynamic effect
    function changeRandomCharacters() {
        if (!document.getElementById('matrix-container')) return;
        
        const columns = document.querySelectorAll('#matrix-container div');
        const randomColumn = columns[Math.floor(Math.random() * columns.length)];
        
        if (randomColumn) {
            const spans = randomColumn.querySelectorAll('span');
            const randomSpanIndex = Math.floor(Math.random() * spans.length);
            
            if (spans[randomSpanIndex]) {
                spans[randomSpanIndex].textContent = characters[Math.floor(Math.random() * characters.length)];
                
                // Brief glow effect
                const originalStyle = spans[randomSpanIndex].style.textShadow;
                spans[randomSpanIndex].style.textShadow = '0 0 10px #fff, 0 0 20px #0f0, 0 0 30px #0f0';
                
                setTimeout(() => {
                    if (spans[randomSpanIndex]) {
                        spans[randomSpanIndex].style.textShadow = originalStyle;
                    }
                }, 300);
            }
        }
        
        // Continue the animation loop at a reasonable rate
        matrixContainer.dataset.animationId = setTimeout(() => {
            requestAnimationFrame(changeRandomCharacters);
        }, 50); /* Adjusted character change frequency */
    }
    
    // Start the character changing effect
    changeRandomCharacters();
}

function removeMatrixEffect() {
    const matrixContainer = document.getElementById('matrix-container');
    if (matrixContainer) {
        // Cancel the animation timer if it exists
        if (matrixContainer.dataset.animationId) {
            clearTimeout(parseInt(matrixContainer.dataset.animationId));
        }
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
        '.download-website-button, .deploy-website-button, .connect-website-button, ' +
        '.dropdown-btn, .dropdown-content, .dropdown-section, .dropdown-controls, ' +
        '.dropdown-website-button, #settings-dropdown-btn, .dropdown-section h4, ' +
        '.dropdown-button'
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
        .download-website-button, .deploy-website-button, .connect-website-button,
        .dropdown-button {
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
        '.download-website-button, .deploy-website-button, .connect-website-button, ' +
        '.dropdown-btn, .dropdown-content, .dropdown-section, .dropdown-controls, ' +
        '.dropdown-website-button, #settings-dropdown-btn, .dropdown-section h4, ' +
        '.dropdown-button'
    );
    elements.forEach(el => {
        el.style.textShadow = 'none';
        el.style.boxShadow = 'none';
        el.style.animation = 'none';
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
        '.download-website-button, .deploy-website-button, .connect-website-button, ' +
        '.dropdown-button'
    );
    elements.forEach(el => {
        el.style.boxShadow = '';
        el.style.animation = '';
    });
}

function applyVaporwareEffect() {
    // Apply gradient background to body
    document.body.style.background = 'linear-gradient(45deg, #ff00ff, #00ffff)';
    document.body.style.backgroundSize = '100% 100%';
    
    // Create a style element for vaporware effect
    let vaporwareStyleEl = document.getElementById('vaporware-effect-styles');
    if (!vaporwareStyleEl) {
        vaporwareStyleEl = document.createElement('style');
        vaporwareStyleEl.id = 'vaporware-effect-styles';
        document.head.appendChild(vaporwareStyleEl);
    }
    
    // Apply vaporware styles with !important to override theme settings
    // Only apply to containers/backgrounds, not the elements themselves
    vaporwareStyleEl.textContent = `
        /* Apply to main containers */
        .nav-bar, .search-container, .download-website-container {
            background-color: transparent !important;
        }
        
        /* Apply to page background but preserve element styling */
        body > .container, #profile-page {
            background-color: transparent !important;
        }
    `;
}

function removeVaporwareEffect() {
    // Reset body background
    document.body.style.background = '';
    document.body.style.backgroundSize = '';
    
    // Remove the vaporware style element
    const vaporwareStyleEl = document.getElementById('vaporware-effect-styles');
    if (vaporwareStyleEl) {
        vaporwareStyleEl.remove();
    }
    
    // Reset any inline styles that might have been applied to containers
    const containers = document.querySelectorAll(
        '.nav-bar, .search-container, .download-website-container, ' +
        'body > .container, #profile-page'
    );
    
    containers.forEach(el => {
        el.style.backgroundColor = '';
    });
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
        templateHtml = templateHtml.replace(/ENS_NAME_TITLE_PLACEHOLDER/g, ensName); // Used for page title and raw-profile-name span
        templateHtml = templateHtml.replace(/FAVICON_SRC_PLACEHOLDER/g, avatarUrl);
        templateHtml = templateHtml.replace(/AVATAR_SRC_PLACEHOLDER/g, avatarUrl);

        // The template will fetch its own address. Set a placeholder.
        templateHtml = templateHtml.replace(/PROFILE_ETH_ADDRESS_PLACEHOLDER/g, _currentProfileAddress || 'Loading address...');
        // PROFILE_NETWORK_TYPE_PLACEHOLDER was removed from download template, so no replacement needed here.
        
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
        
        // Create download link with effect parameter in URL
        const downloadLink = document.createElement('a');
        
        // Add the effect as a URL parameter if it's not 'none'
        if (currentStyles.currentEffect !== 'none') {
            // Add a script tag to parse URL parameters in the downloaded file
            const urlParamScript = `
                <script>
                // Function to get URL parameters
                function getUrlParam(name) {
                    const urlParams = new URLSearchParams(window.location.search);
                    return urlParams.get(name);
                }
                </script>
            `;
            
            // Insert the script before the closing head tag
            const headEndIndex = templateHtml.indexOf('</head>');
            if (headEndIndex !== -1) {
                templateHtml = templateHtml.substring(0, headEndIndex) + 
                    urlParamScript + 
                    templateHtml.substring(headEndIndex);
            }
            
            // Add the effect parameter to the data URL
            // We need to add a query parameter to the HTML content itself
            // Find the opening <html> tag and add a query parameter to it
            const htmlTagIndex = templateHtml.indexOf('<html');
            if (htmlTagIndex !== -1) {
                const htmlTagEnd = templateHtml.indexOf('>', htmlTagIndex);
                if (htmlTagEnd !== -1) {
                    // Insert the effect parameter as a data attribute
                    templateHtml = templateHtml.substring(0, htmlTagEnd) + 
                        ` data-effect="${currentStyles.currentEffect}"` + 
                        templateHtml.substring(htmlTagEnd);
                }
            }
            
            downloadLink.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(templateHtml));
        } else {
            downloadLink.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(templateHtml));
        }
        
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
                        templateHtml = templateHtml.replace(/ENS_NAME_TITLE_PLACEHOLDER/g, ensName);
                        templateHtml = templateHtml.replace(/FAVICON_SRC_PLACEHOLDER/g, avatarUrl);
                        templateHtml = templateHtml.replace(/AVATAR_SRC_PLACEHOLDER/g, avatarUrl);
                        
                        // The template will fetch its own address. Set a placeholder.
                        templateHtml = templateHtml.replace(/PROFILE_ETH_ADDRESS_PLACEHOLDER/g, _currentProfileAddress || 'Loading address...');
                        // PROFILE_NETWORK_TYPE_PLACEHOLDER was removed from download template.

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
                .nav-logo, .profile-records, .profile-record, .profile-header-image, .footer, .follow-button, .search-button, .search-input, .color-button, .effect-select, .control-button, .download-website-button, .deploy-website-button, .connect-website-button, .dropdown-btn, .dropdown-content, .dropdown-button {
                    box-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color);
                    text-shadow: 0 0 5px var(--border-color), 0 0 10px var(--border-color);
                }
            `;
        case 'matrix':
            return `
                @keyframes matrixFall {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            70% { opacity: 1; } /* Adjusted keyframes */
            100% { transform: translateY(100vh); opacity: 0; } /* Adjusted keyframes */
                }

                .matrix-effect {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
            z-index: 40; /* Keep z-index */
                    overflow: hidden;
            opacity: 0.5; /* Adjusted opacity to match the one in applyMatrixEffect */
                }

                .matrix-column {
                    position: absolute;
            top: -100px; /* Keep starting position */
            color: #22FF22; /* Standard color from applyMatrixEffect */
                    font-family: monospace;
            font-size: 16px; /* Adjusted font size */
            line-height: 16px; /* Adjusted line height */
            white-space: nowrap; /* Keep nowrap */
            text-shadow: 0 0 8px #22FF22, 0 0 15px #22FF22, 0 0 20px #22FF22; /* Standard shadow */
            animation: matrixFall linear infinite; /* Duration will be set in JS */
                }
            `;
        case 'glow':
            return `
                .nav-logo, .profile-records, .profile-record, .profile-header-image, .footer, .follow-button, .search-button, .search-input, .color-button, .effect-select, .control-button, .download-website-button, .deploy-website-button, .connect-website-button, .dropdown-btn, .dropdown-content, .dropdown-button {
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
        
        // Reset avatar to default while loading the new profile
        // This prevents the old avatar from remaining visible during loading
        setAvatar(DEFAULT_AVATAR);
        
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
            // Start on-chain ENS numeric records fetch in parallel with web3.bio
            const ensRecordsPromise = fetchENSNumericTextRecords(ensName);

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
                
                const ensNumericRecords = await ensRecordsPromise;
                let mergedRecords;
                if (profileData.records && profileData.records.texts) {
                    mergedRecords = { ...profileData.records, texts: Object.assign({}, profileData.records.texts, ensNumericRecords) };
                } else {
                    mergedRecords = Object.assign({}, profileData.records || {}, ensNumericRecords);
                }

                const mergedData = {
                    ...profileData,
                    records: mergedRecords,
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
    const numberRecords = document.querySelector('.profile-number-records');
    const headerImage = document.querySelector('.profile-header-image');
    const controlButtons = document.querySelectorAll('.control-button');
    
    // Scroll to top of the page for better UX
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
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

    // Store profile state for crypto panel, downloads, and edit records
    _currentProfileAddress = data.address || null;
    _currentProfileEnsName = ensName;
    _currentProfileData = data;
    
    // Clear existing records and reset display state
    if (profileRecords) profileRecords.innerHTML = '';
    if (numberRecords) {
        numberRecords.innerHTML = '';
        numberRecords.style.display = 'none';
    }
    const _profileCard = document.querySelector('.profile-card');
    if (_profileCard) { _profileCard.innerHTML = ''; _profileCard.style.display = 'none'; }
    const _profileActions = document.querySelector('.profile-actions');
    if (_profileActions) { _profileActions.innerHTML = ''; _profileActions.style.display = 'none'; }
    const _cryptoPanel = document.querySelector('.profile-crypto-panel');
    if (_cryptoPanel) { _cryptoPanel.classList.remove('open'); }

    // Update avatar
    if (data.avatar) {
        setAvatar(data.avatar);
    } else {
        const firstLetter = ensName.charAt(0);
        const defaultAvatar = createDefaultAvatar(firstLetter);
        setAvatar(defaultAvatar, firstLetter);

        // Store the letter for later regeneration if colors change
        const navLogo = document.getElementById('nav-logo-img');
        if (navLogo) {
            navLogo.dataset.originalLetter = firstLetter;
        }
    }

    // Populate profile hero card (avatar + name + bio)
    const profileCardEl = document.querySelector('.profile-card');
    if (profileCardEl) {
        const navLogoSrc = document.getElementById('nav-logo-img').src;
        const showDisplay = data.displayName && data.displayName !== ensName;
        const bio = data.description || '';
        profileCardEl.innerHTML = `
            <img class="profile-card-avatar" src="${navLogoSrc}" alt="${ensName}">
            <div class="profile-card-info">
                <div class="profile-card-name">${showDisplay ? data.displayName : ensName}</div>
                ${showDisplay ? `<div class="profile-card-ens">${ensName}</div>` : ''}
                ${bio ? `<div class="profile-card-bio">${bio}</div>` : ''}
            </div>`;
        profileCardEl.style.display = 'flex';
    }

    // Populate action bar (Follow | Crypto | Edit Records)
    const profileActionsEl = document.querySelector('.profile-actions');
    if (profileActionsEl) {
        profileActionsEl.innerHTML = `
            <div class="profile-actions-row">
                <button class="profile-action-btn" id="profile-follow-btn">Follow</button>
                <button class="profile-action-btn" id="profile-tip-btn">Tip</button>
                <button class="profile-action-btn" id="profile-crypto-btn">Crypto</button>
                <button class="profile-action-btn" id="profile-edit-btn">Edit Records</button>
            </div>`;
        profileActionsEl.style.display = 'block';

        // Crypto panel toggle
        document.getElementById('profile-crypto-btn')?.addEventListener('click', () => {
            const panel = document.querySelector('.profile-crypto-panel');
            if (!panel) return;
            const isOpen = panel.classList.toggle('open');
            document.getElementById('profile-crypto-btn').classList.toggle('active', isOpen);
            if (isOpen) populateCryptoPanel(_currentProfileAddress, _currentProfileEnsName);
        });

        // Tip: open Crypto panel pre-switched to Send, prefill recipient.
        document.getElementById('profile-tip-btn')?.addEventListener('click', () => {
            if (!_connectedWallet) { openWalletModal(); return; }
            if (!_currentProfileAddress) return;
            const panel = document.querySelector('.profile-crypto-panel');
            if (panel && !panel.classList.contains('open')) {
                panel.classList.add('open');
                document.getElementById('profile-crypto-btn')?.classList.add('active');
                populateCryptoPanel(_currentProfileAddress, _currentProfileEnsName);
            }
            panel?.querySelectorAll('.crypto-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'send'));
            panel?.querySelectorAll('.crypto-tab-body').forEach(b => b.classList.toggle('active', b.id === 'crypto-send-body'));
            const toInput = document.getElementById('send-to');
            const amountInput = document.getElementById('send-amount');
            if (toInput) toInput.value = _currentProfileEnsName || _currentProfileAddress;
            if (amountInput && !amountInput.value) amountInput.value = '0.01';
            amountInput?.focus();
        });

        // Follow / Unfollow: toggle via EFP when wallet connected, else open efp.app
        document.getElementById('profile-follow-btn')?.addEventListener('click', (e) => {
            if (!_connectedWallet) {
                window.open(`https://efp.app/${ensName}`, '_blank', 'noopener,noreferrer');
                return;
            }
            const btn = e.currentTarget;
            if (btn.dataset.following === 'true') {
                _efpUnfollow(_currentProfileAddress, _currentProfileEnsName);
            } else {
                _efpFollow(_currentProfileAddress, _currentProfileEnsName);
            }
        });

        // Reflect existing follow state if wallet already connected
        if (_connectedWallet && _currentProfileAddress) {
            _efpRefreshFollowButton(_currentProfileAddress);
        }

        // Edit Records: inline modal when wallet connected, else link to ENS app
        document.getElementById('profile-edit-btn')?.addEventListener('click', () => {
            if (_connectedWallet) {
                openEditRecordsModal();
            } else {
                const isBase2 = ensName.endsWith('.base.eth');
                const editLink = isBase2
                    ? `https://www.base.org/name/${ensName.replace('.base.eth', '')}`
                    : `https://app.ens.domains/${ensName}`;
                window.open(editLink, '_blank', 'noopener,noreferrer');
            }
        });
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
    const isBase = ensName.endsWith('.base.eth');

    // 1. Followers/Following from ethfollow.xyz API
    console.log('Display profile data:', JSON.stringify(data.ethFollow));
    
    if (data.ethFollow) {
        console.log('Using ethfollow data:', data.ethFollow.followers, data.ethFollow.following);
        addProfileRecord('Followers', data.ethFollow.followers);
        addProfileRecord('Following', data.ethFollow.following);
    } else {
        console.log('No ethfollow data available, using zeros');
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

    // 6. Email
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

    // Extract and display number records.
    // The web3.bio API may return text records flat in data.records OR
    // nested under data.records.texts — check both.
    const rawRecords = data.records;
    const textRecords =
        rawRecords && typeof rawRecords === 'object' && !Array.isArray(rawRecords)
            ? (rawRecords.texts && typeof rawRecords.texts === 'object' && !Array.isArray(rawRecords.texts)
                ? rawRecords.texts
                : rawRecords)
            : null;

    if (textRecords) {
        const numberRecordsData = [];

        Object.entries(textRecords).forEach(([key, value]) => {
            if (/^\d+$/.test(key) && value != null && value !== '') {
                numberRecordsData.push({ key: parseInt(key, 10), value: String(value) });
            }
        });

        // Sort newest-first (highest key = most recent post)
        numberRecordsData.sort((a, b) => b.key - a.key);

        if (numberRecordsData.length > 0) {
            numberRecords.style.display = 'block';
            const postsHdr = document.createElement('div');
            postsHdr.className = 'posts-section-header';
            postsHdr.textContent = 'Posts';
            numberRecords.appendChild(postsHdr);
        }

        numberRecordsData.forEach(record => {
            addNumberRecord(record.key.toString(), record.value);
        });
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

// Populate the inline crypto panel with QR code, address, and explorer link
// EFP on-chain follow/unfollow
// Contracts (Ethereum mainnet):
//   AccountMetadata: 0x5289fE5daBC021D02FDDf23d4a4DF96F4E0F17EF
//   ListRegistry:    0x0E688f5DCa4a0a4729946ACbC44C792341714e08
//   ListRecords:     0x41Aa48Ef3c0446b46a5b1cc6337FF3d3716E2A33

async function _efpGetPrimaryListLocation(userAddress) {
    const listResp = await fetch(`https://api.ethfollow.xyz/api/v1/users/${userAddress}/primary-list`);
    if (!listResp.ok) return null;
    const listData = await listResp.json();
    const tokenId = listData.primary_list ?? listData.token_id ?? listData.list;
    if (tokenId === null || tokenId === undefined) return null;

    let listContract = '0x41Aa48Ef3c0446b46a5b1cc6337FF3d3716E2A33';
    let slot = BigInt(tokenId);
    const locResp = await fetch(`https://api.ethfollow.xyz/api/v1/lists/${tokenId}/storage-location`).catch(() => null);
    if (locResp && locResp.ok) {
        const loc = await locResp.json();
        const nonce = loc.nonce ?? loc.slot ?? loc.list_storage_location?.nonce;
        const addr = loc.contract_address ?? loc.list_storage_location?.contract_address;
        if (nonce !== undefined) slot = BigInt(nonce);
        if (addr) listContract = addr;
    }
    return { tokenId, listContract, slot };
}

async function _efpCheckFollows(userAddress, targetAddress) {
    try {
        const resp = await fetch(`https://api.ethfollow.xyz/api/v1/users/${userAddress}/following/${targetAddress}`);
        if (!resp.ok) return false;
        const data = await resp.json();
        return !!(data?.following ?? data?.is_following ?? data?.result);
    } catch { return false; }
}

async function _efpApplyListOp(opcode, targetAddress, targetEnsName) {
    // opcode 0x01 = add, 0x02 = remove
    const followBtn = document.getElementById('profile-follow-btn');
    const setFollowBtn = (text, disabled) => {
        if (followBtn) { followBtn.textContent = text; followBtn.disabled = !!disabled; }
    };
    const isAdd = opcode === 0x01;
    setFollowBtn(isAdd ? 'Following…' : 'Unfollowing…', true);

    try {
        if (!_connectedWallet) throw new Error('No wallet connected');
        await _ensureChain('0x1');
        const location = await _efpGetPrimaryListLocation(_connectedWallet.address);
        if (!location) {
            // No list yet — offer to create one via efp.app (on-chain mint is non-trivial)
            setFollowBtn('Follow', false);
            _txToast.add({
                title: 'No EFP list yet',
                sub: 'Create your list on efp.app, then come back to follow.',
                kind: 'error',
                autoDismissMs: 8000
            });
            window.open('https://efp.app/', '_blank', 'noopener,noreferrer');
            return;
        }

        const opHex = isAdd ? '01' : '02';
        const addrHex = (targetAddress || '0x0000000000000000000000000000000000000000').replace('0x', '').padStart(40, '0');
        const opBytes = '01' + opHex + '0101' + addrHex; // 24 bytes
        const opPadded = opBytes.padEnd(64, '0');

        const slotHex = location.slot.toString(16).padStart(64, '0');
        const bytesOffset = '0000000000000000000000000000000000000000000000000000000000000040';
        const bytesLen = '0000000000000000000000000000000000000000000000000000000000000018';
        const calldata = '0x5aaf83db' + slotHex + bytesOffset + bytesLen + opPadded;

        const actionLabel = isAdd ? 'Follow' : 'Unfollow';
        const toast = _txToast.add({ title: `${actionLabel} ${targetEnsName || targetAddress}`, sub: 'Confirm in wallet\u2026' });
        try {
            const txHash = await _getWalletProvider().request({
                method: 'eth_sendTransaction',
                params: [{ from: _connectedWallet.address, to: location.listContract, data: calldata }]
            });
            toast.update({ kind: 'success', sub: 'Submitted', txHash, autoDismissMs: 10000 });
        } catch (txErr) {
            toast.update({ kind: 'error', sub: _formatTxError(txErr), autoDismissMs: 8000 });
            throw txErr;
        }

        if (isAdd) {
            setFollowBtn('Following', false);
            if (followBtn) followBtn.dataset.following = 'true';
        } else {
            setFollowBtn('Follow', false);
            if (followBtn) followBtn.dataset.following = 'false';
        }
    } catch (e) {
        console.warn('EFP on-chain op failed:', e);
        setFollowBtn(isAdd ? 'Follow' : 'Following', false);
    }
}

async function _efpFollow(targetAddress, targetEnsName) {
    return _efpApplyListOp(0x01, targetAddress, targetEnsName);
}

async function _efpUnfollow(targetAddress, targetEnsName) {
    return _efpApplyListOp(0x02, targetAddress, targetEnsName);
}

async function _efpRefreshFollowButton(targetAddress) {
    const followBtn = document.getElementById('profile-follow-btn');
    if (!followBtn || !_connectedWallet || !targetAddress) return;
    if (_connectedWallet.address.toLowerCase() === targetAddress.toLowerCase()) {
        followBtn.style.display = 'none';
        return;
    }
    const isFollowing = await _efpCheckFollows(_connectedWallet.address, targetAddress);
    followBtn.dataset.following = isFollowing ? 'true' : 'false';
    followBtn.textContent = isFollowing ? 'Following' : 'Follow';
}

function populateCryptoPanel(address, ensName) {
    const panel = document.querySelector('.profile-crypto-panel');
    if (!panel) return;

    // Tab switching
    panel.querySelectorAll('.crypto-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.crypto-tab').forEach(t => t.classList.remove('active'));
            panel.querySelectorAll('.crypto-tab-body').forEach(b => b.classList.remove('active'));
            tab.classList.add('active');
            const body = document.getElementById(`crypto-${tab.dataset.tab}-body`);
            if (body) body.classList.add('active');
        });
    });

    // Receive tab
    const qrContainer = panel.querySelector('.crypto-qr-container');
    const addrDiv = panel.querySelector('.crypto-wallet-address');
    const copyBtn = panel.querySelector('.crypto-copy-btn');
    const explorerBtn = panel.querySelector('.crypto-explorer-btn');

    if (address) {
        if (addrDiv) addrDiv.textContent = address;
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            try {
                new QRCode(qrContainer, { text: address, width: 150, height: 150, correctLevel: QRCode.CorrectLevel.M });
                qrContainer.style.display = 'block';
            } catch (e) { qrContainer.style.display = 'none'; }
        }
        if (explorerBtn) {
            if (ensName && ensName.endsWith('.base.eth')) {
                explorerBtn.textContent = 'Basescan';
                explorerBtn.href = `https://basescan.org/name-lookup-search?id=${ensName}`;
            } else {
                explorerBtn.textContent = 'Etherscan';
                explorerBtn.href = `https://etherscan.io/name-lookup-search?id=${ensName}`;
            }
            explorerBtn.style.display = 'flex';
        }
        if (copyBtn) {
            copyBtn.onclick = () => {
                if (!navigator.clipboard) return;
                navigator.clipboard.writeText(address).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy Address'; }, 2000);
                });
            };
        }
    } else {
        if (addrDiv) addrDiv.textContent = 'No address found';
        if (qrContainer) qrContainer.style.display = 'none';
        if (explorerBtn) explorerBtn.style.display = 'none';
    }

    // Send tab
    const sendBtn = document.getElementById('send-submit-btn');
    const sendStatus = document.getElementById('send-status');
    if (sendBtn) {
        sendBtn.onclick = async () => {
            const toInput = document.getElementById('send-to')?.value?.trim();
            const amount = document.getElementById('send-amount')?.value?.trim();
            const token = document.getElementById('send-token')?.value;
            const feeOptIn = document.getElementById('send-fee-optin')?.checked;
            if (!toInput || !amount) { if (sendStatus) sendStatus.textContent = 'Please fill in all fields.'; return; }
            sendBtn.disabled = true;
            if (sendStatus) sendStatus.textContent = 'Sending…';
            const toast = _txToast.add({ title: `Send ${amount} ${token}`, sub: 'Confirm in wallet…' });
            try {
                const txHash = await sendToken(toInput, amount, token);
                if (sendStatus) sendStatus.textContent = `Sent! Tx: ${txHash.slice(0,10)}…`;
                toast.update({ kind: 'success', sub: 'Confirmed', txHash, autoDismissMs: 10000 });

                if (feeOptIn && GEOCITIES_FEE_RECIPIENT) {
                    const feeAmount = _formatFeeAmount(amount, token);
                    if (feeAmount) {
                        const feeToast = _txToast.add({ title: `Support GeoCities`, sub: `Confirm ${feeAmount} ${token} tip…` });
                        try {
                            const feeHash = await sendToken(GEOCITIES_FEE_RECIPIENT, feeAmount, token);
                            feeToast.update({ kind: 'success', sub: 'Thanks for the support!', txHash: feeHash, autoDismissMs: 10000 });
                        } catch (feeErr) {
                            console.warn('Fee tx skipped:', feeErr);
                            feeToast.update({ kind: 'error', sub: _formatTxError(feeErr), autoDismissMs: 6000 });
                        }
                    }
                }
            } catch (e) {
                console.error('Send failed:', e);
                const friendly = _formatTxError(e);
                if (sendStatus) sendStatus.textContent = friendly;
                toast.update({ kind: 'error', sub: friendly, autoDismissMs: 8000 });
            } finally { sendBtn.disabled = false; }
        };
    }

    // Swap tab
    const quoteBtn = document.getElementById('swap-quote-btn');
    const execBtn = document.getElementById('swap-exec-btn');
    const swapStatus = document.getElementById('swap-status');
    if (quoteBtn) {
        quoteBtn.onclick = async () => {
            const fromSym = document.getElementById('swap-from')?.value;
            const toSym = document.getElementById('swap-to')?.value;
            const amount = document.getElementById('swap-amount')?.value?.trim();
            if (!amount || fromSym === toSym) { if (swapStatus) swapStatus.textContent = 'Please enter amount and different tokens.'; return; }
            quoteBtn.disabled = true;
            if (swapStatus) swapStatus.textContent = 'Getting quote…';
            try {
                const quote = await getSwapQuote(fromSym, toSym, amount);
                _lastSwapQuote = quote;
                const estEl = document.getElementById('swap-estimate');
                if (estEl) estEl.textContent = quote.estimate;
                if (swapStatus) swapStatus.textContent = '';
                if (execBtn) execBtn.style.display = 'block';
            } catch (e) {
                if (swapStatus) swapStatus.textContent = _formatTxError(e);
                _lastSwapQuote = null;
                if (execBtn) execBtn.style.display = 'none';
            } finally { quoteBtn.disabled = false; }
        };
    }
    if (execBtn) {
        execBtn.onclick = async () => {
            if (!_lastSwapQuote) return;
            execBtn.disabled = true;
            if (swapStatus) swapStatus.textContent = 'Swapping…';
            const q = _lastSwapQuote;
            const toast = _txToast.add({ title: `Swap ${q.fromSym} \u2192 ${q.toSym}`, sub: 'Confirm in wallet\u2026' });
            try {
                const txHash = await executeSwap(_lastSwapQuote);
                if (swapStatus) swapStatus.textContent = `Swapped! Tx: ${txHash.slice(0,10)}…`;
                if (execBtn) execBtn.style.display = 'none';
                _lastSwapQuote = null;
                toast.update({ kind: 'success', sub: 'Confirmed', txHash, autoDismissMs: 10000 });
            } catch (e) {
                const friendly = _formatTxError(e);
                if (swapStatus) swapStatus.textContent = friendly;
                toast.update({ kind: 'error', sub: friendly, autoDismissMs: 8000 });
                execBtn.disabled = false;
            }
        };
    }
}

// Update the nav wallet connect button appearance
function updateWalletUI() {
    const btn = document.getElementById('wallet-connect-btn');
    if (!btn) return;
    if (_connectedWallet) {
        const addr = _connectedWallet.address;
        btn.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
        const addrEl = document.getElementById('wallet-connected-address');
        if (addrEl) addrEl.textContent = `${addr.slice(0, 10)}...${addr.slice(-6)}`;
        const dropContent = document.getElementById('wallet-connect-content');
        if (dropContent) dropContent.style.display = '';
    } else {
        btn.textContent = 'Connect';
        const dropContent = document.getElementById('wallet-connect-content');
        if (dropContent) dropContent.style.display = 'none';
    }
    if (_currentProfileAddress) _efpRefreshFollowButton(_currentProfileAddress);
}

// Open the wallet selection modal — uses EIP-6963, legacy injection, or mobile deep links
async function openWalletModal() {
    const modal = document.getElementById('wallet-modal');
    const list = document.getElementById('wallet-modal-list');
    if (!modal || !list) return;

    document.querySelectorAll('.dropdown-content.show').forEach(d => d.classList.remove('show'));
    modal.classList.add('open');

    // Show a brief detection state and re-request EIP-6963 announcements —
    // on mobile, injected providers sometimes announce after page load, so
    // giving them a tick to respond avoids falsely falling through to deep links.
    list.innerHTML = '<p class="wallet-modal-hint">Detecting wallets…</p>';
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    await new Promise(r => setTimeout(r, 350));
    _renderWalletModalList();
}

function _renderWalletModalList() {
    const list = document.getElementById('wallet-modal-list');
    if (!list) return;

    const ua = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const dappUrl = window.location.href;

    // Known wallet info for fallback detection / display
    const knownWallets = [
        { rdns: 'io.metamask',         name: 'MetaMask',       icon: '🦊', test: p => p.isMetaMask && !p.isCoinbaseWallet, installUrl: 'https://metamask.io/download/' },
        { rdns: 'xyz.coinbase.wallet', name: 'Coinbase Wallet',icon: '🔵', test: p => p.isCoinbaseWallet,                  installUrl: 'https://www.coinbase.com/wallet/downloads' },
        { rdns: 'app.rainbow',         name: 'Rainbow',        icon: '🌈', test: p => p.isRainbow,                          installUrl: 'https://rainbow.me/download' },
        { rdns: 'com.brave.wallet',    name: 'Brave Wallet',   icon: '🦁', test: p => p.isBraveWallet,                     installUrl: 'https://brave.com/wallet/' },
        { rdns: 'com.trustwallet.app', name: 'Trust Wallet',   icon: '🛡️', test: p => p.isTrust,                           installUrl: 'https://trustwallet.com/download' },
    ];

    // Detect in-app wallet browser — window.ethereum injected by a mobile wallet.
    const inAppInfo = (isMobile && window.ethereum)
        ? knownWallets.find(w => w.test(window.ethereum)) || { name: 'Wallet Browser', icon: '📱', rdns: 'unknown' }
        : null;

    list.innerHTML = '';

    const makeRow = (iconHtml, name, subtext, badge, onClick) => {
        const btn = document.createElement('button');
        btn.className = 'wallet-option';
        btn.innerHTML = `
            <div class="wallet-option-icon">${iconHtml}</div>
            <div class="wallet-option-info">
                <div class="wallet-option-name">${name}</div>
                <div class="wallet-option-status">${subtext}</div>
            </div>
            <span class="wallet-option-badge">${badge}</span>`;
        btn.addEventListener('click', onClick);
        list.appendChild(btn);
    };

    const connectWith = async (provider, info) => {
        closeWalletModal();
        try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (accounts.length) {
                _connectedWallet = { address: accounts[0], provider, info: info || null };
                _attachProviderListeners(provider);
                updateWalletUI();
            }
        } catch (e) { console.warn('Wallet connect rejected:', e); }
    };

    // 1. EIP-6963 providers — the canonical discovery channel
    for (const { info, provider } of _eip6963Providers) {
        const iconHtml = info.icon
            ? `<img src="${info.icon}" alt="${info.name}" style="width:100%;height:100%;object-fit:contain;">`
            : '🌐';
        makeRow(iconHtml, info.name, 'Detected', 'Connect', () => connectWith(provider, info));
    }

    // 2. In-app wallet browser — mobile user already has a wallet injected
    if (inAppInfo && _eip6963Providers.length === 0) {
        makeRow(inAppInfo.icon, inAppInfo.name, 'In-app browser', 'Connect',
            () => connectWith(window.ethereum, { name: inAppInfo.name, rdns: inAppInfo.rdns }));
    }

    // 3. Desktop legacy injection (window.ethereum on non-mobile, no 6963 announcement)
    if (_eip6963Providers.length === 0 && window.ethereum && !isMobile) {
        const legacyProviders = window.ethereum.providers || [window.ethereum];
        for (const p of legacyProviders) {
            const def = knownWallets.find(w => w.test(p));
            const icon = def ? def.icon : '🌐';
            const name = def ? def.name : 'Browser Wallet';
            makeRow(icon, name, 'Detected', 'Connect', () => connectWith(p, def ? { name: def.name, rdns: def.rdns } : null));
        }
    }

    // 4. WalletConnect — universal path, covers every major wallet. Desktop gets
    //    a QR code; mobile gets a wallet picker that uses WalletConnect's own
    //    (maintained) deep-link scheme. Only shown when projectId is configured.
    if (WALLETCONNECT_PROJECT_ID) {
        const subtext = isMobile ? 'Open any wallet app' : 'Scan QR with any wallet';
        makeRow('🔌', 'WalletConnect', subtext, 'Connect', _connectWalletConnect);
    }

    // 5. Mobile with no injected wallet — copy-URL fallback (always available as a
    //    backup in case WalletConnect isn't configured or doesn't work for the user's wallet).
    if (isMobile && !inAppInfo && _eip6963Providers.length === 0) {
        makeRow('🔗', 'Copy page link', 'Paste into your wallet\'s built-in browser', 'Copy', async () => {
            try {
                await navigator.clipboard.writeText(dappUrl);
                const hint = document.createElement('p');
                hint.className = 'wallet-modal-hint';
                hint.textContent = 'Link copied. Open your wallet app, go to its browser tab, and paste.';
                list.appendChild(hint);
            } catch {
                // clipboard may be blocked — show the URL for manual selection
                const pre = document.createElement('textarea');
                pre.className = 'wallet-modal-copy-fallback';
                pre.readOnly = true;
                pre.value = dappUrl;
                list.appendChild(pre);
                pre.select();
            }
        });
        const note = document.createElement('p');
        note.className = 'wallet-modal-hint';
        note.textContent = 'To connect a mobile wallet: open MetaMask, Rainbow, Coinbase Wallet, or Trust, use its built-in browser, and paste this page\'s link.';
        list.appendChild(note);
    }

    // 6. Desktop install options
    if (!isMobile) {
        const eip6963Rdns = new Set(_eip6963Providers.map(p => p.info.rdns));
        const hasLegacy = window.ethereum && knownWallets.find(k => k.test(window.ethereum));
        for (const w of knownWallets) {
            if (!eip6963Rdns.has(w.rdns) && !hasLegacy) {
                makeRow(w.icon, w.name, 'Not installed', 'Get', () => {
                    window.open(w.installUrl, '_blank', 'noopener,noreferrer');
                    closeWalletModal();
                });
            }
        }
    }

    if (list.children.length === 0) {
        list.innerHTML = '<p class="wallet-modal-hint">No wallets detected. Install a wallet extension to continue.</p>';
    }
}

function closeWalletModal() {
    document.getElementById('wallet-modal')?.classList.remove('open');
}

// Wire up the wallet connect button interactions
function initWalletConnect() {
    updateWalletUI();

    // Click: open modal if not connected, toggle dropdown if connected
    const btn = document.getElementById('wallet-connect-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_connectedWallet) {
                document.getElementById('wallet-connect-content')?.classList.toggle('show');
            } else {
                openWalletModal();
            }
        });
    }

    const disconnectBtn = document.getElementById('wallet-disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', async () => {
            const wasWc = !!(_wcProvider && _connectedWallet?.provider === _wcProvider);
            _detachProviderListeners(_connectedWallet?.provider);
            _connectedWallet = null;
            updateWalletUI();
            document.getElementById('wallet-connect-content')?.classList.remove('show');
            // End the WC session on the wallet side too — otherwise the wallet
            // still thinks it's paired and won't prompt next time.
            if (wasWc) {
                try { await _wcProvider.disconnect(); } catch (e) { console.warn('WC disconnect:', e); }
            }
        });
    }

    // Wire wallet modal close handlers (idempotent: modal is in the DOM once)
    const modal = document.getElementById('wallet-modal');
    if (modal && !modal.dataset.wired) {
        modal.dataset.wired = '1';
        document.getElementById('wallet-modal-close')?.addEventListener('click', closeWalletModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeWalletModal(); });
    }
}

// accountsChanged / chainChanged are attached to the *chosen* provider so the
// UI only reacts to the wallet the user actually connected.
const _providerListeners = new WeakMap();
function _attachProviderListeners(provider) {
    if (!provider || _providerListeners.has(provider)) return;
    const onAccounts = accounts => {
        if (!_connectedWallet || _connectedWallet.provider !== provider) return;
        if (accounts.length) _connectedWallet.address = accounts[0];
        else _connectedWallet = null;
        updateWalletUI();
    };
    const onChain = () => updateWalletUI();
    provider.on?.('accountsChanged', onAccounts);
    provider.on?.('chainChanged', onChain);
    _providerListeners.set(provider, { onAccounts, onChain });
}
function _detachProviderListeners(provider) {
    if (!provider) return;
    const refs = _providerListeners.get(provider);
    if (!refs) return;
    provider.removeListener?.('accountsChanged', refs.onAccounts);
    provider.removeListener?.('chainChanged', refs.onChain);
    _providerListeners.delete(provider);
}

// ===== ABI helpers for ENS setText =====
function _abiEncodeSetText(namehashHex, key, value) {
    const encStr = (s) => {
        const bytes = new TextEncoder().encode(s);
        const padded = Math.ceil(bytes.length / 32) * 32 || 32;
        let h = bytes.length.toString(16).padStart(64, '0');
        for (const b of bytes) h += b.toString(16).padStart(2, '0');
        return h.padEnd(64 + padded * 2, '0');
    };
    const nh = namehashHex.replace('0x', '').padStart(64, '0');
    const keyEnc = encStr(key);
    const valueEnc = encStr(value);
    const keyLen = Math.ceil(new TextEncoder().encode(key).length / 32) * 32 || 32;
    const keyOff = (96).toString(16).padStart(64, '0');
    const valOff = (96 + 32 + keyLen).toString(16).padStart(64, '0');
    return '0x10f13a8c' + nh + keyOff + valOff + keyEnc + valueEnc;
}

// ===== Edit Records modal =====
function _escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _escapeAttr(s) { return String(s).replace(/"/g,'&quot;'); }

async function openEditRecordsModal() {
    const modal = document.getElementById('edit-records-modal');
    const body = document.getElementById('edit-modal-body');
    if (!modal || !body) return;

    const p = _currentProfileData || {};
    const fields = [
        { key: 'name',         label: 'Display Name', value: p.displayName || '' },
        { key: 'description',  label: 'Bio',          value: p.description || '', multiline: true },
        { key: 'location',     label: 'Location',     value: p.location || '' },
        { key: 'status',       label: 'Status',       value: p.status || '' },
        { key: 'email',        label: 'Email',        value: p.email || '' },
        { key: 'url',          label: 'Website',      value: p.links?.website?.handle || '' },
        { key: 'com.twitter',  label: 'Twitter',      value: p.links?.twitter?.handle || '' },
        { key: 'com.github',   label: 'GitHub',       value: p.links?.github?.handle || '' },
        { key: 'com.discord',  label: 'Discord',      value: p.links?.discord?.handle || '' },
        { key: 'org.telegram', label: 'Telegram',     value: p.links?.telegram?.handle || '' },
        { key: 'xyz.farcaster',label: 'Farcaster',    value: p.links?.farcaster?.handle || '' },
        { key: 'avatar',       label: 'Avatar URL',   value: p.avatar || '' },
    ];

    const primaryBannerId = 'primary-name-banner';
    body.innerHTML =
        `<div id="${primaryBannerId}" class="primary-name-banner" style="display:none;"></div>` +
        fields.map(f => {
            if (f.key === 'avatar') {
                return `
                    <div class="edit-field">
                        <label>${f.label}</label>
                        <div class="avatar-field-row">
                            <input type="text" data-key="${f.key}" value="${_escapeAttr(f.value)}" placeholder="ipfs://… or https://…" style="flex:1;">
                            <button type="button" class="dropdown-button avatar-upload-btn" id="avatar-upload-btn">Upload</button>
                        </div>
                        <input type="file" id="avatar-upload-file" accept="image/*" style="display:none;">
                        <div id="avatar-upload-status" class="crypto-status" style="font-size:0.78em;"></div>
                    </div>`;
            }
            return `
                <div class="edit-field">
                    <label>${f.label}</label>
                    ${f.multiline
                        ? `<textarea data-key="${f.key}">${_escapeHtml(f.value)}</textarea>`
                        : `<input type="text" data-key="${f.key}" value="${_escapeAttr(f.value)}">`}
                </div>`;
        }).join('');

    _renderPrimaryNameBanner(primaryBannerId);
    _wireAvatarUpload();

    const saveBtn = document.getElementById('edit-modal-save');
    if (saveBtn) saveBtn.onclick = () => _saveRecords(fields);

    if (!modal.dataset.wired) {
        modal.dataset.wired = '1';
        document.getElementById('edit-modal-close')?.addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
    }
    modal.classList.add('open');
}

async function _saveRecords(originalFields) {
    if (!_connectedWallet) { openWalletModal(); return; }
    const body = document.getElementById('edit-modal-body');
    const saveBtn = document.getElementById('edit-modal-save');
    const ensName = _currentProfileEnsName;

    const changes = [];
    for (const f of originalFields) {
        const el = body.querySelector(`[data-key="${f.key}"]`);
        if (!el) continue;
        const newVal = el.value.trim();
        if (newVal !== f.value) changes.push({ key: f.key, value: newVal });
    }
    if (changes.length === 0) {
        document.getElementById('edit-records-modal')?.classList.remove('open');
        return;
    }

    try {
        await _ensureChain('0x1');
        const nhBytes = _ensNamehash(ensName);
        const nhHex = _toHex(nhBytes);
        const resolverResult = await _ethCall('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', '0x0178b8bf' + nhHex);
        if (!resolverResult || resolverResult.length < 42) throw new Error('No resolver');
        const resolver = '0x' + resolverResult.slice(-40);
        if (/^0x0+$/.test(resolver)) throw new Error('Zero resolver');

        const toast = _txToast.add({ title: `Update ${ensName} records`, sub: `${changes.length} record${changes.length === 1 ? '' : 's'} to set` });
        try {
            for (let i = 0; i < changes.length; i++) {
                if (saveBtn) saveBtn.textContent = `Saving ${i + 1} / ${changes.length}…`;
                const { key, value } = changes[i];
                toast.update({ sub: `Confirm ${key} (${i + 1}/${changes.length})…` });
                const txHash = await _getWalletProvider().request({
                    method: 'eth_sendTransaction',
                    params: [{ from: _connectedWallet.address, to: resolver, data: _abiEncodeSetText(nhHex, key, value) }]
                });
                toast.update({ sub: `Sent ${key} (${i + 1}/${changes.length})`, txHash });
            }
            toast.update({ kind: 'success', sub: 'All records updated', autoDismissMs: 10000 });
        } catch (txErr) {
            toast.update({ kind: 'error', sub: _formatTxError(txErr), autoDismissMs: 8000 });
            throw txErr;
        }
        if (saveBtn) saveBtn.textContent = 'Saved!';
        setTimeout(() => {
            document.getElementById('edit-records-modal')?.classList.remove('open');
            if (saveBtn) saveBtn.textContent = 'Save Changes';
        }, 2000);
    } catch (e) {
        console.error('Save records failed:', e);
        if (saveBtn) { saveBtn.textContent = 'Retry'; setTimeout(() => { saveBtn.textContent = 'Save Changes'; }, 4000); }
        const body = document.getElementById('edit-modal-body');
        if (body) {
            let errEl = body.querySelector('.edit-modal-error');
            if (!errEl) {
                errEl = document.createElement('div');
                errEl.className = 'edit-modal-error crypto-status';
                body.appendChild(errEl);
            }
            errEl.textContent = _formatTxError(e);
        }
    }
}

// ─── ENS Primary Name (reverse record) ────────────────────────────────────────

async function _getCurrentPrimaryName(userAddress) {
    try {
        const addrLower = userAddress.toLowerCase().replace(/^0x/, '');
        const reverseNode = _ensNamehash(`${addrLower}.addr.reverse`);
        const reverseNodeHex = _toHex(reverseNode);
        // Call resolver for the reverse node
        const resolverCall = await _ethCall('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', '0x0178b8bf' + reverseNodeHex);
        if (!resolverCall || resolverCall.length < 42) return '';
        const resolver = '0x' + resolverCall.slice(-40);
        if (/^0x0+$/.test(resolver)) return '';
        // name(bytes32) selector 0x691f3431
        const nameCall = await _ethCall(resolver, '0x691f3431' + reverseNodeHex);
        if (!nameCall || nameCall.length < 130) return '';
        const lenHex = nameCall.slice(66, 130);
        const strLen = parseInt(lenHex, 16);
        if (!strLen) return '';
        const strHex = nameCall.slice(130, 130 + strLen * 2);
        let out = '';
        for (let i = 0; i < strHex.length; i += 2) out += String.fromCharCode(parseInt(strHex.substr(i, 2), 16));
        return out;
    } catch (e) {
        console.warn('Primary name lookup failed:', e);
        return '';
    }
}

async function _renderPrimaryNameBanner(bannerId) {
    const banner = document.getElementById(bannerId);
    if (!banner || !_connectedWallet) return;
    const ensName = _currentProfileEnsName;
    if (!ensName || ensName.endsWith('.base.eth')) return;

    banner.style.display = 'block';
    banner.innerHTML = '<span style="opacity:0.6;">Checking primary name…</span>';

    const current = await _getCurrentPrimaryName(_connectedWallet.address);
    if (current && current.toLowerCase() === ensName.toLowerCase()) {
        banner.innerHTML = `<span class="primary-name-check">✓</span> <strong>${ensName}</strong> is your primary name`;
        banner.classList.add('is-primary');
        return;
    }
    banner.classList.remove('is-primary');
    banner.innerHTML = `
        <div class="primary-name-text">
            ${current ? `Primary name: <strong>${current}</strong>` : 'No primary name set.'}
        </div>
        <button type="button" class="dropdown-button primary-name-btn">Set ${ensName} as primary</button>
    `;
    banner.querySelector('.primary-name-btn').onclick = () => _setPrimaryName(ensName, bannerId);
}

async function _setPrimaryName(ensName, bannerId) {
    if (!_connectedWallet) { openWalletModal(); return; }
    const banner = document.getElementById(bannerId);
    const btn = banner?.querySelector('.primary-name-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Confirm in wallet…'; }

    const toast = _txToast.add({ title: `Set primary: ${ensName}`, sub: 'Confirm in wallet\u2026' });
    try {
        await _ensureChain('0x1');
        // setName(string) selector 0xc47f0027 + dynamic string encoding
        const nameBytes = new TextEncoder().encode(ensName);
        const nameHex = Array.from(nameBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const paddedNameHex = nameHex.padEnd(Math.ceil(nameHex.length / 64) * 64, '0');
        const offsetHex = '0000000000000000000000000000000000000000000000000000000000000020';
        const lenHex = nameBytes.length.toString(16).padStart(64, '0');
        const calldata = '0xc47f0027' + offsetHex + lenHex + paddedNameHex;

        const txHash = await _getWalletProvider().request({
            method: 'eth_sendTransaction',
            params: [{ from: _connectedWallet.address, to: ENS_REVERSE_REGISTRAR, data: calldata }]
        });
        toast.update({ kind: 'success', sub: 'Submitted — confirming', txHash, autoDismissMs: 10000 });
        if (btn) btn.textContent = 'Submitted…';
        setTimeout(() => _renderPrimaryNameBanner(bannerId), 8000);
    } catch (e) {
        console.error('Set primary failed:', e);
        toast.update({ kind: 'error', sub: _formatTxError(e), autoDismissMs: 8000 });
        if (btn) { btn.disabled = false; btn.textContent = `Set ${ensName} as primary`; }
    }
}

// ─── Avatar upload to IPFS via Pinata ─────────────────────────────────────────

const _PINATA_JWT_KEY = 'geocities-pinata-jwt';

async function _pinFileToIPFS(file, jwt, name) {
    const formData = new FormData();
    formData.append('file', file, file.name || 'upload');
    if (name) formData.append('pinataMetadata', JSON.stringify({ name }));
    const resp = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData
    });
    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Pinata error ${resp.status}: ${err}`);
    }
    const data = await resp.json();
    return data.IpfsHash;
}

function _wireAvatarUpload() {
    const btn = document.getElementById('avatar-upload-btn');
    const fileInput = document.getElementById('avatar-upload-file');
    const statusEl = document.getElementById('avatar-upload-status');
    const urlInput = document.querySelector('[data-key="avatar"]');
    if (!btn || !fileInput || !urlInput) return;

    const setStatus = (msg, isErr) => {
        if (!statusEl) return;
        statusEl.textContent = msg || '';
        statusEl.style.color = isErr ? '#c62828' : '';
    };

    btn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setStatus('Please choose an image file.', true); return; }
        if (file.size > 5 * 1024 * 1024) { setStatus('Image must be under 5 MB.', true); return; }

        let jwt = localStorage.getItem(_PINATA_JWT_KEY) || '';
        if (!jwt) {
            jwt = prompt('Paste your Pinata JWT (get one free at pinata.cloud). Stored only in this browser.') || '';
            if (!jwt) { setStatus('Upload cancelled.'); return; }
            try { localStorage.setItem(_PINATA_JWT_KEY, jwt); } catch {}
        }

        btn.disabled = true;
        setStatus('Uploading to IPFS…');
        try {
            const cid = await _pinFileToIPFS(file, jwt, `geocities-avatar-${_currentProfileEnsName || 'unknown'}`);
            urlInput.value = `ipfs://${cid}`;
            urlInput.dispatchEvent(new Event('input', { bubbles: true }));
            setStatus(`Uploaded. Save changes to publish.`);
        } catch (e) {
            console.error('Avatar upload failed:', e);
            const msg = String(e?.message || e);
            if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
                try { localStorage.removeItem(_PINATA_JWT_KEY); } catch {}
                setStatus('Pinata auth failed. Click Upload again to re-enter your JWT.', true);
            } else {
                setStatus(msg, true);
            }
        } finally {
            btn.disabled = false;
            fileInput.value = '';
        }
    });
}

// Function to update the navigation bar based on the current view
function updateNavBar(name, isRegistered) {
    const navBar = document.querySelector('.nav-bar');
    const themeToggle = document.getElementById('theme-toggle'); // Assuming theme toggle is always present
    let navButtons = navBar.querySelector('.nav-buttons');

    // Ensure navButtons container exists and is correctly placed
    if (!navButtons) {
        navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';
        const navLogo = navBar.querySelector('.nav-logo');
        if (navLogo && navLogo.nextSibling) {
            navBar.insertBefore(navButtons, navLogo.nextSibling);
        } else {
            navBar.appendChild(navButtons);
        }
    }

    // Ensure theme toggle is the first child of navButtons, if themeToggle exists
    if (themeToggle && navButtons.firstChild !== themeToggle) {
        navButtons.prepend(themeToggle);
    }

    // Remove existing dynamic dropdown containers to prevent duplication
    const existingSettingsBtnContainer = document.getElementById('settings-dropdown-btn-container');
    if (existingSettingsBtnContainer) {
        existingSettingsBtnContainer.remove();
    }
    const existingCoinBtnContainer = document.getElementById('coin-dropdown-btn-container');
    if (existingCoinBtnContainer) {
        existingCoinBtnContainer.remove();
    }

    if (name !== 'home' && isRegistered === true) {
        console.log('Updating NavBar for registered profile:', name);

        const isBasename = name.endsWith('.base.eth');
        const profileTypeLabel = isBasename ? 'Basename' : 'ENS';
        const editRecordsLink = isBasename
            ? `https://www.base.org/name/${name.replace('.base.eth', '')}`
            : `https://app.ens.domains/${name}`;
        const connectLink = isBasename
            ? 'https://basescan.org/address/0xc6d566a56a1aff6508b41f6c90ff131615583bcd#writeContract#F13'
            : `https://app.ens.domains/${name}`;

        // Create and append Settings Dropdown
        const settingsContainerDiv = document.createElement('div');
        settingsContainerDiv.id = 'settings-dropdown-btn-container';
        settingsContainerDiv.className = 'dropdown';
        settingsContainerDiv.innerHTML = `
            <button id="settings-dropdown-btn" class="dropdown-btn">Build</button>
            <div id="settings-dropdown-content" class="dropdown-content">
                <div class="dropdown-section">
                    <h4><span class="step-num">1</span> Design</h4>
                    <div class="dropdown-controls-col">
                        <label class="control-button bg-control">
                            <input type="color" id="nav-bg-color" class="color-picker" title="Background">
                            <span class="button-text">Background</span>
                        </label>
                        <label class="control-button text-control">
                            <input type="color" id="nav-text-color" class="color-picker" title="Text">
                            <span class="button-text">Text</span>
                        </label>
                        <label class="control-button border-control">
                            <input type="color" id="nav-border-color" class="color-picker" title="Border">
                            <span class="button-text">Border</span>
                        </label>
                        <div class="control-button effect-control">
                            <select id="nav-effect-select" class="effect-select">
                                <option value="none">Effect</option>
                                <option value="glow">Glow</option>
                                <option value="snow">Snow</option>
                                <option value="stars">Stars</option>
                                <option value="rainbow">Rainbow</option>
                                <option value="matrix">Matrix</option>
                                <option value="neon">Neon</option>
                                <option value="vaporware">Vaporware</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="dropdown-section">
                    <h4><span class="step-num">2</span> Publish</h4>
                    <div class="dropdown-buttons">
                        <a href="#" class="dropdown-button download-website-button" id="nav-download-website">Download</a>
                        <a href="#" class="dropdown-button deploy-website-button" id="nav-deploy-ipfs">Deploy to IPFS</a>
                        <a href="${connectLink}" target="_blank" rel="noopener noreferrer" class="dropdown-button connect-website-button" id="nav-connect-website">Connect to ENS</a>
                    </div>
                </div>
            </div>
        `;
        navButtons.appendChild(settingsContainerDiv);
        setupDropdown('settings-dropdown-btn', 'settings-dropdown-content');

        // Create Connect Wallet button — click opens modal when disconnected, dropdown when connected
        const connectContainerDiv = document.createElement('div');
        connectContainerDiv.id = 'wallet-connect-container';
        connectContainerDiv.className = 'dropdown';
        connectContainerDiv.innerHTML = `
            <button id="wallet-connect-btn" class="dropdown-btn">Connect</button>
            <div id="wallet-connect-content" class="dropdown-content" style="display:none;">
                <div id="wallet-connected-address" style="padding:10px 14px; font-size:0.75em; opacity:0.65; word-break:break-all;"></div>
                <button id="wallet-disconnect-btn" class="dropdown-button">Disconnect</button>
            </div>
        `;
        navButtons.appendChild(connectContainerDiv);
        initWalletConnect();
    }
}

function displayUnregisteredProfile(ensName) {
    const profilePage = document.getElementById('profile-page');
    const container = document.querySelector('.container');
    const profileRecords = document.querySelector('.profile-records');
    const numberRecords = document.querySelector('.profile-number-records');
    const headerImage = document.querySelector('.profile-header-image');
    const controlButtons = document.querySelectorAll('.control-button');
    
    // Scroll to top of the page for better UX
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Hide homepage content and show profile page
    if (container) container.style.display = 'none';
    if (profilePage) profilePage.style.display = 'flex';
    
    // Clear existing records
    if (profileRecords) profileRecords.innerHTML = '';
    
    // Hide number records container for unregistered profiles
    if (numberRecords) {
        numberRecords.innerHTML = '';
        numberRecords.style.display = 'none';
    }

    // Hide profile card and action bar for unregistered profiles
    const profileCardUnreg = document.querySelector('.profile-card');
    if (profileCardUnreg) { profileCardUnreg.style.display = 'none'; profileCardUnreg.innerHTML = ''; }
    const profileActionsUnreg = document.querySelector('.profile-actions');
    if (profileActionsUnreg) { profileActionsUnreg.style.display = 'none'; profileActionsUnreg.innerHTML = ''; }

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
    
    // Add register button
    const registerButton = document.createElement('button');
    registerButton.className = 'register-button dropdown-button';

    registerContainer.innerHTML = '';

    if (isBasename) {
        const basenameWithoutSuffix = ensName.replace('.base.eth', '');
        registerButton.textContent = 'Register Basename';
        registerButton.onclick = () => window.open(`https://www.base.org/names?claim=${basenameWithoutSuffix}`, '_blank', 'noopener,noreferrer');
        registerContainer.appendChild(registerButton);
    } else {
        const label = ensName.replace(/\.eth$/, '');
        const availabilityEl = document.createElement('div');
        availabilityEl.className = 'register-availability-inline';
        availabilityEl.textContent = 'Checking availability…';
        registerContainer.appendChild(availabilityEl);

        registerButton.textContent = 'Register ENS';
        registerButton.disabled = true;
        registerButton.onclick = () => openRegisterModal(ensName);
        registerContainer.appendChild(registerButton);

        (async () => {
            try {
                if (label.length < 3) {
                    availabilityEl.textContent = 'Names must be at least 3 characters.';
                    availabilityEl.classList.add('unavailable');
                    return;
                }
                const provider = _getReadProvider();
                const registrar = new ethers.Contract(ENS_REGISTRAR, _REGISTRAR_ABI, provider);
                const available = await registrar.available(label);
                if (!available) {
                    availabilityEl.textContent = `${ensName} is already registered.`;
                    availabilityEl.classList.add('unavailable');
                    return;
                }
                const YEAR_SECS = 365 * 24 * 3600;
                const price = await registrar.rentPrice(label, YEAR_SECS);
                const totalWei = price.base.add(price.premium);
                const totalEth = parseFloat(ethers.utils.formatEther(totalWei)).toFixed(4);
                availabilityEl.innerHTML = `<span class="avail-dot">✓</span> <strong>${ensName}</strong> is available · ~${totalEth} ETH / year`;
                availabilityEl.classList.add('available');
                registerButton.disabled = false;
            } catch (e) {
                console.error('Availability check failed:', e);
                availabilityEl.textContent = 'Could not check availability. Try registering below.';
                registerButton.disabled = false;
            }
        })();
    }
    
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

// Function to add a number record to the number records container
function addNumberRecord(label, value) {
    const numberRecords = document.querySelector('.profile-number-records');
    if (!numberRecords) return;
    
    // Make sure the container is visible
    numberRecords.style.display = 'block';
    
    const record = document.createElement('div');
    record.className = 'number-record';
    
    const labelElement = document.createElement('div');
    labelElement.className = 'number-record-label';
    labelElement.textContent = label;
    
    const valueElement = document.createElement('div');
    valueElement.className = 'number-record-value';
    
    // Check if the value is an image URL
    const isImageUrl = typeof value === 'string' && (
        value.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ||
        value.startsWith('https://i.imgur.com/') ||
        value.startsWith('https://ipfs.io/') ||
        value.includes('cloudfront.net') ||
        value.includes('nftstorage.link')
    );
    
    if (isImageUrl) {
        // Create an image element
        const img = document.createElement('img');
        img.src = value;
        img.alt = `Record ${label}`;
        img.className = 'number-record-image';
        img.loading = 'lazy'; // Use lazy loading for performance
        
        // Add error handling to fall back to text if image fails to load
        img.onerror = () => {
            valueElement.textContent = value;
        };
        
        valueElement.appendChild(img);
    } else if (typeof value === 'string' && value.startsWith('http')) {
        // It's a link but not an image
        const link = document.createElement('a');
        link.href = value;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = value;
        valueElement.appendChild(link);
    } else {
        // Regular text value
        valueElement.textContent = value;
    }
    
    record.appendChild(labelElement);
    record.appendChild(valueElement);
    numberRecords.appendChild(record);
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

// Function to initialize and populate the ENS grid
async function initializeENSGrid() {
    const ensGrid = document.getElementById('ens-grid');
    if (!ensGrid) return;

    // Remove any previously registered resize handler to avoid accumulation
    if (gridResizeHandler) {
        window.removeEventListener('resize', gridResizeHandler);
        gridResizeHandler = null;
    }

    // Disconnect any existing IntersectionObserver before clearing the grid
    if (gridObserver) {
        gridObserver.disconnect();
        gridObserver = null;
    }

    // Clear any existing content
    ensGrid.innerHTML = '';
    
    // Ensure CSS is loaded before calculating grid layout
    function ensureCssLoaded() {
        return new Promise(resolve => {
            // Check if stylesheets are loaded
            const allStylesheetsLoaded = Array.from(document.styleSheets).some(sheet => {
                try {
                    // Look for our grid styles
                    return sheet.href && (
                        sheet.href.includes('ens-grid.css') || 
                        sheet.href.includes('style.css')
                    );
                } catch (e) {
                    // CORS issues might prevent accessing some stylesheets
                    return false;
                }
            });
            
            if (allStylesheetsLoaded) {
                // Give a small delay to ensure styles are applied
                setTimeout(resolve, 50);
            } else {
                // If not loaded yet, check again shortly
                setTimeout(() => ensureCssLoaded().then(resolve), 50);
            }
        });
    }
    
    try {
        // Wait for CSS to be loaded
        await ensureCssLoaded();
        
        // Determine how many columns we have based on the current CSS
        const columnsPerRow = getColumnsPerRow();
        
        // Display 10 rows, with the number of columns determined by the responsive layout
        const ROWS = 10;
        const profilesNeeded = columnsPerRow * ROWS;
        
        // Create an ordered list of ENS names:
        // 1. Start with the fixed priority names in their fixed order
        // 2. Add shuffled randomizable priority names
        // 3. Add shuffled non-priority names
        // 4. Limit to the number needed for the grid
        
        // First, include the fixed priority names
        const orderedNames = [...FIXED_PRIORITY_ENS_NAMES];
        
        // Then shuffle and add the randomizable priority names
        const shuffledPriorityNames = [...RANDOMIZABLE_PRIORITY_ENS_NAMES].sort(() => Math.random() - 0.5);
        orderedNames.push(...shuffledPriorityNames);
        
        // Then shuffle and add the remaining names
        const shuffledOtherNames = [...OTHER_ENS_NAMES].sort(() => Math.random() - 0.5);
        
        // Combine with the shuffled other names
        orderedNames.push(...shuffledOtherNames);
        
        // Limit to the number of profiles needed for the grid
        const limitedNames = orderedNames.slice(0, profilesNeeded);
        
        // Create and append ENS profile elements
        const profileElements = [];
        
        // First create all profile elements with default avatars
        for (const ensName of limitedNames) {
            const profileElement = createENSProfileElement(ensName);
            ensGrid.appendChild(profileElement);
            profileElements.push(profileElement);
        }
        
        // Set up lazy loading for the avatar images
        setupLazyLoading();
        
        // Add window resize listener to update the grid when screen size changes
        gridResizeHandler = debounce(() => {
            const newColumnsPerRow = getColumnsPerRow();
            if (newColumnsPerRow !== columnsPerRow) {
                initializeENSGrid();
            }
        }, 250);
        window.addEventListener('resize', gridResizeHandler);
        
        console.log('ENS Grid initialized successfully');
    } catch (error) {
        console.error('Error initializing ENS grid:', error);
    }
}

// Function to create an ENS profile element
function createENSProfileElement(ensName) {
    // Create container
    const profileElement = document.createElement('div');
    profileElement.className = 'ens-profile';
    profileElement.setAttribute('data-ens', ensName);
    
    // Create avatar container
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'ens-avatar';
    
    // Create avatar image (initially with default avatar)
    const avatarImg = document.createElement('img');
    avatarImg.src = DEFAULT_AVATAR;
    avatarImg.alt = `${ensName} avatar`;
    avatarImg.loading = 'lazy'; // Add lazy loading attribute
    avatarImg.dataset.ensName = ensName; // Store ENS name for lazy loading
    avatarContainer.appendChild(avatarImg);
    
    // Create name element
    const nameElement = document.createElement('div');
    nameElement.className = 'ens-name';
    nameElement.textContent = ensName;
    
    // Add click event to search for this ENS name
    profileElement.addEventListener('click', () => {
        // Get all search inputs
        const searchInputs = document.querySelectorAll('.search-input');
        if (searchInputs.length > 0) {
            // Set the first search input's value to this ENS name
            searchInputs[0].value = ensName;
            // Trigger search
            const searchButton = searchInputs[0].nextElementSibling;
            if (searchButton && searchButton.classList.contains('search-button')) {
                searchButton.click();
            }
        }
    });
    
    // Append elements to profile container
    profileElement.appendChild(avatarContainer);
    profileElement.appendChild(nameElement);
    
    // We'll use intersection observer instead of fetching immediately
    // This will be handled by setupLazyLoading()
    
    return profileElement;
}

// Process avatars in batches to avoid overwhelming the API
async function loadAvatarsInBatches(avatarQueue) {
    // We don't need this function anymore with our new lazy loading approach
    // The Intersection Observer will handle loading avatars as they come into view
    return;
}

// Preload a small set of avatars for the initially visible profiles
async function preloadVisibleAvatars() {
    // Only preload the first few avatars that are likely to be visible initially
    const PRELOAD_COUNT = 5; // Just preload the first few avatars that are immediately visible
    
    // Find visible avatar images
    const avatarImages = document.querySelectorAll('.ens-avatar img[data-ens-name]');
    const visibleAvatars = Array.from(avatarImages).slice(0, PRELOAD_COUNT);
    
    // Preload these avatars immediately
    for (const img of visibleAvatars) {
        const ensName = img.dataset.ensName;
        if (ensName) {
            // Fetch immediately but don't wait for completion
            fetchENSAvatar(ensName, img).catch(err => {
                // Silently handle errors for preloading
                console.warn(`Error preloading avatar for ${ensName}:`, err);
            });
        }
    }
}

// Avatar cache to prevent redundant API calls
const avatarCache = new Map();

// Function to fetch an ENS avatar
async function fetchENSAvatar(ensName, imgElement) {
    try {
        // Create a default avatar with the first letter as a fallback
        const firstLetter = ensName.charAt(0);
        const defaultAvatar = createDefaultAvatar(firstLetter);
        
        // Set default avatar first to ensure something is displayed
        imgElement.src = defaultAvatar;
        imgElement.dataset.originalLetter = firstLetter; // Store for theme changes
        imgElement.dataset.isDefaultAvatar = 'true';
        
        // Check if we already have this avatar in cache
        if (avatarCache.has(ensName)) {
            const cachedData = avatarCache.get(ensName);
            if (cachedData === 'default') {
                // We already know this ENS has no avatar, keep using default
                return;
            } else {
                // Use cached avatar URL
                imgElement.src = cachedData;
                imgElement.dataset.isDefaultAvatar = 'false';
                return;
            }
        }
        
        // Determine the correct API endpoint based on the ENS name
        let url = `${API_BASE_URL}/profile/ens/${ensName}`;
        if (ensName.endsWith('.base.eth')) {
            url = `${API_BASE_URL}/profile/basenames/${ensName}`;
        }
        
        // Fetch the profile data with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 second timeout
        
        const response = await fetch(url, { 
            signal: controller.signal,
            cache: 'force-cache' // Use browser cache aggressively
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            if (data.avatar) {
                // Store in cache
                avatarCache.set(ensName, data.avatar);
                
                // Create a new image to test if the avatar URL is valid
                const testImg = new Image();
                testImg.onload = () => {
                    // If the image loads successfully, update the displayed avatar
                    imgElement.src = data.avatar;
                    imgElement.dataset.isDefaultAvatar = 'false';
                };
                testImg.onerror = () => {
                    // If the image fails to load, keep using the default avatar
                    console.warn(`Avatar image failed to load for ${ensName}, using default`);
                    // Cache the fact that this ENS uses default avatar
                    avatarCache.set(ensName, 'default');
                    // Keep the default avatar that was already set
                };
                testImg.src = data.avatar;
            } else {
                // No avatar in the data, cache this fact
                avatarCache.set(ensName, 'default');
            }
        } else {
            // API response not OK, cache this fact
            avatarCache.set(ensName, 'default');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`Timeout fetching avatar for ${ensName}`);
        } else {
            console.error(`Error fetching avatar for ${ensName}:`, error);
        }
        // Cache the error so we don't try again
        avatarCache.set(ensName, 'default');
    }
}

// Set up lazy loading for avatar images using Intersection Observer
function setupLazyLoading() {
    // Preload the first few visible avatars immediately
    preloadVisibleAvatars();
    
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
        // Fallback for browsers that don't support Intersection Observer
        // Load remaining avatars with a slight delay to prioritize visible content
        setTimeout(() => {
            const avatarImages = document.querySelectorAll('.ens-avatar img[data-ens-name]');
            let delay = 0;
            const DELAY_INCREMENT = 100; // 100ms between each avatar load
            
            avatarImages.forEach((img, index) => {
                // Skip the first few that were preloaded
                if (index < 5) return;
                
                const ensName = img.dataset.ensName;
                if (ensName) {
                    setTimeout(() => {
                        fetchENSAvatar(ensName, img);
                    }, delay);
                    delay += DELAY_INCREMENT;
                }
            });
        }, 1000); // Wait 1 second after page load before loading non-visible avatars
        return;
    }
    
    // Create a new Intersection Observer with higher priority for visible elements
    gridObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const ensName = img.dataset.ensName;
                if (ensName) {
                    fetchENSAvatar(ensName, img);
                    obs.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '200px',
        threshold: 0.01
    });

    // Find all avatar images and observe them (except the preloaded ones)
    const avatarImages = document.querySelectorAll('.ens-avatar img[data-ens-name]');
    avatarImages.forEach((img, index) => {
        if (index >= 5) {
            gridObserver.observe(img);
        }
    });
}

// Helper function to determine how many columns are in the ENS grid based on current CSS and viewport width
function getColumnsPerRow() {
    const ensGrid = document.getElementById('ens-grid');
    if (!ensGrid) return 5; // Default to 5 if grid not found
    
    // First try to get the computed style
    try {
        const gridStyle = window.getComputedStyle(ensGrid);
        const gridTemplateColumns = gridStyle.getPropertyValue('grid-template-columns');
        
        // If we have a valid grid-template-columns value
        if (gridTemplateColumns && gridTemplateColumns !== 'none' && gridTemplateColumns !== '') {
            // Count how many columns are defined
            if (gridTemplateColumns.includes('repeat')) {
                // Extract the number from repeat(X, ...)
                const match = gridTemplateColumns.match(/repeat\((\d+)/i);
                if (match && match[1]) {
                    return parseInt(match[1], 10);
                }
            } else {
                // Count the number of 'fr' or other column units
                const count = gridTemplateColumns.split(' ').length;
                if (count > 0) return count;
            }
        }
    } catch (e) {
        console.log('Error getting computed style:', e);
        // Continue to fallback method
    }
    
    // Fallback: determine columns based on viewport width
    // This matches the media queries in ens-grid.css
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    if (viewportWidth <= 380) return 2;
    if (viewportWidth <= 480) return 3;
    if (viewportWidth <= 900) return 4;
    return 5; // Default for larger screens
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to setup dropdown functionality
function setupDropdown(btnId, contentId) {
    const dropdownBtn = document.getElementById(btnId);
    const content = document.getElementById(contentId);

    if (!dropdownBtn || !content) {
        // console.warn(`Dropdown elements not found for: ${btnId}, ${contentId}`); // Useful for debugging
        return;
    }

    // Specific logic for settings dropdown
    if (btnId === 'settings-dropdown-btn') {
        function reorderDropdownSections() {
            const sections = content.querySelectorAll('.dropdown-section');
            if (sections.length >= 4) {
                let efpSection = null;
                let ensSection = null;
                sections.forEach(section => {
                    const heading = section.querySelector('h4');
                    if (heading) {
                        if (heading.textContent.trim() === 'EFP') efpSection = section;
                        else if (heading.textContent.trim().startsWith('ENS') || heading.textContent.trim().startsWith('Basename')) ensSection = section;
                    }
                });
                if (efpSection && content.firstChild !== efpSection) content.insertBefore(efpSection, content.firstChild);
                if (ensSection && content.lastChild !== ensSection) content.appendChild(ensSection);
            }
        }
        reorderDropdownSections();

        const navBgColor = content.querySelector('#nav-bg-color');
        const navTextColor = content.querySelector('#nav-text-color');
        const navBorderColor = content.querySelector('#nav-border-color');
        const navEffectSelect = content.querySelector('#nav-effect-select');
        const navDownloadWebsite = content.querySelector('#nav-download-website');

        function syncColorPickers() {
            const mainBgColor = document.getElementById('bg-color');
            const mainTextColor = document.getElementById('text-color');
            const mainBorderColor = document.getElementById('border-color');
            const mainEffectSelect = document.getElementById('effect-select');
            if (mainBgColor && navBgColor) navBgColor.value = mainBgColor.value;
            if (mainTextColor && navTextColor) navTextColor.value = mainTextColor.value;
            if (mainBorderColor && navBorderColor) navBorderColor.value = mainBorderColor.value;
            if (mainEffectSelect && navEffectSelect) navEffectSelect.value = mainEffectSelect.value;
        }

        if (navBgColor) navBgColor.addEventListener('input', (e) => {
            const mainBgColor = document.getElementById('bg-color');
            if(mainBgColor) {mainBgColor.value = e.target.value; applyCustomStyles({ target: mainBgColor });}
        });
        if (navTextColor) navTextColor.addEventListener('input', (e) => {
            const mainTextColor = document.getElementById('text-color');
            if(mainTextColor) {mainTextColor.value = e.target.value; applyCustomStyles({ target: mainTextColor });}
        });
        if (navBorderColor) navBorderColor.addEventListener('input', (e) => {
            const mainBorderColor = document.getElementById('border-color');
            if(mainBorderColor) {mainBorderColor.value = e.target.value; applyCustomStyles({ target: mainBorderColor });}
        });
        if (navEffectSelect) navEffectSelect.addEventListener('change', () => {
            const mainEffectSelect = document.getElementById('effect-select');
            if(mainEffectSelect) {mainEffectSelect.value = navEffectSelect.value; handleEffectChange();}
        });

        if (navDownloadWebsite) navDownloadWebsite.addEventListener('click', (e) => { e.preventDefault(); generateDownload(); });

        const navDeployIPFS = content.querySelector('#nav-deploy-ipfs');
        if (navDeployIPFS) navDeployIPFS.addEventListener('click', (e) => { e.preventDefault(); openIPFSModal(); });

        const profilePage = document.getElementById('profile-page');
        if (profilePage) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style' && profilePage.style.display === 'flex') {
                        syncColorPickers();
                    }
                });
            });
            observer.observe(profilePage, { attributes: true });
        }
    }
    
    // Generic toggle logic for any dropdown button
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyShown = content.classList.contains('show');
        document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
            if (openDropdown.id !== contentId) {
                openDropdown.classList.remove('show');
            }
        });
        if (!isCurrentlyShown) {
            content.classList.add('show');
        } else {
            content.classList.remove('show');
        }

        // Specific logic for coin dropdown when it's shown
        if (btnId === 'coin-dropdown-btn' && content.classList.contains('show')) {
            const address = content.dataset.address;
            const ensNameForExplorer = content.dataset.ensName; // Renamed for clarity
            const walletAddressDiv = document.getElementById('coin-wallet-address');
            const qrCodeContainer = document.getElementById('coin-qr-code-container');
            const explorerBtn = document.getElementById('coin-explorer-link-btn');

            if (address && walletAddressDiv && qrCodeContainer && explorerBtn) {
                walletAddressDiv.textContent = address;

                if (ensNameForExplorer) {
                    explorerBtn.style.display = 'flex'; /* Changed from 'block' to 'flex' for consistency */
                    if (ensNameForExplorer.endsWith('.base.eth')) {
                        explorerBtn.textContent = 'Basescan';
                        explorerBtn.href = `https://basescan.org/name-lookup-search?id=${ensNameForExplorer}`;
                    } else {
                        explorerBtn.textContent = 'Etherscan';
                        explorerBtn.href = `https://etherscan.io/name-lookup-search?id=${ensNameForExplorer}`;
                    }
                } else {
                    explorerBtn.style.display = 'none';
                }

                if (qrCodeContainer && typeof QRCode !== 'undefined') { // Check for QRCode constructor
                    qrCodeContainer.innerHTML = ''; // Clear previous QR code before generating a new one
                    try {
                        new QRCode(qrCodeContainer, {
                            text: address,
                            width: 150,
                            height: 150,
                            correctLevel: QRCode.CorrectLevel.M
                        });
                        qrCodeContainer.style.display = 'block'; // Show the container
                    } catch (qrError) {
                        console.warn('QR code generation failed:', qrError);
                        qrCodeContainer.style.display = 'none'; // Hide if error
                        // Optionally, add a user-visible error message in the container
                        // qrCodeContainer.textContent = 'Error generating QR.';
                    }
                } else {
                    if (!qrCodeContainer) console.warn('QR code container not found.');
                    if (typeof QRCode === 'undefined') console.warn('QRCode library not loaded or QRCode constructor not found.');
                    // Ensure container is hidden if it exists but library doesn't
                    if(qrCodeContainer) qrCodeContainer.style.display = 'none';
                }
            } else {
                if(walletAddressDiv) walletAddressDiv.textContent = 'Address not found.';
                if(explorerBtn) explorerBtn.style.display = 'none';
                if(qrCodeContainer) {
                    qrCodeContainer.style.display = 'none';
                    // qrCodeContainer.textContent = 'No address';
                }
            }
        }
    });
}

// Close dropdowns when clicking outside (global listener)
document.addEventListener('click', (e) => {
    const openDropdowns = document.querySelectorAll('.dropdown-content.show');
    openDropdowns.forEach(dropdownContent => {
        const btnId = dropdownContent.id.replace('-content', '-btn');
        const dropdownBtn = document.getElementById(btnId);
        if (dropdownBtn && !dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.classList.remove('show');
        }
    });
    // Close wallet connected dropdown if clicking outside
    const walletContent = document.getElementById('wallet-connect-content');
    const walletBtn = document.getElementById('wallet-connect-btn');
    if (walletContent && walletContent.classList.contains('show') &&
        walletBtn && !walletBtn.contains(e.target) && !walletContent.contains(e.target)) {
        walletContent.classList.remove('show');
    }
});

// Function to handle cycling words in the slogan
function initializeCyclingWords() {
    const cyclingWordElement = document.getElementById('cycling-word');
    if (!cyclingWordElement) return;
    
    const words = ['everything', 'wallet', 'crypto', 'name', 'identity', 'domain', 'website', 'links', 'social graph', 'data', 'home'];
    let currentIndex = 0;
    
    function cycleWords() {
        // Fade out
        cyclingWordElement.style.opacity = '0';
        
        setTimeout(() => {
            // Change word
            currentIndex = (currentIndex + 1) % words.length;
            cyclingWordElement.textContent = words[currentIndex];
            
            // Fade in
            cyclingWordElement.style.opacity = '1';
            
            // If we're on the last word (home), double the display time
            if (words[currentIndex] === 'home') {
                clearInterval(cycleInterval);
                setTimeout(() => {
                    // Resume normal cycling after double time
                    cycleInterval = setInterval(cycleWords, 1785);
                }, 1785);
            }
        }, 500); // Wait for fade out to complete
    }
    
    // Store interval ID so we can clear it when needed
    let cycleInterval;
    
    // Set initial word
    cyclingWordElement.textContent = words[0];
    cyclingWordElement.style.opacity = '1';
    
    // Start cycling
    cycleInterval = setInterval(cycleWords, 1785); // Change word every 1.785 seconds (15% faster than 2.1 seconds)
}

// ─── ethers.js helpers ───────────────────────────────────────────────────────

function _getProvider() {
    const eip1193 = _getWalletProvider();
    if (!eip1193) throw new Error('No wallet connected');
    return new ethers.providers.Web3Provider(eip1193);
}

function _getReadProvider() {
    return new ethers.providers.JsonRpcProvider('https://cloudflare-eth.com');
}

async function _getSigner() {
    const provider = _getProvider();
    await provider.send('eth_requestAccounts', []);
    return provider.getSigner();
}

async function resolveRecipient(input) {
    input = input.trim();
    if (ethers.utils.isAddress(input)) return input;
    const provider = _getReadProvider();
    const resolved = await provider.resolveName(input);
    if (!resolved) throw new Error(`Could not resolve "${input}"`);
    return resolved;
}

// ─── Send crypto ─────────────────────────────────────────────────────────────

async function sendToken(toInput, amount, tokenSymbol) {
    if (!_connectedWallet) throw new Error('No wallet connected');
    const signer = await _getSigner();
    const to = await resolveRecipient(toInput);
    const token = TOKENS[tokenSymbol];
    if (!token) throw new Error(`Unknown token: ${tokenSymbol}`);

    if (!token.address) {
        // Native ETH transfer
        const value = ethers.utils.parseEther(amount);
        const tx = await signer.sendTransaction({ to, value });
        await tx.wait();
        return tx.hash;
    } else {
        // ERC-20 transfer
        const erc20 = new ethers.Contract(token.address, [
            'function transfer(address,uint256) returns (bool)',
            'function decimals() view returns (uint8)'
        ], signer);
        const decimals = token.decimals;
        const value = ethers.utils.parseUnits(amount, decimals);
        const tx = await erc20.transfer(to, value);
        await tx.wait();
        return tx.hash;
    }
}

// ─── Swap (ParaSwap v5) ───────────────────────────────────────────────────────

function _paraswapAddr(sym) {
    return sym === 'ETH' ? PARASWAP_ETH : (TOKENS[sym]?.address || null);
}

async function getSwapQuote(fromSym, toSym, amount) {
    if (!_connectedWallet) throw new Error('No wallet connected');
    await _ensureChain('0x1');
    const provider = _getProvider();
    const accounts = await provider.listAccounts();
    if (!accounts.length) throw new Error('Connect wallet first');
    const userAddr = accounts[0];

    const srcToken = _paraswapAddr(fromSym);
    const destToken = _paraswapAddr(toSym);
    const srcDecimals = TOKENS[fromSym]?.decimals || 18;
    const destDecimals = TOKENS[toSym]?.decimals || 18;
    const srcAmount = ethers.utils.parseUnits(amount, srcDecimals).toString();

    const partnerParams = PARASWAP_PARTNER_ADDRESS
        ? `&partner=${PARASWAP_PARTNER}&partnerAddress=${PARASWAP_PARTNER_ADDRESS}&partnerFeeBps=${PARASWAP_PARTNER_FEE_BPS}&takeSurplus=true`
        : `&partner=${PARASWAP_PARTNER}`;
    const url = `https://apiv5.paraswap.io/prices/?srcToken=${srcToken}&destToken=${destToken}&amount=${srcAmount}&srcDecimals=${srcDecimals}&destDecimals=${destDecimals}&side=SELL&network=1&userAddress=${userAddr}${partnerParams}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`ParaSwap error: ${resp.status}`);
    const data = await resp.json();
    if (!data.priceRoute) throw new Error(data.error || 'No route found');

    const destAmt = ethers.utils.formatUnits(data.priceRoute.destAmount, destDecimals);
    return { priceRoute: data.priceRoute, estimate: `~${parseFloat(destAmt).toFixed(6)} ${toSym}`, srcAmount, srcToken, destToken, srcDecimals, destDecimals, userAddr, fromSym, toSym };
}

async function executeSwap(quote) {
    if (!_connectedWallet) throw new Error('No wallet connected');
    await _ensureChain('0x1');
    const signer = await _getSigner();
    const userAddr = quote.userAddr;

    const txBody = {
        srcToken: quote.srcToken, destToken: quote.destToken,
        srcAmount: quote.srcAmount, destAmount: quote.priceRoute.destAmount,
        priceRoute: quote.priceRoute, userAddress: userAddr,
        slippage: 100, srcDecimals: quote.srcDecimals, destDecimals: quote.destDecimals,
        partner: PARASWAP_PARTNER
    };
    if (PARASWAP_PARTNER_ADDRESS) {
        txBody.partnerAddress = PARASWAP_PARTNER_ADDRESS;
        txBody.partnerFeeBps = PARASWAP_PARTNER_FEE_BPS;
        txBody.takeSurplus = true;
    }
    const txResp = await fetch(`https://apiv5.paraswap.io/transactions/1?ignoreChecks=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txBody)
    });
    if (!txResp.ok) throw new Error(`ParaSwap tx error: ${txResp.status}`);
    const txData = await txResp.json();

    // Approve ERC-20 if needed
    if (quote.fromSym !== 'ETH') {
        const tokenAddr = TOKENS[quote.fromSym].address;
        const erc20 = new ethers.Contract(tokenAddr, ['function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'], signer);
        const allowance = await erc20.allowance(userAddr, txData.to);
        if (allowance.lt(ethers.BigNumber.from(quote.srcAmount))) {
            const approveTx = await erc20.approve(txData.to, ethers.constants.MaxUint256);
            await approveTx.wait();
        }
    }

    const tx = await signer.sendTransaction({ to: txData.to, data: txData.data, value: ethers.BigNumber.from(txData.value || '0'), gasLimit: txData.gas ? ethers.BigNumber.from(txData.gas) : undefined });
    await tx.wait();
    return tx.hash;
}

// ─── ENS Registration ─────────────────────────────────────────────────────────

const _REGISTRAR_ABI = [
    'function available(string) view returns (bool)',
    'function rentPrice(string,uint256) view returns (tuple(uint256 base,uint256 premium))',
    'function makeCommitment(string,address,uint256,bytes32,address,bytes[],bool,uint16) pure returns (bytes32)',
    'function commit(bytes32)',
    'function register(string,address,uint256,bytes32,address,bytes[],bool,uint16) payable'
];

async function openRegisterModal(ensName) {
    const modal = document.getElementById('register-modal');
    const body = document.getElementById('register-modal-body');
    const title = document.getElementById('register-modal-title');
    const submitBtn = document.getElementById('register-submit-btn');
    if (!modal || !body) return;

    const label = ensName.replace(/\.eth$/, '');
    if (title) title.textContent = `Register ${ensName}`;
    submitBtn.style.display = 'none';
    body.innerHTML = '<div style="text-align:center;padding:20px;opacity:0.6;">Checking availability…</div>';
    modal.style.display = 'flex';

    try {
        const provider = _getReadProvider();
        const registrar = new ethers.Contract(ENS_REGISTRAR, _REGISTRAR_ABI, provider);
        const available = await registrar.available(label);

        if (!available) {
            body.innerHTML = '<div class="register-availability" style="color:#e44;">Name is already registered.</div>';
            return;
        }

        const YEAR_SECS = 365 * 24 * 3600;
        const price = await registrar.rentPrice(label, YEAR_SECS);
        const totalWei = price.base.add(price.premium);
        const totalEth = parseFloat(ethers.utils.formatEther(totalWei)).toFixed(6);

        body.innerHTML = `
            <div class="register-availability" style="color:#4a4;">✓ Available</div>
            <div class="register-price">~${totalEth} ETH / year</div>
            <div class="register-steps">
                <div class="register-step" id="reg-step1"><span class="step-dot" id="reg-dot1"></span>Step 1: Commit</div>
                <div class="register-step dim" id="reg-step2"><span class="step-dot" id="reg-dot2"></span>Step 2: Wait 60s</div>
                <div class="register-step dim" id="reg-step3"><span class="step-dot" id="reg-dot3"></span>Step 3: Register</div>
            </div>
            <div id="reg-status" class="crypto-status" style="margin-top:10px;"></div>
        `;
        submitBtn.style.display = 'block';
        submitBtn.textContent = 'Register';
        submitBtn.onclick = () => _executeRegistration(label, ensName, totalWei);
    } catch (e) {
        console.error('Register availability check failed:', e);
        body.innerHTML = `<div class="register-availability">${_formatTxError(e)}</div>`;
    }

    document.getElementById('register-modal-close').onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

async function _executeRegistration(label, ensName, priceWei) {
    if (!_connectedWallet) { openWalletModal(); return; }
    const submitBtn = document.getElementById('register-submit-btn');
    const status = document.getElementById('reg-status');
    const setStatus = (msg) => { if (status) status.textContent = msg; };

    submitBtn.disabled = true;
    const toast = _txToast.add({ title: `Register ${ensName}`, sub: 'Confirm commit\u2026' });
    try {
        await _ensureChain('0x1');
        const signer = await _getSigner();
        const userAddr = await signer.getAddress();
        const registrar = new ethers.Contract(ENS_REGISTRAR, _REGISTRAR_ABI, signer);

        const YEAR_SECS = 365 * 24 * 3600;
        const secret = ethers.utils.randomBytes(32);
        const commitment = await registrar.makeCommitment(label, userAddr, YEAR_SECS, secret, ENS_PUBLIC_RESOLVER, [], false, 0);

        setStatus('Sending commit transaction…');
        document.getElementById('reg-dot1').classList.add('done');
        const commitTx = await registrar.commit(commitment);
        toast.update({ sub: 'Commit sent — waiting for confirmation', txHash: commitTx.hash });
        await commitTx.wait();

        document.getElementById('reg-step2').classList.remove('dim');
        setStatus('Waiting 60 seconds before registration…');
        toast.update({ sub: 'Commit confirmed — waiting 60s (anti-frontrun delay)' });
        await new Promise(r => setTimeout(r, 62000));

        document.getElementById('reg-dot2').classList.add('done');
        document.getElementById('reg-step3').classList.remove('dim');
        setStatus('Sending register transaction…');
        toast.update({ sub: 'Confirm register in wallet…' });

        // Add 10% buffer on price
        const value = priceWei.mul(110).div(100);
        const registerTx = await registrar.register(label, userAddr, YEAR_SECS, secret, ENS_PUBLIC_RESOLVER, [], false, 0, { value });
        toast.update({ sub: 'Register sent — waiting for confirmation', txHash: registerTx.hash });
        await registerTx.wait();

        document.getElementById('reg-dot3').classList.add('done');
        setStatus(`${ensName} registered! Tx: ${registerTx.hash.slice(0,10)}…`);
        toast.update({ kind: 'success', sub: `${ensName} is yours!`, txHash: registerTx.hash, autoDismissMs: 15000 });
        submitBtn.style.display = 'none';
    } catch (e) {
        console.error('Register failed:', e);
        const friendly = _formatTxError(e);
        setStatus(friendly);
        toast.update({ kind: 'error', sub: friendly, autoDismissMs: 10000 });
        submitBtn.disabled = false;
    }
}

// ─── IPFS Deploy (Pinata) ─────────────────────────────────────────────────────

function _base58Decode(s) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let n = BigInt(0);
    for (const c of s) {
        const idx = ALPHABET.indexOf(c);
        if (idx < 0) throw new Error('Invalid base58 char: ' + c);
        n = n * BigInt(58) + BigInt(idx);
    }
    const bytes = [];
    while (n > 0n) { bytes.unshift(Number(n & 0xffn)); n >>= 8n; }
    for (const c of s) { if (c !== '1') break; bytes.unshift(0); }
    return new Uint8Array(bytes);
}

function _cidToContenthash(cid) {
    const decoded = _base58Decode(cid);
    const prefix = new Uint8Array([0xe3, 0x01, 0x01, 0x70]);
    const result = new Uint8Array(prefix.length + decoded.length);
    result.set(prefix); result.set(decoded, prefix.length);
    return '0x' + Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function openIPFSModal() {
    const modal = document.getElementById('ipfs-modal');
    const body = document.getElementById('ipfs-modal-body');
    const deployBtn = document.getElementById('ipfs-deploy-btn');
    if (!modal || !body) return;

    body.innerHTML = `
        <div class="edit-field" style="margin-bottom:12px;">
            <label>Pinata JWT API Key</label>
            <input type="password" id="pinata-jwt" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" autocomplete="off">
        </div>
        <div style="font-size:0.75em;opacity:0.55;margin-bottom:8px;">Get a free key at <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">pinata.cloud</a></div>
        <div id="ipfs-status" class="crypto-status"></div>
    `;
    modal.style.display = 'flex';

    deployBtn.onclick = () => _runIPFSDeploy();
    document.getElementById('ipfs-modal-close').onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

async function _runIPFSDeploy() {
    const jwt = document.getElementById('pinata-jwt')?.value?.trim();
    const status = document.getElementById('ipfs-status');
    const deployBtn = document.getElementById('ipfs-deploy-btn');
    const setStatus = (msg) => { if (status) status.textContent = msg; };

    if (!jwt) { setStatus('Please enter your Pinata JWT.'); return; }

    deployBtn.disabled = true;
    setStatus('Building website…');

    try {
        const html = await _buildDeployHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const formData = new FormData();
        formData.append('file', blob, 'index.html');
        formData.append('pinataMetadata', JSON.stringify({ name: `geocities-${_currentProfileEnsName || 'site'}` }));

        setStatus('Uploading to IPFS…');
        const resp = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: { Authorization: `Bearer ${jwt}` },
            body: formData
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`Pinata error ${resp.status}: ${err}`);
        }

        const data = await resp.json();
        const cid = data.IpfsHash;
        setStatus(`Uploaded! CID: ${cid}`);

        if (_connectedWallet && _currentProfileEnsName && !_currentProfileEnsName.endsWith('.base.eth')) {
            const connectLink = `https://app.ens.domains/${_currentProfileEnsName}`;
            status.innerHTML += `<br><a href="${connectLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;">Set contenthash on ENS ↗</a> or <button id="ipfs-set-contenthash-btn" class="dropdown-button" style="font-size:0.8em;padding:4px 10px;margin-top:6px;">Set via Wallet</button>`;
            document.getElementById('ipfs-set-contenthash-btn')?.addEventListener('click', async () => {
                const toast = _txToast.add({ title: `Set contenthash for ${_currentProfileEnsName}`, sub: 'Confirm in wallet\u2026' });
                try {
                    setStatus('Setting contenthash on ENS…');
                    const txHash = await _setContenthash(cid);
                    setStatus(`Done! Tx: ${txHash.slice(0,10)}…`);
                    toast.update({ kind: 'success', sub: 'Site live on your ENS name', txHash, autoDismissMs: 12000 });
                } catch (e) {
                    console.error('Set contenthash failed:', e);
                    const friendly = _formatTxError(e);
                    setStatus(friendly);
                    toast.update({ kind: 'error', sub: friendly, autoDismissMs: 8000 });
                }
            });
        }
    } catch (e) {
        console.error('IPFS deploy failed:', e);
        setStatus(_formatTxError(e));
    } finally {
        deployBtn.disabled = false;
    }
}

async function _buildDeployHTML() {
    const resp = await fetch('download-template.html');
    if (!resp.ok) throw new Error('Could not load template');
    let html = await resp.text();

    const bgColor = document.getElementById('bg-color')?.value || '#000000';
    const textColor = document.getElementById('text-color')?.value || '#00ff00';
    const borderColor = document.getElementById('border-color')?.value || '#00ff00';
    const effect = document.getElementById('effect-select')?.value || 'none';

    html = html.replace(/\{\{BG_COLOR\}\}/g, bgColor)
               .replace(/\{\{TEXT_COLOR\}\}/g, textColor)
               .replace(/\{\{BORDER_COLOR\}\}/g, borderColor)
               .replace(/\{\{EFFECT\}\}/g, effect)
               .replace(/\{\{ENS_NAME\}\}/g, _currentProfileEnsName || '')
               .replace(/\{\{ADDRESS\}\}/g, _currentProfileAddress || '');

    if (_currentProfileData) {
        const d = _currentProfileData;
        html = html.replace(/\{\{AVATAR\}\}/g, d.avatar || '')
                   .replace(/\{\{DISPLAY_NAME\}\}/g, d.displayName || _currentProfileEnsName || '')
                   .replace(/\{\{BIO\}\}/g, d.description || '');
    }
    return html;
}

async function _setContenthash(cid) {
    if (!_connectedWallet) throw new Error('No wallet connected');
    await _ensureChain('0x1');
    const signer = await _getSigner();
    const ensNode = ethers.utils.namehash(_currentProfileEnsName);
    const contenthash = _cidToContenthash(cid);
    const resolver = new ethers.Contract(ENS_PUBLIC_RESOLVER, [
        'function setContenthash(bytes32,bytes)'
    ], signer);
    const tx = await resolver.setContenthash(ensNode, contenthash);
    await tx.wait();
    return tx.hash;
}

// Initialize PWA support when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Register service worker for main site
    registerServiceWorker();
    
    // Initialize cycling words in slogan
    initializeCyclingWords();
    
    // Initialize the ENS grid
    initializeENSGrid();
    
    // Initialize color pickers
    initializeColorPickers();
    
    // Set up navigation logo click handler
    setupNavLogoClickHandler();
    
    // Setup dropdown functionality for any static dropdowns if they existed,
    // but settings and coin are dynamic. Copy button listener is delegated.
    // The primary setup calls for dynamic dropdowns are within updateNavBar.

    // Initialize the GeoCities avatar and create PWA icons
    // These should NOT call updateNavBar in a way that adds profile-specific buttons.
    initializeGeoCitiesAvatar(); // Removed .then() as it's not strictly needed if it doesn't affect nav buttons

    // Delegated event listener for "Copy Address" button
    document.body.addEventListener('click', async (event) => {
        if (event.target.id === 'coin-copy-address-btn') {
            const walletAddressDiv = document.getElementById('coin-wallet-address');
            const addressToCopy = walletAddressDiv ? walletAddressDiv.textContent : null;

            if (addressToCopy && addressToCopy !== '[Wallet Address]' && addressToCopy !== 'Address not found.') {
                try {
                    await navigator.clipboard.writeText(addressToCopy);
                    event.target.textContent = 'Copied!';
                } catch (err) {
                    console.error('Failed to copy address: ', err);
                    event.target.textContent = 'Copy Failed';
                }
            } else {
                event.target.textContent = 'Nothing to Copy';
            }
            setTimeout(() => {
                // Check if the button still exists before trying to change its text
                const button = document.getElementById('coin-copy-address-btn');
                if (button) button.textContent = 'Copy Address';
            }, 2000);
        }
    });

    // Ensure the nav bar is in the correct initial state (no profile-specific buttons)
    // This call is crucial to ensure homepage loads without profile buttons.
    updateNavBar('home', false);
});
