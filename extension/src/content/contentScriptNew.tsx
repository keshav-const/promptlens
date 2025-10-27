import { createRoot, Root } from 'react-dom/client';
import { sendMessageToBackground, MessageType } from '@/utils/messaging';
import {
  findActiveTextarea,
  getTextareaValue,
  setTextareaValue,
  detectPlatform
} from '@/utils/textareaDetector';
import { OptimizeButton } from './components/OptimizeButton';
import { OptimizationModal, OptimizationResult } from './components/OptimizationModal';

console.log('PromptLens content script loaded on:', window.location.href);

const platform = detectPlatform();
console.log('Detected platform:', platform);

class PromptLensUI {
  private buttonRoot: Root | null = null;
  private modalRoot: Root | null = null;
  private buttonContainer: HTMLDivElement | null = null;
  private modalContainer: HTMLDivElement | null = null;
  private currentTextarea: HTMLTextAreaElement | HTMLElement | null = null;
  private isModalOpen = false;
  private optimizationResult: OptimizationResult | null = null;
  private isLoading = false;
  private error: string | null = null;
  private isSaving = false;
  private observer: MutationObserver | null = null;
  private focusCheckInterval: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.setupMutationObserver();
    this.setupFocusDetection();
    this.checkForTextarea();
  }

  private setupMutationObserver() {
    this.observer = new MutationObserver(() => {
      this.checkForTextarea();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private setupFocusDetection() {
    this.focusCheckInterval = window.setInterval(() => {
      this.checkForTextarea();
    }, 1000);

    document.addEventListener('focusin', () => {
      setTimeout(() => this.checkForTextarea(), 100);
    });

    document.addEventListener('click', () => {
      setTimeout(() => this.checkForTextarea(), 100);
    });

    window.addEventListener('scroll', () => {
      this.updateButtonPosition();
    });

    window.addEventListener('resize', () => {
      this.updateButtonPosition();
    });
  }

  private checkForTextarea() {
    const textareaInfo = findActiveTextarea();

    if (textareaInfo && textareaInfo.element !== this.currentTextarea) {
      this.currentTextarea = textareaInfo.element;
      this.showButton();
    } else if (!textareaInfo && this.currentTextarea) {
      if (document.activeElement !== this.currentTextarea) {
        this.hideButton();
      }
    }
  }

  private calculateButtonPosition(): { top: number; left: number } {
    if (!this.currentTextarea) {
      return { top: 100, left: 100 };
    }

    const rect = this.currentTextarea.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop - 50,
      left: rect.right + scrollLeft + 10
    };
  }

  private showButton() {
    if (!this.buttonContainer) {
      this.buttonContainer = document.createElement('div');
      this.buttonContainer.id = 'promptlens-button-container';
      document.body.appendChild(this.buttonContainer);
      this.buttonRoot = createRoot(this.buttonContainer);
    }

    this.updateButtonPosition();
  }

  private updateButtonPosition() {
    if (!this.buttonRoot || !this.currentTextarea) return;

    const position = this.calculateButtonPosition();
    this.buttonRoot.render(
      <OptimizeButton onClick={() => this.handleOptimizeClick()} position={position} />
    );
  }

  private hideButton() {
    if (this.buttonRoot && this.buttonContainer) {
      this.buttonRoot.unmount();
      this.buttonContainer.remove();
      this.buttonRoot = null;
      this.buttonContainer = null;
      this.currentTextarea = null;
    }
  }

  private async handleOptimizeClick() {
    if (!this.currentTextarea) return;

    const prompt = getTextareaValue(this.currentTextarea);

    if (!prompt || prompt.trim().length === 0) {
      this.showModal();
      this.error = 'Please enter a prompt before optimizing.';
      this.renderModal();
      return;
    }

    this.showModal();
    this.isLoading = true;
    this.error = null;
    this.optimizationResult = null;
    this.renderModal();

    console.log('Optimizing prompt:', prompt);

    try {
      const response = await sendMessageToBackground({
        type: MessageType.OPTIMIZE_PROMPT,
        payload: { prompt }
      });

      if (response.success && response.data) {
        const data = response.data as {
          success: boolean;
          data?: { optimizedPrompt: string; explanation?: string };
        };

        if (data.success && data.data) {
          this.optimizationResult = {
            originalPrompt: prompt,
            optimizedPrompt: data.data.optimizedPrompt,
            explanation: data.data.explanation
          };
          this.error = null;
          console.log('Optimization successful:', this.optimizationResult);
        } else {
          this.error = 'Failed to optimize prompt. Please try again.';
        }
      } else {
        this.error = response.error || 'Failed to optimize prompt. Please try again.';
        console.error('Optimization failed:', response.error);
      }
    } catch (error) {
      console.error('Error during optimization:', error);
      this.error = 'An unexpected error occurred. Please try again.';
    } finally {
      this.isLoading = false;
      this.renderModal();
    }
  }

  private showModal() {
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.id = 'promptlens-modal-container';
      document.body.appendChild(this.modalContainer);
      this.modalRoot = createRoot(this.modalContainer);
    }

    this.isModalOpen = true;
    this.renderModal();
  }

  private closeModal() {
    this.isModalOpen = false;
    this.renderModal();

    setTimeout(() => {
      if (this.modalRoot && this.modalContainer) {
        this.modalRoot.unmount();
        this.modalContainer.remove();
        this.modalRoot = null;
        this.modalContainer = null;
      }
      this.optimizationResult = null;
      this.error = null;
      this.isLoading = false;
      this.isSaving = false;
    }, 300);
  }

  private renderModal() {
    if (!this.modalRoot) return;

    this.modalRoot.render(
      <OptimizationModal
        isOpen={this.isModalOpen}
        onClose={() => this.closeModal()}
        result={this.optimizationResult}
        isLoading={this.isLoading}
        error={this.error}
        onReplace={(optimizedPrompt) => this.handleReplace(optimizedPrompt)}
        onCopy={(optimizedPrompt) => this.handleCopy(optimizedPrompt)}
        onSave={(result) => this.handleSave(result)}
        isSaving={this.isSaving}
      />
    );
  }

  private handleReplace(optimizedPrompt: string) {
    if (this.currentTextarea) {
      setTextareaValue(this.currentTextarea, optimizedPrompt);
      console.log('Replaced prompt with optimized version');
      this.closeModal();
    }
  }

  private handleCopy(optimizedPrompt: string) {
    navigator.clipboard
      .writeText(optimizedPrompt)
      .then(() => {
        console.log('Copied optimized prompt to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy to clipboard:', error);
      });
  }

  private async handleSave(result: OptimizationResult) {
    this.isSaving = true;
    this.renderModal();

    console.log('Saving prompt:', result);

    try {
      const response = await sendMessageToBackground({
        type: MessageType.SAVE_PROMPT,
        payload: {
          originalPrompt: result.originalPrompt,
          optimizedPrompt: result.optimizedPrompt,
          explanation: result.explanation
        }
      });

      if (response.success) {
        console.log('Prompt saved successfully');
      } else {
        console.error('Failed to save prompt:', response.error);
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      this.isSaving = false;
      this.renderModal();
    }
  }

  public destroy() {
    this.hideButton();
    if (this.modalRoot && this.modalContainer) {
      this.modalRoot.unmount();
      this.modalContainer.remove();
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
    }
  }
}

let promptLensUI: PromptLensUI | null = null;

const initialize = () => {
  if (promptLensUI) {
    promptLensUI.destroy();
  }
  promptLensUI = new PromptLensUI();
  console.log('PromptLens UI initialized');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

window.addEventListener('beforeunload', () => {
  if (promptLensUI) {
    promptLensUI.destroy();
  }
});

console.log('PromptLens extension ready');
