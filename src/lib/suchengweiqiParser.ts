import Papa from 'papaparse';
import type { SuchengWeiqiRow, SuchengWeiqiQuestion, DirectoryNode } from '../types';

export const parseSuchengWeiqiCSV = (csvContent: string): SuchengWeiqiQuestion[] => {
  const results = Papa.parse<SuchengWeiqiRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (results.errors.length > 0) {
    console.error('CSV parsing errors:', results.errors);
    throw new Error('CSV解析错误: ' + results.errors[0].message);
  }

  return results.data.map((row: SuchengWeiqiRow, index: number) => {
    const [chapter, subChapter] = splitChapter(row.chapter);
    return {
      id: index,
      book: row.book,
      volume: row.volume,
      chapter: chapter,
      subChapter: subChapter,
      questionNo: row.question_no,
      sgfContent: row.sgf_content,
    };
  });
};

const splitChapter = (chapter: string): [string, string] => {
  if (!chapter) return ['', ''];
  const parts = chapter.split('/');
  if (parts.length >= 2) {
    return [parts[0].trim(), parts[1].trim()];
  }
  return [parts[0].trim(), ''];
};

export const buildDirectoryTree = (questions: SuchengWeiqiQuestion[]): DirectoryNode[] => {
  const tree: DirectoryNode[] = [];
  const bookMap = new Map<string, DirectoryNode>();

  questions.forEach((question) => {
    // 找到或创建book节点
    let bookNode = bookMap.get(question.book);
    if (!bookNode) {
      bookNode = {
        name: question.book,
        type: 'book',
        children: [],
      };
      bookMap.set(question.book, bookNode);
      tree.push(bookNode);
    }

    // 找到或创建volume节点
    let volumeNode = bookNode.children?.find((child) => child.name === question.volume);
    if (!volumeNode) {
      volumeNode = {
        name: question.volume,
        type: 'volume',
        children: [],
      };
      bookNode.children?.push(volumeNode);
    }

    // 找到或创建chapter节点
    let chapterNode = volumeNode.children?.find((child) => child.name === question.chapter);
    if (!chapterNode) {
      chapterNode = {
        name: question.chapter,
        type: 'chapter',
        children: [],
      };
      volumeNode.children?.push(chapterNode);
    }

    // 找到或创建subChapter节点
    let subChapterNode = chapterNode.children?.find((child) => child.name === question.subChapter);
    if (!subChapterNode) {
      subChapterNode = {
        name: question.subChapter,
        type: 'subChapter',
        questions: [],
      };
      chapterNode.children?.push(subChapterNode);
    }

    // 添加题目到subChapter
    subChapterNode.questions?.push(question);
  });

  return tree;
};

export const loadSuchengWeiqiData = async (): Promise<SuchengWeiqiQuestion[]> => {
  const possiblePaths = [
    '/suchengweiqi.csv',
    './suchengweiqi.csv',
    'suchengweiqi.csv',
  ];

  for (const path of possiblePaths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const csvContent = await response.text();
        return parseSuchengWeiqiCSV(csvContent);
      }
    } catch (e) {
      // 继续尝试下一个路径
    }
  }

  throw new Error('Failed to load suchengweiqi.csv from all possible paths');
};
