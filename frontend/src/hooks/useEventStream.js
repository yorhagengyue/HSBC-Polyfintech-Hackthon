import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const useEventStream = (onMessage, onConnect, onDisconnect) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const isConnectedRef = useRef(false);
  const connectionTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
      wsRef.current = ws;

      // Connection timeout (3 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (!isConnectedRef.current) {
          toast.error('实时数据连接超时，正在重连...', {
            id: 'ws-timeout',
            duration: 3000,
            icon: '🔄'
          });
        }
      }, 3000);

      ws.onopen = () => {
        console.log('WebSocket connected');
        isConnectedRef.current = true;
        reconnectCountRef.current = 0;
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }

        // Show success toast only after reconnection
        if (reconnectCountRef.current > 0) {
          toast.success('实时数据连接已恢复', {
            id: 'ws-connected',
            duration: 2000,
            icon: '✅'
          });
        }

        if (onConnect) onConnect();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        isConnectedRef.current = false;
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }

        if (onDisconnect) onDisconnect();

        // Show disconnection toast
        toast.error('实时数据暂停，正在重连...', {
          id: 'ws-disconnected',
          duration: 3000,
          icon: '🔄'
        });

        // Attempt reconnection with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectCountRef.current += 1;
          connect();
        }, delay);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectedRef.current = false;
        
        toast.error('实时数据连接出错，正在重连...', {
          id: 'ws-error',
          duration: 3000,
          icon: '⚠️'
        });
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      toast.error('无法建立实时数据连接', {
        id: 'ws-create-error',
        duration: 3000,
        icon: '❌'
      });
    }
  }, [onMessage, onConnect, onDisconnect]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      
      // Dismiss any active toasts
      toast.dismiss('ws-connected');
      toast.dismiss('ws-disconnected');
      toast.dismiss('ws-error');
      toast.dismiss('ws-timeout');
      toast.dismiss('ws-create-error');
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    sendMessage,
    isConnected: isConnectedRef.current
  };
};

export default useEventStream; 