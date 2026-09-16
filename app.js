const $ = (id) => document.getElementById(id);
const el = { tabs: $("tabs"), body: $("taskBody"), prompt: $("prompt"), kicker: $("taskKicker"),
  status: $("status"), party: $("party"), keys: $("keys"), pad: document.querySelector(".pad"),
  btnNew: $("btnNew"), btnHint: $("btnCheck") };

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const BEAD = ["#e8467c", "#3fa9dd", "#e0342a", "#ffffff", "#8cc63f", "#8a5a3b", "#f0c030", "#f2b878", "#a36fc4", "#3f63b0"];

/* једна трака перли; > 10 се приказује као ред од 10 + остатак */
function strip(n, color, opt) {
  const o = opt || {};
  const wrap = document.createElement("div");
  wrap.className = "strip" + (o.framed ? " framed" : "");
  const line = (k, col) => {
    const row = document.createElement("div");
    row.className = "beads";
    const h1 = document.createElement("span"); h1.className = "hook"; row.appendChild(h1);
    for (let i = 0; i < k; i++) {
      const b = document.createElement("span");
      b.className = "bead";
      b.style.background = col;
      b.style.animationDelay = (i * 25) + "ms";
      row.appendChild(b);
    }
    const h2 = document.createElement("span"); h2.className = "hook"; row.appendChild(h2);
    return row;
  };
  if (n > 10) {
    wrap.appendChild(line(10, o.tenColor || "#f2b878"));
    wrap.appendChild(line(n - 10, color));
  } else {
    wrap.appendChild(line(n, color));
  }
  return wrap;
}
const blank = () => { const b = document.createElement("div"); b.className = "box"; b.innerHTML = '<span class="dash">___</span>'; return b; };

/* ---------- мотор за задатке са упиcивањем броја ---------- */
function Blanks(done) {
  const items = [];
  let sel = -1;
  const api = {
    add(box, answer) {
      const i = items.length;
      box.dataset.idx = String(i);
      box.tabIndex = 0;
      box.addEventListener("click", () => api.select(i));
      items.push({ answer, box, ok: false });
      return box;
    },
    select(i) {
      if (!items[i] || items[i].ok) return;
      sel = i;
      items.forEach((it, k) => it.box.classList.toggle("sel", k === i && !it.ok));
    },
    nextOpen(from) {
      for (let k = 0; k < items.length; k++) {
        const i = (from + k + items.length) % items.length;
        if (!items[i].ok) return i;
      }
      return -1;
    },
    key(val) {
      if (sel < 0 || !items[sel] || items[sel].ok) {
        const i = api.nextOpen(sel < 0 ? 0 : sel);
        if (i < 0) return;
        api.select(i);
      }
      const cur = items[sel];
      if (val === cur.answer) {
        cur.ok = true;
        cur.box.textContent = String(val);
        cur.box.className = "box ok";
        const i = api.nextOpen(sel + 1);
        if (i >= 0) api.select(i); else { el.status.textContent = "Све тачно!"; done(); }
      } else {
        cur.box.textContent = String(val);
        cur.box.className = "box bad";
        setTimeout(() => {
          if (cur.ok) return;
          cur.box.innerHTML = '<span class="dash">___</span>';
          cur.box.className = "box sel";
        }, 620);
      }
      api.report();
    },
    at(i, val) { api.select(i); if (items[i] && !items[i].ok) api.key(val); },
    hint() { const i = api.nextOpen(sel); if (i < 0) return; api.select(i); api.key(items[i].answer); },
    report() { el.status.textContent = "Решено " + items.filter((i) => i.ok).length + " / " + items.length; },
    start() { api.select(api.nextOpen(0)); api.report(); }
  };
  return api;
}

/* ---------- мотор за задатке са бирањем (клик на тачан избор) ---------- */
function Choices(done) {
  let left = 0;
  const api = {
    watch(node, correct, onOk) {
      if (correct) left++;
      node.addEventListener("click", () => {
        if (node.classList.contains("ok")) return;
        if (correct) {
          node.classList.add("ok");
          if (onOk) onOk();
          left--;
          api.report();
          if (left === 0) { el.status.textContent = "Све тачно!"; done(); }
        } else {
          node.classList.add("bad");
          setTimeout(() => node.classList.remove("bad"), 560);
        }
      });
    },
    total: 0,
    report() { el.status.textContent = "Остало " + left; },
    start() { api.total = left; api.report(); }
  };
  return api;
}

/* ---------- 1 · перле до 10 ---------- */
const t1 = {
  tab: "1 · Перле до 10", kicker: "Бројеви до 10 · Активност 2", keys: 10,
  prompt: "Упиши број који одговара свакој од приказаних вредности перли.",
  build(root, done) {
    const api = Blanks(done);
    const nums = shuffle([1,2,3,4,5,6,7,8,9,10]);
    const colors = shuffle(BEAD.slice());
    const rows = document.createElement("div");
    rows.className = "rows two";
    nums.forEach((n, i) => {
      const row = document.createElement("div");
      row.className = "row";
      row.appendChild(strip(n, colors[i % colors.length]));
      row.appendChild(api.add(blank(), n));
      rows.appendChild(row);
    });
    root.appendChild(rows);
    api.start();
    return api;
  }
};

/* ---------- 2 · перле до 19 ---------- */
const t2 = {
  tab: "2 · Перле до 19", kicker: "Бројеви до 19 · Активност 5", keys: 19,
  prompt: "Поред сваке вредности перли упиши одговарајући број.",
  build(root, done) {
    const api = Blanks(done);
    const nums = shuffle([11,12,13,14,15,16,17,18,19]).slice(0, 6).concat(shuffle([7,8,9,10]).slice(0, 2));
    shuffle(nums);
    const colors = shuffle(BEAD.slice());
    const rows = document.createElement("div");
    rows.className = "rows two";
    nums.forEach((n, i) => {
      const row = document.createElement("div");
      row.className = "row";
      row.appendChild(strip(n, colors[i % colors.length], { framed: true }));
      row.appendChild(api.add(blank(), n));
      rows.appendChild(row);
    });
    root.appendChild(rows);
    api.start();
    return api;
  }
};

/* ---------- 3 · повежи траку са бројем ---------- */
const t3 = {
  tab: "3 · Повежи", kicker: "Бројеви до 19 · Активност 3", keys: 0,
  prompt: "Повежи сваку траку са перлама са одговарајућим бројем.",
  build(root, done) {
    const api = Choices(done);
    const nums = shuffle([1,3,9,12,15,16,17]).slice(0, 5);
    const colors = shuffle(BEAD.slice());
    const wrap = document.createElement("div");
    wrap.className = "match";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "wires");
    wrap.appendChild(svg);
    const colL = document.createElement("div"); colL.className = "mcol";
    const colR = document.createElement("div"); colR.className = "mcol right";
    wrap.appendChild(colL); wrap.appendChild(colR);

    let selStrip = null;
    const pairs = [];
    nums.forEach((n, i) => {
      const s = document.createElement("div");
      s.className = "mitem";
      s.appendChild(strip(n, colors[i % colors.length], { framed: true }));
      const dotL = document.createElement("span"); dotL.className = "dot"; s.appendChild(dotL);
      s.addEventListener("click", () => {
        if (s.classList.contains("done")) return;
        if (selStrip) selStrip.classList.remove("sel");
        selStrip = s; s.classList.add("sel");
      });
      colL.appendChild(s);
      pairs.push({ n, node: s, dot: dotL });
    });

    shuffle(nums.slice()).forEach((n) => {
      const b = document.createElement("div");
      b.className = "mitem num";
      const dotR = document.createElement("span"); dotR.className = "dot"; b.appendChild(dotR);
      const lab = document.createElement("span"); lab.className = "numlab"; lab.textContent = String(n);
      b.appendChild(lab);
      b.addEventListener("click", () => {
        if (b.classList.contains("done") || !selStrip) return;
        const p = pairs.find((x) => x.node === selStrip);
        if (p.n === n) {
          p.node.classList.remove("sel"); p.node.classList.add("done");
          b.classList.add("done");
          wire(p.dot, dotR);
          selStrip = null;
          left--; report();
          if (left === 0) { el.status.textContent = "Све тачно!"; done(); }
        } else {
          b.classList.add("bad");
          setTimeout(() => b.classList.remove("bad"), 560);
        }
      });
      colR.appendChild(b);
    });

    function wire(a, b) {
      const box = wrap.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", ra.left + ra.width / 2 - box.left);
      ln.setAttribute("y1", ra.top + ra.height / 2 - box.top);
      ln.setAttribute("x2", rb.left + rb.width / 2 - box.left);
      ln.setAttribute("y2", rb.top + rb.height / 2 - box.top);
      ln.setAttribute("stroke", "#2f8f6a");
      ln.setAttribute("stroke-width", "4");
      ln.setAttribute("stroke-linecap", "round");
      ln.setAttribute("class", "wire");
      svg.appendChild(ln);
    }

    let left = nums.length;
    const report = () => { el.status.textContent = "Повезано " + (nums.length - left) + " / " + nums.length; };
    report();
    root.appendChild(wrap);
    return { key() {}, at() {}, hint() {
      const p = pairs.find((x) => !x.node.classList.contains("done"));
      if (!p) return;
      const b = Array.from(colR.children).find((c) => !c.classList.contains("done") && c.querySelector(".numlab").textContent === String(p.n));
      if (!b) return;
      p.node.classList.add("done"); b.classList.add("done");
      wire(p.dot, b.querySelector(".dot"));
      left--; report();
      if (left === 0) { el.status.textContent = "Све тачно!"; done(); }
    } };
  }
};

/* ---------- 4 · заокружи тачан број ---------- */
const t4 = {
  tab: "4 · Заокружи", kicker: "Бројеви до 19 · Активност 4", keys: 0,
  prompt: "У сваком пољу изабери број који одговара приказаној вредности перли.",
  build(root, done) {
    const api = Choices(done);
    const wrap = document.createElement("div");
    wrap.className = "cards";
    const colors = shuffle(BEAD.slice());
    for (let r = 0; r < 4; r++) {
      const n = rnd(3, 19);
      const opts = shuffle([n, n === 19 ? 9 : n + rnd(1, 3), Math.max(1, n - rnd(2, 6))].map(Number));
      const card = document.createElement("div");
      card.className = "qcard";
      card.appendChild(strip(n, colors[r % colors.length], { framed: true }));
      const row = document.createElement("div");
      row.className = "opts";
      opts.forEach((v) => {
        const o = document.createElement("button");
        o.type = "button"; o.className = "opt"; o.textContent = String(v);
        api.watch(o, v === n);
        row.appendChild(o);
      });
      card.appendChild(row);
      wrap.appendChild(card);
    }
    root.appendChild(wrap);
    api.start();
    return { key() {}, at() {}, hint() {
      const card = Array.from(wrap.children).find((c) => !c.querySelector(".opt.ok"));
      if (card) card.querySelectorAll(".opt").forEach((o) => o.classList.add("blink"));
      setTimeout(() => wrap.querySelectorAll(".blink").forEach((o) => o.classList.remove("blink")), 900);
    } };
  }
};

/* ---------- 5 · спајање трака ---------- */
const t5 = {
  tab: "5 · Спајање", kicker: "Значење сабирања · Активност 6", keys: 0,
  prompt: "Изабери траку која је исте дужине као две спојене траке.",
  build(root, done) {
    const api = Choices(done);
    const wrap = document.createElement("div");
    wrap.className = "cards one";
    const colors = shuffle(BEAD.slice());
    for (let r = 0; r < 3; r++) {
      const a = rnd(1, 4), b = rnd(1, 4), s = a + b;
      const card = document.createElement("div");
      card.className = "qcard wide row";
      const eq = document.createElement("div");
      eq.className = "eqline";
      eq.appendChild(strip(a, colors[r]));
      const plus = document.createElement("span"); plus.className = "sign"; plus.textContent = "+";
      eq.appendChild(plus);
      eq.appendChild(strip(b, colors[(r + 3) % colors.length]));
      const is = document.createElement("span"); is.className = "sign"; is.textContent = "=";
      eq.appendChild(is);
      card.appendChild(eq);
      const row = document.createElement("div");
      row.className = "cands";
      shuffle([s, Math.max(1, s - rnd(1, 2)), Math.min(10, s + rnd(1, 2))]).forEach((v) => {
        const c = document.createElement("div");
        c.className = "cand";
        c.appendChild(strip(v, colors[(r + 6) % colors.length]));
        api.watch(c, v === s, () => {
          row.querySelectorAll(".cand").forEach((o) => { if (o !== c) o.classList.add("gone"); });
          row.classList.add("settled");
        });
        row.appendChild(c);
      });
      card.appendChild(row);
      wrap.appendChild(card);
    }
    root.appendChild(wrap);
    api.start();
    return { key() {}, at() {}, hint() {} };
  }
};

/* ---------- 6 · сабери и упиши резултат ---------- */
const t6 = {
  tab: "6 · Сабирање", kicker: "Значење сабирања · Активност 7", keys: 19,
  prompt: "Упиши резултат сабирања поред сваког пара трака.",
  build(root, done) {
    const api = Blanks(done);
    const rows = document.createElement("div");
    rows.className = "rows";
    const colors = shuffle(BEAD.slice());
    for (let r = 0; r < 6; r++) {
      const a = rnd(1, 9), b = rnd(1, 9);
      const row = document.createElement("div");
      row.className = "row eq";
      row.appendChild(strip(a, colors[r % colors.length]));
      const p = document.createElement("span"); p.className = "sign"; p.textContent = "+"; row.appendChild(p);
      row.appendChild(strip(b, colors[(r + 4) % colors.length]));
      const e = document.createElement("span"); e.className = "sign"; e.textContent = "="; row.appendChild(e);
      row.appendChild(api.add(blank(), a + b));
      rows.appendChild(row);
    }
    root.appendChild(rows);
    api.start();
    return api;
  }
};

/* ---------- 7 · напиши бројеве и сабери ---------- */
const t7 = {
  tab: "7 · Сабери", kicker: "Значење сабирања · Активност 8", keys: 19,
  prompt: "Напиши одговарајући број испод сваке траке, сабери, па упиши резултат.",
  build(root, done) {
    const api = Blanks(done);
    const rows = document.createElement("div");
    rows.className = "rows";
    const colors = shuffle(BEAD.slice());
    for (let r = 0; r < 4; r++) {
      const a = rnd(1, 9), b = rnd(1, 9);
      const row = document.createElement("div");
      row.className = "row sum";
      [[a, colors[r % colors.length]], [b, colors[(r + 5) % colors.length]]].forEach(([n, c], k) => {
        const cell = document.createElement("div");
        cell.className = "sumcell";
        cell.appendChild(strip(n, c));
        cell.appendChild(api.add(blank(), n));
        row.appendChild(cell);
        const sg = document.createElement("span"); sg.className = "sign"; sg.textContent = k === 0 ? "+" : "=";
        row.appendChild(sg);
      });
      const res = document.createElement("div");
      res.className = "sumcell";
      res.appendChild(api.add(blank(), a + b));
      row.appendChild(res);
      rows.appendChild(row);
    }
    root.appendChild(rows);
    api.start();
    return api;
  }
};

const TASKS = [t1, t2, t3, t4, t5, t6, t7];

/* ---------- окружење ---------- */
let active = 0, api = null, pending = "";

const CONF = ["#e8467c", "#3fa9dd", "#e0342a", "#8cc63f", "#f0c030", "#a36fc4", "#2f8f6a"];
let partyTimer = null;
function party(on) {
  clearTimeout(partyTimer);
  el.party.className = on ? "party on" : "party";
  el.party.innerHTML = "";
  if (!on) return;
  const word = "Браво!".split("").map((c, i) => '<span style="animation-delay:' + (i * 70) + 'ms">' + c + "</span>").join("");
  el.party.insertAdjacentHTML("beforeend",
    '<div class="badge"><span class="star">★</span><span class="word">' + word + '</span><span class="star">★</span></div>');
  for (let i = 0; i < 70; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = (Math.random() * 100) + "vw";
    c.style.background = CONF[i % CONF.length];
    c.style.animationDuration = (2.4 + Math.random() * 1.8) + "s";
    c.style.animationDelay = (Math.random() * 1.2) + "s";
    if (i % 3 === 0) c.style.borderRadius = "50%";
    el.party.appendChild(c);
  }
  partyTimer = setTimeout(() => party(false), 5000);
}

function buildKeys(max) {
  el.keys.innerHTML = "";
  el.pad.style.display = max ? "" : "none";
  el.pad.classList.toggle("tall", max > 10);
  if (!max) return;
  for (let n = 1; n <= max; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(n);
    b.addEventListener("pointerdown", (e) => startDrag(e, n));
    el.keys.appendChild(b);
  }
}

function load(i) {
  active = i;
  const t = TASKS[i];
  el.kicker.textContent = t.kicker;
  el.prompt.textContent = t.prompt;
  el.body.innerHTML = "";
  party(false);
  buildKeys(t.keys);
  api = t.build(el.body, () => party(true));
  Array.from(el.tabs.children).forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
}

TASKS.forEach((t, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = t.tab;
  b.addEventListener("click", () => load(i));
  el.tabs.appendChild(b);
});

/* превлачење бројева */
let drag = null;
function startDrag(e, n) {
  if (e.button) return;
  e.preventDefault();
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.textContent = String(n);
  document.body.appendChild(ghost);
  drag = { n, ghost, moved: false, over: null };
  move(e);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", drop);
  window.addEventListener("pointercancel", drop);
}
function boxUnder(e) {
  const t = document.elementFromPoint(e.clientX, e.clientY);
  const b = t && t.closest ? t.closest(".box") : null;
  return b && !b.classList.contains("ok") ? b : null;
}
function move(e) {
  if (!drag) return;
  drag.ghost.style.left = e.clientX + "px";
  drag.ghost.style.top = e.clientY + "px";
  if (Math.abs(e.movementX) || Math.abs(e.movementY)) drag.moved = true;
  const b = boxUnder(e);
  if (b !== drag.over) {
    if (drag.over) drag.over.classList.remove("over");
    if (b) b.classList.add("over");
    drag.over = b;
  }
}
function drop(e) {
  if (!drag) return;
  const b = boxUnder(e);
  if (drag.over) drag.over.classList.remove("over");
  drag.ghost.remove();
  window.removeEventListener("pointermove", move);
  window.removeEventListener("pointerup", drop);
  window.removeEventListener("pointercancel", drop);
  const n = drag.n, moved = drag.moved;
  drag = null;
  if (b && api) api.at(Number(b.dataset.idx), n);
  else if (!moved && api) api.key(n);
}

el.btnNew.addEventListener("click", () => load(active));
el.btnHint.textContent = "Помоћ";
el.btnHint.addEventListener("click", () => api && api.hint());

document.addEventListener("keydown", (e) => {
  if (!api) return;
  if (e.key >= "0" && e.key <= "9") {
    pending += e.key;
    const n = Number(pending);
    if (pending.length === 1 && n === 1) { setTimeout(() => { if (pending === "1") { api.key(1); pending = ""; } }, 600); return; }
    api.key(n > 19 ? Number(e.key) : n);
    pending = "";
  } else if (e.key === "Enter") api.hint();
});

load(0);
