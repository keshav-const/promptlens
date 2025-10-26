import React, { useState, useEffect } from 'react';
import { sendMessageToBackground, MessageType } from '@/utils/messaging';
import { getConfig, AppConfig } from '@/utils/config';

const Popup: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [pingResponse, setPingResponse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await getConfig();
      setConfig(configData);
      setError('');
    } catch (err) {
      setError('Failed to load configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await sendMessageToBackground({
        type: MessageType.PING,
        payload: { source: 'popup' }
      });

      if (response.success) {
        setPingResponse(`Connection successful! Response: ${JSON.stringify(response.data)}`);
        setError('');
      } else {
        setError(`Connection failed: ${response.error}`);
      }
    } catch (err) {
      setError('Error testing connection');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1 className="title">AI Chat Assistant</h1>
        <p className="subtitle">Chrome Extension</p>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="config-section">
              <h2>Configuration</h2>
              {config && (
                <div className="config-details">
                  <div className="config-item">
                    <span className="label">API Base URL:</span>
                    <span className="value">{config.apiBaseUrl}</span>
                  </div>
                  <div className="config-item">
                    <span className="label">Extension ID:</span>
                    <span className="value">{config.extensionId || 'Not set'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="actions">
              <button onClick={testConnection} className="button button-primary" disabled={loading}>
                Test Connection
              </button>
            </div>

            {pingResponse && (
              <div className="response-section">
                <h3>Response:</h3>
                <pre className="response-text">{pingResponse}</pre>
              </div>
            )}
          </>
        )}
      </div>

      <div className="footer">
        <p className="version">Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Popup;
