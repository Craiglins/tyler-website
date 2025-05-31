import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Generate a unique customer ID
    const customerId = uuidv4();

    // Create a new customer record
    const customer = await prisma.customer.create({
      data: {
        customerId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });

    let estimatedAmount = null;
    let status = 'PENDING';

    // If images or text description is provided, try to generate an automated estimate
    if ((data.images && data.images.length > 0) || data.additionalInfo) {
      try {
        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/estimates/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: data.images,
            textDescription: data.additionalInfo,
          }),
        });

        if (analysisResponse.ok) {
          const { estimatedAmount: autoEstimate, analysis } = await analysisResponse.json();
          if (autoEstimate) {
            estimatedAmount = autoEstimate;
            status = 'ESTIMATED';
            // Update additionalInfo with the analysis
            data.additionalInfo = `${data.additionalInfo ? data.additionalInfo + '\n\n' : ''}Automated Analysis: ${analysis}`;
          }
        }
      } catch (error) {
        console.error('Error generating automated estimate:', error);
        // Continue with manual estimate if automated analysis fails
      }
    }
    
    // Create a new estimate record linked to the customer
    const estimate = await prisma.estimate.create({
      data: {
        customerId: customer.customerId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        serviceType: data.serviceType,
        preferredDate: new Date(data.date),
        preferredTime: data.time,
        paymentMethod: data.paymentMethod,
        additionalInfo: data.additionalInfo,
        status,
        estimatedAmount,
        images: data.images || [],
      },
    });

    return NextResponse.json({
      success: true,
      customerId,
      estimateId: estimate.id,
      message: status === 'ESTIMATED' 
        ? 'Booking request received with automated estimate'
        : 'Booking request received successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create booking' },
      { status: 500 }
    );
  }
} 