const clock = document.getElementById("clock");
if (clock) {
  const tick = () => {
    const d = new Date();
    clock.textContent = d.toTimeString().slice(0, 8);
  };
  tick();
  setInterval(tick, 1000);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const boot = document.getElementById("boot");
const out = document.getElementById("boot-out");
const skipKey = "ls-t2-boot";

function hideBoot() {
  if (!boot) return;
  boot.hidden = true;
  sessionStorage.setItem(skipKey, "1");
}

function moviePinLines() {
  const lines = ["  PIN IDENTIFICATION PROGRAM", "", "12345678901234567890123457890123456780"];
  let width = 36;
  let flip = true;
  while (width > 4) {
    let row = "";
    for (let i = 0; i < 8; i += 1) {
      let n = "";
      for (let d = 0; d < width; d += 1) n += String(Math.floor(Math.random() * 10));
      row += n + (i % 2 ? "\n" : "  ");
    }
    lines.push(row.trimEnd());
    width -= flip ? 1 : 2;
    flip = !flip;
  }
  for (let i = 0; i < 8; i += 1) lines.push("9003  9003  9003  9003");
  lines.push("", "PIN = 9003", "TRANSACTION APPROVED", "DISPENSING  $300.00  GALLERIA ARCADE FUND", "", "LOGON: LETHAL_SALT");
  return lines.join("\n");
}

async function playBoot() {
  if (!boot || !out) return;
  if (sessionStorage.getItem(skipKey) || location.search.includes("nboot")) {
    hideBoot();
    return;
  }
  boot.hidden = false;
  const text = moviePinLines();
  out.textContent = "";
  for (let i = 0; i < text.length; i += 1) {
    if (boot.hidden) return;
    out.textContent += text[i];
    if (text[i] === "\n") await new Promise((r) => setTimeout(r, 40));
  }
  await new Promise((r) => setTimeout(r, 700));
  hideBoot();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === "Escape") hideBoot();
});
boot?.addEventListener("click", hideBoot);

playBoot();
