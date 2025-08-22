declare module 'nodejieba' {
  interface KeywordResult {
    word: string;
    weight: number;
  }

  interface TagResult {
    word: string;
    tag: string;
  }

  interface LoadOptions {
    userDict?: string;
    dict?: string;
    hmmDict?: string;
    idfDict?: string;
    stopWordDict?: string;
  }

  export function load(options?: LoadOptions): void;
  export function cut(sentence: string, cutAll?: boolean): string[];
  export function cutHMM(sentence: string): string[];
  export function cutForSearch(sentence: string): string[];
  export function tag(sentence: string): TagResult[];
  export function extract(sentence: string, topN: number): KeywordResult[];
  export function insertWord(word: string, tag?: string): void;
  export function cutSync(sentence: string): string[];
}
