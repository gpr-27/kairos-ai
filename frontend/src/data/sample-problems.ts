export interface SampleProblem {
  slug: string;
  title: string;
  track: 'dsa' | 'cp' | 'system_design';
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  /** Raw stdin/stdout format description shown in the Test Cases tab */
  ioFormat?: { input: string; output: string };
  /** Visible (non-hidden) test cases shown in the UI */
  visibleTestCases?: { input: string; expectedOutput: string }[];
  starterCode: Partial<Record<string, string>>;
  hints: string[];
  /** Simulated acceptance rate (0-100) */
  acceptanceRate?: number;
}

// ── Minimal starter templates ─────────────────────────────────────────────
// I/O scaffolding is intentionally absent — users write the full program.
// They read the "Test Cases" tab to understand the stdin format.

const PYTHON_STARTER = `import sys

def main():
    data = sys.stdin.read().split()
    # Write your solution here

main()
`;

const CPP_STARTER = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here

    return 0;
}
`;

const JAVA_STARTER = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Write your solution here
    }
}
`;

const JS_STARTER = `const data = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/);
let idx = 0;

// Write your solution here
`;

export const SAMPLE_PROBLEMS: SampleProblem[] = [
  // ─── EASY ─────────────────────────────────────────────────────────────────
  {
    slug: 'two-sum',
    title: 'Two Sum',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Arrays', 'Hashing'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

You may assume that each input has exactly one solution, and you may not use the same element twice.`,
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '−10⁹ ≤ nums[i] ≤ 10⁹',
      '−10⁹ ≤ target ≤ 10⁹',
      'Exactly one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '0 1',
        explanation: 'nums[0] + nums[1] = 9.',
      },
      { input: 'nums = [3,2,4], target = 6', output: '1 2' },
    ],
    ioFormat: {
      input: 'Line 1: n (array length)\nLine 2: n space-separated integers\nLine 3: target',
      output: 'Two space-separated indices  i  j',
    },
    visibleTestCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1' },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2' },
      { input: '2\n3 3\n6', expectedOutput: '0 1' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Brute force is O(n²). Can we do better?',
      'A hash map gives O(1) lookup — "have I seen target − nums[i] before?"',
    ],
    acceptanceRate: 49,
  },

  {
    slug: 'valid-parentheses',

    title: 'Valid Parentheses',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Stacks', 'Strings'],
    description: `Given a string \`s\` containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is **valid**.

A string is valid if open brackets are closed by the same type of bracket in the correct order.`,
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists only of bracket characters.'],
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    ioFormat: {
      input: 'A single line containing the bracket string',
      output: 'true  or  false',
    },
    visibleTestCases: [
      { input: '()', expectedOutput: 'true' },
      { input: '()[]{} ', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
      { input: '{[]}', expectedOutput: 'true' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'When you see an open bracket, what should you remember?',
      'A stack (LIFO) naturally matches the most recent unmatched open bracket.',
    ],
  },

  {
    slug: 'best-time-to-buy-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Arrays', 'Greedy'],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a stock on day \`i\`.

Choose a **single day to buy** and a **different future day to sell**. Return the maximum profit. If no profit is possible, return \`0\`.`,
    constraints: ['1 ≤ prices.length ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy day 2 (price=1), sell day 5 (price=6).',
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'No profitable transaction possible.',
      },
    ],
    ioFormat: {
      input: 'Line 1: n (number of days)\nLine 2: n space-separated prices',
      output: 'Maximum profit as an integer',
    },
    visibleTestCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5' },
      { input: '5\n7 6 4 3 1', expectedOutput: '0' },
      { input: '3\n2 4 1', expectedOutput: '2' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Track the minimum price seen so far.',
      'At each day: best profit if selling today = price − min_so_far.',
    ],
  },

  {
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Dynamic Programming', 'Math'],
    description: `You are climbing a staircase with \`n\` steps. Each time you can climb **1 or 2** steps. In how many distinct ways can you reach the top?`,
    constraints: ['1 ≤ n ≤ 45'],
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2.' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, or 2+1.' },
    ],
    ioFormat: {
      input: 'A single integer  n',
      output: 'Number of distinct ways to climb n steps',
    },
    visibleTestCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '5', expectedOutput: '8' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'How can you reach step n? Either from step n−1 or from step n−2.',
      'f(n) = f(n−1) + f(n−2). You only need the last two values.',
    ],
  },

  {
    slug: 'binary-search',
    title: 'Binary Search',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Binary Search', 'Arrays'],
    description: `Given a sorted array of integers \`nums\` and an integer \`target\`, return the **index** of \`target\` if found, otherwise return \`-1\`.

You must write an algorithm with **O(log n)** runtime.`,
    constraints: [
      '1 ≤ nums.length ≤ 10⁴',
      'All integers are unique.',
      'Array is sorted ascending.',
    ],
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' },
    ],
    ioFormat: {
      input: 'Line 1: n  target  (space-separated)\nLine 2: n sorted integers',
      output: 'Index of target, or  -1  if not found',
    },
    visibleTestCases: [
      { input: '6 9\n-1 0 3 5 9 12', expectedOutput: '4' },
      { input: '6 2\n-1 0 3 5 9 12', expectedOutput: '-1' },
      { input: '1 5\n5', expectedOutput: '0' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'If the middle element is too small, the answer must be in the right half.',
      'Maintain lo and hi pointers; shrink the search space by half each iteration.',
    ],
  },

  {
    slug: 'contains-duplicate',
    title: 'Contains Duplicate',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Arrays', 'Hashing'],
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice**, and \`false\` if every element is distinct.`,
    constraints: ['1 ≤ nums.length ≤ 10⁵', '−10⁹ ≤ nums[i] ≤ 10⁹'],
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' },
    ],
    ioFormat: {
      input: 'Line 1: n (array length)\nLine 2: n space-separated integers',
      output: 'true  or  false',
    },
    visibleTestCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true' },
      { input: '4\n1 2 3 4', expectedOutput: 'false' },
      { input: '1\n1', expectedOutput: 'false' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'A hash set stores only unique elements — what happens when you try to insert a duplicate?',
    ],
  },

  // ─── MEDIUM ───────────────────────────────────────────────────────────────
  {
    slug: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Sliding Window', 'Strings', 'Hashing'],
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    constraints: ['0 ≤ s.length ≤ 5 × 10⁴'],
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: '"abc" has length 3.' },
      { input: 's = "bbbbb"', output: '1' },
    ],
    ioFormat: {
      input: 'A single line containing the string  s  (may be empty)',
      output: 'Length of the longest substring without repeating characters',
    },
    visibleTestCases: [
      { input: 'abcabcbb', expectedOutput: '3' },
      { input: 'bbbbb', expectedOutput: '1' },
      { input: 'pwwkew', expectedOutput: '3' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Two pointers — slide right; when a duplicate appears, advance left.',
      'Track the last-seen index of each character to jump left efficiently.',
    ],
  },

  {
    slug: 'maximum-subarray',
    title: "Maximum Subarray (Kadane's)",
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Dynamic Programming', 'Arrays'],
    description: `Given an integer array \`nums\`, find the **contiguous subarray** with the largest sum and return that sum.`,
    constraints: ['1 ≤ nums.length ≤ 10⁵', '−10⁴ ≤ nums[i] ≤ 10⁴'],
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: '[4,−1,2,1] sums to 6.',
      },
    ],
    ioFormat: {
      input: 'Line 1: n\nLine 2: n space-separated integers',
      output: 'Maximum subarray sum',
    },
    visibleTestCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6' },
      { input: '1\n5', expectedOutput: '5' },
      { input: '5\n-1 -2 -3 -4 -5', expectedOutput: '-1' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'At each index: extend the current subarray, or start fresh here?',
      '`current = max(nums[i], current + nums[i])`. Track best = max(best, current).',
    ],
  },

  {
    slug: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Arrays', 'Prefix Products'],
    description: `Given an array \`nums\`, return an array where each element is the product of all other elements. Must run in **O(n)** time and **without division**.`,
    constraints: ['2 ≤ nums.length ≤ 10⁵', '−30 ≤ nums[i] ≤ 30'],
    examples: [{ input: 'nums = [1,2,3,4]', output: '24 12 8 6' }],
    ioFormat: {
      input: 'Line 1: n\nLine 2: n space-separated integers',
      output: 'n space-separated products (one per element)',
    },
    visibleTestCases: [
      { input: '4\n1 2 3 4', expectedOutput: '24 12 8 6' },
      { input: '2\n5 2', expectedOutput: '2 5' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: ['Left pass builds prefix products; right pass multiplies in suffix products.'],
  },

  {
    slug: 'coin-change',
    title: 'Coin Change',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Dynamic Programming'],
    description: `You have an unlimited supply of each coin denomination. Return the **fewest coins** needed to make \`amount\`, or \`-1\` if impossible.`,
    constraints: ['1 ≤ coins.length ≤ 12', '0 ≤ amount ≤ 10⁴'],
    examples: [
      { input: 'coins = [1,5,6], amount = 11', output: '2', explanation: '6 + 5 = 11.' },
      { input: 'coins = [2], amount = 3', output: '-1' },
    ],
    ioFormat: {
      input: 'Line 1: n  amount  (space-separated)\nLine 2: n space-separated coin denominations',
      output: 'Minimum number of coins, or  -1  if impossible',
    },
    visibleTestCases: [
      { input: '3 11\n1 5 6', expectedOutput: '2' },
      { input: '1 3\n2', expectedOutput: '-1' },
      { input: '1 0\n1', expectedOutput: '0' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'dp[i] = min coins to make amount i. Base case: dp[0] = 0.',
      'For each amount i and each coin c: dp[i] = min(dp[i], dp[i−c] + 1).',
    ],
  },

  {
    slug: 'number-of-islands',
    title: 'Number of Islands',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Graphs', 'DFS', 'BFS'],
    description: `Given an m × n grid of \`'1'\` (land) and \`'0'\` (water), return the **number of islands**. An island is formed by connecting adjacent land cells horizontally or vertically.`,
    constraints: ['1 ≤ m, n ≤ 300'],
    examples: [{ input: 'grid = [["1","1","0"],["1","0","0"],["0","0","1"]]', output: '2' }],
    ioFormat: {
      input:
        'Line 1: m  n  (space-separated)\nNext m lines: each row is a string of  0  and  1  characters (no spaces)',
      output: 'Number of islands',
    },
    visibleTestCases: [
      { input: '3 3\n110\n100\n001', expectedOutput: '2' },
      { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1' },
      { input: '1 1\n1', expectedOutput: '1' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'DFS from each unvisited land cell — mark the whole island as visited before moving on.',
    ],
  },

  {
    slug: 'reverse-linked-list',
    title: 'Reverse a Linked List',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Linked Lists', 'Recursion'],
    description: `Given the head of a singly linked list, reverse the list and return the reversed list. Print node values space-separated.`,
    constraints: ['0 ≤ n ≤ 5000', '−5000 ≤ Node.val ≤ 5000'],
    examples: [{ input: 'list = [1,2,3,4,5]', output: '5 4 3 2 1' }],
    ioFormat: {
      input: 'Line 1: n (number of nodes)\nLine 2: n space-separated node values (in order)',
      output: 'Reversed node values, space-separated',
    },
    visibleTestCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' },
      { input: '2\n1 2', expectedOutput: '2 1' },
      { input: '1\n1', expectedOutput: '1' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Three pointers: previous, current, next.',
      'Save next; redirect current.next to previous; advance both pointers.',
    ],
  },

  // ─── HARD ─────────────────────────────────────────────────────────────────
  {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['Two Pointers', 'Arrays', 'Dynamic Programming'],
    description: `Given \`n\` non-negative integers representing an elevation map (width 1 each), compute how much water it can **trap after raining**.`,
    constraints: ['1 ≤ n ≤ 2 × 10⁴', '0 ≤ height[i] ≤ 10⁵'],
    examples: [{ input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }],
    ioFormat: {
      input: 'Line 1: n\nLine 2: n space-separated non-negative integers (heights)',
      output: 'Total water units trapped',
    },
    visibleTestCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6' },
      { input: '6\n4 2 0 3 2 5', expectedOutput: '9' },
      { input: '3\n3 0 3', expectedOutput: '3' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Water at position i = min(maxLeft, maxRight) − height[i].',
      'Two-pointer: the smaller-boundary side determines the water level for that side.',
    ],
  },

  {
    slug: 'word-search',
    title: 'Word Search',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['Backtracking', 'DFS', 'Graphs'],
    description: `Given an m × n character board and a string \`word\`, return \`true\` if the word exists using sequentially adjacent cells. The same cell may **not** be used more than once.`,
    constraints: ['1 ≤ m, n ≤ 6', '1 ≤ word.length ≤ 15'],
    examples: [
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: 'true',
      },
    ],
    ioFormat: {
      input:
        'Line 1: m  n  (space-separated)\nNext m lines: board rows (strings of uppercase letters, no spaces)\nLast line: the word to search',
      output: 'true  or  false',
    },
    visibleTestCases: [
      { input: '3 4\nABCE\nSFCS\nADEE\nABCCED', expectedOutput: 'true' },
      { input: '3 4\nABCE\nSFCS\nADEE\nSEE', expectedOutput: 'true' },
      { input: '3 4\nABCE\nSFCS\nADEE\nABCB', expectedOutput: 'false' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: ["Mark visited cells (e.g., '#') before recursing. Restore on backtrack."],
  },

  // ─── MORE EASY ────────────────────────────────────────────────────────────

  {
    slug: 'palindrome-number',
    title: 'Palindrome Number',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Math'],
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a **palindrome**, and \`false\` otherwise.

An integer is a palindrome when it reads the same forward and backward. For example, \`121\` is a palindrome while \`123\` is not.`,
    constraints: ['-2³¹ ≤ x ≤ 2³¹ − 1'],
    examples: [
      {
        input: 'x = 121',
        output: 'true',
        explanation: '121 reads as 121 from left to right and right to left.',
      },
      { input: 'x = -121', output: 'false', explanation: 'Reads as 121- from right to left.' },
      { input: 'x = 10', output: 'false', explanation: 'Reads as 01 from right to left.' },
    ],
    ioFormat: {
      input: 'A single integer x',
      output: 'true or false',
    },
    visibleTestCases: [
      { input: '121', expectedOutput: 'true' },
      { input: '-121', expectedOutput: 'false' },
      { input: '10', expectedOutput: 'false' },
      { input: '0', expectedOutput: 'true' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Negative numbers are never palindromes.',
      'Try reversing only the second half of the number and compare.',
    ],
    acceptanceRate: 53,
  },

  {
    slug: 'reverse-string',
    title: 'Reverse String',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Strings', 'Two Pointers'],
    description: `Write a function that reverses a string. The input is given as an array of characters.

You must do this **in-place** with O(1) extra memory. For this problem, read the string on one line, reverse it, and print it.`,
    constraints: ['1 ≤ s.length ≤ 10⁵', 's[i] is a printable ASCII character.'],
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '"olleh"' },
      { input: 's = ["H","a","n","n","a","h"]', output: '"hannaH"' },
    ],
    ioFormat: {
      input: 'A single line containing the string to reverse',
      output: 'The reversed string',
    },
    visibleTestCases: [
      { input: 'hello', expectedOutput: 'olleh' },
      { input: 'Hannah', expectedOutput: 'hannaH' },
      { input: 'a', expectedOutput: 'a' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: ['Use two pointers: one at the start, one at the end. Swap and move inward.'],
    acceptanceRate: 75,
  },

  {
    slug: 'majority-element',
    title: 'Majority Element',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Arrays', 'Sorting', 'Boyer-Moore Voting'],
    description: `Given an array \`nums\` of size \`n\`, return the **majority element**.

The majority element is the element that appears **more than ⌊n/2⌋ times**. You may assume that the majority element always exists in the array.`,
    constraints: ['n == nums.length', '1 ≤ n ≤ 5×10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹'],
    examples: [
      { input: 'nums = [3,2,3]', output: '3' },
      { input: 'nums = [2,2,1,1,1,2,2]', output: '2' },
    ],
    ioFormat: {
      input: 'Line 1: n (array length)\nLine 2: n space-separated integers',
      output: 'The majority element',
    },
    visibleTestCases: [
      { input: '3\n3 2 3', expectedOutput: '3' },
      { input: '7\n2 2 1 1 1 2 2', expectedOutput: '2' },
      { input: '1\n5', expectedOutput: '5' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Sorting and returning the middle element works in O(n log n).',
      'Boyer-Moore Voting Algorithm solves this in O(n) time and O(1) space.',
    ],
    acceptanceRate: 63,
  },

  {
    slug: 'move-zeroes',
    title: 'Move Zeroes',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Arrays', 'Two Pointers'],
    description: `Given an integer array \`nums\`, move all \`0\`s to the **end** while maintaining the relative order of the non-zero elements.

You must do this **in-place** without making a copy of the array.`,
    constraints: ['1 ≤ nums.length ≤ 10⁴', '-2³¹ ≤ nums[i] ≤ 2³¹ − 1'],
    examples: [
      { input: 'nums = [0,1,0,3,12]', output: '1 3 12 0 0' },
      { input: 'nums = [0]', output: '0' },
    ],
    ioFormat: {
      input: 'Line 1: n (array length)\nLine 2: n space-separated integers',
      output: 'The array after moving zeros to the end, space-separated',
    },
    visibleTestCases: [
      { input: '5\n0 1 0 3 12', expectedOutput: '1 3 12 0 0' },
      { input: '1\n0', expectedOutput: '0' },
      { input: '4\n1 2 3 4', expectedOutput: '1 2 3 4' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: ['Use a slow pointer that tracks the next position to place a non-zero element.'],
    acceptanceRate: 61,
  },

  {
    slug: 'missing-number',
    title: 'Missing Number',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Arrays', 'Math', 'Bit Manipulation'],
    description: `Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return the only number in the range that is missing from the array.`,
    constraints: ['n == nums.length', '1 ≤ n ≤ 10⁴', '0 ≤ nums[i] ≤ n', 'All numbers are unique.'],
    examples: [
      {
        input: 'nums = [3,0,1]',
        output: '2',
        explanation: 'n = 3, so range is [0,3]. Missing: 2.',
      },
      { input: 'nums = [0,1]', output: '2' },
      { input: 'nums = [9,6,4,2,3,5,7,0,1]', output: '8' },
    ],
    ioFormat: {
      input: 'Line 1: n (array length)\nLine 2: n space-separated distinct integers in [0,n]',
      output: 'The missing number',
    },
    visibleTestCases: [
      { input: '3\n3 0 1', expectedOutput: '2' },
      { input: '2\n0 1', expectedOutput: '2' },
      { input: '9\n9 6 4 2 3 5 7 0 1', expectedOutput: '8' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'The expected sum of 0..n is n*(n+1)/2. Subtract the actual sum.',
      'XOR trick: XOR all indices and all values — duplicates cancel, leaving the missing number.',
    ],
    acceptanceRate: 65,
  },

  {
    slug: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['Linked Lists', 'Recursion'],
    description: `You are given the heads of two sorted linked lists. **Merge** the two lists into one sorted list and return it.

For this problem, each list is given as a space-separated sequence of integers on a separate line.`,
    constraints: [
      '0 ≤ length ≤ 50',
      '-100 ≤ node value ≤ 100',
      'Both lists are sorted in non-decreasing order.',
    ],
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '1 1 2 3 4 4' },
      { input: 'list1 = [], list2 = []', output: '' },
    ],
    ioFormat: {
      input:
        'Line 1: space-separated integers for list1 (empty line if empty)\nLine 2: space-separated integers for list2 (empty line if empty)',
      output: 'Merged sorted list as space-separated integers',
    },
    visibleTestCases: [
      { input: '1 2 4\n1 3 4', expectedOutput: '1 1 2 3 4 4' },
      { input: '\n', expectedOutput: '' },
      { input: '1 3 5\n2 4 6', expectedOutput: '1 2 3 4 5 6' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Use two pointers, one per list, and always pick the smaller head.',
      'Recursion is elegant: merge(l1, l2) = min(l1.val, l2.val) + merge(rest).',
    ],
    acceptanceRate: 62,
  },

  // ─── MORE MEDIUM ──────────────────────────────────────────────────────────

  {
    slug: 'three-sum',
    title: '3Sum',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Arrays', 'Two Pointers', 'Sorting'],
    description: `Given an integer array \`nums\`, return all the **unique** triplets \`[nums[i], nums[j], nums[k]]\` such that \`i ≠ j ≠ k\` and \`nums[i] + nums[j] + nums[k] == 0\`.

The solution set must not contain duplicate triplets. Print each triplet on a new line, space-separated, sorted ascending.`,
    constraints: ['3 ≤ nums.length ≤ 3000', '-10⁵ ≤ nums[i] ≤ 10⁵'],
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '-1 -1 2\n-1 0 1',
        explanation: 'Two unique triplets.',
      },
      { input: 'nums = [0,0,0]', output: '0 0 0' },
    ],
    ioFormat: {
      input: 'Line 1: n (array length)\nLine 2: n space-separated integers',
      output:
        'Each unique triplet on its own line, values sorted ascending, triplets sorted lexicographically',
    },
    visibleTestCases: [
      { input: '6\n-1 0 1 2 -1 -4', expectedOutput: '-1 -1 2\n-1 0 1' },
      { input: '3\n0 0 0', expectedOutput: '0 0 0' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Sort the array first. Fix the first element, then use two pointers for the remaining pair.',
      'Skip duplicates for all three pointers to avoid duplicate triplets.',
    ],
    acceptanceRate: 33,
  },

  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Arrays', 'Two Pointers', 'Greedy'],
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines where the \`i\`-th line has endpoints \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container that holds **the most water**. Return the maximum amount of water.`,
    constraints: ['n == height.length', '2 ≤ n ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'Lines at index 1 and 8, min(8,7)*7 = 49.',
      },
      { input: 'height = [1,1]', output: '1' },
    ],
    ioFormat: {
      input: 'Line 1: n (number of lines)\nLine 2: n space-separated heights',
      output: 'Maximum water as an integer',
    },
    visibleTestCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49' },
      { input: '2\n1 1', expectedOutput: '1' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Brute force O(n²). Try two pointers starting at both ends.',
      'Always move the pointer with the shorter height — moving the taller one can only decrease area.',
    ],
    acceptanceRate: 54,
  },

  {
    slug: 'longest-palindromic-substring',
    title: 'Longest Palindromic Substring',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Strings', 'Dynamic Programming'],
    description: `Given a string \`s\`, return the **longest palindromic substring** in \`s\`.`,
    constraints: ['1 ≤ s.length ≤ 1000', 's consists of only digits and English letters.'],
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also valid.' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    ioFormat: {
      input: 'A single string s on one line',
      output: 'The longest palindromic substring (if tie, any valid answer)',
    },
    visibleTestCases: [
      { input: 'babad', expectedOutput: 'bab' },
      { input: 'cbbd', expectedOutput: 'bb' },
      { input: 'a', expectedOutput: 'a' },
      { input: 'racecar', expectedOutput: 'racecar' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Expand around each character as a center (handles both odd and even lengths).',
      "Manacher's algorithm solves this in O(n), but O(n²) is acceptable here.",
    ],
    acceptanceRate: 34,
  },

  {
    slug: 'group-anagrams',
    title: 'Group Anagrams',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Arrays', 'Hashing', 'Strings'],
    description: `Given an array of strings \`strs\`, group the **anagrams** together. You can return the answer in any order.

Two strings are anagrams if one is a rearrangement of the other. Print each group on a separate line, words space-separated, words within a group sorted alphabetically, groups sorted by their first word.`,
    constraints: [
      '1 ≤ strs.length ≤ 10⁴',
      '0 ≤ strs[i].length ≤ 100',
      'strs[i] consists of lowercase letters.',
    ],
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '"ate eat tea"\n"bat"\n"ant nat tan"',
      },
    ],
    ioFormat: {
      input: 'Line 1: n (number of strings)\nLine 2: n space-separated strings',
      output:
        'Each anagram group on its own line, words sorted alphabetically, groups sorted by first word',
    },
    visibleTestCases: [
      { input: '6\neat tea tan ate nat bat', expectedOutput: 'ate eat tea\nbat\nant nat tan' },
      { input: '1\na', expectedOutput: 'a' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: ['Sort each string to create a canonical key. Strings with the same key are anagrams.'],
    acceptanceRate: 65,
  },

  {
    slug: 'jump-game',
    title: 'Jump Game',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Arrays', 'Greedy', 'Dynamic Programming'],
    description: `You are given an integer array \`nums\`. You are initially positioned at the **first index** of the array.

Each element \`nums[i]\` represents your **maximum jump length** from that position. Return \`true\` if you can reach the last index, \`false\` otherwise.`,
    constraints: ['1 ≤ nums.length ≤ 10⁴', '0 ≤ nums[i] ≤ 10⁵'],
    examples: [
      {
        input: 'nums = [2,3,1,1,4]',
        output: 'true',
        explanation: 'Jump 1 step from 0 to 1, then 3 steps to last.',
      },
      { input: 'nums = [3,2,1,0,4]', output: 'false', explanation: 'Always stuck at index 3.' },
    ],
    ioFormat: {
      input: 'Line 1: n (array length)\nLine 2: n space-separated integers',
      output: 'true or false',
    },
    visibleTestCases: [
      { input: '5\n2 3 1 1 4', expectedOutput: 'true' },
      { input: '5\n3 2 1 0 4', expectedOutput: 'false' },
      { input: '1\n0', expectedOutput: 'true' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Track the farthest index reachable. If your current position exceeds it, you are stuck.',
    ],
    acceptanceRate: 38,
  },

  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Arrays', 'Sorting', 'Intervals'],
    description: `Given an array of intervals where \`intervals[i] = [start_i, end_i]\`, **merge all overlapping intervals** and return an array of the non-overlapping intervals that cover all intervals in the input.`,
    constraints: ['1 ≤ intervals.length ≤ 10⁴', '0 ≤ start_i ≤ end_i ≤ 10⁴'],
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: '[1,3] and [2,6] overlap → [1,6].',
      },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Touch at 4 → merge.' },
    ],
    ioFormat: {
      input: 'Line 1: n (number of intervals)\nLines 2..n+1: each line has two integers start end',
      output: 'Each merged interval on its own line as "start end"',
    },
    visibleTestCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18' },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: ['Sort intervals by start time. Iterate and merge whenever current.start ≤ prev.end.'],
    acceptanceRate: 46,
  },

  {
    slug: 'rotate-array',
    title: 'Rotate Array',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['Arrays', 'Math', 'Two Pointers'],
    description: `Given an integer array \`nums\`, rotate the array to the **right** by \`k\` steps, where \`k\` is non-negative.`,
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-2³¹ ≤ nums[i] ≤ 2³¹ − 1', '0 ≤ k ≤ 10⁵'],
    examples: [
      { input: 'nums = [1,2,3,4,5,6,7], k = 3', output: '5 6 7 1 2 3 4' },
      { input: 'nums = [-1,-100,3,99], k = 2', output: '3 99 -1 -100' },
    ],
    ioFormat: {
      input:
        'Line 1: n (array length)\nLine 2: n space-separated integers\nLine 3: k (steps to rotate right)',
      output: 'The rotated array as space-separated integers',
    },
    visibleTestCases: [
      { input: '7\n1 2 3 4 5 6 7\n3', expectedOutput: '5 6 7 1 2 3 4' },
      { input: '4\n-1 -100 3 99\n2', expectedOutput: '3 99 -1 -100' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Use k = k % n to handle k > n.',
      'Reverse trick: reverse all, then reverse first k, then reverse rest.',
    ],
    acceptanceRate: 39,
  },

  // ─── MORE HARD ────────────────────────────────────────────────────────────

  {
    slug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['Strings', 'Sliding Window', 'Hashing'],
    description: `Given two strings \`s\` and \`t\` of lengths \`m\` and \`n\` respectively, return the **minimum window substring** of \`s\` such that every character in \`t\` (including duplicates) is included in the window. If there is no such substring, return the empty string.`,
    constraints: [
      'm == s.length',
      'n == t.length',
      '1 ≤ m, n ≤ 10⁵',
      's and t consist of uppercase and lowercase letters.',
    ],
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' },
      { input: 's = "a", t = "a"', output: '"a"' },
      { input: 's = "a", t = "aa"', output: '""' },
    ],
    ioFormat: {
      input: 'Line 1: string s\nLine 2: string t',
      output: 'The minimum window substring, or empty string if none',
    },
    visibleTestCases: [
      { input: 'ADOBECODEBANC\nABC', expectedOutput: 'BANC' },
      { input: 'a\na', expectedOutput: 'a' },
      { input: 'a\naa', expectedOutput: '' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Sliding window: expand right until all chars of t are covered, then shrink from left.',
      'Use two frequency maps and a "formed" counter to track when the window is valid.',
    ],
    acceptanceRate: 41,
  },

  {
    slug: 'largest-rectangle-histogram',
    title: 'Largest Rectangle in Histogram',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['Arrays', 'Stack', 'Monotonic Stack'],
    description: `Given an array of integers \`heights\` representing the histogram's bar heights where the width of each bar is \`1\`, return the **area of the largest rectangle** in the histogram.`,
    constraints: ['1 ≤ heights.length ≤ 10⁵', '0 ≤ heights[i] ≤ 10⁴'],
    examples: [
      {
        input: 'heights = [2,1,5,6,2,3]',
        output: '10',
        explanation: 'Bars at index 2 and 3 (height 5 and 6), width 2 → area 10.',
      },
      { input: 'heights = [2,4]', output: '4' },
    ],
    ioFormat: {
      input: 'Line 1: n (number of bars)\nLine 2: n space-separated heights',
      output: 'The maximum rectangle area as an integer',
    },
    visibleTestCases: [
      { input: '6\n2 1 5 6 2 3', expectedOutput: '10' },
      { input: '2\n2 4', expectedOutput: '4' },
      { input: '5\n1 1 1 1 1', expectedOutput: '5' },
    ],
    starterCode: {
      python: PYTHON_STARTER,
      cpp: CPP_STARTER,
      java: JAVA_STARTER,
      javascript: JS_STARTER,
    },
    hints: [
      'Use a monotonic increasing stack. When a shorter bar is encountered, pop and compute area.',
      'Append a sentinel 0 to the end to flush remaining bars from the stack.',
    ],
    acceptanceRate: 44,
  },

  // ─── SYSTEM DESIGN ────────────────────────────────────────────────────────
  {
    slug: 'design-url-shortener',
    title: 'Design a URL Shortener',
    track: 'system_design',
    difficulty: 'medium',
    topics: ['Storage', 'Hashing', 'Scalability'],
    description: `Design a URL shortener service like bit.ly.

**Discuss:**
1. Capacity estimation (QPS, storage, bandwidth)
2. ID generation strategy (counter, hash, base62)
3. Database schema and choice (SQL vs NoSQL)
4. Caching strategy
5. Redirect mechanism (301 vs 302)
6. Trade-offs in your design`,
    constraints: ['Estimate QPS, storage, and bandwidth.', 'Discuss trade-offs explicitly.'],
    examples: [
      {
        input: 'longUrl = "https://example.com/very/long/path"',
        output: 'shortUrl = "kairos.ai/k7Bq2"',
      },
    ],
    starterCode: {},
    hints: [
      "Start with requirements: functional + non-functional. Don't skip capacity estimation.",
      '301 is cached by the browser (good for load, bad for analytics). 302 is not.',
    ],
  },

  {
    slug: 'design-rate-limiter',
    title: 'Design a Rate Limiter',
    track: 'system_design',
    difficulty: 'medium',
    topics: ['Scalability', 'Distributed Systems', 'Algorithms'],
    description: `Design a distributed rate limiter that limits N requests per user per minute across a fleet of API servers.

**Discuss:**
1. Token bucket vs leaky bucket vs sliding window — trade-offs
2. Where the rate limiter sits (client, gateway, middleware)
3. How state is shared across servers (Redis, in-memory)
4. Handling bursts, clock skew, Redis unavailability
5. Response when limit is exceeded (HTTP 429, headers)`,
    constraints: ['Must be horizontally scalable.'],
    examples: [
      {
        input: 'user makes 11 requests in 1 second, limit = 10/min',
        output: 'first 10 allowed, 11th → 429',
      },
    ],
    starterCode: {},
    hints: [
      'Local memory is fast but inaccurate across servers. Redis is accurate but adds a network hop.',
    ],
  },
];
