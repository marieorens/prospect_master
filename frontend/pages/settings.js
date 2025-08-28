import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { FaCog, FaSpinner, FaExclamationTriangle, FaDatabase, FaUserSecret, FaRobot, FaServer } from 'react-icons/fa';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState({});
  const [logsLoading, setLogsLoading] = useState(true);
  
  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLogsLoading(true);
      
      try {
        const response = await fetch('/api/logs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        
        const data = await response.json();
        setLogs(data);
        setLogsLoading(false);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setError(error.message);
        setLogsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);
  
  // Handle health check
  const handleHealthCheck = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      
      const data = await response.json();
      toast.success(`Server is healthy. Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      setLoading(false);
    } catch (error) {
      console.error('Health check error:', error);
      toast.error(`Health check failed: ${error.message}`);
      setLoading(false);
    }
  };
  
  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="text-red-500 text-lg mr-2" />
              <p className="text-red-700">Error: {error}</p>
            </div>
          </div>
        )}
        
        {/* System Status */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">
              <FaServer className="inline-block mr-2" />
              System Status
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Check if the server is running properly</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleHealthCheck}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 inline-block" />
                    Checking...
                  </>
                ) : (
                  'Run Health Check'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Configuration */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">
              <FaCog className="inline-block mr-2" />
              Configuration
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <FaDatabase className="text-blue-600 mr-2" />
                  <h4 className="text-md font-medium text-gray-900">Database</h4>
                </div>
                <p className="text-sm text-gray-500">SQLite (local file)</p>
                <p className="text-xs text-gray-400 mt-1">Configured in .env</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <FaUserSecret className="text-purple-600 mr-2" />
                  <h4 className="text-md font-medium text-gray-900">Credentials</h4>
                </div>
                <p className="text-sm text-gray-500">SEMrush login</p>
                <p className="text-xs text-gray-400 mt-1">Configured in .env</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <FaRobot className="text-green-600 mr-2" />
                  <h4 className="text-md font-medium text-gray-900">Scraping</h4>
                </div>
                <p className="text-sm text-gray-500">Puppeteer + Cheerio</p>
                <p className="text-xs text-gray-400 mt-1">Concurrency in .env</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                To modify configuration, edit the <code>.env</code> file in the project root directory.
              </p>
            </div>
          </div>
        </div>
        
        {/* Logs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
          </div>
          <div className="border-t border-gray-200">
            {logsLoading ? (
              <div className="flex justify-center items-center p-12">
                <FaSpinner className="animate-spin text-indigo-600 text-2xl mr-2" />
                <span>Loading logs...</span>
              </div>
            ) : Object.keys(logs).length > 0 ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="mb-4">
                  <label htmlFor="log-file" className="form-label">Select Log File</label>
                  <select
                    id="log-file"
                    className="form-input"
                    onChange={(e) => {
                      const logElement = document.getElementById('log-content');
                      if (logElement) {
                        logElement.textContent = logs[e.target.value] || 'No logs found';
                      }
                    }}
                  >
                    {Object.keys(logs).map((logFile) => (
                      <option key={logFile} value={logFile}>
                        {logFile}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre
                    id="log-content"
                    className="text-xs text-gray-700 overflow-x-auto max-h-96"
                  >
                    {logs[Object.keys(logs)[0]] || 'No logs found'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                No logs available
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}