import Papa from 'papaparse';
import { QuizQuestion, ParsedQuestion } from '../types';

export interface RawCSVRow {
  sgf: string;
  type: string;
  question: string;
  options: string;
  correctAnswer: string;
}

export const parseCSV = (csvContent: string): ParsedQuestion[] => {
  const results = Papa.parse<RawCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    trimHeaders: true,
  });

  if (results.errors.length > 0) {
    console.error('CSV parsing errors:', results.errors);
    throw new Error('CSV解析错误: ' + results.errors[0].message);
  }

  return results.data.map((row, index) => {
    const options = parseOptions(row.options);
    const correctAnswerIndex = parseCorrectAnswer(row.correctAnswer, options.length);

    return {
      id: index,
      sgf: row.sgf || '',
      type: row.type || 'TEXTCHOICE',
      question: row.question || '',
      options: options.map((opt, i) => ({
        id: i,
        text: opt,
        correct: i === correctAnswerIndex,
      })),
    };
  });
};

const parseOptions = (optionsStr: string): string[] => {
  if (!optionsStr) return [];

  try {
    const parsed = JSON.parse(optionsStr);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
  }

  return optionsStr.split(/[;|]/).map(s => s.trim()).filter(s => s.length > 0);
};

const parseCorrectAnswer = (answerStr: string, optionsCount: number): number => {
  if (!answerStr) return 0;

  const letterMatch = answerStr.match(/^([A-Z])$/i);
  if (letterMatch) {
    return letterMatch[1].toUpperCase().charCodeAt(0) - 65;
  }

  const num = parseInt(answerStr, 10);
  if (!isNaN(num) && num >= 0 && num < optionsCount) {
    return num;
  }

  return 0;
};

const escapeCSV = (value: string): string => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
};

export const generateSampleCSV = (): string => {
  const rows: string[][] = [
    ['sgf', 'type', 'question', 'options', 'correctAnswer'],
    [
      '(;GM[1]FF[4]SZ[19]GN[]DT[2026-03-28]PB[安安冲5]PW[hongxingmm]BR[1段]WR[1段]KM[375]HA[0]RU[Chinese]AP[GNU Go:3.8]RN[3]RE[W+R]TM[1200]TC[3]TT[60]AP[foxwq]RL[0];B[pd];W[pp];B[dc];W[cp];B[df];W[fq];B[nq];W[qn];B[jp];W[qf];B[pf];W[pg];B[of];W[qe];B[qd];W[pj];B[mc];W[ec];B[dd];W[kc]LB[hc:A][og:C][pr:B])',
      'TEXTCHOICE',
      '哪一手是9段的感觉？',
      '["A是9段的感觉", "B是9段的感觉", "C是9段的感觉"]',
      'A'
    ],
    [
      '(;GM[1]FF[4]SZ[19]GN[]DT[2026-03-28]PB[安安冲5]PW[hongxingmm]BR[1段]WR[1段]KM[375]HA[0]RU[Chinese]AP[Sabaki:0.52.2]RN[3]RE[W+R]TM[1200]TC[3]TT[60]RL[0]CA[UTF-8];B[pd];W[pp];B[dc];W[cp];B[df];W[fq];B[nq];W[qn];B[jp];W[qf];B[pf];W[pg];B[of];W[qe];B[qd];W[pj];B[mc];W[ec];B[dd];W[kc];B[kd];W[jd];B[ke];W[lc];B[md];W[dj];B[hc];W[ic];B[hb];W[hd]LB[gd:A][ib:B][je:C])',
      'TEXTCHOICE',
      '哪一手是9段的感觉？',
      '["A是9段的感觉", "B是9段的感觉", "C是9段的感觉"]',
      'A'
    ],
    [
      '(;GM[1]FF[4]SZ[19]GN[]DT[2026-03-28]PB[安安冲5]PW[hongxingmm]BR[1段]WR[1段]KM[375]HA[0]RU[Chinese]AP[Sabaki:0.52.2]RN[3]RE[W+R]TM[1200]TC[3]TT[60]RL[0]CA[UTF-8];B[pd];W[pp];B[dc];W[cp];B[df];W[fq];B[nq];W[qn];B[jp];W[qf];B[pf];W[pg];B[of];W[qe];B[qd];W[pj];B[mc];W[ec];B[dd];W[kc];B[kd];W[jd];B[ke];W[lc];B[md];W[dj];B[hc];W[ic];B[hb];W[hd];B[gd];W[ge];B[fd];W[je];B[he];W[id];B[hf];W[ib];B[gc];W[if]LB[gf:A][hg:B][lb:C])',
      'TEXTCHOICE',
      '哪一手是9段的感觉？',
      '["A是9段的感觉", "B是9段的感觉", "C是9段的感觉"]',
      'B'
    ],
    [
      '(;GM[1]FF[4]SZ[19]GN[]DT[2026-03-28]PB[安安冲5]PW[hongxingmm]BR[1段]WR[1段]KM[375]HA[0]RU[Chinese]AP[Sabaki:0.52.2]RN[3]RE[W+R]TM[1200]TC[3]TT[60]RL[0]CA[UTF-8];B[pd];W[pp];B[dc];W[cp];B[df];W[fq];B[nq];W[qn];B[jp];W[qf];B[pf];W[pg];B[of];W[qe];B[qd];W[pj];B[mc];W[ec];B[dd];W[kc];B[kd];W[jd];B[ke];W[lc];B[md];W[dj];B[hc];W[ic];B[hb];W[hd];B[gd];W[ge];B[fd];W[je];B[he];W[id];B[hf];W[ib];B[gc];W[if];B[kf];W[hg];B[gf];W[jg];B[ih];W[ig];B[gg];W[kg];B[lg];W[lh];B[mg];W[mb]LB[jb:C][mh:A][nb:B])',
      'TEXTCHOICE',
      '哪一手是9段的感觉？',
      '["A是9段的感觉", "B是9段的感觉", "C是9段的感觉"]',
      'B'
    ],
    [
      '(;GM[1]FF[4]SZ[19]GN[]DT[2026-03-28]PB[安安冲5]PW[hongxingmm]BR[1段]WR[1段]KM[375]HA[0]RU[Chinese]AP[Sabaki:0.52.2]RN[3]RE[W+R]TM[1200]TC[3]TT[60]RL[0]CA[UTF-8];B[pd];W[pp];B[dc];W[cp];B[df];W[fq];B[nq];W[qn];B[jp];W[qf];B[pf];W[pg];B[of];W[qe];B[qd];W[pj];B[mc];W[ec];B[dd];W[kc];B[kd];W[jd];B[ke];W[lc];B[md];W[dj];B[hc];W[ic];B[hb];W[hd];B[gd];W[ge];B[fd];W[je];B[he];W[id];B[hf];W[ib];B[gc];W[if];B[kf];W[hg];B[gf];W[jg];B[ih];W[ig];B[gg];W[kg];B[lg];W[lh];B[mg];W[mb];B[nb];W[lb];B[jb];W[ja];B[ka];W[ia];B[kb];W[hh];B[fi];W[mh];B[nh];W[ni];B[oh];W[pi]LB[mi:A][ph:B][pq:C])',
      'TEXTCHOICE',
      '哪一手是9段的感觉？',
      '["A是9段的感觉", "B是9段的感觉", "C是9段的感觉"]',
      'C'
    ],
  ];

  return rows.map(row => row.map(escapeCSV).join(',')).join('\n');
};
