declare module 'pinyin' {
  export interface PinyinOptions {
    style?: number;
    heteronym?: boolean;
    segment?: boolean | string;
    group?: boolean;
  }

  export interface STYLE {
    NORMAL: number;
    TONE: number;
    TONE2: number;
    TO3NE: number;
    INITIALS: number;
    FIRST_LETTER: number;
  }

  export const STYLE: STYLE;

  function pinyin(
    text: string,
    options?: PinyinOptions
  ): string[][];

  export default pinyin;
}
