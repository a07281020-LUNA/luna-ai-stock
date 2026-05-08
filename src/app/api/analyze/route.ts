import { NextResponse } from "next/server";

type KBar = {
  date: string;
  open: number;
  max: number;
  min: number;
  close: number;
  Trading_Volume?: number;
};

type DiscussionSource = {
  title: string;
  url: string;
  content: string;
};

type DiscussionSentiment = {
  enabled: boolean;
  status: "ok" | "missing_key" | "no_results" | "fallback" | "error";
  query: string;
  overall: "偏多" | "偏空" | "中立" | "多空分歧" | "資料不足";
  score: number;
  bullishPercent: number;
  neutralPercent: number;
  bearishPercent: number;
  heat: "低" | "中" | "高";
  keywords: string[];
  bullishReasons: string[];
  bearishReasons: string[];
  summary: string;
  riskWarning: string;
  sources: DiscussionSource[];
};



type FundamentalAnalysis = {
  enabled: boolean;
  status: "ok" | "partial" | "no_data" | "error";
  score: number;
  verdict: "偏多" | "偏空" | "中立";
  trend: "bull" | "bear" | "neutral" | "warning";
  latestRevenueMonth: string | null;
  monthlyRevenue: number | null;
  monthlyRevenueYoY: number | null;
  monthlyRevenueMoM: number | null;
  eps: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netProfitMargin: number | null;
  signal: string;
  reasons: string[];
  summary: string;
  riskWarning: string;
};

type IndustryThemeAnalysis = {
  enabled: boolean;
  status: "ok" | "missing_key" | "no_results" | "error";
  score: number;
  verdict: "偏多" | "偏空" | "中立" | "題材過熱";
  trend: "bull" | "bear" | "neutral" | "warning";
  heat: "低" | "中" | "高";
  themes: string[];
  opportunities: string[];
  risks: string[];
  summary: string;
  sources: DiscussionSource[];
};

type MarketEnvironmentAnalysis = {
  enabled: boolean;
  status: "ok" | "no_data" | "error";
  score: number;
  verdict: "偏多" | "偏空" | "中立";
  trend: "bull" | "bear" | "neutral" | "warning";
  latestDate: string | null;
  indexName: string;
  close: number | null;
  changePercent: number | null;
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  rsi14: number | null;
  signal: string;
  reasons: string[];
  summary: string;
  riskWarning: string;
};

type ChipAnalysis = {
  enabled: boolean;
  status: "ok" | "partial" | "no_data" | "error";
  score: number;
  verdict: "偏多" | "偏空" | "中立";
  trend: "bull" | "bear" | "neutral" | "warning";
  latestDate: string | null;
  institutional: {
    foreignNetBuy: number;
    investmentTrustNetBuy: number;
    dealerNetBuy: number;
    totalNetBuy: number;
    fiveDayNetBuy: number;
    twentyDayNetBuy: number;
    foreignStreak: InstitutionalStreak;
    investmentTrustStreak: InstitutionalStreak;
    dealerStreak: InstitutionalStreak;
    totalStreak: InstitutionalStreak;
    signal: string;
    reasons: string[];
  };
  margin: {
    marginBalance: number | null;
    shortBalance: number | null;
    marginBalanceChange5: number | null;
    shortBalanceChange5: number | null;
    marginShortRatio: number | null;
    signal: string;
    reasons: string[];
  };
  summary: string;
  riskWarning: string;
};


type InstitutionalStreak = {
  direction: "買超" | "賣超" | "無明顯方向";
  days: number;
  label: string;
};

type ScoreBreakdown = {
  finalScore: number;
  verdict: "偏多" | "偏空" | "中立" | "偏多但高風險";
  trend: "bull" | "bear" | "neutral" | "warning";
  technical: number;
  chip: number;
  fundamental: number;
  industry: number;
  discussion: number;
  market: number;
  riskPenalty: number;
  confidence: number;
  reasons: string[];
};

type AbnormalAlert = {
  label: string;
  level: "hot" | "bull" | "watch" | "bear";
  message: string;
};

type StrategyProfile = {
  shortTerm: { verdict: string; score: number; action: string; reasons: string[] };
  swing: { verdict: string; score: number; action: string; reasons: string[] };
  longTerm: { verdict: string; score: number; action: string; reasons: string[] };
  summary: string;
};

type DataQuality = {
  score: number;
  level: "高" | "中" | "低";
  okCount: number;
  totalCount: number;
  missingModules: string[];
  warnings: string[];
};

const STOCK_NAMES: Record<string, string> = {
  "00981A": "主動統一台股增長",
  "009816": "凱基台灣TOP50",
  "0050": "元大台灣50",
  "00893": "國泰智能電動車",
  "2330": "台積電",
  "2317": "鴻海",
  "2454": "聯發科",
  "2603": "長榮",
  "2303": "聯電",
  "2301": "光寶科",
  "4938": "和碩",
  "6182": "合晶",
  "6443": "元晶",
  "6176": "瑞儀",
  "2485": "兆赫",
};

function getStartDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

function countKeywordMatches(text: string, keywords: string[]) {
  return keywords.reduce((count, keyword) => {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(escapedKeyword, "gi"));
    return count + (matches ? matches.length : 0);
  }, 0);
}

function uniqueTopKeywords(text: string) {
  const candidates = [
    "AI",
    "外資",
    "投信",
    "法說會",
    "營收",
    "EPS",
    "毛利率",
    "殖利率",
    "配息",
    "目標價",
    "漲多",
    "跌破",
    "突破",
    "利多",
    "利空",
    "庫存",
    "匯率",
    "伺服器",
    "半導體",
    "電動車",
    "航運",
    "記憶體",
    "散熱",
    "矽光子",
    "機器人",
  ];

  return candidates
    .map((keyword) => ({
      keyword,
      count: countKeywordMatches(text, [keyword]),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => item.keyword);
}

function pushReasonIfMatched(params: {
  text: string;
  keywords: string[];
  reasons: string[];
  reason: string;
}) {
  const { text, keywords, reasons, reason } = params;
  if (countKeywordMatches(text, keywords) > 0 && !reasons.includes(reason)) {
    reasons.push(reason);
  }
}

function buildDiscussionSentimentFromSources(
  symbol: string,
  stockName: string,
  query: string,
  sources: DiscussionSource[],
  status: DiscussionSentiment["status"] = "ok"
): DiscussionSentiment {
  const joinedText = sources
    .map((item) => `${item.title}\n${item.content}`)
    .join("\n")
    .toLowerCase();

  const bullishKeywords = [
    "看多",
    "偏多",
    "多方",
    "買進",
    "買入",
    "續抱",
    "加碼",
    "強勢",
    "轉強",
    "突破",
    "創高",
    "噴",
    "大漲",
    "上漲",
    "利多",
    "外資買超",
    "投信買超",
    "營收成長",
    "獲利成長",
    "法說正面",
    "需求強",
    "目標價上調",
    "低估",
  ];

  const bearishKeywords = [
    "看空",
    "偏空",
    "空方",
    "賣出",
    "減碼",
    "停損",
    "弱勢",
    "轉弱",
    "跌破",
    "破線",
    "崩",
    "大跌",
    "下跌",
    "利空",
    "外資賣超",
    "投信賣超",
    "營收衰退",
    "獲利衰退",
    "法說保守",
    "需求轉弱",
    "目標價下修",
    "漲多",
    "追高",
    "估值過高",
    "套牢",
  ];

  const neutralKeywords = [
    "觀望",
    "中立",
    "震盪",
    "整理",
    "等拉回",
    "等突破",
    "不確定",
    "分歧",
  ];

  const bullishHits = countKeywordMatches(joinedText, bullishKeywords);
  const bearishHits = countKeywordMatches(joinedText, bearishKeywords);
  const neutralHits = countKeywordMatches(joinedText, neutralKeywords) + Math.max(sources.length, 1);

  let score = 50 + (bullishHits - bearishHits) * 6;

  if (bullishHits > bearishHits && bullishHits >= 3) score += 5;
  if (bearishHits > bullishHits && bearishHits >= 3) score -= 5;
  if (Math.abs(bullishHits - bearishHits) <= 1 && bullishHits + bearishHits >= 4) score = 50;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const totalHits = Math.max(bullishHits + bearishHits + neutralHits, 1);
  let bullishPercent = Math.round((bullishHits / totalHits) * 100);
  let bearishPercent = Math.round((bearishHits / totalHits) * 100);
  let neutralPercent = Math.max(0, 100 - bullishPercent - bearishPercent);

  if (sources.length === 0) {
    bullishPercent = 0;
    neutralPercent = 100;
    bearishPercent = 0;
  }

  let overall: DiscussionSentiment["overall"] = "中立";

  if (sources.length === 0) {
    overall = "資料不足";
  } else if (Math.abs(bullishHits - bearishHits) <= 1 && bullishHits + bearishHits >= 4) {
    overall = "多空分歧";
  } else if (score >= 62) {
    overall = "偏多";
  } else if (score <= 38) {
    overall = "偏空";
  }

  const heatScore = sources.length + bullishHits + bearishHits + neutralHits;
  let heat: DiscussionSentiment["heat"] = "低";
  if (heatScore >= 20) heat = "高";
  else if (heatScore >= 9) heat = "中";

  const bullishReasons: string[] = [];
  const bearishReasons: string[] = [];

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["外資買超", "投信買超", "買超"],
    reasons: bullishReasons,
    reason: "討論內容提到法人買盤或買超，市場解讀偏正面。",
  });

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["營收成長", "獲利成長", "eps", "毛利率", "需求強"],
    reasons: bullishReasons,
    reason: "討論焦點包含營收、獲利或需求成長，基本面敘事偏多。",
  });

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["突破", "創高", "強勢", "轉強"],
    reasons: bullishReasons,
    reason: "公開討論提到突破、創高或轉強，短線技術情緒偏多。",
  });

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["利多", "目標價上調", "法說正面"],
    reasons: bullishReasons,
    reason: "市場討論出現利多、目標價上調或法說正面等題材。",
  });

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["外資賣超", "投信賣超", "賣超"],
    reasons: bearishReasons,
    reason: "討論內容提到法人賣壓或賣超，短線情緒偏保守。",
  });

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["漲多", "追高", "估值過高", "套牢"],
    reasons: bearishReasons,
    reason: "部分討論擔心漲多、追高或估值偏高，代表短線風險意識升高。",
  });

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["跌破", "破線", "弱勢", "轉弱", "下跌", "大跌"],
    reasons: bearishReasons,
    reason: "公開討論提到跌破、轉弱或下跌，技術面情緒偏空。",
  });

  pushReasonIfMatched({
    text: joinedText,
    keywords: ["利空", "營收衰退", "獲利衰退", "需求轉弱", "目標價下修"],
    reasons: bearishReasons,
    reason: "討論焦點包含利空、營收獲利衰退或需求轉弱。",
  });

  if (bullishReasons.length === 0) {
    bullishReasons.push("目前公開討論中的明確看多理由不多，需搭配技術面與新聞面判斷。");
  }

  if (bearishReasons.length === 0) {
    bearishReasons.push("目前公開討論中的明確看空理由不多，但仍需注意追高與消息面變化。");
  }

  const keywords = uniqueTopKeywords(joinedText);

  const summary =
    sources.length === 0
      ? `目前抓不到 ${symbol} ${stockName} 的有效公開討論資料，暫時不納入風向判斷。`
      : `${symbol} ${stockName} 公開討論區目前整體為「${overall}」，討論熱度「${heat}」。看多約 ${bullishPercent}%，中立約 ${neutralPercent}%，看空約 ${bearishPercent}%。`;

  return {
    enabled: true,
    status,
    query,
    overall,
    score,
    bullishPercent,
    neutralPercent,
    bearishPercent,
    heat,
    keywords,
    bullishReasons: bullishReasons.slice(0, 4),
    bearishReasons: bearishReasons.slice(0, 4),
    summary,
    riskWarning:
      "公開討論區風向容易受短線情緒與熱門留言影響，只能當作輔助參考，不構成投資建議。",
    sources,
  };
}

async function fetchDiscussionSentiment(symbol: string, stockName: string): Promise<DiscussionSentiment> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const query = `${symbol} ${stockName} 台股 PTT 股板 Dcard Mobile01 Yahoo股市 討論區 投資人 看法 風向`;

  if (!tavilyKey) {
    return buildDiscussionSentimentFromSources(symbol, stockName, query, [], "missing_key");
  }

  try {
    const tavilyResponse = await fetchWithTimeout(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: "advanced",
          max_results: 8,
          include_answer: false,
          include_raw_content: false,
          topic: "general",
        }),
      },
      12000
    );

    if (!tavilyResponse.ok) {
      return buildDiscussionSentimentFromSources(symbol, stockName, query, [], "fallback");
    }

    const tavilyData = await tavilyResponse.json();

    const sources: DiscussionSource[] = Array.isArray(tavilyData.results)
      ? tavilyData.results
          .map((item: any) => ({
            title: String(item.title || "公開討論來源"),
            url: String(item.url || ""),
            content: String(item.content || item.raw_content || ""),
          }))
          .filter((item: DiscussionSource) => item.url || item.content)
          .slice(0, 8)
      : [];

    if (sources.length === 0) {
      return buildDiscussionSentimentFromSources(symbol, stockName, query, [], "no_results");
    }

    return buildDiscussionSentimentFromSources(symbol, stockName, query, sources, "ok");
  } catch {
    return buildDiscussionSentimentFromSources(symbol, stockName, query, [], "error");
  }
}


function numberValue(value: any) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function classifyInvestorName(name: string) {
  const value = String(name || "");
  if (value.includes("外資") || value.toLowerCase().includes("foreign")) return "foreign";
  if (value.includes("投信") || value.toLowerCase().includes("investment")) return "trust";
  if (value.includes("自營") || value.toLowerCase().includes("dealer")) return "dealer";
  return "other";
}

function groupInstitutionalByDate(rows: any[]) {
  const map = new Map<
    string,
    { date: string; foreignNetBuy: number; investmentTrustNetBuy: number; dealerNetBuy: number; totalNetBuy: number }
  >();

  for (const row of rows) {
    const date = String(row.date || "");
    if (!date) continue;

    const buy = numberValue(row.buy ?? row.Buy ?? row.buy_volume ?? row.buy_shares);
    const sell = numberValue(row.sell ?? row.Sell ?? row.sell_volume ?? row.sell_shares);
    const net = buy - sell;
    const investorType = classifyInvestorName(row.name || row.institutional_investors || row.InstitutionalInvestors || "");

    if (!map.has(date)) {
      map.set(date, { date, foreignNetBuy: 0, investmentTrustNetBuy: 0, dealerNetBuy: 0, totalNetBuy: 0 });
    }

    const item = map.get(date)!;
    item.totalNetBuy += net;

    if (investorType === "foreign") item.foreignNetBuy += net;
    else if (investorType === "trust") item.investmentTrustNetBuy += net;
    else if (investorType === "dealer") item.dealerNetBuy += net;
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}


function buildInstitutionalStreak(
  daily: Array<{ foreignNetBuy: number; investmentTrustNetBuy: number; dealerNetBuy: number; totalNetBuy: number }>,
  key: "foreignNetBuy" | "investmentTrustNetBuy" | "dealerNetBuy" | "totalNetBuy"
): InstitutionalStreak {
  if (!daily.length) return { direction: "無明顯方向", days: 0, label: "資料不足" };

  let latestSign = 0;
  for (let i = daily.length - 1; i >= 0; i--) {
    const value = Number(daily[i][key] || 0);
    if (value > 0) { latestSign = 1; break; }
    if (value < 0) { latestSign = -1; break; }
  }

  if (latestSign === 0) return { direction: "無明顯方向", days: 0, label: "近期無明顯買賣超" };

  let days = 0;
  for (let i = daily.length - 1; i >= 0; i--) {
    const value = Number(daily[i][key] || 0);
    if (latestSign > 0 && value > 0) days += 1;
    else if (latestSign < 0 && value < 0) days += 1;
    else if (value === 0) continue;
    else break;
  }

  const direction = latestSign > 0 ? "買超" : "賣超";
  return { direction, days, label: `${direction} ${days} 日` };
}

function buildChipAnalysis(params: { institutionalRows: any[]; marginRows: any[] }): ChipAnalysis {
  const institutionalDaily = groupInstitutionalByDate(params.institutionalRows || []);
  const marginRows = Array.isArray(params.marginRows)
    ? [...params.marginRows].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    : [];

  if (institutionalDaily.length === 0 && marginRows.length === 0) {
    return {
      enabled: true,
      status: "no_data",
      score: 50,
      verdict: "中立",
      trend: "neutral",
      latestDate: null,
      institutional: {
        foreignNetBuy: 0,
        investmentTrustNetBuy: 0,
        dealerNetBuy: 0,
        totalNetBuy: 0,
        fiveDayNetBuy: 0,
        twentyDayNetBuy: 0,
        foreignStreak: { direction: "無明顯方向", days: 0, label: "資料不足" },
        investmentTrustStreak: { direction: "無明顯方向", days: 0, label: "資料不足" },
        dealerStreak: { direction: "無明顯方向", days: 0, label: "資料不足" },
        totalStreak: { direction: "無明顯方向", days: 0, label: "資料不足" },
        signal: "法人資料不足",
        reasons: ["目前抓不到三大法人買賣超資料，暫時不納入籌碼判斷。"],
      },
      margin: {
        marginBalance: null,
        shortBalance: null,
        marginBalanceChange5: null,
        shortBalanceChange5: null,
        marginShortRatio: null,
        signal: "融資融券資料不足",
        reasons: ["目前抓不到融資融券資料，暫時不納入籌碼判斷。"],
      },
      summary: "籌碼資料不足，暫時維持中立。",
      riskWarning: "籌碼面只代表資金流向與信用交易變化，不能單獨作為買賣依據。",
    };
  }

  const latestInstitutional = institutionalDaily[institutionalDaily.length - 1];
  const last5Institutional = institutionalDaily.slice(-5);
  const last20Institutional = institutionalDaily.slice(-20);

  const fiveDayNetBuy = last5Institutional.reduce((sum, item) => sum + item.totalNetBuy, 0);
  const twentyDayNetBuy = last20Institutional.reduce((sum, item) => sum + item.totalNetBuy, 0);

  const latestMargin = marginRows[marginRows.length - 1] || null;
  const compareMargin = marginRows.length >= 6 ? marginRows[marginRows.length - 6] : marginRows[0] || null;

  const marginBalance = latestMargin ? numberValue(latestMargin.MarginPurchaseTodayBalance ?? latestMargin.margin_purchase_today_balance) : null;
  const shortBalance = latestMargin ? numberValue(latestMargin.ShortSaleTodayBalance ?? latestMargin.short_sale_today_balance) : null;
  const previousMarginBalance = compareMargin ? numberValue(compareMargin.MarginPurchaseTodayBalance ?? compareMargin.margin_purchase_today_balance) : null;
  const previousShortBalance = compareMargin ? numberValue(compareMargin.ShortSaleTodayBalance ?? compareMargin.short_sale_today_balance) : null;

  const marginBalanceChange5 =
    marginBalance !== null && previousMarginBalance !== null ? marginBalance - previousMarginBalance : null;
  const shortBalanceChange5 =
    shortBalance !== null && previousShortBalance !== null ? shortBalance - previousShortBalance : null;
  const marginShortRatio =
    marginBalance !== null && shortBalance !== null && shortBalance > 0 ? marginBalance / shortBalance : null;

  let score = 50;
  const institutionalReasons: string[] = [];
  const marginReasons: string[] = [];

  const latestTotal = latestInstitutional?.totalNetBuy || 0;
  const latestForeign = latestInstitutional?.foreignNetBuy || 0;
  const latestTrust = latestInstitutional?.investmentTrustNetBuy || 0;
  const latestDealer = latestInstitutional?.dealerNetBuy || 0;
  const foreignStreak = buildInstitutionalStreak(institutionalDaily, "foreignNetBuy");
  const investmentTrustStreak = buildInstitutionalStreak(institutionalDaily, "investmentTrustNetBuy");
  const dealerStreak = buildInstitutionalStreak(institutionalDaily, "dealerNetBuy");
  const totalStreak = buildInstitutionalStreak(institutionalDaily, "totalNetBuy");

  if (foreignStreak.days >= 3 && foreignStreak.direction === "買超") {
    score += 5;
    institutionalReasons.push(`外資連續${foreignStreak.label}，外資籌碼延續偏多。`);
  } else if (foreignStreak.days >= 3 && foreignStreak.direction === "賣超") {
    score -= 5;
    institutionalReasons.push(`外資連續${foreignStreak.label}，外資賣壓需要留意。`);
  }

  if (investmentTrustStreak.days >= 3 && investmentTrustStreak.direction === "買超") {
    score += 4;
    institutionalReasons.push(`投信連續${investmentTrustStreak.label}，內資法人動能偏強。`);
  } else if (investmentTrustStreak.days >= 3 && investmentTrustStreak.direction === "賣超") {
    score -= 4;
    institutionalReasons.push(`投信連續${investmentTrustStreak.label}，內資法人偏保守。`);
  }

  if (fiveDayNetBuy > 0) {
    score += 12;
    institutionalReasons.push("近5日三大法人合計買超，短線資金流向偏多。");
  } else if (fiveDayNetBuy < 0) {
    score -= 12;
    institutionalReasons.push("近5日三大法人合計賣超，短線資金流向偏保守。");
  }

  if (twentyDayNetBuy > 0) {
    score += 8;
    institutionalReasons.push("近20日法人累計仍偏買超，中期籌碼較健康。");
  } else if (twentyDayNetBuy < 0) {
    score -= 8;
    institutionalReasons.push("近20日法人累計偏賣超，中期籌碼仍有壓力。");
  }

  if (latestForeign > 0) {
    score += 6;
    institutionalReasons.push("最近一日外資買超，外資籌碼偏正向。");
  } else if (latestForeign < 0) {
    score -= 6;
    institutionalReasons.push("最近一日外資賣超，需留意外資賣壓。 ");
  }

  if (latestTrust > 0) {
    score += 6;
    institutionalReasons.push("最近一日投信買超，內資法人動能偏強。");
  } else if (latestTrust < 0) {
    score -= 4;
    institutionalReasons.push("最近一日投信賣超，內資法人短線偏保守。");
  }

  if (marginBalanceChange5 !== null) {
    if (marginBalanceChange5 > 0 && fiveDayNetBuy < 0) {
      score -= 8;
      marginReasons.push("近5日融資增加但法人賣超，容易形成散戶承接壓力。 ");
    } else if (marginBalanceChange5 > 0) {
      score -= 3;
      marginReasons.push("近5日融資餘額增加，代表信用買盤升溫，追高需保守。 ");
    } else if (marginBalanceChange5 < 0 && fiveDayNetBuy > 0) {
      score += 8;
      marginReasons.push("近5日融資下降且法人買超，籌碼沉澱狀況較佳。 ");
    } else if (marginBalanceChange5 < 0) {
      score += 3;
      marginReasons.push("近5日融資餘額下降，散戶槓桿壓力有下降跡象。 ");
    }
  }

  if (shortBalanceChange5 !== null) {
    if (shortBalanceChange5 > 0) {
      marginReasons.push("近5日融券餘額增加，市場放空或避險力道上升。 ");
    } else if (shortBalanceChange5 < 0) {
      marginReasons.push("近5日融券餘額下降，空方回補壓力減輕。 ");
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let verdict: ChipAnalysis["verdict"] = "中立";
  let trend: ChipAnalysis["trend"] = "neutral";
  if (score >= 65) {
    verdict = "偏多";
    trend = "bull";
  } else if (score <= 40) {
    verdict = "偏空";
    trend = "bear";
  } else if (score >= 55) {
    trend = "warning";
  }

  let institutionalSignal = "法人中性";
  if (fiveDayNetBuy > 0 && twentyDayNetBuy > 0) institutionalSignal = "法人連續偏買";
  else if (fiveDayNetBuy < 0 && twentyDayNetBuy < 0) institutionalSignal = "法人連續偏賣";
  else if (fiveDayNetBuy > 0) institutionalSignal = "法人短線轉買";
  else if (fiveDayNetBuy < 0) institutionalSignal = "法人短線轉賣";

  let marginSignal = "信用籌碼中性";
  if (marginBalanceChange5 !== null && marginBalanceChange5 > 0 && fiveDayNetBuy < 0) marginSignal = "融資增、法人賣";
  else if (marginBalanceChange5 !== null && marginBalanceChange5 < 0 && fiveDayNetBuy > 0) marginSignal = "融資減、法人買";
  else if (marginBalanceChange5 !== null && marginBalanceChange5 > 0) marginSignal = "融資增加";
  else if (marginBalanceChange5 !== null && marginBalanceChange5 < 0) marginSignal = "融資減少";

  if (institutionalReasons.length === 0) institutionalReasons.push("法人買賣超沒有明顯方向，暫以中性看待。 ");
  if (marginReasons.length === 0) marginReasons.push("融資融券沒有明顯異常，暫以中性看待。 ");

  const latestDate = latestInstitutional?.date || String(latestMargin?.date || "") || null;
  const summary = `籌碼面目前為「${verdict}」，分數 ${score}。法人訊號：${institutionalSignal}；信用交易訊號：${marginSignal}。`;

  return {
    enabled: true,
    status: institutionalDaily.length > 0 && marginRows.length > 0 ? "ok" : "partial",
    score,
    verdict,
    trend,
    latestDate,
    institutional: {
      foreignNetBuy: latestForeign,
      investmentTrustNetBuy: latestTrust,
      dealerNetBuy: latestDealer,
      totalNetBuy: latestTotal,
      fiveDayNetBuy,
      twentyDayNetBuy,
      foreignStreak,
      investmentTrustStreak,
      dealerStreak,
      totalStreak,
      signal: institutionalSignal,
      reasons: institutionalReasons.slice(0, 5),
    },
    margin: {
      marginBalance,
      shortBalance,
      marginBalanceChange5,
      shortBalanceChange5,
      marginShortRatio,
      signal: marginSignal,
      reasons: marginReasons.slice(0, 5),
    },
    summary,
    riskWarning: "籌碼面只代表資金流向與信用交易變化，仍需搭配技術面、基本面與風險控管。",
  };
}

async function fetchChipAnalysis(symbol: string, finmindToken: string): Promise<ChipAnalysis> {
  try {
    const startDate = getStartDate(90);
    const institutionalUrl =
      `https://api.finmindtrade.com/api/v4/data?` +
      `dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id=${symbol}` +
      `&start_date=${startDate}` +
      `&token=${finmindToken}`;

    const marginUrl =
      `https://api.finmindtrade.com/api/v4/data?` +
      `dataset=TaiwanStockMarginPurchaseShortSale&data_id=${symbol}` +
      `&start_date=${startDate}` +
      `&token=${finmindToken}`;

    const [institutionalResponse, marginResponse] = await Promise.allSettled([
      fetchWithTimeout(institutionalUrl, {}, 12000),
      fetchWithTimeout(marginUrl, {}, 12000),
    ]);

    let institutionalRows: any[] = [];
    let marginRows: any[] = [];

    if (institutionalResponse.status === "fulfilled" && institutionalResponse.value.ok) {
      const json = await institutionalResponse.value.json();
      if (Array.isArray(json.data)) institutionalRows = json.data;
    }

    if (marginResponse.status === "fulfilled" && marginResponse.value.ok) {
      const json = await marginResponse.value.json();
      if (Array.isArray(json.data)) marginRows = json.data;
    }

    return buildChipAnalysis({ institutionalRows, marginRows });
  } catch {
    const fallback = buildChipAnalysis({ institutionalRows: [], marginRows: [] });
    return { ...fallback, status: "error", summary: "籌碼資料讀取失敗，暫時不納入判斷。" };
  }
}


function pickNumber(row: any, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && typeof value !== "undefined" && value !== "") {
      const num = Number(value);
      if (!Number.isNaN(num)) return num;
    }
  }
  return null;
}

function rowTypeText(row: any) {
  return String(row?.type || row?.name || row?.account || row?.account_name || row?.item || "");
}

function findFinancialValue(rows: any[], keywords: string[]) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const text = rowTypeText(row);
    if (keywords.some((keyword) => text.includes(keyword))) {
      return pickNumber(row, ["value", "amount", "data", "metric_value"]);
    }
  }
  return null;
}

function buildFundamentalAnalysis(params: { revenueRows: any[]; financialRows: any[] }): FundamentalAnalysis {
  const revenueRows = Array.isArray(params.revenueRows)
    ? [...params.revenueRows].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    : [];
  const financialRows = Array.isArray(params.financialRows)
    ? [...params.financialRows].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    : [];

  const latestRevenue = revenueRows[revenueRows.length - 1] || null;
  const previousRevenue = revenueRows[revenueRows.length - 2] || null;
  const yoyRevenue = revenueRows.length >= 13 ? revenueRows[revenueRows.length - 13] : null;

  const monthlyRevenue = latestRevenue ? pickNumber(latestRevenue, ["revenue", "Revenue", "monthly_revenue"]) : null;
  const previousMonthlyRevenue = previousRevenue ? pickNumber(previousRevenue, ["revenue", "Revenue", "monthly_revenue"]) : null;
  const lastYearRevenue = yoyRevenue ? pickNumber(yoyRevenue, ["revenue", "Revenue", "monthly_revenue"]) : null;

  const monthlyRevenueMoM = monthlyRevenue !== null && previousMonthlyRevenue && previousMonthlyRevenue !== 0
    ? ((monthlyRevenue - previousMonthlyRevenue) / previousMonthlyRevenue) * 100
    : null;
  const monthlyRevenueYoY = monthlyRevenue !== null && lastYearRevenue && lastYearRevenue !== 0
    ? ((monthlyRevenue - lastYearRevenue) / lastYearRevenue) * 100
    : null;

  const eps = findFinancialValue(financialRows, ["EPS", "每股盈餘", "基本每股盈餘"]);
  const grossMargin = findFinancialValue(financialRows, ["GrossProfitMargin", "毛利率"]);
  const operatingMargin = findFinancialValue(financialRows, ["OperatingProfitMargin", "營業利益率", "營益率"]);
  const netProfitMargin = findFinancialValue(financialRows, ["NetProfitMargin", "淨利率"]);

  if (!latestRevenue && financialRows.length === 0) {
    return {
      enabled: true,
      status: "no_data",
      score: 50,
      verdict: "中立",
      trend: "neutral",
      latestRevenueMonth: null,
      monthlyRevenue: null,
      monthlyRevenueYoY: null,
      monthlyRevenueMoM: null,
      eps: null,
      grossMargin: null,
      operatingMargin: null,
      netProfitMargin: null,
      signal: "基本面資料不足",
      reasons: ["目前抓不到營收或財報資料，暫時不納入基本面判斷。"],
      summary: "基本面資料不足，維持中立。",
      riskWarning: "財報資料通常有公布延遲，不能取代即時風險控管。",
    };
  }

  let score = 50;
  const reasons: string[] = [];

  if (monthlyRevenueYoY !== null) {
    if (monthlyRevenueYoY >= 20) { score += 18; reasons.push("月營收年增率高於20%，成長動能明顯。 "); }
    else if (monthlyRevenueYoY >= 5) { score += 10; reasons.push("月營收年增率為正，基本面動能偏正向。 "); }
    else if (monthlyRevenueYoY <= -20) { score -= 18; reasons.push("月營收年減超過20%，基本面壓力偏大。 "); }
    else if (monthlyRevenueYoY < 0) { score -= 10; reasons.push("月營收年增率為負，需留意需求或報價壓力。 "); }
  }

  if (monthlyRevenueMoM !== null) {
    if (monthlyRevenueMoM >= 10) { score += 8; reasons.push("月營收月增超過10%，短期營運動能升溫。 "); }
    else if (monthlyRevenueMoM <= -10) { score -= 8; reasons.push("月營收月減超過10%，短期營運動能轉弱。 "); }
  }

  if (eps !== null) {
    if (eps > 0) { score += 8; reasons.push("EPS為正，獲利能力仍有支撐。 "); }
    else if (eps < 0) { score -= 14; reasons.push("EPS為負，獲利面需要保守看待。 "); }
  }

  if (grossMargin !== null) {
    if (grossMargin >= 40) { score += 8; reasons.push("毛利率高於40%，產品競爭力或產業地位較佳。 "); }
    else if (grossMargin < 15) { score -= 6; reasons.push("毛利率偏低，需留意成本與報價壓力。 "); }
  }

  if (operatingMargin !== null) {
    if (operatingMargin > 15) { score += 6; reasons.push("營業利益率表現較佳，本業獲利品質偏正向。 "); }
    else if (operatingMargin < 0) { score -= 10; reasons.push("營業利益率為負，本業獲利承壓。 "); }
  }

  if (reasons.length === 0) reasons.push("目前基本面資料可用但訊號不明顯，暫時偏中性。 ");

  score = Math.max(0, Math.min(100, Math.round(score)));
  let verdict: FundamentalAnalysis["verdict"] = "中立";
  let trend: FundamentalAnalysis["trend"] = "neutral";
  if (score >= 65) { verdict = "偏多"; trend = "bull"; }
  else if (score <= 40) { verdict = "偏空"; trend = "bear"; }
  else if (score >= 55) { trend = "warning"; }

  const signal = score >= 65 ? "營運動能偏強" : score <= 40 ? "基本面偏弱" : "基本面中性";
  const summary = `基本面目前為${verdict}，分數 ${score}。${reasons[0] || ""}`;

  return {
    enabled: true,
    status: latestRevenue && financialRows.length > 0 ? "ok" : "partial",
    score,
    verdict,
    trend,
    latestRevenueMonth: latestRevenue?.date || latestRevenue?.revenue_month || null,
    monthlyRevenue,
    monthlyRevenueYoY,
    monthlyRevenueMoM,
    eps,
    grossMargin,
    operatingMargin,
    netProfitMargin,
    signal,
    reasons: reasons.slice(0, 6),
    summary,
    riskWarning: "基本面適合看中長期方向，短線仍要搭配技術面、籌碼面與大盤環境。",
  };
}

async function fetchFundamentalAnalysis(symbol: string, finmindToken: string): Promise<FundamentalAnalysis> {
  try {
    const revenueUrl =
      `https://api.finmindtrade.com/api/v4/data?` +
      `dataset=TaiwanStockMonthRevenue&data_id=${symbol}` +
      `&start_date=${getStartDate(430)}` +
      `&token=${finmindToken}`;

    const financialUrl =
      `https://api.finmindtrade.com/api/v4/data?` +
      `dataset=TaiwanStockFinancialStatements&data_id=${symbol}` +
      `&start_date=${getStartDate(900)}` +
      `&token=${finmindToken}`;

    const [revenueResponse, financialResponse] = await Promise.allSettled([
      fetchWithTimeout(revenueUrl, {}, 12000),
      fetchWithTimeout(financialUrl, {}, 12000),
    ]);

    let revenueRows: any[] = [];
    let financialRows: any[] = [];

    if (revenueResponse.status === "fulfilled" && revenueResponse.value.ok) {
      const json = await revenueResponse.value.json();
      if (Array.isArray(json.data)) revenueRows = json.data;
    }

    if (financialResponse.status === "fulfilled" && financialResponse.value.ok) {
      const json = await financialResponse.value.json();
      if (Array.isArray(json.data)) financialRows = json.data;
    }

    return buildFundamentalAnalysis({ revenueRows, financialRows });
  } catch {
    const fallback = buildFundamentalAnalysis({ revenueRows: [], financialRows: [] });
    return { ...fallback, status: "error", summary: "基本面資料讀取失敗，暫時不納入判斷。" };
  }
}

function buildIndustryThemeAnalysis(symbol: string, stockName: string, sources: DiscussionSource[], status: IndustryThemeAnalysis["status"]): IndustryThemeAnalysis {
  const text = sources.map((item) => `${item.title} ${item.content}`).join("\n");
  const themeKeywords = ["AI", "伺服器", "半導體", "先進製程", "CoWoS", "HBM", "電動車", "車用", "5G", "6G", "蘋果", "輝達", "NVIDIA", "機器人", "軍工", "散熱", "矽光子", "高股息", "ETF", "金融", "航運", "運價", "記憶體", "DRAM", "面板"];
  const riskKeywords = ["競爭", "庫存", "衰退", "砍單", "毛利", "降價", "法說保守", "匯率", "地緣", "禁令", "利空", "泡沫", "過熱"];
  const positiveKeywords = ["成長", "受惠", "需求", "訂單", "擴產", "漲價", "買超", "創高", "轉強", "展望佳", "上修"];
  const negativeKeywords = ["衰退", "下修", "賣超", "砍單", "轉弱", "庫存", "跌價", "利空", "保守"];

  const themes = themeKeywords
    .map((keyword) => ({ keyword, count: countKeywordMatches(text, [keyword]) }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => item.keyword);

  const positiveCount = countKeywordMatches(text, positiveKeywords);
  const negativeCount = countKeywordMatches(text, negativeKeywords);
  const riskCount = countKeywordMatches(text, riskKeywords);
  const heatCount = text.length > 0 ? sources.length + themes.length + positiveCount + negativeCount : 0;

  let score = 50 + positiveCount * 4 - negativeCount * 4 + themes.length * 2;
  if (riskCount >= 5) score -= 8;
  if (heatCount >= 20 && score >= 70) score -= 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let verdict: IndustryThemeAnalysis["verdict"] = "中立";
  let trend: IndustryThemeAnalysis["trend"] = "neutral";
  if (score >= 75 && heatCount >= 20) { verdict = "題材過熱"; trend = "warning"; }
  else if (score >= 65) { verdict = "偏多"; trend = "bull"; }
  else if (score <= 40) { verdict = "偏空"; trend = "bear"; }

  const heat: IndustryThemeAnalysis["heat"] = heatCount >= 20 ? "高" : heatCount >= 8 ? "中" : "低";
  const opportunities: string[] = [];
  const risks: string[] = [];

  if (themes.length) opportunities.push(`目前市場提到的題材包含：${themes.slice(0, 5).join("、")}。`);
  if (positiveCount > negativeCount) opportunities.push("正向題材詞多於負向詞，產業敘事偏正向。 ");
  if (positiveCount === 0 && themes.length === 0) opportunities.push("目前沒有抓到明確產業題材，題材面暫時中性。 ");
  if (riskCount > 0) risks.push("公開資料中出現競爭、庫存、降價、匯率或政策等風險詞，需要保守看待。 ");
  if (verdict === "題材過熱") risks.push("題材熱度高且分數偏高，需防短線利多鈍化或追高風險。 ");
  if (negativeCount > positiveCount) risks.push("負向題材詞較多，需留意產業逆風。 ");

  if (sources.length === 0) {
    return {
      enabled: true,
      status,
      score: 50,
      verdict: "中立",
      trend: "neutral",
      heat: "低",
      themes: [],
      opportunities: ["目前沒有抓到足夠的產業題材公開資料。"],
      risks: ["題材資料不足時，不應把題材面當成主要依據。"],
      summary: "產業題材資料不足，暫時中立。",
      sources: [],
    };
  }

  return {
    enabled: true,
    status,
    score,
    verdict,
    trend,
    heat,
    themes,
    opportunities: opportunities.slice(0, 5),
    risks: risks.slice(0, 5),
    summary: `產業題材目前為${verdict}，熱度${heat}，主要題材：${themes.slice(0, 5).join("、") || "暫無明確題材"}。`,
    sources,
  };
}

async function fetchIndustryThemeAnalysis(symbol: string, stockName: string): Promise<IndustryThemeAnalysis> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const query = `${stockName} ${symbol} 產業 題材 受惠 成長 風險 法說 展望 台股`;
  if (!tavilyKey) return buildIndustryThemeAnalysis(symbol, stockName, [], "missing_key");
  try {
    const response = await fetchWithTimeout(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify({ query, search_depth: "advanced", max_results: 8, include_answer: true, include_raw_content: false }),
      },
      15000
    );
    if (!response.ok) return buildIndustryThemeAnalysis(symbol, stockName, [], "error");
    const json = await response.json();
    const sources: DiscussionSource[] = (json.results || []).map((item: any) => ({
      title: String(item.title || "公開資料"),
      url: String(item.url || ""),
      content: String(item.content || ""),
    })).filter((item: DiscussionSource) => item.url);
    return buildIndustryThemeAnalysis(symbol, stockName, sources, sources.length ? "ok" : "no_results");
  } catch {
    return buildIndustryThemeAnalysis(symbol, stockName, [], "error");
  }
}

function buildMarketEnvironmentAnalysis(rows: KBar[]): MarketEnvironmentAnalysis {
  const kbars = Array.isArray(rows) ? rows : [];
  if (kbars.length < 20) {
    return {
      enabled: true,
      status: "no_data",
      score: 50,
      verdict: "中立",
      trend: "neutral",
      latestDate: null,
      indexName: "台股加權指數",
      close: null,
      changePercent: null,
      ma5: null,
      ma20: null,
      ma60: null,
      rsi14: null,
      signal: "大盤資料不足",
      reasons: ["目前抓不到足夠的大盤K線資料，暫時不納入大盤環境判斷。"],
      summary: "大盤環境資料不足，暫時中立。",
      riskWarning: "大盤環境會影響個股勝率，資料不足時應降低部位。",
    };
  }

  const closes = kbars.map((item) => Number(item.close));
  const latest = kbars[kbars.length - 1];
  const previous = kbars[kbars.length - 2];
  const close = Number(latest.close);
  const prevClose = Number(previous.close);
  const ma5Value = sma(closes, 5);
  const ma20Value = sma(closes, 20);
  const ma60Value = sma(closes, 60);
  const rsiValue = rsi(closes, 14);
  const changePercent = prevClose > 0 ? ((close - prevClose) / prevClose) * 100 : null;

  let score = 50;
  const reasons: string[] = [];
  if (ma5Value !== null && ma20Value !== null) {
    if (ma5Value > ma20Value) { score += 12; reasons.push("大盤 MA5 高於 MA20，短線環境偏多。 "); }
    else { score -= 12; reasons.push("大盤 MA5 低於 MA20，短線環境偏弱。 "); }
  }
  if (ma20Value !== null && ma60Value !== null) {
    if (ma20Value > ma60Value) { score += 10; reasons.push("大盤 MA20 高於 MA60，中期趨勢較健康。 "); }
    else { score -= 10; reasons.push("大盤 MA20 低於 MA60，中期趨勢仍有壓力。 "); }
  }
  if (rsiValue !== null) {
    if (rsiValue >= 75) { score -= 8; reasons.push("大盤 RSI 偏高，短線需防震盪。 "); }
    else if (rsiValue >= 55) { score += 8; reasons.push("大盤 RSI 位於偏強區，市場風險偏好較佳。 "); }
    else if (rsiValue <= 35) { score -= 8; reasons.push("大盤 RSI 偏弱，市場承壓。 "); }
  }
  if (changePercent !== null) {
    if (changePercent >= 1) { score += 6; reasons.push("大盤單日漲幅超過1%，市場氣氛偏多。 "); }
    else if (changePercent <= -1) { score -= 8; reasons.push("大盤單日跌幅超過1%，短線風險升高。 "); }
  }
  if (reasons.length === 0) reasons.push("大盤目前沒有明顯強弱訊號，偏中性。 ");

  score = Math.max(0, Math.min(100, Math.round(score)));
  let verdict: MarketEnvironmentAnalysis["verdict"] = "中立";
  let trend: MarketEnvironmentAnalysis["trend"] = "neutral";
  if (score >= 65) { verdict = "偏多"; trend = "bull"; }
  else if (score <= 40) { verdict = "偏空"; trend = "bear"; }
  else if (score >= 55) { trend = "warning"; }

  return {
    enabled: true,
    status: "ok",
    score,
    verdict,
    trend,
    latestDate: latest.date,
    indexName: "台股加權指數",
    close,
    changePercent,
    ma5: ma5Value,
    ma20: ma20Value,
    ma60: ma60Value,
    rsi14: rsiValue,
    signal: score >= 65 ? "大盤環境偏多" : score <= 40 ? "大盤環境偏空" : "大盤環境中性",
    reasons: reasons.slice(0, 6),
    summary: `大盤環境目前為${verdict}，分數 ${score}。${reasons[0] || ""}`,
    riskWarning: "大盤偏空時，個股即使技術面強，也要降低追價與重倉風險。",
  };
}

async function fetchMarketEnvironmentAnalysis(finmindToken: string): Promise<MarketEnvironmentAnalysis> {
  const tryIds = ["TAIEX", "TWSE", "加權指數"];
  try {
    for (const id of tryIds) {
      const url =
        `https://api.finmindtrade.com/api/v4/data?` +
        `dataset=TaiwanStockPrice&data_id=${encodeURIComponent(id)}` +
        `&start_date=${getStartDate(180)}` +
        `&token=${finmindToken}`;
      try {
        const response = await fetchWithTimeout(url, {}, 10000);
        if (!response.ok) continue;
        const json = await response.json();
        if (Array.isArray(json.data) && json.data.length >= 20) {
          return buildMarketEnvironmentAnalysis(json.data as KBar[]);
        }
      } catch {}
    }
    return buildMarketEnvironmentAnalysis([]);
  } catch {
    const fallback = buildMarketEnvironmentAnalysis([]);
    return { ...fallback, status: "error", summary: "大盤環境資料讀取失敗，暫時不納入判斷。" };
  }
}

function sma(values: number[], period: number) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function ema(values: number[], period: number) {
  if (values.length === 0) return null;

  const k = 2 / (period + 1);
  let result = values[0];

  for (let i = 1; i < values.length; i++) {
    result = values[i] * k + result * (1 - k);
  }

  return result;
}

function macd(values: number[]) {
  if (values.length < 35) return null;

  const ema12 = ema(values.slice(-60), 12);
  const ema26 = ema(values.slice(-60), 26);

  if (ema12 === null || ema26 === null) return null;

  return ema12 - ema26;
}

function rsi(values: number[], period = 14) {
  if (values.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];

    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  if (losses === 0) return 100;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function kd(kbars: KBar[], period = 9) {
  if (kbars.length < period) return null;

  const recent = kbars.slice(-period);
  const high = Math.max(...recent.map((item) => Number(item.max)));
  const low = Math.min(...recent.map((item) => Number(item.min)));
  const close = Number(kbars[kbars.length - 1].close);

  if (high === low) return 50;

  return ((close - low) / (high - low)) * 100;
}

function buildVolumeAnalysis(kbars: KBar[]) {
  const volumes = kbars.map((item) => Number(item.Trading_Volume || 0));
  const closes = kbars.map((item) => Number(item.close));

  const latestVolume = volumes[volumes.length - 1] || 0;
  const previousVolume = volumes[volumes.length - 2] || 0;

  const latestClose = closes[closes.length - 1];
  const previousClose = closes[closes.length - 2];

  const avgVolume5 = sma(volumes, 5);
  const avgVolume20 = sma(volumes, 20);

  const volumeRatio5 =
    avgVolume5 && avgVolume5 > 0 ? latestVolume / avgVolume5 : null;

  const volumeRatio20 =
    avgVolume20 && avgVolume20 > 0 ? latestVolume / avgVolume20 : null;

  const priceChangePercent =
    previousClose > 0 ? ((latestClose - previousClose) / previousClose) * 100 : 0;

  let signal = "量能普通";
  let trend: "bull" | "bear" | "neutral" | "warning" = "neutral";
  const reasons: string[] = [];

  if (volumeRatio20 !== null && volumeRatio20 >= 1.5 && priceChangePercent > 1) {
    signal = "放量上攻";
    trend = "bull";
    reasons.push("成交量高於20日均量1.5倍以上，且股價同步上漲，屬於較強的量價配合。");
  } else if (volumeRatio20 !== null && volumeRatio20 >= 1.5 && priceChangePercent < -1) {
    signal = "放量下跌";
    trend = "bear";
    reasons.push("成交量明顯放大但股價下跌，代表賣壓偏重，短線需保守。");
  } else if (priceChangePercent > 1 && volumeRatio20 !== null && volumeRatio20 < 0.8) {
    signal = "價漲量縮";
    trend = "warning";
    reasons.push("股價上漲但量能低於20日均量，追價力道可能不足。");
  } else if (Math.abs(priceChangePercent) < 1 && volumeRatio20 !== null && volumeRatio20 < 0.8) {
    signal = "縮量整理";
    trend = "neutral";
    reasons.push("股價波動不大且成交量偏低，目前偏向整理等待方向。");
  } else {
    reasons.push("成交量沒有明顯異常，需搭配均線與K棒型態判斷。");
  }

  if (volumeRatio5 !== null) {
    if (volumeRatio5 >= 1.3) {
      reasons.push("今日量能高於5日均量，短線市場關注度增加。");
    } else if (volumeRatio5 <= 0.7) {
      reasons.push("今日量能低於5日均量，短線買盤積極度不足。");
    }
  }

  return {
    latestVolume,
    previousVolume,
    avgVolume5,
    avgVolume20,
    volumeRatio5,
    volumeRatio20,
    priceChangePercent,
    signal,
    trend,
    reasons,
  };
}

function buildSupportResistance(kbars: KBar[]) {
  const latest = kbars[kbars.length - 1];
  const latestClose = Number(latest.close);

  const prev20 = kbars.slice(-21, -1);
  const prev60 = kbars.slice(-61, -1);

  const high20 = Math.max(...prev20.map((item) => Number(item.max)));
  const low20 = Math.min(...prev20.map((item) => Number(item.min)));

  const high60 = Math.max(...prev60.map((item) => Number(item.max)));
  const low60 = Math.min(...prev60.map((item) => Number(item.min)));

  const distanceTo20HighPercent =
    latestClose > 0 ? ((high20 - latestClose) / latestClose) * 100 : 0;

  const distanceTo20LowPercent =
    latestClose > 0 ? ((latestClose - low20) / latestClose) * 100 : 0;

  const distanceTo60HighPercent =
    latestClose > 0 ? ((high60 - latestClose) / latestClose) * 100 : 0;

  const distanceTo60LowPercent =
    latestClose > 0 ? ((latestClose - low60) / latestClose) * 100 : 0;

  let signal = "區間中段";
  let trend: "bull" | "bear" | "neutral" | "warning" = "neutral";
  const reasons: string[] = [];

  if (latestClose > high20) {
    signal = "突破20日壓力";
    trend = "bull";
    reasons.push("收盤價已突破近20日高點，短線多方訊號轉強。");
  } else if (latestClose < low20) {
    signal = "跌破20日支撐";
    trend = "bear";
    reasons.push("收盤價跌破近20日低點，短線支撐失守，風險升高。");
  } else if (distanceTo20HighPercent >= 0 && distanceTo20HighPercent <= 2) {
    signal = "接近20日壓力";
    trend = "warning";
    reasons.push("目前股價距離20日壓力區很近，追價空間有限。");
  } else if (distanceTo20LowPercent >= 0 && distanceTo20LowPercent <= 3) {
    signal = "接近20日支撐";
    trend = "neutral";
    reasons.push("目前股價接近20日支撐區，可觀察是否止跌反彈。");
  } else {
    reasons.push("目前股價位於近20日區間中段，尚未接近明顯壓力或支撐。");
  }

  if (latestClose > high60) {
    reasons.push("同時突破近60日高點，中期趨勢也偏強。");
  } else if (latestClose < low60) {
    reasons.push("同時跌破近60日低點，中期趨勢偏弱。");
  }

  return {
    latestClose,
    high20,
    low20,
    high60,
    low60,
    distanceTo20HighPercent,
    distanceTo20LowPercent,
    distanceTo60HighPercent,
    distanceTo60LowPercent,
    signal,
    trend,
    reasons,
  };
}

function buildPatternAnalysis(
  kbars: KBar[],
  ma5: number | null,
  ma20: number | null,
  ma60: number | null
) {
  const latest = kbars[kbars.length - 1];
  const prev = kbars[kbars.length - 2];

  const open = Number(latest.open);
  const high = Number(latest.max);
  const low = Number(latest.min);
  const close = Number(latest.close);
  const prevClose = Number(prev.close);

  const body = Math.abs(close - open);
  const range = Math.max(high - low, 1);
  const bodyRatio = body / range;
  const changePercent = prevClose > 0 ? ((close - prevClose) / prevClose) * 100 : 0;

  const last5 = kbars.slice(-5);
  const last5UpCount = last5.filter((item) => Number(item.close) > Number(item.open)).length;
  const last5DownCount = last5.filter((item) => Number(item.close) < Number(item.open)).length;

  const prev20 = kbars.slice(-21, -1);
  const high20 = Math.max(...prev20.map((item) => Number(item.max)));
  const low20 = Math.min(...prev20.map((item) => Number(item.min)));

  let signal = "一般震盪";
  let trend: "bull" | "bear" | "neutral" | "warning" = "neutral";
  const patterns: string[] = [];
  const reasons: string[] = [];

  if (ma5 !== null && ma20 !== null && ma60 !== null) {
    if (ma5 > ma20 && ma20 > ma60) {
      patterns.push("均線多頭排列");
      reasons.push("MA5 > MA20 > MA60，趨勢結構偏多。");
      trend = "bull";
    } else if (ma5 < ma20 && ma20 < ma60) {
      patterns.push("均線空頭排列");
      reasons.push("MA5 < MA20 < MA60，趨勢結構偏弱。");
      trend = "bear";
    }
  }

  if (close > open && bodyRatio >= 0.65 && changePercent >= 2) {
    patterns.push("長紅K");
    reasons.push("今日收紅且實體佔比高，買盤力道明顯。");
    trend = trend === "bear" ? "neutral" : "bull";
  }

  if (close < open && bodyRatio >= 0.65 && changePercent <= -2) {
    patterns.push("長黑K");
    reasons.push("今日收黑且實體佔比高，賣壓明顯。");
    trend = "bear";
  }

  if (last5UpCount >= 4) {
    patterns.push("近5日多數紅K");
    reasons.push("近5日有4日以上收紅，短線動能偏強。");
    trend = trend === "bear" ? "neutral" : "bull";
  }

  if (last5DownCount >= 4) {
    patterns.push("近5日多數黑K");
    reasons.push("近5日有4日以上收黑，短線賣壓偏重。");
    trend = "bear";
  }

  if (close > high20) {
    patterns.push("突破整理區");
    reasons.push("收盤價突破近20日高點，屬於突破整理區型態。");
    trend = "bull";
  }

  if (close < low20) {
    patterns.push("跌破整理區");
    reasons.push("收盤價跌破近20日低點，屬於跌破整理區型態。");
    trend = "bear";
  }

  if (high > high20 && close < high20) {
    patterns.push("假突破風險");
    reasons.push("盤中突破近20日高點但收盤未站穩，需防假突破。");
    trend = "warning";
  }

  if (bodyRatio <= 0.25) {
    patterns.push("十字震盪");
    reasons.push("K棒實體偏小，多空拉鋸，短線方向尚未明確。");
    if (trend === "neutral") trend = "warning";
  }

  if (patterns.length === 0) {
    patterns.push("一般震盪");
    reasons.push("目前未出現明確突破、跌破或強烈K棒型態。");
  }

  if (patterns.includes("突破整理區")) {
    signal = "突破整理區";
  } else if (patterns.includes("跌破整理區")) {
    signal = "跌破整理區";
  } else if (patterns.includes("假突破風險")) {
    signal = "假突破風險";
  } else if (patterns.includes("均線多頭排列")) {
    signal = "均線多頭排列";
  } else if (patterns.includes("均線空頭排列")) {
    signal = "均線空頭排列";
  } else if (patterns.includes("長紅K")) {
    signal = "長紅K偏多";
  } else if (patterns.includes("長黑K")) {
    signal = "長黑K偏空";
  }

  return {
    signal,
    trend,
    patterns,
    reasons,
    stats: {
      bodyRatio,
      changePercent,
      last5UpCount,
      last5DownCount,
    },
  };
}

function buildChaseRisk(params: {
  close: number;
  ma20: number | null;
  rsi14: number | null;
  kdValue: number | null;
  volumeTrend: string;
  supportTrend: string;
  distanceTo20HighPercent: number;
}) {
  const { close, ma20, rsi14, kdValue, volumeTrend, supportTrend, distanceTo20HighPercent } = params;

  let score = 30;
  const reasons: string[] = [];

  if (rsi14 !== null) {
    if (rsi14 >= 80) {
      score += 25;
      reasons.push("RSI 高於 80，短線非常過熱。");
    } else if (rsi14 >= 70) {
      score += 18;
      reasons.push("RSI 高於 70，短線偏過熱。");
    } else if (rsi14 >= 60) {
      score += 8;
      reasons.push("RSI 位於偏強區，追價仍需控管風險。");
    }
  }

  if (kdValue !== null) {
    if (kdValue >= 90) {
      score += 20;
      reasons.push("KD 高於 90，短線高檔鈍化風險高。");
    } else if (kdValue >= 80) {
      score += 14;
      reasons.push("KD 高於 80，短線容易震盪。");
    }
  }

  if (ma20 !== null && ma20 > 0) {
    const distanceFromMa20 = ((close - ma20) / ma20) * 100;

    if (distanceFromMa20 >= 12) {
      score += 22;
      reasons.push("股價高於 MA20 超過 12%，短線乖離過大。");
    } else if (distanceFromMa20 >= 7) {
      score += 14;
      reasons.push("股價高於 MA20 超過 7%，已有一定乖離。");
    } else if (distanceFromMa20 <= 3) {
      score -= 8;
      reasons.push("股價距離 MA20 不遠，追價壓力相對較低。");
    }
  }

  if (supportTrend === "warning") {
    score += 18;
    reasons.push("股價接近壓力區，追價空間有限。");
  } else if (supportTrend === "bull") {
    score -= 5;
    reasons.push("股價已突破壓力，若能站穩，追價風險略降。");
  }

  if (distanceTo20HighPercent >= 0 && distanceTo20HighPercent <= 2) {
    score += 12;
    reasons.push("距離20日壓力不到2%，上方短壓近。");
  }

  if (volumeTrend === "warning") {
    score += 10;
    reasons.push("股價上漲但量能不足，追價可靠度下降。");
  } else if (volumeTrend === "bull") {
    score -= 8;
    reasons.push("量能配合上攻，追價風險相對降低。");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level = "中";
  let suggestion = "可觀察，但不建議一次追滿。";

  if (score >= 75) {
    level = "高";
    suggestion = "追高風險偏高，建議等拉回或突破後站穩再評估。";
  } else if (score >= 55) {
    level = "中高";
    suggestion = "可小量觀察，但要避免重倉追價。";
  } else if (score <= 35) {
    level = "低";
    suggestion = "追價風險相對較低，但仍需搭配停損控管。";
  }

  if (reasons.length === 0) {
    reasons.push("目前沒有明顯追高過熱訊號。");
  }

  return {
    score,
    level,
    suggestion,
    reasons,
  };
}

function buildTradePlan(params: {
  close: number;
  ma5: number | null;
  ma20: number | null;
  supportResistance: ReturnType<typeof buildSupportResistance>;
  chaseRisk: ReturnType<typeof buildChaseRisk>;
  aiScore: number;
  aiTrend: string;
}) {
  const { close, ma5, ma20, supportResistance, chaseRisk, aiScore, aiTrend } = params;

  const observationLow = ma20 ? Math.min(ma20, close * 0.97) : close * 0.97;
  const observationHigh = ma5 ? Math.max(ma5, close * 1.01) : close * 1.01;

  const pullbackLow = ma20 ? ma20 * 0.98 : supportResistance.low20;
  const pullbackHigh = ma20 ? ma20 * 1.02 : close * 0.98;

  const breakoutPrice = supportResistance.high20;
  const stopLossPrice = Math.min(
    supportResistance.low20,
    ma20 ? ma20 * 0.97 : supportResistance.low20
  );
  const takeProfitReference = supportResistance.high60;

  let stance = "觀望";
  let action = "等待更明確的突破或拉回訊號。";
  const reasons: string[] = [];

  if (aiTrend === "bull" && chaseRisk.score <= 55) {
    stance = "偏多觀察";
    action = "可分批觀察，不建議一次重倉。若拉回到觀察區不破，可留意轉強機會。";
    reasons.push("AI 趨勢偏多，且追高風險未達高風險區。");
  } else if (aiTrend === "bull" && chaseRisk.score > 55) {
    stance = "偏多但不追高";
    action = "趨勢雖偏多，但追高風險偏高，建議等拉回或突破後站穩。";
    reasons.push("AI 趨勢偏多，但追高風險分數偏高。");
  } else if (aiTrend === "bear") {
    stance = "偏空保守";
    action = "目前不建議追價，先等待止跌、站回均線或重新放量轉強。";
    reasons.push("AI 趨勢偏弱，應避免急著進場。");
  } else {
    stance = "中性觀望";
    action = "目前訊號未明確，可等待股價靠近支撐或突破壓力後再判斷。";
    reasons.push("AI 分數位於中性區間，尚未形成明確方向。");
  }

  if (supportResistance.trend === "warning") {
    reasons.push("目前接近20日壓力，追價空間有限。");
  }

  if (supportResistance.trend === "bull") {
    reasons.push("股價已突破近期壓力，若能站穩，偏多訊號更完整。");
  }

  if (aiScore >= 85) {
    reasons.push("AI 分數高，屬於強勢股，但仍需控管追高風險。");
  }

  return {
    stance,
    action,
    observationZone: {
      low: observationLow,
      high: observationHigh,
    },
    pullbackZone: {
      low: pullbackLow,
      high: pullbackHigh,
    },
    breakoutPrice,
    stopLossPrice,
    takeProfitReference,
    reasons,
  };
}

function buildAiSummary(params: {
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  rsi14: number | null;
  macdValue: number | null;
  kdValue: number | null;
  volumeTrend: string;
  supportTrend: string;
  chaseRiskScore: number;
  patternTrend: string;
}) {
  const {
    ma5,
    ma20,
    ma60,
    rsi14,
    macdValue,
    kdValue,
    volumeTrend,
    supportTrend,
    chaseRiskScore,
    patternTrend,
  } = params;

  let score = 50;
  const reasons: string[] = [];

  if (ma5 !== null && ma20 !== null) {
    if (ma5 > ma20) {
      score += 15;
      reasons.push("MA5 高於 MA20，短線均線偏多。");
    } else {
      score -= 15;
      reasons.push("MA5 低於 MA20，短線均線偏弱。");
    }
  }

  if (ma20 !== null && ma60 !== null) {
    if (ma20 > ma60) {
      score += 10;
      reasons.push("MA20 高於 MA60，中期趨勢較健康。");
    } else {
      score -= 10;
      reasons.push("MA20 低於 MA60，中期趨勢仍有壓力。");
    }
  }

  if (rsi14 !== null) {
    if (rsi14 >= 75) {
      score -= 10;
      reasons.push("RSI 高於 75，短線過熱，追價風險增加。");
    } else if (rsi14 >= 55) {
      score += 10;
      reasons.push("RSI 位於 55 以上，買盤動能偏強。");
    } else if (rsi14 <= 30) {
      score -= 5;
      reasons.push("RSI 低於 30，股價偏弱但可能接近超賣區。");
    } else {
      reasons.push("RSI 位於中性區間，多空尚未極端。");
    }
  }

  if (macdValue !== null) {
    if (macdValue > 0) {
      score += 12;
      reasons.push("MACD 位於零軸上方，多方動能較強。");
    } else {
      score -= 12;
      reasons.push("MACD 位於零軸下方，空方壓力仍在。");
    }
  }

  if (kdValue !== null) {
    if (kdValue >= 80) {
      reasons.push("KD 位於高檔，短線要防震盪或拉回。");
    } else if (kdValue <= 20) {
      reasons.push("KD 位於低檔，需觀察是否止跌反彈。");
    } else {
      reasons.push("KD 位於中段，尚未出現極端訊號。");
    }
  }

  if (volumeTrend === "bull") {
    score += 8;
    reasons.push("量能配合股價上攻，短線多方訊號更完整。");
  } else if (volumeTrend === "bear") {
    score -= 10;
    reasons.push("放量下跌代表賣壓偏重，短線風險升高。");
  } else if (volumeTrend === "warning") {
    score -= 5;
    reasons.push("股價上漲但量能不足，追價需要更保守。");
  }

  if (supportTrend === "bull") {
    score += 10;
    reasons.push("股價突破近期壓力區，短線趨勢有轉強跡象。");
  } else if (supportTrend === "bear") {
    score -= 10;
    reasons.push("股價跌破近期支撐區，短線風險提高。");
  } else if (supportTrend === "warning") {
    score -= 5;
    reasons.push("股價接近壓力區，追價空間有限。");
  }

  if (patternTrend === "bull") {
    score += 8;
    reasons.push("K線型態偏多，短線盤勢結構較強。");
  } else if (patternTrend === "bear") {
    score -= 8;
    reasons.push("K線型態偏空，短線盤勢結構較弱。");
  } else if (patternTrend === "warning") {
    score -= 4;
    reasons.push("K線型態出現警示訊號，需防震盪或假突破。");
  }

  if (chaseRiskScore >= 75) {
    score -= 8;
    reasons.push("追高風險分數偏高，短線不宜過度積極。");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let verdict = "觀望";
  let trend = "neutral";

  if (score >= 70) {
    verdict = "偏多";
    trend = "bull";
  } else if (score <= 40) {
    verdict = "偏空";
    trend = "bear";
  }

  let chaseRisk = "不建議盲目追價，等拉回或突破確認會比較安全。";

  if (score >= 70 && chaseRiskScore <= 45) {
    chaseRisk = "趨勢偏多且追高風險不高，可分批觀察，但仍要設好停損。";
  } else if (score >= 70 && chaseRiskScore > 65) {
    chaseRisk = "雖然趨勢偏多，但追高風險偏高，建議等拉回或站穩突破再評估。";
  }

  if (score <= 40) {
    chaseRisk = "趨勢偏弱，不建議追價，應先等止跌訊號。";
  }

  return {
    score,
    verdict,
    trend,
    reasons,
    chaseRisk,
  };
}


function normalizeScore(value: number | null | undefined, fallback = 50) {
  if (value === null || typeof value === "undefined" || Number.isNaN(Number(value))) return fallback;
  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function buildScoreBreakdown(params: {
  ai: ReturnType<typeof buildAiSummary>;
  chipAnalysis: ChipAnalysis;
  fundamentalAnalysis: FundamentalAnalysis;
  industryThemeAnalysis: IndustryThemeAnalysis;
  discussionSentiment: DiscussionSentiment;
  marketEnvironment: MarketEnvironmentAnalysis;
  chaseRisk: ReturnType<typeof buildChaseRisk>;
}): ScoreBreakdown {
  const technical = normalizeScore(params.ai.score);
  const chip = normalizeScore(params.chipAnalysis.score);
  const fundamental = normalizeScore(params.fundamentalAnalysis.score);
  const industry = normalizeScore(params.industryThemeAnalysis.score);
  const discussion = normalizeScore(params.discussionSentiment.score);
  const market = normalizeScore(params.marketEnvironment.score);

  let riskPenalty = 0;
  if (params.chaseRisk.score >= 80) riskPenalty -= 10;
  else if (params.chaseRisk.score >= 65) riskPenalty -= 6;
  else if (params.chaseRisk.score <= 35) riskPenalty += 3;

  if (params.industryThemeAnalysis.verdict === "題材過熱") riskPenalty -= 4;
  if (params.marketEnvironment.trend === "bear") riskPenalty -= 5;

  const weighted =
    technical * 0.28 +
    chip * 0.16 +
    fundamental * 0.16 +
    industry * 0.14 +
    discussion * 0.10 +
    market * 0.16 +
    riskPenalty;

  const finalScore = Math.max(0, Math.min(100, Math.round(weighted)));
  let verdict: ScoreBreakdown["verdict"] = "中立";
  let trend: ScoreBreakdown["trend"] = "neutral";
  if (finalScore >= 70 && params.chaseRisk.score >= 70) { verdict = "偏多但高風險"; trend = "warning"; }
  else if (finalScore >= 68) { verdict = "偏多"; trend = "bull"; }
  else if (finalScore <= 42) { verdict = "偏空"; trend = "bear"; }

  const statuses = [
    params.chipAnalysis.status,
    params.fundamentalAnalysis.status,
    params.industryThemeAnalysis.status,
    params.discussionSentiment.status,
    params.marketEnvironment.status,
  ];
  const okCount = statuses.filter((status) => status === "ok" || status === "partial").length + 1;
  const confidence = Math.round((okCount / 6) * 100);

  const reasons: string[] = [];
  reasons.push(`技術面權重最高，目前技術分數 ${technical}。`);
  reasons.push(`籌碼、基本面、題材、討論區與大盤已納入加權，綜合分數 ${finalScore}。`);
  if (riskPenalty < 0) reasons.push(`追高風險或大盤/題材風險造成 ${riskPenalty} 分扣分。`);
  if (riskPenalty > 0) reasons.push(`追高風險偏低，風險項目小幅加分 ${riskPenalty}。`);
  if (confidence < 70) reasons.push("部分資料源不足，綜合分數可信度需打折看待。");

  return { finalScore, verdict, trend, technical, chip, fundamental, industry, discussion, market, riskPenalty, confidence, reasons };
}

function buildAbnormalAlerts(params: {
  volumeAnalysis: ReturnType<typeof buildVolumeAnalysis>;
  supportResistance: ReturnType<typeof buildSupportResistance>;
  chaseRisk: ReturnType<typeof buildChaseRisk>;
  patternAnalysis: ReturnType<typeof buildPatternAnalysis>;
  chipAnalysis: ChipAnalysis;
  discussionSentiment: DiscussionSentiment;
  industryThemeAnalysis: IndustryThemeAnalysis;
  marketEnvironment: MarketEnvironmentAnalysis;
  scoreBreakdown: ScoreBreakdown;
}): AbnormalAlert[] {
  const alerts: AbnormalAlert[] = [];
  if ((params.volumeAnalysis.volumeRatio20 || 0) >= 2 && params.volumeAnalysis.priceChangePercent > 1) {
    alerts.push({ label: "爆量上攻", level: "bull", message: "今日量能大於20日均量2倍且股價上漲，市場資金明顯進場。" });
  }
  if ((params.volumeAnalysis.volumeRatio20 || 0) >= 2 && params.volumeAnalysis.priceChangePercent < -1) {
    alerts.push({ label: "爆量下跌", level: "bear", message: "今日量能大於20日均量2倍但股價下跌，賣壓需要優先處理。" });
  }
  if (params.supportResistance.trend === "bull") alerts.push({ label: "突破近期壓力", level: "bull", message: "收盤價突破近20日壓力，短線趨勢有轉強跡象。" });
  if (params.supportResistance.trend === "bear") alerts.push({ label: "跌破近期支撐", level: "bear", message: "收盤價跌破近20日支撐，短線風險升高。" });
  if (params.chaseRisk.score >= 75) alerts.push({ label: "追高風險偏高", level: "hot", message: "追高風險分數超過75，建議等拉回或站穩突破後再評估。" });
  if (params.patternAnalysis.patterns.includes("假突破風險")) alerts.push({ label: "假突破警示", level: "hot", message: "盤中突破但收盤未站穩，短線需防反向震盪。" });
  if (params.chipAnalysis.institutional.foreignStreak.days >= 3) {
    alerts.push({ label: `外資連續${params.chipAnalysis.institutional.foreignStreak.label}`, level: params.chipAnalysis.institutional.foreignStreak.direction === "買超" ? "bull" : "bear", message: "外資連續買賣超已形成短線籌碼方向。" });
  }
  if (params.chipAnalysis.institutional.investmentTrustStreak.days >= 3) {
    alerts.push({ label: `投信連續${params.chipAnalysis.institutional.investmentTrustStreak.label}`, level: params.chipAnalysis.institutional.investmentTrustStreak.direction === "買超" ? "bull" : "bear", message: "投信連續買賣超通常代表內資法人態度明確。" });
  }
  if (params.discussionSentiment.heat === "高" && params.discussionSentiment.overall.includes("多")) alerts.push({ label: "討論熱度偏高", level: "hot", message: "公開討論熱度高且偏多，需防短線情緒過熱。" });
  if (params.industryThemeAnalysis.verdict === "題材過熱") alerts.push({ label: "題材過熱", level: "hot", message: "產業題材熱度偏高，短線容易利多鈍化。" });
  if (params.marketEnvironment.trend === "bear") alerts.push({ label: "大盤偏弱", level: "bear", message: "大盤環境偏空，個股操作應降低部位與追價。" });
  if (params.scoreBreakdown.finalScore >= 75 && params.chaseRisk.score <= 55) alerts.push({ label: "綜合強勢", level: "bull", message: "綜合分數高且追高風險未過高，屬於較值得觀察的狀態。" });
  if (alerts.length === 0) alerts.push({ label: "無重大異常", level: "watch", message: "目前沒有爆量、破線、籌碼急轉或題材過熱等重大異常。" });
  return alerts.slice(0, 8);
}

function buildStrategyProfile(params: {
  scoreBreakdown: ScoreBreakdown;
  ai: ReturnType<typeof buildAiSummary>;
  chipAnalysis: ChipAnalysis;
  fundamentalAnalysis: FundamentalAnalysis;
  marketEnvironment: MarketEnvironmentAnalysis;
  chaseRisk: ReturnType<typeof buildChaseRisk>;
  tradePlan: ReturnType<typeof buildTradePlan>;
}): StrategyProfile {
  const shortScore = Math.round(params.ai.score * 0.45 + params.chipAnalysis.score * 0.25 + params.marketEnvironment.score * 0.15 + (100 - params.chaseRisk.score) * 0.15);
  const swingScore = Math.round(params.scoreBreakdown.finalScore * 0.45 + params.chipAnalysis.score * 0.25 + params.fundamentalAnalysis.score * 0.2 + params.marketEnvironment.score * 0.1);
  const longScore = Math.round(params.fundamentalAnalysis.score * 0.45 + params.marketEnvironment.score * 0.2 + params.scoreBreakdown.finalScore * 0.2 + params.chipAnalysis.score * 0.15);

  function verdict(score: number) {
    if (score >= 70) return "可觀察";
    if (score <= 42) return "偏保守";
    return "等待訊號";
  }

  const shortTermReasons = [
    `短線主要看技術、籌碼與追高風險，目前短線分數 ${shortScore}。`,
    `參考動作：${params.tradePlan.action}`,
  ];
  const swingReasons = [
    `波段同時看綜合分數、籌碼與基本面，目前波段分數 ${swingScore}。`,
    params.chipAnalysis.summary,
  ];
  const longReasons = [
    `長期較重視基本面與大盤環境，目前長期分數 ${longScore}。`,
    params.fundamentalAnalysis.summary,
  ];

  return {
    shortTerm: { verdict: verdict(shortScore), score: shortScore, action: shortScore >= 70 && params.chaseRisk.score <= 65 ? "可小量分批觀察，避免一次重倉。" : "先等拉回、突破站穩或風險下降。", reasons: shortTermReasons },
    swing: { verdict: verdict(swingScore), score: swingScore, action: swingScore >= 70 ? "可列入波段觀察清單，搭配支撐停損。" : "等待籌碼或基本面分數改善。", reasons: swingReasons },
    longTerm: { verdict: verdict(longScore), score: longScore, action: longScore >= 70 ? "可持續追蹤基本面與營收趨勢。" : "長期投入前應確認營收、EPS與產業趨勢。", reasons: longReasons },
    summary: `短線 ${verdict(shortScore)}、波段 ${verdict(swingScore)}、長期 ${verdict(longScore)}。`,
  };
}

function buildDataQuality(statuses: Record<string, string | undefined>): DataQuality {
  const entries = [
    ["即時報價", statuses.fugle],
    ["K線資料", statuses.finmind],
    ["討論區", statuses.tavily],
    ["籌碼面", statuses.chip],
    ["基本面", statuses.fundamental],
    ["產業題材", statuses.industry],
    ["大盤環境", statuses.market],
  ] as Array<[string, string | undefined]>;

  const good = new Set(["ok", "partial", "fallback"]);
  const okCount = entries.filter(([, status]) => good.has(String(status))).length;
  const score = Math.round((okCount / entries.length) * 100);
  const missingModules = entries.filter(([, status]) => !good.has(String(status))).map(([name]) => name);
  const warnings = missingModules.length ? [`以下模組資料不足：${missingModules.join("、")}。`] : ["主要資料模組皆有回傳，分析完整度較高。"];
  const level: DataQuality["level"] = score >= 80 ? "高" : score >= 55 ? "中" : "低";
  return { score, level, okCount, totalCount: entries.length, missingModules, warnings };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symbol = String(body.symbol || "2330").replace(".TW", "").trim();
    const stockName = String(body.name || body.stockName || STOCK_NAMES[symbol] || symbol).trim();

    const fugleKey = process.env.FUGLE_API_KEY;
    const finmindToken = process.env.FINMIND_TOKEN;

    if (!fugleKey) {
      return NextResponse.json({
        success: false,
        error: "FUGLE_API_KEY 沒讀到，請檢查 Vercel 環境變數。",
      });
    }

    if (!finmindToken) {
      return NextResponse.json({
        success: false,
        error: "FINMIND_TOKEN 沒讀到，請檢查 Vercel 環境變數。",
      });
    }

    let fugleData: any = null;

    try {
      const fugleUrl = `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${symbol}`;

      const fugleResponse = await fetchWithTimeout(
        fugleUrl,
        {
          headers: {
            "X-API-KEY": fugleKey,
          },
        },
        7000
      );

      if (fugleResponse.ok) {
        fugleData = await fugleResponse.json();
      }
    } catch {
      fugleData = null;
    }

    const finmindUrl =
      `https://api.finmindtrade.com/api/v4/data?` +
      `dataset=TaiwanStockPrice&data_id=${symbol}` +
      `&start_date=${getStartDate(180)}` +
      `&token=${finmindToken}`;

    const finmindResponse = await fetchWithTimeout(finmindUrl, {}, 12000);
    const finmindData = await finmindResponse.json();

    if (!finmindData.data || finmindData.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: "FinMind K棒資料抓不到，可能是代號錯誤或資料源暫時異常。",
      });
    }

    const kbars = finmindData.data as KBar[];
    const closes = kbars.map((item) => Number(item.close));
    const latest = kbars[kbars.length - 1];

    const ma5 = sma(closes, 5);
    const ma20 = sma(closes, 20);
    const ma60 = sma(closes, 60);
    const rsi14 = rsi(closes, 14);
    const macdValue = macd(closes);
    const kdValue = kd(kbars, 9);
    const volumeAnalysis = buildVolumeAnalysis(kbars);
    const supportResistance = buildSupportResistance(kbars);
    const patternAnalysis = buildPatternAnalysis(kbars, ma5, ma20, ma60);

    const latestClose = Number(latest.close);

    const chaseRisk = buildChaseRisk({
      close: latestClose,
      ma20,
      rsi14,
      kdValue,
      volumeTrend: volumeAnalysis.trend,
      supportTrend: supportResistance.trend,
      distanceTo20HighPercent: supportResistance.distanceTo20HighPercent,
    });

    const ai = buildAiSummary({
      ma5,
      ma20,
      ma60,
      rsi14,
      macdValue,
      kdValue,
      volumeTrend: volumeAnalysis.trend,
      supportTrend: supportResistance.trend,
      chaseRiskScore: chaseRisk.score,
      patternTrend: patternAnalysis.trend,
    });

    const tradePlan = buildTradePlan({
      close: latestClose,
      ma5,
      ma20,
      supportResistance,
      chaseRisk,
      aiScore: ai.score,
      aiTrend: ai.trend,
    });

    const chartData = kbars.slice(-60).map((item) => ({
      date: item.date,
      open: Number(item.open),
      high: Number(item.max),
      low: Number(item.min),
      close: Number(item.close),
      volume: Number(item.Trading_Volume || 0),
    }));

    const fallbackName = fugleData?.name || stockName || STOCK_NAMES[symbol] || symbol;
    const fallbackPrice = Number(latest.close);
    const [discussionSentiment, chipAnalysis, fundamentalAnalysis, industryThemeAnalysis, marketEnvironment] = await Promise.all([
      fetchDiscussionSentiment(symbol, fallbackName),
      fetchChipAnalysis(symbol, finmindToken),
      fetchFundamentalAnalysis(symbol, finmindToken),
      fetchIndustryThemeAnalysis(symbol, fallbackName),
      fetchMarketEnvironmentAnalysis(finmindToken),
    ]);

    const sourceStatus = {
      fugle: fugleData ? "ok" : "fallback",
      finmind: "ok",
      tavily: discussionSentiment.status,
      chip: chipAnalysis.status,
      fundamental: fundamentalAnalysis.status,
      industry: industryThemeAnalysis.status,
      market: marketEnvironment.status,
    };

    const scoreBreakdown = buildScoreBreakdown({
      ai,
      chipAnalysis,
      fundamentalAnalysis,
      industryThemeAnalysis,
      discussionSentiment,
      marketEnvironment,
      chaseRisk,
    });

    const abnormalAlerts = buildAbnormalAlerts({
      volumeAnalysis,
      supportResistance,
      chaseRisk,
      patternAnalysis,
      chipAnalysis,
      discussionSentiment,
      industryThemeAnalysis,
      marketEnvironment,
      scoreBreakdown,
    });

    const strategyProfile = buildStrategyProfile({
      scoreBreakdown,
      ai,
      chipAnalysis,
      fundamentalAnalysis,
      marketEnvironment,
      chaseRisk,
      tradePlan,
    });

    const dataQuality = buildDataQuality(sourceStatus);

    return NextResponse.json({
      success: true,
      symbol,
      quote: {
        name: fallbackName,
        price:
          fugleData?.closePrice ??
          fugleData?.lastPrice ??
          fugleData?.referencePrice ??
          fallbackPrice,
        change: fugleData?.change ?? 0,
        changePercent: fugleData?.changePercent ?? 0,
        open: fugleData?.openPrice ?? Number(latest.open),
        high: fugleData?.highPrice ?? Number(latest.max),
        low: fugleData?.lowPrice ?? Number(latest.min),
        previousClose: fugleData?.previousClose ?? fallbackPrice,
        volume: fugleData?.total?.tradeVolume ?? Number(latest.Trading_Volume || 0),
      },
      technical: {
        latestDate: latest.date,
        latestClose: fallbackPrice,
        ma5,
        ma20,
        ma60,
        rsi14,
        macd: macdValue,
        kd: kdValue,
      },
      volumeAnalysis,
      supportResistance,
      chaseRisk,
      tradePlan,
      patternAnalysis,
      chartData,
      ai,
      discussionSentiment,
      chipAnalysis,
      fundamentalAnalysis,
      industryThemeAnalysis,
      marketEnvironment,
      scoreBreakdown,
      abnormalAlerts,
      strategyProfile,
      dataQuality,
      sourceStatus,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error:
        "資料源回應較慢或暫時異常，請稍後再試。詳細：" + String(error),
    });
  }
}