import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getStoredToken } from './api';

const API_URL =
  import.meta.env.VITE_AUTH_API ?? 'http://localhost:8080/api';

const SOCKET_URL =
  API_URL.replace(/\/api\/?$/, '') + '/ws-codespace';

export function connectWorkspaceDiscussion(
  workspaceId: string | number,
  onMessage: (message: any) => void,
  onError?: (error: string) => void
) {
  const token = getStoredToken();

  if (!token) {
    onError?.('Please log in to access workspace discussion.');
    return () => {};
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(SOCKET_URL),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,

    onConnect: () => {
      client.subscribe(
        `/topic/workspace/${workspaceId}/discussion`,
        (frame: IMessage) => {
          try {
            onMessage(JSON.parse(frame.body));
          } catch {
            onError?.('Received an invalid discussion message.');
          }
        }
      );
    },

    onStompError: (frame) => {
      onError?.(
        frame.headers.message ??
          'Workspace discussion connection failed.'
      );
    },

    onWebSocketError: () => {
      onError?.('Unable to connect to workspace discussion.');
    },
  });

  client.activate();

  return () => {
    void client.deactivate();
  };
}