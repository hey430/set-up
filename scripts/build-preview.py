"""Build a single-file preview of the dashboard (data inlined, no html/head/body
wrappers) for publishing as a shareable web page."""
import pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent / "dashboard"
html = (root / "index.html").read_text()
data = (root / "data.js").read_text()

head = html.split("<!--PAGE-START-->")[1].split("<!--HEAD-END-->")[0]
body = html.split("<!--BODY-START-->")[1].split("<!--BODY-END-->")[0]
body = body.replace('<script src="data.js"></script>', "<script>\n" + data + "\n</script>")

out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "preview.html")
out.write_text(head.strip() + "\n" + body.strip() + "\n")
print("wrote", out)
