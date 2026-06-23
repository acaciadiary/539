const fs = require("fs/promises");
const path = require("path");

const outputPath = path.join(process.cwd(), "data", "draws.json");
const officialUrl = process.env.TAIWAN_LOTTERY_539_URL || "https://www.taiwanlottery.com.tw/lotto/DailyCash/history.aspx";
const maxDraws = 180;

const apiCandidates = [
  officialUrl,
  "https://api.taiwanlottery.com/TLCAPIWeB/Lottery/DailyCashResult",
  "https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Daily539Result",
];

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  const western = text.match(/(20\d{2})[/-](\d{1,2})[/-](\d{1,2})/);
  if (western) return `${western[1]}-${padNumber(western[2])}-${padNumber(western[3])}`;

  const roc = text.match(/(\d{3})[/-](\d{1,2})[/-](\d{1,2})/);
  if (roc) return `${Number(roc[1]) + 1911}-${padNumber(roc[2])}-${padNumber(roc[3])}`;

  return text;
}

function normalizeDraw(draw) {
  const issue = String(draw.issue || draw.period || draw.term || draw.drawTerm || "").replace(/\D/g, "");
  const date = normalizeDate(draw.date || draw.drawDate || draw.openDate || draw.lotteryDate);
  const numbers = (draw.numbers || draw.winNumbers || draw.lotteryNo || [])
    .map(Number)
    .filter((number) => Number.isInteger(number) && number >= 1 && number <= 39)
    .slice(0, 5)
    .sort((a, b) => a - b);

  if (!issue || !date || numbers.length !== 5) return null;
  return { issue, date, numbers };
}

function uniqueDraws(draws) {
  const map = new Map();
  draws.forEach((draw) => {
    const normalized = normalizeDraw(draw);
    if (normalized) map.set(normalized.issue, normalized);
  });
  return [...map.values()].sort((a, b) => b.issue.localeCompare(a.issue)).slice(0, maxDraws);
}

function collectJsonDraws(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonDraws(item, output));
    return output;
  }

  const keys = Object.keys(value);
  const possibleNumberKeys = keys.filter((key) => /No|Num|Number|獎號|號碼/i.test(key));
  const numbers = possibleNumberKeys
    .flatMap((key) => String(value[key]).match(/\d{1,2}/g) || [])
    .map(Number)
    .filter((number) => number >= 1 && number <= 39);

  const issueKey = keys.find((key) => /期|period|term|issue/i.test(key));
  const dateKey = keys.find((key) => /date|日期|時間/i.test(key));
  if (issueKey && dateKey && numbers.length >= 5) {
    output.push({ issue: value[issueKey], date: value[dateKey], numbers });
  }

  Object.values(value).forEach((item) => collectJsonDraws(item, output));
  return output;
}

function parseHtmlDraws(html) {
  const compact = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const rows = compact.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const draws = [];

  rows.forEach((row) => {
    const text = row
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!/539|今彩|Daily/i.test(text)) return;

    const issue = (text.match(/\b\d{8,10}\b/) || [])[0];
    const date = normalizeDate(text);
    const numbers = (text.match(/\b(?:0?[1-9]|[12]\d|3[0-9])\b/g) || [])
      .map(Number)
      .filter((number) => number >= 1 && number <= 39);

    if (issue && date && numbers.length >= 5) {
      draws.push({ issue, date, numbers: numbers.slice(-5) });
    }
  });

  return draws;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 539-Quantum-Lab updater",
        accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadExisting() {
  try {
    return JSON.parse(await fs.readFile(outputPath, "utf8"));
  } catch {
    return { draws: [] };
  }
}

async function run() {
  const existing = await loadExisting();
  const errors = [];

  for (const url of apiCandidates) {
    try {
      const text = await fetchText(url);
      let parsed = [];

      try {
        parsed = collectJsonDraws(JSON.parse(text));
      } catch {
        parsed = parseHtmlDraws(text);
      }

      const draws = uniqueDraws([...parsed, ...(existing.draws || [])]);
      if (draws.length >= 5) {
        const payload = {
          game: "今彩539",
          source: "台灣彩券正式開獎資料同步",
          sourceUrl: url,
          updatedAt: new Date().toISOString(),
          draws,
        };
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
        console.log(`Updated ${draws.length} draw records from ${url}`);
        return;
      }

      errors.push(`${url}: parsed only ${draws.length} records`);
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  console.warn("No official source was updated. Keeping existing data.");
  errors.forEach((error) => console.warn(error));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
