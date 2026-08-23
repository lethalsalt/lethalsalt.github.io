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
    master.gain.value = 0.16;
    master.connect(ctx.destination);

    const buzz = (freq, type, gain) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(master);
      o.start();
      this.nodes.push(o, g);
    };
    buzz(73.42, "sawtooth", 0.04);
    buzz(110, "sawtooth", 0.03);

    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    const noise = (when, dur, gain, hipass) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = hipass;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(when);
      src.stop(when + dur);
    };

    const eight = (when, startF, endF) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(startF, when);
      o.frequency.exponentialRampToValueAtTime(endF, when + 0.35);
      g.gain.setValueAtTime(0.7, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.55);
      o.connect(g);
      g.connect(master);
      o.start(when);
      o.stop(when + 0.56);
    };

    const snare = (when) => {
      noise(when, 0.16, 0.22, 1800);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 190;
      g.gain.setValueAtTime(0.12, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
      o.connect(g);
      g.connect(master);
      o.start(when);
      o.stop(when + 0.13);
    };

    const hat = (when, open) => {
      noise(when, open ? 0.12 : 0.035, open ? 0.07 : 0.045, open ? 6000 : 9000);
    };

    const pipe = (when, freq, len) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.value = freq;
      lfo.frequency.value = 6;
      lfoG.gain.value = 7;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.045, when + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, when + len);
      o.connect(g);
      g.connect(master);
      o.start(when);
      lfo.start(when);
      o.stop(when + len);
      lfo.stop(when + len);
    };

    const bpm = 140;
    const step = 60 / bpm / 4;
    const melody = [293.66, 349.23, 392, 440, 392, 349.23, 293.66, 220];
    let i = 0;
    const schedule = () => {
      if (!this.on || !this.ctx) return;
      const t = ctx.currentTime + 0.05;
      const s = i % 16;
      hat(t, s === 14);
      if (s === 0 || s === 3 || s === 8 || s === 11) eight(t, s === 3 || s === 11 ? 55 : 82, 32);
      if (s === 8) snare(t);
      if (s === 12) hat(t + step * 0.5, true);
      if (s % 2 === 0) pipe(t, melody[(Math.floor(i / 2) % melody.length)], step * 2.1);
      i += 1;
    };
    schedule();
    this.timer = setInterval(schedule, step * 1000);
    this.on = true;
    if (audioBtn) audioBtn.textContent = "[ BRAVE TRAP: ON ]";
  },
  stop() {
    this.on = false;
    clearInterval(this.timer);
    this.nodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    this.nodes = [];
    if (this.ctx) this.ctx.close();
    this.ctx = null;
    if (audioBtn) audioBtn.textContent = "[ BRAVE TRAP: OFF ]";
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

