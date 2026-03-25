import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  productName: z.string(),
  variantName: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
  notes: z.string().optional(),
})

const orderSchema = z.object({
  customerName: z.string().min(2, 'Nome é obrigatório'),
  customerPhone: z.string().min(10, 'Telefone inválido'),
  customerEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  deliveryType: z.enum(['retirada', 'entrega']),
  notes: z.string().optional(),
  paymentMethod: z.enum(['dinheiro', 'pix', 'cartao']),
  items: z.array(orderItemSchema).min(1, 'Adicione pelo menos um item'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = orderSchema.parse(body)

    // Calculate totals
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    // Get delivery fee from settings
    const deliveryFeeSetting = await db.setting.findUnique({
      where: { key: 'delivery_fee' },
    })
    const deliveryFee =
      validatedData.deliveryType === 'entrega'
        ? parseFloat(deliveryFeeSetting?.value || '5')
        : 0

    const total = subtotal + deliveryFee

    // Create order
    const order = await db.order.create({
      data: {
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        customerEmail: validatedData.customerEmail || null,
        address: validatedData.address || null,
        deliveryType: validatedData.deliveryType,
        notes: validatedData.notes || null,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: validatedData.paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        items: {
          create: validatedData.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
