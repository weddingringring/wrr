import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import ContactInquiryEmail from '@/emails/contact-inquiry'
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
      react: (
        <EmailLayout preview="Thank you for reaching out to WeddingRingRing">
          <Heading style={{ fontSize: '24px', color: '#2D5016', marginBottom: '16px' }}>
            Thank You, {name.split(' ')[0]}!
          </Heading>
          
          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
            We've received your inquiry about WeddingRingRing for {venueName}.
          </Text>

          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
            Our team will review your information and get back to you within 24 hours.
          </Text>

          <Section style={{ backgroundColor: '#FAF8F3', padding: '16px', borderRadius: '8px', margin: '24px 0' }}>
            <Text style={{ fontSize: '14px', fontWeight: '600', color: '#6B8E5C', margin: '0 0 8px' }}>
              What happens next?
            </Text>
            <Text style={{ fontSize: '14px', lineHeight: '20px', color: '#2C2C2C', margin: '0', marginLeft: '20px' }}>
              1. We'll review your inquiry<br />
              2. A team member will reach out via email or phone<br />
              3. We'll answer all your questions<br />
              4. We'll discuss how WeddingRingRing can work for you
            </Text>
          </Section>

          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
            In the meantime, if you have any urgent questions, feel free to reply to this email or call us at +44 20 1234 5678.
          </Text>

          <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#2C2C2C', margin: '0 0 16px' }}>
            Looking forward to speaking with you soon!<br />
            The WeddingRingRing Team
          </Text>
        </EmailLayout>
      )
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
