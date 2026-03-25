import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const createVariantSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que 0'),
  price: z.number().positive('Preço deve ser maior que 0'),
  minQuantity: z.number().int().min(1).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = createVariantSchema.parse(body)

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    const variant = await db.productVariant.create({
      data: {
        productId: id,
        name: validatedData.name,
        type: validatedData.type,
        quantity: validatedData.quantity,
        price: validatedData.price,
        minQuantity: validatedData.minQuantity || 1,
        active: true,
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating variant:', error)
    return NextResponse.json(
      { error: 'Erro ao criar variante' },
      { status: 500 }
    )
  }
}
