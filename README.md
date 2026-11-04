# Tracker

The agency's private dashboard. It runs locally on the agency's own computers and brings Euka, Slack, Higgsfield and the brands' social accounts into one place.

> **Current stage: interface prototype.** Every screen works, but on **sample data**: no real brands, numbers or messages. The live connections are the next stage (see the roadmap below).

## What's in it

| Area | What it does | Who sees it |
| --- | --- | --- |
| **Home** | Combined results for all brands (GMV, spend, ROAS, CTR, creators, videos), a 30-day chart, share of GMV, brands needing attention. Scroll down for each brand's own results. | Everyone, limited to the brands they're allowed |
| **News** | A feed where the News agent posts what happened, read from Slack and Euka. Each post is labelled **Result** or **News**, carries the brand's name, and has an evaluation: *Scale it*, *Watch*, *Fix now* or *Update*. | People with "Read News" |
| **Brands** | A list of brands. Open one to see the videos running for it, with full specs for each video, posting accounts and video requests. | Everyone, limited to their brands |
| **Post more** | On a brand page. The employee describes the video they want, then four agents take over: the **Script agent** writes it, the **Higgsfield video agent** generates the clips, the **Editing agent** cuts it, and the **Supervisor agent** checks every step and reports live progress in the same place. The result is then approved and published, or sent back for changes. | People with "Request new videos"; publishing needs "Approve and publish" |
| **Tracker AI** | Chat button at the bottom right. Answers questions about brands, results, news and how to use the dashboard, within the asker's own permissions. | People with "Use Tracker AI" |
| **Employees** (admin) | Add employees in two steps. The admin must choose their brands and permissions before anyone is added. Edit permissions or remove people at any time. | Admin only |
| **Connections** (admin) | Slack, Euka, Higgsfield and Claude are connected once for everyone. Social accounts are connected per brand. | Admin only |
| **Add brand** | Only an admin can add brands. | Admin only |

Permissions an admin can grant: see results · see ad spend and budgets · read News · request new videos · approve and publish · use Tracker AI, plus which brands each person can see.

In the prototype, the **Viewing as** menu in the sidebar switches between people so you can show how the dashboard changes for each permission level.

## Run it

Open `dashboard/index.html` in a browser. Nothing to install.

Or serve it on the local network:

```bash
python3 -m http.server 8080 --directory dashboard
```

## Files

| File | What it is |
| --- | --- |
| `dashboard/index.html` | Layout and styling: black and purple theme, sidebar layout from the agency reference design, Inter font. Change the font in one place: `--font` at the top of the styles |
| `dashboard/app.js` | All screens and behaviour. Places where live services plug in are marked `LIVE:` |
| `dashboard/data.js` | Sample brands, videos, news, employees and accounts |
| `scripts/build-preview.py` | Builds a single-file copy for sharing as a web preview |

## Roadmap to the live version (still hosted locally)

1. **Local server.** A small server on the agency's machine (Node.js) with a local database (SQLite). It holds the employees, permissions, brands and video requests, and it checks permissions on every request, not just in the screen.
2. **Logins.** Each employee signs in with their invite. Admin rights stay with the owner.
3. **Euka and Slack sync.** One agency Euka key and one Slack bot token, stored only on the server in a `.env` file. They fill the brands, videos, specs and results, and feed the News agent.
4. **News agent.** Reads new Slack messages and Euka results on a schedule, writes the evaluation, and posts it to News.
5. **Video pipeline.** Script agent and supervisor run on Claude; the video agent calls the Higgsfield API; the editing agent assembles captions, music and end card. Every step reports back to the request's page.
6. **Social posting.** Admins connect each brand's TikTok, Instagram, YouTube and Facebook accounts through each platform's official login (OAuth). Employees never type social media passwords into Tracker.
7. **Tracker AI.** The chat button asks Claude with the dashboard's data, filtered to what the person is allowed to see.

Keep the `.env` file out of git and only install the server on machines the agency controls.
