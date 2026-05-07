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

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

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

function buildAiSummary(params: {
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  rsi14: number | null;
  macdValue: number | null;
  kdValue: number | null;
}) {
  const { ma5, ma20, ma60, rsi14, macdValue, kdValue } = params;

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

  if (score >= 70 && rsi14 !== null && rsi14 < 70) {
    chaseRisk = "趨勢偏多，但仍建議分批，不要一次追滿。";
  }

  if (rsi14 !== null && rsi14 >= 75) {
    chaseRisk = "短線已過熱，不適合追高，容易買在短線高點。";
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

    const ai = buildAiSummary({
      ma5,
      ma20,
      ma60,
      rsi14,
      macdValue,
      kdValue,
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