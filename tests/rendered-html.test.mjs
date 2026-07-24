import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the JoyData survey workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>JoyData 问卷工作台<\/title>/);
  assert.match(html, /问卷工作台/);
  assert.match(html, /海外.*工作空间/s);
  assert.match(html, /创建问卷/);
  assert.match(html, /RO3 先锋测试玩家体验调研/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("exposes the core survey management controls", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /搜索问卷名称或游戏/);
  assert.match(html, /收集中/);
  assert.match(html, /草稿/);
  assert.match(html, /覆盖语言/);
  assert.match(html, /模板中心/);
  assert.match(html, /用研中心/);
});
