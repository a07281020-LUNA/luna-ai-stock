"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type ChartKBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type AnalyzeResult = {
  success: boolean;
  symbol: string;
  quote: {
    name: string;
    price: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    volume: number;
  };
  technical: {
    latestDate: string;
    latestClose: number;
    ma5: number;
    ma20: number;
    ma60: number;
    rsi14: number;
    macd: number;
    kd: number;
  };
  chartData?: ChartKBar[];
  ai: {
    score: number;
    verdict: string;
    trend: "bull" | "bear" | "neutral";
    reasons: string[];
    chaseRisk: string;
  };
};

type HistoryItem = {
  symbol: string;
  name: string;
  score: number;
  verdict: string;
  trend: "bull" | "bear" | "neutral";
  price: number;
  changePercent: number;
  time: string;
};

function getAlert(result: AnalyzeResult) {
  const alerts: {
    label: string;
    level: "hot" | "bull" | "watch" | "bear";
    message: string;
  }[] = [];

  if (result.ai.score >= 85) {
    alerts.push({
      label: "🔥 強勢偏多",
      level: "bull",
      message: "AI 分數高於 85，技術面非常強，但仍要注意追高風險。",
    });
  } else if (result.ai.score >= 75) {
    alerts.push({
      label: "👀 值得觀察",
      level: "watch",
      message: "AI 分數高於 75，趨勢偏多，可列入觀察清單。",
    });
  }

  if (result.technical.rsi14 >= 75) {
    alerts.push({
      label: "⚠️ RSI 過熱",
      level: "hot",
      message: "RSI 高於 75，短線可能過熱，不適合無腦追高。",
    });
  }

  if (result.technical.kd >= 80) {
    alerts.push({
      label: "⚠️ KD 高檔",
      level: "hot",
      message: "KD 高於 80，短線容易震盪或拉回。",
    });
  }

  if (result.ai.score <= 40) {
    alerts.push({
      label: "📉 偏弱警示",
      level: "bear",
      message: "AI 分數低於 40，技術面偏弱，建議等止跌訊號。",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      label: "🟡 中性觀察",
      level: "watch",
      message: "目前沒有明顯強弱警示，適合等待更明確訊號。",
    });
  }

  return alerts;
}

function getTrendStyle(trend?: "bull" | "bear" | "neutral") {
  if (trend === "bull") {
    return "text-emerald-400 border-emerald-400/60 bg-emerald-400/10";
  }

  if (trend === "bear") {
    return "text-red-400 border-red-400/60 bg-red-400/10";
  }

  return "text-amber-400 border-amber-400/60 bg-amber-400/10";
}

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState<AnalyzeResult | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [scanResults, setScanResults] = useState<AnalyzeResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedWatchlist = localStorage.getItem("luna-watchlist");
    const savedHistory = localStorage.getItem("luna-history");

    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  function saveWatchlist(next: string[]) {
    setWatchlist(next);
    localStorage.setItem("luna-watchlist", JSON.stringify(next));
  }

  function saveHistory(next: HistoryItem[]) {
    setHistory(next);
    localStorage.setItem("luna-history", JSON.stringify(next));
  }

  function cleanSymbol(value: string) {
    return value.trim().replace(".TW", "");
  }

  function addHistory(result: AnalyzeResult) {
    const item: HistoryItem = {
      symbol: result.symbol,
      name: result.quote.name,
      score: result.ai.score,
      verdict: result.ai.verdict,
      trend: result.ai.trend,
      price: result.quote.price,
      changePercent: result.quote.changePercent,
      time: new Date().toLocaleString("zh-TW"),
    };

    const filtered = history.filter((x) => x.symbol !== result.symbol);
    saveHistory([item, ...filtered].slice(0, 20));
  }

  function addWatchlist() {
    const clean = cleanSymbol(symbol);

    if (!clean) {
      setError("請先輸入股票代號");
      return;
    }

    if (watchlist.includes(clean)) {
      setError(`${clean} 已經在自選股`);
      return;
    }

    saveWatchlist([...watchlist, clean]);
    setError("");
  }

  function removeWatchlist(item: string) {
    saveWatchlist(watchlist.filter((x) => x !== item));
    setScanResults(scanResults.filter((x) => x.symbol !== item));
  }

  function getWatchlistName(stockSymbol: string) {
    if (data?.symbol === stockSymbol) {
      return data.quote.name;
    }

    const scanned = scanResults.find((item) => item.symbol === stockSymbol);
    if (scanned) {
      return scanned.quote.name;
    }

    const record = history.find((item) => item.symbol === stockSymbol);
    if (record) {
      return record.name;
    }

    const stockNames: Record<string, string> = {
      "2330": "台積電",
      "2317": "鴻海",
      "0050": "元大台灣50",
      "2454": "聯發科",
      "2603": "長榮",
      "2303": "聯電",
      "2881": "富邦金",
      "2882": "國泰金",
      "2412": "中華電",
      "2308": "台達電",
      "2382": "廣達",
      "3711": "日月光投控",
      "2891": "中信金",
      "2884": "玉山金",
      "2885": "元大金",
      "2886": "兆豐金",
      "2892": "第一金",
      "5871": "中租-KY",
      "6505": "台塑化",
      "1301": "台塑",
      "1303": "南亞",
      "2002": "中鋼",
      "1216": "統一",
      "3008": "大立光",
      "3231": "緯創",
      "2356": "英業達",
      "2357": "華碩",
      "2379": "瑞昱",
      "2408": "南亞科",
      "3034": "聯詠",
      "4938": "和碩",
      "6669": "緯穎",
    };

    return stockNames[stockSymbol] || stockSymbol;
  }

  async function fetchAnalyze(targetSymbol: string) {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol: targetSymbol }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || `${targetSymbol} 分析失敗`);
    }

    return result as AnalyzeResult;
  }

  async function analyze(targetSymbol?: string) {
    const finalSymbol = cleanSymbol(targetSymbol || symbol);

    if (!finalSymbol) {
      setError("請先輸入股票代號，例如 2330");
      return;
    }

    setSymbol(finalSymbol);
    setLoading(true);
    setError("");
    setData(null);

    try {
      const result = await fetchAnalyze(finalSymbol);
      setData(result);
      addHistory(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function scanWatchlist() {
    if (watchlist.length === 0) {
      setError("請先加入自選股");
      return;
    }

    setScanning(true);
    setError("");
    setScanResults([]);

    const results: AnalyzeResult[] = [];

    for (const item of watchlist) {
      try {
        const result = await fetchAnalyze(item);
        results.push(result);
        setScanResults([...results]);
      } catch {
        // 單檔失敗就略過
      }
    }

    results.sort((a, b) => b.ai.score - a.ai.score);
    setScanResults(results);
    setScanning(false);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-6">
        <header className="mb-6 rounded-3xl border border-cyan-400/20 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 text-xs font-bold tracking-[0.35em] text-cyan-400">
                LUNA AI STOCK RADAR
              </div>
              <h1 className="text-4xl font-black md:text-6xl">
                台股 AI 技術分析儀表板
              </h1>
              <p className="mt-3 text-slate-400">
                即時報價 × K線圖 × K棒技術指標 × 自選股掃描 × 條件提醒
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-sm text-slate-300">
              <div>資料來源：Fugle + FinMind</div>
              <div className="mt-1 text-cyan-400">後端 API 已啟用</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr_360px]">
          <aside className="space-y-6">
            <Panel title="股票分析">
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") analyze();
                }}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xl font-black outline-none focus:border-cyan-400"
                placeholder="2330"
              />

              <button
                type="button"
                onClick={() => analyze()}
                disabled={loading}
                className="mt-4 w-full rounded-2xl bg-cyan-500 py-4 font-black text-white hover:bg-cyan-400 disabled:bg-slate-700"
              >
                {loading ? "AI 分析中..." : "開始分析"}
              </button>

              <button
                type="button"
                onClick={addWatchlist}
                className="mt-3 w-full rounded-2xl border border-slate-600 bg-slate-800 py-4 font-bold text-slate-200 hover:bg-slate-700"
              >
                加入自選股
              </button>

              <div className="mt-4 flex flex-wrap gap-2">
                {["2330", "2317", "0050", "2454", "2603"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => analyze(item)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
                  >
                    {getWatchlistName(item)} {item}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="自選股">
              {watchlist.length === 0 ? (
                <div className="text-sm text-slate-500">尚未加入自選股</div>
              ) : (
                <div className="space-y-3">
                  {watchlist.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-3"
                    >
                      <button
                        type="button"
                        onClick={() => analyze(item)}
                        className="text-left text-lg font-black hover:text-cyan-400"
                      >
                        {getWatchlistName(item)} {item}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeWatchlist(item)}
                        className="shrink-0 text-sm text-red-400 hover:text-red-300"
                      >
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={scanWatchlist}
                disabled={scanning || watchlist.length === 0}
                className="mt-5 w-full rounded-2xl bg-emerald-500 py-3 font-black text-white hover:bg-emerald-400 disabled:bg-slate-700"
              >
                {scanning ? "掃描中..." : "一鍵掃描自選股"}
              </button>
            </Panel>
          </aside>

          <section className="space-y-6">
            {error && (
              <div className="rounded-3xl border border-red-500 bg-red-500/10 p-5 text-red-300">
                {error}
              </div>
            )}

            {data ? (
              <>
                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-6xl font-black tracking-wider">
                        {data.symbol}
                      </div>
                      <div className="mt-2 text-slate-400">
                        {data.quote.name}
                      </div>
                    </div>

                    <div
                      className={`rounded-2xl border px-6 py-4 text-2xl font-black ${getTrendStyle(
                        data.ai.trend
                      )}`}
                    >
                      AI判斷：{data.ai.verdict}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Metric label="目前價格" value={data.quote.price} />
                    <Metric
                      label="漲跌幅"
                      value={`${data.quote.changePercent}%`}
                      trend={data.quote.changePercent >= 0 ? "bull" : "bear"}
                    />
                    <Metric label="開盤價" value={data.quote.open} />
                    <Metric label="最高價" value={data.quote.high} />
                    <Metric label="最低價" value={data.quote.low} />
                    <Metric label="昨收價" value={data.quote.previousClose} />
                    <Metric label="成交量" value={data.quote.volume} />
                    <Metric
                      label="AI分數"
                      value={data.ai.score}
                      trend={data.ai.trend}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
                  <SectionTitle>K線圖</SectionTitle>
                  <CandlestickChart data={data.chartData || []} />
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
                  <SectionTitle>條件提醒</SectionTitle>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {getAlert(data).map((alert, index) => (
                      <AlertCard key={index} alert={alert} />
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
                  <SectionTitle>技術指標</SectionTitle>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <Metric
                      label="RSI 14"
                      value={data.technical.rsi14.toFixed(2)}
                    />
                    <Metric label="MA5" value={data.technical.ma5.toFixed(2)} />
                    <Metric
                      label="MA20"
                      value={data.technical.ma20.toFixed(2)}
                    />
                    <Metric
                      label="MA60"
                      value={data.technical.ma60.toFixed(2)}
                    />
                    <Metric
                      label="MACD"
                      value={data.technical.macd.toFixed(2)}
                      trend={data.technical.macd >= 0 ? "bull" : "bear"}
                    />
                    <Metric label="KD" value={data.technical.kd.toFixed(2)} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
                  <SectionTitle>AI K棒總結</SectionTitle>

                  <div className="space-y-3 leading-7 text-slate-200">
                    {data.ai.reasons.map((reason, index) => (
                      <div key={index}>• {reason}</div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-amber-400/40 bg-slate-950 p-5">
                    <div className="mb-2 font-black text-amber-400">
                      是否適合追價
                    </div>
                    <div className="leading-7 text-slate-200">
                      {data.ai.chaseRisk}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-10 text-center">
                <div className="text-3xl font-black text-slate-200">
                  尚未開始分析
                </div>
                <div className="mt-3 text-slate-500">
                  輸入股票代號，或從自選股清單點選一檔開始。
                </div>
              </div>
            )}

            {scanResults.length > 0 && (
              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
                <SectionTitle>自選股掃描結果</SectionTitle>

                <div className="space-y-3">
                  {scanResults.map((item, index) => {
                    const alerts = getAlert(item);

                    return (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => setData(item)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-left hover:bg-slate-800"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm text-slate-500">
                              排名 #{index + 1}
                            </div>
                            <div className="text-2xl font-black">
                              {item.quote.name} {item.symbol}
                            </div>
                          </div>

                          <div
                            className={
                              item.ai.trend === "bull"
                                ? "font-black text-emerald-400"
                                : item.ai.trend === "bear"
                                ? "font-black text-red-400"
                                : "font-black text-amber-400"
                            }
                          >
                            {item.ai.verdict}｜{item.ai.score} 分
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-slate-400">
                          漲跌幅：{item.quote.changePercent}%｜RSI：
                          {item.technical.rsi14.toFixed(2)}｜KD：
                          {item.technical.kd.toFixed(2)}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {alerts.map((alert, i) => (
                            <AlertPill key={i} alert={alert} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <Panel title="最近分析紀錄">
              {history.length === 0 ? (
                <div className="text-sm text-slate-500">尚無紀錄</div>
              ) : (
                <>
                  <div className="space-y-3">
                    {history.slice(0, 8).map((item) => (
                      <button
                        key={`${item.symbol}-${item.time}`}
                        type="button"
                        onClick={() => analyze(item.symbol)}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-left hover:bg-slate-800"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-black">
                              {item.name} {item.symbol}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.time}
                            </div>
                          </div>

                          <div
                            className={
                              item.trend === "bull"
                                ? "text-sm font-black text-emerald-400"
                                : item.trend === "bear"
                                ? "text-sm font-black text-red-400"
                                : "text-sm font-black text-amber-400"
                            }
                          >
                            {item.score}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => saveHistory([])}
                    className="mt-4 w-full rounded-xl border border-red-400/40 py-2 text-sm text-red-400 hover:bg-red-400/10"
                  >
                    清除紀錄
                  </button>
                </>
              )}
            </Panel>

            <Panel title="系統狀態">
              <div className="space-y-3 text-sm text-slate-300">
                <StatusRow label="Fugle 即時報價" value="已啟用" />
                <StatusRow label="FinMind K棒" value="已啟用" />
                <StatusRow label="K線圖" value="已啟用" />
                <StatusRow label="LINE通知" value="尚未啟用" />
                <StatusRow label="資料儲存" value="本機瀏覽器" />
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CandlestickChart({ data }: { data: ChartKBar[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-8 text-center text-slate-500">
        目前沒有 K線資料
      </div>
    );
  }

  const width = 900;
  const height = 360;
  const padding = 36;
  const candleAreaHeight = 250;
  const volumeAreaTop = 280;
  const volumeAreaHeight = 55;

  const prices = data.flatMap((d) => [d.high, d.low]);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const maxVolume = Math.max(...data.map((d) => d.volume || 0)) || 1;
  const step = (width - padding * 2) / data.length;
  const candleWidth = Math.max(4, step * 0.55);

  function yPrice(price: number) {
    return padding + ((maxPrice - price) / priceRange) * candleAreaHeight;
  }

  function yVolume(volume: number) {
    return volumeAreaTop + volumeAreaHeight - (volume / maxVolume) * volumeAreaHeight;
  }

  const closePoints = data
    .map((d, i) => {
      const x = padding + i * step + step / 2;
      const y = yPrice(d.close);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[850px]">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = padding + (candleAreaHeight / 4) * i;
          const price = maxPrice - (priceRange / 4) * i;

          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={width - padding + 8}
                y={y + 4}
                fill="#64748b"
                fontSize="12"
              >
                {price.toFixed(0)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = padding + i * step + step / 2;
          const openY = yPrice(d.open);
          const closeY = yPrice(d.close);
          const highY = yPrice(d.high);
          const lowY = yPrice(d.low);
          const isUp = d.close >= d.open;
          const color = isUp ? "#34d399" : "#f87171";
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(2, Math.abs(openY - closeY));
          const volY = yVolume(d.volume || 0);

          return (
            <g key={d.date}>
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={color}
                strokeWidth="1.5"
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={isUp ? "rgba(52,211,153,0.85)" : "rgba(248,113,113,0.85)"}
                stroke={color}
              />
              <rect
                x={x - candleWidth / 2}
                y={volY}
                width={candleWidth}
                height={volumeAreaTop + volumeAreaHeight - volY}
                fill={isUp ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}
              />
            </g>
          );
        })}

        <polyline
          points={closePoints}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          opacity="0.9"
        />

        <text x={padding} y={height - 8} fill="#64748b" fontSize="12">
          {data[0].date}
        </text>
        <text x={width - 130} y={height - 8} fill="#64748b" fontSize="12">
          {data[data.length - 1].date}
        </text>
        <text x={padding} y={volumeAreaTop - 8} fill="#64748b" fontSize="12">
          成交量
        </text>
      </svg>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
      <div className="mb-4 font-black tracking-widest text-cyan-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 font-black tracking-widest text-cyan-400">
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: "bull" | "bear" | "neutral";
}) {
  const color =
    trend === "bull"
      ? "text-emerald-400"
      : trend === "bear"
      ? "text-red-400"
      : trend === "neutral"
      ? "text-amber-400"
      : "text-white";

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
      <div className="mb-2 text-xs tracking-widest text-slate-500">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function AlertCard({
  alert,
}: {
  alert: {
    label: string;
    level: "hot" | "bull" | "watch" | "bear";
    message: string;
  };
}) {
  const style =
    alert.level === "bull"
      ? "border-emerald-400/40 bg-emerald-400/10"
      : alert.level === "bear"
      ? "border-red-400/40 bg-red-400/10"
      : alert.level === "hot"
      ? "border-orange-400/40 bg-orange-400/10"
      : "border-amber-400/40 bg-amber-400/10";

  return (
    <div className={`rounded-2xl border p-5 ${style}`}>
      <div className="mb-2 font-black">{alert.label}</div>
      <div className="text-sm leading-6 text-slate-300">{alert.message}</div>
    </div>
  );
}

function AlertPill({
  alert,
}: {
  alert: {
    label: string;
    level: "hot" | "bull" | "watch" | "bear";
    message: string;
  };
}) {
  const style =
    alert.level === "bull"
      ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/30"
      : alert.level === "bear"
      ? "bg-red-400/10 text-red-300 border-red-400/30"
      : alert.level === "hot"
      ? "bg-orange-400/10 text-orange-300 border-orange-400/30"
      : "bg-amber-400/10 text-amber-300 border-amber-400/30";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${style}`}>
      {alert.label}
    </span>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-200">{value}</span>
    </div>
  );
}