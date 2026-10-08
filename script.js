const MAX_HP = 60;

const SKILLS = [
  { id: "atk5",  name: "小突き",   type: "damage", value: 5,  cost: 0,  desc: "相手に5ダメージ" },
  { id: "atk10", name: "攻撃",     type: "damage", value: 10, cost: 5,  desc: "相手に10ダメージ" },
  { id: "atk15", name: "強攻撃",   type: "damage", value: 15, cost: 8,  desc: "相手に15ダメージ" },
  { id: "atk20", name: "重撃",     type: "damage", value: 20, cost: 12, desc: "相手に20ダメージ" },
  { id: "atk30", name: "大技",     type: "damage", value: 30, cost: 20, desc: "相手に30ダメージ" },
  { id: "heal5",  name: "小回復",   type: "heal",   value: 5,  cost: 0,  desc: "自分を5回復" },
  { id: "heal10", name: "回復",     type: "heal",   value: 10, cost: 5,  desc: "自分を10回復" },
  { id: "heal15", name: "大回復",   type: "heal",   value: 15, cost: 8,  desc: "自分を15回復" },
  { id: "heal20", name: "特大回復", type: "heal",   value: 20, cost: 12, desc: "自分を20回復" },
  { id: "heal30", name: "全力回復", type: "heal",   value: 30, cost: 20, desc: "自分を30回復" }
];

const initialLoadout = [
  "atk5", "atk5", "atk5",
  "heal5", "heal5", "heal5"
];

let selectedLoadout = [...initialLoadout];
let playerHp = MAX_HP;
let enemyHp = MAX_HP;
let rolled = false;
let gameOver = false;

const setupScreen = document.getElementById("setupScreen");
const battleScreen = document.getElementById("battleScreen");
const loadout = document.getElementById("loadout");
const skillCatalog = document.getElementById("skillCatalog");
const setupHp = document.getElementById("setupHp");
const remainingCost = document.getElementById("remainingCost");
const startButton = document.getElementById("startButton");

const dice = document.getElementById("dice");
const rolledSkill = document.getElementById("rolledSkill");
const rollButton = document.getElementById("rollButton");
const result = document.getElementById("result");
const log = document.getElementById("log");

function getSkill(id) {
  return SKILLS.find(skill => skill.id === id);
}

function getLoadoutCost() {
  return selectedLoadout.reduce((sum, id) => sum + getSkill(id).cost, 0);
}

function renderSetup() {
  const cost = getLoadoutCost();

  // 「強い技を装備するためにHPを払う」。
  // ただし現在HPが0以下になる構成は選べない。
  setupHp.textContent = MAX_HP - cost;
  remainingCost.textContent = cost;

  loadout.innerHTML = `
    <div class="loadout-grid">
      ${selectedLoadout.map((id, index) => {
        const skill = getSkill(id);
        return `
          <div class="die-slot">
            <span class="die-number">${index + 1}</span>
            <span class="die-skill">${skill.name}</span>
            <span class="die-cost">装備コスト ${skill.cost} HP</span>
            <button class="slot-button" data-slot="${index}">技を変更</button>
          </div>
        `;
      }).join("")}
    </div>
  `;

  document.querySelectorAll(".slot-button").forEach(button => {
    button.addEventListener("click", () => {
      const slot = Number(button.dataset.slot);
      const current = selectedLoadout[slot];

      // 変更対象を選んでもらうため、カタログ側を強調する。
      document.querySelectorAll(".skill-card").forEach(card => {
        card.classList.toggle("target-slot", true);
        card.querySelector("button").textContent = "この面に装備";
        card.querySelector("button").onclick = () => equipSkill(slot, card.dataset.skill);
      });

      result.textContent = `サイコロ${slot + 1}面に装備する技を選んでください。現在：${getSkill(current).name}`;
    });
  });

  renderCatalog();
  startButton.disabled = cost >= MAX_HP;
}

function renderCatalog() {
  skillCatalog.innerHTML = SKILLS.map(skill => `
    <div class="skill-card" data-skill="${skill.id}">
      <div class="skill-info">
        <strong>${skill.name}</strong>
        <small>${skill.desc} / 装備コスト ${skill.cost} HP</small>
      </div>
      <button>面を選んで装備</button>
    </div>
  `).join("");
}

function equipSkill(slot, skillId) {
  const oldSkill = getSkill(selectedLoadout[slot]);
  const newSkill = getSkill(skillId);

  // 現在の構成から差し替えたときの総コスト。
  const newCost = getLoadoutCost() - oldSkill.cost + newSkill.cost;

  if (newCost >= MAX_HP) {
    result.textContent = "その構成はHPを使い切るので装備できません。";
    return;
  }

  selectedLoadout[slot] = skillId;
  result.textContent = `サイコロ${slot + 1} → ${newSkill.name} を装備！`;
  renderSetup();
}

function renderBattleLoadout() {
  document.getElementById("battleLoadout").innerHTML =
    selectedLoadout.map((id, index) => {
      const skill = getSkill(id);
      return `
        <div class="mini-die">
          <strong>${index + 1}</strong>
          ${skill.name}
        </div>
      `;
    }).join("");
}

function updateUI() {
  document.getElementById("playerHp").textContent = playerHp;
  document.getElementById("enemyHp").textContent = enemyHp;

  document.getElementById("playerHpBar").style.width =
    `${(playerHp / MAX_HP) * 100}%`;
  document.getElementById("enemyHpBar").style.width =
    `${(enemyHp / MAX_HP) * 100}%`;
}

function startBattle() {
  if (getLoadoutCost() >= MAX_HP) return;

  playerHp = MAX_HP - getLoadoutCost();
  enemyHp = MAX_HP;
  rolled = false;
  gameOver = false;

  setupScreen.classList.add("hidden");
  battleScreen.classList.remove("hidden");

  renderBattleLoadout();
  updateUI();

  dice.textContent = "?";
  rolledSkill.textContent = "サイコロを振ろう";
  result.textContent = "出目によって装備した技が発動する！";
  rollButton.disabled = false;
  log.innerHTML = "";
  addLog(`バトル開始！ 初期HPは ${playerHp}。`);
}

function rollDice() {
  if (rolled || gameOver) return;

  rolled = true;
  rollButton.disabled = true;

  const value = Math.floor(Math.random() * 6) + 1;
  const skill = getSkill(selectedLoadout[value - 1]);

  dice.textContent = value;
  rolledSkill.textContent = `「${skill.name}」発動！`;

  useSkill(skill, "あなた");

  if (enemyHp <= 0) {
    finishBattle(true);
    return;
  }

  updateUI();
  setTimeout(enemyTurn, 700);
}

function useSkill(skill, owner) {
  if (skill.type === "damage") {
    if (owner === "あなた") {
      enemyHp = Math.max(0, enemyHp - skill.value);
      addLog(`あなた：${skill.name} → 相手に ${skill.value}ダメージ！`);
      result.textContent = `${skill.name}で ${skill.value} ダメージ！`;
    } else {
      playerHp = Math.max(0, playerHp - skill.value);
      addLog(`相手：${skill.name} → あなたに ${skill.value}ダメージ！`);
    }
  } else {
    if (owner === "あなた") {
      const before = playerHp;
      playerHp = Math.min(MAX_HP, playerHp + skill.value);
      const healed = playerHp - before;
      addLog(`あなた：${skill.name} → HPが ${healed} 回復！`);
      result.textContent = `${skill.name}で ${healed} 回復！`;
    } else {
      const before = enemyHp;
      enemyHp = Math.min(MAX_HP, enemyHp + skill.value);
      const healed = enemyHp - before;
      addLog(`相手：${skill.name} → 相手のHPが ${healed} 回復。`);
    }
  }

  updateUI();
}

function enemyTurn() {
  if (gameOver) return;

  // 相手は「初期状態」として、攻撃3・回復3を基本に、
  // 残りHPに応じて少しだけ強い技を選ぶ。
  const enemyLoadout = [
    "atk5", "atk10", "atk15",
    "heal5", "heal10", "heal15"
  ];

  const skill = getSkill(enemyLoadout[Math.floor(Math.random() * 6)]);
  useSkill(skill, "相手");

  if (playerHp <= 0) {
    finishBattle(false);
    return;
  }

  rolled = false;
  rollButton.disabled = false;
  result.textContent = "あなたのターン！";
}

function finishBattle(win) {
  gameOver = true;
  rollButton.disabled = true;

  if (win) {
    result.textContent = "🎉 勝利！";
    addLog("あなたの勝ち！");
  } else {
    result.textContent = "💥 敗北……";
    addLog("あなたの負け！");
  }

  updateUI();
}

function addLog(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  log.prepend(entry);
}

function backToSetup() {
  battleScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
  renderSetup();
}

startButton.addEventListener("click", startBattle);
rollButton.addEventListener("click", rollDice);
document.getElementById("backButton").addEventListener("click", backToSetup);

renderSetup();
