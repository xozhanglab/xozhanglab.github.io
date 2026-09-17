#!/usr/bin/env python3
"""Render the Jekyll pages with jinja2 (mimicking the small liquid subset
used by the site) into preview/ so the pages can be served statically."""
import glob
import os
import re
import sys
import shutil

import jinja2
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(REPO, "preview")

PAGES = {
    "index.html": "/",
    "team.html": "/team.html",
    "publications.html": "/publications.html",
    "softwares.html": "/softwares.html",
    "404.html": "/404.html",
}


def preprocess(src: str) -> str:
    # {% assign x = ... %} -> {% set x = ... %}
    # Liquid whitespace-control markers ({%- -%}) are accepted too
    src = re.sub(r"\{%-?\s*assign\s+(\w+)\s*=\s*(.+?)\s*-?%\}", r"{% set \1 = \2 %}", src)
    # {% include head.html %} -> {% include 'head.html' %}
    src = re.sub(r"\{%\s*include\s+(\S+)\s*%\}", r"{% include '\1' %}", src)
    # site.data.X.size -> datalen('X')
    src = re.sub(r"site\.data\.(\w+)\.size", r"datalen('\1')", src)
    # | where: "key", "value" -> | where("key", "value")   (two arguments)
    src = re.sub(r'\|\s*where:\s*("[^"]*")\s*,\s*("[^"]*")', r'|where(\1, \2)', src)
    # | sort: "field" -> jinja sort(attribute='field')
    src = re.sub(r'\|\s*sort:\s*"([\w.]+)"', r"|sort(attribute='\1')", src)
    # | filter: "quoted arg"  (may contain % or |) -> | filter("quoted arg")
    src = re.sub(r'\|\s*(\w+):\s*("[^"]*")', r"|\1(\2)", src)
    # | filter: arg -> | filter(arg)
    src = re.sub(r"\|\s*(\w+):\s*([^|%}]+?)\s*(?=[%}|])", r"|\1(\2)", src)
    return src


class PreprocessLoader(jinja2.FileSystemLoader):
    def get_source(self, environment, template):
        try:
            source, filename, uptodate = super().get_source(environment, template)
        except jinja2.TemplateNotFound:
            source, filename, uptodate = super().get_source(
                environment, os.path.join("_includes", template)
            )
        return preprocess(source), filename, uptodate


def main():
    with open(os.path.join(REPO, "_config.yml")) as f:
        config = yaml.safe_load(f)

    data = {}
    data_dir = os.path.join(REPO, "_data")
    for fn in os.listdir(data_dir):
        if fn.endswith(".yml"):
            with open(os.path.join(data_dir, fn)) as f:
                data[fn[:-4]] = yaml.safe_load(f)

    env = jinja2.Environment(
        loader=PreprocessLoader(REPO),
        autoescape=False,
    )
    env.globals["datalen"] = lambda name: len(data.get(name) or [])

    def where_filter(seq, key, value):
        return [x for x in (seq or []) if str(x.get(key)) == str(value)]

    def markdownify(text):
        parts = [p.strip() for p in re.split(r"\n\s*\n", (text or "").strip()) if p.strip()]
        return "\n".join("<p>" + p + "</p>" for p in parts)

    env.filters.update(
        {
            "plus": lambda v, n: v + n,
            "minus": lambda v, n: v - n,
            "modulo": lambda v, n: v % n,
            "date": lambda v, fmt="%Y": "2026",
            "remove_first": lambda v, s: v.replace(s, "", 1),
            "split": lambda v, s: v.split(s),
            "markdownify": markdownify,
            "where": where_filter,
            # Liquid spellings that differ from Jinja's
            "downcase": lambda v: str(v).lower(),
            "upcase": lambda v: str(v).upper(),
            "strip": lambda v: str(v).strip(),
        }
    )

    # Rebuild in place: deleting the directory would break a running
    # preview_server, which holds the old inode.
    os.makedirs(OUT, exist_ok=True)
    for stale in glob.glob(os.path.join(OUT, "*.html")):
        os.remove(stale)

    for name in ("assets", "images"):
        link = os.path.join(OUT, name)
        if not os.path.islink(link):
            os.symlink(os.path.join(REPO, name), link)
    # root-level static files that GitHub Pages serves as-is
    for name in ("favicon.ico", "robots.txt", "sitemap.xml", "CNAME"):
        src = os.path.join(REPO, name)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(OUT, name))

    site = {"title": config["title"], "description": config["description"],
            "time": "2026", "data": data}

    for page_name, url in PAGES.items():
        with open(os.path.join(REPO, page_name)) as f:
            raw = f.read()
        # front matter becomes `page.*` in the templates, as Jekyll does
        page_vars = {"url": url}
        m = re.match(r"\A---\n(.*?)\n---\n", raw, flags=re.S)
        if m:
            page_vars.update(yaml.safe_load(m.group(1)) or {})
            raw = raw[m.end():]
        content = env.from_string(preprocess(raw)).render(site=site, page=page_vars)
        # wrap in the default layout like Jekyll does
        layout_tpl = env.get_template("_layouts/default.html")
        html = layout_tpl.render(site=site, page=page_vars, content=content)
        with open(os.path.join(OUT, page_name), "w") as f:
            f.write(html)
        print("rendered", page_name)


if __name__ == "__main__":
    sys.exit(main())
