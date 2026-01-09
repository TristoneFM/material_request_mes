import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MaterialRequest from '@/models/MaterialRequest';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch material requests for plant 5210 excluding Canceled and Delivered
    const materialRequests = await MaterialRequest.find({ 
      plantCode: '5210',
      status: { $nin: ['Canceled', 'Delivered'] }
    })
      .sort({ requestTime: -1 })
      .lean();

    return NextResponse.json(materialRequests);
  } catch (error) {
    console.error('Error fetching material requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material requests' },
      { status: 500 }
    );
  }
}

