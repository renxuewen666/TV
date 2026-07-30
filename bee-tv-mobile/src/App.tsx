import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';
import { useAppConfigStore } from './store/appConfigStore';

function App() {
  const fetchConfig = useAppConfigStore(s => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
