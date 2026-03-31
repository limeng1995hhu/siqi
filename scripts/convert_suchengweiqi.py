#!/usr/bin/env python3
"""
转换速成围棋题库的SGF格式为本项目可用的格式

使用方法:
    python convert_suchengweiqi.py --input input.csv --output output.csv
"""

import argparse
import csv
import re
import sys
from pathlib import Path

try:
    import sgfmill
    from sgfmill import sgf, sgf_moves
except ImportError:
    print("错误: 需要安装 sgfmill 库")
    print("请运行: pip install sgfmill")
    sys.exit(1)


def parse_sgf(sgf_str):
    """解析SGF字符串"""
    # 清理SGF字符串 - 移除换行
    sgf_str = sgf_str.replace("\n", " ").replace("\r", "")
    # 确保首尾有括号
    if not sgf_str.startswith("("):
        sgf_str = "(" + sgf_str
    if not sgf_str.endswith(")"):
        sgf_str = sgf_str + ")"
    return sgf.Sgf_game.from_string(sgf_str)


def sgf_to_string(game):
    """将SGF游戏对象转换为字符串"""
    return game.serialise().decode("utf-8")


def extract_stem_from_comment(comment):
    """从原始注释中提取题干"""
    if not comment:
        return "请在棋盘上落子，解决这个死活题。黑先。"

    # 清理注释
    comment = comment.strip()
    # 移除多余的空格
    comment = re.sub(r"\s+", " ", comment)
    return comment


def convert_sgf(sgf_str):
    """
    转换单个SGF字符串

    转换内容:
    1. 提取原始注释作为 STEM
    2. 将正确答案节点标记为 PNS[T]
    3. 清理不必要的属性
    """
    try:
        game = parse_sgf(sgf_str)
        root = game.get_root()

        # 提取原始注释
        original_comment = ""
        if root.has_property("C"):
            original_comment = root.get("C")
            # 移除原始注释
            root.unset_property("C")

        # 创建新的注释，包含 STEM
        stem = extract_stem_from_comment(original_comment)
        new_comment = f"STEM:{stem}"
        root.set("C", new_comment)

        # 清理不必要的属性
        for prop in ["AP", "CA", "LB", "TR", "MULTIGOGM", "KEY", "CR", "SQ", "MA"]:
            if root.has_property(prop):
                root.unset_property(prop)

        # 处理主变化 - 将正确答案标记为 PNS[T]
        current_node = root
        while True:
            children = current_node.get_children()
            if not children:
                break
            current_node = children[0]

            # 如果是最后一个节点，添加 PNS[T]
            if not current_node.get_children():
                current_node.set("PNS", "T")

            # 清理该节点的注释（RIGHT:等）
            if current_node.has_property("C"):
                comment = current_node.get("C")
                if comment.startswith("RIGHT") or comment.startswith("RIGHT:"):
                    current_node.unset_property("C")

        return sgf_to_string(game)

    except Exception as e:
        print(f"警告: SGF转换失败: {e}")
        # 如果转换失败，尝试做最小处理
        try:
            game = parse_sgf(sgf_str)
            root = game.get_root()
            root.set("C", "STEM:请在棋盘上落子，解决这个死活题。黑先。")
            return sgf_to_string(game)
        except:
            return sgf_str


def convert_csv(input_path, output_path):
    """转换CSV文件"""
    input_path = Path(input_path)
    output_path = Path(output_path)

    print(f"读取文件: {input_path}")

    rows = []
    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)

    print(f"共 {len(rows)} 道题目")

    # 转换每一行
    converted_rows = []
    for i, row in enumerate(rows, 1):
        sgf_content = row.get("sgf_content", "")
        if sgf_content:
            converted_sgf = convert_sgf(sgf_content)
            row["sgf_content"] = converted_sgf
        converted_rows.append(row)
        if i % 100 == 0:
            print(f"已处理 {i}/{len(rows)} 道题目")

    # 写入输出文件
    print(f"写入文件: {output_path}")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(converted_rows)

    print("转换完成!")


def main():
    parser = argparse.ArgumentParser(description="转换速成围棋题库SGF格式")
    parser.add_argument(
        "--input",
        default="public/suchengweiqi.csv",
        help="输入CSV文件路径 (默认: public/suchengweiqi.csv)",
    )
    parser.add_argument(
        "--output",
        default="public/suchengweiqi_converted.csv",
        help="输出CSV文件路径 (默认: public/suchengweiqi_converted.csv)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="覆盖原文件而不是创建新文件",
    )

    args = parser.parse_args()

    if args.overwrite:
        args.output = args.input

    convert_csv(args.input, args.output)


if __name__ == "__main__":
    main()
