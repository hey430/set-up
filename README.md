# Tracker

The agency's private dashboard. It runs on the agency's own computer and is built to bring Euka, Slack, Higgsfield and the brands' social accounts into one place.

## Where it stands

| Part | Status |
| --- | --- |
| Interface: Home, News, Brands, Post more, Tracker AI, Employees, Connections | Done |
| Local server with a database, so nothing is lost on reload or restart | Done |
| Sign-in, one-time sign-in links for employees, password change, sign out | Done |
| Permissions enforced by the server, not only hidden on screen | Done |
| Admin can preview what any employee sees (read-only) | Done |
| Higgsfield connection: the admin signs in once, Tracker reads the real balance and creates real videos | Built. Higgsfield's sign-in was checked against the real service; the rest was tested against a stand-in, so **the first real run on your computer is the final test** |
| Credit budget that makes a month of credits last | Done |
| Slack connection: reads the channels the admin chooses, shows them in News and on each brand's page, with a weekly activity summary | Built and tested against a stand-in for Slack. **The first run with your real workspace is the final test** |
| Euka connection | **Not connected yet.** Tracker starts with sample data, clearly labelled |
| Editing with MoviePy: opening caption, end card, music | Done. Runs on the Tracker computer and costs no credits |
| Video pipeline | The **video** and **editing** steps are real once Higgsfield is connected. Script, supervisor and posting are still placeholders, and say so on screen |
| Tracking how posted videos perform | **Not built yet.** See "Tracking posted videos" below for the plan |
| Tracker AI | **Prepared answers** to common questions until Claude is connected |

## Start Tracker

You need [Node.js](https://nodejs.org) version 22.13 or newer. For the editing step you also need [Python](https://www.python.org) with MoviePy (see "Editing" below); without it Tracker still runs and clips are used unedited.

On the computer that will host Tracker, open a terminal in this folder and run:

```bash
node server/server.js --office
```

It prints two addresses: one for that computer and one for the rest of the office network. Leave the terminal open; closing it stops Tracker.

To try it privately first, so only that computer can open it:

```bash
node server/server.js
```

### First time

1. Open the address in a browser. Tracker asks for your agency name, your name, email and a password. That creates the **admin** account.
2. Leave "Start with sample brands" ticked to look around with made-up data. Remove it later in **Connections → Remove sample data**.
3. Go to **Employees → Add employee**. Enter their details, then choose their brands and permissions. Tracker gives you a **sign-in link** to send them (it doesn't send email). The link works once, for 7 days, and lets them choose their own password.

### Everyday

- **Forgot password (employee):** the admin opens Employees and presses **Sign-in link** for that person.
- **Forgot password (admin):** on the host computer run the command below, then open the link it prints.

```bash
node server/server.js --reset-admin
```

- **See what an employee sees:** click your name at the bottom left, then pick a person. It is read-only.
- **Backups:** everything lives in the `data` folder. Copy that folder to back Tracker up.

## Connect Higgsfield

1. On the computer that runs Tracker, open `http://localhost:4400` (it must be `localhost`, not the office address) and sign in as the admin.
2. Go to **Connections → Connect Higgsfield**. You are sent to Higgsfield's own sign-in page. Tracker never sees your Higgsfield password.
3. After signing in you land back on Connections, which now shows your plan and real credit balance.

For the first real request, pick **Draft, 5 seconds, 1 variation** (5 credits) to confirm everything works before spending more.

Until Higgsfield is connected, video requests are **practice runs**: nothing is created and no credits are spent.

Finished videos are saved in `data/videos` and can be played and downloaded from the request. Posting to social accounts is not connected yet, so an approved video is downloaded and posted by hand.

## Connect Slack

Tracker reads Slack through a small Slack app that you create inside your own workspace. It only reads the channels you choose; it never posts.

**1. Create the Slack app** (once, by a Slack workspace admin)

1. Go to https://api.slack.com/apps and choose **Create New App → From a manifest**.
2. Pick your workspace, paste the manifest below, and create the app.
3. Press **Install to Workspace** and allow it.
4. Open **OAuth & Permissions** and copy the **Bot User OAuth Token**. It starts with `xoxb-`.

```yaml
display_information:
  name: Tracker
  description: Lets the agency's Tracker dashboard read the channels it is invited to.
features:
  bot_user:
    display_name: Tracker
    always_online: false
oauth_config:
  scopes:
    bot:
      - channels:read
      - channels:history
      - groups:read
      - groups:history
      - users:read
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

**2. Invite the app to each channel it should read.** In Slack, open the channel and type `/invite @Tracker`. It cannot read a channel it hasn't been invited to, including private ones.

**3. Connect it in Tracker.** On the computer that runs Tracker, open `http://localhost:4400`, go to **Connections**, paste the token in the Slack card and press **Connect Slack**. Tracker only accepts the token on that computer, so it never travels over the office network.

**4. Choose channels.** In **Connections → Slack channels**, tick the channels to read and choose who may see each one:

- **People with a brand:** employees who have that brand and the "Read News" permission see the channel's messages.
- **Admins only:** for internal channels. This is the default.

Tracker reads the last two weeks the first time, then checks every 10 minutes. Messages appear in **News** (with a "Slack this week" summary of how busy each channel and person was) and on each brand's page.

Until Claude is connected, messages are shown as written. Summaries and evaluations ("Scale it", "Watch", "Fix now") come with Claude.

Disconnecting makes Tracker forget the token and stop reading. Messages already collected stay in Tracker's database.

## Editing

After Higgsfield delivers a clip, Tracker can edit it with [MoviePy](https://github.com/Zulko/moviepy) on its own computer. Editing costs no credits. Post more offers:

- **Opening caption:** text on screen for the first 3 seconds.
- **End card:** the brand's name and a button such as "Shop now", added as 2 extra seconds.
- **Music:** a track mixed quietly under the clip's own sound.

The original clip is always kept; the request shows the edited version with a link to the original. If a clip can't be edited, the original is used and the request still finishes.

To set it up on the computer that runs Tracker, install Python, then:

```bash
pip install "git+https://github.com/Zulko/moviepy.git"
```

Restart Tracker afterwards. **Connections → Editing (MoviePy)** shows "Ready" when it is found.

- **Music:** put `.mp3` files in `data/music`. Only use music you have the rights to use in ads.
- **Your own font:** put one `.ttf` or `.otf` file in `data/fonts` and captions use it.

## Tracking posted videos

Not built yet. The plan, in order of how soon each part can work:

1. **TikTok Shop videos through Euka.** Euka already records views, likes, comments, items sold and sales for each of a brand's videos, per day. Tracker will read those for every brand and fill the Brands and Home pages with real numbers. This needs Euka access for Tracker itself (an API key or app connection from Euka).
2. **Matching Tracker's own videos.** When an approved video is posted, the employee pastes its link into the request. Tracker then follows that video's numbers and shows them on the request and in News.
3. **Instagram, YouTube and Facebook.** Each needs its own official connection (Meta for Instagram and Facebook, Google for YouTube), set up once per brand account by the admin. These take longer because Meta and TikTok review an app before it may read account statistics.

## The credit budget

Set up for a 600-credit plan; change it in **Connections → Credit budget**.

| Rule | Default | Why |
| --- | --- | --- |
| Budget against the real Higgsfield balance | on when connected | Credits are also spent directly in Higgsfield, outside Tracker |
| Weekly allowance | a fair share of what's left until renewal | Stops the month's credits going in the first week. Unused credits carry over |
| Admin reserve | 10% (60 credits) | Kept back for urgent re-dos. Only an admin can use it |
| Most one request can cost | 75 credits | One ad-quality 15-second video |
| Renewal day and monthly amount | read from your Higgsfield account when you connect | So the month matches your billing date |

An admin can go past the weekly pace and the per-request limit, but never past the real balance.

What a 15-second vertical video costs (prices read from Higgsfield on 12 Nov 2026; Tracker asks Higgsfield for the real price before every request):

| Quality | Credits | Videos from 600 credits |
| --- | --- | --- |
| Draft | 15 | 40 |
| Standard | 37.5 | 16 |
| Ad quality | 75 | 8 |

Shorter videos cost proportionally less. A new version of a video costs the same as the first.

## What each person can be given

See results · see ad spend and budgets · read News · request new videos · approve and publish · use Tracker AI, plus which brands they can see. Only the admin can add brands, manage employees and change connections.

News posts are written as text, so a post can mention results or spend. Only give "Read News" to people who may see that.

## Security notes

- Passwords are stored hashed, never as plain text. Five wrong tries lock that sign-in for a minute.
- Employees only ever receive the brands and numbers they were granted; the server strips the rest before sending.
- Removing an employee signs them out immediately.
- Tracker's Slack token is stored in the `data` folder too, and is never sent to anyone's browser. Slack messages are only sent to people allowed to see that channel.
- Tracker's access to Higgsfield is stored in the `data` folder on the host computer and is never sent to anyone's browser. Keep that folder private. **Disconnect** in Connections makes Tracker forget it.
- Tracker uses plain `http` on your office network. Use it on a network you trust, not on public Wi-Fi, and don't open its port to the internet.

## Files

| Path | What it is |
| --- | --- |
| `server/server.js` | The local server: pages, sign-in, and every action |
| `server/views.js` | Decides what each person is allowed to receive |
| `server/auth.js` | Passwords, sessions and sign-in links |
| `server/db.js` | The database (one file in `data/`) and the sample data loader |
| `server/pipeline.js` | The video request pipeline. Steps that are still placeholders are marked `LIVE` |
| `server/budget.js` | The credit budget rules and prices |
| `server/edit.py`, `server/editor.js` | The editing step (MoviePy) |
| `server/slack.js` | The Slack connection |
| `server/higgsfield.js`, `server/mcp.js` | The Higgsfield connection |
| `dashboard/` | The interface. `data.js` holds the sample data |
| `tests/` | Automated checks (below) |

Opening `dashboard/index.html` directly, without the server, still works as a no-login demo on sample data.

## Tests

```bash
npm test
```

Runs six checks: the server's sign-in and permission rules; the credit budget and the Higgsfield connection (against a stand-in for Higgsfield, so no credits are spent); the editing step on a real clip; the Slack connection (against a stand-in for Slack); the demo in a browser as every person; and the real server in a browser. The editing check needs Python with MoviePy and the two browser checks need Playwright.

## Next

1. **Higgsfield, deeper:** link each brand's products and photos so videos show the real product. (Higgsfield's own TikTok publishing can't be used from Tracker: it only works inside Higgsfield's chat apps and only for files hosted by Higgsfield.)
2. **Euka sync:** real brands, videos and results.
3. **Claude:** turns Slack messages and Euka results into summarised, evaluated News posts; also real scripts, supervisor checks and Tracker AI answers.
4. **Posting and tracking:** each brand's social accounts connected through the platform's official login. See "Tracking posted videos" above.
