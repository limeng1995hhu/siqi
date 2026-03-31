declare module '@sabaki/sgf' {
  export function parse(sgf: string): any[];
}

declare module '@sabaki/go-board' {
  export default class Board {
    constructor(initial: number[][]);
    makeMove(player: number, position: [number, number]): Board;
    analyzeMove(player: number, position: [number, number]): {
      suicide: boolean;
      overwrite: boolean;
      ko: boolean;
      capturing: boolean;
    };
    signMap: number[][];
  }
}

declare module '@sabaki/shudan' {
  export const Goban: any;
}

interface ImportMetaEnv {
  BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
