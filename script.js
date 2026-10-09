const MAX_HP = 100;

/*
  初期技は3個ずつ持っている。
  初期技以外は、購入1個につき装備できるのは1面。
*/

const SKILLS = [
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

/* 初期技の所持数は各3個 */
const INITIAL_COUNTS = {
  atk5: 3,
  heal5: 3
};

/* 所持技の個数を管理 */
let inventory = { ...INITIAL_COUNTS };

/* 初期スロット */
let loadout = [
  "atk5",
  "atk5",
  "atk5",
  "heal5",
  "heal5",
  "heal5"
];

let selectedOwned = null;
let playerHp = MAX_HP;
let enemyHp = MAX_HP;
let rolled = false;
let gameOver = false;

/* HTML要素 */
const setupScreen = document.getElementById("setupScreen");
const battleScreen = document.getElementById("battleScreen");
const setupHp = document.getElementById("setupHp");
const setupHpBar = document.getElementById("setupHpBar");
const shopList = document.getElementById("shopList");
const slotList = document.getElementById("slotList");
const ownedList = document.getElementById("ownedList");
const guide = document.getElementById("guide");
const startButton = document.getElementById("startButton");
const dice = document.getElementById("dice");
const battleSkill = document.getElementById("battleSkill");
const battleResult = document.getElementById("battleResult");
const rollButton = document.getElementById("rollButton");
const log = document.getElementById("log");

function getSkill(id) {
  return SKILLS.find(skill => skill.id === id);
}

function getCount(id) {
  return inventory[id] || 0;
}

/*
  いま装備されている数を数える。
*/
function getEquippedCount(id) {
  return loadout.filter(skillId => skillId === id).length;
}

/*
  あと何個装備できるか。
  初期技だけは初期所持数分の装備を維持できる。
*/
function getAvailableCount(id) {
  return Math.max(0, getCount(id) - getEquippedCount(id));
}

function updateTopHp() {
  setupHp.textContent = playerHp;
  setupHpBar.style.width =
    `${Math.max(0, Math.min(100, playerHp))}%`;
}

/* ショップ */
function renderShop() {
  shopList.innerHTML = "";

  SKILLS.forEach(skill => {
    const item = document.createElement("div");
    item.className = "skill-item";

    const info = document.createElement("div");
    info.className = "skill-info";

    const name = document.createElement("strong");
    name.textContent = skill.name;

    const description = document.createElement("small");

    if (skill.type === "damage") {
      description.textContent =
        `攻撃力 ${skill.value} ｜ 消費体力 ${skill.cost}`;
    } else {
      description.textContent =
        `回復量 ${skill.value} ｜ 消費体力 ${skill.cost}`;
    }

    info.append(name, description);

    const button = document.createElement("button");
    button.className = "buy-button";

    if (skill.cost === 0) {
      button.textContent = "初期技";
      button.disabled = true;
    } else {
      button.textContent = `購入 (${getCount(skill.id)}個)`;
      button.disabled =
        getCount(skill.id) > 0 || playerHp <= skill.cost;

      button.addEventListener("click", () => buySkill(skill.id));
    }

    item.append(info, button);
    shopList.appendChild(item);
  });
}

/* スロット */
function renderSlots() {
  slotList.innerHTML = "";

  loadout.forEach((skillId, index) => {
    const skill = getSkill(skillId);

    const item = document.createElement("div");
    item.className = "slot-item";

    if (selectedOwned !== null) {
      item.classList.add("selected");
    }

    const number = document.createElement("div");
    number.className = "slot-number";
    number.textContent = index + 1;

    const info = document.createElement("div");
    info.className = "slot-info";

    const name = document.createElement("span");
    name.className = "slot-name";
    name.textContent = skill.name;

    const effect = document.createElement("span");
    effect.className = "slot-effect";
    effect.textContent = skill.type === "damage"
      ? `${skill.value}ダメージ`
      : `${skill.value}回復`;

    info.append(name, effect);
    item.append(number, info);

    item.addEventListener("click", () => {
      if (selectedOwned === null) {
        guide.textContent =
          "先に所持技を選んでください。";
        return;
      }

      equipSkill(index);
    });

    slotList.appendChild(item);
  });
}

/* 所持技 */
function renderOwned() {
  ownedList.innerHTML = "";

  SKILLS.forEach(skill => {
    const count = getCount(skill.id);

    if (count <= 0) return;

    const item = document.createElement("div");
    item.className = "owned-item";

    if (selectedOwned === skill.id) {
      item.classList.add("selected");
    }

    if (getEquippedCount(skill.id) > 0) {
      item.classList.add("equipped");
    }

    const info = document.createElement("div");
    info.className = "owned-info";

    const name = document.createElement("strong");
    name.textContent = skill.name;

    const effect = document.createElement("small");
    effect.textContent = skill.type === "damage"
      ? `${skill.value}ダメージ`
      : `${skill.value}回復`;

    const status = document.createElement("span");
    status.className = "owned-status";

    const available = getAvailableCount(skill.id);

    status.textContent =
      `所持 ${count}個 ｜ 装備中 ${getEquippedCount(skill.id)}個 ｜ 残り ${available}個`;

    info.append(name, effect, status);
    item.appendChild(info);

    item.addEventListener("click", () => {
      if (available <= 0) {
        selectedOwned = null;
        guide.textContent =
          "その技は全部装備中です。別の技を選んでください。";
        renderOwned();
        renderSlots();
        return;
      }

      selectedOwned = skill.id;

      guide.textContent =
        `「${skill.name}」を選択中。装備したいスロットを押してください。`;

      renderOwned();
      renderSlots();
    });

    ownedList.appendChild(item);
  });
}

/* 技を購入 */
function buySkill(skillId) {
  const skill = getSkill(skillId);

  if (getCount(skillId) > 0) return;
  if (playerHp <= skill.cost) return;

  playerHp -= skill.cost;

  inventory[skillId] = getCount(skillId) + 1;
  selectedOwned = skillId;

  guide.textContent =
    `「${skill.name}」を購入！ 装備するスロットを選んでください。`;

  renderAll();
}

/* スロットに技を装備 */
function equipSkill(slotIndex) {
  if (selectedOwned === null) return;

  const newSkillId = selectedOwned;
  const oldSkillId = loadout[slotIndex];

  /*
    いったん対象スロットから外れる技の分を考慮する。
    変更後も所持数を超えないようにする。
  */
  const equippedElsewhere = loadout.filter(
    (id, index) => id === newSkillId && index !== slotIndex
  ).length;

  if (equippedElsewhere >= getCount(newSkillId)) {
    guide.textContent =
      "その技は所持数ぶん装備済みです。";
    return;
  }

  /*
    新しい技をセット。
    古い技はスロットから外れるので再び所持枠に戻る。
  */
  loadout[slotIndex] = newSkillId;

  selectedOwned = null;

  const newSkill = getSkill(newSkillId);

  guide.textContent =
    `サイコロ${slotIndex + 1}に「${newSkill.name}」を装備しました。`;

  renderAll();
}

function renderAll() {
  updateTopHp();
  renderShop();
  renderSlots();
  renderOwned();
}

/* バトル開始 */
function startBattle() {
  setupScreen.classList.add("hidden");
  battleScreen.classList.remove("hidden");

  enemyHp = MAX_HP;
  gameOver = false;
  rolled = false;

  document.getElementById("playerHp").textContent = playerHp;
  document.getElementById("enemyHp").textContent = enemyHp;

  updateBattleHp();
  renderBattleSlots();

  dice.textContent = "?";
  battleSkill.textContent = "サイコロを振ろう";
  battleResult.textContent = "出目に対応した技が発動します。";
  rollButton.disabled = false;
  log.innerHTML = "";

  addLog(`バトル開始！ あなたのHPは${playerHp}。`);
}

/* バトル用スロット */
function renderBattleSlots() {
  const container = document.getElementById("battleSlots");
  container.innerHTML = "";

  loadout.forEach((skillId, index) => {
    const skill = getSkill(skillId);

    const item = document.createElement("div");
    item.className = "battle-slot";

    const number = document.createElement("strong");
    number.textContent = index + 1;

    item.append(number, document.createTextNode(skill.name));
    container.appendChild(item);
  });
}

function updateBattleHp() {
  document.getElementById("playerHp").textContent = playerHp;
  document.getElementById("enemyHp").textContent = enemyHp;

  document.getElementById("playerHpBar").style.width =
    `${Math.max(0, playerHp)}%`;

  document.getElementById("enemyHpBar").style.width =
    `${Math.max(0, enemyHp)}%`;
}

/* プレイヤーのターン */
function rollDice() {
  if (rolled || gameOver) return;

  rolled = true;
  rollButton.disabled = true;

  const number = Math.floor(Math.random() * 6) + 1;
  const skill = getSkill(loadout[number - 1]);

  dice.textContent = number;
  battleSkill.textContent = `${skill.name} 発動！`;

  if (skill.type === "damage") {
    enemyHp = Math.max(0, enemyHp - skill.value);

    battleResult.textContent = `${skill.value}ダメージ！`;
    addLog(`あなた：${skill.name} → ${skill.value}ダメージ`);
  } else {
    const before = playerHp;
    playerHp = Math.min(MAX_HP, playerHp + skill.value);
    const healed = playerHp - before;

    battleResult.textContent = `${healed}回復！`;
    addLog(`あなた：${skill.name} → ${healed}回復`);
  }

  updateBattleHp();
  updateTopHp();

  if (enemyHp <= 0) {
    gameOver = true;
    battleResult.textContent = "🎉 勝利！";
    addLog("あなたの勝ち！");
    return;
  }

  setTimeout(enemyTurn, 650);
}

/* 相手のターン */
function enemyTurn() {
  if (gameOver) return;

  const enemyLoadout = [
    "atk5",
    "atk10",
    "atk20",
    "heal5",
    "heal10",
    "heal20"
  ];

  const number = Math.floor(Math.random() * 6);
  const skill = getSkill(enemyLoadout[number]);

  if (skill.type === "damage") {
    playerHp = Math.max(0, playerHp - skill.value);
    addLog(`相手：${skill.name} → ${skill.value}ダメージ`);
  } else {
    const before = enemyHp;
    enemyHp = Math.min(MAX_HP, enemyHp + skill.value);
    const healed = enemyHp - before;

    addLog(`相手：${skill.name} → ${healed}回復`);
  }

  updateBattleHp();
  updateTopHp();

  if (playerHp <= 0) {
    gameOver = true;
    battleResult.textContent = "敗北……";
    addLog("あなたの負け！");
    return;
  }

  rolled = false;
  rollButton.disabled = false;
  battleResult.textContent = "あなたのターン！";
}

/* ログ */
function addLog(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  log.prepend(entry);
}

/* 技構成画面に戻る */
document.getElementById("backButton").addEventListener("click", () => {
  battleScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");

  selectedOwned = null;

  renderAll();
});

startButton.addEventListener("click", startBattle);
rollButton.addEventListener("click", rollDice);

/* 初期表示 */
renderAll();