const fallbackDraws = [
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
];

let appState = {
  draws: fallbackDraws,
  source: "本地備援資料",
  updatedAt: "",
  userNumberSets: [
    { name: "固定觀察 A", numbers: [2, 9, 18, 24, 37] },
    { name: "生日組合 B", numbers: [3, 8, 12, 18, 27] },
  ],
  currentGeneratedSet: null,
  historyLimit: 30,
};

const formatNumber = (number) => String(number).padStart(2, "0");
const formatNumbers = (numbers) => numbers.map(formatNumber).join("、");
const intersectionCount = (a, b) => a.filter((number) => b.includes(number)).length;
const ticketStorageKey = "539-saved-ticket-sets";

function loadSavedTickets() {
  try {
    const saved = JSON.parse(localStorage.getItem(ticketStorageKey) || "[]");
    if (!Array.isArray(saved)) return;
    const validSets = saved
      .filter((set) => set.name && Array.isArray(set.numbers) && set.numbers.length === 5)
      .map((set) => ({
        name: String(set.name),
        numbers: set.numbers.map(Number).sort((a, b) => a - b),
      }));
    if (validSets.length) appState.userNumberSets = validSets;
  } catch (error) {
    localStorage.removeItem(ticketStorageKey);
  }
}

function saveTicketsToStorage() {
  localStorage.setItem(ticketStorageKey, JSON.stringify(appState.userNumberSets));
}

function normalizeDraws(draws) {
  return draws
    .filter((draw) => draw.issue && draw.date && Array.isArray(draw.numbers) && draw.numbers.length === 5)
    .map((draw) => ({
      issue: String(draw.issue),
      date: draw.date,
      numbers: draw.numbers.map(Number).sort((a, b) => a - b),
    }))
    .sort((a, b) => String(b.issue).localeCompare(String(a.issue)));
}

async function loadDrawData() {
  try {
    const response = await fetch(`data/draws.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("data file unavailable");
    const payload = await response.json();
    const draws = normalizeDraws(payload.draws || []);
    if (draws.length < 5) throw new Error("not enough draw records");
    appState.draws = draws;
    appState.source = payload.source || "台灣彩券資料同步";
    appState.updatedAt = payload.updatedAt || "";
  } catch (error) {
    appState.draws = fallbackDraws;
    appState.source = "本地備援資料";
    appState.updatedAt = "";
  }
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
  if (!draws.length) return "--";
  const sums = draws.map((draw) => draw.numbers.reduce((total, number) => total + number, 0)).sort((a, b) => a - b);
  const low = sums[Math.floor(sums.length * 0.25)];
  const high = sums[Math.floor(sums.length * 0.75)];
  return `${low} - ${high}`;
}

function getHalfYearDraws(draws) {
  const latestDate = new Date(`${draws[0].date}T00:00:00`);
  const since = new Date(latestDate);
  since.setMonth(since.getMonth() - 6);
  return draws.filter((draw) => new Date(`${draw.date}T00:00:00`) >= since);
}

function formatMonthKey(key) {
  const [year, month] = key.split("-");
  return `${year}/${month}`;
}

function getMonthGroups(draws) {
  const groups = new Map();
  draws.forEach((draw) => {
    const key = draw.date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(draw);
  });
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
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

  const davidScores = new Map();
  const adaScores = new Map();
  const nashScores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, 0]));
  const rand = seededRandom(Number(draws[0].issue.slice(-5)));
  const teslaScores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, rand()]));

  for (let number = 1; number <= 39; number += 1) {
    const freqScore = frequency.get(number) * 2.35;
    const overdueScore = overdue.includes(number) ? 3.8 : 0;
    const hotScore = hot.includes(number) ? 1.7 : 0;
    davidScores.set(number, freqScore + overdueScore + hotScore);
    adaScores.set(number, (frequency.get(number) + 1) / (recent.length + 39) + (overdue.includes(number) ? 0.18 : 0));
  }

  recent.forEach((draw) => {
    const overlap = intersectionCount(draw.numbers, latestNumbers);
    draw.numbers.forEach((number) => nashScores.set(number, nashScores.get(number) + overlap));
  });

  return [
    {
      name: "David 教授的黃金迴歸",
      tag: "主模型",
      description: "混合高頻、低頻與近期權重，整理成一組便於比較的觀察號碼。",
      numbers: pickUniqueWeighted(davidScores),
      score: 72,
    },
    {
      name: "Ada Lovelace 冷門引擎",
      tag: "反直覺",
      description: "偏向被忽略的低頻號碼，讓觀察組避開過度擁擠的熱門區。",
      numbers: pickUniqueWeighted(adaScores),
      score: 61,
    },
    {
      name: "Nash 博士連動矩陣",
      tag: "關聯",
      description: "比對最新一期與歷史重疊，估算可能有連動訊號的號碼。",
      numbers: pickUniqueWeighted(nashScores),
      score: 58,
    },
    {
      name: "Tesla 隨機共振場",
      tag: "娛樂",
      description: "用期別作為固定種子，產生可重現且帶有隨機性的觀察組。",
      numbers: pickUniqueWeighted(teslaScores),
      score: 47,
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

function renderHistory(draws) {
  const rows = draws.slice(0, appState.historyLimit);
  document.querySelector("#historyTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>期別</th>
          <th>日期</th>
          <th>號碼</th>
          <th>總和</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((draw) => {
            const sum = draw.numbers.reduce((total, number) => total + number, 0);
            return `
              <tr>
                <td>${draw.issue}</td>
                <td>${draw.date}</td>
                <td><div class="mini-numbers">${draw.numbers.map((number) => `<span>${formatNumber(number)}</span>`).join("")}</div></td>
                <td>${sum}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
  document.querySelector("#history30Button")?.classList.toggle("active", appState.historyLimit === 30);
  document.querySelector("#history100Button")?.classList.toggle("active", appState.historyLimit === 100);
}

function getBacktestRecords(draws, limit = 30) {
  const records = [];
  const modelStats = new Map();
  const max = Math.min(limit, draws.length - 6);

  for (let index = 0; index < max; index += 1) {
    const targetDraw = draws[index];
    const priorDraws = draws.slice(index + 1);
    if (priorDraws.length < 6) continue;
    const models = buildModels(priorDraws);
    models.forEach((model) => {
      const hits = intersectionCount(model.numbers, targetDraw.numbers);
      if (!modelStats.has(model.name)) modelStats.set(model.name, { name: model.name, total: 0, rounds: 0, twoPlus: 0 });
      const stat = modelStats.get(model.name);
      stat.total += hits;
      stat.rounds += 1;
      if (hits >= 2) stat.twoPlus += 1;
      records.push({ issue: targetDraw.issue, model: model.name, hits });
    });
  }

  return { records, modelStats: [...modelStats.values()] };
}

function renderBacktestSummary(draws) {
  const { records, modelStats } = getBacktestRecords(draws, 30);
  const averageHits = records.length
    ? (records.reduce((total, record) => total + record.hits, 0) / records.length).toFixed(2)
    : "--";
  const bestModel = modelStats
    .slice()
    .sort((a, b) => b.total / b.rounds - a.total / a.rounds)[0];
  const twoPlusRate = records.length
    ? `${Math.round((records.filter((record) => record.hits >= 2).length / records.length) * 100)}%`
    : "--";

  document.querySelector("#backtestSummary").innerHTML = `
    <article><p>近 30 期平均</p><strong>${averageHits} 個</strong></article>
    <article><p>最佳模型</p><strong>${bestModel ? bestModel.name.split(" ")[0] : "--"}</strong></article>
    <article><p>2 個以上比率</p><strong>${twoPlusRate}</strong></article>
  `;
}

function renderHalfYear(draws) {
  const halfDraws = getHalfYearDraws(draws);
  const frequency = countFrequency(halfDraws);
  const maxCount = Math.max(...frequency.values(), 1);
  const latest = halfDraws[0];
  const oldest = halfDraws[halfDraws.length - 1];

  document.querySelector("#halfYearScope").textContent = halfDraws.length >= 140 ? "近半年" : "目前可用資料";
  document.querySelector("#halfDrawCount").textContent = `${halfDraws.length} 期`;
  document.querySelector("#halfDateRange").textContent =
    latest && oldest ? `${oldest.date} 到 ${latest.date}` : "等待資料同步";
  document.querySelector("#halfHotNumbers").textContent = formatNumbers(getHotNumbers(halfDraws, 5));
  document.querySelector("#halfOverdueNumbers").textContent = formatNumbers(getOverdueNumbers(halfDraws, 5));

  document.querySelector("#halfHeatGrid").innerHTML = [...frequency.entries()]
    .map(([number, count]) => {
      const ratio = count / maxCount;
      const lightness = 94 - Math.round(ratio * 28);
      const background = `hsl(24 88% ${lightness}%)`;
      return `
        <div class="heat-cell" style="--heat-bg: ${background}">
          <span>${formatNumber(number)}</span>
          <small>${count} 次</small>
        </div>
      `;
    })
    .join("");

  document.querySelector("#monthList").innerHTML = getMonthGroups(halfDraws)
    .map(([month, monthDraws]) => {
      const sums = monthDraws.map((draw) => draw.numbers.reduce((total, number) => total + number, 0));
      const low = Math.min(...sums);
      const high = Math.max(...sums);
      return `
        <article class="month-card">
          <header>
            <strong>${formatMonthKey(month)}</strong>
            <span>${monthDraws.length} 期</span>
          </header>
          <p>${formatNumbers(getHotNumbers(monthDraws, 5))}</p>
          <small>總和範圍 ${low} - ${high}</small>
        </article>
      `;
    })
    .join("");
}

function renderUserNumbers(latestDraw) {
  const displaySets = [
    ...(appState.currentGeneratedSet ? [{ ...appState.currentGeneratedSet, isDraft: true }] : []),
    ...appState.userNumberSets,
  ];
  document.querySelector("#savedTickets").innerHTML = displaySets
    .map((set, index) => {
      const hits = intersectionCount(set.numbers, latestDraw.numbers);
      const savedIndex = appState.currentGeneratedSet ? index - 1 : index;
      const action = set.isDraft
        ? `<button class="small-button" type="button" data-save-current="true">收藏</button>`
        : `<button class="small-button" type="button" data-delete-ticket="${savedIndex}">刪除</button>`;
      return `
        <div class="saved-ticket">
          <div>
            <p>${set.name}</p>
            <div class="mini-numbers">${set.numbers.map((number) => `<span>${formatNumber(number)}</span>`).join("")}</div>
          </div>
          <div class="ticket-actions">
            <strong>中 ${hits} 個</strong>
            ${action}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderModels(models) {
  document.querySelector("#modelList").innerHTML = models
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
          <small>比較分數 ${model.score}，僅代表模型內部排序。</small>
        </article>
      `,
    )
    .join("");
}

function renderEvaluations(models, latestDraw) {
  document.querySelector("#verifyTable").innerHTML = models
    .map((model) => {
      const hits = intersectionCount(model.numbers, latestDraw.numbers);
      return `<div><span>${model.name}</span><strong>中 ${hits} 個</strong><em>已比對</em></div>`;
    })
    .join("");
}

function shuffleUserNumbers() {
  const rand = seededRandom(Date.now() % 100000);
  const scores = new Map(Array.from({ length: 39 }, (_, index) => [index + 1, rand()]));
  appState.currentGeneratedSet = { name: "即時生成組", numbers: pickUniqueWeighted(scores) };
  renderUserNumbers(appState.draws[0]);
  const savedTickets = document.querySelector("#savedTickets");
  savedTickets?.scrollIntoView({ behavior: "smooth", block: "center" });
  const firstTicket = savedTickets?.querySelector(".saved-ticket");
  firstTicket?.classList.add("flash");
  window.setTimeout(() => firstTicket?.classList.remove("flash"), 900);
}

function saveCurrentTicket() {
  if (!appState.currentGeneratedSet) shuffleUserNumbers();
  const ticket = appState.currentGeneratedSet;
  const key = ticket.numbers.join("-");
  const exists = appState.userNumberSets.some((set) => set.numbers.join("-") === key);
  if (!exists) {
    appState.userNumberSets.unshift({
      name: `收藏觀察 ${appState.userNumberSets.length + 1}`,
      numbers: ticket.numbers,
    });
    saveTicketsToStorage();
  }
  appState.currentGeneratedSet = null;
  renderUserNumbers(appState.draws[0]);
}

function deleteTicket(index) {
  appState.userNumberSets.splice(index, 1);
  saveTicketsToStorage();
  renderUserNumbers(appState.draws[0]);
}

function getNextDrawLabel() {
  const day = new Date().getDay();
  if (day === 0) return "週一開獎";
  return "今晚開獎";
}

function renderPage() {
  const latestDraw = appState.draws[0];
  const windowDraws = appState.draws.slice(0, 30);
  const models = buildModels(appState.draws);

  document.querySelector("#latestIssue").textContent = `第 ${latestDraw.issue} 期`;
  document.querySelector("#latestDate").textContent = `${latestDraw.date} 開獎`;
  document.querySelector("#sourceBadge").textContent = appState.source.includes("備援") ? "備援資料" : "正式同步";
  document.querySelector("#syncState").textContent = appState.source.includes("備援") ? "備援模式" : "已同步";
  document.querySelector("#updatedAt").textContent = appState.updatedAt ? `更新時間：${appState.updatedAt}` : "等待 GitHub Actions 自動更新";
  document.querySelector("#nextDraw").textContent = getNextDrawLabel();
  document.querySelector("#verifyScope").textContent = `以第 ${latestDraw.issue} 期比對`;

  renderNumberBalls(document.querySelector(".number-row"), latestDraw.numbers);
  renderStats(windowDraws);
  renderHistory(appState.draws);
  renderHalfYear(appState.draws);
  renderUserNumbers(latestDraw);
  renderModels(models);
  renderEvaluations(models, latestDraw);
  renderBacktestSummary(appState.draws);
}

async function refreshData() {
  document.querySelector("#syncState").textContent = "同步中";
  await loadDrawData();
  renderPage();
}

document.querySelector("#contrastButton")?.addEventListener("click", () => {
  document.body.classList.toggle("high-contrast");
});

document.querySelector("#seniorButton")?.addEventListener("click", () => {
  document.body.classList.toggle("senior-mode");
});

document.querySelector("#shuffleButton")?.addEventListener("click", shuffleUserNumbers);
document.querySelector("#saveTicketButton")?.addEventListener("click", saveCurrentTicket);
document.querySelector("#refreshButton")?.addEventListener("click", refreshData);

document.querySelector("#history30Button")?.addEventListener("click", () => {
  appState.historyLimit = 30;
  renderHistory(appState.draws);
});

document.querySelector("#history100Button")?.addEventListener("click", () => {
  appState.historyLimit = 100;
  renderHistory(appState.draws);
});

document.querySelector("#savedTickets")?.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-current]");
  const deleteButton = event.target.closest("[data-delete-ticket]");
  if (saveButton) saveCurrentTicket();
  if (deleteButton) deleteTicket(Number(deleteButton.dataset.deleteTicket));
});

document.querySelectorAll(".rail a[href^='#'], .brand[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const backTopButton = document.querySelector("#backTopButton");
backTopButton?.addEventListener("click", () => {
  document.querySelector("#top")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

window.addEventListener("scroll", () => {
  backTopButton?.classList.toggle("is-visible", window.scrollY > 360);
});

document.querySelector("#voiceButton")?.addEventListener("click", () => {
  if (!("speechSynthesis" in window)) return;
  const latestDraw = appState.draws[0];
  const text = `第 ${latestDraw.issue} 期，最新號碼是 ${formatNumbers(latestDraw.numbers)}。資料僅供參考。`;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
});

loadSavedTickets();
refreshData();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
