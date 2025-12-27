
import React, { useState } from 'react';
import { Loader2, Check, X, Wand2, Plus, Edit2, Save } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useBackgroundJob } from '../../context/BackgroundJobContext';

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  confidence?: number;
  nutrition?: any;
  basePrice?: number;
  nutritionUnit?: string;
  nutritionBasis?: number;
}

interface ReviewScanModalProps {
  initialItems: ScannedItem[];
  inventoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewScanModal: React.FC<ReviewScanModalProps> = ({
  initialItems,
  inventoryId,
  onClose,
  onSuccess,
}) => {
  const { getToken } = useAuth();
  const [items, setItems] = useState<ScannedItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [estimatingIndex, setEstimatingIndex] = useState<number | null>(null);

  // Editable state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ScannedItem | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const handleEstimateDetails = async (index: number) => {
    const item = items[index];
    setEstimatingIndex(index);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/intelligence/estimate-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ foodName: item.name }),
      });

      if (!response.ok) throw new Error('Failed to estimate details');

      const data = await response.json();
      const details = data.data;

      // Update item with estimated details
      const updatedItems = [...items];
      updatedItems[index] = {
        ...item,
        unit: details.nutritionUnit || item.unit,
        // If we got a count-based unit (piece), default to 1 if it was 0 or undefined
        quantity: details.nutritionUnit === 'piece' && !item.quantity ? 1 : (item.quantity || 100), 
        nutrition: details.nutritionPerUnit,
        basePrice: details.basePrice,
        nutritionUnit: details.nutritionUnit,
        nutritionBasis: details.nutritionBasis,
      };
      setItems(updatedItems);
    } catch (error) {
      console.error('Estimation failed:', error);
      alert('Failed to estimate details. Please try again.');
    } finally {
      setEstimatingIndex(null);
    }
  };

  /* 
   * Background Task Implementation 
   * Uses BackgroundJobContext to process additions without blocking UI
   */
  const { addInventoryTask } = useBackgroundJob(); // Needs import

  const handleSaveToInventory = async () => {
    // Fire and forget via context
    const token = await getToken();
    if (token) {
        addInventoryTask(items, inventoryId, token);
    }
    
    // Close immediately
    setLoading(false);
    onSuccess();
    onClose(); 
  };

  const startEdit = (index: number) => {
    setEditIndex(index);
    setEditForm({ ...items[index] });
  };

  const saveEdit = () => {
    if (editForm && editIndex !== null) {
      const updated = [...items];
      updated[editIndex] = editForm;
      setItems(updated);
      setEditIndex(null);
      setEditForm(null);
    }
  };

  const removeItem = (index: number) => {
     setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Review Scanned Items</h2>
            <p className="text-sm text-gray-500 mt-1">Found {items.length} items. Verify and add details.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.map((item, index) => (
            <div key={index} className={`relative border rounded-xl p-4 transition-all ${editIndex === index ? 'border-blue-500 shadow-md ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}>
              
              {editIndex === index && editForm ? (
                // EDIT MODE
                <div className="flex gap-4 items-end">
                   <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                   </div>
                   <div className="w-24">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</label>
                      <input 
                        type="number" 
                        value={editForm.quantity} 
                        onChange={e => setEditForm({...editForm, quantity: Number(e.target.value)})}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                   </div>
                   <div className="w-24">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</label>
                      <input 
                        type="text" 
                        value={editForm.unit} 
                        onChange={e => setEditForm({...editForm, unit: e.target.value})}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                   </div>
                   <button onClick={saveEdit} className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                     <Save className="w-4 h-4" />
                   </button>
                </div>
              ) : (
                // VIEW MODE
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                       <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">{item.quantity} {item.unit}</span>
                       {item.basePrice && <span className="text-green-600 font-medium">Est. {item.basePrice} BDT</span>}
                       {item.nutrition && (
                           <div className="group relative">
                               <span className="text-purple-600 text-xs cursor-help border-b border-purple-200">Has Nutrition Info</span>
                               {/* Tooltip for Nutrition */}
                               <div className="absolute top-full left-0 mt-2 w-48 bg-white p-3 rounded-xl shadow-xl border border-gray-100 z-10 hidden group-hover:block animate-in fade-in zoom-in-95">
                                   <p className="text-xs font-semibold text-gray-500 mb-2">Per {item.nutritionBasis || 100}{item.nutritionUnit || item.unit}</p>
                                   <div className="space-y-1 text-xs">
                                       <div className="flex justify-between"><span>Calories:</span> <b>{Math.round(item.nutrition?.calories || 0)}</b></div>
                                       <div className="flex justify-between"><span>Protein:</span> <span>{item.nutrition?.protein}g</span></div>
                                       <div className="flex justify-between"><span>Carbs:</span> <span>{item.nutrition?.carbohydrates}g</span></div>
                                       <div className="flex justify-between"><span>Fat:</span> <span>{item.nutrition?.fat}g</span></div>
                                   </div>
                               </div>
                           </div>
                       )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                         onClick={() => handleEstimateDetails(index)}
                         disabled={estimatingIndex === index}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium transition-colors border border-purple-200"
                         title="Auto-detect nutrition and price"
                    >
                       {estimatingIndex === index ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                       Magic Fill
                    </button>
                    <button onClick={() => startEdit(index)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No items found. Try uploading a clearer image.
            </div>
          )}
          
          <button 
            onClick={() => setItems([...items, { name: 'New Item', quantity: 1, unit: 'pcs' }])}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
          >
             <Plus className="w-5 h-5" />
             Add Another Item Manually
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleSaveToInventory}
             disabled={loading || items.length === 0}
             className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-200"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
             Add {items.length} Items to Inventory
           </button>
        </div>
      </div>
    </div>
  );
};
