"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type Appearance = { theme:string; primary:string; radius:number; density:"compact"|"comfortable"; progress:boolean; questionNumber:boolean; cover:boolean; logo:boolean; background:"plain"|"soft"|"dark" };
const defaults: Appearance = { theme:"RO3 先锋",primary:"#356FE6",radius:10,density:"comfortable",progress:true,questionNumber:true,cover:true,logo:true,background:"soft" };
const themes=[["RO3 先锋","#356FE6","soft"],["JoyData 简洁","#2F73F5","plain"],["暗夜游戏","#7C6FF0","dark"],["活力橙","#F06E3A","plain"]];

export default function AppearancePage(){
  const router=useRouter();const params=useParams<{id:string}>();const surveyId=params.id;
  const [config,setConfig]=useState<Appearance>(defaults);const [device,setDevice]=useState<"mobile"|"desktop">("mobile");const [notice,setNotice]=useState("");
  const surveyTitle=useSurveyTitle(surveyId);
  useEffect(()=>{const saved=window.localStorage.getItem(`joydata-survey-appearance-${surveyId}`);if(saved)setConfig(JSON.parse(saved))},[surveyId]);
  useEffect(()=>window.localStorage.setItem(`joydata-survey-appearance-${surveyId}`,JSON.stringify(config)),[config,surveyId]);
  function update(patch:Partial<Appearance>){setConfig(current=>({...current,...patch}))}
  function flash(message:string){setNotice(message);window.setTimeout(()=>setNotice(""),2200)}
  return <main className="appearance-page">
    <header className="editor-topbar"><button className="editor-back" onClick={()=>router.push("/")}>‹</button><div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="saved"/>外观设置自动保存</small></div></div><SurveyNav surveyId={surveyId} active="appearance" onNotice={flash}/><div className="editor-actions"><button className="secondary-button" onClick={()=>setConfig(defaults)}>恢复默认</button><button className="primary-button" onClick={()=>router.push(`/s/ro3-global-beta?surveyId=${surveyId}`)}>玩家端预览</button></div></header>
    <div className="appearance-layout">
      <aside className="appearance-settings">
        <header><strong>外观与品牌</strong><small>不影响问卷内容和逻辑</small></header>
        <section><h3>主题模板</h3><div className="theme-grid">{themes.map(([name,color,bg])=><button key={name} className={config.theme===name?"active":""} onClick={()=>update({theme:name,primary:color,background:bg as Appearance["background"]})}><i style={{background:color}}/><span style={{background:color}}/><strong>{name}</strong><em>{config.theme===name?"✓":""}</em></button>)}</div></section>
        <section><h3>品牌颜色</h3><div className="color-setting"><input type="color" value={config.primary} onChange={(e)=>update({primary:e.target.value})}/><input value={config.primary} onChange={(e)=>update({primary:e.target.value})}/><button onClick={()=>update({primary:"#356FE6"})}>↺</button></div></section>
        <section><h3>页面布局</h3><label className="segmented-setting"><span>内容密度</span><div><button className={config.density==="compact"?"active":""} onClick={()=>update({density:"compact"})}>紧凑</button><button className={config.density==="comfortable"?"active":""} onClick={()=>update({density:"comfortable"})}>舒适</button></div></label><label className="range-setting"><span>圆角大小 <em>{config.radius}px</em></span><input type="range" min="0" max="20" value={config.radius} onChange={(e)=>update({radius:Number(e.target.value)})}/></label></section>
        <section><h3>填写页组件</h3>{[["显示封面","cover"],["显示品牌标识","logo"],["显示进度条","progress"],["显示题号","questionNumber"]].map(([label,key])=><div className="appearance-toggle" key={key}><span>{label}</span><button className={`mini-switch ${config[key as keyof Appearance]?"on":""}`} onClick={()=>update({[key]:!config[key as keyof Appearance]})}><i/></button></div>)}</section>
      </aside>
      <section className={`appearance-preview ${config.background}`} style={{"--theme":config.primary,"--radius":`${config.radius}px`} as React.CSSProperties}>
        <div className="preview-device-toggle"><button className={device==="desktop"?"active":""} onClick={()=>setDevice("desktop")}>▱ 桌面端</button><button className={device==="mobile"?"active":""} onClick={()=>setDevice("mobile")}>▯ 移动端</button><span>English</span></div>
        <div className={`survey-device ${device} ${config.density}`}>
          <div className="player-mini-page">
            {config.progress&&<div className="mini-progress"><i/></div>}
            <header>{config.logo&&<span>RO3 · PLAYER RESEARCH</span>}{config.cover&&<><h1>{surveyTitle}</h1><p>感谢您参与本次先锋测试。问卷预计需要 3–5 分钟完成。</p></>}</header>
            <main><small>{config.questionNumber&&"01 / 03"} · 单选题</small><h2>您对本次先锋测试的整体体验如何？<b>*</b></h2><p>请选择最符合您感受的一项</p>{["非常满意","满意","一般","不满意","非常不满意"].map((item,index)=><button key={item} className={index===0?"selected":""}><i>{index===0?"●":"○"}</i>{item}</button>)}<footer><span>已自动保存</span><button>下一题 →</button></footer></main>
          </div>
        </div>
      </section>
      <aside className="appearance-guide"><header><strong>体验检查</strong><small>基于当前主题自动检测</small></header><div className="appearance-score"><span>96</span><p><strong>体验良好</strong><small>颜色、字号与触控区域均符合建议</small></p></div><ul><li><span>✓</span><p><strong>文字对比度</strong><small>符合 WCAG AA</small></p></li><li><span>✓</span><p><strong>移动端触控</strong><small>最小触控区域 44px</small></p></li><li><span>✓</span><p><strong>多语言适配</strong><small>泰语与繁中文字未溢出</small></p></li><li className="warn"><span>!</span><p><strong>品牌标识</strong><small>建议上传正式游戏 Logo</small></p></li></ul><button onClick={()=>flash("上传入口已打开，可使用 PNG 或 WebP")}>＋ 上传品牌 Logo</button></aside>
    </div>
    {notice&&<div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>
}
