
const MAX_HP = 100;
const VERSION = "1.4";

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

// 初期装備は小攻撃3個、小回復3個
const INITIAL_COUNTS = {
  atk5: 3,
  heal5: 3
};

// 相手の装備
const enemyLoadout = [
  "atk5",
  "atk10",
  "atk20",
  "heal5",
  "heal10",
  "heal20"
];

let playerHp = MAX_HP;
let enemyHp = MAX_HP;

let inventory = { ...INITIAL_COUNTS };
let loadout = [
  "atk5",
  "atk5",
  "atk5",
  "heal5",
  "heal5",
  "heal5"
];

let selectedSkillId = null;
let selectedSlotIndex = null;
let battleFinished = false;
let battleLogEntries = [];

const setupScreen = document.getElementById("setupScreen");
const battleScreen = document.getElementById("battleScreen");

const setupHpText = document.getElementById("setupHpText");
const setupHpBar = document.getElementById("setupHpBar");

const shopList = document.getElementById("shopList");
const battleSlots = document.getElementById("battleSlots");
const ownedList = document.getElementById("ownedList");
const selectedSkillText = document.getElementById("selectedSkillText");

const startButton = document.getElementById("startButton");
const rollButton = document.getElementById("rollButton");
const backButton = document.getElementById("backButton");

const playerHpText = document.getElementById("playerHpText");
const playerHpBar = document.getElementById("playerHpBar");
const enemyHpText = document.getElementById("enemyHpText");
const enemyHpBar = document.getElementById("enemyHpBar");

const playerDie = document.getElementById("playerDie");
const enemyDie = document.getElementById("enemyDie");
const playerAction = document.getElementById("playerAction");
const enemyAction = document.getElementById("enemyAction");

const battleSkillDisplay = document.getElementById("battleSkillDisplay");
const battleLog = document.getElementById("battleLog");

function getSkill(id) {
  return skills.find(skill => skill.id === id);
}

function getInventoryCount(id) {
  return inventory[id] || 0;
}

function getEquippedCount(id) {
  return loadout.filter(skillId => skillId === id).length;
}

function getAvailableCount(id) {
  return Math.max(0, getInventoryCount(id) - getEquippedCount(id));
}

function getEffectText(skill) {
  if (skill.type === "damage") {
    return `${skill.value}ダメージ`;
  }

  return `${skill.value}回復`;
}

function getSkillDetail(skill) {
  return `${getEffectText(skill)} / 購入${skill.cost}HP`;
}

function updateSetupHp() {
  setupHpText.textContent = `${playerHp} / ${MAX_HP}`;
  setupHpBar.style.width = `${Math.max(0, playerHp) / MAX_HP * 100}%`;
  startButton.disabled = playerHp <= 0;

  if (playerHp <= 0) {
    startButton.textContent = "体力が足りない！";
  } else {
    startButton.textContent = "バトル開始！";
  }
}

function renderShop() {
  shopList.innerHTML = "";

  skills.forEach(skill => {
    const item = document.createElement("div");
    item.className = "shop-item";

    const info = document.createElement("div");
    info.className = "skill-info";

    const name = document.createElement("div");
    name.className = "skill-name";
    name.textContent = skill.name;

    const detail = document.createElement("div");
    detail.className = "skill-detail";
    detail.textContent = skill.cost === 0
      ? `${getEffectText(skill)} / 初期技`
      : `${getEffectText(skill)} / ${skill.cost}HP消費`;

    info.append(name, detail);

    const button = document.createElement("button");
    button.className = "buy-button";

    if (skill.cost === 0) {
      button.textContent = "初期技";
      button.disabled = true;
      button.title = "最初から所持している技です";
    } else {
      button.textContent = `購入 ${skill.cost}HP`;
      button.disabled = playerHp < skill.cost;

      button.addEventListener("click", () => {
        buySkill(skill.id);
      });
    }

    item.append(info, button);
    shopList.appendChild(item);
  });
}

function buySkill(id) {
  const skill = getSkill(id);

  if (!skill || skill.cost <= 0) return;

  if (playerHp < skill.cost) {
    alert("体力が足りないで！");
    return;
  }

  playerHp -= skill.cost;
  inventory[id] = getInventoryCount(id) + 1;

  updateSetupHp();
  renderShop();
  renderSlots();
  renderOwnedSkills();

  selectedSkillId = id;
  updateSelectedText();

  alert(`${skill.name}を購入したで！\n残り体力：${playerHp}`);
}

function renderSlots() {
  battleSlots.innerHTML = "";

  loadout.forEach((skillId, index) => {
    const skill = skillId ? getSkill(skillId) : null;

    const button = document.createElement("button");
    button.className = "slot";

    if (selectedSlotIndex === index) {
      button.classList.add("selected");
    }

    const number = document.createElement("span");
    number.className = "slot-number";
    number.textContent = `出目 ${index + 1}`;

    const name = document.createElement("span");
    name.className = "slot-name";
    name.textContent = skill ? skill.name : "未装備";

    const detail = document.createElement("span");
    detail.className = "slot-detail";
    detail.textContent = skill ? getEffectText(skill) : "空き枠";

    button.append(number, name, detail);

    button.addEventListener("click", () => {
      handleSlotClick(index);
    });

    battleSlots.appendChild(button);
  });
}

function renderOwnedSkills() {
  ownedList.innerHTML = "";

  skills.forEach(skill => {
    const total = getInventoryCount(skill.id);

    if (total <= 0) return;

    const available = getAvailableCount(skill.id);
    const equipped = getEquippedCount(skill.id);

    const button = document.createElement("button");
    button.className = "owned-skill";

    if (selectedSkillId === skill.id) {
      button.classList.add("selected");
    }

    const name = document.createElement("div");
    name.className = "skill-name";
    name.textContent = skill.name;

    const detail = document.createElement("div");
    detail.className = "skill-detail";
    detail.textContent = getEffectText(skill);

    const count = document.createElement("span");
    count.className = "owned-count";
    count.textContent = `所持 ${total}個 / 装備中 ${equipped}個 / 空き ${available}個`;

    button.append(name, detail, count);

    // すでに装備中の技も選択可能。
    // 装備枠を移動したいときにも使える。
    button.addEventListener("click", () => {
      selectedSkillId = skill.id;
      updateSelectedText();
      renderSlots();
      renderOwnedSkills();
    });

    ownedList.appendChild(button);
  });
}

function updateSelectedText() {
  if (!selectedSkillId) {
    selectedSkillText.textContent = "装備したい技を選択してな";
    return;
  }

  const skill = getSkill(selectedSkillId);

  if (!skill) {
    selectedSkillText.textContent = "装備したい技を選択してな";
    return;
  }

  selectedSkillText.textContent =
    `選択中：${skill.name} → 装備したい枠を押してな`;
}

function handleSlotClick(slotIndex) {
  selectedSlotIndex = slotIndex;

  if (!selectedSkillId) {
    renderSlots();
    selectedSkillText.textContent =
      `出目${slotIndex + 1}を選択中。先に所持技を押してな！`;
    return;
  }

  equipSkill(slotIndex, selectedSkillId);
}

function equipSkill(slotIndex, skillId) {
  const skill = getSkill(skillId);

  if (!skill || getInventoryCount(skillId) <= 0) {
    alert("その技は所持していないで！");
    return;
  }

  // 装備先の枠にある技はいったん外した扱いにする
  const nextLoadout = [...loadout];
  nextLoadout[slotIndex] = null;

  // 装備先以外に同じ技が何個装備されているか確認
  const equippedElsewhere = nextLoadout.filter(
    id => id === skillId
  ).length;

  if (equippedElsewhere >= getInventoryCount(skillId)) {
    // 所持数が足りなければ、別の枠から同じ技を1個移動する
    const oldIndex = nextLoadout.findIndex(id => id === skillId);

    if (oldIndex === -1) {
      alert("その技はほかの枠に装備中やで！");
      return;
    }

    nextLoadout[oldIndex] = null;
  }

  nextLoadout[slotIndex] = skillId;
  loadout = nextLoadout;

  selectedSlotIndex = slotIndex;

  renderSlots();
  renderOwnedSkills();
  updateSelectedText();
}

function renderBattleSkillDisplay() {
  battleSkillDisplay.innerHTML = "";

  loadout.forEach((skillId, index) => {
    const skill = skillId ? getSkill(skillId) : null;

    const item = document.createElement("div");
    item.className = "battle-skill";

    const number = document.createElement("strong");
    number.textContent = `出目 ${index + 1}`;

    const name = document.createElement("span");
    name.textContent = skill ? skill.name : "未装備";

    item.append(number, name);
    battleSkillDisplay.appendChild(item);
  });
}

function updateBattleHp() {
  playerHpText.textContent = `${playerHp} / ${MAX_HP} HP`;
  playerHpBar.style.width =
    `${Math.max(0, playerHp) / MAX_HP * 100}%`;

  enemyHpText.textContent = `${enemyHp} / ${MAX_HP} HP`;
  enemyHpBar.style.width =
    `${Math.max(0, enemyHp) / MAX_HP * 100}%`;
}

function addLog(message) {
  battleLogEntries.unshift(message);
  battleLogEntries = battleLogEntries.slice(0, 30);

  battleLog.innerHTML = "";

  battleLogEntries.forEach((entry, index) => {
    const line = document.createElement("div");
    line.textContent = entry;

    if (index === 0) {
      line.className = "latest";
    }

    battleLog.appendChild(line);
  });
}

function rollDice() {
  return Math.floor(Math.random() * 6);
}

function applySkill(skill, isPlayer) {
  if (!skill) {
    return {
      text: "未装備",
      log: isPlayer
        ? "あなたは技を装備していない！"
        : "相手は技を装備していない！"
    };
  }

  const actor = isPlayer ? "あなた" : "相手";

  if (skill.type === "damage") {
    if (isPlayer) {
      enemyHp = Math.max(0, enemyHp - skill.value);
    } else {
      playerHp = Math.max(0, playerHp - skill.value);
    }

    return {
      text: `${skill.name}！`,
      log: `${actor}の${skill.name}！ ${skill.value}ダメージ！`
    };
  }

  if (isPlayer) {
    const before = playerHp;
    playerHp = Math.min(MAX_HP, playerHp + skill.value);
    const healed = playerHp - before;

    return {
      text: `${skill.name}！`,
      log: `あなたの${skill.name}！ HPが${healed}回復！`
    };
  }

  const before = enemyHp;
  enemyHp = Math.min(MAX_HP, enemyHp + skill.value);
  const healed = enemyHp - before;

  return {
    text: `${skill.name}！`,
    log: `相手の${skill.name}！ HPが${healed}回復！`
  };
}

function startBattle() {
  if (playerHp <= 0) {
    alert("体力が0やで！準備画面で体力を回復できるようにしてから挑戦しよう。");
    return;
  }

  if (loadout.some(id => !id)) {
    alert("まだ空いている装備枠があるで！");
    return;
  }

  enemyHp = MAX_HP;
  battleFinished = false;
  battleLogEntries = [];

  setupScreen.classList.add("hidden");
  battleScreen.classList.remove("hidden");

  // バトル画面には準備画面のHPゲージを表示しない
  updateBattleHp();
  renderBattleSkillDisplay();

  playerDie.textContent = "🎲";
  enemyDie.textContent = "🎲";
  playerAction.textContent = "準備OK！";
  enemyAction.textContent = "相手を待っている…";

  rollButton.disabled = false;
  rollButton.textContent = "サイコロを振る！";

  addLog("バトル開始！");
  addLog(`あなたのHP：${playerHp} / ${MAX_HP}`);
  addLog(`相手のHP：${enemyHp} / ${MAX_HP}`);
}

function finishBattle() {
  battleFinished = true;
  rollButton.disabled = true;

  if (playerHp <= 0 && enemyHp <= 0) {
    addLog("引き分け！両者とも体力が尽きた！");
    rollButton.textContent = "引き分け！";
  } else if (enemyHp <= 0) {
    addLog("🎉 あなたの勝利！");
    rollButton.textContent = "勝利！";
  } else {
    addLog("💥 あなたの敗北…");
    rollButton.textContent = "敗北…";
  }
}

function takeTurn() {
  if (battleFinished) return;

  const playerIndex = rollDice();
  const enemyIndex = rollDice();

  const playerSkill = getSkill(loadout[playerIndex]);
  const enemySkill = getSkill(enemyLoadout[enemyIndex]);

  playerDie.textContent = `🎲 ${playerIndex + 1}`;
  enemyDie.textContent = `🎲 ${enemyIndex + 1}`;

  const playerResult = applySkill(playerSkill, true);
  const enemyResult = applySkill(enemySkill, false);

  playerAction.textContent = playerResult.text;
  enemyAction.textContent = enemyResult.text;

  addLog(
    `あなた：出目${playerIndex + 1} → ${playerResult.log}`
  );
  addLog(
    `相手：出目${enemyIndex + 1} → ${enemyResult.log}`
  );

  updateBattleHp();

  if (playerHp <= 0 || enemyHp <= 0) {
    finishBattle();
  }
}

function returnToSetup() {
  battleScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");

  // バトルで残ったHPをそのまま準備画面に引き継ぐ
  updateSetupHp();
  renderShop();
  renderSlots();
  renderOwnedSkills();
  updateSelectedText();
}

// ボタン操作
startButton.addEventListener("click", startBattle);
rollButton.addEventListener("click", takeTurn);
backButton.addEventListener("click", returnToSetup);

// 初期表示
updateSetupHp();
renderShop();
renderSlots();
renderOwnedSkills();
updateSelectedText();
