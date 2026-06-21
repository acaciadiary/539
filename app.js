const fakeDb = {
  draws: [
    { issue: "115000142", date: "2026-06-20", numbers: [3, 12, 18, 27, 36] },
    { issue: "115000141", date: "2026-06-19", numbers: [1, 8, 16, 25, 39] },
    { issue: "115000140", date: "2026-06-18", numbers: [4, 11, 19, 28, 35] },
    { issue: "115000139", date: "2026-06-17", numbers: [5, 14, 22, 33, 38] },
    { issue: "115000138", date: "2026-06-16", numbers: [2, 9, 18, 24, 37] },
    { issue: "115000137", date: "2026-06-15", numbers: [7, 12, 21, 27, 31] },
    { issue: "115000136", date: "2026-06-13", numbers: [6, 15, 20, 29, 34] },
    { issue: "115000135", date: "2026-06-12", numbers: [3, 10, 17, 26, 36] },
    { issue: "115000134", date: "2026-06-11", numbers: [8, 12, 23, 30, 39] },
    { issue: "115000133", date: "2026-06-10", numbers: [1, 13, 19, 27, 32] },
    { issue: "115000132", date: "2026-06-09", numbers: [4, 16, 22, 28, 35] },
    { issue: "115000131", date: "2026-06-08", numbers: [9, 14, 21, 31, 38] },
    { issue: "115000130", date: "2026-06-06", numbers: [2, 11, 18, 25, 33] },
    { issue: "115000129", date: "2026-06-05", numbers: [5, 12, 20, 29, 36] },
    { issue: "115000128", date: "2026-06-04", numbers: [7, 15, 23, 30, 37] },
    { issue: "115000127", date: "2026-06-03", numbers: [6, 10, 17, 24, 34] },
    { issue: "115000126", date: "2026-06-02", numbers: [3, 13, 19, 27, 39] },
    { issue: "115000125", date: "2026-06-01", numbers: [1, 8, 16, 22, 31] },
    { issue: "115000124", date: "2026-05-30", numbers: [4, 11, 21, 28, 35] },
    { issue: "115000123", date: "2026-05-29", numbers: [2, 14, 18, 25, 38] },
    { issue: "115000122", date: "2026-05-28", numbers: [5, 12, 20, 29, 36] },
    { issue: "115000121", date: "2026-05-27", numbers: [7, 15, 23, 30, 37] },
    { issue: "115000120", date: "2026-05-26", numbers: [6, 10, 17, 24, 34] },
    { issue: "115000119", date: "2026-05-25", numbers: [3, 13, 19, 27, 32] },
    { issue: "115000118", date: "2026-05-23", numbers: [1, 9, 16, 22, 31] },
    { issue: "115000117", date: "2026-05-22", numbers: [4, 11, 21, 28, 35] },
    { issue: "115000116", date: "2026-05-21", numbers: [2, 14, 18, 25, 38] },
    { issue: "115000115", date: "2026-05-20", numbers: [5, 12, 20, 29, 36] },
    { issue: "115000114", date: "2026-05-19", numbers: [7, 15, 23, 30, 37] },
    { issue: "115000113", date: "2026-05-18", numbers: [6, 10, 17, 24, 34] },
  ],
  userNumberSets: [
    { name: "常用組合 A", numbers: [2, 9, 18, 24, 37] },
    { name: "生日組合", numbers: [3, 8, 12, 18, 27] },
  ],
};

const labels = {
  appName: "539 透明研究室",
  latestIssue: "最新期別",
  lockedNote: "模型已於開獎前鎖定，開獎後自動驗證。",
  readSummary: "朗讀本期摘要",
  todayDraw: "今日開獎",
  myNumbers: "我的號碼",
  researchModels: "研究模型",
  verification: "驗證紀錄",
};

const formatNumber = (number) => String(number).padStart(2, "0");
const formatNumbers = (numbers) => numbers.map(formatNumber).join("、");
const intersectionCount = (a, b) => a.filter((number) => b.includes(number)).length;

function getWindowDraws(size = 30) {
  return fakeDb.draws.slice(0, size);
}

function countFrequency(draws) {
  const counts = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, 0]));
  draws.forEach((draw) => draw.numbers.forEach((number) => counts.set(number, counts.get(number) + 1)));
  return counts;
}

function getHotNumbers(draws, count = 5) {
  return [...countFrequency(draws).entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, count)
    .map(([number]) => number);
}

function getOverdueNumbers(draws, count = 5) {
  const lastSeen = new Map();
  for (let number = 1; number <= 39; number += 1) lastSeen.set(number, draws.length + 1);
  draws.forEach((draw, index) => {
    draw.numbers.forEach((number) => {
      if (lastSeen.get(number) === draws.length + 1) lastSeen.set(number, index);
    });
  });
  return [...lastSeen.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, count)
    .map(([number]) => number);
}

function getCommonSumRange(draws) {
  const sums = draws.map((draw) => draw.numbers.reduce((total, number) => total + number, 0)).sort((a, b) => a - b);
  const low = sums[Math.floor(sums.length * 0.25)];
  const high = sums[Math.floor(sums.length * 0.75)];
  return `${low} - ${high}`;
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function pickUniqueWeighted(scores, count = 5) {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, count)
    .map(([number]) => number)
    .sort((a, b) => a - b);
}

function buildModels(draws) {
  const recent = draws.slice(1);
  const frequency = countFrequency(recent);
  const hot = getHotNumbers(recent, 8);
  const overdue = getOverdueNumbers(recent, 8);
  const latestNumbers = draws[0].numbers;

  const balancedScores = new Map();
  for (let number = 1; number <= 39; number += 1) {
    const freqScore = frequency.get(number) * 2.1;
    const overdueScore = overdue.includes(number) ? 3.5 : 0;
    const zoneScore = number <= 20 ? 1.2 : 1;
    balancedScores.set(number, freqScore + overdueScore + zoneScore);
  }

  const overdueScores = new Map();
  overdue.forEach((number, index) => overdueScores.set(number, 100 - index));

  const bayesScores = new Map();
  for (let number = 1; number <= 39; number += 1) {
    bayesScores.set(number, (frequency.get(number) + 1) / (recent.length + 39));
  }

  const coScores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, 0]));
  recent.forEach((draw) => {
    const overlap = intersectionCount(draw.numbers, latestNumbers);
    draw.numbers.forEach((number) => coScores.set(number, coScores.get(number) + overlap));
  });

  const rand = seededRandom(Number(draws[0].issue.slice(-4)));
  const randomScores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, rand()]));

  return [
    {
      name: "平衡統計模型",
      tag: "推薦",
      description: "綜合冷熱號、遺漏期數、奇偶、高低區間與和值，適合作為第一版主模型。",
      numbers: pickUniqueWeighted(balancedScores),
      score: 68,
    },
    {
      name: "遺漏觀察模型",
      tag: "研究",
      description: "偏重久未出現號碼，適合觀察趨勢，但不能解讀成保證回補。",
      numbers: pickUniqueWeighted(overdueScores),
      score: 52,
    },
    {
      name: "貝葉斯平滑模型",
      tag: "穩健",
      description: "用平滑後的出現機率降低短期波動，適合做長期比較。",
      numbers: pickUniqueWeighted(bayesScores),
      score: 59,
    },
    {
      name: "共現關聯模型",
      tag: "關聯",
      description: "觀察近期常一起出現的號碼群，用來做號碼關聯研究。",
      numbers: pickUniqueWeighted(coScores),
      score: 55,
    },
    {
      name: "隨機基準模型",
      tag: "對照",
      description: "完全隨機產生，用來檢查其他模型是否真的有差異。",
      numbers: pickUniqueWeighted(randomScores),
      score: 46,
    },
  ];
}

function evaluateModels(models, latestDraw) {
  return models.map((model) => ({
    name: model.name.replace("模型", ""),
    hits: intersectionCount(model.numbers, latestDraw.numbers),
    status: "已結算",
  }));
}

function renderNumberBalls(container, numbers) {
  container.innerHTML = numbers.map((number) => `<span>${formatNumber(number)}</span>`).join("");
}

function renderStats(draws) {
  const cards = document.querySelectorAll(".stat-card");
  cards[0].querySelector("strong").textContent = formatNumbers(getHotNumbers(draws, 3));
  cards[1].querySelector("strong").textContent = formatNumbers(getOverdueNumbers(draws, 3));
  cards[2].querySelector("strong").textContent = getCommonSumRange(draws);
}

function renderUserNumbers(latestDraw) {
  const container = document.querySelector(".saved-ticket").parentElement;
  container.querySelectorAll(".saved-ticket").forEach((node) => node.remove());

  fakeDb.userNumberSets.forEach((set) => {
    const hits = intersectionCount(set.numbers, latestDraw.numbers);
    const ticket = document.createElement("div");
    ticket.className = "saved-ticket";
    ticket.innerHTML = `
      <div>
        <p>${set.name}</p>
        <div class="mini-numbers">${set.numbers.map((number) => `<span>${formatNumber(number)}</span>`).join("")}</div>
      </div>
      <strong>中 ${hits} 碼</strong>
    `;
    container.appendChild(ticket);
  });
}

function renderModels(models) {
  const list = document.querySelector(".model-list");
  list.innerHTML = models
    .map(
      (model, index) => `
        <article class="model-card ${index === 0 ? "active" : ""}">
          <div class="model-title">
            <h3>${model.name}</h3>
            <span>${model.tag}</span>
          </div>
          <p>${model.description}</p>
          <div class="prediction">${model.numbers.map((number) => `<span>${formatNumber(number)}</span>`).join("")}</div>
          <meter min="0" max="100" value="${model.score}"></meter>
          <small>研究分數 ${model.score}，需與隨機基準長期比較</small>
        </article>
      `,
    )
    .join("");
}

function renderEvaluations(evaluations) {
  const table = document.querySelector(".verify-table");
  table.innerHTML = evaluations
    .map((item) => `<div><span>${item.name}</span><strong>中 ${item.hits} 碼</strong><em>${item.status}</em></div>`)
    .join("");
}

function renderPage() {
  const latestDraw = fakeDb.draws[0];
  const windowDraws = getWindowDraws();
  const models = buildModels(fakeDb.draws);

  document.querySelector("title").textContent = labels.appName;
  document.querySelector("h1").textContent = labels.appName;
  document.querySelector(".eyebrow").textContent = "今彩539資料研究與驗證";
  document.querySelector(".status-label").textContent = labels.latestIssue;
  document.querySelector(".hero-panel h2").textContent = `第 ${latestDraw.issue} 期`;
  document.querySelector(".hero-note").textContent = labels.lockedNote;
  document.querySelector("#voiceButton").textContent = labels.readSummary;
  renderNumberBalls(document.querySelector(".number-row"), latestDraw.numbers);
  renderStats(windowDraws);
  renderUserNumbers(latestDraw);
  renderModels(models);
  renderEvaluations(evaluateModels(models, latestDraw));
}

document.querySelector("#contrastButton")?.addEventListener("click", () => {
  document.body.classList.toggle("high-contrast");
});

document.querySelector("#seniorButton")?.addEventListener("click", () => {
  document.body.classList.toggle("senior-mode");
});

document.querySelector("#voiceButton")?.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  const latestDraw = fakeDb.draws[0];
  const text = `第 ${latestDraw.issue} 期，開獎號碼是 ${formatNumbers(latestDraw.numbers)}。本服務只做資料研究，不保證中獎。`;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
});

renderPage();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
