import { createRoot } from 'react-dom/client';
import App from './App';
import ThemeCustomization from './theme';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ThemeCustomization>
      <App />
    </ThemeCustomization>
  );
}
