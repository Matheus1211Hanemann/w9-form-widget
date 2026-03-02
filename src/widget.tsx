import React from 'react';
import ReactDOM from 'react-dom/client';
import { FormWizard } from './components';
import './styles.css';

interface W9WidgetConfig {
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  onComplete?: (pdfBlob: Blob) => void;
  onError?: (error: Error) => void;
}

const W9App: React.FC<{ config?: W9WidgetConfig }> = ({ config }) => {
  React.useEffect(() => {
    if (config?.theme) {
      const root = document.documentElement;
      if (config.theme.primaryColor) {
        root.style.setProperty('--w9-primary-color', config.theme.primaryColor);
      }
      if (config.theme.fontFamily) {
        root.style.setProperty('--w9-font-family', config.theme.fontFamily);
      }
    }
  }, [config]);

  return (
    <div className="w9-widget">
      <FormWizard />
    </div>
  );
};

function init(selector: string, config?: W9WidgetConfig): void {
  const container = document.querySelector(selector);

  if (!container) {
    console.error(`W9Widget: Container element "${selector}" not found.`);
    return;
  }

  const root = ReactDOM.createRoot(container as HTMLElement);
  root.render(
    <React.StrictMode>
      <W9App config={config} />
    </React.StrictMode>
  );
}

const W9Widget = {
  init,
  version: '1.0.0'
};

declare global {
  interface Window {
    W9Widget: typeof W9Widget;
  }
}

window.W9Widget = W9Widget;

export { W9Widget, init };
export default W9Widget;
