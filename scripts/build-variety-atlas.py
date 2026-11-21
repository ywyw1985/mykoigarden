#!/usr/bin/env python3
"""Render the public koi directory in the four site languages using its cited catalog."""
import hashlib
import json
import re
from collections import Counter
from html import escape
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets/variety-atlas"
SITE = "https://mykoigarden.com"
INTRO = "https://jnpa.info/nishikigoi/"
FAQ = "https://jnpa.info/en/qa/"
LANG = ("en", "zh", "ja", "es")
HTML_LANG = ("en", "zh-Hans", "ja", "es")

def asset_url(filename):
    digest = hashlib.sha256((DATA / filename).read_bytes()).hexdigest()[:12]
    return f"/assets/variety-atlas/{filename}?v={digest}"


# Array order matches the names and descriptions in entries.json.
COPY = {
    "title": ["Koi variety atlas", "锦鲤品种名录", "錦鯉品種名鑑", "Atlas de variedades de koi"],
    "intro": [
        "Look up a name from a show card or a breeder’s list. Compare the ground color, markings and scales that give each koi its name.",
        "看到鱼池边的铭牌或养鲤场的品种名，可以在这里查。读懂底色、斑纹和鳞片的差别，再对照容易混淆的名称。",
        "品評会の札や養鯉場で見かけた名前を引いてみましょう。地色・斑紋・鱗の特徴から、それぞれの名前の意味を読み解けます。",
        "Busca el nombre que viste en un concurso o en el catálogo de un criador. Compara el color de fondo, las marcas y las escamas que distinguen a cada koi."
    ],
    "home": ["Koi varieties", "锦鲤品种图鉴", "錦鯉の品種", "Variedades de koi"],
    "finder": ["Identify a koi by its markings", "按外观找品种", "模様から品種を探す", "Identificar un koi por sus marcas"],
    "directory": ["Browse the atlas", "查阅名录", "名鑑を引く", "Consultar el atlas"],
    "countTitle": ["How many koi varieties are there?", "锦鲤总共有多少个品种？", "錦鯉は何品種？", "¿Cuántas variedades de koi existen?"],
    "count1": [
        'The <a href="{intro}">All Japan Nishikigoi Promotion Association</a> describes more than 150 varieties. Its <a href="{faq}">English FAQ</a> gives a lower bound of 140 and describes 22 show classes.',
        '<a href="{intro}">全日本锦鲤振兴会的日文简介</a>称已有 150 多个品种。该会的<a href="{faq}">英文问答</a>写的是超过 140 种，并说明品评会按 22 个类别分组。',
        '<a href="{intro}">全日本錦鯉振興会の日本語の紹介</a>では、150を超える品種があるとされています。同会の<a href="{faq}">英語版のQ&amp;A</a>では140を超える品種があるとし、品評会では22の区分を使うと説明しています。',
        'La <a href="{intro}">Asociación Japonesa de Promoción del Nishikigoi</a> habla de más de 150 variedades. Sus <a href="{faq}">preguntas frecuentes en inglés</a> mencionan más de 140 y describen 22 clases para concursos.'
    ],
    "count2": [
        "A show class can contain several named forms. Traits can also occur across varieties. Ginrin, for example, describes the shine of individual scales. The atlas labels these entries separately.",
        "一个比赛类别可收纳多个有独立名称的品种，有些特征也会跨品种出现。例如“银鳞”指单片鳞的闪光。名录分别标出品种、类别和特征。",
        "品評会の一つの区分には、複数の品種が入ることがあります。銀鱗のような鱗の特徴は、さまざまな品種に現れます。本名鑑では品種名、分類名、特徴を区別して表示します。",
        "Una clase de concurso puede reunir varias formas con nombre propio. Algunos rasgos aparecen en distintas variedades. Ginrin, por ejemplo, describe el brillo de las escamas individuales. El atlas distingue estos tipos de entrada."
    ],
    "names": ["Name or keyword", "名称或关键词", "名前・キーワード", "Nombre o palabra clave"],
    "placeholder": ["Kohaku, 紅白, reticulation…", "红白、Showa、网纹…", "紅白、Showa、網目…", "Kohaku, 紅白, retícula…"],
    "group": ["Family or topic", "品系或主题", "系統・テーマ", "Familia o tema"],
    "kind": ["Entry type", "条目类型", "項目の種類", "Tipo de entrada"],
    "all": ["All", "全部", "すべて", "Todos"],
    "reset": ["Clear filters", "清除筛选", "条件をクリア", "Borrar filtros"],
    "none": ["No entries match. Try a shorter name or clear a filter.", "没有匹配条目。可以缩短关键词或清除筛选条件。", "該当する項目がありません。短い語で検索するか、条件を外してください。", "No hay coincidencias. Prueba con un nombre más corto o borra algún filtro."],
    "status": ["{n} of {total} entries", "显示 {n} 条，共 {total} 条", "全{total}項目中{n}項目を表示", "{n} de {total} entradas"],
    "part": ["Jump to a family or topic", "跳至品系或主题", "系統・テーマ別に移動", "Ir a una familia o tema"],
    "entrySource": ["Reference", "资料来源", "出典", "Fuente"],
    "profile": ["Read the guide", "阅读品种指南", "解説を読む", "Leer la guía"],
    "photo": ["Photograph", "照片", "写真", "Fotografía"],
    "converted": ["Resized and converted to WebP.", "经缩放并转为 WebP。", "サイズ調整後、WebPに変換。", "Imagen redimensionada y convertida a WebP."],
    "cropped": ["Cropped to the named specimen in Figure 1 and converted to WebP.", "从图 1 中裁出对应锦鲤，转为 WebP。", "図1から該当個体を切り出し、WebPに変換。", "Recorte del ejemplar indicado en la figura 1, convertido a WebP."],
    "resized": ["Resized and converted to WebP, original framing retained.", "等比缩放并转为 WebP，保留原构图。", "元の構図のまま縮小し、WebPに変換。", "Imagen redimensionada y convertida a WebP, con el encuadre original."],
    "access": ["Skip to catalog", "跳至名录", "名鑑の項目へ", "Saltar al catálogo"],
    "total": ["This edition", "本版收录", "この名鑑の収録数", "En esta edición"],
    "summary": [
        "{variety} named varieties or forms · {group} groups · {trait} traits",
        "{variety} 个具名品种或变型 · {group} 个类别 · {trait} 个特征",
        "品種・変種名 {variety} 件　分類 {group} 件　特徴 {trait} 件",
        "{variety} variedades o formas con nombre · {group} grupos · {trait} rasgos"
    ],
    "aliases": ["Also called", "也称", "別名・表記", "Otros nombres"],
    "classification": ["Compare the JAS classification and JNPA example names", "对照日本农业规格（JAS）分类和振兴会列举的品种名", "JASの分類と振興会の品種名例を照合", "Comparar las clases JAS y los nombres que recoge la JNPA"],
    "download": ["Download the atlas data (JSON)", "下载名录数据（JSON）", "名鑑データをダウンロード（JSON）", "Descargar los datos del atlas (JSON)"]
}
GROUPS = {
    "gosanke": ("Gosanke & Tancho", "御三家与丹顶", "御三家・丹頂", "Gosanke y Tancho"),
    "utsuri": ("Utsuri & Bekko", "写鲤与别甲", "写り・べっ甲", "Utsuri y Bekko"),
    "koromo": ("Koromo & Goshiki", "衣与五色", "衣・五色", "Koromo y Goshiki"),
    "metallic": ("Metallic koi", "金属光泽系", "光りもの", "Koi metálicos"),
    "ginrin": ("Ginrin scales", "银鳞", "銀鱗", "Escamas Ginrin"),
    "asagi": ("Asagi & Shusui", "浅黄与秋翠", "浅黄・秋翠", "Asagi y Shusui"),
    "kawari": ("Kawarigoi & other patterned koi", "变种鲤及其他花纹鲤", "変わり鯉・その他の模様鯉", "Kawarigoi y otros koi con patrón"),
    "muji": ("Single-color koi & related forms", "单色鲤与相近变型", "無地の鯉と関連品種", "Koi de color uniforme y formas afines"),
    "scales": ("Scales, markings & fin forms", "鳞片、纹理与鳍形", "鱗・模様・鰭の形", "Escamas, marcas y formas de aletas")
}
KINDS = {
    "variety": ("Named variety or form", "具名品种或变型", "品種・変種名", "Variedad o forma"),
    "group": ("Group", "类别", "分類", "Grupo"),
    "trait": ("Trait", "特征", "特徴", "Rasgo")
}
LINK_NAMES = {
    "jnpa.info": "JNPA",
    "zna.jp": "ZNA",
    "akjajudges.com": "AKJA",
    "famic.go.jp": "JAS 0020",
}

def prefix(lang):
    return "" if lang == "en" else "/" + lang

def options(values, i):
    return "".join(f'<option value="{key}">{escape(labels[i])}</option>' for key, labels in values.items())

def source_label(url):
    hostname = urlsplit(url).hostname or ""
    host = hostname.removeprefix("www.")
    return LINK_NAMES.get(host, host)

def credit(photo, i):
    link = f'<a href="{escape(photo["source"])}">{escape(photo["title"])}</a>'
    license_text = escape(photo["license"])
    if photo.get("licenseUrl"):
        license_text = f'<a rel="license" href="{escape(photo["licenseUrl"])}">{license_text}</a>'
    changes = photo.get("changes", "")
    if changes == "Scaled to fit and encoded as WebP; original framing retained.":
        changes = COPY["resized"][i]
    elif changes == "Resized and converted to WebP.":
        changes = COPY["converted"][i]
    elif changes == "Cropped to the named specimen in Figure 1 and converted to WebP.":
        changes = COPY["cropped"][i]
    parts = [link, escape(photo["author"]), license_text, escape(changes)]
    return f'<small class="at-credit">{COPY["photo"][i]} · {" · ".join(p for p in parts if p)}</small>'

def dimensions(photo):
    width, height = photo.get("width"), photo.get("height")
    return f' width="{int(width)}" height="{int(height)}"' if width and height else ""

def render_card(row, photo, i, parent):
    url = row["source"]
    localized = row["names"][i]
    roman = row["name"]
    international = [roman, row["names"][2]]
    alternates = list(dict.fromkeys(n for n in international if n and n != localized))
    subnames = f'<p class="at-other">{escape(" · ".join(alternates))}</p>' if alternates else ""
    aliases = list(dict.fromkeys(a for a in row["aliases"] if a and a not in [localized, *alternates]))
    visible_aliases = ", ".join(aliases)
    other_names = (f'<p class="at-aliases"><span>{COPY["aliases"][i]}</span> {escape(visible_aliases)}</p>'
                   if aliases else "")
    photo_markup = ""
    if photo:
        photo_markup = (f'<figure class="at-photo"><img src="{escape(photo["path"])}" alt="{escape(localized)}" '
                        f'loading="lazy" decoding="async"{dimensions(photo)}></figure>')
    guide = ""
    if row.get("guide"):
        href = parent + escape(row["guide"])
        guide = f'<a href="{href}">{COPY["profile"][i]}</a>'

    searchable = " ".join(dict.fromkeys([roman, *row["names"], *row["aliases"]]))
    entry_id = escape(row["id"])
    return f"""<article class="at-card" id="{entry_id}" data-entry data-kind="{row['kind']}" data-search="{escape(searchable)}">
{photo_markup}<div class="at-card-content"><p class="at-type at-type-{row['kind']}">{KINDS[row['kind']][i]}</p>
<h3><a href="#{entry_id}">{escape(localized)}</a></h3>{subnames}
<p class="at-cue">{escape(row['cue'][i])}</p>{other_names}
<div class="at-links">{guide}<a href="{escape(url)}">{COPY['entrySource'][i]} · {escape(source_label(url))}</a></div>
{credit(photo, i) if photo else ''}</div></article>"""

def hero_samples(entries, photos, i):
    if not photos:
        return ""
    by_id = {e["id"]: e for e in entries}
    recommended = ["tancho-showa", "gin-matsuba", "shiro-utsuri", "doitsu-showa", "asagi", "kohaku"]
    ids = [k for k in dict.fromkeys([*recommended, *photos]) if k in photos and k in by_id][:3]
    samples = []
    for entry_id in ids:
        photo = photos[entry_id]
        row = by_id[entry_id]
        samples.append(f"""<figure><a href="#{escape(entry_id)}"><img src="{escape(photo['path'])}" alt="" decoding="async"{dimensions(photo)}><span>{escape(row['names'][i])}</span></a>
<figcaption>{credit(photo, i)}</figcaption></figure>""")
    return '<div class="at-plate">' + "".join(samples) + "</div>"

def render(entries, photos, i):
    lang = LANG[i]
    strings = {k: v[i] for k, v in COPY.items()}
    root = prefix(lang)
    parent = root + "/koi-varieties/"
    route = parent + "atlas/"
    template = (ROOT / parent.strip("/") / "finder/index.html").read_text()
    analytics = template[template.index("<!-- Google tag"):template.index("</head>")]
    header = template[template.index("<header"):template.index("</header>") + len("</header>")]
    header = header.replace("/koi-varieties/finder/", "/koi-varieties/atlas/")
    footer = template[template.index("<footer"):template.index("</body>")]
    footer = footer.replace("/assets/fieldguide/finder.js", asset_url("atlas.js"))
    alternates = "\n".join(
        f'<link rel="alternate" hreflang="{hl}" href="{SITE}{prefix(lang)}/koi-varieties/atlas/">'
        for hl, lang in zip(HTML_LANG + ("x-default",), LANG + ("en",)))
    grouped = {g: [e for e in entries if e["group"] == g] for g in GROUPS}
    groups = {g: GROUPS[g] for g, members in grouped.items() if members}
    counts = Counter(row["kind"] for row in entries)
    topic_links = []
    sections = []
    for g, labels in groups.items():
        members = sorted(grouped[g], key=lambda row: (row["kind"] != "group", row["name"].casefold()))
        title = escape(labels[i])
        topic_links.append(f'<a href="#topic-{g}" data-topic-link="{g}">{title}</a>')
        cards = "\n".join(render_card(row, photos.get(row["id"]), i, parent) for row in members)
        sections.append(f'''<section class="at-group" data-topic="{g}" aria-labelledby="topic-{g}"><h2 id="topic-{g}">{title}</h2><div class="at-grid">{cards}</div></section>''')
    count_summary = strings["summary"].format(**{k: counts[k] for k in KINDS})
    status = strings["status"].format(n=len(entries), total=len(entries))
    title = escape(strings["title"])
    schema = {"@context": "https://schema.org", "@type": "CollectionPage", "name": strings["title"],
              "url": SITE + route, "inLanguage": HTML_LANG[i], "description": strings["intro"]}
    plate = hero_samples(entries, photos, i)
    share_image = (next(iter(photos.values()))["path"] if photos else "/assets/learning/challenge/kohaku.webp")
    html = f"""<!doctype html>
<html lang="{HTML_LANG[i]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | My Koi Garden</title><meta name="description" content="{escape(strings['intro'])}">
<link rel="canonical" href="{SITE}{route}">{alternates}
<meta property="og:type" content="website"><meta property="og:title" content="{title}"><meta property="og:description" content="{escape(strings['intro'])}">
<meta property="og:url" content="{SITE}{route}"><meta property="og:image" content="{SITE}{escape(share_image)}">
<link rel="icon" href="/favicon.ico"><meta name="theme-color" content="#16352c">
<link rel="stylesheet" href="/styles.css?v=20260927a"><link rel="stylesheet" href="{asset_url('atlas.css')}">
<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script>{analytics}</head><body class="subpage">
<a class="atlas-skip" href="#catalog">{strings['access']}</a>{header}<main class="atlas">
<div class="at-shell"><nav class="at-crumb" aria-label="{strings['home']}"><a href="{parent}">{strings['home']}</a> <span aria-hidden="true">/</span> {title}</nav>
<div class="at-hero{' at-hero-pictures' if plate else ''}"><div class="at-lead"><h1>{title}</h1><p>{strings['intro']}</p>
<div class="at-hero-links"><a class="at-primary" href="#catalog">{strings['directory']}</a><a href="{parent}finder/">{strings['finder']}</a></div></div>{plate}</div>
<aside class="at-count"><div><h2>{strings['countTitle']}</h2><p>{strings['count1'].format(intro=INTRO,faq=FAQ)}</p><p>{strings['count2']}</p><p><a href="{parent}classification/">{strings['classification']}</a></p></div>
<div class="at-edition"><h3>{strings['total']}</h3><p>{escape(count_summary)}</p></div></aside>
<section class="at-catalog" id="catalog" aria-labelledby="at-directory"><h2 id="at-directory">{strings['directory']}</h2>
<form class="at-form" data-filters hidden><label class="at-query">{strings['names']}<input type="search" name="q" maxlength="100" placeholder="{escape(strings['placeholder'])}"></label>
<label>{strings['group']}<select name="topic"><option value="">{strings['all']}</option>{options(groups,i)}</select></label>
<label>{strings['kind']}<select name="kind"><option value="">{strings['all']}</option>{options(KINDS,i)}</select></label>
<button type="reset">{strings['reset']}</button></form>
<nav class="at-topics" aria-label="{strings['part']}">{' '.join(topic_links)}</nav>
<p class="at-status" role="status" aria-live="polite" aria-atomic="true" data-total="{len(entries)}" data-template="{escape(strings['status'])}">{status}</p>
<div class="at-empty" hidden><p>{strings['none']}</p><button type="button" data-reset>{strings['reset']}</button></div>
{''.join(sections)}
<p class="at-download"><a href="{asset_url('entries.json')}" download="koi-variety-atlas.json">{strings['download']}</a></p></section></div>
</main>{footer}</body></html>
"""
    destination = ROOT / route.strip("/") / "index.html"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(html)

def main():
    entries = json.loads((DATA / "entries.json").read_text())
    media_manifest = DATA / "photos.json"
    photos = json.loads(media_manifest.read_text()) if media_manifest.exists() else {}
    ids = {row["id"] for row in entries}
    if not entries or len(ids) != len(entries):
        raise ValueError("The catalog must contain entries with unique IDs")
    for row in entries:
        if not re.fullmatch("[a-z0-9]+(?:-[a-z0-9]+)*", row["id"]) or row["id"].startswith("topic-"):
            raise ValueError(f"Invalid entry anchor: {row['id']}")
        if row["group"] not in GROUPS or row["kind"] not in KINDS or not row["source"].startswith("https://"):
            raise ValueError(f"Invalid group, type or source in {row['id']}")
        if any(len(row[field]) != len(LANG) or not all(row[field]) for field in ("names", "cue")):
            raise ValueError(f"Missing translation in {row['id']}")
    if photos.keys() - ids:
        raise ValueError(f"Unknown entry IDs for photos: {photos.keys() - ids}")
    for i in range(len(LANG)):
        render(entries, photos, i)
    print(f"Rendered {len(entries)} entries and {len(photos)} illustrated cards in {len(LANG)} languages.")

if __name__ == "__main__":
    main()
