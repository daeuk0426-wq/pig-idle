import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// --- TYPES AND INTERFACES ---
interface Enemy {
  name: string;
  maxHp: number;
  hp: number;
  gold: number;
}
export interface GameState {
  nickname: string;
  level: number;
  attack: number;
  gold: number;
  stage: number;
  currentSkin: string;
  lastLogin: number;
  isAdmin: boolean;
  unlockedSkins: string[];
  unlockedEasterEggs: string[];
  // Game loop state
  isBattling: boolean;
  enemy: Enemy | null;
  // Easter Egg trackers
  consecutiveUpgradeClicks: number;
  lastUpgradeClickTime: number;
  lastBattleClickTime: number;
  battleClickCount: number;
  stage13Losses: number;
  // Secret Stage state
  previousStage: number;
  // UI State
  showNicknameModal: boolean;
  showSkinModal: boolean;
  showAdminModal: boolean;
  showOfflineRewardModal: boolean;
  offlineRewardMessage: string;
  overlayMessage: { key: number; text: string; duration: number };
}
interface GameActions {
  setNickname: (name: string) => void;
  startBattle: () => void;
  attack: () => void;
  upgradeAttack: () => void;
  changeSkin: (skinId: string) => void;
  // UI Actions
  toggleNicknameModal: (show: boolean) => void;
  toggleSkinModal: (show: boolean) => void;
  toggleAdminModal: (show: boolean) => void;
  toggleOfflineRewardModal: (show: boolean) => void;
  showOverlay: (text: string, duration?: number) => void;
  // Admin Actions
  setGold: (amount: number) => void;
  setAttack: (amount: number) => void;
  setStage: (stageNum: number) => void;
  jumpToStage: (stageNum: number) => void;
  // Defeat action
  handleDefeat: () => void;
  // Initialization
  init: () => void;
  _resetEasterEggCounters: () => void;
}
// --- CONSTANTS ---
export const skins: Record<string, { name: string; icon: string; class: string; tooltip: string; secret?: boolean }> = {
    'default': { name: '기본 돼지', icon: '🐷', class: '', tooltip: '평범��� 돼지입니다.' },
    'muscle': { name: '근육 돼지', icon: '💪🐷', class: 'skin-muscle', tooltip: '힘이 세보입니다.' },
    'devil': { name: '악마 돼지', icon: '😈🐷', class: 'skin-devil', tooltip: '어둠의 기��이 느껴집니다.' },
    'gold': { name: '황금 돼지', icon: '💰🐷', class: 'skin-gold', tooltip: '부자가 될 것 같습니다.' },
    'piggod': { name: '신의 돼지', icon: '✨🐷', class: 'skin-piggod', tooltip: '신성한 기운이... 공격력 +10%', secret: true },
    'error': { name: '오류 돼지', icon: '🤖🐷', class: 'skin-error', tooltip: '뭔가 망가졌다', secret: true },
    'bloodtear': { name: '피눈물 돼지', icon: '😢🐷', class: 'skin-bloodtear', tooltip: '분노가 느껴진다', secret: true },
};
const INITIAL_STATE: GameState = {
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
  isBattling: false,
  enemy: null,
  consecutiveUpgradeClicks: 0,
  lastUpgradeClickTime: 0,
  lastBattleClickTime: 0,
  battleClickCount: 0,
  stage13Losses: 0,
  previousStage: 1,
  showNicknameModal: false,
  showSkinModal: false,
  showAdminModal: false,
  showOfflineRewardModal: false,
  offlineRewardMessage: '',
  overlayMessage: { key: 0, text: '', duration: 1500 },
};
// --- HELPER FUNCTIONS ---
const createEnemy = (stage: number): Enemy => {
    let name = "슬라임";
    let hpMultiplier = 1.2;
    let goldMultiplier = 1.1;
    if (stage === 13) name = "��운한 농부";
    if (stage === -1) name = "???";
    if (stage === -2) name = "신성한 허수아비";
    if (stage === -3) name = "공허";
    const baseHp = 10;
    const baseGold = 5;
    let maxHp = Math.floor(baseHp * Math.pow(hpMultiplier, stage - 1));
    let gold = Math.floor(baseGold * Math.pow(goldMultiplier, stage - 1));
    if (stage === 13) gold = Math.floor(gold * 1.2);
    if (stage === -1) { maxHp = 500; gold = 100000; }
    if (stage === -2) { maxHp = 10000; gold = 50000; }
    if (stage === -3) { maxHp = 1; gold = 0; }
    return { name, maxHp, hp: maxHp, gold };
};
// --- ZUSTAND STORE ---
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      showOverlay: (text, duration = 1500) => {
        set({ overlayMessage: { key: Date.now(), text, duration } });
      },
      _resetEasterEggCounters: () => {
        set({ consecutiveUpgradeClicks: 0, battleClickCount: 0 });
      },
      setNickname: (name) => {
        const oldNickname = get().nickname;
        const newNickname = name.trim();
        if (!newNickname) return;
        set({ nickname: newNickname, showNicknameModal: false });
        get()._checkEasterEgg('nickname', { old: oldNickname, new: newNickname });
        set({ isAdmin: newNickname === 'admin' });
      },
      startBattle: () => {
        if (get().isBattling) return;
        const { stage, currentSkin } = get();
        if (stage === 13 && currentSkin === 'piggod') {
            get()._enterSecretStage(-2); // God's Farm
            return;
        }
        set({ isBattling: true, enemy: createEnemy(stage) });
      },
      attack: () => {
        const { enemy, attack, currentSkin } = get();
        if (!enemy || enemy.hp <= 0) return;
        let damage = attack;
        if (currentSkin === 'piggod') {
            damage = Math.floor(damage * 1.1);
        }
        const newHp = enemy.hp - damage;
        if (newHp <= 0) {
            get()._enemyDefeated();
        } else {
            set({ enemy: { ...enemy, hp: newHp } });
        }
      },
      _enemyDefeated: () => {
        const { enemy, stage, nickname, unlockedSkins } = get();
        if (!enemy) return;
        get().showOverlay(`+${enemy.gold} 골드`);
        set(state => ({ gold: state.gold + enemy.gold }));
        if (nickname === 'piggod' && !unlockedSkins.includes('piggod')) {
            get()._unlockSecretSkin('piggod');
            get().showOverlay("🐷 신이 내려왔다", 3000);
        }
        if (stage < 0) {
            get()._handleSecretStageClear();
            return;
        }
        set(state => ({
            stage: state.stage + 1,
            stage13Losses: 0, // Reset loss counter on win
        }));
        set({ enemy: createEnemy(get().stage) });
      },
      handleDefeat: () => {
        if (get().stage === 13) {
            const newLosses = get().stage13Losses + 1;
            set({ stage13Losses: newLosses });
            if (newLosses >= 3) {
                set({ stage13Losses: 0 });
                get()._enterSecretStage(-3); // Despair Cage
                return;
            }
        }
        get().showOverlay("패배했습니다...", 2000);
        set({ isBattling: false });
      },
      upgradeAttack: () => {
        const { level, gold } = get();
        const cost = Math.floor(10 * Math.pow(1.15, level - 1));
        const now = Date.now();
        const lastClick = get().lastUpgradeClickTime;
        const consecutive = now - lastClick < 1000 ? get().consecutiveUpgradeClicks + 1 : 1;
        set({ lastUpgradeClickTime: now, consecutiveUpgradeClicks: consecutive });
        get()._checkEasterEgg('upgradeClick');
        if (gold >= cost) {
            set(state => ({
                gold: state.gold - cost,
                level: state.level + 1,
                attack: state.attack + Math.floor((state.level + 1) / 5) + 1,
            }));
            get().showOverlay("🐷 이 돼지… 또 강해졌다");
            get()._checkEasterEgg('attackValue');
        } else {
            get().showOverlay("골드가 부족합니다!");
        }
      },
      changeSkin: (skinId) => {
        set({ currentSkin: skinId });
      },
      toggleNicknameModal: (show) => set({ showNicknameModal: show }),
      toggleSkinModal: (show) => set({ showSkinModal: show }),
      toggleAdminModal: (show) => set({ showAdminModal: show }),
      toggleOfflineRewardModal: (show) => set({ showOfflineRewardModal: show }),
      setGold: (amount) => set({ gold: amount }),
      setAttack: (amount) => set({ attack: amount }),
      setStage: (stageNum) => {
        if (isNaN(stageNum)) return;
        set({ stage: stageNum, enemy: createEnemy(stageNum) });
      },
      jumpToStage: (stageNum) => {
        if (isNaN(stageNum)) {
            alert("잘못�� 숫자입니다.");
            return;
        }
        if (stageNum === 0) {
            get()._checkEasterEgg('stageJump', { stage: 0 });
            return;
        }
        get().showOverlay("공간이 찢어졌다…");
        set({ stage: stageNum, enemy: createEnemy(stageNum) });
      },
      _checkEasterEgg: (type, data: any = {}) => {
        const { unlockedEasterEggs, attack, consecutiveUpgradeClicks, battleClickCount } = get();
        const key = `${type}:${data.new || data.stage || attack}`;
        if (unlockedEasterEggs.includes(key) || unlockedEasterEggs.includes(type)) return;
        let triggered = false;
        switch (type) {
            case 'nickname':
                const { new: newNickname, old } = data;
                if (newNickname === 'piggod') {
                    set(state => ({ gold: state.gold + 999999 }));
                    get().showOverlay("🐷 신이 강림했다");
                } else if (newNickname === 'dev') {
                    set(state => ({ currentSkin: 'gold', attack: state.attack + 50 }));
                    get().showOverlay("개발자 모드");
                } else if (newNickname === 'ㅋㅋㅋ') {
                    // This will be handled in the component via an effect
                } else if (newNickname === '돼지') {
                    get().showOverlay("너무 평범하다…");
                } else if (newNickname === 'admin' && old === 'admin') {
                    get().showOverlay("금지된 루프가 열렸다");
                }
                break;
            case 'upgradeClick':
                if (consecutiveUpgradeClicks >= 10 && !unlockedEasterEggs.includes('upgradeSpam')) {
                    set(state => ({ gold: state.gold + 1000 }));
                    get().showOverlay("강화 중독자");
                    set(state => ({ unlockedEasterEggs: [...state.unlockedEasterEggs, 'upgradeSpam'] }));
                }
                break;
            case 'battleClick':
                if (battleClickCount >= 5) {
                    get().showOverlay("침착해���…");
                }
                break;
            case 'attackValue':
                if (attack === 777 && !unlockedEasterEggs.includes('attack777')) {
                    get().showOverlay("불길한 숫자다…");
                    set(state => ({ unlockedEasterEggs: [...state.unlockedEasterEggs, 'attack777'] }));
                }
                break;
            case 'stageJump':
                if (data.stage === 0) {
                    get()._enterSecretStage(-1); // Bug's Grassland
                }
                break;
        }
      },
      _unlockSecretSkin: (skinId) => {
        if (!get().unlockedSkins.includes(skinId)) {
            set(state => ({ unlockedSkins: [...state.unlockedSkins, skinId] }));
        }
      },
      _enterSecretStage: (secretStageId) => {
        set(state => ({ previousStage: state.stage, stage: secretStageId }));
        let message = "";
        if (secretStageId === -1) message = "여긴 어디지…?";
        if (secretStageId === -2) message = "신성한 농장에 진입했습니다.";
        if (secretStageId === -3) message = "절망의 우리��� 떨어집니다.";
        get().showOverlay(message);
        set({ enemy: createEnemy(secretStageId) });
        if (!get().isBattling) {
            set({ isBattling: true });
        }
      },
      _handleSecretStageClear: () => {
        const clearedStage = get().stage;
        set(state => ({ stage: state.previousStage }));
        if (clearedStage === -1) {
            get().showOverlay("버그의 초원 클리어!");
            get()._unlockSecretSkin('error');
        } else if (clearedStage === -2) {
            get().showOverlay("신의 농장 클리어!");
            set(state => ({ attack: state.attack + 5 }));
        } else if (clearedStage === -3) {
            get().showOverlay("절망을 이겨냈습니다.");
            get()._unlockSecretSkin('bloodtear');
        }
        set({ enemy: createEnemy(get().stage) });
      },
      init: () => {
        const { lastLogin } = get();
        const now = Date.now();
        const diffSeconds = Math.floor((now - lastLogin) / 1000);
        const minutesOffline = Math.floor(diffSeconds / 60);
        if (minutesOffline > 1) {
            const goldPerMinute = 10;
            const reward = minutesOffline * goldPerMinute;
            set(state => ({ gold: state.gold + reward }));
            set({
                offlineRewardMessage: `${minutesOffline}분 동안 방치��여 ${reward} 골드를 획득했습니다!`,
                showOfflineRewardModal: true,
            });
        }
        if (!get().nickname) {
            set({ showNicknameModal: true });
        }
      },
    }),
    {
      name: 'pig-idle-game-state',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isBattling = false;
          state.enemy = null;
          state.showAdminModal = false;
          state.showNicknameModal = false;
          state.showOfflineRewardModal = false;
          state.showSkinModal = false;
        }
      }
    }
  )
);