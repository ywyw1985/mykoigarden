#!/usr/bin/env python3
"""Render the same photo collection and credits into the four static homepages."""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "assets/koi-photo-collection.json"
LANGUAGES = ("en", "zh", "ja", "es")
START = "<!-- home-photo-collection:start -->"
END = "<!-- home-photo-collection:end -->"

LABELS = {
    "heading": ["Koi in photographs", "锦鲤实拍图集", "錦鯉の写真集", "Los koi en fotografías"],
    "atlas": ["Variety atlas", "查看品种图鉴", "品種図鑑を見る", "Atlas de variedades"],
    "credits": ["Photo credit", "摄影与许可", "撮影者・ライセンス", "Créditos de la foto"],
    "note": [
        "Photos have been resized for the web. Some are cropped or rotated. Each image links to its photographer or original record and its license.",
        "照片经缩放，部分经过裁切或旋转。每张照片下方都可查看摄影者、原作和使用许可。",
        "写真はウェブ向けに縮小し、一部はトリミングや回転を行っています。各写真の撮影者、出典、ライセンスを確認できます。",
        "Las fotos se han redimensionado para la web y algunas están recortadas o giradas. Cada imagen indica su autor, la fuente y la licencia.",
    ],
    "cover": ["Cover photo", "封面摄影", "表紙の写真", "Foto de portada"],
    "info": ["About the photographs", "关于这些照片", "写真について", "Acerca de las fotografías"],
}
COVER_SOURCE = "https://unsplash.com/photos/a-school-of-colorful-koi-fish-swimming-in-dark-water-tO2TU8tJSBw"


def link(url, label, css_class=None):
    cls = f' class="{css_class}"' if css_class else ""
    return f'<a{cls} href="{escape(url, quote=True)}">{escape(label)}</a>'


def photo_card(photo, lang, index):
    locale = LANGUAGES[lang]
    prefix = "" if locale == "en" else "/" + locale
    url = escape(photo["img"], quote=True)
    thumb = escape(photo.get("thumb", photo["img"]), quote=True)
    title = photo["labels"][lang]
    alt = photo.get("descriptions", photo["labels"])[lang]
    dest = prefix + photo["guide"] if photo.get("guide") else ""
    attr = f' data-variety-url="{escape(dest, quote=True)}"' if dest else ""
    caption = link(dest, title) if dest else escape(title)
    img = (f'<img loading="lazy" decoding="async" width="{photo["width"]}" height="{photo["height"]}"'
           f' src="{thumb}" alt="{escape(alt, quote=True)}">')
    if index >= 30:
        img = f'<template class="kpc-thumb">{img}</template><noscript>{img}</noscript>'
    credit = (
        f'<small class="kpc-credit"><span class="kpc-author">{escape(photo["author"])}</span> · '
        f'{link(photo["source"], photo["title"], "kpc-source")} · '
        f'{link(photo["licenseUrl"], photo["license"], "kpc-license")}</small>'
    )
    return (
        f'        <figure class="kpc-card" data-category="{escape(photo["category"], quote=True)}"{attr}>'
        f'<a class="kpc-image" href="{url}">{img}</a><figcaption>'
        f'<strong class="kpc-title">{caption}</strong><details><summary>{LABELS["credits"][lang]}</summary>'
        f'{credit}</details></figcaption></figure>'
    )


def gallery(photos, lang):
    locale = LANGUAGES[lang]
    prefix = "" if locale == "en" else "/" + locale
    title = LABELS["heading"][lang]
    guide_link = link(f"{prefix}/koi-varieties/atlas/", LABELS["atlas"][lang], "kpc-atlas")
    cover = link(COVER_SOURCE, "The neek") + " · " + link("https://unsplash.com/license", "Unsplash License")
    count = [f'{len(photos)} photographs', f'{len(photos)} 张实拍', f'全{len(photos)}枚', f'{len(photos)} fotografías'][lang]
    lines = [
        START,
        '      <section id="koi-photo-collection" aria-labelledby="collection-title">',
        '        <header class="kpc-header"><span id="koi-photo-gallery"></span><span id="pond-photo-gallery"></span><span id="all-koi-photos"></span>',
        f'          <h2 id="collection-title">{title}</h2>{guide_link}</header>',
        f'        <noscript><p>{count}</p></noscript>',
        '        <div class="kpc-grid">',
    ]
    lines.extend(photo_card(photo, lang, index) for index, photo in enumerate(photos))
    lines.extend([
        '        </div>',
        f'        <details class="kpc-notes" id="home-photo-credits"><summary>{LABELS["info"][lang]}</summary>'
        f'<p>{LABELS["note"][lang]}</p><p>{LABELS["cover"][lang]} · {cover}</p></details>',
        '      </section>',
        END,
    ])
    return "\n".join(lines)


def main():
    photos = json.loads(CATALOG.read_text(encoding="utf-8"))
    if len({p["img"] for p in photos}) != len(photos):
        raise ValueError("A photo appears more than once")
    for index, locale in enumerate(LANGUAGES):
        page = (ROOT if locale == "en" else ROOT / locale) / "index.html"
        text = page.read_text(encoding="utf-8")
        result, changes = re.subn(re.escape(START) + ".*?" + re.escape(END),
                                  lambda _: gallery(photos, index), text, flags=re.S)
        if changes != 1:
            raise ValueError(f"Expected one collection in {page}")
        if result != text:
            page.write_text(result, encoding="utf-8")


if __name__ == "__main__":
    main()
