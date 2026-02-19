import { hydrateRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './main.css';

hydrateRoot(document.getElementById('root'), <App initialMessages={window.__INITIAL_DATA__ ?? []} />);
