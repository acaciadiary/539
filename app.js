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
    { name: "固定觀察 A", numbers: [2, 9, 18, 24, 37] },
    { name: "生日組合 B", numbers: [3, 8, 12, 18, 27] },
  ],
};

const formatNumber = (number) => String(number).padStart(2, "0");
const formatNumbers = (numbers) => numbers.map(formatNumber).join("、");
const intersectionCount = (a, b) => a.filter((number) => b.includes(number)).length;

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

function getColdNumbers(draws, count = 5) {
  return [...countFrequency(draws).entries()]
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .slice(0, count)
    .map(([number]) => number);
}

function getOverdueNumbers(draws, count = 8) {
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
    const hotScore = hot.includes(number) ? 1.5 : 0;
    balancedScores.set(number, freqScore + overdueScore + hotScore);
  }

  const overdueScores = new Map();
  overdue.forEach((number, index) => overdueScores.set(number, 100 - index));

  const coScores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, 0]));
  recent.forEach((draw) => {
    const overlap = intersectionCount(draw.numbers, latestNumbers);
    draw.numbers.forEach((number) => coScores.set(number, coScores.get(number) + overlap));
  });

  const rand = seededRandom(Number(draws[0].issue.slice(-4)));
  const randomScores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, rand()]));

  return [
    {
      name: "平衡趨勢模型",
      tag: "推薦",
      description: "綜合熱門、冷門與近期權重，挑出較平均的一組號碼。",
      numbers: pickUniqueWeighted(balancedScores),
      score: 68,
    },
    {
      name: "冷門回補模型",
      tag: "觀察",
      description: "偏向近期較少出現的號碼，適合拿來做交叉比較。",
      numbers: pickUniqueWeighted(overdueScores),
      score: 52,
    },
    {
      name: "連動比對模型",
      tag: "回測",
      description: "用最新一期與過往資料的重疊程度，估算可能連動的號碼。",
      numbers: pickUniqueWeighted(coScores),
      score: 55,
    },
    {
      name: "隨機種子模型",
      tag: "娛樂",
      description: "用期別作為固定種子產生一組號碼，讓每期結果可重現。",
      numbers: pickUniqueWeighted(randomScores),
      score: 46,
    },
  ];
}

function renderNumberBalls(container, numbers) {
  container.innerHTML = numbers.map((number) => `<span>${formatNumber(number)}</span>`).join("");
}

function renderStats(draws) {
  document.querySelector("#hotNumbers").textContent = formatNumbers(getHotNumbers(draws, 3));
  document.querySelector("#coldNumbers").textContent = formatNumbers(getColdNumbers(draws, 3));
  document.querySelector("#sumRange").textContent = getCommonSumRange(draws);
}

function renderUserNumbers(latestDraw) {
  const container = document.querySelector("#savedTickets");
  container.innerHTML = fakeDb.userNumberSets
    .map((set) => {
      const hits = intersectionCount(set.numbers, latestDraw.numbers);
      return `
        <div class="saved-ticket">
          <div>
            <p>${set.name}</p>
            <div class="mini-numbers">${set.numbers.map((number) => `<span>${formatNumber(number)}</span>`).join("")}</div>
          </div>
          <strong>中 ${hits} 個</strong>
        </div>
      `;
    })
    .join("");
}

function renderModels(models) {
  const list = document.querySelector("#modelList");
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
          <small>研究分數 ${model.score}，僅作為趨勢觀察。</small>
        </article>
      `,
    )
    .join("");
}

function renderEvaluations(models, latestDraw) {
  const table = document.querySelector("#verifyTable");
  table.innerHTML = models
    .map((model) => {
      const hits = intersectionCount(model.numbers, latestDraw.numbers);
      return `<div><span>${model.name}</span><strong>中 ${hits} 個</strong><em>已比對</em></div>`;
    })
    .join("");
}

function shuffleUserNumbers() {
  const rand = seededRandom(Date.now() % 100000);
  const scores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, rand()]));
  fakeDb.userNumberSets[0] = { name: "隨機觀察", numbers: pickUniqueWeighted(scores) };
  renderUserNumbers(fakeDb.draws[0]);
}

function renderPage() {
  const latestDraw = fakeDb.draws[0];
  const windowDraws = fakeDb.draws.slice(0, 30);
  const models = buildModels(fakeDb.draws);

  document.querySelector("#latestIssue").textContent = `第 ${latestDraw.issue} 期`;
  renderNumberBalls(document.querySelector(".number-row"), latestDraw.numbers);
  renderStats(windowDraws);
  renderUserNumbers(latestDraw);
  renderModels(models);
  renderEvaluations(models, latestDraw);
}

document.querySelector("#contrastButton")?.addEventListener("click", () => {
  document.body.classList.toggle("high-contrast");
});

document.querySelector("#seniorButton")?.addEventListener("click", () => {
  document.body.classList.toggle("senior-mode");
});

document.querySelector("#shuffleButton")?.addEventListener("click", shuffleUserNumbers);

document.querySelector("#voiceButton")?.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  const latestDraw = fakeDb.draws[0];
  const text = `第 ${latestDraw.issue} 期，最新號碼是 ${formatNumbers(latestDraw.numbers)}。資料僅供參考。`;
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
