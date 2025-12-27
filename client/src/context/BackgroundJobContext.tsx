
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ReviewScanModal } from '../components/food/ReviewScanModal';

interface Job {
  id: string;
  status: 'active' | 'completed' | 'failed';
  result?: any;
  inventoryId?: string;
  error?: string;
  timestamp: number;
}

interface BackgroundJobContextType {
  activeJobs: Job[];
  addJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  addInventoryTask: (items: any[], inventoryId: string, token: string) => void;
}

const BackgroundJobContext = createContext<BackgroundJobContextType | undefined>(undefined);

export function useBackgroundJob() {
  const context = useContext(BackgroundJobContext);
  if (!context) {
    throw new Error('useBackgroundJob must be used within a BackgroundJobProvider');
  }
  return context;
}

export const BackgroundJobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [completedJobToReview, setCompletedJobToReview] = useState<Job | null>(null);

  const addJob = (jobId: string) => {
    setActiveJobs((prev) => [
      ...prev,
      { id: jobId, status: 'active', timestamp: Date.now() },
    ]);
  };

  const removeJob = (jobId: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  useEffect(() => {
    if (activeJobs.length === 0) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const pollJobs = async () => {
      const token = await getToken();
      if (!token) return;

      // Only poll backend jobs (OCR), not local tasks (Inventory Add)
      const jobsToCheck = activeJobs.filter((j) => j.status === 'active' && !j.id.startsWith('task-'));
      if (jobsToCheck.length === 0) return;

      const updatedJobs = await Promise.all(
        jobsToCheck.map(async (job) => {
          try {
            const res = await fetch(`${API_URL}/images/job/${job.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            
            if (data.status === 'completed') {
                return { 
                    ...job, 
                    status: 'completed', 
                    result: data.result, 
                    inventoryId: data.inventoryId 
                } as Job;
            } else if (data.status === 'failed') {
                return { 
                    ...job, 
                    status: 'failed', 
                    error: data.error 
                } as Job;
            }
            return job; // Still processing
          } catch (err) {
            console.error('Job poll error', err);
            return job;
          }
        })
      );

      // Diff check
      updatedJobs.forEach(job => {
          if (job.status === 'completed' && activeJobs.find(j => j.id === job.id)?.status === 'active') {
              // Newly completed!
              setCompletedJobToReview(job);
              // We can also trigger a toast here if we had a toast system
          }
      });
      
      // Update state if anything changed
      // (This is a simple replace, optimization possible but fine for now)
      setActiveJobs(prev => {
          // Merge old non-active jobs with updated jobs
          const others = prev.filter(p => !jobsToCheck.find(c => c.id === p.id));
          return [...others, ...updatedJobs].filter(j => j.status === 'active'); // Remove completed/failed from Active list?
          // Actually we probably want to keep them in a "history" or just remove them. 
          // Implementation Plan says: "Add to completedJobs"
      });
      
      // If we remove them from activeJobs, the next poll won't check them.
    };

    const interval = setInterval(pollJobs, 2000);
    return () => clearInterval(interval);
  }, [activeJobs, getToken]);


  const handleReviewClose = () => {
      setCompletedJobToReview(null);
  };

  const addInventoryTask = async (items: any[], inventoryId: string, token: string) => {
      // Create a local "job" for UI tracking
      const taskId = `task-${Date.now()}`;
      setActiveJobs(prev => [...prev, { id: taskId, status: 'active', timestamp: Date.now() }]);

      // Fire and forget processing
      (async () => {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          let successCount = 0;
          let failCount = 0;

          for (const item of items) {
              try {
                const payload = {
                    foodItemId: undefined,
                    customName: item.name,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    notes: `Added via OCR Scan${item.confidence ? ` (${Math.round(item.confidence * 100)}% conf)` : ''}`,
                    // Pass nutrition data to create smart FoodItems
                    nutritionPerUnit: item.nutrition,
                    nutritionUnit: item.nutritionUnit || item.unit, 
                    nutritionBasis: item.nutritionBasis || (['g', 'ml'].includes(item.unit || '') ? 100 : 1),
                    basePrice: item.basePrice,
                };

                const res = await fetch(`${API_URL}/inventories/${inventoryId}/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                         Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) successCount++;
                else failCount++;

              } catch (e) {
                  console.error('Task item add failed', e);
                  failCount++;
              }
          }

          // Update job to completed
          setActiveJobs(prev => prev.map(j => j.id === taskId ? { ...j, status: 'completed', result: { successCount, failCount } } : j));
          
          // Remove from active list after a delay so user sees "Done"
          setTimeout(() => {
              setActiveJobs(prev => prev.filter(j => j.id !== taskId));
          }, 5000);

      })();
  };

  return (
    <BackgroundJobContext.Provider value={{ activeJobs, addJob, removeJob, addInventoryTask }}>
      {children}
      
      {/* Global Job Status Indicator */}
      {activeJobs.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
              <Loader2 className="w-5 h-5 animate-spin" />
              <div>
                  <p className="font-semibold text-sm">Processing {activeJobs.length} active tasks</p>
                  <p className="text-xs opacity-80">You can keep using the app</p>
              </div>
          </div>
      )}

      {/* Global Review Modal */}
      {completedJobToReview && (
          <ReviewScanModal
              initialItems={completedJobToReview.result?.data || []}
              inventoryId={completedJobToReview.inventoryId || ''}
              onClose={handleReviewClose}
              onSuccess={() => {
                  handleReviewClose();
              }}
          />
      )}
    </BackgroundJobContext.Provider>
  );
};
