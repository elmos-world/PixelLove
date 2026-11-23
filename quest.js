/* Sea Quest: an idle RPG inside PixelLove.
   Each of you has your own collection in quest/{uid}. Gold, sea dust and pearls are Sea Quest only;
   zone bosses (and later the Kraken) also pay PixelLove coins. Creature art comes from QART (quest-art.js). */
(function(){
'use strict';
const g=window, PL=()=>window.PL; // helpers shared by the main app
const $=i=>PL().$(i), esc=s=>PL().esc(s), toast=t=>PL().toast(t), sfx=k=>PL().sfx(k), sparkle=(...a)=>PL().sparkle(...a), confetti=n=>PL().confetti(n),
  setDoc=(...a)=>PL().setDoc(...a), myCoins=()=>PL().myCoins(), writeCoins=c=>PL().writeCoins(c), pix=(...a)=>PL().pix(...a), hashR=s=>PL().hashR(s);

/* ---------- game data ---------- */
const EL={tide:['Tide','#4fb3e8'],coral:['Coral','#ff7aa8'],storm:['Storm','#f5b82e'],abyss:['Abyss','#8a6bd6'],pearl:['Pearl','#c9a85c']};
const BEATS={tide:'coral',coral:'storm',storm:'tide',abyss:'pearl',pearl:'abyss'};
const ROLE={tank:['Tank',{hp:1150,atk:62,def:62,spd:86}],warrior:['Warrior',{hp:880,atk:104,def:42,spd:100}],assassin:['Assassin',{hp:720,atk:128,def:30,spd:122}],
  mage:['Mage',{hp:720,atk:122,def:28,spd:96}],healer:['Healer',{hp:800,atk:82,def:36,spd:106}],support:['Support',{hp:840,atk:88,def:40,spd:112}]};
const RAR={3:['3★',1],4:['4★',1.16],5:['5★',1.34]};
// skills: kind, power, name, text
const SK={
  strike:(p,n,t)=>({k:'strike',p,n,t}), wave:(p,n,t)=>({k:'wave',p,n,t}), heal:(p,n,t)=>({k:'heal',p,n,t}), shield:(p,n,t)=>({k:'shield',p,n,t}),
  stun:(p,n,t)=>({k:'stun',p,n,t}), drain:(p,n,t)=>({k:'drain',p,n,t}), rally:(p,n,t)=>({k:'rally',p,n,t}), execute:(p,n,t)=>({k:'execute',p,n,t}),
  taunt:(p,n,t)=>({k:'taunt',p,n,t}), chain:(p,n,t)=>({k:'chain',p,n,t}) };
// heroes (names and looks get finalized with the art)
const HEROES={
  // 5★
  marina:{n:'Marina',ti:'Mermaid Princess',el:'tide',ro:'mage',r:5,sk:SK.wave(1.65,'Riptide Requiem','Drowns every enemy in a crushing tide of pink-lit magic.')},
  mista:{n:'Mista',ti:'The Siren',el:'abyss',ro:'assassin',r:5,sk:SK.drain(3.1,'Siren’s Kiss','Lures one enemy close and drinks their life.')},
  sable:{n:'Captain Sable',ti:'Pirate Queen',el:'tide',ro:'warrior',r:5,sk:SK.execute(3.3,'No Quarter','Cuts down the weakest enemy without mercy.')},
  nerissa:{n:'Nerissa',ti:'Sea Witch',el:'abyss',ro:'support',r:5,sk:SK.stun(2.2,'Black Pearl Hex','Curses one enemy, dealing damage and stunning them.')},
  kai:{n:'Kai',ti:'Tide Warlock',el:'storm',ro:'mage',r:5,sk:SK.chain(1.75,'Rune Surge','Glowing runes chain lightning through three enemies.')},
  empress:{n:'The Coral Empress',ti:'Queen of the Reef',el:'pearl',ro:'healer',r:5,sk:SK.heal(1.8,'Pearlescent Grace','Heals every ally with cold, shining light.')},
  kelpie:{n:'Kelpie',ti:'Leafy Sea Dragon',el:'coral',ro:'assassin',r:5,sk:SK.execute(3.2,'Thornlash','Strikes the weakest enemy, dealing far more to the wounded.')},
  phantom:{n:'Phantom',ti:'Manta Shade',el:'storm',ro:'assassin',r:5,sk:SK.drain(3,'Static Glide','Glides through one enemy and steals its life.')},
  pearl:{n:'Pearl',ti:'Narwhal Paladin',el:'pearl',ro:'warrior',r:5,sk:SK.wave(1.7,'Radiant Lance','A beam of light pierces every enemy.')},
  // 4★
  henri:{n:'Henri',ti:'The Old Sailor',el:'tide',ro:'tank',r:4,sk:SK.taunt(1.7,'Anchor’s Resolve','Braces like an anchor, shielding himself and drawing every attack.')},
  dante:{n:'Dante',ti:'Lighthouse Keeper',el:'pearl',ro:'support',r:4,sk:SK.rally(0.3,'Beacon','His lantern blazes, raising every ally’s attack.')},
  ondine:{n:'Ondine',ti:'Pearl Diver',el:'coral',ro:'assassin',r:4,sk:SK.execute(2.8,'Deep Dive','Dives for the weakest enemy and strikes hard.')},
  rook:{n:'Rook',ti:'Shark Hunter',el:'abyss',ro:'warrior',r:4,sk:SK.strike(2.8,'Harpoon Shot','Fires a heavy harpoon into one enemy.')},
  lorelei:{n:'Lorelei',ti:'Storm Singer',el:'storm',ro:'mage',r:4,sk:SK.chain(1.4,'Feedback','A screaming high note arcs through three enemies.')},
  orcan:{n:'Orcan',ti:'Orca Knight',el:'tide',ro:'tank',r:4,sk:SK.taunt(1.6,'Undertow Guard','Raises a tidal shield and forces enemies to strike him.')},
  coralie:{n:'Coralie',ti:'Seahorse Oracle',el:'coral',ro:'healer',r:4,sk:SK.heal(1.4,'Bloom','Heals every ally with blossoming coral light.')},
  jellyspark:{n:'Jellyspark',ti:'Storm Bell',el:'storm',ro:'support',r:4,sk:SK.rally(0.3,'Thunder Chime','Charges allies, raising their attack for a while.')},
  thunder:{n:'Thunder',ti:'Hammerhead Brawler',el:'storm',ro:'warrior',r:4,sk:SK.stun(2.1,'Thunderclap','Slams one enemy and stuns it.')},
  lumina:{n:'Lumina',ti:'Anglerfish Witch',el:'abyss',ro:'mage',r:4,sk:SK.wave(1.5,'Abyssal Flare','Bursts dark light over every enemy.')},
  // 3★
  finn:{n:'Finn',ti:'Deckhand',el:'tide',ro:'warrior',r:3,sk:SK.strike(2.3,'Rope Swing','Swings in on a rope and kicks one enemy.')},
  bo:{n:'Bo',ti:'Fisherman',el:'coral',ro:'tank',r:3,sk:SK.shield(1.1,'Big Net','Throws a net of protection over every ally.')},
  marisol:{n:'Marisol',ti:'Beachcomber',el:'pearl',ro:'healer',r:3,sk:SK.heal(1.15,'Sunny Day','Warm sunshine heals every ally.')},
  otterly:{n:'Otterly',ti:'Reef Rascal',el:'tide',ro:'warrior',r:3,sk:SK.strike(2.4,'Shell Smash','Bashes one enemy with a heavy shell.')},
  shelly:{n:'Shelly',ti:'Coral Warden',el:'coral',ro:'tank',r:3,sk:SK.shield(1.2,'Living Reef','Covers every ally in a coral shield.')},
  zap:{n:'Zap',ti:'Volt Eel',el:'storm',ro:'warrior',r:3,sk:SK.chain(1.3,'Chain Spark','Lightning jumps between three enemies.')},
  inky:{n:'Inky',ti:'Ink Trickster',el:'abyss',ro:'support',r:3,sk:SK.stun(1.4,'Ink Cloud','Blinds one enemy, stunning it.')},
  clam:{n:'Sir Clamsworth',ti:'Clam Knight',el:'pearl',ro:'tank',r:3,sk:SK.taunt(1.3,'Hold the Line','Shuts his shell tight and draws attacks.')},
  starla:{n:'Starla',ti:'Starfish Priestess',el:'pearl',ro:'healer',r:3,sk:SK.heal(1.2,'Starlight','Heals every ally with gentle starlight.')},
};
const STARTERS=['otterly','shelly','zap'];
const MONSTERS={
  puffer:{n:'Pufferpunk',el:'storm',ro:'tank',sk:SK.taunt(1.2,'Spike Up','Puffs up and draws attacks.')},
  crab:{n:'Grumpy Crab',el:'coral',ro:'warrior',sk:SK.strike(2.2,'Pinch','A painful pinch.')},
  moray:{n:'Moray Bandit',el:'abyss',ro:'assassin',sk:SK.execute(2.6,'Ambush','Bites the weakest hero.')},
  cuda:{n:'Barracuda',el:'tide',ro:'assassin',sk:SK.strike(2.5,'Razor Dash','A slashing dash.')},
  urchin:{n:'Spiky Urchin',el:'abyss',ro:'tank',sk:SK.wave(0.9,'Needle Burst','Spikes fly at every hero.')},
  ghost:{n:'Ghost Jelly',el:'pearl',ro:'mage',sk:SK.wave(1.2,'Wail','A chilling wail hits every hero.')},
  slug:{n:'Sea Slug Witch',el:'coral',ro:'healer',sk:SK.heal(1.1,'Slime Brew','Heals her allies.')},
  clawdius:{n:'Captain Clawdius',el:'coral',ro:'tank',boss:1,sk:SK.wave(1.4,'Broadside','Fires the cannons at every hero.')},
  siren:{n:'The Drowned Queen',el:'abyss',ro:'mage',boss:1,sk:SK.stun(2.4,'Enthrall','Bewitches one hero, stunning them.')},
  leviathan:{n:'Leviathan',el:'tide',ro:'warrior',boss:1,sk:SK.wave(1.8,'Tidal Crush','A crushing wave hits every hero.')},
};
const ZONES=[
  {n:'Coral Reef',bg:['#bfeaff','#ffd6e6'],sand:'#ffe3c4',mobs:['crab','puffer','urchin','slug'],boss:'clawdius'},
  {n:'Kelp Forest',bg:['#c8f2df','#9fd8c4'],sand:'#d9efc9',mobs:['moray','slug','crab','cuda'],boss:'siren'},
  {n:'Sunken City',bg:['#c9d6f7','#a9b6e6'],sand:'#d7d3ea',mobs:['ghost','moray','cuda','urchin'],boss:'leviathan'},
  {n:'The Abyss',bg:['#cdbdf2','#9f8bd8'],sand:'#c7b9e6',mobs:['ghost','urchin','moray','puffer'],boss:'leviathan'}];

/* ---------- player data ---------- */
let Q=null, qLoaded=false, qScreen='home', qHero=null, qSaveT=null, partnerQ=null;
const fresh=()=>({v:1, gold:500, dust:300, pearls:500, stage:0, team:[], roster:{}, idleAt:Date.now(), pulls:0, pity:0, starter:''});
function normQ(d){ const q={...fresh(),...(d||{})}; q.roster=q.roster&&typeof q.roster==='object'?q.roster:{}; q.team=Array.isArray(q.team)?q.team.filter(id=>q.roster[id]).slice(0,5):[]; return q; }
function saveQ(){ if(!Q) return; try{ localStorage.setItem('pl-quest', JSON.stringify(Q)); }catch(e){} if(!PL().me) return; clearTimeout(qSaveT); qSaveT=setTimeout(()=>{ qSaveT=null; setDoc('quest/'+PL().me, Q, ()=>{}); }, 250); }
function own(id){ return !!(Q&&Q.roster[id]); }

/* ---------- stats ---------- */
function heroStats(id, lv, st=1){
  const h=HEROES[id], b=ROLE[h.ro][1], m=RAR[h.r][1]*(1+0.12*(lv-1))*(1+0.15*(st-1));
  return {hp:Math.round(b.hp*m), atk:Math.round(b.atk*m), def:Math.round(b.def*m), spd:b.spd+Math.min(30,lv>>2)};
}
function monStats(id, lv){ const mo=MONSTERS[id], b=ROLE[mo.ro][1], m=(1+0.13*(lv-1)), bo=mo.boss?{hp:3.2,atk:1.35,def:1.3}:{hp:1,atk:1,def:1};
  return {hp:Math.round(b.hp*m*.92*bo.hp), atk:Math.round(b.atk*m*.9*bo.atk), def:Math.round(b.def*m*bo.def), spd:b.spd-4+Math.min(20,lv>>3)}; }
const power=s=>Math.round(s.hp/8+s.atk*3+s.def*2.5+s.spd);
function teamPower(){ return Q?Q.team.reduce((a,id)=>a+power(heroStats(id,Q.roster[id].lv,Q.roster[id].st)),0):0; }
const lvCost=lv=>({gold:Math.round(20*Math.pow(lv,1.35)), dust:Math.round(15*Math.pow(lv,1.25))});
const LV_CAP=60;

/* ---------- stages ---------- */
function stageInfo(s){ // s is 1-based
  const z=Math.floor((s-1)/10), i=(s-1)%10+1, zone=ZONES[Math.min(z,ZONES.length-1)], loop=Math.floor(z/ZONES.length);
  const lv=Math.max(1,Math.round(1+(s-1)*1.25+loop*6)), n=i<=2?3:i<=5?4:5, boss=i===10, r=hashR?(k=>hashR('st'+s+'|'+k)):(()=>Math.random());
  const ids=[]; if(boss) ids.push(zone.boss); while(ids.length<n) ids.push(zone.mobs[Math.floor(r(ids.length)*zone.mobs.length)]);
  return {s,z,i,zone,lv,boss,label:`${z+1}-${i}`,enemies:ids.map((id,k)=>({id,lv:boss&&k===0?lv+2:lv}))};
}
function idleRates(){ const c=Q.stage; return {gold:300+c*60, dust:220+c*45, pearls:30+c*2}; } // per hour
function idlePending(){ if(!Q) return {gold:0,dust:0,pearls:0,hrs:0}; const hrs=Math.min(12,(Date.now()-(Q.idleAt||Date.now()))/36e5), r=idleRates(); return {gold:Math.floor(r.gold*hrs), dust:Math.floor(r.dust*hrs), pearls:Math.floor(r.pearls*hrs), hrs}; }

/* ---------- battle simulation ---------- */
function mkUnit(side,pos,id,lv,st,isMon){ const s=isMon?monStats(id,lv):heroStats(id,lv,st), d=isMon?MONSTERS[id]:HEROES[id];
  return {u:side+'-'+pos, side, pos, id, mon:!!isMon, boss:!!d.boss, n:d.n, el:d.el, ro:d.ro, sk:d.sk, ...s, max:s.hp, en:isMon?0:20, gauge:Math.random()*300, shield:0, stun:0, buff:0, taunt:0}; }
function simulate(team, enemies){
  const U=[...team.map((t,i)=>mkUnit(0,i,t.id,t.lv,t.st,false)), ...enemies.map((e,i)=>mkUnit(1,i,e.id,e.lv,1,true))], log=[];
  const alive=s=>U.filter(u=>u.side===s&&u.hp>0), elm=(a,d)=>BEATS[a.el]===d.el?1.3:BEATS[d.el]===a.el?.8:1;
  const pickTarget=a=>{ const foes=alive(1-a.side); if(!foes.length) return null; const tt=foes.filter(f=>f.taunt>0); if(tt.length) return tt[0];
    if(a.ro==='assassin') return foes.reduce((m,f)=>f.hp/f.max<m.hp/m.max?f:m); if(a.ro==='mage') return foes[Math.floor(Math.random()*foes.length)];
    const front=foes.filter(f=>f.pos<2); const pool=front.length?front:foes; return pool[Math.floor(Math.random()*pool.length)]; };
  const hit=(a,d,mult,hits)=>{ const crit=Math.random()<.12, em=elm(a,d), atk=a.atk*(a.buff>0?1.3:1);
    let dmg=Math.max(1,Math.round(atk*mult*(100/(100+d.def))*em*(crit?1.6:1)*(.92+Math.random()*.16)));
    let sh=0; if(d.shield>0){ sh=Math.min(d.shield,dmg); d.shield-=sh; dmg-=sh; } d.hp=Math.max(0,d.hp-dmg); d.en=Math.min(100,d.en+10);
    hits.push({d:d.u, dmg, sh, crit, adv:em>1?1:em<1?-1:0, hp:d.hp, ko:d.hp<=0}); return dmg; };
  let acts=0;
  while(alive(0).length&&alive(1).length&&acts<300){
    U.forEach(u=>{ if(u.hp>0) u.gauge+=u.spd; });
    const ready=U.filter(u=>u.hp>0&&u.gauge>=1000).sort((x,y)=>y.gauge-x.gauge);
    for(const a of ready){ if(a.hp<=0||!alive(0).length||!alive(1).length) continue; a.gauge-=1000; acts++;
      if(a.stun>0){ a.stun--; log.push({a:a.u, kind:'stunned'}); continue; }
      if(a.buff>0) a.buff--; if(a.taunt>0) a.taunt--;
      const hits=[], ev={a:a.u, kind:'basic', hits};
      if(a.en>=100){ a.en=0; ev.kind='skill'; ev.name=a.sk.n; const k=a.sk.k, p=a.sk.p, foes=alive(1-a.side), pals=alive(a.side);
        if(k==='strike'){ const t=pickTarget(a); t&&hit(a,t,p,hits); }
        else if(k==='wave') foes.forEach(t=>hit(a,t,p,hits));
        else if(k==='chain') [...foes].sort(()=>Math.random()-.5).slice(0,3).forEach(t=>hit(a,t,p,hits));
        else if(k==='execute'){ const t=foes.reduce((m,f)=>f.hp/f.max<m.hp/m.max?f:m); hit(a,t,p*(t.hp/t.max<.4?1.5:1),hits); }
        else if(k==='stun'){ const t=pickTarget(a); if(t){ hit(a,t,p,hits); if(t.hp>0){ t.stun=1; hits[hits.length-1].stun=1; } } }
        else if(k==='drain'){ const t=pickTarget(a); if(t){ const d=hit(a,t,p,hits); const h=Math.round(d*.5); a.hp=Math.min(a.max,a.hp+h); hits.push({d:a.u, heal:h, hp:a.hp}); } }
        else if(k==='heal') pals.forEach(t=>{ const h=Math.round(a.atk*p*(.95+Math.random()*.1)); t.hp=Math.min(t.max,t.hp+h); hits.push({d:t.u, heal:h, hp:t.hp}); });
        else if(k==='shield') pals.forEach(t=>{ const s=Math.round(a.atk*p*2.2); t.shield+=s; hits.push({d:t.u, shield:s, hp:t.hp}); });
        else if(k==='rally') pals.forEach(t=>{ t.buff=3; hits.push({d:t.u, buff:1, hp:t.hp}); });
        else if(k==='taunt'){ a.taunt=2; const s=Math.round(a.atk*p*3); a.shield+=s; hits.push({d:a.u, shield:s, taunt:1, hp:a.hp}); }
      } else { const t=pickTarget(a); if(t) hit(a,t,1,hits); a.en=Math.min(100,a.en+25); }
      ev.en=U.map(u=>u.en); log.push(ev);
    }
  }
  return {win:alive(0).length>0&&!alive(1).length, units:U.map(u=>({u:u.u,side:u.side,pos:u.pos,id:u.id,mon:u.mon,boss:u.boss,n:u.n,el:u.el,max:u.max})), log, start:U.map(u=>u.max)};
}

/* ---------- art ---------- */
function blobRows(seed){ // placeholder pixel creature until the real art is in
  const r=k=>hashR?hashR(seed+'|'+k):Math.random(), fin=r(1)<.5;
  return ['....BBBBBB......','..BBBBBBBBBB....','.BBBBBBBBBBBB.'+(fin?'FF':'..'),'BBBBBBBBWKBBBFFF','BBBBBBBBKKBBBBF.','BBBBBBBBBBBBBB..','.BBBBBLLLLBBB.'+(fin?'FF':'..'),'..BBBBBBBBBB....','....BBBBBB......'];
}
function art(id, kind){ // kind: 'pix' (battle sprite) or 'full' (big portrait)
  const A=g.QART&&g.QART[id]; if(A&&A[kind]) return A[kind];
  const d=HEROES[id]||MONSTERS[id]||{el:'tide'}, c=EL[d.el][1];
  const inner=pix(blobRows(id), {B:c,L:'#ffffff99',F:c,W:'#fff',K:'#2c2a4a'}, 1, 0, 0, '#3d3762');
  return kind==='pix' ? `<svg viewBox="-1 -1 18 11" shape-rendering="crispEdges">${inner}</svg>`
    : `<svg viewBox="-3 -4 22 17" shape-rendering="crispEdges"><rect x="-3" y="-4" width="22" height="17" fill="${c}22"/>${inner}<text x="8" y="12" font-size="1.6" text-anchor="middle" fill="#3d3762" font-family="sans-serif">art coming soon</text></svg>`;
}
const elChip=e=>`<span class="qel" style="--ec:${EL[e][1]}">${EL[e][0]}</span>`;
const stars=n=>`<span class="qstars r${n}">${'★'.repeat(n)}</span>`, plus=st=>st>1?`<span class="qplus">+${st-1}</span>`:'';
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?Math.round(n/1e3)+'K':String(n);
const ICO={gold:'<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="2" y="0" width="4" height="8" fill="#c98a12"/><rect x="0" y="2" width="8" height="4" fill="#c98a12"/><rect x="1" y="1" width="6" height="6" fill="#ffd95a"/><rect x="2" y="2" width="2" height="2" fill="#fff3b0"/></svg>',
  dust:'<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="3" y="0" width="2" height="8" fill="#9fd3f5"/><rect x="0" y="3" width="8" height="2" fill="#9fd3f5"/><rect x="2" y="2" width="4" height="4" fill="#e9f6ff"/><rect x="6" y="0" width="1" height="1" fill="#cdb8f5"/><rect x="1" y="6" width="1" height="1" fill="#cdb8f5"/></svg>',
  pearls:'<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="2" y="1" width="4" height="6" fill="#e9defe"/><rect x="1" y="2" width="6" height="4" fill="#e9defe"/><rect x="2" y="2" width="2" height="2" fill="#fff"/><rect x="5" y="5" width="1" height="1" fill="#b9a7e6"/></svg>'};
const cur=(k,v)=>`<span class="qcur">${ICO[k]}<b>${fmt(v)}</b></span>`;

/* ---------- screens ---------- */
function root(){ return $('qRoot'); }
function render(){
  const R=root(); if(!R) return;
  if(!qLoaded){ R.innerHTML='<div class="card"><p class="lede">Loading Sea Quest…</p></div>'; return; }
  if(!Q||!Q.starter){ renderStarter(R); return; }
  if(qScreen==='team') renderTeam(R); else if(qScreen==='hero') renderHero(R); else if(qScreen==='summon') renderSummon(R); else renderHome(R);
}
function topBar(back){ return `<div class="qtop">${back?'<button type="button" class="ghost qback" data-q="home">◀ Back</button>':'<h2 class="qtitle">Sea Quest</h2>'}<div class="qcurs">${cur('gold',Q.gold)}${cur('dust',Q.dust)}${cur('pearls',Q.pearls)}</div></div>`; }
function renderStarter(R){
  R.innerHTML=`<div class="card qstart"><h2>Choose your first companion</h2><p class="lede">Every adventure starts with a friend. Pick one to begin. You can find the others later.</p>
    <div class="qstarters">${STARTERS.map(id=>{ const h=HEROES[id]; return `<button type="button" class="qcard" data-starter="${id}"><div class="qpix">${art(id,'pix')}</div><b>${h.n}</b><span>${h.ti}</span>${elChip(h.el)}</button>`; }).join('')}</div>
    <p class="sub" style="font-size:14px">You also get 500 pearls to summon more friends.</p></div>`;
}
function scene(ids, enemies, zone){
  const side=(list,right)=>list.map((id,i)=>`<div class="qsp ${right?'r':''}" style="--i:${i}">${art(id,'pix')}</div>`).join('');
  return `<div class="qscene" style="--z1:${zone.bg[0]};--z2:${zone.bg[1]};--zs:${zone.sand}"><div class="qside">${side(ids,false)}</div><div class="qside r">${side(enemies,true)}</div></div>`;
}
function renderHome(R){
  const next=stageInfo(Q.stage+1), p=idlePending(), rates=idleRates();
  const hh=Math.floor(p.hrs), mm=Math.floor((p.hrs-hh)*60);
  R.innerHTML=topBar(false)+`
  <div class="card qidle"><div class="qrow"><b>AFK rewards</b><span class="sub">${hh}h ${String(mm).padStart(2,'0')}m · max 12h</span></div>
    ${scene(Q.team, next.enemies.slice(0,2).map(e=>e.id), next.zone)}
    <div class="qrow"><div class="qcurs">${cur('gold',p.gold)}${cur('dust',p.dust)}${cur('pearls',p.pearls)}</div><button type="button" class="main" data-q="collect" ${p.gold<1?'disabled':''}>Collect</button></div>
    <p class="sub qrate">Earning ${rates.gold} gold, ${rates.dust} dust and ${rates.pearls} pearls an hour, even while you’re away.</p></div>
  <div class="card qstage"><div class="qrow"><div><span class="sub">${next.zone.n}</span><h3>Stage ${next.label}${next.boss?' · <em class="qboss">BOSS</em>':''}</h3></div><div class="qpow">Power <b>${fmt(teamPower())}</b></div></div>
    <div class="qfoes">${next.enemies.map(e=>`<div class="qfoe ${MONSTERS[e.id].boss?'boss':''}">${art(e.id,'pix')}<span>Lv ${e.lv}</span></div>`).join('')}</div>
    <button type="button" class="main qbig" data-q="fight" ${Q.team.length?'':'disabled'}>${Q.team.length?'Battle!':'Add a creature to your team first'}</button>
    ${next.boss?'<p class="sub" style="font-size:13px;margin:6px 0 0">Beating a zone boss also earns 20 PixelLove coins.</p>':''}</div>
  <div class="qnav"><button type="button" data-q="team">Team & creatures</button><button type="button" data-q="summon">Summon</button></div>`;
}
function heroCard(id, extra=''){ const h=HEROES[id], o=Q.roster[id];
  return `<button type="button" class="qcard ${o?'':'locked'} r${h.r}" data-hero="${id}">${o&&Q.team.includes(id)?`<i class="qslot">${Q.team.indexOf(id)+1}</i>`:''}<div class="qpix">${art(id,'pix')}</div><b>${o?h.n:'???'}</b>${stars(h.r)}${o?`<span>Lv ${o.lv}${plus(o.st)}${o.cp&&o.st<5&&o.cp>=o.st?' <i class="qup">▲</i>':''}</span>`:''}${elChip(h.el)}${extra}</button>`; }
function renderTeam(R){
  const ids=Object.keys(HEROES).sort((a,b)=>(own(b)-own(a))||(HEROES[b].r-HEROES[a].r));
  R.innerHTML=topBar(true)+`<div class="card"><div class="qrow"><h3 style="margin:0">Your team</h3><div class="qpow">Power <b>${fmt(teamPower())}</b></div></div>
    <p class="sub" style="font-size:14px;margin:4px 0 8px">Up to 5. The first two stand in front. Tap a creature to see it, level it up or add it to your team.</p>
    <div class="qteam">${[0,1,2,3,4].map(i=>{ const id=Q.team[i]; return id?`<button type="button" class="qtm" data-hero="${id}"><div class="qpix">${art(id,'pix')}</div><span>${i<2?'Front':'Back'}</span></button>`:`<div class="qtm empty"><span>${i<2?'Front':'Back'}</span></div>`; }).join('')}</div></div>
    <div class="card"><h3 style="margin:0 0 8px">Creatures · ${Object.keys(Q.roster).length}/${Object.keys(HEROES).length}</h3><div class="qgrid">${ids.map(id=>heroCard(id)).join('')}</div></div>`;
}
function statRow(l,v){ return `<div><span>${l}</span><b>${fmt(v)}</b></div>`; }
function renderHero(R){
  const id=qHero, h=HEROES[id], o=Q.roster[id]; if(!h){ qScreen='team'; return render(); }
  if(!o){ R.innerHTML=topBar(true)+`<div class="card qhero"><div class="qfull locked">${art(id,'full')}</div><h2>???</h2><p class="lede">A ${RAR[h.r][0]} ${EL[h.el][0]} character you haven’t met yet. Find them by summoning.</p></div>`; return; }
  const s=heroStats(id,o.lv,o.st), c=lvCost(o.lv), canLv=o.lv<LV_CAP&&Q.gold>=c.gold&&Q.dust>=c.dust, inT=Q.team.includes(id);
  R.innerHTML=topBar(true)+`<div class="card qhero"><div class="qfull" style="--ec:${EL[h.el][1]}">${art(id,'full')}</div>
    <div class="qhname"><div><h2>${esc(h.n)}</h2><p class="sub">${esc(h.ti)}</p></div><div>${stars(h.r)}${plus(o.st)}</div></div>
    <div class="qtags">${elChip(h.el)}<span class="qtag">${ROLE[h.ro][0]}</span><span class="qtag r${h.r}">${RAR[h.r][0]}</span><span class="qtag">Lv ${o.lv}/${LV_CAP}</span></div>
    <div class="qstats">${statRow('Health',s.hp)}${statRow('Attack',s.atk)}${statRow('Defense',s.def)}${statRow('Speed',s.spd)}${statRow('Power',power(s))}</div>
    <div class="qskill"><b>✦ ${esc(h.sk.n)}</b><p>${esc(h.sk.t)}</p><span class="sub" style="font-size:13px">Strong against ${EL[BEATS[h.el]][0]}. Weak to ${EL[Object.keys(BEATS).find(k=>BEATS[k]===h.el)][0]}.</span></div>
    <div class="qrow qlv"><div class="qcurs">${cur('gold',c.gold)}${cur('dust',c.dust)}</div><button type="button" class="main" data-q="levelup" ${canLv?'':'disabled'}>${o.lv>=LV_CAP?'Max level':'Level up'}</button></div>
    <div class="qrow qasc"><div><b>Upgrade with copies</b><p class="sub" style="font-size:13px;margin:2px 0 0">${o.st>=5?'Fully upgraded: +4':`+${o.st} needs ${o.st} cop${o.st>1?'ies':'y'} · you have ${o.cp||0}. Each + gives 15% more stats.`}</p></div><button type="button" class="main" data-q="ascend" ${o.st<5&&(o.cp||0)>=o.st?'':'disabled'}>${o.st>=5?'Maxed':'Upgrade'}</button></div>
    <button type="button" class="${inT?'ghost':'main'} qbig" data-q="toggleteam">${inT?'Remove from team':Q.team.length>=5?'Team is full (5)':'Add to team'}</button></div>`;
}
function renderSummon(R, results){
  R.innerHTML=topBar(true)+`<div class="card qsummon"><h2>Pearl shrine</h2><p class="lede">Offer pearls to the giant clam and a new friend swims out. Getting someone you already have gives you a copy. Use copies on their page to upgrade them (up to +4).</p>
    <div class="qclam ${results?'open':''}"><svg viewBox="0 0 64 44" shape-rendering="crispEdges"><g class="qclamtop"><path d="M6 24 C6 8 58 8 58 24z" fill="#ffd3e3"/><path d="M14 22 L20 10 M26 22 L28 8 M38 22 L36 8 M50 22 L44 10" stroke="#ffb3c7" stroke-width="3"/></g><circle cx="32" cy="26" r="7" fill="#fff"/><circle cx="30" cy="24" r="2" fill="#e9f6ff"/><path d="M6 26 h52 C56 40 8 40 6 26z" fill="#ffb3c7"/></svg></div>
    <p class="sub" style="font-size:13px;margin:0">3★ 65% · 4★ 28% · 5★ 7% · a 5★ is guaranteed within 40 summons (${40-Q.pity} to go)</p>
    <div class="row" style="justify-content:center;margin-top:12px"><button type="button" class="main" data-q="sum1" ${Q.pearls<100?'disabled':''}>Summon ×1 · 100 ${ICO.pearls}</button><button type="button" class="main" data-q="sum10" ${Q.pearls<900?'disabled':''}>×10 · 900 ${ICO.pearls}</button></div>
    ${results?`<div class="qresults">${results.map(r=>`<div class="qres r${HEROES[r.id].r}"><div class="qpix">${art(r.id,'pix')}</div><b>${HEROES[r.id].n}</b><span>${stars(HEROES[r.id].r)}${r.dup?r.dust?`+${r.dust} dust`:'+1 copy':'NEW!'}</span></div>`).join('')}</div>`:''}</div>`;
}

/* ---------- actions ---------- */
function act(k){
  if(k==='home'||k==='team'||k==='summon'){ qScreen=k; render(); window.scrollTo(0,0); return; }
  if(k==='collect'){ const p=idlePending(); if(p.gold<1) return; Q.gold+=p.gold; Q.dust+=p.dust; Q.pearls+=p.pearls; Q.idleAt=Date.now(); saveQ(); render(); sfx('coin'); sparkle(); toast(`Collected ${p.gold} gold, ${p.dust} dust and ${p.pearls} pearls`); return; }
  if(k==='levelup'){ const o=Q.roster[qHero], c=lvCost(o.lv); if(o.lv>=LV_CAP||Q.gold<c.gold||Q.dust<c.dust) return; Q.gold-=c.gold; Q.dust-=c.dust; o.lv++; saveQ(); render(); sfx('unlock'); sparkle(innerWidth/2,innerHeight/3,10); return; }
  if(k==='ascend'){ const o=Q.roster[qHero]; if(o.st>=5||(o.cp||0)<o.st) return; o.cp-=o.st; o.st++; saveQ(); render(); sfx('unlock'); confetti(40); toast(`${HEROES[qHero].n} is now +${o.st-1}!`); return; }
  if(k==='toggleteam'){ const i=Q.team.indexOf(qHero); if(i>=0) Q.team.splice(i,1); else if(Q.team.length<5) Q.team.push(qHero); else return; saveQ(); render(); sfx('tap'); return; }
  if(k==='sum1'||k==='sum10') return summon(k==='sum1'?1:10);
  if(k==='fight') return startBattle();
}
function summon(n){
  const cost=n===1?100:900; if(Q.pearls<cost) return; Q.pearls-=cost; const out=[];
  for(let i=0;i<n;i++){ Q.pulls++; Q.pity++; let r=Math.random(), rar=r<.07?5:r<.35?4:3; if(Q.pity>=40) rar=5; if(rar===5) Q.pity=0;
    const pool=Object.keys(HEROES).filter(id=>HEROES[id].r===rar), id=pool[Math.floor(Math.random()*pool.length)], o=Q.roster[id];
    if(!o){ Q.roster[id]={lv:1,st:1}; if(Q.team.length<5&&!Q.team.includes(id)) Q.team.push(id); out.push({id}); }
    else if((o.st-1)+(o.cp||0)<10){ o.cp=(o.cp||0)+1; out.push({id,dup:1}); } else { Q.dust+=200; out.push({id,dup:1,dust:200}); } }
  saveQ(); sfx('unlock'); renderSummon(root(), out);
  if(out.some(o=>HEROES[o.id].r===5&&!o.dup)){ confetti(80); setTimeout(()=>sfx('unlock'),300); } else sparkle(innerWidth/2,innerHeight/2,18);
}

/* ---------- battle screen ---------- */
let BT=null;
function startBattle(){
  const st=stageInfo(Q.stage+1), team=Q.team.map(id=>({id, lv:Q.roster[id].lv, st:Q.roster[id].st}));
  const res=simulate(team, st.enemies); BT={st, res, i:0, speed:1, timer:null};
  const ov=document.createElement('div'); ov.className='qbattle'; ov.id='qBattle';
  const slot=u=>{ const pos=u.side===0?[[34,38],[34,68],[12,24],[12,53],[12,82]][u.pos]:[[66,38],[66,68],[88,24],[88,53],[88,82]][u.pos];
    return `<div class="qu ${u.side?'foe':''} ${u.boss?'boss':''}" id="qu-${u.u}" style="left:${pos[0]}%;top:${pos[1]}%"><div class="qhp"><i style="width:100%"></i><em></em></div><div class="qen"><i style="width:${u.side?0:20}%"></i></div><div class="qbody">${art(u.id,'pix')}</div></div>`; };
  ov.innerHTML=`<div class="qarena" style="--z1:${st.zone.bg[0]};--z2:${st.zone.bg[1]};--zs:${st.zone.sand}"><div class="qbhead"><b>${st.zone.n} · ${st.label}</b><span><button type="button" id="qSpeed">1×</button><button type="button" id="qSkip">Skip</button></span></div>
    ${res.units.map(slot).join('')}<div class="qbanner" id="qBanner"></div></div><div class="qbres" id="qRes" hidden></div>`;
  document.body.appendChild(ov); sfx('tap');
  $('qSpeed').onclick=()=>{ BT.speed=BT.speed===1?2:BT.speed===2?4:1; $('qSpeed').textContent=BT.speed+'×'; };
  $('qSkip').onclick=()=>{ clearTimeout(BT.timer); while(BT.i<BT.res.log.length) step(true); finish(); };
  BT.timer=setTimeout(play, 500);
}
function floatNum(el, txt, cls){ const f=document.createElement('span'); f.className='qnum '+cls; f.textContent=txt; el.appendChild(f); setTimeout(()=>f.remove(), 900); }
function setHp(uid, hp){ const u=BT.res.units.find(x=>x.u===uid), el=$('qu-'+uid); if(!u||!el) return; el.querySelector('.qhp i').style.width=Math.max(0,hp/u.max*100)+'%'; if(hp<=0) el.classList.add('ko'); else el.classList.remove('ko'); }
function step(quiet){
  const ev=BT.res.log[BT.i++]; if(!ev) return; const a=$('qu-'+ev.a);
  if(ev.en) BT.res.units.forEach((u,k)=>{ const e=$('qu-'+u.u); if(e) e.querySelector('.qen i').style.width=ev.en[k]+'%'; });
  if(ev.kind==='stunned'){ if(!quiet&&a) floatNum(a,'Stunned','st'); return; }
  if(!quiet&&a){ a.classList.remove('lunge','cast'); void a.offsetWidth; a.classList.add(ev.kind==='skill'?'cast':'lunge'); }
  if(!quiet&&ev.kind==='skill'){ const b=$('qBanner'); b.textContent=ev.name; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); sfx('pop'); }
  ev.hits.forEach(h=>{ const d=$('qu-'+h.d); setHp(h.d,h.hp); if(quiet||!d) return;
    if(h.dmg!==undefined){ d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit'); floatNum(d,(h.crit?'CRIT ':'')+h.dmg, h.adv>0?'adv':h.crit?'crit':'dmg'); if(h.stun) setTimeout(()=>floatNum(d,'Stun!','st'),250); }
    if(h.heal) floatNum(d,'+'+h.heal,'heal'); if(h.shield) floatNum(d,'🛡 '+h.shield,'sh'); if(h.buff) floatNum(d,'ATK ↑','buf'); });
}
function play(){ if(!$('qBattle')) return; if(BT.i>=BT.res.log.length){ finish(); return; } step(false); BT.timer=setTimeout(play, (PL().reduce?250:620)/BT.speed); }
function finish(){
  const R=$('qRes'); if(!R||!R.hidden) return; const {st,res}=BT; let html;
  if(res.win){ const gold=80+st.s*22, dust=60+st.s*16, pearls=st.boss?80:15;
    Q.stage=Math.max(Q.stage,st.s); Q.gold+=gold; Q.dust+=dust; Q.pearls+=pearls; saveQ();
    if(st.boss){ const c=myCoins(); writeCoins({...c, earned:c.earned+20}); }
    html=`<h2 class="qwin">Victory!</h2><p>Stage ${st.label} cleared</p><div class="qcurs" style="justify-content:center">${cur('gold',gold)}${cur('dust',dust)}${cur('pearls',pearls)}</div>${st.boss?'<p class="qbonus">Boss bonus: +20 PixelLove coins!</p>':''}
      <div class="row" style="justify-content:center"><button type="button" class="ghost" data-qb="close">Done</button><button type="button" class="main" data-qb="next">Next stage</button></div>`;
    sfx('unlock'); confetti(st.boss?90:40);
  } else {
    html=`<h2 class="qlose">Defeated…</h2><p>The monsters were too strong this time.</p><p class="sub">Collect your AFK rewards, level up your creatures, or summon new friends, then try again.</p>
      <div class="row" style="justify-content:center"><button type="button" class="ghost" data-qb="close">Back</button><button type="button" class="main" data-qb="team">Level up</button></div>`;
    sfx('pop');
  }
  R.innerHTML=html; R.hidden=false;
  R.onclick=e=>{ const b=e.target.closest('[data-qb]'); if(!b) return; $('qBattle').remove(); if(b.dataset.qb==='next'){ render(); startBattle(); } else { qScreen=b.dataset.qb==='team'?'team':'home'; render(); } };
}

/* ---------- wiring ---------- */
document.addEventListener('click',e=>{
  const R=root(); if(!R||!R.contains(e.target)) return;
  const s=e.target.closest('[data-starter]'); if(s){ const id=s.dataset.starter; Q=normQ(Q); Q.starter=id; Q.roster[id]={lv:1,st:1}; Q.team=[id]; Q.idleAt=Date.now(); saveQ(); sfx('unlock'); confetti(50); toast(`${HEROES[id].n} joined you! Summon more friends at the Pearl shrine.`); qScreen='home'; render(); return; }
  const h=e.target.closest('[data-hero]'); if(h){ qHero=h.dataset.hero; qScreen='hero'; render(); window.scrollTo(0,0); return; }
  const q=e.target.closest('[data-q]'); if(q&&!q.disabled) act(q.dataset.q);
});
setInterval(()=>{ if(qScreen==='home'&&location.hash==='#quest'&&Q&&Q.starter&&!$('qBattle')) render(); }, 30000);
window.addEventListener('hashchange',()=>{ if(location.hash==='#quest') render(); });
window.questStart=function(db, err){
  db.doc('quest/'+PL().me).onSnapshot(s=>{ const d=s.exists?s.data():null; if(!qSaveT||!Q) Q=d?normQ(d):null; qLoaded=true; if(!$('qBattle')) render(); }, err);
};
if(window.__plDb) window.questStart(window.__plDb.db, window.__plDb.err);
// no answer from the database yet: play from the copy saved on this device
setTimeout(()=>{ if(qLoaded) return; qLoaded=true; try{ const d=JSON.parse(localStorage.getItem('pl-quest')||'null'); Q=d?normQ(d):null; }catch(e){ Q=null; } render(); }, 2500);
window.SEAQUEST={HEROES,MONSTERS,ZONES,simulate,stageInfo,heroStats,monStats,get Q(){return Q;}, set Q(v){Q=v;}, render};
render();
})();
