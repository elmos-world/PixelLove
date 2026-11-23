# PixelLove: setup guide

This turns PixelLove into your own home-screen app that saves everything, syncs between your two phones and sends push notifications.

It takes about 30–45 minutes the first time. You only do it once.

## What's in this folder

| Folder or file | What it is |
|---|---|
| `site/` | The app itself. Everything in here goes on GitHub. |
| `site/config.js` | Where you paste your Firebase settings (steps 1 and 4). |
| `firebase/firestore.rules` | Keeps the app private to just your two emails (step 3). |
| `firebase/functions/` | The part that sends notifications (step 6). |

You'll start fresh here. Nothing from the Claude version carries over.

## 1. Create your Firebase project

1. Go to **console.firebase.google.com** and sign in with a Google account.
2. Click **Create a project** (or **Add project**). Name it something like `two-little-fish`. You can turn off Google Analytics.
3. On the project's home page, click the **web icon `</>`** to add a web app. Name it `PixelLove`. You don't need Firebase Hosting, because you're using GitHub.
4. Firebase shows you a block of code with `const firebaseConfig = { ... }`. Copy each value into `site/config.js`, replacing every `PASTE_...`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

   You can find these again any time under **Project settings** (the gear icon) → **General** → **Your apps**.

## 2. Turn on sign-in

1. In the left menu, go to **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Email/Password**, switch it **on**, and save.

## 3. Create the database and lock it to you two

1. Go to **Build → Firestore Database → Create database**. Choose a location near you and start in **production mode**.
2. Open the **Rules** tab and delete everything there.
3. Open `firebase/firestore.rules` from this folder and change the two example emails to **your two real emails, in lowercase**:
   ```
   ['you@example.com', 'him@example.com']
   ```
4. Paste the whole file into the Rules tab and click **Publish**.

These rules are what keep your app private. Anyone signing in with any other email can't see or change anything.

## 4. Get your notification key

1. Go to **Project settings** (the gear icon) → **Cloud Messaging**.
2. Under **Web configuration** → **Web Push certificates**, click **Generate key pair**.
3. Copy the long key into `site/config.js` where it says `PASTE_VAPID_KEY`.

## 5. Put the app on GitHub Pages

1. On GitHub, open your repository. Upload **everything inside the `site` folder**, not the folder itself, so `index.html` sits at the top level:
   - `index.html`
   - `config.js`
   - `manifest.webmanifest`
   - `firebase-messaging-sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`

   If you already uploaded the earlier `index.html`, replace it with this one.
2. Go to **Settings → Pages** and set **Source** to **Deploy from a branch**, with **main** and **/(root)**. Save. Your address will look like `https://yourname.github.io/two-little-fish/`.
3. Back in Firebase, go to **Authentication → Settings → Authorized domains**, click **Add domain**, and add `yourname.github.io` (your GitHub username, no `https://` and nothing after `.io`).

At this point the app works fully: you can sign in, and everything saves and syncs between you two. Step 6 adds the notifications.

## 6. Turn on the notification sender

The sender is a small program that runs on Google's servers. Firebase only allows that on its **Blaze (pay as you go)** plan, which needs a card on file. For two people, usage stays inside the free allowance, so it normally costs nothing. To be safe, set a budget alert of $1 when you upgrade.

1. In Firebase, click **Upgrade** (bottom-left) and choose **Blaze**. Add a budget alert.
2. On your computer, install **Node.js** (the "LTS" version) from nodejs.org.
3. Open a terminal (Terminal on Mac, Command Prompt on Windows) and run:
   ```
   npm install -g firebase-tools
   firebase login
   ```
4. In the `firebase` folder of this package:
   - In `.firebaserc`, replace `PASTE_PROJECT_ID` with your project ID (the same `projectId` as in step 1).
   - In `functions/.env`, set `APP_URL` to your GitHub Pages address, ending with `/`.
5. In the terminal, go into the `firebase` folder and run:
   ```
   cd functions
   npm install
   cd ..
   firebase deploy --only functions,firestore:rules
   ```
   The first deploy can take a few minutes. If it asks to enable any Google Cloud services, say yes.

### What sends a notification

| When this happens | Who gets it |
|---|---|
| A hug, kiss or "I miss you" | The other person |
| A new love note, photo or in-person date idea | The other person |
| A new song pick | The other person |
| Someone says goodnight | The other person |
| A message in a bottle washes up | The person it's for (checked every 10 minutes) |
| The pet hasn't been fed in 12 hours | Both of you |

## 7. Set it up on both phones

Each of you does this on your own phone:

1. Open your GitHub Pages address.
   - **iPhone:** use Safari. Tap **Share → Add to Home Screen**, then open the app **from the home screen icon**. iPhones only allow notifications for apps opened this way.
   - **Android:** use Chrome. Tap **⋮ → Add to Home screen** (or **Install app**).
2. Tap **New here? Create an account**. Use the same email you put in the rules, a password and your first name.
3. Tap the **gear** → **Turn on notifications**, then tap **Allow**.
4. Tap the **gear** → **Our details**. Fill in your names and set **Which one are you?**. Each of you picks your own side.

## The map and live location

The **Our map** card on the Home screen needs no extra setup.

- **Home pins:** search for a place or tap the map, then tap **Set my home here**. Once you've both set yours, it shows the miles between you.
- **Live location:** tap **Share my live location** and allow location access. Your pin updates about once a minute while the app is open. Phones don't let web apps share location in the background, so it pauses when the app is closed and shows when it was last updated. Tap **Stop sharing live location** to remove your live pin.
- **Privacy:** only the two emails in your Firestore rules can see your locations.

## If something isn't working

| What you see | What to do |
|---|---|
| "Almost there! Fill in config.js" | `config.js` still has a `PASTE_...` value. Fill it in and upload it again. |
| "This account isn't allowed in yet" | The email isn't in `firestore.rules`, or it has a capital letter. Fix it and click **Publish** again. |
| Sign-in fails with an error about the domain | Add `yourname.github.io` under **Authentication → Settings → Authorized domains**. |
| "On iPhone, add this app to your Home Screen first" | Open the app from the home screen icon, not from Safari. |
| No notifications arrive | Check that step 6 finished without errors, and that both of you turned on notifications in step 7. In Firebase, **Build → Functions → Logs** shows what happened. |
| A photo won't upload | Photos get shrunk automatically. Very unusual formats might not work, so try a regular screenshot or JPG. |

Your Firebase settings in `config.js` aren't secret, and it's fine that people can see them in a public GitHub repository. The rules from step 3 are what keep your data private.

## Home-screen widget (iPhone)

iPhones only allow widgets from App Store apps, so PixelLove's widget runs in **Scriptable**, a free App Store app. It shows your countdown, your person's time and mood weather, the song they picked, their latest love note, and how your pet fish is doing. Tap it to open PixelLove. It refreshes about every 15 minutes (iOS decides the exact timing).

1. Install **Scriptable** from the App Store.
2. On your phone, open `widget/pixellove-widget.js` in this repository on GitHub, tap the **⋯** or **Raw** button, and copy all of it.
3. Open Scriptable, tap **+**, paste, and name the script **PixelLove** (tap the title at the top).
4. Tap **▶** to run it once. Sign in with your PixelLove email and password. A preview of the widget appears. Your password isn't saved, only a sign-in token in your iPhone's Keychain.
5. Go to your home screen, press and hold an empty spot, tap **Edit → Add Widget**, pick **Scriptable**, choose the medium (or small) size and tap **Add Widget**.
6. Press and hold the new widget, tap **Edit Widget**, set **Script** to **PixelLove**, and set **When interacting** to **Open URL**. (It opens PixelLove.)

If the widget says to run the script to sign in, open Scriptable and tap ▶ on PixelLove again. Each of you sets it up on your own phone, so it shows the other person.
