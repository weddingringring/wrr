import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!)

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactElement
  from?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  react,
  from = 'WeddingRingRing <noreply@weddingringring.com>'
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react
    })

    if (error) {
      console.error('Error sending email:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Error in sendEmail:', error)
    throw error
  }
}

/**
 * Send email with error handling and logging
 */
export async function sendEmailSafe(options: SendEmailOptions) {
  try {
    return await sendEmail(options)
  } catch (error) {
    // Log error but don't throw (emails shouldn't break the app)
    console.error('Failed to send email:', error)
    return null
  }
}
