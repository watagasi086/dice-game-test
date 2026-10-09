
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

const enemyLoadout = [
  "atk5", "atk10", "atk20",
  "heal5", "heal10", "heal20"
];

let playerHp = MAX_HP;
let enemyHp = MAX_HP;

let inventory = { ...INITIAL_COUNTS };
let loadout = [...INITIAL_LOADOUT];

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
  if (skill.type === "damage") {
    return `${skill.value}ダメージ`;
  }

  return `${skill.value}回復`;
}

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

    if (skill.cost === 0) {
      detail.textContent = `${getSkillDescription(skill)}・初期技`;
    } else {
      detail.textContent =
        `${getSkillDescription(skill)}・購入費用 ${skill.cost} HP`;
    }

    info.append(name, detail);

    const button = document.createElement("button");
    button.className = "small-button";

    if (skill.cost === 0) {
      button.textContent = "初期技";
      button.disabled = true;
    } else {
      button.textContent = "購入";
      button.disabled = playerHp < skill.cost;
      button.addEventListener("click", () => buySkill(skill.id));
    }

    item.append(info, button);
    shopList.appendChild(item);
  });
}

function getEquippedCount(skillId) {
  return loadout.filter(id => id === skillId).length;
}

function getAvailableCount(skillId) {
  const total = inventory[skillId] || 0;
  const equipped = getEquippedCount(skillId);

  return Math.max(0, total - equipped);
}

function buySkill(skillId) {
  const skill = getSkill(skillId);

  if (!skill || skill.cost <= 0) return;
  if (playerHp < skill.cost) return;

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

  const ownedSkills = skills.filter(skill =>
    (inventory[skill.id] || 0) > 0
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
  if (!skill) return;

  const currentSkillId = loadout[slotIndex];

  // すでにセットされている技なら変更しない
  if (currentSkillId === skillId) return;

  // 所持数から見て、別のスロットで使っている技を
  // 移動する場合も含めてセット可能か確認する
  const available = getAvailableCount(skillId);

  if (available <= 0) {
    const anotherSlot = loadout.findIndex(
      (id, index) => id === skillId && index !== slotIndex
    );

    if (anotherSlot === -1) return;

    // 別スロットから技を移動
    loadout[anotherSlot] = currentSkillId;
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

  if (current) {
    selectedSkillText.textContent =
      `スロット ${selectedSlotIndex + 1} を選択中（現在：${current.name}）`;
  } else {
    selectedSkillText.textContent =
      `スロット ${selectedSlotIndex + 1} を選択中`;
  }
}

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

  // ログが増えすぎないように直近の内容を保持
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

  enemyHp = MAX_HP;
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
  addLog("サイコロを振って技を発動しよう。");
}

function takeTurn() {
  if (battleFinished) return;

  if (playerHp <= 0 || enemyHp <= 0) {
    finishBattle();
    return;
  }

  // 1〜6の目を振る
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

  // お互いの行動を計算する
  // 同じターンで両者が行動できるよう、HP変化を先に計算
  let playerDamage = 0;
  let playerHeal = 0;
  let enemyDamage = 0;
  let enemyHeal = 0;

  if (playerSkill.type === "damage") {
    enemyDamage = playerSkill.value;
  } else {
    playerHeal = playerSkill.value;
  }

  if (enemySkill.type === "damage") {
    playerDamage = enemySkill.value;
  } else {
    enemyHeal = enemySkill.value;
  }

  const oldPlayerHp = playerHp;
  const oldEnemyHp = enemyHp;

  playerHp = Math.min(MAX_HP, playerHp - playerDamage + playerHeal);
  enemyHp = Math.min(MAX_HP, enemyHp - enemyDamage + enemyHeal);

  playerHp = Math.max(0, playerHp);
  enemyHp = Math.max(0, enemyHp);

  if (playerDamage > 0) {
    addLog(`あなたは ${playerDamage} ダメージを受けた！`);
  }

  if (playerHeal > 0) {
    const actualHeal = playerHp - Math.max(0, oldPlayerHp - playerDamage);
    addLog(`あなたは ${Math.max(0, actualHeal)} 回復した！`);
  }

  if (enemyDamage > 0) {
    addLog(`敵に ${enemyDamage} ダメージ！`);
  }

  if (enemyHeal > 0) {
    const actualHeal = enemyHp - Math.max(0, oldEnemyHp - enemyDamage);
    addLog(`敵は ${Math.max(0, actualHeal)} 回復した！`);
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
}

function returnToSetup() {
  // ★ Ver. 1.6：技構成を初期状態に戻す
  // 購入した技の所持数と残りHPは維持する
  loadout = [...INITIAL_LOADOUT];

  // 選択状態もリセット
  selectedSkillId = null;
  selectedSlotIndex = null;

  battleScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");

  gameHeader.classList.remove("battle-mode");
  gameHeader.classList.add("setup-mode");

  // 戦闘後の残りHPをそのまま表示
  updateSetupHp();

  renderShop();
  renderSlots();
  renderOwnedSkills();
  updateSelectedText();
}

startButton.addEventListener("click", startBattle);
rollButton.addEventListener("click", takeTurn);
backButton.addEventListener("click", returnToSetup);

// 初期表示
updateSetupHp();
renderShop();
renderSlots();
renderOwnedSkills();
updateSelectedText();
