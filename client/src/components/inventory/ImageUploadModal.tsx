import { useAuth } from '@clerk/clerk-react';
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface ImageUploadModalProps {
  inventoryId: string;
  onClose: () => void;
  onSuccess: (extractedItems: any[]) => void;
}

export default function ImageUploadModal({
  inventoryId,
  onClose,
  onSuccess,
}: ImageUploadModalProps) {
  const { getToken } = useAuth(); // Move this to component level
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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

      // Get Clerk token
      const token = await getToken();

      setUploadComplete(true);
      setUploading(false);
      setProcessing(true);

      // Call OCR endpoint to extract and add items
      const ocrResponse = await fetch(
        `${API_URL}/inventories/${inventoryId}/items/from-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result = await ocrResponse.json();
      setProcessing(false);

      // Show success with the extracted items
      onSuccess(result.addedItems || []);
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
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Scan Receipt or Food Items
              </h2>
              <p className="text-sm text-foreground/70">
                Upload an image to extract items automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary/20 rounded-lg transition-smooth"
            disabled={uploading || processing}
          >
            <X className="w-5 h-5 text-foreground/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!preview && (
            <div
              className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:border-primary hover:bg-primary/5 transition-smooth cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-primary/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Drop your image here or click to browse
              </h3>
              <p className="text-sm text-foreground/70 mb-4">
                Supports JPEG, PNG, WebP (Max 10MB)
              </p>
              <button
                type="button"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Select Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain bg-secondary/10"
                />
                {!uploading && !processing && !uploadComplete && (
                  <button
                    onClick={handleClear}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-smooth"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-foreground/70">
                    {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {uploadComplete && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Processing Status */}
          {(uploading || processing) && (
            <div className="p-6 bg-primary/5 rounded-xl text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">
                {uploading
                  ? 'Uploading image...'
                  : 'Extracting items from image...'}
              </p>
              <p className="text-sm text-foreground/70">
                {uploading
                  ? 'Please wait while we upload your image'
                  : 'Analyzing the receipt...'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium"
            disabled={uploading || processing}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || processing}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Extract
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
