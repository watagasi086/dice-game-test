
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
let enemyLoadout = [];

let selectedSkillId = null;
let selectedSlotIndex = null;

let battleFinished = false;
let battleLogEntries = [];

// 先攻後攻システム
let firstTurn = "player";
let currentTurn = "player";
let enemyActionPending = false;

// HTML要素
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

const turnStatus = document.getElementById("turnStatus");
const turnDescription = document.getElementById("turnDescription");

const battleSkillDisplay = document.getElementById("battleSkillDisplay");
const rollButton = document.getElementById("rollButton");
const battleLog = document.getElementById("battleLog");
const backButton = document.getElementById("backButton");

// ==============================
// 共通処理
// ==============================

function getSkill(id) {
  return skills.find(skill => skill.id === id);
}

function getSkillDescription(skill) {
  return skill.type === "damage"
    ? `${skill.value}ダメージ`
    : `${skill.value}回復`;
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

// ==============================
// 準備画面
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

      // 購入後にHPが0になる場合は買えない
      button.disabled = playerHp <= skill.cost;

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

  if (!skill || skill.cost <= 0 || playerHp <= skill.cost) {
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
// 敵の技購入システム
// ==============================

function generateEnemyLoadout() {
  let remainingHp = MAX_HP;
  const newLoadout = [];

  function getAffordableSkills() {
    return skills.filter(skill => skill.cost < remainingHp);
  }

  function buyRandomSkill() {
    const affordable = getAffordableSkills();
    const skill =
      affordable[Math.floor(Math.random() * affordable.length)];

    remainingHp -= skill.cost;
    newLoadout.push(skill.id);
  }

  // 最低1つは攻撃技を入れる
  const attacks = skills.filter(
    skill => skill.type === "damage" && skill.cost < remainingHp
  );

  const firstAttack =
    attacks[Math.floor(Math.random() * attacks.length)];

  remainingHp -= firstAttack.cost;
  newLoadout.push(firstAttack.id);

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
// バトル画面・HP表示
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

  playerHpBar.style.background =
    playerHp <= 25 ? "#ff6b79" :
    playerHp <= 50 ? "#ffcf70" : "#4bd69a";

  enemyHpBar.style.background =
    enemyHp <= 25 ? "#ff6b79" : "#e65c70";
}

function addLog(message) {
  battleLogEntries.push(message);

  if (battleLogEntries.length > 100) {
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

// ==============================
// 先攻・後攻判定
// ==============================

function startBattle() {
  if (playerHp <= 0) return;

  if (loadout.length !== 6 || loadout.some(id => !getSkill(id))) {
    return;
  }

  // 敵が技を購入する
  generateEnemyLoadout();

  battleFinished = false;
  enemyActionPending = false;
  battleLogEntries = [];

  // 選んだ奇数・偶数を取得
  const choice = document.querySelector(
    'input[name="parityChoice"]:checked'
  ).value;

  // 判定用ダイス
  const parityRoll = rollDie();
  const result = parityRoll % 2 === 0 ? "even" : "odd";
  const isCorrect = choice === result;

  firstTurn = isCorrect ? "player" : "enemy";
  currentTurn = firstTurn;

  playerDie.textContent = parityRoll;
  enemyDie.textContent = "?";

  setupScreen.classList.add("hidden");
  battleScreen.classList.remove("hidden");

  gameHeader.classList.remove("setup-mode");
  gameHeader.classList.add("battle-mode");

  backButton.classList.add("hidden");
  rollButton.classList.remove("hidden");

  updateBattleHp();
  renderBattleSkillDisplay();

  addLog("バトル開始！");
  addLog(`敵は技を購入した！ 残りHP：${enemyHp} / ${MAX_HP}`);

  const enemySkillNames = enemyLoadout.map((id, index) => {
    const skill = getSkill(id);
    return `${index + 1}番：${skill.name}（${skill.cost} HP）`;
  });

  addLog(`敵の技構成：${enemySkillNames.join("、")}`);
  addLog(`先攻判定：ダイスは ${parityRoll}（${result === "odd" ? "奇数" : "偶数"}）！`);

  if (isCorrect) {
    addLog("予想的中！ あなたが先攻！");
  } else {
    addLog("予想は外れた……敵が先攻！");
  }

  addLog("先攻側から交互に行動する！");

  if (firstTurn === "player") {
    setPlayerTurn();
  } else {
    setEnemyTurn();
    enemyActionPending = true;

    // 敵が先攻なら自動で行動
    rollButton.disabled = true;
    setTimeout(() => {
      enemyActionPending = false;
      enemyTurn();
    }, 700);
  }
}

// ==============================
// ターン表示
// ==============================

function setPlayerTurn() {
  if (battleFinished) return;

  currentTurn = "player";
  turnStatus.textContent = "あなたのターン！";
  turnDescription.textContent = "ダイスを振って技を発動しよう。";
  rollButton.textContent = "🎲 ダイスを振る";
  rollButton.disabled = false;
}

function setEnemyTurn() {
  if (battleFinished) return;

  currentTurn = "enemy";
  turnStatus.textContent = "敵のターン……";
  turnDescription.textContent = "敵がダイスを振っている……";
  rollButton.textContent = "敵の行動中……";
  rollButton.disabled = true;
}

// ==============================
// 技の発動処理
// ==============================

function useSkill(side, skill, roll) {
  if (!skill) return;

  const isPlayer = side === "player";
  const actorName = isPlayer ? "あなた" : "敵";
  const targetName = isPlayer ? "敵" : "あなた";

  const oldHp = isPlayer ? playerHp : enemyHp;
  const targetOldHp = isPlayer ? enemyHp : playerHp;

  if (isPlayer) {
    playerDie.textContent = roll;
  } else {
    enemyDie.textContent = roll;
  }

  addLog(`${actorName}：${roll} → ${skill.name}`);

  if (skill.type === "damage") {
    if (isPlayer) {
      enemyHp = Math.max(0, enemyHp - skill.value);
    } else {
      playerHp = Math.max(0, playerHp - skill.value);
    }

    addLog(`${targetName}に ${skill.value} ダメージ！`);
  } else {
    if (isPlayer) {
      playerHp = Math.min(MAX_HP, playerHp + skill.value);
      addLog(`あなたは ${playerHp - oldHp} 回復した！`);
    } else {
      enemyHp = Math.min(MAX_HP, enemyHp + skill.value);
      addLog(`敵は ${enemyHp - oldHp} 回復した！`);
    }
  }

  updateBattleHp();

  // 倒されたら後攻側は行動しない
  if (playerHp <= 0 || enemyHp <= 0) {
    finishBattle();
    return;
  }

  if (isPlayer) {
    // プレイヤーの行動後、敵が自動で行動する
    setEnemyTurn();
    enemyActionPending = true;

    setTimeout(() => {
      enemyActionPending = false;
      enemyTurn();
    }, 700);
  } else {
    // 敵の行動後、プレイヤーのターンへ
    addLog("あなたのターン！");
    setPlayerTurn();
  }
}

// ==============================
// プレイヤーのターン
// ==============================

function takeTurn() {
  if (
    battleFinished ||
    currentTurn !== "player" ||
    enemyActionPending
  ) {
    return;
  }

  const roll = rollDie();
  const skill = getSkill(loadout[roll - 1]);

  renderBattleSkillDisplay(roll - 1);
  useSkill("player", skill, roll);
}

// ==============================
// 敵のターン
// ==============================

function enemyTurn() {
  if (battleFinished || currentTurn !== "enemy") {
    return;
  }

  if (playerHp <= 0 || enemyHp <= 0) {
    finishBattle();
    return;
  }

  const roll = rollDie();
  const skill = getSkill(enemyLoadout[roll - 1]);

  addLog("敵が行動！");
  useSkill("enemy", skill, roll);
}

// ==============================
// 勝敗判定
// ==============================

function finishBattle() {
  if (battleFinished) return;

  battleFinished = true;
  enemyActionPending = false;

  rollButton.disabled = true;
  rollButton.textContent = "バトル終了";
  backButton.classList.remove("hidden");

  turnStatus.textContent = "バトル終了！";
  turnDescription.textContent = "お疲れさま！";

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
  playerHp = MAX_HP;
  enemyHp = MAX_HP;

  inventory = { ...INITIAL_COUNTS };
  loadout = [...INITIAL_LOADOUT];
  enemyLoadout = [];

  selectedSkillId = null;
  selectedSlotIndex = null;

  battleFinished = false;
  battleLogEntries = [];
  enemyActionPending = false;
  firstTurn = "player";
  currentTurn = "player";

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
