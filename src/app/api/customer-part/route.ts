import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

interface VulcRow extends RowDataPacket {
  cust_part: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sapNumber = searchParams.get('sap');

  if (!sapNumber) {
    return NextResponse.json({ error: 'SAP number required' }, { status: 400 });
  }

  try {
    // Look for the SAP number with 'P' prefix in no_sap column
    const sapWithPrefix = sapNumber.startsWith('P') ? sapNumber : `P${sapNumber}`;
    
    const [rows] = await pool.execute<VulcRow[]>(
      'SELECT cust_part FROM vulc WHERE no_sap = ? LIMIT 1',
      [sapWithPrefix]
    );

    if (rows.length > 0) {
      return NextResponse.json({ custPart: rows[0].cust_part });
    } else {
      return NextResponse.json({ custPart: null });
    }
  } catch (error) {
    console.error('Error fetching customer part:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

