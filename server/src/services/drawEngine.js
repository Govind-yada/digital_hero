import { DRAW_CONSTANTS } from '../constants/drawConstants.js';

export const drawEngine = {
  // Generate uniform random numbers (5 unique numbers between min and max)
  generateRandomNumbers(
    count = DRAW_CONSTANTS.NUMBERS_COUNT,
    min = DRAW_CONSTANTS.MIN_NUMBER,
    max = DRAW_CONSTANTS.MAX_NUMBER
  ) {
    const numbers = new Set();
    while (numbers.size < count) {
      const rand = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(rand);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  },

  // Generate algorithmic weighted numbers based on score frequency
  generateAlgorithmicNumbers(
    entries = [],
    count = DRAW_CONSTANTS.NUMBERS_COUNT,
    min = DRAW_CONSTANTS.MIN_NUMBER,
    max = DRAW_CONSTANTS.MAX_NUMBER
  ) {
    // 1. Calculate frequency for every number in [min, max]
    const frequencies = {};
    for (let i = min; i <= max; i++) {
      frequencies[i] = 0;
    }

    for (const entry of entries) {
      if (Array.isArray(entry.numbers)) {
        for (const num of entry.numbers) {
          if (num >= min && num <= max) {
            frequencies[num] = (frequencies[num] || 0) + 1;
          }
        }
      }
    }

    // 2. Laplace smoothing: weight = frequency + 1 (guarantees non-zero chance)
    const weights = {};
    for (let i = min; i <= max; i++) {
      weights[i] = frequencies[i] + 1;
    }

    // 3. Sequential weighted sampling without replacement
    const available = [];
    for (let i = min; i <= max; i++) {
      available.push(i);
    }

    const selected = [];
    while (selected.length < count && available.length > 0) {
      const totalWeight = available.reduce((sum, num) => sum + weights[num], 0);
      let threshold = Math.random() * totalWeight;

      let pickedIndex = 0;
      for (let i = 0; i < available.length; i++) {
        threshold -= weights[available[i]];
        if (threshold <= 0) {
          pickedIndex = i;
          break;
        }
      }

      selected.push(available[pickedIndex]);
      available.splice(pickedIndex, 1);
    }

    const winningNumbers = selected.sort((a, b) => a - b);

    return {
      winningNumbers,
      metadata: {
        totalEntriesAnalyzed: entries.length,
        topFrequencies: Object.entries(frequencies)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([num, count]) => ({ number: parseInt(num, 10), count })),
      },
    };
  },

  // Calculate number of matches between user entry and winning numbers
  calculateMatches(winningNumbers, entryNumbers) {
    if (!Array.isArray(winningNumbers) || !Array.isArray(entryNumbers)) return 0;
    const winningSet = new Set(winningNumbers);
    return entryNumbers.filter((n) => winningSet.has(n)).length;
  },
};
