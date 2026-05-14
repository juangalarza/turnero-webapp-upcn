import { NextRequest, NextResponse } from 'next/server'
import { getSlotsDisponibles } from '@/lib/disponibilidad'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const profesionalId = searchParams.get('profesional_id')
  const fecha = searchParams.get('fecha')

  if (!profesionalId || !fecha) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const slots = await getSlotsDisponibles(profesionalId, fecha)
    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error in availability API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

