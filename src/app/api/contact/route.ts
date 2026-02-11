import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import ContactInquiryEmail from '@/emails/contact-inquiry'
import ContactConfirmationEmail from '@/emails/contact-confirmation'
import { EmailLayout } from '@/emails/components/EmailLayout'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, venueName, email, phone, message, interest } = body

    // Validate required fields
    if (!name || !venueName || !email || !interest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Store in database (create a contact_inquiries table)
    const { data: inquiry, error: dbError } = await supabase
      .from('contact_inquiries')
      .insert({
        name,
        venue_name: venueName,
        email,
        phone: phone || null,
        message: message || null,
        interest_type: interest,
        source: 'website',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Continue anyway - we'll still send the email
    }

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@weddingringring.com'

    const subjectType = interest === 'venue' ? 'Venue' : 'Customer'
    const inquiryType = interest === 'venue' ? 'Venue Owner/Manager' : interest === 'couple' ? 'Engaged Couple' : 'Other'
    const previewText = `New inquiry from ${name} at ${venueName}`
    const emailSubject = `New ${subjectType} Inquiry - ${venueName}`
    
    await sendEmail({
      to: adminEmail,
      subject: emailSubject,
      react: ContactInquiryEmail({
        inquiryType,
        name,
        venueName,
        email,
        phone: phone || '',
        message: message || '',
        previewText,
      })
    })

    // Send confirmation email to customer
    await sendEmail({
      to: email,
      subject: 'Thank You for Your Interest in WeddingRingRing',
      react: ContactConfirmationEmail({
        name,
        venueName,
      })
    })

    return NextResponse.json({ 
      success: true,
      message: 'Inquiry submitted successfully'
    })

  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    )
  }
}
