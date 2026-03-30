declare module '@sabaki/sgf' {
  export function parse(sgf: string): any[];
}

declare module '@sabaki/go-board' {
  export default class Board {
    constructor(initial: number[][]);
    makeMove(player: number, position: [number, number]): Board;
    signMap: number[][];
  }
}

declare module '@sabaki/shudan' {
  export const Goban: any;
}
