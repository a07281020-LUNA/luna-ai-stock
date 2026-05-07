"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type ChartKBar = { date:string; open:number; high:number; low:number; close:number; volume:number };
type Trend = "bull" | "bear" | "neutral" | "warning";

type VolumeAnalysis = {
  latestVolume:number; previousVolume:number; avgVolume5:number|null; avgVolume20:number|null;
  volumeRatio5:number|null; volumeRatio20:number|null; priceChangePercent:number;
  signal:string; trend:Trend; reasons:string[];
};

type SupportResistance = {
  latestClose:number; high20:number; low20:number; high60:number; low60:number;
  distanceTo20HighPercent:number; distanceTo20LowPercent:number;
  distanceTo60HighPercent:number; distanceTo60LowPercent:number;
  signal:string; trend:Trend; reasons:string[];
};

type ChaseRisk = { score:number; level:string; suggestion:string; reasons:string[] };

type TradePlan = {
  stance:string; action:string;
  observationZone:{low:number; high:number};
  pullbackZone:{low:number; high:number};
  breakoutPrice:number; stopLossPrice:number; takeProfitReference:number;
  reasons:string[];
};

type PatternAnalysis = {
  signal:string; trend:Trend; patterns:string[]; reasons:string[];
  stats:{bodyRatio:number; changePercent:number; last5UpCount:number; last5DownCount:number};
};

type AnalyzeResult = {
  success:boolean; symbol:string;
  quote:{name:string; price:number; change:number; changePercent:number; open:number; high:number; low:number; previousClose:number; volume:number};
  technical:{
    latestDate:string;
    latestClose:number|null;
    ma5:number|null;
    ma20:number|null;
    ma60:number|null;
    rsi14:number|null;
    macd:number|null;
    kd:number|null;
  };
  volumeAnalysis?:VolumeAnalysis;
  supportResistance?:SupportResistance;
  chaseRisk?:ChaseRisk;
  tradePlan?:TradePlan;
  patternAnalysis?:PatternAnalysis;
  chartData?:ChartKBar[];
  ai:{score:number; verdict:string; trend:"bull"|"bear"|"neutral"; reasons:string[]; chaseRisk:string};
};

type WatchItem = { symbol:string; name:string };
type HistoryItem = { symbol:string; name:string; score:number; verdict:string; trend:"bull"|"bear"|"neutral"; price:number; changePercent:number; time:string };

const STOCK_NAMES: Record<string,string> = {
  "00981A":"主動統一台股增長","009816":"凱基台灣TOP50","0050":"元大台灣50","00893":"國泰智能電動車",
  "2330":"台積電","2317":"鴻海","2454":"聯發科","2603":"長榮","2303":"聯電","2301":"光寶科","4938":"和碩",
  "6182":"合晶","6443":"元晶","6176":"瑞儀","2485":"兆赫",
  "2881":"富邦金","2882":"國泰金","2884":"玉山金","2885":"元大金","2886":"兆豐金","2891":"中信金","2892":"第一金",
  "2412":"中華電","2308":"台達電","2382":"廣達","3711":"日月光投控","6505":"台塑化","1301":"台塑","1303":"南亞",
  "2002":"中鋼","1216":"統一","3008":"大立光","3231":"緯創","2356":"英業達","2357":"華碩","2379":"瑞昱","2408":"南亞科",
  "3034":"聯詠","6669":"緯穎"
};

function formatNumber(value:number|null|undefined){ if(value===null||typeof value==="undefined"||Number.isNaN(Number(value))) return "-"; return Number(value).toLocaleString("zh-TW",{maximumFractionDigits:2}); }
function formatPrice(value:number|null|undefined){ return formatNumber(value); }
function formatTech(value:number|null|undefined){
  if(value===null||typeof value==="undefined"||Number.isNaN(Number(value))) return "資料不足";
  return Number(value).toFixed(2);
}
function isNumberValue(value:number|null|undefined){
  return value!==null&&typeof value!=="undefined"&&!Number.isNaN(Number(value));
}
function formatPercent(value:number|null|undefined){ if(value===null||typeof value==="undefined"||Number.isNaN(Number(value))) return "-"; return `${Number(value).toFixed(2)}%`; }
function formatRatio(value:number|null|undefined){ if(value===null||typeof value==="undefined"||Number.isNaN(Number(value))) return "-"; return `${Number(value).toFixed(2)}x`; }
function formatVolumeLots(value:number|null|undefined){
  if(value===null||typeof value==="undefined"||Number.isNaN(Number(value))) return "-";
  const lots=Number(value)/1000;
  const wan=lots/10000;
  if(Math.abs(wan)>=1) return `${wan.toFixed(2)} 萬張`;
  return `${Math.round(lots).toLocaleString("zh-TW")} 張`;
}

function getTrendStyle(trend?:Trend){
  if(trend==="bull") return "text-emerald-400 border-emerald-400/60 bg-emerald-400/10";
  if(trend==="bear") return "text-red-400 border-red-400/60 bg-red-400/10";
  if(trend==="warning") return "text-orange-400 border-orange-400/60 bg-orange-400/10";
  return "text-amber-400 border-amber-400/60 bg-amber-400/10";
}

function getRiskTrend(score:number):Trend{
  if(score>=75) return "bear";
  if(score>=55) return "warning";
  if(score<=35) return "bull";
  return "neutral";
}

function getAlert(result:AnalyzeResult){
  const alerts:{label:string;level:"hot"|"bull"|"watch"|"bear";message:string}[]=[];
  if(result.ai.score>=85) alerts.push({label:"🔥 強勢偏多",level:"bull",message:"AI 分數高於 85，技術面非常強，但仍要注意追高風險。"});
  else if(result.ai.score>=75) alerts.push({label:"👀 值得觀察",level:"watch",message:"AI 分數高於 75，趨勢偏多，可列入觀察清單。"});
  if(result.patternAnalysis?.trend==="bull") alerts.push({label:"📊 型態偏多",level:"bull",message:"K線型態偏多，短線結構較強。"});
  if(result.patternAnalysis?.trend==="bear") alerts.push({label:"📉 型態偏空",level:"bear",message:"K線型態偏空，短線賣壓較重。"});
  if(result.patternAnalysis?.trend==="warning") alerts.push({label:"⚠️ 型態警示",level:"hot",message:"K線型態出現假突破或震盪警示，追價需保守。"});
  if(result.tradePlan?.stance.includes("偏多")) alerts.push({label:"📌 有交易計畫",level:"watch",message:"系統已產生觀察區、突破價與停損參考，可依計畫控管風險。"});
  if(result.chaseRisk&&result.chaseRisk.score>=75) alerts.push({label:"🚨 追高高風險",level:"hot",message:"追高風險分數偏高，建議等拉回或站穩突破後再評估。"});
  else if(result.chaseRisk&&result.chaseRisk.score>=55) alerts.push({label:"⚠️ 追高需謹慎",level:"hot",message:"追高風險中高，不建議一次重倉追價。"});
  if(isNumberValue(result.technical.rsi14)&&Number(result.technical.rsi14)>=75) alerts.push({label:"⚠️ RSI 過熱",level:"hot",message:"RSI 高於 75，短線可能過熱，不適合無腦追高。"});
  if(isNumberValue(result.technical.kd)&&Number(result.technical.kd)>=80) alerts.push({label:"⚠️ KD 高檔",level:"hot",message:"KD 高於 80，短線容易震盪或拉回。"});
  if(result.volumeAnalysis?.trend==="bull") alerts.push({label:"📈 放量上攻",level:"bull",message:"量能與價格同步轉強，短線多方訊號較完整。"});
  if(result.volumeAnalysis?.trend==="bear") alerts.push({label:"📉 放量下跌",level:"bear",message:"量能放大但股價下跌，代表賣壓偏重。"});
  if(result.volumeAnalysis?.trend==="warning") alerts.push({label:"⚠️ 價漲量縮",level:"hot",message:"股價上漲但量能不足，追價需要更保守。"});
  if(result.supportResistance?.trend==="bull") alerts.push({label:"🚀 突破壓力",level:"bull",message:"股價突破近期壓力區，短線多方訊號增強。"});
  if(result.supportResistance?.trend==="bear") alerts.push({label:"⚠️ 跌破支撐",level:"bear",message:"股價跌破近期支撐區，短線風險升高。"});
  if(result.supportResistance?.trend==="warning") alerts.push({label:"⛔ 接近壓力",level:"hot",message:"目前接近壓力區，追價空間有限。"});
  if(result.ai.score<=40) alerts.push({label:"📉 偏弱警示",level:"bear",message:"AI 分數低於 40，技術面偏弱，建議等止跌訊號。"});
  if(alerts.length===0) alerts.push({label:"🟡 中性觀察",level:"watch",message:"目前沒有明顯強弱警示，適合等待更明確訊號。"});
  return alerts;
}

function getMainAlertLabel(result: AnalyzeResult) {
  const alerts = getAlert(result);
  return alerts[0]?.label || "🟡 中性觀察";
}

function buildAnalysisReport(data: AnalyzeResult) {
  const lines: string[] = [];

  lines.push(`【LUNA AI 台股分析報告】`);
  lines.push(`${data.quote.name} ${data.symbol}`);
  lines.push(``);
  lines.push(`AI判斷：${data.ai.verdict}`);
  lines.push(`AI分數：${data.ai.score}`);
  lines.push(`目前價格：${formatPrice(data.quote.price)}`);
  lines.push(`漲跌幅：${data.quote.changePercent}%`);
  lines.push(``);

  if (data.chaseRisk) {
    lines.push(`追高風險：${data.chaseRisk.score} 分｜${data.chaseRisk.level}`);
    lines.push(`追高建議：${data.chaseRisk.suggestion}`);
    lines.push(``);
  }

  if (data.tradePlan) {
    lines.push(`交易計畫：${data.tradePlan.stance}`);
    lines.push(`操作節奏：${data.tradePlan.action}`);
    lines.push(`觀察區：${formatPrice(data.tradePlan.observationZone.low)} ～ ${formatPrice(data.tradePlan.observationZone.high)}`);
    lines.push(`拉回觀察：${formatPrice(data.tradePlan.pullbackZone.low)} ～ ${formatPrice(data.tradePlan.pullbackZone.high)}`);
    lines.push(`突破確認價：${formatPrice(data.tradePlan.breakoutPrice)}`);
    lines.push(`停損參考價：${formatPrice(data.tradePlan.stopLossPrice)}`);
    lines.push(`停利參考壓力：${formatPrice(data.tradePlan.takeProfitReference)}`);
    lines.push(``);
  }

  if (data.patternAnalysis) {
    lines.push(`K線型態：${data.patternAnalysis.signal}`);
    lines.push(`型態標籤：${data.patternAnalysis.patterns.join("、")}`);
    lines.push(``);
  }

  if (data.supportResistance) {
    lines.push(`支撐壓力：${data.supportResistance.signal}`);
    lines.push(`20日壓力：${formatPrice(data.supportResistance.high20)}`);
    lines.push(`20日支撐：${formatPrice(data.supportResistance.low20)}`);
    lines.push(`60日壓力：${formatPrice(data.supportResistance.high60)}`);
    lines.push(`60日支撐：${formatPrice(data.supportResistance.low60)}`);
    lines.push(``);
  }

  if (data.volumeAnalysis) {
    lines.push(`成交量：${data.volumeAnalysis.signal}`);
    lines.push(`今日量：${formatVolumeLots(data.volumeAnalysis.latestVolume)}`);
    lines.push(`5日量比：${formatRatio(data.volumeAnalysis.volumeRatio5)}`);
    lines.push(`20日量比：${formatRatio(data.volumeAnalysis.volumeRatio20)}`);
    lines.push(``);
  }

  lines.push(`技術指標：`);
  lines.push(`RSI 14：${formatTech(data.technical.rsi14)}`);
  lines.push(`MA5：${formatTech(data.technical.ma5)}`);
  lines.push(`MA20：${formatTech(data.technical.ma20)}`);
  lines.push(`MA60：${formatTech(data.technical.ma60)}`);
  lines.push(`MACD：${formatTech(data.technical.macd)}`);
  lines.push(`KD：${formatTech(data.technical.kd)}`);
  lines.push(``);

  lines.push(`AI總結：`);
  data.ai.reasons.forEach((reason, index) => {
    lines.push(`${index + 1}. ${reason}`);
  });
  lines.push(``);
  lines.push(`提醒：本報告僅供研究與紀錄，不構成投資建議。`);

  return lines.join("\n");
}


export default function Home(){
  const [symbol,setSymbol]=useState("");
  const [data,setData]=useState<AnalyzeResult|null>(null);
  const [watchlist,setWatchlist]=useState<WatchItem[]>([]);
  const [scanResults,setScanResults]=useState<AnalyzeResult[]>([]);
  const [history,setHistory]=useState<HistoryItem[]>([]);
  const [loading,setLoading]=useState(false);
  const [scanning,setScanning]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    const savedWatchlist=localStorage.getItem("luna-watchlist");
    const savedHistory=localStorage.getItem("luna-history");
    if(savedHistory) setHistory(JSON.parse(savedHistory));
    if(savedWatchlist){
      const parsed=JSON.parse(savedWatchlist);
      if(Array.isArray(parsed)){
        const upgraded:WatchItem[]=parsed.map((item)=>{
          if(typeof item==="string") return {symbol:item,name:STOCK_NAMES[item]||item};
          return {symbol:item.symbol,name:item.name||STOCK_NAMES[item.symbol]||item.symbol};
        });
        setWatchlist(upgraded);
        localStorage.setItem("luna-watchlist",JSON.stringify(upgraded));
      }
    }
  },[]);

  function saveWatchlist(next:WatchItem[]){ setWatchlist(next); localStorage.setItem("luna-watchlist",JSON.stringify(next)); }
  function saveHistory(next:HistoryItem[]){ setHistory(next); localStorage.setItem("luna-history",JSON.stringify(next)); }
  function cleanSymbol(value:string){ return value.trim().replace(".TW",""); }

  function addHistory(result:AnalyzeResult){
    const item:HistoryItem={symbol:result.symbol,name:result.quote.name,score:result.ai.score,verdict:result.ai.verdict,trend:result.ai.trend,price:result.quote.price,changePercent:result.quote.changePercent,time:new Date().toLocaleString("zh-TW")};
    const filtered=history.filter((x)=>x.symbol!==result.symbol);
    saveHistory([item,...filtered].slice(0,20));
  }

  function updateWatchlistName(result:AnalyzeResult){
    const exists=watchlist.find((item)=>item.symbol===result.symbol);
    if(!exists) return;
    const next=watchlist.map((item)=> item.symbol===result.symbol ? {symbol:item.symbol,name:result.quote.name||item.name||item.symbol} : item);
    saveWatchlist(next);
  }

  async function fetchAnalyze(targetSymbol:string){
    const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol:targetSymbol})});
    const result=await response.json();
    if(!result.success) throw new Error(result.error||`${targetSymbol} 分析失敗`);
    return result as AnalyzeResult;
  }

  async function addWatchlist(){
    const clean=cleanSymbol(symbol);
    if(!clean){ setError("請先輸入股票代號"); return; }
    if(watchlist.some((item)=>item.symbol===clean)){ setError(`${clean} 已經在自選股`); return; }
    setLoading(true); setError("");
    try{
      const result=await fetchAnalyze(clean);
      saveWatchlist([...watchlist,{symbol:result.symbol,name:result.quote.name||STOCK_NAMES[result.symbol]||result.symbol}]);
      setData(result);
      addHistory(result);
    }catch{
      saveWatchlist([...watchlist,{symbol:clean,name:STOCK_NAMES[clean]||clean}]);
    }finally{ setLoading(false); }
  }

  function removeWatchlist(item:WatchItem){
    saveWatchlist(watchlist.filter((x)=>x.symbol!==item.symbol));
    setScanResults(scanResults.filter((x)=>x.symbol!==item.symbol));
  }

  async function analyze(targetSymbol?:string){
    const finalSymbol=cleanSymbol(targetSymbol||symbol);
    if(!finalSymbol){ setError("請先輸入股票代號，例如 2330"); return; }
    setSymbol(finalSymbol); setLoading(true); setError(""); setData(null);
    try{
      const result=await fetchAnalyze(finalSymbol);
      setData(result); addHistory(result); updateWatchlistName(result);
    }catch(err){ setError(String(err)); }
    finally{ setLoading(false); }
  }

  async function scanWatchlist(){
    if(watchlist.length===0){ setError("請先加入自選股"); return; }
    setScanning(true); setError(""); setScanResults([]);
    const results:AnalyzeResult[]=[];
    for(const item of watchlist){
      try{ const result=await fetchAnalyze(item.symbol); results.push(result); setScanResults([...results]); }catch{}
    }
    results.sort((a,b)=>b.ai.score-a.ai.score);
    setScanResults(results);
    const updated=watchlist.map((item)=>{ const found=results.find((r)=>r.symbol===item.symbol); return found?{symbol:item.symbol,name:found.quote.name||item.name}:item; });
    saveWatchlist(updated);
    setScanning(false);
  }


  async function copyReport(target?: AnalyzeResult) {
    const targetData = target || data;

    if (!targetData) {
      setError("目前沒有可複製的分析報告");
      return;
    }

    const text = buildAnalysisReport(targetData);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("複製失敗，可能是瀏覽器權限限制");
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] pb-24 text-white md:pb-6">
      <div className="mx-auto max-w-[1500px] px-5 py-6">
        <header className="mb-6 rounded-3xl border border-cyan-400/20 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 text-xs font-bold tracking-[0.35em] text-cyan-400">LUNA AI STOCK RADAR</div>
              <h1 className="text-3xl font-black leading-tight md:text-6xl">台股 AI 技術分析儀表板</h1>
              <p className="mt-3 text-sm text-slate-400 md:text-base">即時報價 × K線圖 × 型態辨識 × 交易計畫 × 追高風險</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-sm text-slate-300">
              <div>資料來源：Fugle + FinMind</div>
              <div className="mt-1 text-cyan-400">後端 API 已啟用</div>
            </div>
          </div>
        </header>

        {copied && (
          <div className="mb-6 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-center font-black text-emerald-300">
            已複製分析報告
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr_360px]">
          <aside className="space-y-6">
            <Panel title="股票分析">
              <input value={symbol} onChange={(e)=>setSymbol(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter") analyze();}} className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xl font-black outline-none focus:border-cyan-400" placeholder="2330" />
              <button type="button" onClick={()=>analyze()} disabled={loading} className="mt-4 w-full rounded-2xl bg-cyan-500 py-4 font-black text-white hover:bg-cyan-400 disabled:bg-slate-700">{loading?"AI 分析中...":"開始分析"}</button>
              <button type="button" onClick={addWatchlist} disabled={loading} className="mt-3 w-full rounded-2xl border border-slate-600 bg-slate-800 py-4 font-bold text-slate-200 hover:bg-slate-700 disabled:bg-slate-700">加入自選股</button>
              <div className="mt-4 flex flex-wrap gap-2">
                {["2330","2317","0050","2454","2603"].map((item)=>(
                  <button key={item} type="button" onClick={()=>analyze(item)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-400 hover:text-cyan-400">
                    {STOCK_NAMES[item]||item} {item}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="自選股">
              {watchlist.length===0 ? <div className="text-sm text-slate-500">尚未加入自選股</div> : (
                <div className="space-y-3">{watchlist.map((item)=>(
                  <div key={item.symbol} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-3">
                    <button type="button" onClick={()=>analyze(item.symbol)} className="text-left text-lg font-black hover:text-cyan-400">{item.name} {item.symbol}</button>
                    <button type="button" onClick={()=>removeWatchlist(item)} className="shrink-0 text-sm text-red-400 hover:text-red-300">刪除</button>
                  </div>
                ))}</div>
              )}
              <button type="button" onClick={scanWatchlist} disabled={scanning||watchlist.length===0} className="mt-5 w-full rounded-2xl bg-emerald-500 py-3 font-black text-white hover:bg-emerald-400 disabled:bg-slate-700">{scanning?"掃描中...":"一鍵掃描自選股"}</button>
            </Panel>
          </aside>

          <section className="space-y-6">
            {error && <div className="rounded-3xl border border-red-500 bg-red-500/10 p-5 text-red-300">{error}</div>}
            {data ? <AnalysisContent data={data} setData={setData} scanResults={scanResults} copyReport={copyReport} /> : (
              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-10 text-center">
                <div className="text-3xl font-black text-slate-200">尚未開始分析</div>
                <div className="mt-3 text-slate-500">輸入股票代號，或從自選股清單點選一檔開始。</div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <Panel title="最近分析紀錄">
              {history.length===0 ? <div className="text-sm text-slate-500">尚無紀錄</div> : (
                <>
                  <div className="space-y-3">{history.slice(0,8).map((item)=>(
                    <button key={`${item.symbol}-${item.time}`} type="button" onClick={()=>analyze(item.symbol)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-left hover:bg-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <div><div className="font-black">{item.name} {item.symbol}</div><div className="mt-1 text-xs text-slate-500">{item.time}</div></div>
                        <div className={item.trend==="bull"?"text-sm font-black text-emerald-400":item.trend==="bear"?"text-sm font-black text-red-400":"text-sm font-black text-amber-400"}>{item.score}</div>
                      </div>
                    </button>
                  ))}</div>
                  <button type="button" onClick={()=>saveHistory([])} className="mt-4 w-full rounded-xl border border-red-400/40 py-2 text-sm text-red-400 hover:bg-red-400/10">清除紀錄</button>
                </>
              )}
            </Panel>

            <Panel title="系統狀態">
              <div className="space-y-3 text-sm text-slate-300">
                <StatusRow label="Fugle 即時報價" value="已啟用" />
                <StatusRow label="FinMind K棒" value="已啟用" />
                <StatusRow label="K線圖" value="已啟用" />
                <StatusRow label="K線型態辨識" value="已啟用" />
                <StatusRow label="成交量分析" value="已啟用" />
                <StatusRow label="支撐壓力分析" value="已啟用" />
                <StatusRow label="追高風險分數" value="已啟用" />
                <StatusRow label="交易計畫" value="已啟用" />
                <StatusRow label="資料儲存" value="本機瀏覽器" />
              </div>
            </Panel>
          </aside>
        </div>
      </div>

      {data && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-700 bg-slate-950/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-[1500px] gap-2">
            <button type="button" onClick={() => copyReport(data)} className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-black text-white">
              複製報告
            </button>
            <button type="button" onClick={() => analyze(data.symbol)} className="flex-1 rounded-2xl border border-slate-600 bg-slate-800 py-3 text-sm font-black text-slate-200">
              重新分析
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function AnalysisContent({data,setData,scanResults,copyReport}:{data:AnalyzeResult; setData:(d:AnalyzeResult)=>void; scanResults:AnalyzeResult[]; copyReport:(d?:AnalyzeResult)=>void}){
  return (
    <>
      <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div><div className="text-6xl font-black tracking-wider">{data.symbol}</div><div className="mt-2 text-slate-400">{data.quote.name}</div></div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className={`rounded-2xl border px-6 py-4 text-2xl font-black ${getTrendStyle(data.ai.trend)}`}>AI判斷：{data.ai.verdict}</div>
            <button type="button" onClick={() => copyReport(data)} className="w-full rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 hover:bg-cyan-400/20 sm:w-auto">
              複製分析報告
            </button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="目前價格" value={data.quote.price} />
          <Metric label="漲跌幅" value={`${data.quote.changePercent}%`} trend={data.quote.changePercent>=0?"bull":"bear"} />
          <Metric label="開盤價" value={data.quote.open} />
          <Metric label="最高價" value={data.quote.high} />
          <Metric label="最低價" value={data.quote.low} />
          <Metric label="昨收價" value={data.quote.previousClose} />
          <Metric label="成交量" value={formatVolumeLots(data.quote.volume)} />
          <Metric label="AI分數" value={data.ai.score} trend={data.ai.trend} />
        </div>
      </div>

      <Block title="K線圖"><CandlestickChart data={data.chartData||[]} /></Block>

      {data.patternAnalysis && <Block title="K線型態分析">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.patternAnalysis.trend)}`}>{data.patternAnalysis.signal}</div>
          <div className="text-sm text-slate-400">近5日紅K：{data.patternAnalysis.stats.last5UpCount}｜黑K：{data.patternAnalysis.stats.last5DownCount}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.patternAnalysis.patterns.map((item,index)=><span key={index} className={`rounded-full border px-3 py-1 text-sm font-bold ${getTrendStyle(data.patternAnalysis?.trend)}`}>{item}</span>)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Metric label="K棒實體比例" value={`${(data.patternAnalysis.stats.bodyRatio*100).toFixed(2)}%`} />
          <Metric label="日漲跌幅" value={formatPercent(data.patternAnalysis.stats.changePercent)} trend={data.patternAnalysis.stats.changePercent>=0?"bull":"bear"} />
          <Metric label="近5日紅K數" value={data.patternAnalysis.stats.last5UpCount} trend={data.patternAnalysis.stats.last5UpCount>=4?"bull":"neutral"} />
        </div>
        <ReasonList reasons={data.patternAnalysis.reasons} />
      </Block>}

      {data.tradePlan && <Block title="交易計畫 / 進場區間">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.ai.trend)}`}>{data.tradePlan.stance}</div>
          <div className="text-sm text-slate-400">依 K棒、壓力支撐、追高風險自動產生</div>
        </div>
        <div className="rounded-2xl border border-cyan-400/30 bg-slate-950 p-5">
          <div className="mb-2 font-black text-cyan-400">操作節奏</div>
          <div className="leading-7 text-slate-200">{data.tradePlan.action}</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="觀察區下緣" value={formatPrice(data.tradePlan.observationZone.low)} />
          <Metric label="觀察區上緣" value={formatPrice(data.tradePlan.observationZone.high)} />
          <Metric label="拉回觀察下緣" value={formatPrice(data.tradePlan.pullbackZone.low)} />
          <Metric label="拉回觀察上緣" value={formatPrice(data.tradePlan.pullbackZone.high)} />
          <Metric label="突破確認價" value={formatPrice(data.tradePlan.breakoutPrice)} trend="bull" />
          <Metric label="停損參考價" value={formatPrice(data.tradePlan.stopLossPrice)} trend="bear" />
          <Metric label="停利參考壓力" value={formatPrice(data.tradePlan.takeProfitReference)} trend="warning" />
        </div>
        <ReasonList reasons={data.tradePlan.reasons} />
      </Block>}

      {data.chaseRisk && <Block title="追高風險分數">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(getRiskTrend(data.chaseRisk.score))}`}>追高風險：{data.chaseRisk.score} 分｜{data.chaseRisk.level}</div>
          <div className="text-sm text-slate-400">分數越高，代表越不適合追高。</div>
        </div>
        <div className="rounded-2xl border border-amber-400/40 bg-slate-950 p-5">
          <div className="mb-2 font-black text-amber-400">AI 建議</div>
          <div className="leading-7 text-slate-200">{data.chaseRisk.suggestion}</div>
        </div>
        <ReasonList reasons={data.chaseRisk.reasons} />
      </Block>}

      {data.supportResistance && <Block title="支撐壓力位">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.supportResistance.trend)}`}>{data.supportResistance.signal}</div>
          <div className="text-sm text-slate-400">最新收盤：{formatNumber(data.supportResistance.latestClose)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="20日壓力" value={formatNumber(data.supportResistance.high20)} />
          <Metric label="20日支撐" value={formatNumber(data.supportResistance.low20)} />
          <Metric label="60日壓力" value={formatNumber(data.supportResistance.high60)} />
          <Metric label="60日支撐" value={formatNumber(data.supportResistance.low60)} />
          <Metric label="距20日壓力" value={formatPercent(data.supportResistance.distanceTo20HighPercent)} trend={data.supportResistance.distanceTo20HighPercent<=2&&data.supportResistance.distanceTo20HighPercent>=0?"warning":"neutral"} />
          <Metric label="距20日支撐" value={formatPercent(data.supportResistance.distanceTo20LowPercent)} trend={data.supportResistance.distanceTo20LowPercent<=3&&data.supportResistance.distanceTo20LowPercent>=0?"warning":"neutral"} />
          <Metric label="距60日壓力" value={formatPercent(data.supportResistance.distanceTo60HighPercent)} />
          <Metric label="距60日支撐" value={formatPercent(data.supportResistance.distanceTo60LowPercent)} />
        </div>
        <ReasonList reasons={data.supportResistance.reasons} />
      </Block>}

      {data.volumeAnalysis && <Block title="成交量分析">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.volumeAnalysis.trend)}`}>{data.volumeAnalysis.signal}</div>
          <div className="text-sm text-slate-400">價格變動：{data.volumeAnalysis.priceChangePercent.toFixed(2)}%</div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="今日量" value={formatVolumeLots(data.volumeAnalysis.latestVolume)} />
          <Metric label="前一日量" value={formatVolumeLots(data.volumeAnalysis.previousVolume)} />
          <Metric label="5日均量" value={formatVolumeLots(data.volumeAnalysis.avgVolume5)} />
          <Metric label="20日均量" value={formatVolumeLots(data.volumeAnalysis.avgVolume20)} />
          <Metric label="5日量比" value={formatRatio(data.volumeAnalysis.volumeRatio5)} trend={data.volumeAnalysis.volumeRatio5&&data.volumeAnalysis.volumeRatio5>=1.3?"bull":"neutral"} />
          <Metric label="20日量比" value={formatRatio(data.volumeAnalysis.volumeRatio20)} trend={data.volumeAnalysis.volumeRatio20&&data.volumeAnalysis.volumeRatio20>=1.5?"bull":"neutral"} />
        </div>
        <ReasonList reasons={data.volumeAnalysis.reasons} />
      </Block>}

      <Block title="條件提醒">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {getAlert(data).map((alert,index)=><AlertCard key={index} alert={alert} />)}
        </div>
      </Block>

      <Block title="技術指標">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Metric label="RSI 14" value={formatTech(data.technical.rsi14)} />
          <Metric label="MA5" value={formatTech(data.technical.ma5)} />
          <Metric label="MA20" value={formatTech(data.technical.ma20)} />
          <Metric label="MA60" value={formatTech(data.technical.ma60)} />
          <Metric label="MACD" value={formatTech(data.technical.macd)} trend={isNumberValue(data.technical.macd)&&Number(data.technical.macd)>=0?"bull":"bear"} />
          <Metric label="KD" value={formatTech(data.technical.kd)} />
        </div>
      </Block>

      <Block title="AI K棒總結">
        <ReasonList reasons={data.ai.reasons} />
        <div className="mt-6 rounded-2xl border border-amber-400/40 bg-slate-950 p-5">
          <div className="mb-2 font-black text-amber-400">是否適合追價</div>
          <div className="leading-7 text-slate-200">{data.ai.chaseRisk}</div>
        </div>
      </Block>

      {scanResults.length>0 && <Block title="自選股掃描結果">
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {scanResults[0] && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
              <div className="text-xs font-bold tracking-widest text-emerald-300">最強勢</div>
              <div className="mt-2 text-xl font-black">{scanResults[0].quote.name} {scanResults[0].symbol}</div>
              <div className="mt-1 text-emerald-300">{scanResults[0].ai.verdict}｜{scanResults[0].ai.score} 分</div>
            </div>
          )}

          {(() => {
            const hot = [...scanResults].sort((a,b)=>(b.chaseRisk?.score || 0)-(a.chaseRisk?.score || 0))[0];
            return hot ? (
              <div className="rounded-2xl border border-orange-400/40 bg-orange-400/10 p-4">
                <div className="text-xs font-bold tracking-widest text-orange-300">追高風險最高</div>
                <div className="mt-2 text-xl font-black">{hot.quote.name} {hot.symbol}</div>
                <div className="mt-1 text-orange-300">追高風險｜{hot.chaseRisk?.score ?? "-"} 分</div>
              </div>
            ) : null;
          })()}

          {(() => {
            const weak = [...scanResults].sort((a,b)=>a.ai.score-b.ai.score)[0];
            return weak ? (
              <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4">
                <div className="text-xs font-bold tracking-widest text-red-300">最弱勢</div>
                <div className="mt-2 text-xl font-black">{weak.quote.name} {weak.symbol}</div>
                <div className="mt-1 text-red-300">{weak.ai.verdict}｜{weak.ai.score} 分</div>
              </div>
            ) : null;
          })()}
        </div>

        <div className="space-y-3">
          {scanResults.map((item,index)=>{
            const alerts=getAlert(item);
            return <button key={item.symbol} type="button" onClick={()=>setData(item)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-left hover:bg-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><div className="text-sm text-slate-500">排名 #{index+1}</div><div className="text-2xl font-black">{item.quote.name} {item.symbol}</div></div>
                <div className={item.ai.trend==="bull"?"font-black text-emerald-400":item.ai.trend==="bear"?"font-black text-red-400":"font-black text-amber-400"}>{item.ai.verdict}｜{item.ai.score} 分</div>
              </div>
              <div className="mt-2 text-sm text-slate-400">
                漲跌幅：{item.quote.changePercent}%｜RSI：{formatTech(item.technical.rsi14)}｜KD：{formatTech(item.technical.kd)}
                {item.patternAnalysis?`｜型態：${item.patternAnalysis.signal}`:""}
                {item.tradePlan?`｜計畫：${item.tradePlan.stance}`:""}
                {item.chaseRisk?`｜追高風險：${item.chaseRisk.score}`:""}
                {item.supportResistance?`｜壓力支撐：${item.supportResistance.signal}`:""}
                {item.volumeAnalysis?`｜量能：${item.volumeAnalysis.signal}`:""}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{alerts.map((alert,i)=><AlertPill key={i} alert={alert} />)}</div>
            </button>
          })}
        </div>
      </Block>}
    </>
  );
}

function CandlestickChart({data}:{data:ChartKBar[]}){
  if(!data||data.length===0) return <div className="rounded-2xl border border-slate-700 bg-slate-950 p-8 text-center text-slate-500">目前沒有 K線資料</div>;
  const width=900,height=360,padding=36,candleAreaHeight=250,volumeAreaTop=280,volumeAreaHeight=55;
  const prices=data.flatMap((d)=>[d.high,d.low]), maxPrice=Math.max(...prices), minPrice=Math.min(...prices), priceRange=maxPrice-minPrice||1;
  const maxVolume=Math.max(...data.map((d)=>d.volume||0))||1, step=(width-padding*2)/data.length, candleWidth=Math.max(4,step*0.55);
  function yPrice(price:number){return padding+((maxPrice-price)/priceRange)*candleAreaHeight;}
  function yVolume(volume:number){return volumeAreaTop+volumeAreaHeight-(volume/maxVolume)*volumeAreaHeight;}
  const closePoints=data.map((d,i)=>`${padding+i*step+step/2},${yPrice(d.close)}`).join(" ");
  return <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950 p-4"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[850px]">
    {[0,1,2,3,4].map((i)=>{const y=padding+(candleAreaHeight/4)*i, price=maxPrice-(priceRange/4)*i; return <g key={i}><line x1={padding} y1={y} x2={width-padding} y2={y} stroke="#1e293b" strokeWidth="1"/><text x={width-padding+8} y={y+4} fill="#64748b" fontSize="12">{price.toFixed(0)}</text></g>})}
    {data.map((d,i)=>{const x=padding+i*step+step/2, openY=yPrice(d.open), closeY=yPrice(d.close), highY=yPrice(d.high), lowY=yPrice(d.low), isUp=d.close>=d.open, color=isUp?"#34d399":"#f87171", bodyTop=Math.min(openY,closeY), bodyHeight=Math.max(2,Math.abs(openY-closeY)), volY=yVolume(d.volume||0); return <g key={d.date}><line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5"/><rect x={x-candleWidth/2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={isUp?"rgba(52,211,153,0.85)":"rgba(248,113,113,0.85)"} stroke={color}/><rect x={x-candleWidth/2} y={volY} width={candleWidth} height={volumeAreaTop+volumeAreaHeight-volY} fill={isUp?"rgba(52,211,153,0.25)":"rgba(248,113,113,0.25)"}/></g>})}
    <polyline points={closePoints} fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.9"/>
    <text x={padding} y={height-8} fill="#64748b" fontSize="12">{data[0].date}</text><text x={width-130} y={height-8} fill="#64748b" fontSize="12">{data[data.length-1].date}</text><text x={padding} y={volumeAreaTop-8} fill="#64748b" fontSize="12">成交量</text>
  </svg></div>
}

function Block({title,children}:{title:string;children:ReactNode}){return <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6"><SectionTitle>{title}</SectionTitle>{children}</div>}
function ReasonList({reasons}:{reasons:string[]}){return <div className="mt-5 space-y-3 rounded-2xl border border-slate-700 bg-slate-950 p-5 leading-7 text-slate-200">{reasons.map((reason,index)=><div key={index}>• {reason}</div>)}</div>}
function Panel({title,children}:{title:string;children:ReactNode}){return <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-xl"><div className="mb-4 font-black tracking-widest text-cyan-400">{title}</div>{children}</div>}
function SectionTitle({children}:{children:ReactNode}){return <div className="mb-4 font-black tracking-widest text-cyan-400">{children}</div>}

function Metric({label,value,trend}:{label:string;value:string|number;trend?:Trend}){
  const color=trend==="bull"?"text-emerald-400":trend==="bear"?"text-red-400":trend==="warning"?"text-orange-400":trend==="neutral"?"text-amber-400":"text-white";
  return <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4"><div className="mb-2 text-xs tracking-widest text-slate-500">{label}</div><div className={`text-2xl font-black ${color}`}>{value}</div></div>
}

function AlertCard({alert}:{alert:{label:string;level:"hot"|"bull"|"watch"|"bear";message:string}}){
  const style=alert.level==="bull"?"border-emerald-400/40 bg-emerald-400/10":alert.level==="bear"?"border-red-400/40 bg-red-400/10":alert.level==="hot"?"border-orange-400/40 bg-orange-400/10":"border-amber-400/40 bg-amber-400/10";
  return <div className={`rounded-2xl border p-5 ${style}`}><div className="mb-2 font-black">{alert.label}</div><div className="text-sm leading-6 text-slate-300">{alert.message}</div></div>
}
function AlertPill({alert}:{alert:{label:string;level:"hot"|"bull"|"watch"|"bear";message:string}}){
  const style=alert.level==="bull"?"bg-emerald-400/10 text-emerald-300 border-emerald-400/30":alert.level==="bear"?"bg-red-400/10 text-red-300 border-red-400/30":alert.level==="hot"?"bg-orange-400/10 text-orange-300 border-orange-400/30":"bg-amber-400/10 text-amber-300 border-amber-400/30";
  return <span className={`rounded-full border px-3 py-1 text-xs ${style}`}>{alert.label}</span>
}
function StatusRow({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-200">{value}</span></div>}
