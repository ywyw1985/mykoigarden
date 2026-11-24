#!/usr/bin/env python3
"""Render the same photo collection and credits into the four static homepages."""
from collections import defaultdict
from hashlib import sha256
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "assets/koi-photo-collection.json"
GROUPS = ROOT / "assets/koi-photo-groups.json"
LANGUAGES = ("en", "zh", "ja", "es")
START = "<!-- home-photo-collection:start -->"
END = "<!-- home-photo-collection:end -->"

LABELS = {
    "heading": ["Koi by variety", "按品种赏锦鲤", "品種別に見る錦鯉", "Koi por variedad"],
    "intro": [
        "Browse by variety, whether the photograph shows one koi or several. Pond scenes without a variety identification follow the named groups.",
        "先按品种看鱼，单尾和多尾同框的照片都收在相应组里。往后翻，还能看到未标明品种的锦鲤特写和池中群游。",
        "一匹の写真も何匹かで泳ぐ写真も、品種別に並べました。後半では、品種名の記録がない鯉の表情や群泳を紹介します。",
        "Explora cada variedad en fotos de uno o varios koi. Al final encontrarás detalles y escenas de grupo sin una variedad identificada.",
    ],
    "schools": ["Koi swimming together", "池中群游", "池を泳ぐ鯉の群れ", "Koi en grupo"],
    "group_note": {
        "observations": [
            "Portraits and close-ups of koi whose variety is unrecorded.",
            "这些照片没有确切的品种记录，可以近看鱼的眼、鳍、鳞片和水面倒影。",
            "品種名の記録がない鯉の表情や鰭、鱗、水面に映る姿を集めました。",
            "Retratos y primeros planos de koi cuya variedad no está documentada.",
        ],
        "schools": [
            "Pairs and schools in the pond, with no confirmed varieties recorded for the fish shown.",
            "这里收的是未能可靠分辨品种的同游场景，从两尾并游到满池锦鲤。",
            "二匹で並んで泳ぐ姿から池いっぱいの群れまで、品種を特定できない写真を集めました。",
            "Parejas y grupos que nadan en el estanque sin una identificación segura de sus variedades.",
        ],
    },
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


def group_section(group, photos, lang, offset):
    key = group["id"]
    kind = group.get("kind", "variety")
    group_id = {"observations": "koi-observations", "schools": "pond-photo-gallery"}.get(kind, f"koi-group-{key}")
    title_id = f"{group_id}-heading"
    text = escape(group["names"][lang])
    lines = [
        f'        <section class="kpc-group" id="{group_id}" data-kind="{kind}" data-variety-key="{key}"'
        f' style="--group-size:{len(photos)}" aria-labelledby="{title_id}">',
        f'          <h3 id="{title_id}">{text}</h3>',
    ]
    if kind in LABELS["group_note"]:
        lines.append(f'          <p class="kpc-group-note">{LABELS["group_note"][kind][lang]}</p>')
    lines.append('          <div class="kpc-group-grid">')
    lines.extend(photo_card(photo, lang, offset + index) for index, photo in enumerate(photos))
    lines.extend(['          </div>', '        </section>'])
    return lines


def gallery(by_group, groups, total, lang):
    locale = LANGUAGES[lang]
    prefix = "" if locale == "en" else "/" + locale
    title = LABELS["heading"][lang]
    guide_link = link(f"{prefix}/koi-varieties/atlas/", LABELS["atlas"][lang], "kpc-atlas")
    cover = link(COVER_SOURCE, "The neek") + " · " + link("https://unsplash.com/license", "Unsplash License")
    count = [f'{total} photographs', f'{total} 张实拍', f'全{total}枚', f'{total} fotografías'][lang]
    school_link = link("#pond-photo-gallery", LABELS["schools"][lang], "kpc-schools-link")
    lines = [
        START,
        '      <section id="koi-photo-collection" aria-labelledby="collection-title">',
        '        <header class="kpc-header"><span id="koi-photo-gallery"></span><span id="all-koi-photos"></span>',
        f'          <h2 id="collection-title">{title}</h2><p>{LABELS["intro"][lang]}</p>',
        f'          <div class="kpc-header-links">{guide_link} {school_link}</div></header>',
        f'        <noscript><p>{count}</p></noscript>',
        '        <div class="kpc-grid">',
    ]
    offset = 0
    for group in groups:
        photos = by_group[group["id"]]
        lines.extend(group_section(group, photos, lang, offset))
        offset += len(photos)
    lines.extend([
        '        </div>',
        f'        <details class="kpc-notes" id="home-photo-credits"><summary>{LABELS["info"][lang]}</summary>'
        f'<p>{LABELS["note"][lang]}</p><p>{LABELS["cover"][lang]} · {cover}</p></details>',
        '      </section>',
        END,
    ])
    return "\n".join(lines)


def version_assets(text):
    # The Worker marks static assets immutable. A content change needs a new URL.
    for ext in ("css", "js"):
        asset = f"assets/koi-photo-collection.{ext}"
        digest = sha256((ROOT / asset).read_bytes()).hexdigest()[:12]
        text = re.sub(re.escape("/" + asset) + r'(?:\?v=[\w-]+)?(?=")', f"/{asset}?v={digest}", text)
    return text


def main():
    photos = json.loads(CATALOG.read_text(encoding="utf-8"))
    if len({p["img"] for p in photos}) != len(photos):
        raise ValueError("A photo appears more than once")
    groups = json.loads(GROUPS.read_text(encoding="utf-8"))
    by_group = defaultdict(list)
    for photo in photos:
        by_group[photo["group"]].append(photo)
    keys = [group["id"] for group in groups]
    if set(keys) != set(by_group) or len(set(keys)) != len(keys):
        raise ValueError("Each photo must belong to exactly one named, nonempty group")
    if groups[-1].get("kind") != "schools":
        raise ValueError("Unidentified schools belong at the end of the gallery")
    for index, locale in enumerate(LANGUAGES):
        page = (ROOT if locale == "en" else ROOT / locale) / "index.html"
        text = page.read_text(encoding="utf-8")
        result, changes = re.subn(re.escape(START) + ".*?" + re.escape(END),
                                  lambda _: gallery(by_group, groups, len(photos), index), text, flags=re.S)
        if changes != 1:
            raise ValueError(f"Expected one collection in {page}")
        result = version_assets(result)
        if result != text:
            page.write_text(result, encoding="utf-8")
    worker = ROOT / "sw.js"
    original = worker.read_text(encoding="utf-8")
    versioned = version_assets(original)
    if versioned != original:
        worker.write_text(versioned, encoding="utf-8")


if __name__ == "__main__":
    main()
