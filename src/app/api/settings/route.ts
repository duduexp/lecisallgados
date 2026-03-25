import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany()
    
    // Convert to object and only return public settings
    const publicSettings = [
      'delivery_fee',
      'min_order_value',
      'business_name',
      'business_phone',
      'business_whatsapp',
      'business_instagram',
      'business_address',
      'pix_key',
      'advance_order_days',
      'fried_deposit_percent',
    ]

    const settingsObject = settings
      .filter(s => publicSettings.includes(s.key))
      .reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as Record<string, string>)

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar configurações' },
      { status: 500 }
    )
  }
}
