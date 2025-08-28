import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { FaUpload, FaPlus, FaSpinner } from 'react-icons/fa';
import { useForm } from 'react-hook-form';

export default function Import() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  
  // Handle CSV upload
  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload CSV');
      }
      
      const result = await response.json();
      setUploadResult(result);
      toast.success(`Imported ${result.imported} domains (${result.skipped} skipped)`);
      
      // Redirect to domains page after successful import
      setTimeout(() => {
        router.push('/domains');
      }, 2000);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle manual domain submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Split domains by newline, comma, or space
      const domains = data.domains
        .split(/[\n,\s]+/)
        .map(domain => domain.trim())
        .filter(Boolean);
      
      if (domains.length === 0) {
        toast.error('Please enter at least one domain');
        setIsSubmitting(false);
        return;
      }
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to import domains');
      }
      
      const result = await response.json();
      setUploadResult(result);
      toast.success(`Imported ${result.imported} domains (${result.skipped} skipped)`);
      reset();
      
      // Redirect to domains page after successful import
      setTimeout(() => {
        router.push('/domains');
      }, 2000);
    } catch (error) {
      console.error('Error importing domains:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout title="Import Domains">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Import Domains</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Upload */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">
                <FaUpload className="inline-block mr-2" />
                Upload CSV
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a CSV file containing domains (one per line or in a column)
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV up to 10MB</p>
                </div>
              </div>
              
              {isUploading && (
                <div className="mt-4 flex justify-center">
                  <FaSpinner className="animate-spin text-indigo-600 text-xl" />
                  <span className="ml-2 text-gray-700">Uploading...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Manual Input */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">
                <FaPlus className="inline-block mr-2" />
                Manual Input
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter domains manually (one per line, or comma-separated)
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label htmlFor="domains" className="form-label">
                    Domains
                  </label>
                  <textarea
                    id="domains"
                    rows={10}
                    className={`form-input ${errors.domains ? 'border-red-500' : ''}`}
                    placeholder="example.com&#10;example.org&#10;example.net"
                    {...register('domains', { required: 'Domains are required' })}
                  ></textarea>
                  {errors.domains && (
                    <p className="mt-1 text-sm text-red-600">{errors.domains.message}</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2 inline-block" />
                        Importing...
                      </>
                    ) : (
                      'Import Domains'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Import Results */}
        {uploadResult && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Import Results</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm text-green-700">Imported</p>
                  <p className="text-2xl font-semibold text-green-900">{uploadResult.imported}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-700">Skipped (Duplicates)</p>
                  <p className="text-2xl font-semibold text-yellow-900">{uploadResult.skipped}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}