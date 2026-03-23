import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, boardId } = await request.json();
    
    // In a real application, we would use Resend, SendGrid, or nodemailer here.
    // For this demonstration, we will log it and return success to mock the system.
    console.log(`[EMAIL MOCK] Sending invite link for Board ${boardId} to: ${email}`);
    console.log(`[EMAIL MOCK] Link: http://localhost:3000/board/${boardId}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return NextResponse.json({ success: true, message: `Invite sent to ${email}!` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
