export interface TextareaInfo {
  element: HTMLTextAreaElement | HTMLElement;
  type: 'textarea' | 'contenteditable';
  platform: 'chatgpt' | 'gemini' | 'unknown';
  value: string;
}

export type Platform = 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'unknown';

export interface PlatformDetector {
  name: Platform;
  detect: () => boolean;
  findTextarea: () => HTMLTextAreaElement | HTMLElement | null;
  getValue: (element: HTMLTextAreaElement | HTMLElement) => string;
  setValue: (element: HTMLTextAreaElement | HTMLElement, value: string) => void;
}

const chatGptDetector: PlatformDetector = {
  name: 'chatgpt',
  detect: () => {
    const hostname = window.location.hostname;
    return hostname.includes('openai.com') || hostname.includes('chatgpt.com');
  },
  findTextarea: () => {
    const textarea = document.querySelector('textarea#prompt-textarea') as HTMLTextAreaElement;
    if (textarea) return textarea;

    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      if (ta.offsetParent !== null && !ta.disabled) {
        return ta;
      }
    }

    const contentEditables = document.querySelectorAll('[contenteditable="true"]');
    for (const ce of contentEditables) {
      if (ce instanceof HTMLElement && ce.offsetParent !== null && !ce.getAttribute('disabled')) {
        return ce;
      }
    }

    return null;
  },
  getValue: (element: HTMLTextAreaElement | HTMLElement) => {
    if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    return element.textContent || element.innerText || '';
  },
  setValue: (element: HTMLTextAreaElement | HTMLElement, value: string) => {
    if (element instanceof HTMLTextAreaElement) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
};

const geminiDetector: PlatformDetector = {
  name: 'gemini',
  detect: () => {
    return window.location.hostname.includes('gemini.google.com');
  },
  findTextarea: () => {
    const contentEditables = document.querySelectorAll('[contenteditable="true"]');
    for (const ce of contentEditables) {
      if (
        ce instanceof HTMLElement &&
        ce.offsetParent !== null &&
        ce.getAttribute('role') === 'textbox'
      ) {
        return ce;
      }
    }

    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      if (ta.offsetParent !== null && !ta.disabled) {
        return ta;
      }
    }

    return null;
  },
  getValue: (element: HTMLTextAreaElement | HTMLElement) => {
    if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    return element.textContent || element.innerText || '';
  },
  setValue: (element: HTMLTextAreaElement | HTMLElement, value: string) => {
    if (element instanceof HTMLTextAreaElement) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
};

const detectors: PlatformDetector[] = [chatGptDetector, geminiDetector];

export const detectPlatform = (): Platform => {
  for (const detector of detectors) {
    if (detector.detect()) {
      return detector.name;
    }
  }
  return 'unknown';
};

export const getCurrentDetector = (): PlatformDetector | null => {
  for (const detector of detectors) {
    if (detector.detect()) {
      return detector;
    }
  }
  return null;
};

export const findActiveTextarea = (): TextareaInfo | null => {
  const detector = getCurrentDetector();
  if (!detector) return null;

  const element = detector.findTextarea();
  if (!element) return null;

  const type = element instanceof HTMLTextAreaElement ? 'textarea' : 'contenteditable';
  const value = detector.getValue(element);

  return {
    element,
    type,
    platform: detector.name as 'chatgpt' | 'gemini' | 'unknown',
    value
  };
};

export const getTextareaValue = (element: HTMLTextAreaElement | HTMLElement): string => {
  const detector = getCurrentDetector();
  if (!detector) return '';
  return detector.getValue(element);
};

export const setTextareaValue = (
  element: HTMLTextAreaElement | HTMLElement,
  value: string
): void => {
  const detector = getCurrentDetector();
  if (!detector) return;
  detector.setValue(element, value);
};
