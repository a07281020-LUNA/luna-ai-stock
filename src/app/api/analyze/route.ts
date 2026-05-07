import { NextResponse } from "next/server";

type KBar = {
  date: string;
  open: number;
  max: number;
  min: number;
  close: number;
  Trading_Volume?: number;
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symbol = String(body.symbol || "2330").replace(".TW", "").trim();

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

    const fallbackName = STOCK_NAMES[symbol] || symbol;
    const fallbackPrice = Number(latest.close);

    return NextResponse.json({
      success: true,
      symbol,
      quote: {
        name: fugleData?.name || fallbackName,
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
      sourceStatus: {
        fugle: fugleData ? "ok" : "fallback",
        finmind: "ok",
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error:
        "資料源回應較慢或暫時異常，請稍後再試。詳細：" + String(error),
    });
  }
}