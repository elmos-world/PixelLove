/* Two Little Fish: sends a push notification to the other person when something happens. */
const {onDocumentCreated, onDocumentWritten} = require('firebase-functions/v2/firestore');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const APP_URL = (process.env.APP_URL || '').startsWith('https://') ? process.env.APP_URL : '';

async function nameOf(uid) {
  const s = (await db.doc('shared/settings').get()).data() || {};
  if (uid && s.sideA === uid && s.nameA) return s.nameA;
  if (uid && s.sideB === uid && s.nameB) return s.nameB;
  const u = uid ? (await db.doc('users/' + uid).get()).data() : null;
  return (u && u.name) || 'Your person';
}

/* Send to everyone except `fromUid` (pass null to send to both of you). */
async function notify(fromUid, title, body, tag) {
  const snap = await db.collection('pushTokens').get();
  for (const d of snap.docs) {
    if (fromUid && d.id === fromUid) continue;
    const tokens = (d.data().tokens || []).filter(Boolean);
    if (!tokens.length) continue;
    const webpush = {notification: {tag, renotify: true}};
    if (APP_URL) { webpush.notification.icon = APP_URL + 'icon-192.png'; webpush.fcmOptions = {link: APP_URL}; }
    const res = await admin.messaging().sendEachForMulticast({tokens, notification: {title, body: body || ''}, webpush});
    const dead = [];
    res.responses.forEach((r, i) => {
      const c = r.error && r.error.code;
      if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token' || c === 'messaging/invalid-argument') dead.push(tokens[i]);
    });
    if (dead.length) await d.ref.update({tokens: admin.firestore.FieldValue.arrayRemove(...dead)});
  }
}
const clip = (t, n = 90) => (t || '').length > n ? t.slice(0, n - 1) + '…' : (t || '');

exports.onHello = onDocumentCreated('taps/{id}', async e => {
  const d = e.data.data(); const n = await nameOf(d.by);
  const title = {hug: `${n} sent you a hug`, kiss: `${n} sent you a kiss`, miss: `${n} misses you`}[d.kind] || `${n} said hi`;
  await notify(d.by, title, 'Tap to send one back', 'hello');
});
exports.onNote = onDocumentCreated('notes/{id}', async e => {
  const d = e.data.data(); await notify(d.by, `${await nameOf(d.by)} left you a love note`, clip(d.text), 'note');
});
exports.onPhoto = onDocumentCreated('photos/{id}', async e => {
  const d = e.data.data(); await notify(d.by, `${await nameOf(d.by)} added a new memory`, clip(d.caption) || 'Come see the photo wall', 'photo');
});
exports.onIdea = onDocumentCreated('ideas/{id}', async e => {
  const d = e.data.data(); await notify(d.by, `${await nameOf(d.by)} added a date idea`, clip(d.text), 'idea');
});
exports.onSong = onDocumentWritten('songs/{uid}', async e => {
  const after = e.data.after.exists ? e.data.after.data() : null, before = e.data.before.exists ? e.data.before.data() : null;
  if (!after || (before && before.at === after.at)) return;
  await notify(e.params.uid, `${await nameOf(e.params.uid)} picked a song for you`, clip(after.title), 'song');
});
exports.onGoodnight = onDocumentCreated('nights/{uid}', async e => {
  await notify(e.params.uid, `${await nameOf(e.params.uid)} said goodnight`, 'Say it back before bed', 'night');
});
exports.onBottle = onDocumentCreated('bottles/{id}', async e => {
  await e.data.ref.update({notified: false}); // the schedule below delivers it when it washes up
});

/* Every 10 minutes: bottles that have washed up, and a hungry pet. */
exports.everyTenMinutes = onSchedule('every 10 minutes', async () => {
  const now = Date.now();
  const due = await db.collection('bottles').where('notified', '==', false).get();
  for (const b of due.docs) {
    const d = b.data();
    if ((d.deliverAt || 0) > now) continue;
    await b.ref.update({notified: true});
    await notify(d.by, 'A bottle washed up!', `${await nameOf(d.by)} sent you a message in a bottle`, 'bottle-' + b.id);
  }
  const petRef = db.doc('shared/pet'), pet = (await petRef.get()).data();
  if (pet && pet.fedAt && now - pet.fedAt > 12 * 3600e3 && (pet.hungryNotifiedAt || 0) < pet.fedAt) {
    await petRef.update({hungryNotifiedAt: now});
    await notify(null, `${pet.name || 'Your fish'} is hungry!`, 'Open the app to feed your fish', 'pet');
  }
});
