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

type DiscussionSource = { title:string; url:string; content?:string };

type DiscussionSentiment = {
  overall:string;
  score:number;
  bullishPercent:number;
  neutralPercent:number;
  bearishPercent:number;
  heat:string;
  keywords:string[];
  bullishReasons:string[];
  bearishReasons:string[];
  summary:string;
  riskWarning:string;
  sources:DiscussionSource[];
};

type ChipAnalysis = {
  enabled:boolean;
  status:string;
  score:number;
  verdict:string;
  trend:Trend;
  latestDate:string|null;
  institutional:{
    foreignNetBuy:number;
    investmentTrustNetBuy:number;
    dealerNetBuy:number;
    totalNetBuy:number;
    fiveDayNetBuy:number;
    twentyDayNetBuy:number;
    foreignStreak:{direction:string; days:number; label:string};
    investmentTrustStreak:{direction:string; days:number; label:string};
    dealerStreak:{direction:string; days:number; label:string};
    totalStreak:{direction:string; days:number; label:string};
    signal:string;
    reasons:string[];
  };
  margin:{
    marginBalance:number|null;
    shortBalance:number|null;
    marginBalanceChange5:number|null;
    shortBalanceChange5:number|null;
    marginShortRatio:number|null;
    signal:string;
    reasons:string[];
  };
  summary:string;
  riskWarning:string;
};



type FundamentalAnalysis = {
  enabled:boolean;
  status:string;
  score:number;
  verdict:string;
  trend:Trend;
  latestRevenueMonth:string|null;
  monthlyRevenue:number|null;
  monthlyRevenueYoY:number|null;
  monthlyRevenueMoM:number|null;
  eps:number|null;
  grossMargin:number|null;
  operatingMargin:number|null;
  netProfitMargin:number|null;
  signal:string;
  reasons:string[];
  summary:string;
  riskWarning:string;
};

type IndustryThemeAnalysis = {
  enabled:boolean;
  status:string;
  score:number;
  verdict:string;
  trend:Trend;
  heat:string;
  themes:string[];
  opportunities:string[];
  risks:string[];
  summary:string;
  sources:DiscussionSource[];
};

type MarketEnvironmentAnalysis = {
  enabled:boolean;
  status:string;
  score:number;
  verdict:string;
  trend:Trend;
  latestDate:string|null;
  indexName:string;
  close:number|null;
  changePercent:number|null;
  ma5:number|null;
  ma20:number|null;
  ma60:number|null;
  rsi14:number|null;
  signal:string;
  reasons:string[];
  summary:string;
  riskWarning:string;
};


type ScoreBreakdown = {
  finalScore:number;
  verdict:string;
  trend:Trend;
  technical:number;
  chip:number;
  fundamental:number;
  industry:number;
  discussion:number;
  market:number;
  riskPenalty:number;
  confidence:number;
  reasons:string[];
};

type AbnormalAlert = { label:string; level:"hot"|"bull"|"watch"|"bear"; message:string };

type StrategyProfile = {
  shortTerm:{verdict:string; score:number; action:string; reasons:string[]};
  swing:{verdict:string; score:number; action:string; reasons:string[]};
  longTerm:{verdict:string; score:number; action:string; reasons:string[]};
  summary:string;
};

type DataQuality = {
  score:number;
  level:string;
  okCount:number;
  totalCount:number;
  missingModules:string[];
  warnings:string[];
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
  discussionSentiment?:DiscussionSentiment;
  chipAnalysis?:ChipAnalysis;
  fundamentalAnalysis?:FundamentalAnalysis;
  industryThemeAnalysis?:IndustryThemeAnalysis;
  marketEnvironment?:MarketEnvironmentAnalysis;
  scoreBreakdown?:ScoreBreakdown;
  abnormalAlerts?:AbnormalAlert[];
  strategyProfile?:StrategyProfile;
  dataQuality?:DataQuality;
  sourceStatus?:{fugle?:string; finmind?:string; tavily?:string; chip?:string; fundamental?:string; industry?:string; market?:string};
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

function formatSharesToLots(value:number|null|undefined){
  if(value===null||typeof value==="undefined"||Number.isNaN(Number(value))) return "-";
  const lots=Number(value)/1000;
  const absWan=Math.abs(lots)/10000;
  if(absWan>=1){
    return `${(lots/10000).toFixed(2)} 萬張`;
  }
  return `${Math.round(lots).toLocaleString("zh-TW")} 張`;
}


function formatRevenue(value:number|null|undefined){
  if(value===null||typeof value==="undefined"||Number.isNaN(Number(value))) return "-";
  const num=Number(value);
  const yi=num/100000000;
  if(Math.abs(yi)>=1) return `${yi.toFixed(2)} 億元`;
  const wan=num/10000;
  return `${wan.toFixed(2)} 萬元`;
}

function getModuleStatusText(status?:string){
  if(status==="ok") return "已啟用";
  if(status==="partial") return "部分資料";
  if(status==="missing_key") return "未設定 Key";
  if(status==="skipped") return "掃描略過";
  if(status==="no_results"||status==="no_data") return "暫無資料";
  if(status==="error") return "暫時異常";
  return "待查詢";
}

function getModuleStatusStyle(status?:string){
  if(status==="ok") return "text-emerald-300";
  if(status==="partial"||status==="no_results"||status==="no_data"||status==="skipped") return "text-amber-300";
  if(status==="missing_key"||status==="error") return "text-orange-300";
  return "text-slate-200";
}

function isEtfLikeSymbol(symbol?:string,name?:string){
  const clean=String(symbol||"").replace(".TW","").trim().toUpperCase();
  const displayName=String(name||"");

  if(/^00/.test(clean)) return true;
  if(/ETF|ETN|指數|主動|高股息|台灣50|TOP50|電動車|債|期貨|基金/.test(displayName)) return true;

  return false;
}

function getFundamentalStatusText(result?:AnalyzeResult|null){
  if(!result) return "待查詢";

  const status=result.sourceStatus?.fundamental;
  const isEtf=isEtfLikeSymbol(result.symbol,result.quote?.name);

  if(isEtf&&(status==="no_data"||status==="no_results"||!result.fundamentalAnalysis)){
    return "ETF 不適用";
  }

  return getModuleStatusText(status);
}

function getFundamentalStatusStyle(result?:AnalyzeResult|null){
  if(!result) return "text-slate-200";

  const status=result.sourceStatus?.fundamental;
  const isEtf=isEtfLikeSymbol(result.symbol,result.quote?.name);

  if(isEtf&&(status==="no_data"||status==="no_results"||!result.fundamentalAnalysis)){
    return "text-sky-300";
  }

  return getModuleStatusStyle(status);
}

function getFundamentalEmptyMessage(result:AnalyzeResult){
  if(isEtfLikeSymbol(result.symbol,result.quote?.name)){
    return "ETF / 指數型商品不適用一般公司財報，例如 EPS、毛利率、營益率、淨利率與月營收。這不是資料錯誤。";
  }

  return "目前沒有足夠財報資料，可能是資料源尚未更新或該標的財報欄位不完整。";
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

function getDiscussionTrend(overall?:string):Trend{
  if(!overall) return "neutral";
  if(overall.includes("多")) return "bull";
  if(overall.includes("空")) return "bear";
  if(overall.includes("分歧")) return "warning";
  return "neutral";
}

function getDiscussionStatusText(status?:string){
  if(status==="ok") return "已啟用";
  if(status==="missing_key") return "未設定 Key";
  if(status==="skipped") return "掃描略過";
  if(status==="no_results") return "暫無資料";
  if(status==="fallback") return "掃描略過";
  if(status==="error") return "暫時異常";
  return "待查詢";
}

function getDiscussionStatusStyle(status?:string){
  if(status==="ok") return "text-emerald-300";
  if(status==="missing_key"||status==="error") return "text-orange-300";
  if(status==="no_results"||status==="fallback") return "text-amber-300";
  return "text-slate-200";
}

function getChipStatusText(status?:string){
  if(status==="ok") return "已啟用";
  if(status==="partial") return "部分資料";
  if(status==="no_data") return "暫無資料";
  if(status==="error") return "暫時異常";
  return "待查詢";
}

function getChipStatusStyle(status?:string){
  if(status==="ok") return "text-emerald-300";
  if(status==="partial"||status==="no_data") return "text-amber-300";
  if(status==="error") return "text-orange-300";
  return "text-slate-200";
}

function getAlert(result:AnalyzeResult){
  const alerts:{label:string;level:"hot"|"bull"|"watch"|"bear";message:string}[]=[];
  result.abnormalAlerts?.slice(0,4).forEach((item)=>alerts.push(item));
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
  if(result.discussionSentiment?.overall?.includes("多")) alerts.push({label:"💬 討論偏多",level:"bull",message:"公開討論區目前偏多，代表市場關注度與正向情緒較高。"});
  if(result.discussionSentiment?.overall?.includes("空")) alerts.push({label:"💬 討論偏空",level:"bear",message:"公開討論區目前偏空，需留意市場疑慮與負面情緒。"});
  if(result.discussionSentiment?.overall?.includes("分歧")) alerts.push({label:"💬 多空分歧",level:"hot",message:"公開討論區多空看法分歧，短線波動可能較大。"});
  if(result.chipAnalysis?.trend==="bull") alerts.push({label:"🏦 籌碼偏多",level:"bull",message:"法人或融資融券結構偏多，籌碼面對股價較有支撐。"});
  if(result.chipAnalysis?.trend==="bear") alerts.push({label:"🏦 籌碼偏空",level:"bear",message:"法人賣超或籌碼結構轉弱，短線需留意賣壓。"});
  if(result.chipAnalysis?.trend==="warning") alerts.push({label:"🏦 籌碼警示",level:"hot",message:"籌碼面出現警示，例如融資增加但股價未同步轉強。"});
  if(result.fundamentalAnalysis?.trend==="bull") alerts.push({label:"📘 基本面偏多",level:"bull",message:"營收或財報數據偏正向，中長期支撐較佳。"});
  if(result.fundamentalAnalysis?.trend==="bear") alerts.push({label:"📘 基本面偏空",level:"bear",message:"營收或財報數據偏弱，需留意獲利與成長壓力。"});
  if(result.industryThemeAnalysis?.trend==="bull") alerts.push({label:"🚀 題材偏多",level:"bull",message:"產業題材與市場敘事偏正向。"});
  if(result.industryThemeAnalysis?.trend==="warning") alerts.push({label:"🔥 題材過熱",level:"hot",message:"題材熱度高，需防利多鈍化或追高。"});
  if(result.marketEnvironment?.trend==="bull") alerts.push({label:"🌏 大盤偏多",level:"bull",message:"大盤環境偏多，個股操作勝率相對提高。"});
  if(result.marketEnvironment?.trend==="bear") alerts.push({label:"🌏 大盤偏空",level:"bear",message:"大盤環境偏弱，個股操作要更保守。"});
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

  if (data.chipAnalysis) {
    lines.push(`籌碼面判斷：${data.chipAnalysis.verdict}`);
    lines.push(`籌碼分數：${data.chipAnalysis.score}`);
    lines.push(`法人訊號：${data.chipAnalysis.institutional.signal}`);
    lines.push(`外資買賣超：${formatSharesToLots(data.chipAnalysis.institutional.foreignNetBuy)}`);
    lines.push(`投信買賣超：${formatSharesToLots(data.chipAnalysis.institutional.investmentTrustNetBuy)}`);
    lines.push(`自營商買賣超：${formatSharesToLots(data.chipAnalysis.institutional.dealerNetBuy)}`);
    lines.push(`5日法人合計：${formatSharesToLots(data.chipAnalysis.institutional.fiveDayNetBuy)}`);
    lines.push(`融資融券：${data.chipAnalysis.margin.signal}`);
    lines.push(`融資餘額：${formatSharesToLots(data.chipAnalysis.margin.marginBalance)}`);
    lines.push(`融券餘額：${formatSharesToLots(data.chipAnalysis.margin.shortBalance)}`);
    lines.push(`籌碼總結：${data.chipAnalysis.summary}`);
    lines.push(``);
  }

  if (data.discussionSentiment) {
    lines.push(`公開討論區風向：${data.discussionSentiment.overall}`);
    lines.push(`討論風向分數：${data.discussionSentiment.score}`);
    lines.push(`看多/中立/看空：${data.discussionSentiment.bullishPercent}% / ${data.discussionSentiment.neutralPercent}% / ${data.discussionSentiment.bearishPercent}%`);
    lines.push(`討論熱度：${data.discussionSentiment.heat}`);
    if (data.discussionSentiment.keywords?.length) lines.push(`熱門關鍵字：${data.discussionSentiment.keywords.join("、")}`);
    if (data.discussionSentiment.summary) lines.push(`風向總結：${data.discussionSentiment.summary}`);
    lines.push(``);
  }

  if (data.fundamentalAnalysis) {
    lines.push(`基本面判斷：${data.fundamentalAnalysis.verdict}`);
    lines.push(`基本面分數：${data.fundamentalAnalysis.score}`);
    lines.push(`月營收：${formatRevenue(data.fundamentalAnalysis.monthlyRevenue)}`);
    lines.push(`營收年增：${formatPercent(data.fundamentalAnalysis.monthlyRevenueYoY)}`);
    lines.push(`營收月增：${formatPercent(data.fundamentalAnalysis.monthlyRevenueMoM)}`);
    lines.push(`EPS：${formatTech(data.fundamentalAnalysis.eps)}`);
    lines.push(`基本面總結：${data.fundamentalAnalysis.summary}`);
    lines.push(``);
  }

  if (data.industryThemeAnalysis) {
    lines.push(`產業題材：${data.industryThemeAnalysis.verdict}`);
    lines.push(`題材分數：${data.industryThemeAnalysis.score}`);
    lines.push(`題材熱度：${data.industryThemeAnalysis.heat}`);
    if (data.industryThemeAnalysis.themes?.length) lines.push(`主要題材：${data.industryThemeAnalysis.themes.join("、")}`);
    lines.push(`題材總結：${data.industryThemeAnalysis.summary}`);
    lines.push(``);
  }

  if (data.marketEnvironment) {
    lines.push(`大盤環境：${data.marketEnvironment.verdict}`);
    lines.push(`大盤分數：${data.marketEnvironment.score}`);
    lines.push(`大盤收盤：${formatPrice(data.marketEnvironment.close)}`);
    lines.push(`大盤漲跌：${formatPercent(data.marketEnvironment.changePercent)}`);
    lines.push(`大盤總結：${data.marketEnvironment.summary}`);
    lines.push(``);
  }

  if (data.scoreBreakdown) {
    lines.push(`綜合總分：${data.scoreBreakdown.finalScore}｜${data.scoreBreakdown.verdict}`);
    lines.push(`技術/籌碼/基本/題材/討論/大盤：${data.scoreBreakdown.technical}/${data.scoreBreakdown.chip}/${data.scoreBreakdown.fundamental}/${data.scoreBreakdown.industry}/${data.scoreBreakdown.discussion}/${data.scoreBreakdown.market}`);
    lines.push(`風險修正：${data.scoreBreakdown.riskPenalty}`);
    lines.push(`資料可信度：${data.scoreBreakdown.confidence}%`);
    lines.push(``);
  }

  if (data.strategyProfile) {
    lines.push(`短線 / 波段 / 長期策略分層：${data.strategyProfile.summary}`);
    lines.push(`短線：${data.strategyProfile.shortTerm.verdict}｜${data.strategyProfile.shortTerm.score}｜${data.strategyProfile.shortTerm.action}`);
    lines.push(`波段：${data.strategyProfile.swing.verdict}｜${data.strategyProfile.swing.score}｜${data.strategyProfile.swing.action}`);
    lines.push(`長期：${data.strategyProfile.longTerm.verdict}｜${data.strategyProfile.longTerm.score}｜${data.strategyProfile.longTerm.action}`);
    lines.push(``);
  }

  if (data.abnormalAlerts?.length) {
    lines.push(`異常警報：`);
    data.abnormalAlerts.forEach((item,index)=>lines.push(`${index+1}. ${item.label}：${item.message}`));
    lines.push(``);
  }

  if (data.dataQuality) {
    lines.push(`資料完整度：${data.dataQuality.score}%｜${data.dataQuality.level}`);
    if (data.dataQuality.missingModules?.length) lines.push(`資料不足模組：${data.dataQuality.missingModules.join("、")}`);
    lines.push(``);
  }

  if (data.chaseRisk) {
    lines.push(`追高風險：${data.chaseRisk.score} 分｜${data.chaseRisk.level}`);
    lines.push(`追高建議：${data.chaseRisk.suggestion}`);
    lines.push(``);
  }

  if (data.tradePlan) {
    lines.push(`AI 進場策略：${data.tradePlan.stance}`);
    lines.push(`建議動作：${data.tradePlan.action}`);
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

  async function fetchAnalyze(
    targetSymbol:string,
    options?:{skipTavily?:boolean; liteFinMind?:boolean; mode?:"single"|"scan"; forceRefreshTavily?:boolean}
  ){
    const response=await fetch("/api/analyze",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        symbol:targetSymbol,
        skipTavily:options?.skipTavily || false,
        liteFinMind:options?.liteFinMind || options?.mode === "scan",
        mode:options?.mode || "single",
        forceRefreshTavily:options?.forceRefreshTavily || false,
      })
    });
    const result=await response.json();
    if(!result.success) throw new Error(result.error||`${targetSymbol} 分析失敗`);
    return result as AnalyzeResult;
  }

  async function addWatchlist(){
    const clean=cleanSymbol(symbol);
    if(!clean){ setError("請先輸入股票代號"); return; }
    if(watchlist.some((item)=>item.symbol===clean)){ setError(`${clean} 已經在自選股`); return; }

    setError("");
    setSymbol(clean);

    saveWatchlist([
      ...watchlist,
      { symbol: clean, name: STOCK_NAMES[clean] || clean },
    ]);
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
      try{
        const result=await fetchAnalyze(item.symbol,{skipTavily:true,liteFinMind:true,mode:"scan"});
        results.push(result);
        setScanResults([...results]);
      }catch{}
    }
    results.sort((a,b)=>b.ai.score-a.ai.score);
    setScanResults(results);

    if(results.length>0){
      setData(results[0]);
      addHistory(results[0]);
    }else{
      setError("自選股掃描完成，但目前沒有成功取得任何股票資料，請稍後再試或檢查 API 狀態。");
    }

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
              <p className="mt-3 text-sm text-slate-400 md:text-base">即時報價 × K線圖 × 籌碼面 × 基本面 × 產業題材 × 大盤環境 × 公開討論區風向</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-sm text-slate-300">
              <div>資料來源：Fugle + FinMind + Tavily</div>
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
              <MobileScanResultsPreview scanResults={scanResults} setData={setData} />
            </Panel>
          </aside>

          <section id="analysis-main" className="space-y-6">
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
                <StatusRow label="FinMind 籌碼面" value={getChipStatusText(data?.sourceStatus?.chip)} valueClassName={getChipStatusStyle(data?.sourceStatus?.chip)} />
                <StatusRow label="Tavily 公開討論區" value={getDiscussionStatusText(data?.sourceStatus?.tavily)} valueClassName={getDiscussionStatusStyle(data?.sourceStatus?.tavily)} />
                <StatusRow label="K線圖" value="已啟用" />
                <StatusRow label="K線型態辨識" value="已啟用" />
                <StatusRow label="成交量分析" value="已啟用" />
                <StatusRow label="支撐壓力分析" value="已啟用" />
                <StatusRow label="追高風險分數" value="已啟用" />
                <StatusRow label="AI 進場策略" value="已啟用" />
                <StatusRow label="基本面財報" value={getFundamentalStatusText(data)} valueClassName={getFundamentalStatusStyle(data)} />
                <StatusRow label="產業題材" value={getModuleStatusText(data?.sourceStatus?.industry)} valueClassName={getModuleStatusStyle(data?.sourceStatus?.industry)} />
                <StatusRow label="大盤環境" value={getModuleStatusText(data?.sourceStatus?.market)} valueClassName={getModuleStatusStyle(data?.sourceStatus?.market)} />
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
          {data.scoreBreakdown && <Metric label="綜合總分" value={`${data.scoreBreakdown.finalScore} / 100`} trend={data.scoreBreakdown.trend} />}
          {data.dataQuality && <Metric label="資料完整度" value={`${data.dataQuality.score}%`} trend={data.dataQuality.score>=80?"bull":data.dataQuality.score>=55?"warning":"bear"} />}
          {data.discussionSentiment && <Metric label="討論風向" value={data.discussionSentiment.overall} trend={getDiscussionTrend(data.discussionSentiment.overall)} />}
          {data.chipAnalysis && <Metric label="籌碼分數" value={`${data.chipAnalysis.score} / 100`} trend={data.chipAnalysis.trend} />}
          {data.fundamentalAnalysis && <Metric label="基本面分數" value={`${data.fundamentalAnalysis.score} / 100`} trend={data.fundamentalAnalysis.trend} />}
          {data.industryThemeAnalysis && <Metric label="題材分數" value={`${data.industryThemeAnalysis.score} / 100`} trend={data.industryThemeAnalysis.trend} />}
          {data.marketEnvironment && <Metric label="大盤環境" value={data.marketEnvironment.verdict} trend={data.marketEnvironment.trend} />}
        </div>
      </div>

      {scanResults.length>0 && <ScanResultsQuickBlock scanResults={scanResults} setData={setData} />}

      <MobileAnalysisTabs data={data} scanResults={scanResults} setData={setData} copyReport={copyReport} />

      <div className="hidden">

      {data.scoreBreakdown && <Block title="AI 綜合總分拆解">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.scoreBreakdown.trend)}`}>
            綜合判斷：{data.scoreBreakdown.verdict}｜{data.scoreBreakdown.finalScore} 分
          </div>
          <div className="text-sm text-slate-400">資料可信度：{data.scoreBreakdown.confidence}%｜風險修正：{data.scoreBreakdown.riskPenalty}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="技術面" value={`${data.scoreBreakdown.technical} 分`} trend={data.scoreBreakdown.technical>=65?"bull":data.scoreBreakdown.technical<=40?"bear":"neutral"} />
          <Metric label="籌碼面" value={`${data.scoreBreakdown.chip} 分`} trend={data.scoreBreakdown.chip>=65?"bull":data.scoreBreakdown.chip<=40?"bear":"neutral"} />
          <Metric label="基本面" value={`${data.scoreBreakdown.fundamental} 分`} trend={data.scoreBreakdown.fundamental>=65?"bull":data.scoreBreakdown.fundamental<=40?"bear":"neutral"} />
          <Metric label="產業題材" value={`${data.scoreBreakdown.industry} 分`} trend={data.scoreBreakdown.industry>=65?"bull":data.scoreBreakdown.industry<=40?"bear":"neutral"} />
          <Metric label="討論區" value={`${data.scoreBreakdown.discussion} 分`} trend={data.scoreBreakdown.discussion>=65?"bull":data.scoreBreakdown.discussion<=40?"bear":"neutral"} />
          <Metric label="大盤環境" value={`${data.scoreBreakdown.market} 分`} trend={data.scoreBreakdown.market>=65?"bull":data.scoreBreakdown.market<=40?"bear":"neutral"} />
          <Metric label="風險修正" value={data.scoreBreakdown.riskPenalty} trend={data.scoreBreakdown.riskPenalty<0?"warning":"bull"} />
          <Metric label="可信度" value={`${data.scoreBreakdown.confidence}%`} trend={data.scoreBreakdown.confidence>=80?"bull":data.scoreBreakdown.confidence>=55?"warning":"bear"} />
        </div>
        <ReasonList reasons={data.scoreBreakdown.reasons} />
      </Block>}

      {data.strategyProfile && <Block title="短線 / 波段 / 長期策略分層（新版權重）">
        <div className="mb-5 rounded-2xl border border-cyan-400/30 bg-slate-950 p-5">
          <div className="mb-2 font-black text-cyan-400">策略總結</div>
          <div className="leading-7 text-slate-200">{data.strategyProfile.summary}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StrategyCard title="短線" item={data.strategyProfile.shortTerm} />
          <StrategyCard title="波段" item={data.strategyProfile.swing} />
          <StrategyCard title="長期" item={data.strategyProfile.longTerm} />
        </div>
      </Block>}

      {data.abnormalAlerts?.length ? <Block title="異常警報雷達">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.abnormalAlerts.map((alert,index)=><AlertCard key={index} alert={alert} />)}
        </div>
      </Block> : null}

      {data.dataQuality && <Block title="資料完整度 / 可信度">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.dataQuality.score>=80?"bull":data.dataQuality.score>=55?"warning":"bear")}`}>
            資料完整度：{data.dataQuality.score}%｜{data.dataQuality.level}
          </div>
          <div className="text-sm text-slate-400">{data.dataQuality.okCount} / {data.dataQuality.totalCount} 個資料模組有回傳</div>
        </div>
        <ReasonList reasons={data.dataQuality.warnings} />
      </Block>}

      {data.chipAnalysis && <Block title="籌碼面分析">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.chipAnalysis.trend)}`}>
            籌碼判斷：{data.chipAnalysis.verdict}｜{data.chipAnalysis.score} 分
          </div>
          <div className="text-sm text-slate-400">最新資料日：{data.chipAnalysis.latestDate || "資料不足"}｜來源：FinMind</div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="外資買賣超" value={formatSharesToLots(data.chipAnalysis.institutional.foreignNetBuy)} trend={data.chipAnalysis.institutional.foreignNetBuy>=0?"bull":"bear"} />
          <Metric label="投信買賣超" value={formatSharesToLots(data.chipAnalysis.institutional.investmentTrustNetBuy)} trend={data.chipAnalysis.institutional.investmentTrustNetBuy>=0?"bull":"bear"} />
          <Metric label="自營商買賣超" value={formatSharesToLots(data.chipAnalysis.institutional.dealerNetBuy)} trend={data.chipAnalysis.institutional.dealerNetBuy>=0?"bull":"bear"} />
          <Metric label="三大法人合計" value={formatSharesToLots(data.chipAnalysis.institutional.totalNetBuy)} trend={data.chipAnalysis.institutional.totalNetBuy>=0?"bull":"bear"} />
          <Metric label="5日法人合計" value={formatSharesToLots(data.chipAnalysis.institutional.fiveDayNetBuy)} trend={data.chipAnalysis.institutional.fiveDayNetBuy>=0?"bull":"bear"} />
          <Metric label="20日法人合計" value={formatSharesToLots(data.chipAnalysis.institutional.twentyDayNetBuy)} trend={data.chipAnalysis.institutional.twentyDayNetBuy>=0?"bull":"bear"} />
          <Metric label="外資連買賣" value={data.chipAnalysis.institutional.foreignStreak?.label || "資料不足"} trend={data.chipAnalysis.institutional.foreignStreak?.direction==="買超"?"bull":data.chipAnalysis.institutional.foreignStreak?.direction==="賣超"?"bear":"neutral"} />
          <Metric label="投信連買賣" value={data.chipAnalysis.institutional.investmentTrustStreak?.label || "資料不足"} trend={data.chipAnalysis.institutional.investmentTrustStreak?.direction==="買超"?"bull":data.chipAnalysis.institutional.investmentTrustStreak?.direction==="賣超"?"bear":"neutral"} />
          <Metric label="法人訊號" value={data.chipAnalysis.institutional.signal} trend={data.chipAnalysis.trend} />
          <Metric label="融資融券訊號" value={data.chipAnalysis.margin.signal} trend={data.chipAnalysis.trend} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="融資餘額" value={formatSharesToLots(data.chipAnalysis.margin.marginBalance)} />
          <Metric label="融資5日變化" value={formatSharesToLots(data.chipAnalysis.margin.marginBalanceChange5)} trend={data.chipAnalysis.margin.marginBalanceChange5!==null&&data.chipAnalysis.margin.marginBalanceChange5<=0?"bull":"warning"} />
          <Metric label="融券餘額" value={formatSharesToLots(data.chipAnalysis.margin.shortBalance)} />
          <Metric label="融券5日變化" value={formatSharesToLots(data.chipAnalysis.margin.shortBalanceChange5)} trend={data.chipAnalysis.margin.shortBalanceChange5!==null&&data.chipAnalysis.margin.shortBalanceChange5>=0?"warning":"neutral"} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-cyan-400/30 bg-slate-950 p-5">
            <div className="mb-3 font-black text-cyan-300">法人籌碼重點</div>
            <div className="space-y-2 text-sm leading-6 text-slate-200">
              {(data.chipAnalysis.institutional.reasons?.length ? data.chipAnalysis.institutional.reasons : ["目前法人資料不足，暫時無法判斷。 "]).map((item,index)=><div key={index}>• {item}</div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-400/30 bg-slate-950 p-5">
            <div className="mb-3 font-black text-purple-300">融資融券重點</div>
            <div className="space-y-2 text-sm leading-6 text-slate-200">
              {(data.chipAnalysis.margin.reasons?.length ? data.chipAnalysis.margin.reasons : ["目前融資融券資料不足，暫時無法判斷。 "]).map((item,index)=><div key={index}>• {item}</div>)}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-2 font-black text-cyan-400">籌碼總結</div>
          <div className="leading-7 text-slate-200">{data.chipAnalysis.summary}</div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          {data.chipAnalysis.riskWarning || "籌碼面只代表市場資金流向，不等於買賣建議。"}
        </div>
      </Block>}

      {data.discussionSentiment && <Block title="公開討論區風向分析">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(getDiscussionTrend(data.discussionSentiment.overall))}`}>
            討論風向：{data.discussionSentiment.overall}
          </div>
          <div className="text-sm text-slate-400">熱度：{data.discussionSentiment.heat}｜來源：Tavily 公開搜尋</div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="風向分數" value={`${data.discussionSentiment.score} / 100`} trend={getDiscussionTrend(data.discussionSentiment.overall)} />
          <Metric label="看多比例" value={`${data.discussionSentiment.bullishPercent}%`} trend="bull" />
          <Metric label="中立比例" value={`${data.discussionSentiment.neutralPercent}%`} trend="neutral" />
          <Metric label="看空比例" value={`${data.discussionSentiment.bearishPercent}%`} trend="bear" />
        </div>

        {data.discussionSentiment.keywords?.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 text-sm font-black tracking-widest text-slate-400">熱門關鍵字</div>
            <div className="flex flex-wrap gap-2">
              {data.discussionSentiment.keywords.map((item,index)=><span key={index} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-300">{item}</span>)}
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <div className="mb-3 font-black text-emerald-300">看多討論重點</div>
            <div className="space-y-2 text-sm leading-6 text-slate-200">
              {(data.discussionSentiment.bullishReasons?.length ? data.discussionSentiment.bullishReasons : ["目前沒有明確看多討論重點。"]).map((item,index)=><div key={index}>• {item}</div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
            <div className="mb-3 font-black text-red-300">看空討論重點</div>
            <div className="space-y-2 text-sm leading-6 text-slate-200">
              {(data.discussionSentiment.bearishReasons?.length ? data.discussionSentiment.bearishReasons : ["目前沒有明確看空討論重點。"]).map((item,index)=><div key={index}>• {item}</div>)}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-2 font-black text-cyan-400">AI 風向總結</div>
          <div className="leading-7 text-slate-200">{data.discussionSentiment.summary || "目前公開討論資料不足，暫時無法形成可靠風向。"}</div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          {data.discussionSentiment.riskWarning || "公開討論區風向只代表市場情緒，不等於買賣建議。"}
        </div>

        {data.discussionSentiment.sources?.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5">
            <div className="mb-3 font-black text-slate-300">公開資料來源</div>
            <div className="space-y-2">
              {data.discussionSentiment.sources.slice(0,6).map((source,index)=>(
                <a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-cyan-300 hover:border-cyan-400/50">
                  {source.title || source.url}
                </a>
              ))}
            </div>
          </div>
        )}
      </Block>}


      {data.fundamentalAnalysis && <Block title="基本面財報分析">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.fundamentalAnalysis.trend)}`}>
            基本面判斷：{data.fundamentalAnalysis.verdict}｜{data.fundamentalAnalysis.score} 分
          </div>
          <div className="text-sm text-slate-400">最新營收月份：{data.fundamentalAnalysis.latestRevenueMonth || "資料不足"}｜來源：FinMind</div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="月營收" value={formatRevenue(data.fundamentalAnalysis.monthlyRevenue)} />
          <Metric label="營收年增率" value={formatPercent(data.fundamentalAnalysis.monthlyRevenueYoY)} trend={data.fundamentalAnalysis.monthlyRevenueYoY!==null&&data.fundamentalAnalysis.monthlyRevenueYoY>=0?"bull":"bear"} />
          <Metric label="營收月增率" value={formatPercent(data.fundamentalAnalysis.monthlyRevenueMoM)} trend={data.fundamentalAnalysis.monthlyRevenueMoM!==null&&data.fundamentalAnalysis.monthlyRevenueMoM>=0?"bull":"bear"} />
          <Metric label="基本面訊號" value={data.fundamentalAnalysis.signal} trend={data.fundamentalAnalysis.trend} />
          <Metric label="EPS" value={formatTech(data.fundamentalAnalysis.eps)} trend={data.fundamentalAnalysis.eps!==null&&data.fundamentalAnalysis.eps>=0?"bull":"bear"} />
          <Metric label="毛利率" value={formatPercent(data.fundamentalAnalysis.grossMargin)} />
          <Metric label="營益率" value={formatPercent(data.fundamentalAnalysis.operatingMargin)} />
          <Metric label="淨利率" value={formatPercent(data.fundamentalAnalysis.netProfitMargin)} />
        </div>
        <ReasonList reasons={data.fundamentalAnalysis.reasons} />
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-2 font-black text-cyan-400">基本面總結</div>
          <div className="leading-7 text-slate-200">{data.fundamentalAnalysis.summary}</div>
        </div>
      </Block>}

      {data.industryThemeAnalysis && <Block title="產業題材分析">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.industryThemeAnalysis.trend)}`}>
            題材判斷：{data.industryThemeAnalysis.verdict}｜{data.industryThemeAnalysis.score} 分
          </div>
          <div className="text-sm text-slate-400">熱度：{data.industryThemeAnalysis.heat}｜來源：Tavily 公開搜尋</div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="題材分數" value={`${data.industryThemeAnalysis.score} / 100`} trend={data.industryThemeAnalysis.trend} />
          <Metric label="題材熱度" value={data.industryThemeAnalysis.heat} trend={data.industryThemeAnalysis.heat==="高"?"warning":"neutral"} />
          <Metric label="題材判斷" value={data.industryThemeAnalysis.verdict} trend={data.industryThemeAnalysis.trend} />
          <Metric label="題材數量" value={data.industryThemeAnalysis.themes?.length || 0} />
        </div>
        {data.industryThemeAnalysis.themes?.length > 0 && <div className="mt-5 flex flex-wrap gap-2">
          {data.industryThemeAnalysis.themes.map((item,index)=><span key={index} className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-sm font-bold text-purple-300">{item}</span>)}
        </div>}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <div className="mb-3 font-black text-emerald-300">題材機會</div>
            <div className="space-y-2 text-sm leading-6 text-slate-200">{(data.industryThemeAnalysis.opportunities?.length?data.industryThemeAnalysis.opportunities:["目前沒有明確題材機會。 "]).map((item,index)=><div key={index}>• {item}</div>)}</div>
          </div>
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
            <div className="mb-3 font-black text-red-300">題材風險</div>
            <div className="space-y-2 text-sm leading-6 text-slate-200">{(data.industryThemeAnalysis.risks?.length?data.industryThemeAnalysis.risks:["目前沒有明確題材風險。 "]).map((item,index)=><div key={index}>• {item}</div>)}</div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-2 font-black text-cyan-400">題材總結</div>
          <div className="leading-7 text-slate-200">{data.industryThemeAnalysis.summary}</div>
        </div>
      </Block>}

      {data.marketEnvironment && <Block title="大盤環境分析">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.marketEnvironment.trend)}`}>
            大盤判斷：{data.marketEnvironment.verdict}｜{data.marketEnvironment.score} 分
          </div>
          <div className="text-sm text-slate-400">{data.marketEnvironment.indexName}｜{data.marketEnvironment.latestDate || "資料不足"}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="大盤收盤" value={formatPrice(data.marketEnvironment.close)} />
          <Metric label="大盤漲跌幅" value={formatPercent(data.marketEnvironment.changePercent)} trend={data.marketEnvironment.changePercent!==null&&data.marketEnvironment.changePercent>=0?"bull":"bear"} />
          <Metric label="大盤 MA5" value={formatTech(data.marketEnvironment.ma5)} />
          <Metric label="大盤 MA20" value={formatTech(data.marketEnvironment.ma20)} />
          <Metric label="大盤 MA60" value={formatTech(data.marketEnvironment.ma60)} />
          <Metric label="大盤 RSI" value={formatTech(data.marketEnvironment.rsi14)} />
          <Metric label="大盤訊號" value={data.marketEnvironment.signal} trend={data.marketEnvironment.trend} />
          <Metric label="大盤分數" value={`${data.marketEnvironment.score} / 100`} trend={data.marketEnvironment.trend} />
        </div>
        <ReasonList reasons={data.marketEnvironment.reasons} />
        <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          {data.marketEnvironment.riskWarning}
        </div>
      </Block>}

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

      {data.tradePlan && <Block title="AI 進場策略">
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
                {item.discussionSentiment?`｜討論：${item.discussionSentiment.overall}`:""}
                {item.chipAnalysis?`｜籌碼：${item.chipAnalysis.verdict} ${item.chipAnalysis.score}分`:""}
                {item.fundamentalAnalysis?`｜基本面：${item.fundamentalAnalysis.verdict} ${item.fundamentalAnalysis.score}分`:""}
                {item.industryThemeAnalysis?`｜題材：${item.industryThemeAnalysis.verdict} ${item.industryThemeAnalysis.score}分`:""}
                {item.marketEnvironment?`｜大盤：${item.marketEnvironment.verdict} ${item.marketEnvironment.score}分`:""}
                {item.scoreBreakdown?`｜綜合：${item.scoreBreakdown.verdict} ${item.scoreBreakdown.finalScore}分`:""}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{alerts.map((alert,i)=><AlertPill key={i} alert={alert} />)}</div>
            </button>
          })}
        </div>
      </Block>}
      </div>
    </>
  );
}




function MobileScanResultsPreview({scanResults,setData}:{scanResults:AnalyzeResult[]; setData:(d:AnalyzeResult)=>void}){
  if(scanResults.length===0) return null;

  function choose(item:AnalyzeResult){
    setData(item);
    setTimeout(()=>{
      document.getElementById("analysis-main")?.scrollIntoView({behavior:"smooth",block:"start"});
    },50);
  }

  return <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 xl:hidden">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <div className="text-xs font-black tracking-widest text-emerald-300">SCAN RESULTS</div>
        <div className="mt-1 font-black text-white">自選股掃描結果</div>
      </div>
      <div className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-200">
        {scanResults.length} 檔
      </div>
    </div>

    <div className="space-y-2">
      {scanResults.slice(0,5).map((item,index)=>(
        <button key={item.symbol} type="button" onClick={()=>choose(item)} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-left active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">排名 #{index+1}</div>
              <div className="font-black text-white">{item.quote.name} {item.symbol}</div>
            </div>
            <div className={item.ai.trend==="bull"?"text-sm font-black text-emerald-400":item.ai.trend==="bear"?"text-sm font-black text-red-400":"text-sm font-black text-amber-400"}>
              {item.ai.score} 分
            </div>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {item.ai.verdict}｜漲跌 {item.quote.changePercent}%{item.chaseRisk?`｜追高 ${item.chaseRisk.score}`:""}
          </div>
        </button>
      ))}
    </div>

    <button type="button" onClick={()=>choose(scanResults[0])} className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white">
      查看最高分分析
    </button>
  </div>
}

function ScanResultsQuickBlock({scanResults,setData}:{scanResults:AnalyzeResult[]; setData:(d:AnalyzeResult)=>void}){
  if(scanResults.length===0) return null;
  const strongest=scanResults[0];
  const highRisk=[...scanResults].sort((a,b)=>(b.chaseRisk?.score || 0)-(a.chaseRisk?.score || 0))[0];
  const weakest=[...scanResults].sort((a,b)=>a.ai.score-b.ai.score)[0];

  return <Block title="自選股掃描結果">
    <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
      {strongest && <button type="button" onClick={()=>setData(strongest)} className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-left hover:bg-emerald-400/15">
        <div className="text-xs font-bold tracking-widest text-emerald-300">最強勢</div>
        <div className="mt-2 text-xl font-black">{strongest.quote.name} {strongest.symbol}</div>
        <div className="mt-1 text-emerald-300">{strongest.ai.verdict}｜{strongest.ai.score} 分</div>
      </button>}
      {highRisk && <button type="button" onClick={()=>setData(highRisk)} className="rounded-2xl border border-orange-400/40 bg-orange-400/10 p-4 text-left hover:bg-orange-400/15">
        <div className="text-xs font-bold tracking-widest text-orange-300">追高風險最高</div>
        <div className="mt-2 text-xl font-black">{highRisk.quote.name} {highRisk.symbol}</div>
        <div className="mt-1 text-orange-300">追高風險｜{highRisk.chaseRisk?.score ?? "-"} 分</div>
      </button>}
      {weakest && <button type="button" onClick={()=>setData(weakest)} className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-left hover:bg-red-400/15">
        <div className="text-xs font-bold tracking-widest text-red-300">最弱勢</div>
        <div className="mt-2 text-xl font-black">{weakest.quote.name} {weakest.symbol}</div>
        <div className="mt-1 text-red-300">{weakest.ai.verdict}｜{weakest.ai.score} 分</div>
      </button>}
    </div>

    <div className="space-y-3">
      {scanResults.map((item,index)=>{
        const alerts=getAlert(item);
        return <button key={item.symbol} type="button" onClick={()=>setData(item)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-left hover:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">排名 #{index+1}</div>
              <div className="text-2xl font-black">{item.quote.name} {item.symbol}</div>
            </div>
            <div className={item.ai.trend==="bull"?"font-black text-emerald-400":item.ai.trend==="bear"?"font-black text-red-400":"font-black text-amber-400"}>{item.ai.verdict}｜{item.ai.score} 分</div>
          </div>
          <div className="mt-2 text-sm text-slate-400">
            漲跌幅：{item.quote.changePercent}%｜RSI：{formatTech(item.technical.rsi14)}｜KD：{formatTech(item.technical.kd)}
            {item.scoreBreakdown?`｜綜合：${item.scoreBreakdown.verdict} ${item.scoreBreakdown.finalScore}分`:""}
            {item.chipAnalysis?`｜籌碼：${item.chipAnalysis.verdict} ${item.chipAnalysis.score}分`:""}
            {item.discussionSentiment?`｜討論：${item.discussionSentiment.overall}`:""}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{alerts.slice(0,5).map((alert,i)=><AlertPill key={i} alert={alert} />)}</div>
        </button>
      })}
    </div>
  </Block>
}

type MobileTabKey = "overview" | "tech" | "chip" | "theme" | "fund" | "strategy";

function MobileAnalysisTabs({data,scanResults,setData,copyReport}:{data:AnalyzeResult; scanResults:AnalyzeResult[]; setData:(d:AnalyzeResult)=>void; copyReport:(d?:AnalyzeResult)=>void}){
  const [activeTab,setActiveTab]=useState<MobileTabKey>("overview");
  const tabs:{key:MobileTabKey; label:string; icon:string; hint:string}[]=[
    {key:"overview",label:"總覽",icon:"📌",hint:"分數 / 警報"},
    {key:"tech",label:"技術",icon:"📈",hint:"K線 / 指標"},
    {key:"chip",label:"籌碼",icon:"🏦",hint:"法人 / 融資"},
    {key:"theme",label:"題材",icon:"🔥",hint:"題材 / 討論"},
    {key:"fund",label:"財報",icon:"📘",hint:"營收 / EPS"},
    {key:"strategy",label:"策略",icon:"🎯",hint:"進出 / 風險"},
  ];

  return <div className="space-y-5">
    <div className="sticky top-0 z-40 -mx-5 mb-5 border-y border-cyan-400/20 bg-[#070b14]/95 px-5 py-3 shadow-xl shadow-cyan-500/10 backdrop-blur md:static md:top-auto md:z-auto md:mx-0 md:rounded-3xl md:border md:border-cyan-400/30 md:bg-slate-950/95 md:p-4">
      <div className="mb-3 hidden items-center justify-between md:flex">
        <div>
          <div className="text-xs font-black tracking-[0.3em] text-cyan-400">ANALYSIS MODULES</div>
          <div className="mt-1 text-lg font-black text-white">選擇要看的分析區塊</div>
        </div>
        <div className="text-sm text-slate-400">不用再一路往下滑</div>
      </div>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {tabs.map((tab)=><button key={tab.key} type="button" onClick={()=>setActiveTab(tab.key)} className={activeTab===tab.key?"rounded-2xl border border-cyan-300 bg-cyan-500 px-3 py-3 text-center font-black text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300/30 md:px-4 md:py-4":"rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 text-center font-bold text-slate-300 hover:border-cyan-400/60 hover:bg-slate-800 hover:text-cyan-200 md:px-4 md:py-4"}>
          <div className="text-xl md:text-2xl">{tab.icon}</div>
          <div className="mt-1 text-sm md:text-base">{tab.label}</div>
          <div className={activeTab===tab.key?"mt-1 block text-[10px] leading-tight text-cyan-50/90 md:text-xs":"mt-1 block text-[10px] leading-tight text-slate-500 md:text-xs"}>{tab.hint}</div>
        </button>)}
      </div>
    </div>

    <div className="space-y-4">
      {activeTab==="overview" && <>
        {data.scoreBreakdown && <Block title="總覽 / 綜合分數">
          <div className={`rounded-2xl border px-5 py-4 text-xl font-black ${getTrendStyle(data.scoreBreakdown.trend)}`}>
            {data.scoreBreakdown.verdict}｜{data.scoreBreakdown.finalScore} 分
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="技術面" value={`${data.scoreBreakdown.technical} 分`} trend={data.scoreBreakdown.technical>=65?"bull":data.scoreBreakdown.technical<=40?"bear":"neutral"} />
            <Metric label="籌碼面" value={`${data.scoreBreakdown.chip} 分`} trend={data.scoreBreakdown.chip>=65?"bull":data.scoreBreakdown.chip<=40?"bear":"neutral"} />
            <Metric label="基本面" value={`${data.scoreBreakdown.fundamental} 分`} trend={data.scoreBreakdown.fundamental>=65?"bull":data.scoreBreakdown.fundamental<=40?"bear":"neutral"} />
            <Metric label="題材面" value={`${data.scoreBreakdown.industry} 分`} trend={data.scoreBreakdown.industry>=65?"bull":data.scoreBreakdown.industry<=40?"bear":"neutral"} />
            <Metric label="討論區" value={`${data.scoreBreakdown.discussion} 分`} trend={data.scoreBreakdown.discussion>=65?"bull":data.scoreBreakdown.discussion<=40?"bear":"neutral"} />
            <Metric label="大盤" value={`${data.scoreBreakdown.market} 分`} trend={data.scoreBreakdown.market>=65?"bull":data.scoreBreakdown.market<=40?"bear":"neutral"} />
          </div>
          <ReasonList reasons={data.scoreBreakdown.reasons?.slice(0,4)||[]} />
        </Block>}

        <Block title="重要警報">
          <div className="space-y-3">
            {getAlert(data).slice(0,5).map((alert,index)=><AlertCard key={index} alert={alert} />)}
          </div>
        </Block>

        {data.dataQuality && <Block title="資料完整度">
          <div className={`rounded-2xl border px-5 py-4 text-xl font-black ${getTrendStyle(data.dataQuality.score>=80?"bull":data.dataQuality.score>=55?"warning":"bear")}`}>
            {data.dataQuality.score}%｜{data.dataQuality.level}
          </div>
          <div className="mt-3 text-sm text-slate-400">{data.dataQuality.okCount} / {data.dataQuality.totalCount} 個資料模組有回傳</div>
          {data.dataQuality.warnings?.length>0 && <ReasonList reasons={data.dataQuality.warnings.slice(0,4)} />}
        </Block>}

        {scanResults.length>0 && <Block title="自選股掃描結果">
          <div className="space-y-3">
            {scanResults.slice(0,5).map((item,index)=><button key={item.symbol} type="button" onClick={()=>setData(item)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-left">
              <div className="text-xs text-slate-500">排名 #{index+1}</div>
              <div className="mt-1 text-xl font-black">{item.quote.name} {item.symbol}</div>
              <div className={item.ai.trend==="bull"?"mt-1 font-black text-emerald-400":item.ai.trend==="bear"?"mt-1 font-black text-red-400":"mt-1 font-black text-amber-400"}>{item.ai.verdict}｜{item.ai.score} 分</div>
            </button>)}
          </div>
        </Block>}
      </>}

      {activeTab==="tech" && <>
        <Block title="K線圖"><CandlestickChart data={data.chartData||[]} /></Block>
        {data.patternAnalysis && <Block title="K線型態">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.patternAnalysis.trend)}`}>{data.patternAnalysis.signal}</div>
          <div className="mt-4 flex flex-wrap gap-2">{data.patternAnalysis.patterns.map((item,index)=><span key={index} className={`rounded-full border px-3 py-1 text-sm font-bold ${getTrendStyle(data.patternAnalysis?.trend)}`}>{item}</span>)}</div>
          <ReasonList reasons={data.patternAnalysis.reasons?.slice(0,4)||[]} />
        </Block>}
        {data.volumeAnalysis && <Block title="成交量">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.volumeAnalysis.trend)}`}>{data.volumeAnalysis.signal}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="今日量" value={formatVolumeLots(data.volumeAnalysis.latestVolume)} />
            <Metric label="20日量比" value={formatRatio(data.volumeAnalysis.volumeRatio20)} trend={data.volumeAnalysis.volumeRatio20&&data.volumeAnalysis.volumeRatio20>=1.5?"bull":"neutral"} />
            <Metric label="5日量比" value={formatRatio(data.volumeAnalysis.volumeRatio5)} trend={data.volumeAnalysis.volumeRatio5&&data.volumeAnalysis.volumeRatio5>=1.3?"bull":"neutral"} />
            <Metric label="價格變動" value={formatPercent(data.volumeAnalysis.priceChangePercent)} trend={data.volumeAnalysis.priceChangePercent>=0?"bull":"bear"} />
          </div>
          <ReasonList reasons={data.volumeAnalysis.reasons?.slice(0,4)||[]} />
        </Block>}
        {data.supportResistance && <Block title="支撐壓力">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.supportResistance.trend)}`}>{data.supportResistance.signal}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="20日壓力" value={formatNumber(data.supportResistance.high20)} />
            <Metric label="20日支撐" value={formatNumber(data.supportResistance.low20)} />
            <Metric label="60日壓力" value={formatNumber(data.supportResistance.high60)} />
            <Metric label="60日支撐" value={formatNumber(data.supportResistance.low60)} />
          </div>
          <ReasonList reasons={data.supportResistance.reasons?.slice(0,4)||[]} />
        </Block>}
        <Block title="技術指標">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="RSI 14" value={formatTech(data.technical.rsi14)} />
            <Metric label="KD" value={formatTech(data.technical.kd)} />
            <Metric label="MA5" value={formatTech(data.technical.ma5)} />
            <Metric label="MA20" value={formatTech(data.technical.ma20)} />
            <Metric label="MA60" value={formatTech(data.technical.ma60)} />
            <Metric label="MACD" value={formatTech(data.technical.macd)} trend={isNumberValue(data.technical.macd)&&Number(data.technical.macd)>=0?"bull":"bear"} />
          </div>
        </Block>
      </>}

      {activeTab==="chip" && <>
        {data.chipAnalysis ? <Block title="籌碼面">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.chipAnalysis.trend)}`}>籌碼：{data.chipAnalysis.verdict}｜{data.chipAnalysis.score} 分</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="外資" value={formatSharesToLots(data.chipAnalysis.institutional.foreignNetBuy)} trend={data.chipAnalysis.institutional.foreignNetBuy>=0?"bull":"bear"} />
            <Metric label="投信" value={formatSharesToLots(data.chipAnalysis.institutional.investmentTrustNetBuy)} trend={data.chipAnalysis.institutional.investmentTrustNetBuy>=0?"bull":"bear"} />
            <Metric label="三大法人" value={formatSharesToLots(data.chipAnalysis.institutional.totalNetBuy)} trend={data.chipAnalysis.institutional.totalNetBuy>=0?"bull":"bear"} />
            <Metric label="5日法人" value={formatSharesToLots(data.chipAnalysis.institutional.fiveDayNetBuy)} trend={data.chipAnalysis.institutional.fiveDayNetBuy>=0?"bull":"bear"} />
            <Metric label="外資連買賣" value={data.chipAnalysis.institutional.foreignStreak?.label || "資料不足"} />
            <Metric label="投信連買賣" value={data.chipAnalysis.institutional.investmentTrustStreak?.label || "資料不足"} />
            <Metric label="融資餘額" value={formatSharesToLots(data.chipAnalysis.margin.marginBalance)} />
            <Metric label="融券餘額" value={formatSharesToLots(data.chipAnalysis.margin.shortBalance)} />
          </div>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5 leading-7 text-slate-200">{data.chipAnalysis.summary}</div>
          <ReasonList reasons={[...(data.chipAnalysis.institutional.reasons||[]),...(data.chipAnalysis.margin.reasons||[])].slice(0,6)} />
        </Block> : <EmptyMobileBlock title="籌碼面" />}
      </>}

      {activeTab==="theme" && <>
        {data.industryThemeAnalysis && <Block title="產業題材">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.industryThemeAnalysis.trend)}`}>{data.industryThemeAnalysis.verdict}｜{data.industryThemeAnalysis.score} 分</div>
          <div className="mt-4 flex flex-wrap gap-2">{data.industryThemeAnalysis.themes?.map((item,index)=><span key={index} className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-sm font-bold text-purple-300">{item}</span>)}</div>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5 leading-7 text-slate-200">{data.industryThemeAnalysis.summary}</div>
        </Block>}
        {data.discussionSentiment && <Block title="公開討論區風向">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(getDiscussionTrend(data.discussionSentiment.overall))}`}>{data.discussionSentiment.overall}｜{data.discussionSentiment.score} 分</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="看多" value={`${data.discussionSentiment.bullishPercent}%`} trend="bull" />
            <Metric label="中立" value={`${data.discussionSentiment.neutralPercent}%`} trend="neutral" />
            <Metric label="看空" value={`${data.discussionSentiment.bearishPercent}%`} trend="bear" />
          </div>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5 leading-7 text-slate-200">{data.discussionSentiment.summary || "目前公開討論資料不足。"}</div>
        </Block>}
        {data.marketEnvironment && <Block title="大盤環境">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.marketEnvironment.trend)}`}>{data.marketEnvironment.verdict}｜{data.marketEnvironment.score} 分</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="大盤收盤" value={formatPrice(data.marketEnvironment.close)} />
            <Metric label="漲跌幅" value={formatPercent(data.marketEnvironment.changePercent)} trend={data.marketEnvironment.changePercent!==null&&data.marketEnvironment.changePercent>=0?"bull":"bear"} />
            <Metric label="MA20" value={formatTech(data.marketEnvironment.ma20)} />
            <Metric label="RSI" value={formatTech(data.marketEnvironment.rsi14)} />
          </div>
          <ReasonList reasons={data.marketEnvironment.reasons?.slice(0,4)||[]} />
        </Block>}
      </>}

      {activeTab==="fund" && <>
        {data.fundamentalAnalysis ? <Block title="基本面財報">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.fundamentalAnalysis.trend)}`}>{data.fundamentalAnalysis.verdict}｜{data.fundamentalAnalysis.score} 分</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="月營收" value={formatRevenue(data.fundamentalAnalysis.monthlyRevenue)} />
            <Metric label="營收年增" value={formatPercent(data.fundamentalAnalysis.monthlyRevenueYoY)} trend={data.fundamentalAnalysis.monthlyRevenueYoY!==null&&data.fundamentalAnalysis.monthlyRevenueYoY>=0?"bull":"bear"} />
            <Metric label="營收月增" value={formatPercent(data.fundamentalAnalysis.monthlyRevenueMoM)} trend={data.fundamentalAnalysis.monthlyRevenueMoM!==null&&data.fundamentalAnalysis.monthlyRevenueMoM>=0?"bull":"bear"} />
            <Metric label="EPS" value={formatTech(data.fundamentalAnalysis.eps)} trend={data.fundamentalAnalysis.eps!==null&&data.fundamentalAnalysis.eps>=0?"bull":"bear"} />
            <Metric label="毛利率" value={formatPercent(data.fundamentalAnalysis.grossMargin)} />
            <Metric label="淨利率" value={formatPercent(data.fundamentalAnalysis.netProfitMargin)} />
          </div>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5 leading-7 text-slate-200">{data.fundamentalAnalysis.summary}</div>
          <ReasonList reasons={data.fundamentalAnalysis.reasons?.slice(0,5)||[]} />
        </Block> : <EmptyMobileBlock title="基本面財報" message={getFundamentalEmptyMessage(data)} />}
      </>}

      {activeTab==="strategy" && <>
        {data.strategyProfile && <Block title="短線 / 波段 / 長期">
          <div className="mb-4 rounded-2xl border border-cyan-400/30 bg-slate-950 p-5 leading-7 text-slate-200">{data.strategyProfile.summary}</div>
          <div className="space-y-3">
            <StrategyCard title="短線" item={data.strategyProfile.shortTerm} />
            <StrategyCard title="波段" item={data.strategyProfile.swing} />
            <StrategyCard title="長期" item={data.strategyProfile.longTerm} />
          </div>
        </Block>}
        {data.tradePlan && <Block title="AI 進場策略">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(data.ai.trend)}`}>{data.tradePlan.stance}</div>
          <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-slate-950 p-5 leading-7 text-slate-200">{data.tradePlan.action}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="觀察下緣" value={formatPrice(data.tradePlan.observationZone.low)} />
            <Metric label="觀察上緣" value={formatPrice(data.tradePlan.observationZone.high)} />
            <Metric label="拉回下緣" value={formatPrice(data.tradePlan.pullbackZone.low)} />
            <Metric label="拉回上緣" value={formatPrice(data.tradePlan.pullbackZone.high)} />
            <Metric label="突破確認" value={formatPrice(data.tradePlan.breakoutPrice)} trend="bull" />
            <Metric label="停損參考" value={formatPrice(data.tradePlan.stopLossPrice)} trend="bear" />
          </div>
        </Block>}
        {data.chaseRisk && <Block title="追高風險">
          <div className={`rounded-2xl border px-5 py-3 text-xl font-black ${getTrendStyle(getRiskTrend(data.chaseRisk.score))}`}>{data.chaseRisk.score} 分｜{data.chaseRisk.level}</div>
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-slate-950 p-5 leading-7 text-slate-200">{data.chaseRisk.suggestion}</div>
          <ReasonList reasons={data.chaseRisk.reasons?.slice(0,5)||[]} />
        </Block>}
        <button type="button" onClick={()=>copyReport(data)} className="w-full rounded-2xl bg-cyan-500 py-4 font-black text-white">複製完整分析報告</button>
      </>}
    </div>
  </div>
}

function EmptyMobileBlock({title,message}:{title:string;message?:string}){
  return <Block title={title}><div className="rounded-2xl border border-slate-700 bg-slate-950 p-6 text-center leading-7 text-slate-400">{message || "目前沒有足夠資料"}</div></Block>
}

function StrategyCard({title,item}:{title:string;item:{verdict:string;score:number;action:string;reasons:string[]}}){
  const trend:Trend=item.score>=70?"bull":item.score<=42?"bear":"warning";
  return <div className={`rounded-2xl border p-5 ${getTrendStyle(trend)}`}>
    <div className="mb-2 text-sm font-bold tracking-widest opacity-80">{title}</div>
    <div className="text-2xl font-black">{item.verdict}｜{item.score}</div>
    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm leading-6 text-slate-200">{item.action}</div>
    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
      {item.reasons.map((reason,index)=><div key={index}>• {reason}</div>)}
    </div>
  </div>
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
function StatusRow({label,value,valueClassName}:{label:string;value:string;valueClassName?:string}){return <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">{label}</span><span className={`font-bold ${valueClassName || "text-slate-200"}`}>{value}</span></div>}
