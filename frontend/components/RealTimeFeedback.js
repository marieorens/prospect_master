import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimesCircle, 
  FaClock,
  FaPlay,
  FaPause,
  FaStop 
} from 'react-icons/fa';

/**
 * Composant de feedback temps réel pour suivre les processus
 * Affiche une barre de progression, étapes détaillées, temps estimé, etc.
 */
export default function RealTimeFeedback({ 
  processId, 
  onComplete, 
  onError,
  showDetails = true,
  compact = false,
  className = ""
}) {
  const [process, setProcess] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  /**
   * Initialise la connexion WebSocket
   */
  const initWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/feedback`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for feedback');
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        
        // S'abonner au processus si spécifié
        if (processId) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            processId: processId
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Tentative de reconnexion automatique
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            initWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [processId, reconnectAttempts]);

  /**
   * Gère les messages WebSocket reçus
   */
  const handleWebSocketMessage = useCallback((data) => {
    setLastUpdate(new Date());

    switch (data.type) {
      case 'initial_state':
        // Rechercher notre processus dans l'état initial
        if (processId) {
          const currentProcess = data.activeProcesses.find(p => p.id === processId) ||
                                data.processHistory?.find(p => p.id === processId);
          if (currentProcess) {
            setProcess(currentProcess);
          }
        }
        break;

      case 'process_started':
        if (!processId || data.process.id === processId) {
          setProcess(data.process);
        }
        break;

      case 'step_updated':
        if (!processId || data.process.id === processId) {
          setProcess(data.process);
        }
        break;

      case 'process_completed':
        if (!processId || data.process.id === processId) {
          setProcess(data.process);
          if (onComplete) {
            onComplete(data.process);
          }
        }
        break;

      case 'error_added':
        if (!processId || data.processId === processId) {
          // Recharger l'état du processus
          fetchProcessStatus();
          if (data.error.fatal && onError) {
            onError(data.error);
          }
        }
        break;

      case 'subscription_confirmed':
        console.log(`Subscribed to process: ${data.processId}`);
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [processId, onComplete, onError]);

  /**
   * Récupère l'état du processus via API REST
   */
  const fetchProcessStatus = useCallback(async () => {
    if (!processId) return;

    try {
      const response = await fetch(`/api/feedback/processes/${processId}`);
      const data = await response.json();
      
      if (data.success) {
        setProcess(data.data);
      } else {
        console.error('Error fetching process status:', data.error);
      }
    } catch (error) {
      console.error('Error fetching process status:', error);
    }
  }, [processId]);

  /**
   * Formate la durée en format lisible
   */
  const formatDuration = (milliseconds) => {
    if (!milliseconds) return '--';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Obtient l'icône selon le statut du processus
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <FaSpinner className="animate-spin text-blue-500" />;
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'error':
        return <FaTimesCircle className="text-red-500" />;
      case 'cancelled':
        return <FaStop className="text-yellow-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  /**
   * Obtient la couleur de la barre de progression selon le statut
   */
  const getProgressColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Effet pour initialiser la connexion WebSocket
  useEffect(() => {
    initWebSocket();
    
    // Si un processId est fourni, récupérer immédiatement l'état
    if (processId) {
      fetchProcessStatus();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initWebSocket, fetchProcessStatus]);

  // Ping périodique pour maintenir la connexion
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping toutes les 30 secondes

    return () => clearInterval(pingInterval);
  }, []);

  if (!process) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <FaSpinner className="animate-spin" />
        <span>En attente du processus...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          {getStatusIcon(process.status)}
          <span className="text-sm font-medium">{process.description}</span>
        </div>
        
        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[100px]">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(process.status)}`}
            style={{ width: `${process.progress}%` }}
          ></div>
        </div>
        
        <span className="text-sm text-gray-600">{process.progress}%</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header du processus */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(process.status)}
          <div>
            <h3 className="font-semibold text-gray-900">{process.description}</h3>
            <p className="text-sm text-gray-500">Type: {process.type}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Connexion: 
            <span className={`ml-1 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
              {connectionStatus}
            </span>
          </div>
          {lastUpdate && (
            <div className="text-xs text-gray-400">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progression ({process.currentStep}/{process.totalSteps})
          </span>
          <span className="text-sm font-medium text-gray-700">{process.progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(process.status)}`}
            style={{ width: `${process.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Informations de timing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Démarré:</span>
          <div className="font-medium">
            {new Date(process.startTime).toLocaleTimeString()}
          </div>
        </div>
        
        <div>
          <span className="text-gray-500">Durée:</span>
          <div className="font-medium">
            {process.totalDuration 
              ? formatDuration(process.totalDuration)
              : formatDuration(Date.now() - process.startTime)
            }
          </div>
        </div>
        
        {process.estimatedTimeRemaining && process.status === 'running' && (
          <div>
            <span className="text-gray-500">Temps restant:</span>
            <div className="font-medium text-blue-600">
              ~{Math.ceil(process.estimatedTimeRemaining / 60)} min
            </div>
          </div>
        )}
        
        {process.endTime && (
          <div>
            <span className="text-gray-500">Terminé:</span>
            <div className="font-medium">
              {new Date(process.endTime).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Détails des étapes récentes */}
      {showDetails && process.recentSteps && process.recentSteps.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Étapes récentes:</h4>
          <div className="space-y-2">
            {process.recentSteps.slice(-5).map((step, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-gray-900">{step.description}</span>
                {step.duration > 0 && (
                  <span className="text-gray-500 text-xs">
                    ({formatDuration(step.duration)})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erreurs et avertissements */}
      {(process.errors?.length > 0 || process.warnings?.length > 0) && (
        <div className="border-t pt-4 mt-4">
          {process.errors?.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-red-700 mb-2 flex items-center">
                <FaTimesCircle className="mr-2" />
                Erreurs ({process.errors.length})
              </h4>
              <div className="space-y-1">
                {process.errors.slice(-3).map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <div className="font-medium">{error.message}</div>
                    <div className="text-xs text-red-500">
                      {new Date(error.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {process.warnings?.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                <FaExclamationTriangle className="mr-2" />
                Avertissements ({process.warnings.length})
              </h4>
              <div className="space-y-1">
                {process.warnings.slice(-3).map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    <div className="font-medium">{warning.message}</div>
                    <div className="text-xs text-yellow-500">
                      {new Date(warning.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message de completion */}
      {process.completionMessage && (
        <div className="border-t pt-4 mt-4">
          <div className={`p-3 rounded ${
            process.status === 'completed' 
              ? 'bg-green-50 text-green-700' 
              : process.status === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {process.completionMessage}
          </div>
        </div>
      )}

      {/* Résultats */}
      {process.results && Object.keys(process.results).length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-gray-900 mb-3">Résultats:</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(process.results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
