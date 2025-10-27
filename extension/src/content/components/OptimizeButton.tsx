interface OptimizeButtonProps {
  onClick: () => void;
  position: { top: number; left: number };
}

export const OptimizeButton = ({ onClick, position }: OptimizeButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="promptlens-optimize-button"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 10000,
        padding: '8px 16px',
        backgroundColor: '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#4f46e5';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#6366f1';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
      }}
    >
      <span style={{ fontSize: '16px' }}>✨</span>
      <span>Optimize with PromptLens</span>
    </button>
  );
};
