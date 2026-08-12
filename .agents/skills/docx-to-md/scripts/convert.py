#!/usr/bin/env python3
"""Конвертер .docx -> agent-friendly Markdown с картинками отдельными файлами.

Проблема: markitdown даёт хороший текст+таблицы, но картинки вырезает в битые
плейсхолдеры `![](data:image/png;base64...)` (или, с --keep-data-uris, инлайнит
гигантский base64, который агент всё равно не «видит» как изображение).

Решение: берём текст+таблицы у markitdown, вытаскиваем реальные картинки из
word/media/ и по порядку r:embed в word/document.xml подставляем ссылки на файлы
`![](media/imageN.png)`. На выходе: дешёвый MD (агент читает как текст) + папка
media (агент открывает нужный PNG через Read по требованию, получая изображение).

Использование:
    python3 convert.py <input.docx> <output_dir> [--markitdown-bin markitdown]

Требования: markitdown в PATH (pip install "markitdown[docx]").
"""
import argparse, re, shutil, subprocess, sys, tempfile, zipfile
from pathlib import Path

# XXE-безопасный парсер, если доступен; иначе stdlib (вход — доверенный локальный docx)
try:
    import defusedxml.ElementTree as ET  # type: ignore
except ImportError:
    import xml.etree.ElementTree as ET

PLACEHOLDER_RE = re.compile(r'!\[[^\]]*\]\(data:image[^)]*\)')


def slugify(name: str) -> str:
    """Имя подпапки из имени файла: пробелы/спецсимволы -> '-', без пробелов
    (иначе ссылки `![](media/.../imageN.png)` ломаются на пробеле)."""
    slug = re.sub(r'[^\w\-]+', '-', name.strip(), flags=re.UNICODE).strip('-')
    return slug or "media"


def build_ordered_media(docx: Path, out_media: Path):
    """Возвращает список имён media-файлов в порядке появления в теле документа
    и копирует все media в out_media."""
    with zipfile.ZipFile(docx) as z:
        doc_xml = z.read("word/document.xml")
        rels_xml = z.read("word/_rels/document.xml.rels")
        media_names = [n for n in z.namelist() if n.startswith("word/media/")]

        rid_to_media = {}
        for rel in ET.fromstring(rels_xml):
            rid, target = rel.get("Id"), rel.get("Target")
            if target and "media/" in target:
                rid_to_media[rid] = target.split("/")[-1]

        ordered = []
        for rid in re.findall(rb'r:embed="([^"]+)"', doc_xml):
            fn = rid_to_media.get(rid.decode())
            if fn:
                ordered.append(fn)

        out_media.mkdir(parents=True, exist_ok=True)
        for n in media_names:
            (out_media / n.split("/")[-1]).write_bytes(z.read(n))

        return ordered, len(media_names)


def main():
    ap = argparse.ArgumentParser(description="docx -> agent-friendly Markdown с картинками-файлами")
    ap.add_argument("docx", type=Path, help="исходный .docx")
    ap.add_argument("out_dir", type=Path, nargs="?", default=None,
                    help="папка результата (по умолчанию <имя-docx>-md рядом с исходником)")
    ap.add_argument("--markitdown-bin", default="markitdown", help="путь к markitdown (по умолчанию из PATH)")
    args = ap.parse_args()

    # Папку результата задаёт пользователь; по умолчанию — та же папка, где .docx
    out_dir = args.out_dir or args.docx.parent
    md_name = args.docx.stem + ".md"  # имя MD по имени исходника

    if not args.docx.is_file():
        sys.exit(f"Файл не найден: {args.docx}")
    if shutil.which(args.markitdown_bin) is None:
        sys.exit('markitdown не найден. Установите: pip install "markitdown[docx]"')

    out_dir.mkdir(parents=True, exist_ok=True)

    # 1) текст+таблицы через markitdown (плейсхолдеры картинок оставляем как есть)
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False) as tmp:
        tmp_md = Path(tmp.name)
    subprocess.run([args.markitdown_bin, str(args.docx), "-o", str(tmp_md)], check=True)
    md = tmp_md.read_text(encoding="utf-8")
    tmp_md.unlink(missing_ok=True)

    # 2) картинки + их порядок из docx; подпапка media по имени исходника
    media_subdir = slugify(args.docx.stem)
    media_rel = f"media/{media_subdir}"
    ordered, media_total = build_ordered_media(args.docx, out_dir / "media" / media_subdir)
    placeholders = PLACEHOLDER_RE.findall(md)

    print(f"Плейсхолдеров картинок в markitdown-MD : {len(placeholders)}")
    print(f"r:embed в document.xml (порядок)        : {len(ordered)}")
    print(f"Файлов в word/media всего               : {media_total}")
    if len(placeholders) != len(ordered):
        print("⚠️  Число плейсхолдеров ≠ числу r:embed — маппинг по порядку может"
              " быть неточным. Проверьте ссылки визуально (откройте пару PNG).")

    # 3) последовательная подстановка: i-й плейсхолдер -> i-й файл
    counter = {"i": 0}

    def repl(_m):
        i = counter["i"]; counter["i"] += 1
        if i < len(ordered):
            return f'![{media_rel}/{ordered[i]}]({media_rel}/{ordered[i]})'
        return '![НЕТ-СООТВЕТСТВИЯ]()'

    (out_dir / md_name).write_text(PLACEHOLDER_RE.sub(repl, md), encoding="utf-8")

    matched = min(len(placeholders), len(ordered))
    print(f"Заменено плейсхолдеров: {counter['i']} (сматчено с файлами: {matched})")
    print(f"Готово: {out_dir/md_name}  +  {out_dir/media_rel}/ ({media_total} PNG)")


if __name__ == "__main__":
    main()
