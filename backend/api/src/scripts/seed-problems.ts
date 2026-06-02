import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import { ProblemModel } from '../models/problem.model.js';

interface SeedProblem {
  slug: string;
  title: string;
  track: 'dsa' | 'cp' | 'system_design';
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  testCases: { input: string; expectedOutput: string; isHidden?: boolean }[];
  starterCode: Record<string, string>;
  hints: string[];
}

// ── Minimal starter templates (users write the full program) ─────────────────
const PYTHON = `import sys

def main():
    data = sys.stdin.read().split()
    # Write your solution here

main()
`;

const CPP = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here

    return 0;
}
`;

const JAVA = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Write your solution here
    }
}
`;

const PROBLEMS: SeedProblem[] = [
  // ─── EASY ───────────────────────────────────────────────────────────────
  {
    slug: 'two-sum',
    title: 'Two Sum',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['arrays', 'hashing'],
    description:
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution always exists.',
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '−10⁹ ≤ nums[i] ≤ 10⁹',
      'Exactly one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0, 1]',
        explanation: 'nums[0] + nums[1] = 9.',
      },
    ],
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1' },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2' },
      { input: '2\n3 3\n6', expectedOutput: '0 1' },
      { input: '5\n1 5 3 7 2\n9', expectedOutput: '1 4', isHidden: true },
      { input: '4\n-3 4 3 90\n0', expectedOutput: '0 2', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Brute force is O(n²). Can we do better?',
      'A hash map gives O(1) lookup: "have I seen target − nums[i] before?"',
    ],
  },

  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['stacks_queues', 'strings'],
    description:
      'Given a string `s` containing only `(`, `)`, `{`, `}`, `[`, `]`, determine if it is valid.',
    constraints: ['1 ≤ s.length ≤ 10⁴'],
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    testCases: [
      { input: '()', expectedOutput: 'true' },
      { input: '()[]{}', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
      { input: '([)]', expectedOutput: 'false' },
      { input: '{[]}', expectedOutput: 'true' },
      { input: ']', expectedOutput: 'false', isHidden: true },
      { input: '((', expectedOutput: 'false', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
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
    topics: ['arrays', 'greedy'],
    description:
      'Given prices array, choose one day to buy and a later day to sell. Return maximum profit (0 if impossible).',
    constraints: ['1 ≤ prices.length ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5' },
      { input: 'prices = [7,6,4,3,1]', output: '0' },
    ],
    testCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5' },
      { input: '5\n7 6 4 3 1', expectedOutput: '0' },
      { input: '1\n5', expectedOutput: '0' },
      { input: '3\n2 4 1', expectedOutput: '2' },
      { input: '6\n3 3 5 0 0 3', expectedOutput: '3', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
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
    topics: ['dynamic_programming', 'math'],
    description: 'You can climb 1 or 2 steps at a time. How many distinct ways to reach step n?',
    constraints: ['1 ≤ n ≤ 45'],
    examples: [
      { input: 'n = 2', output: '2' },
      { input: 'n = 3', output: '3' },
    ],
    testCases: [
      { input: '1', expectedOutput: '1' },
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '5', expectedOutput: '8' },
      { input: '10', expectedOutput: '89' },
      { input: '45', expectedOutput: '1836311903', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['f(n) = f(n−1) + f(n−2). You only need the last two values.'],
  },

  {
    slug: 'binary-search',
    title: 'Binary Search',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['binary_search', 'arrays'],
    description: 'Given a sorted array and a target, return its index or −1. Must be O(log n).',
    constraints: ['1 ≤ nums.length ≤ 10⁴', 'All elements unique. Sorted ascending.'],
    examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' }],
    testCases: [
      { input: '6 9\n-1 0 3 5 9 12', expectedOutput: '4' },
      { input: '6 2\n-1 0 3 5 9 12', expectedOutput: '-1' },
      { input: '1 5\n5', expectedOutput: '0' },
      { input: '5 -1\n-5 -3 -1 0 2', expectedOutput: '2' },
      { input: '4 100\n1 2 3 4', expectedOutput: '-1', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['If the middle is too small, everything left is also too small. Discard it.'],
  },

  {
    slug: 'contains-duplicate',
    title: 'Contains Duplicate',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['arrays', 'hashing'],
    description:
      'Return true if any value appears at least twice, false if all elements are distinct.',
    constraints: ['1 ≤ nums.length ≤ 10⁵', '−10⁹ ≤ nums[i] ≤ 10⁹'],
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' },
    ],
    testCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true' },
      { input: '4\n1 2 3 4', expectedOutput: 'false' },
      { input: '1\n1', expectedOutput: 'false' },
      { input: '3\n1 1 1', expectedOutput: 'true' },
      { input: '5\n-1 -2 -3 -1 0', expectedOutput: 'true', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['A set stores only unique elements. What happens when you try to insert a duplicate?'],
  },

  // ─── MEDIUM ─────────────────────────────────────────────────────────────
  {
    slug: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['sliding_window', 'strings', 'hashing'],
    description: 'Find the length of the longest substring without repeating characters.',
    constraints: ['0 ≤ s.length ≤ 5 × 10⁴'],
    examples: [{ input: 's = "abcabcbb"', output: '3' }],
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3' },
      { input: 'bbbbb', expectedOutput: '1' },
      { input: 'pwwkew', expectedOutput: '3' },
      { input: '', expectedOutput: '0' },
      { input: 'dvdf', expectedOutput: '3' },
      { input: 'abcdefghijklmnopqrstuvwxyz', expectedOutput: '26', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Two pointers: slide right, jump left when a duplicate appears.'],
  },

  {
    slug: 'maximum-subarray',
    title: "Maximum Subarray (Kadane's)",
    track: 'dsa',
    difficulty: 'medium',
    topics: ['dynamic_programming', 'arrays'],
    description: 'Find the contiguous subarray with the largest sum and return that sum.',
    constraints: ['1 ≤ nums.length ≤ 10⁵', '−10⁴ ≤ nums[i] ≤ 10⁴'],
    examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6' }],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6' },
      { input: '1\n5', expectedOutput: '5' },
      { input: '5\n-1 -2 -3 -4 -5', expectedOutput: '-1' },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23' },
      { input: '3\n-2 -1 -3', expectedOutput: '-1', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'At each position: extend or start fresh? `current = max(nums[i], current + nums[i])`.',
    ],
  },

  {
    slug: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['arrays', 'prefix_products'],
    description:
      'Return array where each element is the product of all other elements. O(n), no division.',
    constraints: ['2 ≤ nums.length ≤ 10⁵', '−30 ≤ nums[i] ≤ 30'],
    examples: [{ input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' }],
    testCases: [
      { input: '4\n1 2 3 4', expectedOutput: '24 12 8 6' },
      { input: '5\n-1 1 0 -3 3', expectedOutput: '0 0 9 0 0' },
      { input: '2\n5 2', expectedOutput: '2 5' },
      { input: '4\n2 3 4 5', expectedOutput: '60 40 30 24', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Left pass: prefix products. Right pass: multiply in suffix products.'],
  },

  {
    slug: 'coin-change',
    title: 'Coin Change',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['dynamic_programming'],
    description:
      'Return the fewest coins needed to make `amount`, or −1 if impossible. Unlimited supply of each coin.',
    constraints: ['1 ≤ coins.length ≤ 12', '0 ≤ amount ≤ 10⁴'],
    examples: [{ input: 'coins = [1,5,6], amount = 11', output: '2' }],
    testCases: [
      { input: '3 11\n1 5 6', expectedOutput: '2' },
      { input: '1 3\n2', expectedOutput: '-1' },
      { input: '1 0\n1', expectedOutput: '0' },
      { input: '3 11\n1 2 5', expectedOutput: '3' },
      { input: '3 7\n2 3 5', expectedOutput: '2', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'dp[i] = min coins to make amount i. dp[0] = 0.',
      'For each i and coin c: dp[i] = min(dp[i], dp[i−c] + 1).',
    ],
  },

  {
    slug: 'number-of-islands',
    title: 'Number of Islands',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['graphs', 'dfs', 'bfs'],
    description:
      "Count islands in an m×n grid of '1' (land) and '0' (water). Adjacent land cells (horizontal/vertical) form one island.",
    constraints: ['1 ≤ m, n ≤ 300'],
    examples: [{ input: 'grid = [["1","1","0"],["1","0","0"],["0","0","1"]]', output: '2' }],
    testCases: [
      { input: '3 3\n110\n100\n001', expectedOutput: '2' },
      { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1' },
      { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3' },
      { input: '1 1\n1', expectedOutput: '1' },
      { input: '1 1\n0', expectedOutput: '0' },
      { input: '3 3\n010\n111\n010', expectedOutput: '1', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['DFS from each unvisited land cell, marking the whole island as visited.'],
  },

  {
    slug: 'reverse-linked-list',
    title: 'Reverse a Linked List',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['linked_lists'],
    description:
      'Reverse a singly linked list. Input: first line = n, second line = n space-separated values.',
    constraints: ['0 ≤ n ≤ 5000'],
    examples: [{ input: 'list = [1,2,3,4,5]', output: '[5,4,3,2,1]' }],
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' },
      { input: '2\n1 2', expectedOutput: '2 1' },
      { input: '1\n1', expectedOutput: '1' },
      { input: '4\n4 3 2 1', expectedOutput: '1 2 3 4', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Three pointers: previous, current, next. Save next; redirect; advance.'],
  },

  // ─── HARD ─────────────────────────────────────────────────────────────
  {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['two_pointers', 'arrays'],
    description: 'Compute how much water an elevation map can trap after raining.',
    constraints: ['1 ≤ n ≤ 2 × 10⁴', '0 ≤ height[i] ≤ 10⁵'],
    examples: [{ input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }],
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6' },
      { input: '6\n4 2 0 3 2 5', expectedOutput: '9' },
      { input: '1\n0', expectedOutput: '0' },
      { input: '3\n3 0 3', expectedOutput: '3' },
      { input: '5\n5 2 1 2 5', expectedOutput: '14', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Water at position i = min(maxLeft, maxRight) − height[i].',
      'Two-pointer: the smaller-boundary side determines water level.',
    ],
  },

  {
    slug: 'word-search',
    title: 'Word Search',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['backtracking', 'dfs'],
    description:
      'Return true if `word` exists in the grid using sequentially adjacent cells (no reuse). Input: first line = m n, next m lines = board rows, last line = word.',
    constraints: ['1 ≤ m, n ≤ 6', '1 ≤ word.length ≤ 15'],
    examples: [{ input: 'board: ABCE/SFCS/ADEE, word = ABCCED', output: 'true' }],
    testCases: [
      { input: '3 4\nABCE\nSFCS\nADEE\nABCCED', expectedOutput: 'true' },
      { input: '3 4\nABCE\nSFCS\nADEE\nSEE', expectedOutput: 'true' },
      { input: '3 4\nABCE\nSFCS\nADEE\nABCB', expectedOutput: 'false' },
      { input: '2 2\nAB\nCD\nABDC', expectedOutput: 'true' },
      { input: '1 1\nA\nB', expectedOutput: 'false' },
      { input: '3 3\nABC\nDEF\nGHI\nCFI', expectedOutput: 'true', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ["Mark visited cells (e.g., '#') before recursing. Restore on backtrack."],
  },

  // ─── MORE EASY ──────────────────────────────────────────────────────────
  {
    slug: 'palindrome-number',
    title: 'Palindrome Number',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['math'],
    description:
      'Given an integer x, return true if x is a palindrome, false otherwise. Negative numbers are never palindromes.',
    constraints: ['-2³¹ ≤ x ≤ 2³¹ − 1'],
    examples: [
      { input: 'x = 121', output: 'true' },
      { input: 'x = -121', output: 'false' },
    ],
    testCases: [
      { input: '121', expectedOutput: 'true' },
      { input: '-121', expectedOutput: 'false' },
      { input: '10', expectedOutput: 'false' },
      { input: '0', expectedOutput: 'true' },
      { input: '1221', expectedOutput: 'true', isHidden: true },
      { input: '1231', expectedOutput: 'false', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Negative numbers are never palindromes.',
      'Try reversing only the second half of the number and compare.',
    ],
  },

  {
    slug: 'reverse-string',
    title: 'Reverse String',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['strings', 'two_pointers'],
    description: 'Read a string on one line, reverse it, and print it.',
    constraints: ['1 ≤ s.length ≤ 10⁵'],
    examples: [{ input: 'hello', output: 'olleh' }],
    testCases: [
      { input: 'hello', expectedOutput: 'olleh' },
      { input: 'Hannah', expectedOutput: 'hannaH' },
      { input: 'a', expectedOutput: 'a' },
      { input: 'abcd', expectedOutput: 'dcba', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Use two pointers: one at the start, one at the end. Swap and move inward.'],
  },

  {
    slug: 'majority-element',
    title: 'Majority Element',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['arrays', 'sorting'],
    description:
      'Given n integers, return the element that appears more than ⌊n/2⌋ times. Input: line 1 = n, line 2 = n integers.',
    constraints: ['1 ≤ n ≤ 5×10⁴'],
    examples: [{ input: 'n=3, nums=[3,2,3]', output: '3' }],
    testCases: [
      { input: '3\n3 2 3', expectedOutput: '3' },
      { input: '7\n2 2 1 1 1 2 2', expectedOutput: '2' },
      { input: '1\n5', expectedOutput: '5' },
      { input: '5\n1 1 2 1 1', expectedOutput: '1', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Boyer-Moore Voting: keep a candidate and a count. Flip candidate when count hits 0.'],
  },

  {
    slug: 'move-zeroes',
    title: 'Move Zeroes',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['arrays', 'two_pointers'],
    description:
      'Move all 0s to the end while keeping relative order of non-zero elements. Input: line 1 = n, line 2 = n integers.',
    constraints: ['1 ≤ n ≤ 10⁴'],
    examples: [{ input: 'n=5, nums=[0,1,0,3,12]', output: '1 3 12 0 0' }],
    testCases: [
      { input: '5\n0 1 0 3 12', expectedOutput: '1 3 12 0 0' },
      { input: '1\n0', expectedOutput: '0' },
      { input: '4\n1 2 3 4', expectedOutput: '1 2 3 4' },
      { input: '4\n0 0 0 1', expectedOutput: '1 0 0 0', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Slow pointer tracks the next slot for a non-zero element.'],
  },

  {
    slug: 'missing-number',
    title: 'Missing Number',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['arrays', 'math'],
    description:
      'Given n distinct numbers in [0,n], return the missing one. Input: line 1 = n, line 2 = n integers.',
    constraints: ['1 ≤ n ≤ 10⁴'],
    examples: [{ input: 'n=3, nums=[3,0,1]', output: '2' }],
    testCases: [
      { input: '3\n3 0 1', expectedOutput: '2' },
      { input: '2\n0 1', expectedOutput: '2' },
      { input: '9\n9 6 4 2 3 5 7 0 1', expectedOutput: '8' },
      { input: '4\n0 1 2 4', expectedOutput: '3', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Expected sum 0..n = n*(n+1)/2. Subtract actual sum.'],
  },

  {
    slug: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    track: 'dsa',
    difficulty: 'easy',
    topics: ['linked_lists'],
    description:
      'Merge two sorted integer sequences. Each given as a single space-separated line (empty line for empty list).',
    constraints: ['0 ≤ length ≤ 50', '-100 ≤ value ≤ 100'],
    examples: [{ input: 'list1=[1,2,4], list2=[1,3,4]', output: '1 1 2 3 4 4' }],
    testCases: [
      { input: '1 2 4\n1 3 4', expectedOutput: '1 1 2 3 4 4' },
      { input: '\n', expectedOutput: '' },
      { input: '1 3 5\n2 4 6', expectedOutput: '1 2 3 4 5 6' },
      { input: '1\n2', expectedOutput: '1 2', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Two pointers, always pick the smaller head. Append the remainder when one list runs out.',
    ],
  },

  // ─── MORE MEDIUM ────────────────────────────────────────────────────────
  {
    slug: 'three-sum',
    title: '3Sum',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['arrays', 'two_pointers', 'sorting'],
    description:
      'Return all unique triplets [a,b,c] from the array that sum to 0. Print each triplet sorted ascending, one per line, groups sorted lexicographically. Input: line 1 = n, line 2 = n integers.',
    constraints: ['3 ≤ n ≤ 3000', '-10⁵ ≤ nums[i] ≤ 10⁵'],
    examples: [{ input: 'nums=[-1,0,1,2,-1,-4]', output: '-1 -1 2\n-1 0 1' }],
    testCases: [
      { input: '6\n-1 0 1 2 -1 -4', expectedOutput: '-1 -1 2\n-1 0 1' },
      { input: '3\n0 0 0', expectedOutput: '0 0 0' },
      { input: '4\n-2 0 1 1', expectedOutput: '-2 1 1', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Sort first. Fix nums[i], two-pointer the rest.',
      'Skip duplicate values at every pointer position.',
    ],
  },

  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['arrays', 'two_pointers', 'greedy'],
    description:
      'Given n heights, find the two lines that form a container holding the most water. Input: line 1 = n, line 2 = n heights.',
    constraints: ['2 ≤ n ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
    examples: [{ input: 'height=[1,8,6,2,5,4,8,3,7]', output: '49' }],
    testCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49' },
      { input: '2\n1 1', expectedOutput: '1' },
      { input: '4\n4 3 2 1', expectedOutput: '4', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Two pointers at both ends. Always move the shorter height inward.'],
  },

  {
    slug: 'longest-palindromic-substring',
    title: 'Longest Palindromic Substring',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['strings', 'dynamic_programming'],
    description:
      'Given a string s, return the longest palindromic substring. If tied, any valid answer is accepted.',
    constraints: ['1 ≤ s.length ≤ 1000'],
    examples: [{ input: 'babad', output: 'bab' }],
    testCases: [
      { input: 'babad', expectedOutput: 'bab' },
      { input: 'cbbd', expectedOutput: 'bb' },
      { input: 'a', expectedOutput: 'a' },
      { input: 'racecar', expectedOutput: 'racecar' },
      { input: 'abacaba', expectedOutput: 'abacaba', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Expand around each character as center — handles both odd and even lengths.'],
  },

  {
    slug: 'group-anagrams',
    title: 'Group Anagrams',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['arrays', 'hashing', 'strings'],
    description:
      'Group the anagrams. Print each group on a separate line, words sorted alphabetically, groups sorted by first word. Input: line 1 = n, line 2 = n space-separated strings.',
    constraints: ['1 ≤ n ≤ 10⁴', '0 ≤ word.length ≤ 100'],
    examples: [
      { input: 'n=6, strs=[eat,tea,tan,ate,nat,bat]', output: 'ate eat tea\nbat\nant nat tan' },
    ],
    testCases: [
      { input: '6\neat tea tan ate nat bat', expectedOutput: 'ate eat tea\nbat\nant nat tan' },
      { input: '1\na', expectedOutput: 'a' },
      { input: '3\nabc bca cab', expectedOutput: 'abc bca cab', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Sort each string to get a canonical key; strings with the same key are anagrams.'],
  },

  {
    slug: 'jump-game',
    title: 'Jump Game',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['arrays', 'greedy'],
    description:
      'Each element is the max jump from that index. Return true if you can reach the last index. Input: line 1 = n, line 2 = n integers.',
    constraints: ['1 ≤ n ≤ 10⁴', '0 ≤ nums[i] ≤ 10⁵'],
    examples: [{ input: 'nums=[2,3,1,1,4]', output: 'true' }],
    testCases: [
      { input: '5\n2 3 1 1 4', expectedOutput: 'true' },
      { input: '5\n3 2 1 0 4', expectedOutput: 'false' },
      { input: '1\n0', expectedOutput: 'true' },
      { input: '4\n0 2 3 1', expectedOutput: 'false', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['Track the farthest index reachable. If your position exceeds it, return false.'],
  },

  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['arrays', 'sorting'],
    description:
      'Merge all overlapping intervals. Input: line 1 = n, lines 2..n+1 each have two integers "start end". Print each merged interval on its own line.',
    constraints: ['1 ≤ n ≤ 10⁴', '0 ≤ start ≤ end ≤ 10⁴'],
    examples: [{ input: 'intervals=[[1,3],[2,6],[8,10],[15,18]]', output: '1 6\n8 10\n15 18' }],
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18' },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5' },
      { input: '1\n1 1', expectedOutput: '1 1', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Sort by start. Merge when current.start ≤ prev.end (update prev.end = max of both ends).',
    ],
  },

  {
    slug: 'rotate-array',
    title: 'Rotate Array',
    track: 'dsa',
    difficulty: 'medium',
    topics: ['arrays', 'math', 'two_pointers'],
    description:
      'Rotate the array right by k steps. Input: line 1 = n, line 2 = n integers, line 3 = k.',
    constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ k ≤ 10⁵'],
    examples: [{ input: 'nums=[1,2,3,4,5,6,7], k=3', output: '5 6 7 1 2 3 4' }],
    testCases: [
      { input: '7\n1 2 3 4 5 6 7\n3', expectedOutput: '5 6 7 1 2 3 4' },
      { input: '4\n-1 -100 3 99\n2', expectedOutput: '3 99 -1 -100' },
      { input: '3\n1 2 3\n0', expectedOutput: '1 2 3', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: ['k = k % n. Reverse the whole array, then reverse first k, then reverse rest.'],
  },

  // ─── MORE HARD ──────────────────────────────────────────────────────────
  {
    slug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['strings', 'sliding_window', 'hashing'],
    description:
      'Return the minimum window substring of s that contains every character in t (with duplicates). Return "" if none. Input: line 1 = s, line 2 = t.',
    constraints: ['1 ≤ m, n ≤ 10⁵', 's and t consist of uppercase and lowercase letters.'],
    examples: [{ input: 's="ADOBECODEBANC", t="ABC"', output: 'BANC' }],
    testCases: [
      { input: 'ADOBECODEBANC\nABC', expectedOutput: 'BANC' },
      { input: 'a\na', expectedOutput: 'a' },
      { input: 'a\naa', expectedOutput: '' },
      { input: 'ADOBECODEBANC\nAB', expectedOutput: 'BANC', isHidden: true },
      { input: 'aa\naa', expectedOutput: 'aa', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Sliding window: expand right until all chars of t are covered, then shrink from left.',
      'Use two frequency maps and a "formed" counter to track when the window is valid.',
    ],
  },

  {
    slug: 'largest-rectangle-histogram',
    title: 'Largest Rectangle in Histogram',
    track: 'dsa',
    difficulty: 'hard',
    topics: ['arrays', 'stack', 'monotonic_stack'],
    description:
      'Given n bar heights (width 1 each), return the area of the largest rectangle. Input: line 1 = n, line 2 = n heights.',
    constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
    examples: [{ input: 'heights=[2,1,5,6,2,3]', output: '10' }],
    testCases: [
      { input: '6\n2 1 5 6 2 3', expectedOutput: '10' },
      { input: '2\n2 4', expectedOutput: '4' },
      { input: '5\n1 1 1 1 1', expectedOutput: '5' },
      { input: '1\n5', expectedOutput: '5', isHidden: true },
      { input: '6\n6 2 5 4 5 1', expectedOutput: '12', isHidden: true },
    ],
    starterCode: { python: PYTHON, cpp: CPP, java: JAVA },
    hints: [
      'Monotonic increasing stack. When a shorter bar is found, pop and compute area.',
      'Append a sentinel 0 to flush remaining bars from the stack.',
    ],
  },
];

async function seed(): Promise<void> {
  await connectDatabase();
  logger.info('Seeding problems…');

  for (const problem of PROBLEMS) {
    await ProblemModel.findOneAndUpdate(
      { slug: problem.slug },
      { $set: { ...problem } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    logger.info({ slug: problem.slug }, '✓ upserted');
  }

  const currentSlugs = PROBLEMS.map((p) => p.slug);
  const removed = await ProblemModel.deleteMany({ slug: { $nin: currentSlugs } });
  if (removed.deletedCount > 0) {
    logger.info({ count: removed.deletedCount }, '🗑  removed stale problems');
  }

  logger.info({ count: PROBLEMS.length }, '✅ Seed complete');
  await disconnectDatabase();
}

seed().catch((err: unknown) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
