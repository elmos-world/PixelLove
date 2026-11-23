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
  return {s, pet, me, other, name: name || "Your person", tz: s["tz" + side] || null,
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
  return {big: "♥", small: "PixelLove"};
}
function timeIn(tz) { try { return new Date().toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit", timeZone: tz || undefined}); } catch (e) { return ""; } }
function stat(pet, k, hrs) { const t = pet && pet[k + "At"]; return t ? Math.max(0, Math.round(100 - (Date.now() - t) / 36e5 * 100 / hrs)) : 0; }
function petLine(pet) {
  if (!pet) return null;
  const nm = pet.name || "Bubbles", f = stat(pet, "fed", 12), p = stat(pet, "played", 16), c = stat(pet, "cleaned", 48);
  return f < 25 ? `${nm} is hungry!` : c < 25 ? `${nm}'s bowl is murky` : p < 25 ? `${nm} is bored` : `${nm} is happy`;
}
function fishImage() { // little pixel goldfish
  const rows = ["....OOOO....", "..OOFFFFO..O", ".OFFFFFFFOOF", "OFWBFFFFFFFF", "OFFFFFFFFOOF", ".OFFFFFFO..O", "..OOOOOO...."];
  const px = 4, ctx = new DrawContext(); ctx.size = new Size(rows[0].length * px, rows.length * px); ctx.opaque = false; ctx.respectScreenScale = true;
  const col = {O: new Color("#b8572a"), F: ORANGE, W: Color.white(), B: new Color("#3a2a3c")};
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (col[ch]) { ctx.setFillColor(col[ch]); ctx.fillRect(new Rect(x * px, y * px, px, px)); } }));
  return ctx.getImage();
}
function text(stack, str, size, color, bold, lines) {
  const t = stack.addText(str); t.font = bold ? Font.boldMonospacedSystemFont(size) : Font.mediumRoundedSystemFont(size);
  t.textColor = color; t.lineLimit = lines || 1; t.minimumScaleFactor = 0.7; return t;
}

// ---------- widget ----------
function build(d, size) {
  const w = new ListWidget(), g = new LinearGradient();
  g.colors = [PINK, BLUE]; g.locations = [0, 1]; w.backgroundGradient = g;
  w.url = APP_URL; w.setPadding(12, 14, 12, 14);
  w.refreshAfterDate = new Date(Date.now() + 15 * 60e3);

  const top = w.addStack(); top.centerAlignContent();
  const fish = top.addImage(fishImage()); fish.imageSize = new Size(24, 14);
  top.addSpacer(5); text(top, "PIXELLOVE", 11, HOT, true); top.addSpacer();
  if (size !== "small" && d.tz) text(top, `${d.name} · ${timeIn(d.tz)}`, 11, SOFT, true);
  w.addSpacer(4);

  const c = countdown(d.s), row = w.addStack(); row.bottomAlignContent();
  text(row, c.big, size === "small" ? 30 : 34, INK, true); row.addSpacer(6);
  const lab = row.addStack(); lab.layoutVertically(); text(lab, c.small, 12, INK, false, 2); lab.addSpacer(5);
  w.addSpacer(4);

  const mood = d.mood && MOOD[d.mood.mood];
  const nightNow = d.night && Date.now() - (d.night.at || 0) < 14 * 36e5;
  const status = [nightNow ? "💤 Said goodnight" : mood ? `${d.name}: ${mood}` : null].filter(Boolean)[0];
  if (size === "small") {
    if (d.tz) text(w, `${d.name} · ${timeIn(d.tz)}`, 11, SOFT, true);
    if (status) text(w, nightNow ? "💤 Asleep" : mood, 12, INK, false);
  } else {
    if (status) text(w, status, 12, INK, false);
    if (d.song && d.song.title) text(w, `🎵 ${d.song.title}`, 12, INK, false);
    if (d.note && d.note.text) { const t = text(w, `💌 “${d.note.text}”`, 12, INK, false, size === "large" ? 4 : 2); t.font = Font.italicSystemFont(12); }
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
