import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const callSid = params.get('CallSid')
    const callStatus = params.get('CallStatus')
    const duration = params.get('CallDuration')
    const to = params.get('To')
    const from = params.get('From')
    
    console.log(`Call status: ${callSid} - ${callStatus} (${duration}s)`)
    
    // Log call status for debugging/analytics
    // Could expand this to store in a call_logs table for analytics
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in status callback:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
