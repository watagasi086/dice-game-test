const MAX_HP = 60;

let playerHp = MAX_HP;
let enemyHp = MAX_HP;
let rolled = false;
let gameOver = false;

// 初期技 + HPを払って取得する技
const skills = [
  { id: 1, name: "ちょい攻撃", type: "damage", value: 10, cost: 0, owned: true },
  { id: 2, name: "強打", type: "damage", value: 20, cost: 5, owned: false },
  { id: 3, name: "超強打", type: "damage", value: 30, cost: 15, owned: false },
  { id: 4, name: "小回復", type: "heal", value: 10, cost: 0, owned: true },
  { id: 5, name: "回復", type: "heal", value: 20, cost: 5, owned: false },
  { id: 6, name: "大回復", type: "heal", value: 30, cost: 15, owned: false }
];

const diceActions = {
  1: { type: "damage", value: 10, name: "攻撃 10" },
  2: { type: "damage", value: 20, name: "攻撃 20" },
  3: { type: "damage", value: 30, name: "攻撃 30" },
  4: { type: "heal", value: 10, name: "回復 10" },
  5: { type: "heal", value: 20, name: "回復 20" },
  6: { type: "heal", value: 30, name: "回復 30" }
};

const dice = document.getElementById("dice");
const rollButton = document.getElementById("rollButton");
const result = document.getElementById("result");
const skillList = document.getElementById("skillList");
const log = document.getElementById("log");

function updateUI() {
  document.getElementById("playerHp").textContent = playerHp;
  document.getElementById("enemyHp").textContent = enemyHp;

  document.getElementById("playerHpBar").style.width =
    `${(playerHp / MAX_HP) * 100}%`;
  document.getElementById("enemyHpBar").style.width =
    `${(enemyHp / MAX_HP) * 100}%`;

  renderSkills();
}

function renderSkills() {
  skillList.innerHTML = "";

  skills.forEach(skill => {
    const div = document.createElement("div");
    div.className = "skill";

    const description =
      skill.type === "damage"
        ? `相手に ${skill.value} ダメージ`
        : `自分を ${skill.value} 回復`;

    div.innerHTML = `
      <div>
        <strong>${skill.name}</strong>
        <small>${description} / 取得コスト: ${skill.cost} HP</small>
      </div>
      <button ${skill.owned || playerHp <= skill.cost || gameOver ? "disabled" : ""}>
        ${skill.owned ? "取得済み" : `HP ${skill.cost}で取得`}
      </button>
    `;

    const button = div.querySelector("button");

    if (!skill.owned) {
      button.addEventListener("click", () => buySkill(skill));
    }

    skillList.appendChild(div);
  });
}

function buySkill(skill) {
  if (skill.owned || playerHp <= skill.cost || gameOver) return;

  playerHp -= skill.cost;
  skill.owned = true;

  addLog(`「${skill.name}」をHP ${skill.cost}で取得！`);
  updateUI();
}

function rollDice() {
  if (rolled || gameOver) return;

  rolled = true;
  rollButton.disabled = true;

  const value = Math.floor(Math.random() * 6) + 1;
  const action = diceActions[value];

  dice.textContent = value;
  result.textContent = `出目 ${value} → ${action.name}`;

  if (action.type === "damage") {
    enemyHp = Math.max(0, enemyHp - action.value);
    addLog(`出目${value}：相手に ${action.value} ダメージ！`);
  } else {
    const before = playerHp;
    playerHp = Math.min(MAX_HP, playerHp + action.value);
    const healed = playerHp - before;
    addLog(`出目${value}：HPを ${healed} 回復！`);
  }

  updateUI();

  if (enemyHp <= 0) {
    gameOver = true;
    result.textContent = "🎉 勝利！";
    addLog("あなたの勝ち！");
    return;
  }

  // 試作版なので、相手もランダムで行動
  setTimeout(enemyTurn, 700);
}

function enemyTurn() {
  if (gameOver) return;

  const value = Math.floor(Math.random() * 6) + 1;
  const action = diceActions[value];

  if (action.type === "damage") {
    playerHp = Math.max(0, playerHp - action.value);
    addLog(`相手の出目${value}：あなたに ${action.value} ダメージ！`);
  } else {
    const before = enemyHp;
    enemyHp = Math.min(MAX_HP, enemyHp + action.value);
    const healed = enemyHp - before;
    addLog(`相手の出目${value}：相手が ${healed} 回復。`);
  }

  updateUI();

  if (playerHp <= 0) {
    gameOver = true;
    result.textContent = "💥 敗北……";
    addLog("あなたの負け！");
    return;
  }

  rolled = false;
  rollButton.disabled = false;
  result.textContent = "あなたのターン！サイコロを振ろう。";
}

function addLog(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;

  log.prepend(entry);
}

function resetGame() {
  playerHp = MAX_HP;
  enemyHp = MAX_HP;
  rolled = false;
  gameOver = false;

  skills.forEach(skill => {
    skill.owned = skill.cost === 0;
  });

  dice.textContent = "?";
  result.textContent = "1〜6の出目で行動が決まる！";
  rollButton.disabled = false;
  log.innerHTML = "";

  addLog("バトル開始！");
  updateUI();
}

rollButton.addEventListener("click", rollDice);
document.getElementById("resetButton").addEventListener("click", resetGame);

resetGame();
