'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Phone, 
  MapPin, 
  Instagram, 
  MessageCircle,
  Clock,
  Truck,
  Store,
  User,
  Package,
  Settings,
  LogOut,
  LogIn,
  ChefHat,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  QrCode,
  Edit,
  Eye,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface ProductVariant {
  id: string
  name: string
  type: string
  quantity: number
  price: number
  minQuantity: number
  active: boolean
}

interface Product {
  id: string
  name: string
  description: string | null
  image: string | null
  categoryId: string
  active: boolean
  featured: boolean
  category: {
    id: string
    name: string
    slug: string
  }
  variants: ProductVariant[]
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  _count?: {
    products: number
  }
}

interface OrderItem {
  id: string
  productId: string
  variantId: string
  productName: string
  variantName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
  product?: {
    name: string
    image: string | null
  }
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  address: string | null
  deliveryType: string
  notes: string | null
  subtotal: number
  deliveryFee: number
  total: number
  status: string
  paymentMethod: string | null
  paymentStatus: string
  createdAt: string
  items: OrderItem[]
}

interface Settings {
  delivery_fee: string
  min_order_value: string
  business_name: string
  business_phone: string
  business_whatsapp: string
  business_instagram: string
  business_address: string
  pix_key: string
  advance_order_days: string
  fried_deposit_percent: string
}

interface AdminSession {
  id: string
  username: string
  name: string | null
  email: string | null
}

// Status config
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: AlertCircle },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
  preparing: { label: 'Preparando', color: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Pronto', color: 'bg-green-500', icon: Package },
  delivered: { label: 'Entregue', color: 'bg-gray-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  partial: { label: 'Parcial', color: 'bg-orange-500' },
  paid: { label: 'Pago', color: 'bg-green-500' },
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  
  // Cart
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore()
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  // Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryType: 'retirada' as 'retirada' | 'entrega',
    address: '',
    notes: '',
    paymentMethod: 'pix' as 'dinheiro' | 'pix' | 'cartao',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Admin
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  
  // Admin data
  const [adminOrders, setAdminOrders] = useState<Order[]>([])
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const [adminSettings, setAdminSettings] = useState<Record<string, string>>({})
  const [adminTab, setAdminTab] = useState('orders')
  const [orderFilter, setOrderFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  // Product form
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    image: '',
    categoryId: '',
    featured: false,
  })
  
  // Variant form
  const [showVariantDialog, setShowVariantDialog] = useState(false)
  const [variantProductId, setVariantProductId] = useState<string | null>(null)
  const [variantForm, setVariantForm] = useState({
    name: '',
    type: '',
    quantity: 1,
    price: 0,
    minQuantity: 1,
  })

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Fetch initial data
  const fetchProducts = useCallback(async () => {
    try {
      const url = selectedCategory !== 'all' 
        ? `/api/products?categoryId=${selectedCategory}` 
        : '/api/products'
      const response = await fetch(url)
      const data = await response.json()
      setProducts(data)
    } catch {
      toast.error('Erro ao carregar produtos')
    }
  }, [selectedCategory])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch {
      toast.error('Erro ao carregar categorias')
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data)
    } catch {
      toast.error('Erro ao carregar configurações')
    }
  }, [])

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/session')
      const data = await response.json()
      setIsAdminAuthenticated(data.authenticated)
      setAdminSession(data.admin || null)
    } catch {
      setIsAdminAuthenticated(false)
    }
  }, [])

  // Fetch admin data
  const fetchAdminOrders = useCallback(async () => {
    try {
      const url = orderFilter !== 'all' 
        ? `/api/admin/orders?status=${orderFilter}` 
        : '/api/admin/orders'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAdminOrders(data)
      }
    } catch {
      toast.error('Erro ao carregar pedidos')
    }
  }, [orderFilter])

  const fetchAdminProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setAdminProducts(data)
      }
    } catch {
      toast.error('Erro ao carregar produtos')
    }
  }, [])

  const fetchAdminSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setAdminSettings(data)
      }
    } catch {
      toast.error('Erro ao carregar configurações')
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchCategories(), fetchProducts(), fetchSettings(), checkSession()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchCategories, fetchProducts, fetchSettings, checkSession])

  // Fetch products when category changes
  useEffect(() => {
    if (!isLoading) {
      fetchProducts()
    }
  }, [selectedCategory, fetchProducts, isLoading])

  // Fetch admin data when authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminOrders()
      fetchAdminProducts()
      fetchAdminSettings()
    }
  }, [isAdminAuthenticated, fetchAdminOrders, fetchAdminProducts, fetchAdminSettings])

  // Admin functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsAdminAuthenticated(true)
        setAdminSession(data.admin)
        setShowLoginDialog(false)
        setLoginForm({ username: '', password: '' })
        toast.success('Login realizado com sucesso!')
      } else {
        setLoginError(data.error || 'Erro ao fazer login')
      }
    } catch {
      setLoginError('Erro ao fazer login')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setIsAdminAuthenticated(false)
      setAdminSession(null)
      toast.success('Logout realizado com sucesso!')
    } catch {
      toast.error('Erro ao fazer logout')
    }
  }

  // Cart functions
  const handleAddToCart = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    if (quantity < variant.minQuantity) {
      toast.error(`Quantidade mínima: ${variant.minQuantity}`)
      return
    }
    
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      variantId: variant.id,
      variantName: variant.name,
      quantity,
      unitPrice: variant.price,
      minQuantity: variant.minQuantity,
    })
    
    toast.success(`${product.name} adicionado ao carrinho!`)
  }

  // Checkout function
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      toast.error('Adicione itens ao carrinho')
      return
    }

    const total = getTotal()
    const minValue = parseFloat(settings?.min_order_value || '0')
    
    if (total < minValue) {
      toast.error(`Valor mínimo: ${formatCurrency(minValue)}`)
      return
    }

    if (checkoutForm.deliveryType === 'entrega' && !checkoutForm.address) {
      toast.error('Informe o endereço de entrega')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkoutForm,
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
        }),
      })

      if (response.ok) {
        const order = await response.json()
        clearCart()
        setIsCheckoutOpen(false)
        setIsCartOpen(false)
        setCheckoutForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          deliveryType: 'retirada',
          address: '',
          notes: '',
          paymentMethod: 'pix',
        })
        
        // Show success message with WhatsApp link
        const message = `Olá! Gostaria de confirmar meu pedido #${order.id.slice(-6)}\n\nNome: ${checkoutForm.customerName}\nTotal: ${formatCurrency(order.total)}\n\nAguardo confirmação!`
        const whatsappUrl = `https://wa.me/${settings?.business_whatsapp}?text=${encodeURIComponent(message)}`
        
        toast.success(
          <div className="flex flex-col gap-2">
            <span>Pedido realizado com sucesso!</span>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 underline hover:text-green-700"
            >
              Confirmar via WhatsApp
            </a>
          </div>,
          { duration: 10000 }
        )
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao fazer pedido')
      }
    } catch {
      toast.error('Erro ao fazer pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Admin order functions
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        toast.success('Status atualizado!')
        fetchAdminOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(await response.json())
        }
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      })
      
      if (response.ok) {
        toast.success('Status de pagamento atualizado!')
        fetchAdminOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(await response.json())
        }
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  // Product functions
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      })
      
      if (response.ok) {
        toast.success('Produto criado!')
        setShowProductDialog(false)
        setProductForm({ name: '', description: '', image: '', categoryId: '', featured: false })
        fetchAdminProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar produto')
      }
    } catch {
      toast.error('Erro ao criar produto')
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProduct) return
    
    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      })
      
      if (response.ok) {
        toast.success('Produto atualizado!')
        setShowProductDialog(false)
        setEditingProduct(null)
        setProductForm({ name: '', description: '', image: '', categoryId: '', featured: false })
        fetchAdminProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao atualizar produto')
      }
    } catch {
      toast.error('Erro ao atualizar produto')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Produto excluído!')
        fetchAdminProducts()
      } else {
        toast.error('Erro ao excluir produto')
      }
    } catch {
      toast.error('Erro ao excluir produto')
    }
  }

  // Variant functions
  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!variantProductId) return
    
    try {
      const response = await fetch(`/api/admin/products/${variantProductId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantForm),
      })
      
      if (response.ok) {
        toast.success('Variante criada!')
        setShowVariantDialog(false)
        setVariantForm({ name: '', type: '', quantity: 1, price: 0, minQuantity: 1 })
        setVariantProductId(null)
        fetchAdminProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar variante')
      }
    } catch {
      toast.error('Erro ao criar variante')
    }
  }

  // Settings function
  const handleUpdateSettings = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      
      if (response.ok) {
        toast.success('Configuração atualizada!')
        fetchAdminSettings()
      } else {
        toast.error('Erro ao atualizar configuração')
      }
    } catch {
      toast.error('Erro ao atualizar configuração')
    }
  }

  // WhatsApp message for order
  const generateWhatsAppLink = (order: Order) => {
    const itemsList = order.items.map(item => 
      `${item.quantity}x ${item.productName} (${item.variantName}) - ${formatCurrency(item.totalPrice)}`
    ).join('\n')
    
    const message = `Pedido #${order.id.slice(-6)}\n\nCliente: ${order.customerName}\nTelefone: ${order.customerPhone}\n\nItens:\n${itemsList}\n\nSubtotal: ${formatCurrency(order.subtotal)}\nTaxa de entrega: ${formatCurrency(order.deliveryFee)}\nTotal: ${formatCurrency(order.total)}\n\nPagamento: ${order.paymentMethod}\nStatus: ${statusConfig[order.status]?.label || order.status}`
    
    return `https://wa.me/${settings?.business_whatsapp}?text=${encodeURIComponent(message)}`
  }

  // Filter orders by search
  const filteredOrders = adminOrders.filter(order => {
    if (!orderSearch) return true
    const search = orderSearch.toLowerCase()
    return (
      order.customerName.toLowerCase().includes(search) ||
      order.customerPhone.includes(search) ||
      order.id.toLowerCase().includes(search)
    )
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-leci.png"
                alt="Leci Salgados"
                width={50}
                height={50}
                className="rounded-full bg-white"
              />
              <div>
                <h1 className="text-xl font-bold">Leci Salgados</h1>
                <p className="text-xs text-orange-100 hidden sm:block">Salgados fresquinhos para sua festa!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Cart Button */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="secondary" className="relative bg-white/20 hover:bg-white/30 text-white border-0">
                    <ShoppingCart className="h-5 w-5" />
                    {getItemCount() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-yellow-400 text-yellow-900">
                        {getItemCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Seu Carrinho</SheetTitle>
                    <SheetDescription>
                      {items.length === 0 ? 'Adicione produtos ao carrinho' : `${items.length} item(ns)`}
                    </SheetDescription>
                  </SheetHeader>
                  
                  <ScrollArea className="flex-1 -mx-6 px-6" style={{ height: 'calc(100vh - 250px)' }}>
                    <div className="space-y-4 py-4">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                          {item.productImage && (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                            <p className="text-xs text-gray-500">{item.variantName}</p>
                            <p className="text-orange-600 font-semibold">{formatCurrency(item.unitPrice)}</p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  if (item.quantity > item.minQuantity) {
                                    updateQuantity(item.variantId, item.quantity - 1)
                                  }
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeItem(item.variantId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">{formatCurrency(getTotal())}</span>
                    </div>
                    
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      disabled={items.length === 0}
                      onClick={() => {
                        setIsCartOpen(false)
                        setIsCheckoutOpen(true)
                      }}
                    >
                      Finalizar Pedido
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Admin Login/Logout */}
              {isAdminAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm hidden sm:inline">Olá, {adminSession?.name || adminSession?.username}</span>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/20">
                      <LogIn className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Acesso Administrativo</DialogTitle>
                      <DialogDescription>
                        Faça login para acessar o painel administrativo
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogin} className="space-y-4">
                      {loginError && (
                        <p className="text-red-500 text-sm">{loginError}</p>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="username">Usuário</Label>
                        <Input
                          id="username"
                          value={loginForm.username}
                          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">Entrar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Panel */}
      {isAdminAuthenticated && (
        <div className="bg-gray-100 border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Tabs value={adminTab} onValueChange={setAdminTab}>
              <TabsList className="bg-white">
                <TabsTrigger value="orders" className="gap-2">
                  <Package className="h-4 w-4" />
                  Pedidos
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-2">
                  <ChefHat className="h-4 w-4" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </TabsTrigger>
              </TabsList>
              
              {/* Orders Tab */}
              <TabsContent value="orders" className="mt-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, telefone ou ID..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={orderFilter} onValueChange={setOrderFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="preparing">Preparando</SelectItem>
                      <SelectItem value="ready">Pronto</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">#{order.id.slice(-6)}</CardTitle>
                          <Badge className={statusConfig[order.status]?.color}>
                            {statusConfig[order.status]?.label}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {formatDate(order.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="font-medium text-sm">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-bold text-orange-600">{formatCurrency(order.total)}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={generateWhatsAppLink(order)} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-4 w-4 text-green-500" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Nenhum pedido encontrado
                  </div>
                )}
              </TabsContent>
              
              {/* Products Tab */}
              <TabsContent value="products" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Produtos ({adminProducts.length})</h3>
                  <Button
                    onClick={() => {
                      setEditingProduct(null)
                      setProductForm({ name: '', description: '', image: '', categoryId: '', featured: false })
                      setShowProductDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {adminProducts.map((product) => (
                    <Card key={product.id} className={!product.active ? 'opacity-50' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            {product.image && (
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={60}
                                height={60}
                                className="rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {product.name}
                                {product.featured && (
                                  <Badge variant="secondary" className="text-xs">Destaque</Badge>
                                )}
                              </CardTitle>
                              <CardDescription>{product.category?.name}</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                        
                        <div className="space-y-1 mb-3">
                          <p className="text-xs font-medium text-gray-600">Variantes:</p>
                          {product.variants.map((variant) => (
                            <div key={variant.id} className="flex justify-between text-xs">
                              <span>{variant.name}</span>
                              <span className="font-medium">{formatCurrency(variant.price)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setEditingProduct(product)
                              setProductForm({
                                name: product.name,
                                description: product.description || '',
                                image: product.image || '',
                                categoryId: product.categoryId,
                                featured: product.featured,
                              })
                              setShowProductDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVariantProductId(product.id)
                              setVariantForm({ name: '', type: '', quantity: 1, price: 0, minQuantity: 1 })
                              setShowVariantDialog(true)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações do Sistema</CardTitle>
                    <CardDescription>
                      Gerencie as informações e configurações do negócio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nome do Negócio</Label>
                        <Input
                          value={adminSettings.business_name || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, business_name: e.target.value })}
                          onBlur={() => handleUpdateSettings('business_name', adminSettings.business_name || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          value={adminSettings.business_phone || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, business_phone: e.target.value })}
                          onBlur={() => handleUpdateSettings('business_phone', adminSettings.business_phone || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp (apenas números)</Label>
                        <Input
                          value={adminSettings.business_whatsapp || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, business_whatsapp: e.target.value })}
                          onBlur={() => handleUpdateSettings('business_whatsapp', adminSettings.business_whatsapp || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input
                          value={adminSettings.business_instagram || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, business_instagram: e.target.value })}
                          onBlur={() => handleUpdateSettings('business_instagram', adminSettings.business_instagram || '')}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Endereço</Label>
                        <Input
                          value={adminSettings.business_address || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, business_address: e.target.value })}
                          onBlur={() => handleUpdateSettings('business_address', adminSettings.business_address || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taxa de Entrega (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={adminSettings.delivery_fee || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, delivery_fee: e.target.value })}
                          onBlur={() => handleUpdateSettings('delivery_fee', adminSettings.delivery_fee || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Mínimo do Pedido (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={adminSettings.min_order_value || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, min_order_value: e.target.value })}
                          onBlur={() => handleUpdateSettings('min_order_value', adminSettings.min_order_value || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Chave Pix</Label>
                        <Input
                          value={adminSettings.pix_key || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, pix_key: e.target.value })}
                          onBlur={() => handleUpdateSettings('pix_key', adminSettings.pix_key || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Antecedência (dias)</Label>
                        <Input
                          type="number"
                          value={adminSettings.advance_order_days || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, advance_order_days: e.target.value })}
                          onBlur={() => handleUpdateSettings('advance_order_days', adminSettings.advance_order_days || '')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Depósito Salgados Fritos (%)</Label>
                        <Input
                          type="number"
                          value={adminSettings.fried_deposit_percent || ''}
                          onChange={(e) => setAdminSettings({ ...adminSettings, fried_deposit_percent: e.target.value })}
                          onBlur={() => handleUpdateSettings('fried_deposit_percent', adminSettings.fried_deposit_percent || '')}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Hero Section */}
      {!isAdminAuthenticated && (
        <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <Image
              src="/images/logo-leci.png"
              alt="Leci Salgados"
              width={120}
              height={120}
              className="rounded-full bg-white mx-auto mb-4 shadow-lg"
            />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Salgados Fresquinhos para Sua Festa!</h2>
            <p className="text-lg text-orange-100 mb-6 max-w-2xl mx-auto">
              Coxinha, risole, pastel, kibe e muito mais! Feitos com carinho e ingredientes de qualidade.
              Peça com antecedência e surpreenda seus convidados.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <Phone className="h-4 w-4" />
                <span>{settings?.business_phone}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <Clock className="h-4 w-4" />
                <span>Peça com 1 dia de antecedência</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <Truck className="h-4 w-4" />
                <span>Entrega ou retirada</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <ChefHat className="h-16 w-16 text-orange-300" />
                  </div>
                )}
                {product.featured && (
                  <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900">
                    Destaque
                  </Badge>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {product.variants.length > 0 ? (
                    <>
                      <Select
                        onValueChange={(value) => {
                          const variant = product.variants.find(v => v.id === value)
                          if (variant) {
                            handleAddToCart(product, variant, variant.minQuantity)
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.variants.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              <div className="flex justify-between w-full gap-4">
                                <span>{variant.name}</span>
                                <span className="font-semibold">{formatCurrency(variant.price)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="text-xs text-gray-500 text-center">
                        Mín: {product.variants[0]?.minQuantity || 1} unidade(s)
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">Produto indisponível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum produto encontrado nesta categoria</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/logo-leci.png"
                  alt="Leci Salgados"
                  width={40}
                  height={40}
                  className="rounded-full bg-white"
                />
                <span className="font-bold text-lg">Leci Salgados</span>
              </div>
              <p className="text-gray-400 text-sm">
                Salgados artesanais feitos com carinho e ingredientes de qualidade para sua festa ou comércio.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Contato</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <a href={`tel:${settings?.business_phone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4" />
                  {settings?.business_phone}
                </a>
                <a 
                  href={`https://wa.me/${settings?.business_whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <a 
                  href={`https://instagram.com/${settings?.business_instagram?.replace('@', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                  {settings?.business_instagram}
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Endereço</h4>
              <p className="text-sm text-gray-400 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {settings?.business_address}
              </p>
              
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Pagamento via Pix:</p>
                <p className="font-mono text-sm text-green-400">{settings?.pix_key}</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-6 bg-gray-800" />
          
          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Leci Salgados. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
            <DialogDescription>
              Preencha seus dados para completar o pedido
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome *</Label>
              <Input
                id="customerName"
                value={checkoutForm.customerName}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={checkoutForm.customerPhone}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={checkoutForm.customerEmail}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, customerEmail: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Entrega ou Retirada? *</Label>
              <RadioGroup
                value={checkoutForm.deliveryType}
                onValueChange={(value: 'retirada' | 'entrega') => 
                  setCheckoutForm({ ...checkoutForm, deliveryType: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="retirada" id="retirada" />
                  <Label htmlFor="retirada" className="flex items-center gap-1 cursor-pointer">
                    <Store className="h-4 w-4" />
                    Retirada
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entrega" id="entrega" />
                  <Label htmlFor="entrega" className="flex items-center gap-1 cursor-pointer">
                    <Truck className="h-4 w-4" />
                    Entrega
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {checkoutForm.deliveryType === 'entrega' && (
              <div className="space-y-2">
                <Label htmlFor="address">Endereço de Entrega *</Label>
                <Textarea
                  id="address"
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                  placeholder="Rua, número, bairro, complemento..."
                  required={checkoutForm.deliveryType === 'entrega'}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={checkoutForm.notes}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                placeholder="Alguma observação sobre seu pedido?"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <RadioGroup
                value={checkoutForm.paymentMethod}
                onValueChange={(value: 'dinheiro' | 'pix' | 'cartao') => 
                  setCheckoutForm({ ...checkoutForm, paymentMethod: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                    <QrCode className="h-4 w-4" />
                    Pix
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dinheiro" id="dinheiro" />
                  <Label htmlFor="dinheiro" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="h-4 w-4" />
                    Dinheiro
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartao" id="cartao" />
                  <Label htmlFor="cartao" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    Cartão (com taxa)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Separator />
            
            {/* Order Summary */}
            <div className="space-y-2">
              <h4 className="font-semibold">Resumo do Pedido</h4>
              <ScrollArea className="h-32 rounded border p-2">
                {items.map((item) => (
                  <div key={item.variantId} className="flex justify-between text-sm py-1">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </ScrollArea>
              
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              
              {checkoutForm.deliveryType === 'entrega' && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega:</span>
                  <span>{formatCurrency(parseFloat(settings?.delivery_fee || '5'))}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-orange-600">
                  {formatCurrency(
                    getTotal() + (checkoutForm.deliveryType === 'entrega' ? parseFloat(settings?.delivery_fee || '5') : 0)
                  )}
                </span>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Ao confirmar, você será redirecionado para o WhatsApp para finalizar o pedido.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Nome</Label>
              <Input
                id="productName"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productDescription">Descrição</Label>
              <Textarea
                id="productDescription"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productImage">Imagem (URL)</Label>
              <Input
                id="productImage"
                value={productForm.image}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                placeholder="/images/products/produto.png"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productCategory">Categoria</Label>
              <Select
                value={productForm.categoryId}
                onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="productFeatured"
                checked={productForm.featured}
                onCheckedChange={(checked) => setProductForm({ ...productForm, featured: checked })}
              />
              <Label htmlFor="productFeatured">Produto em destaque</Label>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingProduct ? 'Atualizar' : 'Criar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowProductDialog(false)
                  setEditingProduct(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Variante</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateVariant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variantName">Nome</Label>
              <Input
                id="variantName"
                value={variantForm.name}
                onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                placeholder="Ex: 25 unidades - Cru"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="variantType">Tipo</Label>
              <Select
                value={variantForm.type}
                onValueChange={(value) => setVariantForm({ ...variantForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="festa_cru">Festa - Cru</SelectItem>
                  <SelectItem value="festa_frito">Festa - Frito</SelectItem>
                  <SelectItem value="comercio_cru">Comércio - Cru</SelectItem>
                  <SelectItem value="comercio_frito">Comércio - Frito</SelectItem>
                  <SelectItem value="bebida">Bebida</SelectItem>
                  <SelectItem value="espetinho">Espetinho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variantQuantity">Quantidade</Label>
                <Input
                  id="variantQuantity"
                  type="number"
                  value={variantForm.quantity}
                  onChange={(e) => setVariantForm({ ...variantForm, quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="variantPrice">Preço (R$)</Label>
                <Input
                  id="variantPrice"
                  type="number"
                  step="0.01"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="variantMinQuantity">Quantidade Mínima</Label>
              <Input
                id="variantMinQuantity"
                type="number"
                value={variantForm.minQuantity}
                onChange={(e) => setVariantForm({ ...variantForm, minQuantity: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Criar</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVariantDialog(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido #{selectedOrder.id.slice(-6)}</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Cliente</h4>
                  <p className="text-sm">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                  {selectedOrder.customerEmail && (
                    <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Entrega</h4>
                  <p className="text-sm flex items-center gap-2">
                    {selectedOrder.deliveryType === 'entrega' ? (
                      <>
                        <Truck className="h-4 w-4" />
                        Entrega
                      </>
                    ) : (
                      <>
                        <Store className="h-4 w-4" />
                        Retirada
                      </>
                    )}
                  </p>
                  {selectedOrder.address && (
                    <p className="text-sm text-gray-500 mt-1">{selectedOrder.address}</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Itens</h4>
                  <ScrollArea className="h-32 rounded border p-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <div>
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="text-gray-500 ml-1">({item.variantName})</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Pagamento</h4>
                  <p className="text-sm">{selectedOrder.paymentMethod}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={selectedOrder.paymentStatus === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'pending')}
                    >
                      Pendente
                    </Button>
                    <Button
                      variant={selectedOrder.paymentStatus === 'partial' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'partial')}
                    >
                      Parcial
                    </Button>
                    <Button
                      variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'paid')}
                    >
                      Pago
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <Button
                        key={status}
                        variant={selectedOrder.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, status)}
                        className="gap-1"
                      >
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Observações</h4>
                    <p className="text-sm text-gray-500">{selectedOrder.notes}</p>
                  </div>
                )}
                
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  asChild
                >
                  <a href={generateWhatsAppLink(selectedOrder)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar por WhatsApp
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
