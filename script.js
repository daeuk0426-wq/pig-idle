document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const DOMElements = {
        nicknameDisplay: document.getElementById('nickname-display'),
        adminModeIndicator: document.getElementById('admin-mode-indicator'),
        stageDisplay: document.getElementById('stage-display'),
        levelDisplay: document.getElementById('level-display'),
        attackDisplay: document.getElementById('attack-display'),
        goldDisplay: document.getElementById('gold-display'),
        pig: document.getElementById('pig'),
        attackEffect: document.getElementById('attack-effect'),
        enemyName: document.getElementById('enemy-name'),
        enemyHpBar: document.getElementById('enemy-hp-bar'),
        enemyHpText: document.getElementById('enemy-hp-text'),
        damageTextContainer: document.getElementById('damage-text-container'),
        battleBtn: document.getElementById('battle-btn'),
        upgradeBtn: document.getElementById('upgrade-btn'),
        skinChangeBtn: document.getElementById('skin-change-btn'),
        nicknameChangeBtn: document.getElementById('nickname-change-btn'),
        adminPanelBtn: document.getElementById('admin-panel-btn'),
        stageJumpBtn: document.getElementById('stage-jump-btn'),
        nicknameModal: document.getElementById('nickname-modal'),
        nicknameInput: document.getElementById('nickname-input'),
        nicknameSubmitBtn: document.getElementById('nickname-submit-btn'),
        skinModal: document.getElementById('skin-modal'),
        skinSelectionContainer: document.getElementById('skin-selection-container'),
        skinModalCloseBtn: document.getElementById('skin-modal-close-btn'),
        adminModal: document.getElementById('admin-modal'),
        adminGoldInput: document.getElementById('admin-gold-input'),
        adminGoldSubmit: document.getElementById('admin-gold-submit'),
        adminAttackInput: document.getElementById('admin-attack-input'),
        adminAttackSubmit: document.getElementById('admin-attack-submit'),
        adminStageInput: document.getElementById('admin-stage-input'),
        adminStageSubmit: document.getElementById('admin-stage-submit'),
        adminModalCloseBtn: document.getElementById('admin-modal-close-btn'),
        offlineRewardModal: document.getElementById('offline-reward-modal'),
        offlineRewardText: document.getElementById('offline-reward-text'),
        offlineRewardCloseBtn: document.getElementById('offline-reward-close-btn'),
        overlayMessage: document.getElementById('overlay-message'),
        gameContainer: document.getElementById('game-container'),
    };
    // Game State
    let gameState = {
        nickname: '',
        level: 1,
        attack: 1,
        gold: 0,
        stage: 1,
        currentSkin: 'default',
        lastLogin: Date.now(),
        isAdmin: false,
        unlockedSkins: ['default', 'muscle', 'devil', 'gold'],
        unlockedEasterEggs: [],
        consecutiveUpgradeClicks: 0,
        lastUpgradeClickTime: 0,
        lastBattleClickTime: 0,
        battleClickCount: 0,
        stage13Losses: 0,
    };
    // Game Variables
    let enemy = null;
    let autoAttackInterval = null;
    let isBattling = false;
    // Skins Data
    const skins = {
        'default': { name: '기본 돼지', icon: '🐷', class: '', tooltip: '평범한 돼지입니다.' },
        'muscle': { name: '��육 돼지', icon: '💪🐷', class: 'skin-muscle', tooltip: '힘이 세보입니다.' },
        'devil': { name: '악마 돼지', icon: '😈🐷', class: 'skin-devil', tooltip: '어둠��� 기운이 느껴집니다.' },
        'gold': { name: '���금 돼지', icon: '💰🐷', class: 'skin-gold', tooltip: '부자가 �� 것 같습니다.' },
        'piggod': { name: '신의 돼지', icon: '✨🐷', class: 'skin-piggod', tooltip: '신성한 기운이... 공격��� +10%', secret: true },
        'error': { name: '오류 돼지', icon: ' glitch', class: 'skin-error', tooltip: '뭔가 ��가졌다', secret: true },
        'bloodtear': { name: '피눈물 돼지', icon: '😢🐷', class: 'skin-bloodtear', tooltip: '분노가 느껴진다', secret: true },
    };
    // --- Core Functions ---
    function saveGame() {
        gameState.lastLogin = Date.now();
        localStorage.setItem('pigIdleGameState', JSON.stringify(gameState));
    }
    function loadGame() {
        const savedState = localStorage.getItem('pigIdleGameState');
        if (savedState) {
            const loadedData = JSON.parse(savedState);
            // Merge loaded data with default to prevent breaking on new properties
            gameState = { ...gameState, ...loadedData };
            // Ensure unlockedSkins is an array
            if (!Array.isArray(gameState.unlockedSkins)) {
                gameState.unlockedSkins = ['default', 'muscle', 'devil', 'gold'];
            }
        }
    }
    function updateUI() {
        DOMElements.nicknameDisplay.textContent = gameState.nickname;
        DOMElements.stageDisplay.textContent = gameState.stage;
        DOMElements.levelDisplay.textContent = gameState.level;
        DOMElements.attackDisplay.textContent = gameState.attack;
        DOMElements.goldDisplay.textContent = Math.floor(gameState.gold);
        // Admin UI
        const adminElements = document.querySelectorAll('.admin-only');
        if (gameState.isAdmin) {
            DOMElements.adminModeIndicator.classList.remove('hidden');
            adminElements.forEach(el => el.classList.remove('hidden'));
        } else {
            DOMElements.adminModeIndicator.classList.add('hidden');
            adminElements.forEach(el => el.classList.add('hidden'));
        }
        // Pig Skin
        DOMElements.pig.className = skins[gameState.currentSkin]?.class || '';
        DOMElements.pig.textContent = skins[gameState.currentSkin]?.icon.split(' ')[1] || skins[gameState.currentSkin]?.icon || '🐷';
        // Enemy UI
        if (enemy) {
            DOMElements.enemyName.textContent = enemy.name;
            const hpPercentage = (enemy.hp / enemy.maxHp) * 100;
            DOMElements.enemyHpBar.style.width = `${hpPercentage}%`;
            DOMElements.enemyHpText.textContent = `${Math.ceil(enemy.hp)} / ${enemy.maxHp}`;
        }
    }
    // --- Game Logic ---
    function createEnemy(stage) {
        let name = "슬라임";
        let hpMultiplier = 1.2;
        let goldMultiplier = 1.1;
        // Special stage modifications
        if (stage === 13) name = "불운한 농���";
        if (stage === -1) name = "???"; // Bug Grassland
        if (stage === -2) name = "신성한 허수아비"; // God's Farm
        if (stage === -3) name = "공허"; // Despair Cage
        enemy = {
            name: name,
            maxHp: Math.floor(10 * Math.pow(hpMultiplier, stage - 1)),
            hp: Math.floor(10 * Math.pow(hpMultiplier, stage - 1)),
            gold: Math.floor(5 * Math.pow(goldMultiplier, stage - 1)),
        };
        if (stage === 13) enemy.gold = Math.floor(enemy.gold * 1.2);
        if (stage === -1) { enemy.maxHp = 500; enemy.hp = 500; enemy.gold = 100000; }
        if (stage === -2) { enemy.maxHp = 10000; enemy.hp = 10000; enemy.gold = 50000; }
        if (stage === -3) { enemy.maxHp = 1; enemy.hp = 1; enemy.gold = 0; }
    }
    function attack() {
        if (!enemy || enemy.hp <= 0) return;
        let damage = gameState.attack;
        if (gameState.currentSkin === 'piggod') {
            damage = Math.floor(damage * 1.1);
        }
        enemy.hp -= damage;
        // Visual Effects
        DOMElements.pig.style.transform = 'scale(1.1)';
        setTimeout(() => DOMElements.pig.style.transform = 'scale(1)', 100);
        DOMElements.attackEffect.classList.remove('hidden');
        setTimeout(() => DOMElements.attackEffect.classList.add('hidden'), 200);
        showDamageText(damage);
        if (enemy.hp <= 0) {
            enemy.hp = 0;
            enemyDefeated();
        }
        updateUI();
    }
    function showDamageText(damage) {
        const damageText = document.createElement('div');
        damageText.className = 'damage-text';
        damageText.textContent = `-${damage}`;
        damageText.style.left = `${Math.random() * 40 + 30}%`;
        DOMElements.damageTextContainer.appendChild(damageText);
        setTimeout(() => damageText.remove(), 1000);
    }
    function enemyDefeated() {
        showOverlayMessage(`+${enemy.gold} ���드`);
        gameState.gold += enemy.gold;
        // Secret skin unlock check
        if (gameState.nickname === 'piggod' && !gameState.unlockedSkins.includes('piggod')) {
            unlockSecretSkin('piggod');
            showOverlayMessage("🐷 신이 내려왔다", 3000);
        }
        // Handle secret stages
        if (gameState.stage < 0) {
            handleSecretStageClear();
            return;
        }
        gameState.stage++;
        gameState.stage13Losses = 0; // Reset loss counter on win
        createEnemy(gameState.stage);
        saveGame();
        updateUI();
    }
    function startBattle() {
        if (isBattling) return;
        isBattling = true;
        DOMElements.battleBtn.textContent = "전투 중...";
        DOMElements.battleBtn.disabled = true;
        createEnemy(gameState.stage);
        autoAttackInterval = setInterval(attack, 1000);
        updateUI();
    }
    function upgradeAttack() {
        const cost = Math.floor(10 * Math.pow(1.15, gameState.level - 1));
        if (gameState.gold >= cost) {
            gameState.gold -= cost;
            gameState.level++;
            gameState.attack += Math.floor(gameState.level / 5) + 1;
            showOverlayMessage("🐷 이 돼지… 또 강해졌다");
            checkEasterEgg('attackValue');
            saveGame();
            updateUI();
        } else {
            showOverlayMessage("골드가 부족���니다!");
        }
    }
    // --- Modals & UI Interaction ---
    function showModal(modal) { modal.classList.remove('hidden'); }
    function hideModal(modal) { modal.classList.add('hidden'); }
    function setupModals() {
        DOMElements.nicknameSubmitBtn.onclick = () => {
            const newNickname = DOMElements.nicknameInput.value.trim();
            if (newNickname) {
                const oldNickname = gameState.nickname;
                gameState.nickname = newNickname;
                hideModal(DOMElements.nicknameModal);
                checkEasterEgg('nickname', { old: oldNickname, new: newNickname });
                checkAdmin();
                saveGame();
                updateUI();
            }
        };
        DOMElements.skinChangeBtn.onclick = () => {
            populateSkinSelection();
            showModal(DOMElements.skinModal);
        };
        DOMElements.skinModalCloseBtn.onclick = () => hideModal(DOMElements.skinModal);
        DOMElements.nicknameChangeBtn.onclick = () => {
            DOMElements.nicknameInput.value = gameState.nickname;
            showModal(DOMElements.nicknameModal);
        };
        DOMElements.adminPanelBtn.onclick = () => showModal(DOMElements.adminModal);
        DOMElements.adminModalCloseBtn.onclick = () => hideModal(DOMElements.adminModal);
        DOMElements.offlineRewardCloseBtn.onclick = () => hideModal(DOMElements.offlineRewardModal);
    }
    function populateSkinSelection() {
        DOMElements.skinSelectionContainer.innerHTML = '';
        gameState.unlockedSkins.forEach(skinId => {
            const skin = skins[skinId];
            if (!skin) return;
            const item = document.createElement('div');
            item.className = 'skin-item';
            if (gameState.currentSkin === skinId) {
                item.classList.add('selected');
            }
            item.innerHTML = `
                <div class="skin-icon">${skin.icon}</div>
                <div class="skin-name">${skin.name}</div>
                <span class="skin-tooltip">${skin.tooltip}</span>
            `;
            item.onclick = () => {
                gameState.currentSkin = skinId;
                if (skinId === 'dev') { // dev nickname easter egg
                    gameState.attack += 50;
                }
                populateSkinSelection(); // Re-render to show selection
                saveGame();
                updateUI();
            };
            DOMElements.skinSelectionContainer.appendChild(item);
        });
    }
    function showOverlayMessage(message, duration = 1500) {
        DOMElements.overlayMessage.textContent = message;
        DOMElements.overlayMessage.classList.remove('hidden');
        DOMElements.overlayMessage.style.animation = `fade-in-out ${duration / 1000}s forwards`;
        setTimeout(() => {
            DOMElements.overlayMessage.classList.add('hidden');
        }, duration);
    }
    // --- Admin & Easter Eggs ---
    function checkAdmin() {
        gameState.isAdmin = gameState.nickname === 'admin';
    }
    function setupAdminControls() {
        DOMElements.adminGoldSubmit.onclick = () => {
            gameState.gold = Number(DOMElements.adminGoldInput.value);
            updateUI();
        };
        DOMElements.adminAttackSubmit.onclick = () => {
            gameState.attack = Number(DOMElements.adminAttackInput.value);
            updateUI();
        };
        DOMElements.adminStageSubmit.onclick = () => {
            gameState.stage = Number(DOMElements.adminStageInput.value);
            createEnemy(gameState.stage);
            updateUI();
        };
        DOMElements.stageJumpBtn.onclick = () => {
            const targetStage = prompt("이동할 스테이지를 입력하세요:");
            const stageNum = parseInt(targetStage, 10);
            if (!isNaN(stageNum)) {
                if (stageNum === 0) {
                    checkEasterEgg('stageJump', { stage: 0 });
                    return;
                }
                gameState.stage = stageNum;
                createEnemy(gameState.stage);
                showOverlayMessage("공간이 찢어졌다…");
                updateUI();
            } else {
                alert("잘못된 숫자입니다.");
            }
        };
    }
    function checkEasterEgg(type, data = {}) {
        if (gameState.unlockedEasterEggs.includes(type + ':' + data.new)) return;
        switch (type) {
            case 'nickname':
                const { old, new: newNickname } = data;
                if (newNickname === 'piggod') {
                    gameState.gold += 999999;
                    showOverlayMessage("🐷 신이 강림했다");
                } else if (newNickname === 'dev') {
                    gameState.currentSkin = 'gold';
                    gameState.attack += 50;
                    showOverlayMessage("개발자 모드");
                } else if (newNickname === 'ㅋㅋㅋ') {
                    DOMElements.gameContainer.style.animation = 'shake 0.5s';
                    setTimeout(() => DOMElements.gameContainer.style.animation = '', 500);
                    showOverlayMessage("웃음이 멈추지 않는다");
                } else if (newNickname === '돼지') {
                    showOverlayMessage("너무 평��하다…");
                } else if (newNickname === 'admin' && old === 'admin') {
                    showOverlayMessage("금지된 루프가 열렸다");
                    document.querySelector('.modal-content h2').style.color = 'red';
                }
                break;
            case 'upgradeClick':
                if (gameState.consecutiveUpgradeClicks >= 10 && !gameState.unlockedEasterEggs.includes('upgradeSpam')) {
                    gameState.gold += 1000;
                    showOverlayMessage("강화 중독자");
                    gameState.unlockedEasterEggs.push('upgradeSpam');
                }
                break;
            case 'battleClick':
                if (gameState.battleClickCount >= 5) {
                    showOverlayMessage("침착해라…");
                    DOMElements.battleBtn.disabled = true;
                    setTimeout(() => { DOMElements.battleBtn.disabled = !isBattling; }, 2000);
                }
                break;
            case 'attackValue':
                if (gameState.attack === 777 && !gameState.unlockedEasterEggs.includes('attack777')) {
                    showOverlayMessage("불길한 숫자다…");
                    const originalClass = DOMElements.pig.className;
                    DOMElements.pig.style.filter = 'sepia(1) hue-rotate(330deg)';
                    setTimeout(() => DOMElements.pig.style.filter = '', 2000);
                    gameState.unlockedEasterEggs.push('attack777');
                }
                break;
            case 'stageJump':
                if (data.stage === 0) {
                    enterSecretStage(-1); // Bug's Grassland
                }
                break;
        }
        updateUI();
        saveGame();
    }
    function unlockSecretSkin(skinId) {
        if (!gameState.unlockedSkins.includes(skinId)) {
            gameState.unlockedSkins.push(skinId);
            saveGame();
        }
    }
    // --- Secret Stages ---
    let previousStage = 1;
    function enterSecretStage(secretStageId) {
        previousStage = gameState.stage;
        gameState.stage = secretStageId;
        let message = "";
        if (secretStageId === -1) { // Bug's Grassland
            message = "여긴 어디지…?";
            showOverlayMessage(message);
            createEnemy(gameState.stage);
            if (!isBattling) startBattle();
        } else if (secretStageId === -2) { // God's Farm
            message = "신성한 농장에 ��입했습니다.";
            showOverlayMessage(message);
            createEnemy(gameState.stage);
        } else if (secretStageId === -3) { // Despair Cage
            message = "절망의 우리로 ���어집니다.";
            showOverlayMessage(message);
            createEnemy(gameState.stage);
            if (!isBattling) startBattle();
        }
        updateUI();
    }
    function handleSecretStageClear() {
        const clearedStage = gameState.stage;
        gameState.stage = previousStage; // Return to original stage
        if (clearedStage === -1) { // Bug's Grassland
            showOverlayMessage("버그의 초원 클리어!");
            unlockSecretSkin('error');
        } else if (clearedStage === -2) { // God's Farm
            showOverlayMessage("신의 농장 클리어!");
            gameState.attack += 5;
        } else if (clearedStage === -3) { // Despair Cage
            showOverlayMessage("절망을 이겨냈습니다.");
            unlockSecretSkin('bloodtear');
        }
        createEnemy(gameState.stage);
        updateUI();
        saveGame();
    }
    // --- Event Listeners ---
    function setupEventListeners() {
        DOMElements.upgradeBtn.onclick = () => {
            const now = Date.now();
            if (now - gameState.lastUpgradeClickTime < 1000) {
                gameState.consecutiveUpgradeClicks++;
            } else {
                gameState.consecutiveUpgradeClicks = 1;
            }
            gameState.lastUpgradeClickTime = now;
            checkEasterEgg('upgradeClick');
            upgradeAttack();
        };
        DOMElements.battleBtn.onclick = () => {
            const now = Date.now();
            if (now - gameState.lastBattleClickTime < 1000) {
                gameState.battleClickCount++;
            } else {
                gameState.battleClickCount = 1;
            }
            gameState.lastBattleClickTime = now;
            checkEasterEgg('battleClick');
            if (!isBattling) {
                if (gameState.stage === 13 && gameState.currentSkin === 'piggod') {
                    enterSecretStage(-2); // God's Farm
                } else {
                    startBattle();
                }
            }
        };
    }
    // --- Offline Rewards ---
    function calculateOfflineRewards() {
        const now = Date.now();
        const diffSeconds = Math.floor((now - gameState.lastLogin) / 1000);
        const minutesOffline = Math.floor(diffSeconds / 60);
        if (minutesOffline > 1) {
            const goldPerMinute = 10; // Base gold per minute
            const reward = minutesOffline * goldPerMinute;
            gameState.gold += reward;
            DOMElements.offlineRewardText.textContent = `${minutesOffline}분 ��안 방치하여 ${reward} 골드를 획득했습니다!`;
            showModal(DOMElements.offlineRewardModal);
        }
    }
    // --- Initialization ---
    function init() {
        loadGame();
        checkAdmin();
        if (!gameState.nickname) {
            showModal(DOMElements.nicknameModal);
        } else {
            calculateOfflineRewards();
        }
        setupModals();
        setupAdminControls();
        setupEventListeners();
        updateUI();
        // Save game periodically
        setInterval(saveGame, 10000);
    }
    init();
});