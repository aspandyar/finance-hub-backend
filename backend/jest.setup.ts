// Jest setup file
// This file ensures Jest types are available globally
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill setImmediate for Node 25 ESM
if (typeof setImmediate === 'undefined') {
    (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => {
      return setTimeout(fn, 0, ...args);
    };
  }