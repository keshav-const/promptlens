import { useState } from 'react';

export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  explanation?: string;
  tokenAnalysis?: {
    original: number;
    optimized: number;
    saved: number;
    percentageSaved: number;
    originalCost: string;
    optimizedCost: string;
    costSavings: string;
  };
}

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: OptimizationResult | null;
  isLoading: boolean;
  error: string | null;
  onReplace: (optimizedPrompt: string) => void;
  onCopy: (optimizedPrompt: string) => void;
  onSave: (result: OptimizationResult) => void;
  isSaving: boolean;
}

export const OptimizationModal = ({
  isOpen,
  onClose,
  result,
  isLoading,
  error,
  onReplace,
  onCopy,
  onSave,
  isSaving
}: OptimizationModalProps) => {
  const [activeTab, setActiveTab] = useState<'original' | 'optimized' | 'explanation'>('optimized');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (result?.optimizedPrompt) {
      onCopy(result.optimizedPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSave = () => {
    if (result) {
      onSave(result);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleReplace = () => {
    if (result?.optimizedPrompt) {
      onReplace(result.optimizedPrompt);
    }
  };

  return (
    <>
      <div
        className="promptlens-modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
        onClick={onClose}
      >
        <div
          className="promptlens-modal"
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              PromptLens Optimization
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              ×
            </button>
          </div>

          {isLoading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'promptlens-spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }}
                />
                <p style={{ color: '#6b7280', margin: 0 }}>Optimizing your prompt...</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
              }}
            >
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '16px',
                  maxWidth: '500px'
                }}
              >
                <p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && result && (
            <>
              <div
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  padding: '0 24px'
                }}
              >
                <button
                  onClick={() => setActiveTab('original')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: activeTab === 'original' ? '#6366f1' : '#6b7280',
                    borderBottom:
                      activeTab === 'original' ? '2px solid #6366f1' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  Original
                </button>
                <button
                  onClick={() => setActiveTab('optimized')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: activeTab === 'optimized' ? '#6366f1' : '#6b7280',
                    borderBottom:
                      activeTab === 'optimized' ? '2px solid #6366f1' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  Optimized
                </button>
                {result.explanation && (
                  <button
                    onClick={() => setActiveTab('explanation')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      color: activeTab === 'explanation' ? '#6366f1' : '#6b7280',
                      borderBottom:
                        activeTab === 'explanation' ? '2px solid #6366f1' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    Explanation
                  </button>
                )}
              </div>

              {/* Token Savings Banner */}
              {result.tokenAnalysis && result.tokenAnalysis.saved !== 0 && (
                <div
                  style={{
                    backgroundColor: result.tokenAnalysis.saved > 0 ? '#f0fdf4' : '#fef2f2',
                    borderBottom: `1px solid ${result.tokenAnalysis.saved > 0 ? '#86efac' : '#fecaca'}`,
                    padding: '12px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>
                      {result.tokenAnalysis.saved > 0 ? '✓' : '⚠'}
                    </span>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: result.tokenAnalysis.saved > 0 ? '#166534' : '#991b1b'
                      }}>
                        {result.tokenAnalysis.saved > 0
                          ? `${result.tokenAnalysis.saved} tokens saved (${result.tokenAnalysis.percentageSaved}%)`
                          : `${Math.abs(result.tokenAnalysis.saved)} tokens added`
                        }
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: result.tokenAnalysis.saved > 0 ? '#15803d' : '#b91c1c'
                      }}>
                        {result.tokenAnalysis.original} → {result.tokenAnalysis.optimized} tokens
                        {result.tokenAnalysis.saved > 0 && (
                          <span style={{ marginLeft: '8px' }}>
                            • Saves {result.tokenAnalysis.costSavings}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '24px'
                }}
              >
                {activeTab === 'original' && (
                  <div
                    style={{
                      backgroundColor: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}
                  >
                    {result.originalPrompt}
                  </div>
                )}
                {activeTab === 'optimized' && (
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      padding: '16px',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}
                  >
                    {result.optimizedPrompt}
                  </div>
                )}
                {activeTab === 'explanation' && result.explanation && (
                  <div
                    style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#374151'
                    }}
                  >
                    {result.explanation}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: '20px 24px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: saveSuccess ? '#10b981' : 'white',
                    color: saveSuccess ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isSaving ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving && !saveSuccess) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saveSuccess) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save'}
                </button>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: copySuccess ? '#10b981' : 'white',
                    color: copySuccess ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!copySuccess) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copySuccess) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {copySuccess ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleReplace}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4f46e5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6366f1';
                  }}
                >
                  Replace
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes promptlens-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
};
