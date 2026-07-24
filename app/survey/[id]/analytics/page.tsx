"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SurveyNav } from "../survey-nav";

const trend = [312, 428, 506, 621, 708, 834, 927, 1086, 1218, 1286];
const countries = [["美国", 2486, 29.5], ["泰国", 1769, 21], ["中国台湾", 1138, 13.5], ["菲律宾", 842, 10], ["德国", 598, 7.1]];
const channels = [["Discord", 2738, 32.5], ["Facebook Ads", 2013, 23.9], ["Steam 社区", 1398, 16.6], ["Line 社群", 1052, 12.5], ["X / Twitter", 724, 8.6]];

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const [range, setRange] = useState("近 7 天");
  const [segment, setSegment] = useState("全部玩家");
  const [tab, setTab] = useState<"overview" | "questions">("overview");
  const [notice, setNotice] = useState("");
  const maxTrend = useMemo(() => Math.max(...trend), []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return <main className="insights-page analytics-page">
    <header className="editor-topbar">
      <button className="editor-back" onClick={() => router.push("/")}>‹</button>
      <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>RO3 先锋测试玩家体验调研</strong><small><i className="live-dot" />数据更新于 2 分钟前</small></div></div>
      <SurveyNav surveyId={surveyId} active="analytics" onNotice={flash} />
      <div className="editor-actions"><button className="secondary-button" onClick={() => flash("报告链接已复制，仅项目成员可访问")}>⌁ 分享报告</button><button className="primary-button" onClick={() => flash("分析报告正在生成 PDF")}>⇩ 导出报告</button></div>
    </header>

    <div className="analytics-toolbar">
      <div className="analysis-tabs"><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>概览</button><button className={tab === "questions" ? "active" : ""} onClick={() => setTab("questions")}>逐题分析</button></div>
      <div><select value={segment} onChange={(event) => setSegment(event.target.value)}><option>全部玩家</option><option>English 玩家</option><option>繁中玩家</option><option>泰语玩家</option><option>NPS 推荐者</option></select><select value={range} onChange={(event) => setRange(event.target.value)}><option>今日</option><option>近 7 天</option><option>近 30 天</option><option>自定义</option></select><button onClick={() => flash("筛选视图已保存")}>☆ 保存视图</button></div>
    </div>

    {tab === "overview" ? <section className="analytics-content">
      <div className="analytics-kpis">
        <article><span className="metric-icon blue">▤</span><p><small>有效答卷</small><strong>8,151</strong><em>↗ 14.2%</em></p><div className="micro-bars">{[30,45,38,58,54,71,66,86].map((height,i)=><i key={i} style={{height:`${height}%`}} />)}</div></article>
        <article><span className="metric-icon violet">◎</span><p><small>NPS</small><strong>42</strong><em>↗ 6</em></p><div className="nps-mini"><i style={{width:"19%"}}/><i style={{width:"20%"}}/><i style={{width:"61%"}}/></div></article>
        <article><span className="metric-icon green">✓</span><p><small>完成率</small><strong>82.4%</strong><em>↗ 2.8%</em></p><div className="ring-mini" style={{"--ring":"296deg"} as React.CSSProperties}><span>82%</span></div></article>
        <article><span className="metric-icon orange">◷</span><p><small>平均时长</small><strong>3m 42s</strong><em className="neutral">中位数 3m 18s</em></p><div className="duration-mini"><i/><i/><i/></div></article>
      </div>

      <div className="analytics-grid">
        <article className="analytics-card trend-card"><header><div><strong>答卷回收趋势</strong><small>有效答卷与全部提交</small></div><div><span><i className="blue-dot"/>有效答卷</span><span><i className="gray-dot"/>全部提交</span></div></header><div className="bar-trend">{trend.map((value,index)=><div key={value}><span style={{height:`${(value/maxTrend)*88}%`}}/><i style={{height:`${(value/maxTrend)*100}%`}}/><small>{index<3?`07/${15+index}`:index===9?"今天":""}</small></div>)}</div></article>
        <article className="analytics-card nps-card"><header><div><strong>NPS 构成</strong><small>基于 8,107 份有效评分</small></div></header><div className="nps-score"><div><strong>42</strong><span>NPS</span></div><p><span><i className="promoter"/>推荐者<strong>61%</strong></span><span><i className="passive"/>中立者<strong>20%</strong></span><span><i className="detractor"/>贬损者<strong>19%</strong></span></p></div><div className="nps-scale"><i style={{width:"19%"}}/><i style={{width:"20%"}}/><i style={{width:"61%"}}/></div><footer>海外游戏问卷基准：<strong>31</strong><span>高于基准 11</span></footer></article>
        <article className="analytics-card rank-card"><header><div><strong>国家/地区</strong><small>按有效答卷数量排序</small></div><button onClick={() => flash("已打开全部国家明细")}>查看全部</button></header><div>{countries.map(([name,count,percent],index)=><p key={String(name)}><b>{index+1}</b><span>{name}</span><i><em style={{width:`${Number(percent)*2.7}%`}}/></i><strong>{Number(count).toLocaleString()}</strong><small>{percent}%</small></p>)}</div></article>
        <article className="analytics-card rank-card"><header><div><strong>投放渠道</strong><small>渠道转化与答卷贡献</small></div><button onClick={() => flash("已打开渠道对比")}>渠道对比</button></header><div>{channels.map(([name,count,percent],index)=><p key={String(name)}><b>{index+1}</b><span>{name}</span><i><em className="purple" style={{width:`${Number(percent)*2.4}%`}}/></i><strong>{Number(count).toLocaleString()}</strong><small>{percent}%</small></p>)}</div></article>
        <article className="analytics-card language-card"><header><div><strong>语言表现</strong><small>完成率与体验指标对比</small></div></header><table><thead><tr><th>语言</th><th>有效答卷</th><th>完成率</th><th>NPS</th><th>平均时长</th></tr></thead><tbody><tr><td>English <span>默认</span></td><td>5,226</td><td><em>84.2%</em></td><td><strong>44</strong></td><td>3m 36s</td></tr><tr><td>繁體中文</td><td>1,632</td><td><em>81.7%</em></td><td><strong>48</strong></td><td>3m 51s</td></tr><tr><td>ไทย</td><td>1,293</td><td><em className="warning">76.8%</em></td><td><strong>33</strong></td><td>4m 02s</td></tr></tbody></table><footer><span>!</span><p><strong>泰语版本完成率偏低</strong><small>主要流失发生在第 2 题 NPS，建议检查翻译理解成本。</small></p><button onClick={() => router.push(`/survey/${surveyId}/languages`)}>检查翻译</button></footer></article>
      </div>
    </section> : <section className="question-analysis">
      <aside><strong>题目列表</strong><button className="active"><span>01</span><p>整体体验满意度<small>单选题 · 8,151 份</small></p></button><button><span>02</span><p>推荐意愿 NPS<small>NPS · 8,107 份</small></p></button><button><span>03</span><p>开放反馈<small>文本题 · 6,924 份</small></p></button></aside>
      <div className="question-report"><header><span>01 · 单选题</span><h2>您对本次先锋测试的整体体验如何？</h2><p>有效回答 8,151 · 跳过 0 · {segment}</p></header><div className="answer-distribution">{[["非常满意",38.6,3146],["满意",37.2,3032],["一般",16.4,1337],["不满意",5.9,481],["非常不满意",1.9,155]].map(([label,percent,count])=><div key={String(label)}><span>{label}</span><i><em style={{width:`${percent}%`}}/></i><strong>{percent}%</strong><small>{Number(count).toLocaleString()}</small></div>)}</div><div className="question-insight"><span>✦</span><p><strong>AI 结果解读</strong><small>75.8% 的玩家选择“满意”或“非常满意”。繁中玩家满意度最高（82.1%），泰语玩家相对较低（68.4%），建议结合开放反馈定位差异。</small></p><button onClick={() => flash("已生成按国家与渠道的交叉分析")}>交叉分析</button></div></div>
    </section>}
    {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>;
}
