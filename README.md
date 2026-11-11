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
| Euka, Slack and Higgsfield connections | **Not connected yet.** Tracker starts with sample data, clearly labelled |
| Video pipeline (script, Higgsfield video, editing, supervisor) | **Simulated.** Requests, approvals and history are real; no video is created or posted |
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

## What each person can be given

See results · see ad spend and budgets · read News · request new videos · approve and publish · use Tracker AI, plus which brands they can see. Only the admin can add brands, manage employees and change connections.

News posts are written as text, so a post can mention results or spend. Only give "Read News" to people who may see that.

## Security notes

- Passwords are stored hashed, never as plain text. Five wrong tries lock that sign-in for a minute.
- Employees only ever receive the brands and numbers they were granted; the server strips the rest before sending.
- Removing an employee signs them out immediately.
- Tracker uses plain `http` on your office network. Use it on a network you trust, not on public Wi-Fi, and don't open its port to the internet.

## Files

| Path | What it is |
| --- | --- |
| `server/server.js` | The local server: pages, sign-in, and every action |
| `server/views.js` | Decides what each person is allowed to receive |
| `server/auth.js` | Passwords, sessions and sign-in links |
| `server/db.js` | The database (one file in `data/`) and the sample data loader |
| `server/pipeline.js` | The video request pipeline. Each step that will call a real service is marked `LIVE` |
| `dashboard/` | The interface. `data.js` holds the sample data |
| `tests/` | Automated checks (below) |

Opening `dashboard/index.html` directly, without the server, still works as a no-login demo on sample data.

## Tests

```bash
npm test
```

Runs three checks: the server's sign-in and permission rules, the demo in a browser as every person, and the real server in a browser (setup, sign-in links, a video request, approval, restart, removal). The two browser checks need Playwright.

## Next

1. **Higgsfield:** the admin signs in once from Connections; the video step then creates real videos and the credits card shows the real balance.
2. **Euka and Slack sync:** real brands, videos and results, and the News agent writing real posts.
3. **Claude:** real scripts, supervisor checks and Tracker AI answers.
4. **Posting:** each brand's social accounts connected through the platform's official login.
