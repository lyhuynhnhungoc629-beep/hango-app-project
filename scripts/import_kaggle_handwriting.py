"""
Script tải & trích lọc mẫu từ bộ dữ liệu Kaggle:
jkim289/handwritten-korean-characters (PE92 - 128,000 mẫu chữ viết tay tiếng Hàn)

Hướng dẫn chạy khi muốn tải thêm bộ ảnh gốc từ Kaggle:
1. Cài đặt thư viện: pip install kagglehub pillow
2. Chạy script: python scripts/import_kaggle_handwriting.py
"""

import os
import shutil
from pathlib import Path
import kagglehub


def main():
    print("Đang tải bộ dữ liệu jkim289/handwritten-korean-characters từ Kaggle...")
    dataset_path = Path(kagglehub.dataset_download("jkim289/handwritten-korean-characters"))
    print("Đường dẫn bộ dữ liệu đã tải:", dataset_path)

    output_dir = Path(__file__).resolve().parent.parent / "public" / "dataset" / "handwriting"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Mỗi thư mục con (mỗi chữ Hàn) chỉ trích lọc tối đa 3 ảnh mẫu đại diện để tối ưu dung lượng Web
    max_samples_per_char = 3
    exported_chars = 0

    for root, dirs, files in os.walk(dataset_path):
        image_files = [f for f in files if f.lower().endswith((".png", ".jpg", ".jpeg", ".bmp"))]
        if not image_files:
            continue

        char_label = Path(root).name
        target_char_dir = output_dir / char_label
        target_char_dir.mkdir(parents=True, exist_ok=True)

        for idx, img_name in enumerate(sorted(image_files)[:max_samples_per_char]):
            src = Path(root) / img_name
            dst = target_char_dir / f"sample_{idx + 1}{src.suffix.lower()}"
            shutil.copy2(src, dst)

        exported_chars += 1

    print(f"Hoàn tất! Đã trích lọc mẫu cho {exported_chars} lớp ký tự vào: {output_dir}")


if __name__ == "__main__":
    main()
