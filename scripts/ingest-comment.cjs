const { readFileSync, writeFileSync } = require("fs");

const title = process.env.TITLE || "";
const body = (process.env.BODY || "").trim().slice(0, 400);
const path = "comments.json";
const data = JSON.parse(readFileSync(path, "utf8"));
if (!Array.isArray(data.comments)) data.comments = [];

const m = title.match(/^\[COMMENT\]\s*(.+)$/i);
const name = (m ? m[1] : "ANON").slice(0, 24).replace(/[<>]/g, "");
if (!body) process.exit(0);

data.comments.push({
  name: name || "ANON",
  anon: /^ANON/i.test(name),
  text: body,
  ts: Date.now(),
});
if (data.comments.length > 200) data.comments = data.comments.slice(-200);
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
