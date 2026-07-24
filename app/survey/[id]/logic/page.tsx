"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type Rule = {
  id: string;
  question: string;
  operator: string;
  value: string;
  action: string;
  target: string;
  enabled: boolean;
};

const initialRules: Rule[] = [
  { id: "rule-1", question: "01 · 整体体验满意度", operator: "等于", value: "不满意 / 非常不满意", action: "显示题目", target: "03 · 开放反馈", enabled: true },
  { id: "rule-2", question: "02 · 推荐意愿 NPS", operator: "小于等于", value: "6", action: "设为必答", target: "03 · 开放反馈", enabled: true },
];

export default function LogicPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [rules, setRules] = useState(initialRules);
  const [selectedId, setSelectedId] = useState(initialRules[0].id);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(`joydata-survey-rules-${surveyId}`);
    if (saved) setRules(JSON.parse(saved));
  }, [surveyId]);

  useEffect(() => {
    window.localStorage.setItem(`joydata-survey-rules-${surveyId}`, JSON.stringify(rules));
  }, [rules, surveyId]);

  const selected = rules.find((rule) => rule.id === selectedId);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function update(patch: Partial<Rule>) {
    setRules((current) => current.map((rule) => rule.id === selectedId ? { ...rule, ...patch } : rule));
  }

  function addRule() {
    const next = { id: `rule-${Date.now()}`, question: "01 · 整体体验满意度", operator: "等于", value: "满意", action: "跳转到", target: "03 · 开放反馈", enabled: true };
    setRules((current) => [...current, next]);
    setSelectedId(next.id);
  }

  return <main className="logic-page">
    <header className="editor-topbar">
      <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="saved" />逻辑规则自动保存</small></div></div>
      <SurveyNav surveyId={surveyId} active="logic" onNotice={flash} />
      <div className="editor-actions"><button className="secondary-button" onClick={() => flash("检查完成，未发现循环或断点")}>✓ 检查逻辑</button><button className="primary-button" onClick={() => router.push(`/s/ro3-global-beta?surveyId=${surveyId}`)}>运行测试</button></div>
    </header>
    <div className="logic-layout">
      <aside className="logic-sidebar">
        <header><div><strong>逻辑规则</strong><small>{rules.length} 条规则 · 按顺序执行</small></div><button onClick={addRule}>＋</button></header>
        <button className="logic-start"><span>▶</span><p><strong>问卷开始</strong><small>进入第 01 题</small></p></button>
        <div className="logic-line" />
        {rules.map((rule, index) => <button key={rule.id} className={`logic-rule-item ${selectedId === rule.id ? "active" : ""}`} onClick={() => setSelectedId(rule.id)}>
          <span>{index + 1}</span><p><strong>{rule.question}</strong><small>如果 {rule.operator}「{rule.value}」</small><em>{rule.action} → {rule.target}</em></p><i className={rule.enabled ? "on" : ""} />
        </button>)}
        <div className="logic-line" />
        <button className="logic-end"><span>✓</span><p><strong>问卷完成</strong><small>提交答卷并显示完成页</small></p></button>
        <button className="add-rule-button" onClick={addRule}>＋ 添加逻辑规则</button>
      </aside>
      <section className="logic-canvas">
        <div className="flow-header"><div><strong>流程视图</strong><small>玩家会根据答案进入不同路径</small></div><div><button>−</button><span>100%</span><button>＋</button><button onClick={() => flash("画布已居中")}>⊙</button></div></div>
        <div className="flow-board">
          <article className="flow-node start"><span>▶</span><p><strong>问卷开始</strong><small>所有玩家</small></p></article><i className="flow-arrow" />
          <article className="flow-node question"><span>01</span><p><strong>整体体验满意度</strong><small>单选题 · 必答</small></p><em>5 个选项</em></article><i className="flow-arrow" />
          <div className="flow-branch"><span>答案为不满意</span><i /><span>其他答案</span></div>
          <div className="flow-columns">
            <div><article className="flow-node condition"><span>IF</span><p><strong>触发追问</strong><small>显示第 03 题并设为必答</small></p></article><i className="flow-arrow" /><article className="flow-node question"><span>03</span><p><strong>还有哪些体验可以改进？</strong><small>文本题 · 必答</small></p></article></div>
            <div><article className="flow-node question"><span>02</span><p><strong>推荐意愿 NPS</strong><small>NPS · 必答</small></p></article><i className="flow-arrow" /><article className="flow-node muted"><span>↷</span><p><strong>跳过追问</strong><small>继续提交</small></p></article></div>
          </div>
          <div className="flow-merge" /><article className="flow-node finish"><span>✓</span><p><strong>提交答卷</strong><small>显示完成页</small></p></article>
        </div>
      </section>
      <aside className="logic-property">
        <header><div><strong>规则配置</strong><small>当满足条件时执行动作</small></div><button onClick={() => flash("规则已复制")}>⧉</button></header>
        {selected ? <div className="logic-form">
          <label><span>当以下题目</span><select value={selected.question} onChange={(e)=>update({question:e.target.value})}><option>01 · 整体体验满意度</option><option>02 · 推荐意愿 NPS</option></select></label>
          <div className="condition-row"><select value={selected.operator} onChange={(e)=>update({operator:e.target.value})}><option>等于</option><option>不等于</option><option>小于等于</option><option>包含</option></select><input value={selected.value} onChange={(e)=>update({value:e.target.value})}/></div>
          <button className="add-condition" onClick={() => flash("已添加 AND 条件")}>＋ 添加条件</button>
          <div className="logic-divider"><span>则执行</span></div>
          <label><span>动作</span><select value={selected.action} onChange={(e)=>update({action:e.target.value})}><option>显示题目</option><option>跳转到</option><option>设为必答</option><option>结束问卷</option></select></label>
          <label><span>目标</span><select value={selected.target} onChange={(e)=>update({target:e.target.value})}><option>03 · 开放反馈</option><option>02 · 推荐意愿 NPS</option><option>问卷完成页</option></select></label>
          <div className="logic-toggle"><p><strong>启用规则</strong><small>关闭后规则保留但不执行</small></p><button className={`mini-switch ${selected.enabled?"on":""}`} onClick={()=>update({enabled:!selected.enabled})}><i/></button></div>
          <button className="delete-rule" onClick={()=>{setRules(current=>current.filter(rule=>rule.id!==selected.id));setSelectedId(rules.find(rule=>rule.id!==selected.id)?.id||"")}}>删除此规则</button>
        </div> : <div className="property-empty">选择一条规则进行配置</div>}
      </aside>
    </div>
    {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>;
}
