import { renderToString } from 'react-dom/server';
import { App } from './App.jsx';
import './main.css';

export function render(initialMessages = []) {
  return renderToString(<App initialMessages={initialMessages} />);
}
