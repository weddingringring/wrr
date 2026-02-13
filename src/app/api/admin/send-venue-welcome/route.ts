import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, venueName, ownerName, temporaryPassword } = body

    if (!email || !venueName || !ownerName || !temporaryPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://wrr-29ly.vercel.app'

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'WeddingRingRing <noreply@weddingringring.com>', // Replace with your verified domain
      to: [email],
      subject: 'Welcome to WeddingRingRing - Your Venue Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to WeddingRingRing</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap" rel="stylesheet">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #FAF8F3;">
            <!-- Logo and Header -->
            <div style="background: #fff; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
              <img 
                src="${siteUrl.startsWith('http') ? siteUrl : 'https://' + siteUrl}/logo.png" 
                alt="WeddingRingRing" 
                style="max-width: 200px; height: auto; margin: 0 auto 20px; display: block;"
              />
              <h1 style="font-family: 'Crimson Text', Georgia, serif; color: #2d5f4f; margin: 0; font-size: 32px; font-weight: 600;">
                Welcome to WeddingRingRing
              </h1>
            </div>
            
            <div style="background: #fff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${ownerName},</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Your venue account for <strong>${venueName}</strong> has been created on WeddingRingRing!
              </p>
              
              <div style="background: #f9fafb; border-left: 4px solid #2d5f4f; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #2d5f4f;">Your Login Credentials:</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>⚠️ Important:</strong> Please change your password after your first login for security.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl.startsWith('http') ? siteUrl : 'https://' + siteUrl}/login" 
                   style="display: inline-block; background: #2d5f4f; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Login to Your Account
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <h3 style="color: #2d5f4f; margin-bottom: 15px;">Getting Started</h3>
              <ol style="padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 10px;">Log in to your venue dashboard</li>
                <li style="margin-bottom: 10px;">Complete your venue profile</li>
                <li style="margin-bottom: 10px;">Create your first event</li>
                <li style="margin-bottom: 10px;">Start collecting voice messages!</li>
              </ol>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Need help? Contact us at <a href="mailto:support@weddingringring.com" style="color: #2d5f4f;">support@weddingringring.com</a>
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                Best regards,<br>
                The WeddingRingRing Team
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0;">
                © ${new Date().getFullYear()} WeddingRingRing. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error: any) {
    console.error('Send welcome email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
