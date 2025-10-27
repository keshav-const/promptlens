/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';

describe('textareaDetector', () => {
  describe('Basic textarea operations', () => {
    it('should create and manipulate textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'Test prompt';
      expect(textarea.value).toBe('Test prompt');

      textarea.value = 'New value';
      expect(textarea.value).toBe('New value');
    });

    it('should create and manipulate contenteditable', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      div.textContent = 'Test prompt';
      expect(div.textContent).toBe('Test prompt');

      div.textContent = 'New value';
      expect(div.textContent).toBe('New value');
    });

    it('should dispatch events on textarea', () => {
      const textarea = document.createElement('textarea');
      let inputFired = false;
      textarea.addEventListener('input', () => {
        inputFired = true;
      });

      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      expect(inputFired).toBe(true);
    });
  });
});
