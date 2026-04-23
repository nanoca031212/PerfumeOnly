import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { usePixel } from '@/hooks/usePixel'
import { useUTM } from '@/hooks/useUTM'
import { validateAndFixCartItem, initializeAutoCleanup } from '@/lib/cacheCleanup'
import stripeVariantMapping from '../data/stripe_variant_mapping.json'
import stripeProductMapping from '../data/stripe_product_mapping.json'
import { stripe } from '@/lib/stripe'

interface CartItem {
  id: number
  handle: string
  stripeId?: string // ID do preço no Stripe
  title: string
  subtitle: string
  price: number
  image: string
  quantity: number
  originalPrice?: number
  regularPrice?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  total: number
  totalOriginal: number
  initiateCheckout: () => void
  utm_campaign: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const pixel = usePixel()
  const { utmParams } = useUTM()

  // Inicializar limpeza automática de cache quando o componente monta
  useEffect(() => {
    initializeAutoCleanup()
  }, [])

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    // Validar e corrigir IDs obsoletos antes de adicionar
    const validatedItem = validateAndFixCartItem(newItem)
    if (!validatedItem) {
      console.error('Item com ID obsoleto rejeitado:', newItem)
      return
    }

    // Se o item já tem stripeId, usar ele diretamente
    let stripeId = validatedItem.stripeId || ''

    // Se não tem stripeId, tentar obter do mapeamento
    if (!stripeId) {
      const handle = validatedItem.handle || ''

      // Verificar primeiro no mapeamento de variantes (que é um objeto simples)
      stripeId = stripeVariantMapping[handle as keyof typeof stripeVariantMapping] || ''

      // Se não encontrar, verificar no mapeamento de produtos (que tem estrutura diferente)
      if (!stripeId && handle in stripeProductMapping) {
        const productMapping = stripeProductMapping[handle as keyof typeof stripeProductMapping]
        if (typeof productMapping === 'object' && productMapping !== null && 'price_id' in productMapping) {
          stripeId = productMapping.price_id
        }
      }
    }

    // Item com ID do Stripe
    const itemWithStripeId = {
      ...validatedItem,
      stripeId
    }

    // Rastrear evento AddToCart ANTES da função de setState
    pixel.addToCart({
      value: itemWithStripeId.price * quantity,
      currency: 'GBP',
      content_name: itemWithStripeId.title,
      content_ids: [itemWithStripeId.id.toString()]
    })

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemWithStripeId.id)

      if (existingItem) {
        // Atualizar quantidade
        return prevItems.map(item =>
          item.id === itemWithStripeId.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      // Adicionar novo item
      return [...prevItems, { ...itemWithStripeId, quantity }]
    })
  }

  const recalculateBundlePrices = (items: CartItem[]): CartItem[] => {
    const count = items.length;
    return items.map((item, i) => {
      const regularPrice = item.regularPrice || item.price;
      let newPrice: number;
      if (count <= 2) {
        newPrice = regularPrice;
      } else if (count === 3) {
        newPrice = 49.99 / 3;
      } else if (count === 4) {
        newPrice = i < 3 ? 49.99 / 3 : regularPrice;
      } else {
        newPrice = 99.99 / 5;
      }
      return { ...item, price: newPrice };
    });
  };

  const removeItem = (id: number) => {
    setItems(items => {
      const filtered = items.filter(item => item.id !== id);
      return recalculateBundlePrices(filtered);
    });
  }

  const updateQuantity = (id: number, delta: number) => {
    setItems(prevItems => {
      const itemToUpdate = prevItems.find(item => item.id === id);

      if (itemToUpdate && itemToUpdate.quantity + delta <= 0) {
        const filtered = prevItems.filter(item => item.id !== id);
        return recalculateBundlePrices(filtered);
      }

      return prevItems.map(item => {
        if (item.id === id) {
          return { 
            ...item, 
            quantity: Math.max(0, Math.min(10, item.quantity + delta)),
            price: item.regularPrice || item.price 
          };
        }
        // Qualquer modificação de quantidade no carrinho quebra as regras do pacote
        return { ...item, price: item.regularPrice || item.price };
      });
    });
  }

  const clearCart = () => {
    setItems([])
  }

  const initiateCheckout = async () => {
    // Redirecionar para a página interna de checkout mantendo as UTMs na URL
    window.location.href = `/checkout${window.location.search}`
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        total,
        totalOriginal: items.reduce((sum, item) => sum + ((item.originalPrice || 169.99) * item.quantity), 0),
        initiateCheckout,
        utm_campaign: utmParams.utm_campaign || null
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}