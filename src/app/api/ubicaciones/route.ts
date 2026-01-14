import { NextResponse } from 'next/server';

const API_ADDRESS = process.env.API_ADDRESS
const API_PORT = process.env.API_PORT
const ESTACION = process.env.ESTACION

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sapMaterial } = body;

    if (!sapMaterial) {
      return NextResponse.json({ error: 'SAP material required' }, { status: 400 });
    }

    const response = await fetch(`http://${API_ADDRESS}:${API_PORT}/MESMaterialSearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plant: '5210',
        material: sapMaterial,

      }),
    });

    const data = await response.json();
    console.log(data);
    
    // Log the response
    console.log('=== UBICACIONES RESPONSE ===');
    console.log('SAP Material:', sapMaterial);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('============================');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ubicaciones:', error);
    return NextResponse.json({ error: 'Failed to fetch ubicaciones' }, { status: 500 });
  }
}

