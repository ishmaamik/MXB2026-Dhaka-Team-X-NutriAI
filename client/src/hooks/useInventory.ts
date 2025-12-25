import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Inventory {
  id: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  inventoryId: string;
  foodItemId?: string;
  customName?: string;
  quantity: number;
  unit?: string;
  expiryDate?: string;
  notes?: string;
  foodItem?: {
    name: string;
    category: string;
    typicalExpirationDays?: number;
  };
}

export interface ConsumptionLog {
  id: string;
  inventoryId: string;
  inventoryItemId?: string;
  foodItemId?: string;
  itemName: string;
  quantity: number;
  unit?: string;
  consumedAt: string;
  notes?: string;
  foodItem?: {
    name: string;
    category: string;
  };
  inventoryItem?: {
    customName?: string;
  };
  inventory: {
    name: string;
  };
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Hook for authenticated API calls
function useAuthApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error ||
          error.message ||
          `API request failed: ${response.status}`,
      );
    }

    return response.json();
  };

  return { fetchWithAuth };
}

// Custom hook for inventory operations
export function useInventory() {
  const queryClient = useQueryClient();
  const { fetchWithAuth } = useAuthApi();

  // Get all inventories
  const useGetInventories = () => {
    return useQuery<Inventory[]>({
      queryKey: ['inventories'],
      queryFn: async () => {
        const response = await fetchWithAuth('/inventories');
        // Fix: return response.inventories, not response.data
        return response.inventories || [];
      },
    });
  };

  // Get items for a specific inventory
  const useGetInventoryItems = (inventoryId: string) => {
    return useQuery<InventoryItem[]>({
      queryKey: ['inventory-items', inventoryId],
      queryFn: async () => {
        const response = await fetchWithAuth(
          `/inventories/${inventoryId}/items`,
        );
        // Handle response based on whether it's wrapped in 'data' property
        return response.items || [];
      },
      enabled: !!inventoryId,
    });
  };

  // Create inventory
  const useCreateInventory = () => {
    return useMutation({
      mutationFn: async (
        inventory: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>,
      ) => {
        const response = await fetchWithAuth('/inventories', {
          method: 'POST',
          body: JSON.stringify(inventory),
        });
        // Handle response based on whether it's wrapped in 'data' property
        return response.data || response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventories'] });
      },
    });
  };

  // Add item to inventory
  const useAddItemToInventory = (inventoryId: string) => {
    return useMutation({
      mutationFn: async (item: {
        foodItemId?: string;
        customName?: string;
        quantity: number;
        unit?: string;
        expiryDate?: Date;
        notes?: string;
      }) => {
        const response = await fetchWithAuth(
          `/inventories/${inventoryId}/items`,
          {
            method: 'POST',
            body: JSON.stringify(item),
          },
        );
        return response.data || response;
      },
      onMutate: async newItem => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: ['inventory-items', inventoryId],
        });

        // Snapshot the previous value
        const previousItems = queryClient.getQueryData([
          'inventory-items',
          inventoryId,
        ]);

        // Optimistically update to the new value with a temp ID
        const tempId = `temp-${Date.now()}`;
        const optimisticItem = { ...newItem, id: tempId };

        queryClient.setQueryData(
          ['inventory-items', inventoryId],
          (old: InventoryItem[] | undefined) => {
            return old ? [...old, optimisticItem] : [optimisticItem];
          },
        );

        // Return a context object with the snapshotted value and temp ID
        return { previousItems, tempId };
      },
      onError: (_err, _newItem, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousItems) {
          queryClient.setQueryData(
            ['inventory-items', inventoryId],
            context.previousItems,
          );
        }
      },
      onSuccess: (realItem, _variables, context) => {
        // Replace the optimistic item with the real one from the server
        queryClient.setQueryData(
          ['inventory-items', inventoryId],
          (old: InventoryItem[] | undefined) => {
            if (!old) return [realItem];
            return old.map(item =>
              item.id === context?.tempId ? realItem : item,
            );
          },
        );
      },
    });
  };

  // Update inventory
  const useUpdateInventory = () => {
    return useMutation({
      mutationFn: async ({
        id,
        data,
      }: {
        id: string;
        data: Partial<Inventory>;
      }) => {
        const response = await fetchWithAuth(`/inventories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        return response.data || response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventories'] });
      },
    });
  };

  // Update inventory item
  const useUpdateInventoryItem = (inventoryId: string) => {
    return useMutation({
      mutationFn: async ({
        id,
        data,
      }: {
        id: string;
        data: Partial<InventoryItem>;
      }) => {
        const response = await fetchWithAuth(
          `/inventories/${inventoryId}/items/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(data),
          },
        );
        return response.data || response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['inventory-items', inventoryId],
        });
      },
    });
  };

  // Delete inventory
  const useDeleteInventory = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await fetchWithAuth(`/inventories/${id}`, {
          method: 'DELETE',
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventories'] });
      },
    });
  };

  // Remove item from inventory
  const useRemoveItemFromInventory = (inventoryId: string) => {
    return useMutation({
      mutationFn: async (itemId: string) => {
        await fetchWithAuth(`/inventories/${inventoryId}/items/${itemId}`, {
          method: 'DELETE',
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['inventory-items', inventoryId],
        });
      },
    });
  };

  // Log consumption of an item
  const useLogConsumption = (inventoryId: string) => {
    return useMutation({
      mutationFn: async (consumption: {
        inventoryId: string;
        inventoryItemId?: string;
        foodItemId?: string;
        itemName: string;
        quantity: number;
        unit?: string;
        consumedAt?: Date;
        notes?: string;
      }) => {
        const response = await fetchWithAuth('/inventories/consumption', {
          method: 'POST',
          body: JSON.stringify(consumption),
        });
        return response.data || response;
      },
      onMutate: async consumptionData => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: ['inventory-items', inventoryId],
        });

        // Snapshot the previous value
        const previousItems = queryClient.getQueryData([
          'inventory-items',
          inventoryId,
        ]);

        // Optimistically update the item quantity
        if (consumptionData.inventoryItemId) {
          queryClient.setQueryData(
            ['inventory-items', inventoryId],
            (old: InventoryItem[] | undefined) => {
              if (!old) return old;
              return old
                .map(item => {
                  if (item.id === consumptionData.inventoryItemId) {
                    const newQuantity =
                      item.quantity - consumptionData.quantity;
                    return { ...item, quantity: Math.max(0, newQuantity) };
                  }
                  return item;
                })
                .filter(item => {
                  // Remove items with zero quantity
                  if (item.id === consumptionData.inventoryItemId) {
                    const newQuantity =
                      item.quantity - consumptionData.quantity;
                    return newQuantity > 0;
                  }
                  return true;
                });
            },
          );
        }

        return { previousItems };
      },
      onError: (_err, _consumptionData, context) => {
        // If the mutation fails, use the context to roll back
        if (context?.previousItems) {
          queryClient.setQueryData(
            ['inventory-items', inventoryId],
            context.previousItems,
          );
        }
      },
      onSuccess: () => {
        // Refresh inventory items to ensure consistency with server
        queryClient.invalidateQueries({
          queryKey: ['inventory-items', inventoryId],
        });
      },
    });
  };

  // Get consumption logs
  const useGetConsumptionLogs = (filters?: {
    startDate?: Date;
    endDate?: Date;
    inventoryId?: string;
  }) => {
    // Create stable query key by serializing dates to ISO strings
    const queryKey = [
      'consumption-logs',
      {
        startDate: filters?.startDate?.toISOString() || null,
        endDate: filters?.endDate?.toISOString() || null,
        inventoryId: filters?.inventoryId || null,
      }
    ];
    
    return useQuery<ConsumptionLog[]>({
      queryKey,
      queryFn: async () => {
        try {
          console.log('=== FRONTEND CONSUMPTION LOGS REQUEST ===');
          const params = new URLSearchParams();
          if (filters?.startDate) {
            params.append('startDate', filters.startDate.toISOString());
            console.log('Adding startDate:', filters.startDate.toISOString());
          }
          if (filters?.endDate) {
            params.append('endDate', filters.endDate.toISOString());
            console.log('Adding endDate:', filters.endDate.toISOString());
          }
          if (filters?.inventoryId) {
            params.append('inventoryId', filters.inventoryId);
            console.log('Adding inventoryId:', filters.inventoryId);
          }

          const url = `/inventories/consumption?${params.toString()}`;
          console.log('Making request to:', url);
          console.log(
            'Full URL with base:',
            `${
              import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
            }${url}`,
          );

          const response = await fetchWithAuth(url);
          console.log('Response received:', response);
          console.log('=== END FRONTEND REQUEST ===');

          return response.consumptionLogs || [];
        } catch (error) {
          console.error('Error fetching consumption logs:', error);
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
            });
          }
          // Return empty array on error to prevent UI crashes
          return [];
        }
      },
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    useGetInventories,
    useGetInventoryItems,
    useCreateInventory,
    useAddItemToInventory,
    useUpdateInventory,
    useUpdateInventoryItem,
    useDeleteInventory,
    useRemoveItemFromInventory,
    useLogConsumption,
    useGetConsumptionLogs,
  };
}
