# Haul House website

Static site: upload the contents of this `site/` folder to any host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, cPanel).

**Before going live:** set `SITE_URL` in `site-src/build.py` to your real domain and run `python3 site-src/build.py`.
That updates canonical URLs, social share tags, structured data, `sitemap.xml`, `robots.txt` and the RSS feed.

**Add a blog post:** copy a file in `site-src/posts/`, edit the `<!--meta ... -->` header and body, then re-run the build.

After launch: submit `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console, and test a page at https://search.google.com/test/rich-results.
