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
| Euka and Slack connections | **Not connected yet.** Tracker starts with sample data, clearly labelled |
| Video pipeline | The **video** step is real once Higgsfield is connected. Script, editing, supervisor and posting are still placeholders, and say so on screen |
| Tracker AI | **Prepared answers** to common questions until Claude is connected |

## Start Tracker

You need [Node.js](https://nodejs.org) version 22.13 or newer. Nothing else is installed.

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
| `server/higgsfield.js`, `server/mcp.js` | The Higgsfield connection |
| `dashboard/` | The interface. `data.js` holds the sample data |
| `tests/` | Automated checks (below) |

Opening `dashboard/index.html` directly, without the server, still works as a no-login demo on sample data.

## Tests

```bash
npm test
```

Runs four checks: the server's sign-in and permission rules; the credit budget and the Higgsfield connection (against a stand-in for Higgsfield, so no credits are spent); the demo in a browser as every person; and the real server in a browser. The two browser checks need Playwright.

## Next

1. **Higgsfield, deeper:** link each brand's products and photos so videos show the real product, and use Higgsfield's TikTok publishing.
2. **Euka and Slack sync:** real brands, videos and results, and the News agent writing real posts.
3. **Claude:** real scripts, supervisor checks and Tracker AI answers.
4. **Posting:** each brand's social accounts connected through the platform's official login.
