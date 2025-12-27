import { useAuth } from '@clerk/clerk-react';
import { AlertCircle, CheckCircle, Loader2, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { ReviewScanModal } from './ReviewScanModal';

interface OCRUploadProps {
  inventoryId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const OCRUpload: React.FC<OCRUploadProps> = ({
  inventoryId,
  onSuccess,
  onClose,
}) => {
  const { getToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for Review Flow
  const [showReview, setShowReview] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const pollJobStatus = async (jobId: string, token: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_ATTEMPTS = 30; // 1 minute timeout

    let attempts = 0;

    const checkStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/images/job/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            console.log('Poll Response:', data);

            if (data.status === 'completed') {
                console.log('✅ Polling Completed. Result:', data.result);
                if (data.result && data.result.data) {
                     setProcessing(false);
                     setScannedItems(data.result.data);
                     setShowReview(true);
                     return;
                } else {
                     console.error('❌ Missing data in completed result:', data);
                     // Fallback to empty array to allow modal to open
                     setProcessing(false);
                     setScannedItems([]);
                     setShowReview(true);
                     return;
                }
            } else if (data.status === 'failed') {
                throw new Error(data.error || 'Job failed');
            } else {
                if (attempts < MAX_ATTEMPTS) {
                    attempts++;
                    setTimeout(checkStatus, POLL_INTERVAL);
                } else {
                    throw new Error('Processing timeout');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Polling failed');
            setProcessing(false);
        }
    };

    checkStatus();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const token = await getToken();

      const response = await fetch(
        `${API_URL}/inventories/${inventoryId}/items/from-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result = await response.json();
      setUploading(false);
      setProcessing(true); // Start processing UI
      
      // Start polling with the returned Job ID
      if (result.data && result.data.jobId) {
          pollJobStatus(result.data.jobId, token || '');
      } else {
          throw new Error('No Job ID returned from server');
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  // If Review Modal is active, show it instead
  if (showReview) {
      return (
          <ReviewScanModal 
              initialItems={scannedItems}
              inventoryId={inventoryId}
              onClose={onClose}
              onSuccess={() => {
                  onSuccess(); // Refresh parent
                  onClose(); // Close all
              }}
          />
      );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            OCR Upload
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!preview && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Drop your image here or click to browse
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-lg border"
              />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {(uploading || processing) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-blue-700">
                {uploading ? 'Uploading image...' : 'AI is reading your receipt...'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || processing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading || processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading
              ? 'Uploading...'
              : processing
              ? 'Processing...'
              : 'Scan Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
