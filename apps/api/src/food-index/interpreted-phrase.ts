import type { InterpretedWord } from '@intake24/api/food-index/interpreted-word';

function countCombinations(words: Array<InterpretedWord>): number {
  return words.reduce((acc, next) => acc * next.interpretations.length, 1);
}

function maxInterpretationsIndex(words: Array<InterpretedWord>): number {
  let max = 0;
  let maxIndex = -1;

  for (let i = 0; i < words.length; i += 1) {
    if (words[i].interpretations.length > max) {
      max = words[i].interpretations.length;
      maxIndex = i;
    }
  }

  return maxIndex;
}

/*
  Reduces the total number of possible interpretation combinations to under maxCombinations by
  repeatedly dropping an arbitrary interpretation from the word that has the longest list of
  interpretations.
 */
export function cutCombinations(
  words: Array<InterpretedWord>,
  maxCombinations: number,
): Array<InterpretedWord> {
  if (words.length === 0)
    return [];

  const max = Math.max(1, maxCombinations);
  const cutWords = [...words];
  let combinations = countCombinations(words);

  while (combinations > max) {
    const i = maxInterpretationsIndex(cutWords);
    cutWords[i].dropInterpretation();
    combinations = countCombinations(cutWords);
  }

  return cutWords;
}

/*
  Returns an array containing every valid index for the given array, e.g.:

  indices(['a','b','c']) = [0,1,2]
 */
function indices<T>(array: Array<T>): Array<number> {
  return array.map((_, index) => index);
}

/*
  Returns a cartesian product of an array of tuples (encoded as arrays of values) and an array of
  values of type T by appending every single element from the right hand side array to every tuple
  on the left hand side, similar to an SQL cross join, e.g.:

  product ([[a,b], [c,d]], [e,f]) =
    [[a,b,e],
     [a,b,f],
     [c,d,e],
     [c,d,f]]
 */
function product<T>(tuples: Array<Array<T>>, values: Array<T>): Array<Array<T>> {
  const result = new Array<Array<T>>();

  for (const tuple of tuples) {
    for (const value of values) {
      // eslint-disable-next-line e18e/prefer-spread-syntax
      result.push(tuple.concat(value));
    }
  }

  return result;
}

export default class InterpretedPhrase {
  readonly asTyped: string;

  readonly words: Array<InterpretedWord>;

  constructor(asTyped: string, words: Array<InterpretedWord>) {
    this.asTyped = asTyped;
    this.words = words;
  }

  generateCombinations(maxCombinations: number): Array<Array<number>> {
    if (this.words.length === 0)
      return [];

    const workingSet = cutCombinations(this.words, maxCombinations);

    const combinations = indices(workingSet[0].interpretations).map(i => [i]);

    return workingSet
      .splice(1)
      .reduce((acc, next) => product(acc, indices(next.interpretations)), combinations);
  }
}
