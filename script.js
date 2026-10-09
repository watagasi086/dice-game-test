
const MAX_HP = 100;

const skills = [
  { id: "atk5", name: "小攻撃", type: "damage", value: 5, cost: 0 },
  { id: "atk10", name: "攻撃", type: "damage", value: 10, cost: 10 },
  { id: "atk20", name: "大攻撃", type: "damage", value: 20, cost: 20 },
  { id: "atk30", name: "強攻撃", type: "damage", value: 30, cost: 30 },
  { id: "atk40", name: "超攻撃", type: "damage", value: 40, cost: 40 },
  { id: "atk50", name: "特大攻撃", type: "damage", value: 50, cost: 50 },
  { id: "heal5", name: "小回復", type: "heal", value: 5, cost: 0 },
  { id: "heal10", name: "回復", type: "heal", value: 10, cost: 10 },
  { id: "heal20", name: "大回復", type: "heal", value: 20, cost: 20 },
  { id: "heal30", name: "強回復", type: "heal", value: 30, cost: 30 },
  { id: "heal40", name: "超回復", type: "heal", value: 40, cost: 40 }
];

const INITIAL_COUNTS = {
  atk5: 3,
  heal5: 3
};

const INITIAL_LOADOUT = [
  "atk5", "atk5", "atk5",
  "heal5", "heal5", "heal5"
];

let playerHp = MAX_HP;
let enemyHp = MAX_HP;

let inventory = { ...INITIAL_COUNTS };
let loadout = [...INITIAL_LOADOUT];

// 敵の技構成はバトル開始時にランダム生成
let enemyLoadout = [];

let selectedSkillId = null;
let selectedSlotIndex = null;
let battleFinished = false;
let battleLogEntries = [];

const gameHeader = document.getElementById("gameHeader");
const setupScreen = document.getElementById("setupScreen");
const battleScreen = document.getElementById("battleScreen");

const setupHpText = document.getElementById("setupHpText");
const setupHpBar = document.getElementById("setupHpBar");

const shopList = document.getElementById("shopList");
const battleSlots = document.getElementById("battleSlots");
const selectedSkillText = document.getElementById("selectedSkillText");
const ownedList = document.getElementById("ownedList");

const startButton = document.getElementById("startButton");

const playerHpText = document.getElementById("playerHpText");
const playerHpBar = document.getElementById("playerHpBar");
const enemyHpText = document.getElementById("enemyHpText");
const enemyHpBar = document.getElementById("enemyHpBar");

const playerDie = document.getElementById("playerDie");
const enemyDie = document.getElementById("enemyDie");

const battleSkillDisplay = document.getElementById("battleSkillDisplay");
const rollButton = document.getElementById("rollButton");
const battleLog = document.getElementById("battleLog");
const backButton = document.getElementById("backButton");

function getSkill(id) {
  return skills.find(skill => skill.id === id);
}

function getSkillDescription(skill) {
  return skill.type === "damage"
    ? `${skill.value}ダメージ`
    : `${skill.value}回復`;
}

// ==============================
// プレイヤーの準備画面
// ==============================

function updateSetupHp() {
  const hp = Math.max(0, Math.min(MAX_HP, playerHp));

  setupHpText.textContent = `${hp} / ${MAX_HP}`;
  setupHpBar.style.width = `${hp / MAX_HP * 100}%`;

  if (hp <= 25) {
    setupHpBar.style.background = "#ff6b79";
  } else if (hp <= 50) {
    setupHpBar.style.background = "#ffcf70";
  } else {
    setupHpBar.style.background = "#4bd69a";
  }

  updateStartButton();
}

function updateStartButton() {
  const allSlotsFilled =
    loadout.length === 6 &&
    loadout.every(id => id !== null && getSkill(id));

  startButton.disabled = playerHp <= 0 || !allSlotsFilled;
}

function renderShop() {
  shopList.innerHTML = "";

  skills.forEach(skill => {
    const item = document.createElement("div");
    item.className = "skill-item";

    const info = document.createElement("div");
    info.className = "skill-info";

    const name = document.createElement("div");
    name.className = "skill-name";
    name.textContent = skill.name;

    const detail = document.createElement("div");
    detail.className = "skill-detail";

    detail.textContent = skill.cost === 0
      ? `${getSkillDescription(skill)}・初期技`
      : `${getSkillDescription(skill)}・購入費用 ${skill.cost} HP`;

    info.append(name, detail);

    const button = document.createElement("button");
    button.className = "small-button";

    if (skill.cost === 0) {
      button.textContent = "初期技";
      button.disabled = true;
    } else {
      button.textContent = "購入";
      button.disabled = playerHp < skill.cost;

      button.addEventListener("click", () => {
        buySkill(skill.id);
      });
    }

    item.append(info, button);
    shopList.appendChild(item);
  });
}

function getEquippedCount(skillId) {
  return loadout.filter(id => id === skillId).length;
}

function getAvailableCount(skillId) {
  return Math.max(
    0,
    (inventory[skillId] || 0) - getEquippedCount(skillId)
  );
}

function buySkill(skillId) {
  const skill = getSkill(skillId);

  if (!skill || skill.cost <= 0 || playerHp < skill.cost) {
    return;
  }

  playerHp -= skill.cost;
  inventory[skillId] = (inventory[skillId] || 0) + 1;

  selectedSkillId = skillId;

  updateSetupHp();
  renderShop();
  renderSlots();
  renderOwnedSkills();
  updateSelectedText();
}

function renderSlots() {
  battleSlots.innerHTML = "";

  loadout.forEach((skillId, index) => {
    const button = document.createElement("button");
    button.className = "slot";

    if (selectedSlotIndex === index) {
      button.classList.add("selected");
    }

    const number = document.createElement("span");
    number.className = "slot-number";
    number.textContent = `スロット ${index + 1}`;

    const name = document.createElement("span");
    name.className = "slot-skill";

    const skill = getSkill(skillId);
    name.textContent = skill ? skill.name : "空き";

    button.append(number, name);

    button.addEventListener("click", () => {
      selectedSlotIndex = index;
      selectedSkillId = null;

      renderSlots();
      renderOwnedSkills();
      updateSelectedText();
    });

    battleSlots.appendChild(button);
  });

  updateStartButton();
}

function renderOwnedSkills() {
  ownedList.innerHTML = "";

  const ownedSkills = skills.filter(
    skill => (inventory[skill.id] || 0) > 0
  );

  if (ownedSkills.length === 0) {
    ownedList.textContent = "所持している技がありません。";
    return;
  }

  ownedSkills.forEach(skill => {
    const total = inventory[skill.id] || 0;
    const available = getAvailableCount(skill.id);

    const item = document.createElement("div");
    item.className = "owned-skill";

    const info = document.createElement("div");
    info.className = "skill-info";

    const name = document.createElement("div");
    name.className = "skill-name";
    name.textContent = skill.name;

    const detail = document.createElement("div");
    detail.className = "skill-detail";
    detail.textContent =
      `${getSkillDescription(skill)}・所持 ${total}個（未セット ${available}個）`;

    info.append(name, detail);

    const button = document.createElement("button");
    button.className = "small-button";

    if (selectedSlotIndex === null) {
      button.textContent = "スロットを選択";
      button.disabled = true;
    } else if (loadout[selectedSlotIndex] === skill.id) {
      button.textContent = "セット中";
      button.disabled = true;
    } else if (available > 0) {
      button.textContent = "セット";

      button.addEventListener("click", () => {
        equipSkill(selectedSlotIndex, skill.id);
      });
    } else {
      button.textContent = "使用中";
      button.disabled = true;
    }

    item.append(info, button);
    ownedList.appendChild(item);
  });
}

function equipSkill(slotIndex, skillId) {
  if (slotIndex === null || slotIndex < 0 || slotIndex >= 6) {
    return;
  }

  const skill = getSkill(skillId);

  if (!skill || loadout[slotIndex] === skillId) {
    return;
  }

  const available = getAvailableCount(skillId);

  if (available <= 0) {
    const anotherSlot = loadout.findIndex(
      (id, index) => id === skillId && index !== slotIndex
    );

    if (anotherSlot === -1) {
      return;
    }

    loadout[anotherSlot] = loadout[slotIndex];
  }

  loadout[slotIndex] = skillId;

  selectedSkillId = null;
  selectedSlotIndex = null;

  renderSlots();
  renderOwnedSkills();
  updateSelectedText();
}

function updateSelectedText() {
  if (selectedSlotIndex === null) {
    selectedSkillText.textContent =
      "セットするスロットを選んでね。";
    return;
  }

  const current = getSkill(loadout[selectedSlotIndex]);

  selectedSkillText.textContent = current
    ? `スロット ${selectedSlotIndex + 1} を選択中（現在：${current.name}）`
    : `スロット ${selectedSlotIndex + 1} を選択中`;
}

// ==============================
// 敵の技購入システム Ver. 1.8
// ==============================


function generateEnemyLoadout() {
  let remainingHp = MAX_HP;
  const newLoadout = [];

  // 残りHPを必ず1以上残せる技だけ候補にする
  function getAffordableSkills() {
    return skills.filter(skill => skill.cost < remainingHp);
  }

  // 購入できる技からランダムに選ぶ
  function buyRandomSkill() {
    const affordable = getAffordableSkills();

    const skill =
      affordable[Math.floor(Math.random() * affordable.length)];

    remainingHp -= skill.cost;
    newLoadout.push(skill.id);

    return skill;
  }

  // まず攻撃技を最低1つ確保する
  const affordableAttacks = skills.filter(
    skill => skill.type === "damage" && skill.cost < remainingHp
  );

  const firstAttack =
    affordableAttacks[
      Math.floor(Math.random() * affordableAttacks.length)
    ];

  remainingHp -= firstAttack.cost;
  newLoadout.push(firstAttack.id);

  // 残り5枠もHPを1以上残せる技からランダム選択
  while (newLoadout.length < 6) {
    buyRandomSkill();
  }

  enemyLoadout = newLoadout;
  enemyHp = remainingHp;

  return {
    hp: remainingHp,
    loadout: [...newLoadout]
  };
}

// ==============================
// バトル画面
// ==============================

function renderBattleSkillDisplay(activeIndex = -1) {
  battleSkillDisplay.innerHTML = "";

  loadout.forEach((skillId, index) => {
    const skill = getSkill(skillId);

    const item = document.createElement("div");
    item.className = "battle-skill";

    if (index === activeIndex) {
      item.classList.add("active");
    }

    item.textContent = `${index + 1}. ${skill ? skill.name : "空き"}`;
    battleSkillDisplay.appendChild(item);
  });
}

function updateBattleHp() {
  playerHp = Math.max(0, Math.min(MAX_HP, playerHp));
  enemyHp = Math.max(0, Math.min(MAX_HP, enemyHp));

  playerHpText.textContent = `${playerHp} / ${MAX_HP}`;
  enemyHpText.textContent = `${enemyHp} / ${MAX_HP}`;

  playerHpBar.style.width = `${playerHp / MAX_HP * 100}%`;
  enemyHpBar.style.width = `${enemyHp / MAX_HP * 100}%`;
}

function addLog(message) {
  battleLogEntries.push(message);

  if (battleLogEntries.length > 60) {
    battleLogEntries.shift();
  }

  battleLog.innerHTML = "";

  battleLogEntries.forEach(entry => {
    const line = document.createElement("div");
    line.className = "log-entry";
    line.textContent = entry;
    battleLog.appendChild(line);
  });

  battleLog.scrollTop = battleLog.scrollHeight;
}

function startBattle() {
  if (playerHp <= 0) return;

  if (loadout.length !== 6 || loadout.some(id => !getSkill(id))) {
    return;
  }

  // 毎回、敵がHP100から技を購入する
  generateEnemyLoadout();

  battleFinished = false;
  battleLogEntries = [];

  playerDie.textContent = "?";
  enemyDie.textContent = "?";

  rollButton.disabled = false;
  rollButton.classList.remove("hidden");
  backButton.classList.add("hidden");

  setupScreen.classList.add("hidden");
  battleScreen.classList.remove("hidden");

  gameHeader.classList.remove("setup-mode");
  gameHeader.classList.add("battle-mode");

  updateBattleHp();
  renderBattleSkillDisplay();

  battleLog.innerHTML = "";

  addLog("バトル開始！");
  addLog(`敵は技を購入した！ 残りHP：${enemyHp} / ${MAX_HP}`);

  // 敵の購入内容をログに表示
  const enemySkillNames = enemyLoadout.map((id, index) => {
    const skill = getSkill(id);
    return `${index + 1}番：${skill.name}（${skill.cost} HP）`;
  });

  addLog(`敵の技構成：${enemySkillNames.join("、")}`);
  addLog("サイコロを振って技を発動しよう。");
}

function takeTurn() {
  if (battleFinished) return;

  if (playerHp <= 0 || enemyHp <= 0) {
    finishBattle();
    return;
  }

  // サイコロの目は1〜6
  const playerRoll = Math.floor(Math.random() * 6) + 1;
  const enemyRoll = Math.floor(Math.random() * 6) + 1;

  const playerIndex = playerRoll - 1;
  const enemyIndex = enemyRoll - 1;

  const playerSkill = getSkill(loadout[playerIndex]);
  const enemySkill = getSkill(enemyLoadout[enemyIndex]);

  playerDie.textContent = playerRoll;
  enemyDie.textContent = enemyRoll;

  renderBattleSkillDisplay(playerIndex);

  addLog(`あなた：${playerRoll} → ${playerSkill.name}`);
  addLog(`敵：${enemyRoll} → ${enemySkill.name}`);

  let playerDamage = 0;
  let playerHeal = 0;
  let enemyDamage = 0;
  let enemyHeal = 0;

  // プレイヤーの技効果
  if (playerSkill.type === "damage") {
    enemyDamage = playerSkill.value;
  } else {
    playerHeal = playerSkill.value;
  }

  // 敵の技効果
  if (enemySkill.type === "damage") {
    playerDamage = enemySkill.value;
  } else {
    enemyHeal = enemySkill.value;
  }

  // お互いの攻撃・回復を同時に計算
  const playerHpAfterDamage = Math.max(0, playerHp - playerDamage);
  const enemyHpAfterDamage = Math.max(0, enemyHp - enemyDamage);

  playerHp = Math.min(MAX_HP, playerHpAfterDamage + playerHeal);
  enemyHp = Math.min(MAX_HP, enemyHpAfterDamage + enemyHeal);

  if (playerDamage > 0) {
    addLog(`あなたは ${playerDamage} ダメージを受けた！`);
  }

  if (playerHeal > 0) {
    const actualHeal = playerHp - playerHpAfterDamage;
    addLog(`あなたは ${actualHeal} 回復した！`);
  }

  if (enemyDamage > 0) {
    addLog(`敵に ${enemyDamage} ダメージ！`);
  }

  if (enemyHeal > 0) {
    const actualHeal = enemyHp - enemyHpAfterDamage;
    addLog(`敵は ${actualHeal} 回復した！`);
  }

  updateBattleHp();

  if (playerHp <= 0 || enemyHp <= 0) {
    finishBattle();
  }
}

function finishBattle() {
  if (battleFinished) return;

  battleFinished = true;
  rollButton.disabled = true;
  backButton.classList.remove("hidden");

  if (playerHp <= 0 && enemyHp <= 0) {
    addLog("引き分け！");
  } else if (enemyHp <= 0) {
    addLog("🎉 勝利！ おめでとう！");
  } else {
    addLog("敗北……次は頑張ろう！");
  }

  addLog(`あなたの残りHP：${playerHp} / ${MAX_HP}`);
  addLog(`敵の残りHP：${enemyHp} / ${MAX_HP}`);
}

// ==============================
// 準備画面に戻る
// ==============================

function returnToSetup() {
  // プレイヤー・敵ともにHPを初期化
  playerHp = MAX_HP;
  enemyHp = MAX_HP;

  // 購入した技も含めて初期状態に戻す
  inventory = { ...INITIAL_COUNTS };
  loadout = [...INITIAL_LOADOUT];
  enemyLoadout = [];

  selectedSkillId = null;
  selectedSlotIndex = null;
  battleFinished = false;
  battleLogEntries = [];

  battleScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");

  gameHeader.classList.remove("battle-mode");
  gameHeader.classList.add("setup-mode");

  updateSetupHp();
  renderShop();
  renderSlots();
  renderOwnedSkills();
  updateSelectedText();
}

// ==============================
// イベント設定・初期表示
// ==============================

startButton.addEventListener("click", startBattle);
rollButton.addEventListener("click", takeTurn);
backButton.addEventListener("click", returnToSetup);

updateSetupHp();
renderShop();
renderSlots();
renderOwnedSkills();
updateSelectedText();
