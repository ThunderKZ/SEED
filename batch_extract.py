#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量处理目录下所有 HTML 文件：
  1. 备份原文件到 backup_YYYYMMDD_HHMMSS/
  2. 提取所有 base64 图片到 images/
  3. 替换为 {base_url}/images/xxx.png
  4. 直接覆盖原文件（保持文件名不变）

用法：
  python batch_extract.py 目录路径 域名前缀
  python batch_extract.py . https://seed-plot-sequence.speculumor.qzz.io
  python batch_extract.py . http://127.0.0.1:5500        # 本地测试

示例：
  python batch_extract.py ./SEED https://seed-plot-sequence.speculumor.qzz.io
"""

import re
import os
import sys
import shutil
import hashlib
import base64
from datetime import datetime


# ============================================================
# 正则：匹配两种 base64 格式
# ============================================================
BASE64_PATTERN = re.compile(
    r'data:image/([a-zA-Z0-9+.\-]+?)(?:;base64)?,([A-Za-z0-9+/=]+)'
)


def process_one_html(filepath, images_dir, base_url, stats):
    """
    处理单个 HTML 文件。返回 True 表示有改动，False 表示跳过。
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # 快速判断：没有 base64 就跳过
    if 'data:image/' not in html:
        return False

    original_size = len(html)

    # 全局去重表（跨文件共享）
    seen = stats['seen']

    def repl(m):
        stats['total_match'] += 1
        subtype = m.group(1).lower()
        b64_raw = m.group(2)

        # 去空白 + 补 padding
        b64 = re.sub(r'\s+', '', b64_raw)
        pad = (-len(b64)) % 4
        b64_padded = b64 + ('=' * pad) if pad else b64

        # MD5 命名
        md5 = hashlib.md5(b64_padded.encode('ascii')).hexdigest()[:16]

        # 标准化扩展名
        ext_map = {'jpeg': 'jpg', 'svg+xml': 'svg'}
        file_ext = ext_map.get(subtype, subtype)
        filename = f'img_{md5}.{file_ext}'
        img_path = os.path.join(images_dir, filename)

        # 去重：同一张图只保存一次
        if md5 not in seen:
            try:
                binary = base64.b64decode(b64_padded)
                with open(img_path, 'wb') as img_f:
                    img_f.write(binary)
                seen[md5] = filename
                stats['saved'] += 1
            except Exception as e:
                stats['failed'] += 1
                print(f'    ⚠️ 解码失败 (subtype={subtype}): {e}')
                return m.group(0)

        # 输出绝对 URL
        return f'{base_url}/images/{filename}'

    new_html = BASE64_PATTERN.sub(repl, html)

    # 没变化就跳过
    if len(new_html) == original_size:
        return False

    # 直接覆盖原文件（保持文件名）
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)

    new_size = len(new_html)
    saved_mb = (original_size - new_size) / 1024 / 1024
    print(f'    ✅ {os.path.basename(filepath)}  '
          f'{original_size/1024/1024:.2f}MB → {new_size/1024/1024:.2f}MB  '
          f'(节省 {saved_mb:.2f}MB)')
    return True


def main():
    if len(sys.argv) < 3:
        print('用法: python batch_extract.py 目录路径 域名前缀')
        print()
        print('示例:')
        print('  python batch_extract.py . https://seed-plot-sequence.speculumor.qzz.io')
        print('  python batch_extract.py . http://127.0.0.1:5500')
        sys.exit(1)

    root_dir = os.path.abspath(sys.argv[1])
    base_url = sys.argv[2].rstrip('/')

    if not os.path.isdir(root_dir):
        print(f'❌ 目录不存在: {root_dir}')
        sys.exit(1)

    # ===== 收集所有 HTML 文件 =====
    html_files = []
    for name in os.listdir(root_dir):
        if name.lower().endswith('.html'):
            html_files.append(os.path.join(root_dir, name))
    html_files.sort()

    if not html_files:
        print('❌ 目录下没有找到 .html 文件')
        sys.exit(1)

    print(f'📂 工作目录: {root_dir}')
    print(f'🔗 图片 URL 前缀: {base_url}/images/')
    print(f'📄 待处理 HTML: {len(html_files)} 个')
    for h in html_files:
        print(f'   - {os.path.basename(h)}')
    print()

    # ===== 备份 =====
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(root_dir, f'backup_{timestamp}')
    os.makedirs(backup_dir, exist_ok=True)
    for h in html_files:
        shutil.copy2(h, os.path.join(backup_dir, os.path.basename(h)))
    print(f'💾 已备份 {len(html_files)} 个文件到: {backup_dir}')
    print()

    # ===== 创建 images 目录 =====
    images_dir = os.path.join(root_dir, 'images')
    os.makedirs(images_dir, exist_ok=True)
    print(f'🖼️  图片输出目录: {images_dir}')
    print()

    # ===== 跨文件共享统计 =====
    stats = {
        'seen': {},          # md5 -> filename（跨文件去重）
        'total_match': 0,
        'saved': 0,
        'failed': 0,
    }

    # ===== 逐个处理 =====
    changed = 0
    skipped = 0
    print('🔍 开始处理...')
    for h in html_files:
        rel_name = os.path.basename(h)
        print(f'  📄 {rel_name}')
        try:
            if process_one_html(h, images_dir, base_url, stats):
                changed += 1
            else:
                skipped += 1
                print(f'    ⏭️  无 base64 图片，跳过')
        except Exception as e:
            print(f'    ❌ 处理失败: {e}')

    # ===== 汇总 =====
    print()
    print('=' * 60)
    print(f'📊 汇总')
    print(f'   处理 HTML:       {len(html_files)} 个')
    print(f'   有改动:          {changed} 个')
    print(f'   跳过:            {skipped} 个')
    print(f'   匹配 base64:     {stats["total_match"]} 处')
    print(f'   去重后保存图片:  {stats["saved"]} 张')
    print(f'   解码失败:        {stats["failed"]} 张')
    print(f'💾 备份:           {backup_dir}')
    print(f'🖼️  图片:           {images_dir}')
    print('=' * 60)
    print()
    print('下一步：')
    print('1. 用 TinyPNG (https://tinypng.com/) 压缩 images/ 里的图片')
    print('2. git add . && git commit && git push')
    print('3. 验证云端页面图片是否正常显示')
    print()
    print('⚠️ 如需回滚，从 backup 目录复制回原文件即可')


if __name__ == '__main__':
    main()