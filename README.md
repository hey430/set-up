# Brand Room

An agency dashboard that runs locally. Pick a brand on the left to see:

- **Brand overview**: status, current goal, 30-day GMV, ad spend, ROAS, CTR, active creators and videos posted, each compared with the prior 30 days
- **GMV vs. ad spend chart** for the last 30 days
- **Latest Slack messages** from the brand's client channel
- **Recent ads**, filterable by Live / Paused / In review / Ended. Click an ad to open its full specs: format, length, aspect ratio, resolution, hook, CTA, placement, objective, audience, daily budget, product, and performance to date
- **Top products** and **account details** (client since, budget, budget used)

> Everything shown right now is **sample data**. No real brands, ads or numbers are included yet.

## Run it

Open `dashboard/index.html` in any browser. No install or login is needed.

To share a link on your local network instead, run this from the repo folder:

```bash
python3 -m http.server 8080 --directory dashboard
```

Then open http://localhost:8080.

## Files

| File | What it is |
| --- | --- |
| `dashboard/index.html` | The dashboard: layout, styling and behaviour |
| `dashboard/data.js` | All brands, ads, numbers and Slack messages (sample data for now) |
| `scripts/build-preview.py` | Builds a single-file copy for sharing as a web preview |

## Connecting Euka and Slack (next step)

The page only reads `dashboard/data.js`, so connecting real data means filling that file from the live sources. The plan:

1. A small sync script runs on a schedule, using **one agency-owned Euka key and one Slack bot token** stored in a local `.env` file.
2. It pulls brands, ads, specs and performance from Euka, and recent messages from each brand's Slack channel.
3. It writes them into `data.js` in the same shape as the sample file.

Because the keys are configured once by the agency, staff who open the dashboard never connect anything themselves. Keep the `.env` file out of git, and only install it on machines your team controls.
