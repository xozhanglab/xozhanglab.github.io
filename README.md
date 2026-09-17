# Xiao-Ou Zhang Lab Website

Website of the Xiao-Ou Zhang Lab (Tongji University), built with Jekyll and
served by GitHub Pages at <https://xozhanglab.com>.

## Layout

```
index.html             home page (hero, welcome, research directions, hiring)
team.html              PI, current members, alumni
publications.html      publication list with search and year filter
softwares.html         software and databases
404.html               custom not-found page

_data/team.yml         lab members         (order in file = order on page)
_data/softwares.yml    software/databases  (order in file = order on page)
_data/publications.yml publications
_data/research.yml     research directions (order in file = order on page)
_data/alumni.yml       alumni table

_includes/             header, navigation, footer partials
_layouts/default.html  page shell that every page uses
assets/css/style.css   all styling (colours live in :root at the top)
assets/js/site.js      interactions: search, filters, nav, animations
assets/js/particles.js + app.js   particle background
images/                team photos, software screenshots, research figures
tools/                 local preview + content helpers (not published)
```

**There is no `order` field anywhere.** Items appear in the order they are
listed in the file, so to reorder something you move its block up or down.

## Adding a person

Append a block to `_data/team.yml`:

```yaml
- name: Jane Doe
  role: PhD Student          # optional — omit the line and no badge shows
  pic: /images/team/janedoe.jpg
  email: jane@tongji.edu.cn
  bio: |
    Jane earned her B.S. ... (Markdown: blank lines start a new paragraph,
    **bold** and [links](https://example.com) work)
```

Put the photo in `images/team/` first, ideally with the long edge around
400 px so the page stays fast.

## Adding software or a database

Append a block to `_data/softwares.yml`, inside the matching
`# ---- group ----` section:

```yaml
- name: ToolName
  type: Software          # Software or Database — shown as the card badge
  group: current          # current = made in the lab, earlier = the PI's earlier work
  img: /images/softwares/tool.jpg
  website: https://github.com/xozhanglab/tool
  description: |
    One or two sentences. HTML links are allowed, e.g.
    <a href="https://pubmed.ncbi.nlm.nih.gov/12345678">(Zhang et al., 2024)</a>.
```

Prepare the screenshot first: put it in `images/softwares/` with the long
edge around 520 px (twice the card's display width), so the page stays fast.
On macOS, `sips -Z 520 shot.png` does the resize without distorting it.

The card grid shows at most **three per row** on a wide screen (two below
900 px, one below ~640 px). A group with fewer entries just gets wider cards
instead of an empty slot, so a row is always full — no CSS changes needed.
Keeping a group to three entries fills the row exactly; five would wrap to 3 + 2.

## Adding a publication

Append an entry to `_data/publications.yml`:

```yaml
- title: "Paper title"
  authors: "Author A*, Author B, <b>Zhang XO</b>†"
  journal: "Nature Communications. 2026. DOI: 10.1038/xxxxx"
  doi: "10.1038/xxxxx"
  hot: true          # optional — highlights the entry
  abstract: "..."    # optional — revealed when the entry is clicked
```

The year filter chips and the journal badge are generated automatically from
`journal`, so the format of that line matters: keep it as
`Journal Name. Year, volume:pages. DOI: ...` with `". "` after the journal name.

## Research directions

`_data/research.yml` — one block per direction, shown in file order. Each has
`title`, `img` and `text`, plus `hot` on publications only.

## Local preview

Install Ruby and run:

```bash
bundle install
bundle exec jekyll serve
```

If Ruby/Jekyll is not available, `tools/` has a dependency-light alternative
that renders the same templates with Python (needs `jinja2` and `pyyaml`):

```bash
pip install jinja2 pyyaml
python3 tools/preview_build.py     # renders pages into preview/
python3 tools/preview_server.py    # serves them on http://127.0.0.1:8321
```

## Deployment

Push to `main`. GitHub Pages builds the site automatically and `CNAME` points
it at `xozhanglab.com`. Adding content only means editing files under `_data/`
and `images/` — nothing in `_config.yml` needs to change.
