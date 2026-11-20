import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Identity } from 'spacetimedb';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { DbConnection, ErrorContext } from './module_bindings/index.ts';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'https://maincloud.spacetimedb.com';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'powerplantnov';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;

const onConnect = (_conn: DbConnection, identity: Identity, token: string) => {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* Private browsing may block storage */ }
  console.log(
    'Connected to SpacetimeDB with identity:',
    identity.toHexString()
  );
};

const onDisconnect = () => {
  console.warn('Disconnected from SpacetimeDB; waiting for automatic reconnection.');
};

const onConnectError = (_ctx: ErrorContext, err: Error) => {
  console.error('Error connecting to SpacetimeDB:', err);
  window.dispatchEvent(new CustomEvent('powerplant-connection-error', {
    detail: `Cannot connect to SpacetimeDB database ${DB_NAME} at ${HOST}: ${err.message}`,
  }));
};

const connectionBuilder = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withAutomaticReconnect()
  .withToken((() => { try { return localStorage.getItem(TOKEN_KEY) || undefined; } catch { return undefined; } })())
  .onConnect(onConnect)
  .onAutomaticReconnect((_conn, _identity, token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* Storage unavailable */ }
    console.info('SpacetimeDB session restored');
  })
  .onDisconnect(onDisconnect)
  .onConnectError(onConnectError);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <App />
    </SpacetimeDBProvider>
  </StrictMode>
);
