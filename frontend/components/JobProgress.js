import { useState, useEffect } from 'react';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function JobProgress({ jobId, onComplete }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch job status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/scrape/status?jobId=${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }
      
      const data = await response.json();
      setStatus(data);
      setLoading(false);
      
      // If job is done, call onComplete callback
      if (data.state === 'done' && onComplete) {
        onComplete(data);
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
      setError(error.message);
      setLoading(false);
    }
  };
  
  // Poll for status updates
  useEffect(() => {
    if (!jobId) return;
    
    fetchStatus();
    
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, [jobId]);
  
  if (loading && !status) {
    return (
      <div className="flex justify-center items-center p-8">
        <FaSpinner className="animate-spin text-indigo-600 text-2xl mr-2" />
        <span>Loading job status...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <div className="flex">
          <FaExclamationTriangle className="text-red-500 text-lg mr-2" />
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }
  
  if (!status) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
        <div className="flex">
          <FaExclamationTriangle className="text-yellow-500 text-lg mr-2" />
          <p className="text-yellow-700">No job status found for ID: {jobId}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6 my-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Job Progress</h3>
        <p className="text-sm text-gray-500">Job ID: {jobId}</p>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {status.state === 'done' ? 'Completed' : 'In Progress'}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {status.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              status.state === 'done' ? 'bg-green-600' : 'bg-indigo-600'
            }`}
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-semibold text-gray-900">{status.total}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-sm text-green-500">Completed</p>
          <p className="text-xl font-semibold text-green-700">{status.completed}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-md">
          <p className="text-sm text-red-500">Failed</p>
          <p className="text-xl font-semibold text-red-700">{status.failed}</p>
        </div>
      </div>
      
      {status.state === 'done' && (
        <div className="mt-4 flex items-center justify-center text-green-600">
          <FaCheckCircle className="mr-2" />
          <span>Job completed</span>
        </div>
      )}
    </div>
  );
}