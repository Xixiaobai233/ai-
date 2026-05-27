import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom 没有 scrollIntoView，mock 掉
Element.prototype.scrollIntoView = vi.fn();
