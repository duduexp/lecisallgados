import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateVariantSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
  price: z.number().positive().optional(),
  minQuantity: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id, variantId } = await params
    const body = await request.json()
    const validatedData = updateVariantSchema.parse(body)

    const variant = await db.productVariant.update({
      where: {
        id: variantId,
        productId: id,
      },
      data: validatedData,
    })

    return NextResponse.json(variant)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating variant:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar variante' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id, variantId } = await params

    await db.productVariant.delete({
      where: {
        id: variantId,
        productId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir variante' },
      { status: 500 }
    )
  }
}
