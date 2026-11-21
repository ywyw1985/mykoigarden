"""Render the multilingual JAS 0020 variety crosswalk and link the JNPA gallery index."""
from html import escape
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LANGS = ('en', 'zh', 'ja', 'es')
LANG_ATTR = {'en': 'en', 'zh': 'zh-Hans', 'ja': 'ja', 'es': 'es'}
CURRENT = 'https://www.maff.go.jp/j/jas/jas_standard/attach/pdf/index-536.pdf'
CHANGES = 'https://www.maff.go.jp/j/jas/jas_kikaku/attach/pdf/kokujikaisei-733.pdf'
PAST = 'https://www.famic.go.jp/english/jas/_doc/jas0020.pdf'
FAQ = 'https://jnpa.info/en/qa/'
OVERVIEW = 'https://jnpa.info/nishikigoi/'
ZNA = 'https://zna.jp/en/keep-nishikigoi/varieties-of-nishikigoi/'
CSV = '/assets/variety-atlas/jnpa-examples.csv'
SITE = 'https://mykoigarden.com'

# Romanized label, Japanese label, simplified Chinese label, cue in each locale.
TERMS = [
('Kohaku', '紅白', '红白', 'Red islands on a white ground.', '白色底上分布红斑。', '白地に緋斑が浮かぶ。', 'Manchas rojas sobre fondo blanco.'),
('Taisho Sanshoku (Sanke)', '大正三色', '大正三色', 'Red patches and black spots share a white ground.', '白底上同时出现红斑和黑斑。', '白地に緋と墨の両方がのる。', 'Rojo y negro destacan sobre un fondo blanco.'),
('Showa Sanshoku', '昭和三色', '昭和三色', 'Follow the continuous black between areas of red and white.', '顺着红、白色块之间连成片的黑底看。', '緋と白の間に続く黒地をたどる。', 'El fondo negro asoma entre manchas blancas y rojas.'),
('Shiro Utsuri', '白写り', '白写', 'Broad white patches interrupt a black ground.', '大片白斑将黑色底分隔开。', '黒地の間に広がる白を見る。', 'Manchas blancas amplias interrumpen el fondo negro.'),
('Goshiki', '五色', '五色', 'Look between the red patches for the bluish mesh on the back.', '在两块红斑之间找背部的蓝灰色网纹。', '緋斑の合間に背中の青い網目が見える。', 'Entre las manchas rojas se distingue una malla azulada.'),
('A-ginrin', 'A銀鱗', 'A银鳞', 'Glittering scales on a Kohaku, Sanke or Showa pattern.', '在红白、大正或昭和的花纹上可见闪光鳞片。', '紅白・大正三色・昭和三色の柄に、光る鱗が並ぶ。', 'Escamas destellantes sobre un patrón Kohaku, Sanke o Showa.'),
('B-ginrin', 'B銀鱗', 'B银鳞', 'Reflective scales on another pattern, such as Goshiki.', '其他花纹上也可有闪光鳞，例如银鳞五色。', '五色など、A銀鱗の三品種以外に現れる銀鱗。', 'Escamas reflectantes en otros patrones, como Goshiki.'),
('Hikari-kawarigoi', '光り変わり鯉', '光变种鲤', 'Metallic forms outside the other specific groups, including Beni Kikokuryu.', '其他专类未涵盖的全身金属光泽型，例如红辉黑龙。', 'ほかの個別の分類に収まらず全身が光る。紅輝黒竜などが入る。', 'Formas de brillo metálico fuera de los grupos específicos, como Beni Kikokuryu.'),
('Kujaku', '孔雀', '孔雀', 'A metallic sheen covers the red markings and the netted ground.', '全身的金属光泽覆盖红斑和网纹底色。', '背の緋斑と浅黄地の両方に金属光沢がある。', 'El brillo metálico cubre el rojo y el fondo reticulado.'),
('Kawarigoi', '変わり鯉', '变种鲤', 'Other distinctive forms. Ochiba Shigure is an example in the standard.', '收纳其他具有特色的类型，标准举例包括落叶时雨。', 'ほかの分類に収まらない個性的な鯉。規格には落ち葉しぐれなどの例がある。', 'Otras formas distintivas. La norma cita Ochiba Shigure como ejemplo.'),
('Kumonryu', '九紋竜', '九纹龙', 'Sparse scales and cloudlike black areas whose outline can change.', '少鳞，云团般的黑斑轮廓可能变化。', '鱗が少なく、雲状の墨の形が変化することがある。', 'Pocas escamas y zonas negras nubosas cuyo contorno puede cambiar.'),
('Doitsugoi', 'ドイツ鯉', '德国锦鲤（德系）', 'Large areas of exposed skin with few scales.', '留意大面积裸露的皮肤和稀少的鳞片。', '鱗が少なく地肌が広く見える。', 'Grandes zonas de piel expuesta con pocas escamas.'),
('Hikari-moyo', '光り模様', '光模样', 'Metallic, patterned fish on a ground other than black. Kikusui is one example.', '底色为黑色以外的有斑纹光鲤，菊水即一例。', '黒以外の地に模様が出る光りもの。菊水が一例。', 'Patrón sobre fondo distinto del negro y brillo general. Un ejemplo es Kikusui.'),
('Koromo', '衣', '衣', 'Dark crescents on the scales within the red patches.', '细看红斑内鳞片尖端的深色半月纹。', '緋斑の鱗先に現れる藍色や黒の半月を見る。', 'Medias lunas oscuras en las escamas de las zonas rojas.'),
('Tancho', '丹頂', '丹顶', 'Locate the round crown marking. Tancho Kohaku is the illustrated example.', '辨认头顶的圆斑。标准配图展示丹顶红白。', '頭部の円い斑が目印。規格の写真は丹頂紅白。', 'Busca la marca circular de la cabeza. La norma ilustra un Tancho Kohaku.'),
('Hikari-utsuri', '光り写り', '光写', 'Utsuri-type black ground and an all-over metallic sheen.', '写鲤式黑底上带斑纹，全身有金属光泽。', '写り墨が見える黒地に全身の光沢が重なる。', 'Fondo negro de tipo Utsuri con brillo metálico general.'),
('Hikari-muji', '光り無地', '光无地', 'One main body colour with metallic lustre, as in Platinum Ogon.', '单一主色配合金属光泽，白金黄金是一个例子。', '無地に全身の光沢。プラチナ黄金などが代表例。', 'Predomina un solo color con lustre metálico, como en Platinum Ogon.'),
('Shusui', '秋翠', '秋翠', 'Asagi colour with Doitsu scaling. Look for exposed skin along the sides.', '浅黄色系搭配德国鲤的少鳞特征，看两侧裸露的皮肤。', '浅黄の色合いにドイツ鯉の鱗の付き方。体側の地肌を見る。', 'Coloración Asagi con escamas de tipo Doitsu y piel visible en los flancos.'),
('Asagi', '浅黄', '浅黄', 'Blue mesh across the back, often with red low on the sides.', '背上有蓝色网纹，腹侧常可见红色。', '背は青い網目、腹側には緋が出ることが多い。', 'Malla azul en el dorso y, a menudo, rojo hacia el vientre.'),
('Bekko', 'べっ甲', '别甲', 'Separated black spots on a white, red or yellow body.', '白、红或黄底上分布独立黑斑。', '白・赤・黄の地に点状の墨がのる。', 'Manchas negras separadas sobre un cuerpo blanco, rojo o amarillo.'),
('Hi Utsuri / Ki Utsuri', '緋写り・黄写り', '绯写／黄写', 'Black ground broken by red in Hi Utsuri, yellow in Ki Utsuri.', '黑底上配绯红色斑为绯写，配黄色斑为黄写。', '黒地に緋が出れば緋写り、黄が出れば黄写り。', 'Sobre fondo negro, Hi Utsuri lleva rojo y Ki Utsuri amarillo.'),
('Muji', '無地', '无地', 'One uninterrupted body colour. The standard illustrates a yellow Kigoi.', '全身为单一底色；标准用黄色的黄鲤作例。', '体に斑紋がない。規格の写真は一色の黄鯉。', 'Un color continuo. La norma lo ilustra con un Kigoi amarillo.'),
]

TEXT = {
    'title': ('How Japan classifies koi varieties', '日本怎样给锦鲤品种分类？', '錦鯉の品種名と日本農林規格', 'Cómo se clasifican las variedades de koi en Japón'),
    'description': ('Compare all 22 variety entries in JAS 0020:2026 with the 2022 edition, breeder names and show classes.', '查阅日本农业规格 2026 年版的全部 22 项品种术语，对照旧版编号、常见名称与赛会分组。', 'JAS 0020の2026年版にある22の品種用語を、旧番号、具体的な品種名、品評会の区分と照らし合わせて読めます。', 'Consulta las 22 entradas de JAS 0020:2026, su numeración anterior, los nombres de los criadores y las clases de concurso.'),
    'atlas': ('Variety atlas', '品种名称图鉴', '品種名図鑑', 'Atlas de variedades'),
    'count': ('How many koi varieties are there?', '锦鲤到底有多少个品种？', '錦鯉の品種はいくつある？', '¿Cuántas variedades de koi hay?'),
    'countCopy': ('The All Japan Nishikigoi Promotion Association describes over 150 varieties in its Japanese introduction. Its English FAQ says over 140 and notes that new varieties appear almost every year. Both are lower bounds. An exact world total would require a single rule for counting every named form.', '全日本锦鲤振兴会在日文介绍中说已有 150 多种，英文问答则说有 140 多种，并提到几乎每年都有新品种。两种说法给的都是下限。要报出精确总数，还得先约定哪些细分名称算作独立品种。', '全日本錦鯉振興会の日本語の紹介では150品種を超えるとされ、英語のQ&Aでは140品種以上、ほぼ毎年新品種が登場すると説明しています。いずれも下限を示す表現です。細分した名称をどこまで数えるかによって合計は変わります。', 'La asociación japonesa de promoción del nishikigoi habla de más de 150 variedades en su introducción japonesa y de más de 140 en sus preguntas frecuentes en inglés. Allí indica que casi cada año aparecen variedades. Un total exacto exigiría acordar qué formas con nombre propio se cuentan por separado.'),
    'intro': ('Japanese introduction', '振兴会日文介绍', '振興会の日本語版', 'Introducción en japonés'),
    'faq': ('English FAQ', '振兴会英文问答', '英語版Q&A', 'Preguntas frecuentes en inglés'),
    'show': ('Show classes combine named forms. The promotion association’s FAQ describes 22 classes, while Zen Nippon Airinkai lists 17 basic classes and additional classes for male koi. Use the entry rules of the particular show.', '品评会会把许多名称归入同一组。振兴会的问答介绍 22 类；全日本爱鳞会另列 17 个基本组，并设雄鱼附加组。要报名时，应看具体赛会的规程。', '品評会では多くの品種名が一つの審査区分に入ります。振興会のQ&Aは22区分、全日本愛鱗会の案内は基本17区分と雄鯉の追加区分を挙げています。出品の際は各大会の要項を確認してください。', 'Los concursos agrupan nombres en clases. La asociación promotora menciona 22 clases, mientras que Zen Nippon Airinkai enumera 17 básicas y clases adicionales para machos. Conviene consultar el reglamento de cada concurso.'),
    'zguide': ('ZNA show classes', '爱鳞会赛会分组', '全日本愛鱗会の区分', 'Clases de la ZNA'),
    'edition': ('What changed in 2026?', '2026 年改了什么？', '2026年の改正点', '¿Qué cambió en 2026?'),
    'change': ('On 30 September 2026, the Japanese Ministry of Agriculture, Forestry and Fisheries revised JAS 0020. The variety section now has 22 numbered entries, up from 21. Beni Kikokuryu illustrates the new metallic Hikari-kawarigoi entry (2008). Ochiba Shigure remains an example of Kawarigoi, now 2010. The English PDF of the 2022 edition uses the old numbering.', '2026 年 9 月 30 日，日本农林水产省修订 JAS 0020，品种术语由 21 项增为 22 项。红辉黑龙是新增「光变种鲤」（2008）的例子。落叶时雨仍属「变种鲤」，新版编号为 2010。英文版 2022 年 PDF 使用旧编号。', '2026年9月30日のJAS改正で、品種用語が21項目から22項目になりました。新設の「光り変わり鯉」（2008）には紅輝黒竜が含まれ、落ち葉しぐれは「変わり鯉」（新番号2010）の例です。2022年版の英訳を参照するときは、旧番号で探せます。', 'El 30 de septiembre de 2026 el ministerio japonés de agricultura revisó JAS 0020. La sección pasó de 21 a 22 entradas. Beni Kikokuryu es un ejemplo del nuevo grupo metálico Hikari-kawarigoi (2008). Ochiba Shigure sigue en Kawarigoi, ahora con el número 2010. El PDF inglés de 2022 conserva los números anteriores.'),
    'standard': ('2026 standard (Japanese PDF)', '2026 年标准全文（日文 PDF）', '2026年版の規格本文（PDF）', 'Norma de 2026 (PDF en japonés)'),
    'diff': ('Official amendment table', '农林水产省新旧对照表', '農林水産省の新旧対照表', 'Cuadro oficial de cambios'),
    'old': ('2022 English edition (PDF)', '2022 年版英文参考译本（PDF）', '2022年版の英訳（PDF）', 'Traducción inglesa de 2022 (PDF)'),
    'table': ('The 22 JAS variety entries', 'JAS 的 22 项品种术语', 'JASの品種用語22項目', 'Las 22 entradas de variedades del JAS'),
    'how': ('Read the current code in the first column and the 2022 code below it. The short cues describe what to look for. Open a gallery list to see the names that the promotion association illustrates.', '每行先给出新版编号，下方是 2022 年的旧编号。辨识要点用于看鱼。展开名录可以查振兴会图示中实际出现的具体名称。', '各行の先頭が現行番号で、その下が2022年版の番号です。見分け方を読み、一覧を開くと振興会の写真で使われている名称も確認できます。', 'La primera columna muestra el código vigente y debajo el de 2022. Las pistas ayudan a observar el pez. Despliega cada lista para ver los nombres que ilustra la asociación promotora.'),
    'code': ('JAS code', 'JAS 编号', 'JAS番号', 'Código JAS'),
    'label': ('Name', '名称', '品種名', 'Nombre'),
    'clue': ('What to look for', '辨识要点', '見分け方', 'En qué fijarse'),
    'new': ('New in 2026', '2026 新增', '2026年新設', 'Nueva en 2026'),
    'rows': ('Names in the JNPA gallery', '振兴会图示名称', '振興会の写真に登場する名前', 'Nombres de la galería JNPA'),
    'gallery': ('Open the source gallery', '查看该组原图名录', '振興会の図鑑を見る', 'Ver la galería original'),
    'split': ('The JNPA gallery below uses the earlier, combined Kawarigoi grouping. Its image labels can span the 2026 entries 2008 and 2010.', '下列振兴会图片沿用较早的「变种鲤」合并口径，图示名称可跨新版的 2008 和 2010 两项。', '下の写真一覧は従来の「変わり鯉」の括りに従っています。現在の2008と2010の両方にまたがる名称が含まれます。', 'La galería siguiente conserva el antiguo grupo conjunto Kawarigoi. Sus nombres pueden corresponder tanto a 2008 como a 2010 en la edición de 2026.'),
    'resources': ('Pictures and further reading', '查图与延伸阅读', '写真と関連資料', 'Fotografías y lecturas'),
    'resCopy': ('Annex A of the 2026 standard contains the reference photographs for all 22 entries. The association’s galleries give further examples, and its genealogy chart follows relationships among varieties. These links open the publishers’ resources for free viewing.', '2026 年版标准的附录 A 为这 22 项提供了参考照片。振兴会的品种图录可以看更多实例，系谱图可用来追踪品种间的渊源。下列原站资料可免费查阅。', '2026年版規格の附属書Aには全22項目の参考写真があります。振興会の品種別写真で個体を見比べ、系統図で品種のつながりをたどれます。いずれも公開元で無料閲覧できます。', 'El anexo A de la norma de 2026 contiene fotografías de las 22 entradas. Las galerías de la asociación ilustran más ejemplos y su genealogía permite explorar parentescos. Los recursos son de consulta gratuita en los sitios de origen.'),
    'album': ('Association photo directory', '振兴会品种图录', '振興会の品種写真', 'Directorio fotográfico'),
    'tree': ('Association genealogy chart', '振兴会锦鲤系谱图', '振興会の系統図', 'Genealogía de la asociación'),
    'download': ('Download the gallery name index (CSV)', '下载图示名称索引（CSV）', '写真名の索引をダウンロード（CSV）', 'Descargar el índice de nombres (CSV)'),
}


SEARCH = {
    'title': ('Find a name or code', '搜索品种名或编号', '品種名・番号で検索', 'Buscar un nombre o código'),
    'example': ('Try “Kigoi” or “2022”', '例如：黄鲤、Kigoi 或 2022', '例：黄鯉、Kigoi、2022', 'Por ejemplo, «Kigoi» o «2022»'),
    'clear': ('Clear', '清除', 'クリア', 'Borrar'),
    'rows': ('Matching JAS entries: {n}', '匹配的 JAS 条目：{n}', '該当するJAS項目：{n}', 'Entradas JAS que coinciden: {n}'),
    'hint': ('The 21 gallery pages supply {n} image headings, including the group headings. A label may describe a variety or its particular scales, colour or pattern.', '21 个图录页共有 {n} 个图示名称，包含各组标题。一个名称有时指品种，有时进一步描述鱼的鳞片、颜色或花纹。', '21の図鑑ページに載る写真の見出しは、各区分名を含めて{n}件です。品種を表す名前のほかに、鱗・色・模様の特徴を添えた名前もあります。', 'Las 21 galerías aportan {n} rótulos de imágenes, incluidos los nombres de grupo. Un rótulo puede nombrar una variedad o describir además sus escamas, color o patrón.'),
    'noResults': ('No matching name or code. Try a shorter spelling or clear the search.', '没有匹配的名称或编号，可以缩短关键词或清除搜索。', '一致する名前や番号がありません。短い名前で試すか、検索をクリアしてください。', 'No se encontró ese nombre o código. Prueba con una parte del nombre o borra la búsqueda.'),
}


def link(url, label):
    return f'<a href="{escape(url, quote=True)}">{escape(label)}</a>'


def prefix(lang):
    return '' if lang == 'en' else f'/{lang}'


def source_url(url, lang):
    segment = {'en': 'en/', 'es': 'en/', 'ja': '', 'zh': 'cn/'}[lang]
    return url.replace('jnpa.info/en/', 'jnpa.info/' + segment)


# The 2026 revision splits former code 2008, retains Kujaku as 2009,
# and shifts codes from Kumonryu onward by one.
def previous_code(code):
    if code == 2008:
        return None
    if code == 2010:
        return 2008
    return code - 1 if code >= 2011 else code


def render(lang, examples):
    idx = LANGS.index(lang)
    def t(key):
        return TEXT[key][idx]
    pre = prefix(lang)
    path = f'{pre}/koi-varieties/classification/'
    template = (ROOT / pre.strip('/') / 'koi-varieties/kumonryu/index.html').read_text()
    header = re.search(r'<header\b.*?</header>', template, re.S)[0].replace('/koi-varieties/kumonryu/', '/koi-varieties/classification/')
    footer = re.search(r'<footer\b.*?</footer>', template, re.S)[0]
    analytics = re.search(r'<!-- Google tag.*?</script>\s*<script>.*?</script>', template, re.S)[0]
    rows = []
    for code, (en, ja, zh, *cues) in enumerate(TERMS, start=2001):
        old = previous_code(code)
        names = f'{escape(en)}<small lang="ja">{escape(ja)}</small>'
        if lang in ('zh', 'ja'):
            names = f'{escape(zh if lang == "zh" else ja)}<small lang="en">{escape(en)}</small>'
        gallery = examples.get(str(old), {})
        detail = ''
        entries = gallery.get('names', [])
        if entries:
            gallery_lang = 'en' if lang == 'es' else lang
            items = []
            for item in entries:
                localized = item.get(gallery_lang) or item['en']
                name = f"{localized} · {item['en']}" if localized != item['en'] else localized
                aliases = ' '.join(item.values())
                items.append(f'<li data-jas-name="{escape(aliases,quote=True)}">{escape(name)}</li>')
            url = gallery.get('urls', {}).get(gallery_lang) or source_url(gallery['url'], lang)
            split = f'<p>{t("split")}</p>' if code == 2010 else ''
            detail = (f'<details><summary>{t("rows")} ({len(entries)})</summary>'
                      f'{split}<ul>{"".join(items)}</ul>{link(url, t("gallery"))}</details>')
        legacy = f'2022 · {old}' if old else t('new')
        search_terms = escape(' '.join([en, ja, zh, str(code)]), quote=True)
        rows.append(f'<tr id="jas-{code}" data-jas-entry="{search_terms}"><th scope="row"><a href="#jas-{code}">{code}</a><small>{legacy}</small></th>'
                    f'<td class="term">{names}</td><td>{escape(cues[idx])}{detail}</td></tr>')
    alts = '\n'.join(f'<link rel="alternate" hreflang="{LANG_ATTR[l]}" href="{SITE}{prefix(l)}/koi-varieties/classification/">' for l in LANGS)
    title, desc = escape(t('title')), escape(t('description'), quote=True)
    counts_links = ' · '.join([link(OVERVIEW, t('intro')), link(FAQ, t('faq')), link(ZNA, t('zguide'))])
    edition_links = ' · '.join([link(CURRENT, t('standard')), link(CHANGES, t('diff')), link(PAST, t('old'))])
    resources = [(CURRENT, t('standard')), (source_url('https://jnpa.info/en/nishikigoi/varieties/', lang), t('album')),
                 (source_url('https://jnpa.info/en/nishikigoi/genealogy/', lang), t('tree')), (CSV, t('download')),
                 (f'{pre}/koi-varieties/atlas/', t('atlas'))]
    res = ''.join(f'<li>{link(u,l)}</li>' for u,l in resources)
    atlas = link(f'{pre}/koi-varieties/atlas/', t('atlas'))
    jumps = ' · '.join(link(f'#{anchor}', t(key)) for anchor,key in [('codes','table'), ('editions','edition'), ('sources','resources')])
    count = sum(len(group['names']) for group in examples.values())
    search_hint = SEARCH['hint'][idx].format(n=count)
    search_label = escape(SEARCH['title'][idx])
    search_placeholder = escape(SEARCH['example'][idx], quote=True)
    search_status = escape(SEARCH['rows'][idx], quote=True)
    generated = f'''<!doctype html>
<html lang="{LANG_ATTR[lang]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | My Koi Garden</title><meta name="description" content="{desc}"><link rel="canonical" href="{SITE}{path}">
{alts}<link rel="alternate" hreflang="x-default" href="{SITE}/koi-varieties/classification/">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="article">
<meta property="og:url" content="{SITE}{path}"><meta name="theme-color" content="#1f3429"><link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/styles.css?v=20260927a"><link rel="stylesheet" href="/assets/variety-atlas/classification.css">
<script defer src="/app.js?v=20260927a"></script><script defer src="/assets/variety-atlas/classification.js"></script>{analytics}</head><body class="subpage">{header}
<main class="jas-guide"><article><header><p class="jas-breadcrumb">{atlas}</p><h1>{title}</h1><nav class="jas-jumps">{jumps}</nav></header>
<section><h2>{t('count')}</h2><p>{t('countCopy')}</p><p>{t('show')}</p><p class="jas-links">{counts_links}</p></section>
<section id="editions" class="jas-revision"><h2>{t('edition')}</h2><p>{t('change')}</p><p class="jas-links">{edition_links}</p></section>
<section id="codes"><h2>{t('table')}</h2><p>{t('how')}</p>
<p>{search_hint}</p><div class="jas-search" hidden><label for="jas-query">{search_label}</label>
<div><input type="search" id="jas-query" placeholder="{search_placeholder}"><button type="button">{SEARCH['clear'][idx]}</button></div>
<p role="status" data-jas-status="{search_status}"></p></div><p class="jas-empty" hidden>{SEARCH['noResults'][idx]}</p>
<table aria-label="{escape(t('table'),quote=True)}"><thead><tr><th scope="col">{t('code')}</th><th scope="col">{t('label')}</th><th scope="col">{t('clue')}</th></tr></thead><tbody>
{''.join(rows)}</tbody></table></section>
<section id="sources"><h2>{t('resources')}</h2><p>{t('resCopy')}</p><ul>{res}</ul></section>
</article></main>{footer}</body></html>
'''
    destination = ROOT / path.strip('/') / 'index.html'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(generated)


if __name__ == '__main__':
    file = ROOT / 'assets/variety-atlas/jnpa-examples.json'
    examples = json.loads(file.read_text())
    for lang in LANGS:
        render(lang, examples)
