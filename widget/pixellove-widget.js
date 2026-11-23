// PixelLove home-screen widget for iPhone (runs in the free Scriptable app).
// Setup: see SETUP.md → "Home-screen widget". The first time, run this script inside
// Scriptable to sign in. Your password is never saved: only a sign-in token, in the iPhone Keychain.

const API_KEY = "AIzaSyCeHZ1uv5AgcadsBHdESXUIrrlS-VHEPl8";   // same as apiKey in config.js
const PROJECT = "fishies-14ec2";                              // same as projectId in config.js
const APP_URL = "https://elmos-world.github.io/PixelLove/";   // tapping the widget opens this

const PINK = new Color("#ffd3e3"), BLUE = new Color("#cdeaff"), INK = new Color("#5a3d5c"),
      SOFT = new Color("#8a6f8c"), HOT = new Color("#ff6b8f"), ORANGE = new Color("#ff9a3c");
const MOOD = {sunny:"☀️ Sunny", partly:"🌤️ Partly sunny", cloudy:"☁️ Cloudy", rainy:"🌧️ Rainy", stormy:"⛈️ Stormy", rainbow:"🌈 Rainbow"};
const KC = "pixellove.refresh";
const DB = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

// ---------- sign-in ----------
async function post(url, body, form) {
  const r = new Request(url); r.method = "POST";
  r.headers = {"Content-Type": form ? "application/x-www-form-urlencoded" : "application/json"};
  r.body = form ? body : JSON.stringify(body);
  const j = await r.loadJSON();
  if (j.error) throw new Error(j.error.message || j.error);
  return j;
}
async function signInFresh() {
  const a = new Alert(); a.title = "Sign in to PixelLove";
  a.message = "Use the same email and password as the app. Only a sign-in token is kept, in your Keychain.";
  a.addTextField("Email"); a.addSecureTextField("Password"); a.addAction("Sign in"); a.addCancelAction("Cancel");
  if (await a.present() === -1) throw new Error("Not signed in");
  const j = await post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {email: a.textFieldValue(0).trim(), password: a.textFieldValue(1), returnSecureToken: true});
  Keychain.set(KC, j.refreshToken);
  return {token: j.idToken, uid: j.localId};
}
async function auth() {
  if (Keychain.contains(KC)) {
    try {
      const j = await post(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
        `grant_type=refresh_token&refresh_token=${encodeURIComponent(Keychain.get(KC))}`, true);
      Keychain.set(KC, j.refresh_token);
      return {token: j.id_token, uid: j.user_id};
    } catch (e) { if (config.runsInWidget) throw e; Keychain.remove(KC); }
  }
  if (config.runsInWidget) throw new Error("Open Scriptable and run PixelLove once to sign in");
  return signInFresh();
}

// ---------- Firestore ----------
function val(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) return fields(v.mapValue.fields);
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
  return null;
}
function fields(f) { const o = {}; for (const k in (f || {})) o[k] = val(f[k]); return o; }
async function get(path, A) {
  const r = new Request(`${DB}/${path}`); r.headers = {Authorization: `Bearer ${A.token}`};
  const j = await r.loadJSON();
  if (j.error) { if (j.error.code === 404) return null; throw new Error(j.error.message); }
  if (j.documents !== undefined || !j.name) {
    const out = {}; for (const d of (j.documents || [])) out[d.name.split("/").pop()] = fields(d.fields); return out;
  }
  return fields(j.fields);
}
async function latestNotes(A) {
  const r = new Request(`${DB}:runQuery`); r.method = "POST";
  r.headers = {Authorization: `Bearer ${A.token}`, "Content-Type": "application/json"};
  r.body = JSON.stringify({structuredQuery: {from: [{collectionId: "notes"}], orderBy: [{field: {fieldPath: "at"}, direction: "DESCENDING"}], limit: 15}});
  const j = await r.loadJSON();
  return (Array.isArray(j) ? j : []).filter(x => x.document).map(x => fields(x.document.fields));
}

// ---------- data ----------
async function load() {
  const A = await auth();
  const [settings, pet, moods, songs, nights, notes] = await Promise.all([
    get("shared/settings", A), get("shared/pet", A), get("moods", A), get("songs", A), get("nights", A), latestNotes(A)]);
  const s = settings || {}, me = A.uid;
  const seen = [...new Set([...Object.keys(moods || {}), ...Object.keys(songs || {}), ...Object.keys(nights || {})])];
  let a = s.sideA || "", b = s.sideB || "";
  if (!a && !b) { a = me; b = seen.find(x => x !== a) || ""; } else if (!a) a = seen.find(x => x !== b) || ""; else if (!b) b = seen.find(x => x !== a) || "";
  const other = me === b ? a : b, side = me === b ? "A" : "B";
  let name = s["name" + side] || "";
  if (other) { try { const p = await get(`profiles/${other}`, A); if (p && p.name) name = p.name; } catch (e) {} }
  return {s, pet, me, other, side: me === b ? "B" : "A", name: name || "Your person", tz: s["tz" + side] || null,
    mood: other && moods && moods[other], song: other && songs && songs[other], night: other && nights && nights[other],
    note: notes.find(n => n.by === other)};
}

// ---------- helpers ----------
const DAY = 864e5;
function midnight(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function countdown(s) {
  if (s.visit) {
    const d = Math.round((midnight(new Date(s.visit)) - midnight(new Date())) / DAY);
    if (d > 0) return {big: String(d), small: `day${d === 1 ? "" : "s"} until ${s.label || "we meet"}`};
    if (d === 0) return {big: "♥", small: "Together today!"};
  }
  if (s.since) {
    const d = Math.floor((midnight(new Date()) - midnight(new Date(s.since + "T00:00"))) / DAY);
    if (d >= 0) return {big: String(d), small: `day${d === 1 ? "" : "s"} together`};
  }
  return {big: "♥", small: "Add your next visit in Our details"};
}
function timeIn(tz) { try { return new Date().toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit", timeZone: tz || undefined}); } catch (e) { return ""; } }
function stat(pet, k, hrs) { const t = pet && pet[k + "At"]; return t ? Math.max(0, Math.round(100 - (Date.now() - t) / 36e5 * 100 / hrs)) : 0; }
function petLine(pet) {
  if (!pet) return "Hatch your pet fish in the app";
  const nm = pet.name || "Bubbles", f = stat(pet, "fed", 12), p = stat(pet, "played", 16), c = stat(pet, "cleaned", 48);
  return f < 25 ? `${nm} is hungry!` : c < 25 ? `${nm}'s bowl is murky` : p < 25 ? `${nm} is bored` : `${nm} is happy`;
}
const FISH = ["..........sss......", "........ssfffs.....", ".s....ssbbbbbbss...", "sfs..sbbbbbblbbbs..", ".sfssbbbbllllllbbs.", ".sffbbbbbllllewbbbs", ".sffbbbbbbbbbbebbbs", ".sffbbbbbbbbbpbbbbs", ".sffbbbbblbbbppbees", ".sfssbbbbbbffbbbbs.", "sfs..sbbbbbbbbbbs..", ".s....ssbbbbbbss...", "........ssssss....."];
function hex(c, d) { return /^#[0-9a-f]{6}$/i.test(c || "") ? c : d; }
function shade(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
function toHex(a) { return "#" + a.map(v => Math.round(v).toString(16).padStart(2, "0")).join(""); }
function mix(c, t, a) { const x = shade(c), y = shade(t); return new Color(toHex(x.map((v, i) => v * (1 - a) + y[i] * a))); }
function darker(c) { return new Color(toHex(shade(c).map(v => v * .72))); }
function drawFish(ctx, look, x, y, px, flip) {
  const b = hex(look && look.b, "#ff9a45"), f = hex(look && look.f, "#ffb36b");
  const col = {s: darker(b), f: new Color(f), b: new Color(b), l: mix(b, "#ffffff", .38), e: new Color("#2c2a4a"), w: Color.white(), p: new Color("#ff7fa6")};
  const W = FISH[0].length;
  FISH.forEach((r, j) => [...r].forEach((ch, i) => { if (!col[ch]) return; ctx.setFillColor(col[ch]);
    ctx.fillRect(new Rect(Math.round(x + (flip ? W - 1 - i : i) * px), Math.round(y + j * px), px, px)); }));
}
function pixHeart(ctx, x, y, px) {
  const H = [".hh.hh.", "hhhhhhh", "hhhhhhh", ".hhhhh.", "..hhh..", "...h..."];
  ctx.setFillColor(HOT); H.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === "h") ctx.fillRect(new Rect(Math.round(x + i * px), Math.round(y + j * px), px, px)); }));
}
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
// The water scene behind the widget: pixel water, bubbles, seaweed, sand and your two fish.
// Widgets can't animate, so the fish swim to a new spot at every refresh.
function scene(d, fam) {
  const [W, H] = {small: [158, 158], medium: [338, 158], large: [338, 354]}[fam] || [338, 158];
  const ctx = new DrawContext(); ctx.size = new Size(W, H); ctx.opaque = true; ctx.respectScreenScale = true;
  const top = shade("#ffd3e3"), bot = shade("#cdeaff"), bands = 8;
  for (let i = 0; i < bands; i++) { const a = i / (bands - 1);
    ctx.setFillColor(new Color(toHex(top.map((v, k) => v * (1 - a) + bot[k] * a))));
    ctx.fillRect(new Rect(0, Math.floor(i * H / bands), W, Math.ceil(H / bands) + 1)); }
  const r = rng(Math.floor(Date.now() / 9e5) + 7), px = fam === "small" ? 2 : 3, fw = FISH[0].length * px, fh = FISH.length * px;
  // fish area: along the top on small, the right side on medium, the lower half on large
  const [ax, ay, aw, ah] = fam === "small" ? [8, 8, W - 16, 30] : fam === "large" ? [16, H * .52, W - 32, H * .34] : [W * .6, 32, W * .37, H - 66];
  // sand and seaweed
  ctx.setFillColor(new Color("#ffe3b8")); ctx.fillRect(new Rect(0, H - 8, W, 8));
  ctx.setFillColor(new Color("#f5cf98")); for (let x = 4; x < W; x += 14) ctx.fillRect(new Rect(x, H - 6, 4, 2));
  ctx.setFillColor(new Color("#8fd6c0"));
  [[W - 16, 30], [W - 28, 20], [W - 40, 26]].slice(0, fam === "small" ? 2 : 3).forEach(([x, hgt], k) => {
    for (let y = 0; y < hgt; y += 4) ctx.fillRect(new Rect(x + ((y / 4 + k) % 2 ? 2 : 0), H - 12 - y, 3, 4)); });
  // where the fish are this time
  const room = Math.max(0, aw - fw * 2 - 6), xA = ax + r() * room, yA = ay + r() * Math.max(0, ah - fh);
  const close = r() < .45;
  const xB = close ? xA + fw + 2 + r() * 4 : xA + fw + 6 + r() * Math.max(0, ax + aw - fw - (xA + fw + 6));
  const yB = close ? Math.min(Math.max(ay, yA + (r() - .5) * 8), ay + ah - fh) : ay + r() * Math.max(0, ah - fh);
  drawFish(ctx, d.s.fishA, xA, yA, px, false);                       // P1 swims right
  drawFish(ctx, d.s.fishB, Math.min(xB, ax + aw - fw), yB, px, true); // P2 faces P1
  if (close) pixHeart(ctx, xA + fw - 3 * px, Math.min(yA, yB) - 7 * px, px);
  // bubbles
  ctx.setStrokeColor(new Color("#ffffff", .9)); ctx.setLineWidth(1.5);
  for (let i = 0; i < (fam === "small" ? 3 : 5); i++) { const br = 2 + r() * 3; ctx.strokeEllipse(new Rect(ax + r() * aw, ay + r() * ah, br * 2, br * 2)); }
  return ctx.getImage();
}
function fishImage() { // little pixel goldfish for the title
  const ctx = new DrawContext(); ctx.size = new Size(FISH[0].length * 2, FISH.length * 2); ctx.opaque = false; ctx.respectScreenScale = true;
  drawFish(ctx, null, 0, 0, 2, false); return ctx.getImage();
}
function text(stack, str, size, color, bold, lines) {
  const t = stack.addText(str); t.font = bold ? Font.boldMonospacedSystemFont(size) : Font.mediumRoundedSystemFont(size);
  t.textColor = color; t.lineLimit = lines || 1; t.minimumScaleFactor = 0.7; return t;
}

// ---------- widget ----------
function build(d, size) {
  const w = new ListWidget(), g = new LinearGradient();
  g.colors = [PINK, BLUE]; g.locations = [0, 1]; w.backgroundGradient = g;
  try { w.backgroundImage = scene(d, size); } catch (e) {}
  w.url = APP_URL; w.setPadding(12, 14, 12, 14);
  w.refreshAfterDate = new Date(Date.now() + 15 * 60e3);

  if (size === "small") w.addSpacer(30); // room for the fish swimming along the top
  else {
    const top = w.addStack(); top.centerAlignContent();
    const fish = top.addImage(fishImage()); fish.imageSize = new Size(19, 13);
    top.addSpacer(5); text(top, "PIXELLOVE", 11, HOT, true); top.addSpacer();
    if (d.tz) text(top, `${d.name} · ${timeIn(d.tz)}`, 11, SOFT, true);
    w.addSpacer(4);
  }
  // on medium, the words stay on the left so the fish get the right side
  let body = w;
  if (size === "medium") { const row = w.addStack(); body = row.addStack(); body.layoutVertically(); body.size = new Size(190, 0); row.addSpacer(); }

  const c = countdown(d.s), row = body.addStack(); row.bottomAlignContent();
  text(row, c.big, size === "small" ? 26 : 34, INK, true); row.addSpacer(6);
  const lab = row.addStack(); lab.layoutVertically(); text(lab, c.small, 12, INK, false, 2); lab.addSpacer(5);
  body.addSpacer(4);

  const mood = d.mood && MOOD[d.mood.mood];
  const nightNow = d.night && Date.now() - (d.night.at || 0) < 14 * 36e5;
  const status = !d.other ? "💞 Waiting for your person to join" : nightNow ? "💤 Said goodnight" : mood ? `${d.name}: ${mood}` : `${d.name} hasn't picked today's weather`;
  if (size === "small") {
    if (d.tz) text(body, `${d.name} · ${timeIn(d.tz)}`, 11, SOFT, true);
    text(body, !d.other ? "💞 Waiting for them" : nightNow ? "💤 Asleep" : mood || "No weather yet", 12, INK, false);
  } else {
    if (status) text(body, status, 12, INK, false);
    if (d.other) text(body, d.song && d.song.title ? `🎵 ${d.song.title}` : "🎵 No song yet", 12, d.song ? INK : SOFT, false);
    if (d.note && d.note.text) { const t = text(body, `💌 “${d.note.text}”`, 12, INK, false, size === "large" ? 4 : 2); t.font = Font.italicSystemFont(12); }
  }
  w.addSpacer();
  const pl = petLine(d.pet); if (pl) text(w, `🐠 ${pl}`, 11, /happy/.test(pl) ? SOFT : HOT, true);
  return w;
}
function errorWidget(msg) {
  const w = new ListWidget(), g = new LinearGradient(); g.colors = [PINK, BLUE]; g.locations = [0, 1];
  w.backgroundGradient = g; w.url = APP_URL; text(w, "PIXELLOVE", 11, HOT, true); w.addSpacer(6); text(w, msg, 12, INK, false, 4);
  w.refreshAfterDate = new Date(Date.now() + 30 * 60e3); return w;
}

let widget;
try { widget = build(await load(), config.widgetFamily || "medium"); }
catch (e) { widget = errorWidget(String(e.message || e)); }
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentMedium();
Script.complete();
