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

const audioBtn = document.getElementById("audio-btn");
const theme = {
  ctx: null,
  on: false,
  nodes: [],
  start() {
    if (this.on) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.11;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    master.connect(filter);
    filter.connect(ctx.destination);

    const drone = (freq, type, gain) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(master);
      o.start();
      this.nodes.push(o);
    };
    drone(73.42, "sawtooth", 0.07);
    drone(110, "square", 0.03);
    drone(146.83, "sawtooth", 0.04);
    drone(220, "triangle", 0.02);

    const pipe = ctx.createOscillator();
    const pipeG = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    pipe.type = "sawtooth";
    pipe.frequency.value = 392;
    lfo.frequency.value = 5.5;
    lfoG.gain.value = 8;
    lfo.connect(lfoG);
    lfoG.connect(pipe.frequency);
    pipeG.gain.value = 0.035;
    pipe.connect(pipeG);
    pipeG.connect(master);
    pipe.start();
    lfo.start();
    this.nodes.push(pipe, lfo);

    const kick = () => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(90, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.5, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + 0.23);
    };
    const clang = () => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 180 + Math.random() * 40;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + 0.42);
    };
    let beat = 0;
    this.timer = setInterval(() => {
      if (!this.on) return;
      kick();
      if (beat % 4 === 2) clang();
      beat += 1;
    }, 520);
    this.on = true;
    if (audioBtn) audioBtn.textContent = "[ AUDIO: ON ]";
  },
  stop() {
    this.on = false;
    clearInterval(this.timer);
    this.nodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    this.nodes = [];
    if (this.ctx) this.ctx.close();
    this.ctx = null;
    if (audioBtn) audioBtn.textContent = "[ AUDIO: OFF ]";
  },
  toggle() {
    if (this.on) this.stop();
    else this.start();
  },
};

audioBtn?.addEventListener("click", () => theme.toggle());
document.addEventListener("keydown", (event) => {
  if (event.key === "m" || event.key === "M") theme.toggle();
});

