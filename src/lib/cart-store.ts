import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  productName: string
  productImage: string | null
  variantId: string
  variantName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  minQuantity: number
  notes?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'totalPrice'>) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  updateNotes: (variantId: string, notes: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.variantId === item.variantId)
          
          if (existingIndex >= 0) {
            // Update existing item
            const updatedItems = [...state.items]
            const existingItem = updatedItems[existingIndex]
            const newQuantity = existingItem.quantity + item.quantity
            updatedItems[existingIndex] = {
              ...existingItem,
              quantity: newQuantity,
              totalPrice: newQuantity * existingItem.unitPrice,
            }
            return { items: updatedItems }
          }
          
          // Add new item
          return {
            items: [
              ...state.items,
              {
                ...item,
                totalPrice: item.quantity * item.unitPrice,
              },
            ],
          }
        })
      },
      
      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }))
      },
      
      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
              : item
          ),
        }))
      },
      
      updateNotes: (variantId, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId ? { ...item, notes } : item
          ),
        }))
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0)
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'leci-salgados-cart',
    }
  )
)
