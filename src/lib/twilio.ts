import twilio from 'twilio'

// Initialize Twilio client
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

/**
 * Get Twilio account balance
 */
export async function getAccountBalance() {
  try {
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch()
    return {
      balance: parseFloat(account.balance),
      currency: 'USD' // Twilio uses USD
    }
  } catch (error) {
    console.error('Error fetching account balance:', error)
    throw error
  }
}

/**
 * List all purchased phone numbers
 */
export async function listPurchasedNumbers() {
  try {
    const numbers = await twilioClient.incomingPhoneNumbers.list()
    return numbers.map(number => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      voiceUrl: number.voiceUrl,
      dateCreated: number.dateCreated
    }))
  } catch (error) {
    console.error('Error listing phone numbers:', error)
    throw error
  }
}

/**
 * Search for available phone numbers
 * @param country Country code (e.g., 'GB', 'US')
 * @param areaCode Optional area code
 */
export async function searchAvailableNumbers(country: string = 'GB', areaCode?: string) {
  try {
    const searchParams: any = {
      voiceEnabled: true,
      capabilities: {
        voice: true
      }
    }
    
    if (areaCode) {
      searchParams.areaCode = areaCode
    }
    
    const numbers = await twilioClient
      .availablePhoneNumbers(country)
      .local
      .list(searchParams)
    
    return numbers.map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      locality: number.locality,
      region: number.region,
      capabilities: number.capabilities
    }))
  } catch (error) {
    console.error('Error searching available numbers:', error)
    throw error
  }
}

/**
 * Update phone number webhooks
 * @param phoneSid Twilio phone number SID
 */
export async function updatePhoneWebhooks(phoneSid: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    
    await twilioClient.incomingPhoneNumbers(phoneSid).update({
      voiceUrl: `${appUrl}/api/twilio/voice`,
      voiceMethod: 'POST',
      statusCallback: `${appUrl}/api/twilio/status`,
      statusCallbackMethod: 'POST'
    })
    
    return true
  } catch (error) {
    console.error('Error updating webhooks:', error)
    throw error
  }
}

/**
 * Validate Twilio webhook signature
 * @param signature Signature from X-Twilio-Signature header
 * @param url Full webhook URL
 * @param params Request parameters
 */
export function validateWebhookSignature(
  signature: string,
  url: string,
  params: Record<string, any>
): boolean {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    return twilio.validateRequest(authToken, signature, url, params)
  } catch (error) {
    console.error('Error validating signature:', error)
    return false
  }
}

/**
 * Calculate estimated monthly cost for a phone number
 * UK local: ~$1.00/month + ~$0.01/min incoming
 * US local: ~$1.00/month + ~$0.0085/min incoming
 */
export function estimateMonthlyCost(country: string = 'GB', estimatedMinutes: number = 100) {
  const costs: Record<string, { monthly: number; perMinute: number }> = {
    'GB': { monthly: 1.00, perMinute: 0.01 },
    'US': { monthly: 1.00, perMinute: 0.0085 }
  }
  
  const cost = costs[country] || costs['GB']
  const total = cost.monthly + (estimatedMinutes * cost.perMinute)
  
  return {
    monthly: cost.monthly,
    perMinute: cost.perMinute,
    estimatedTotal: total,
    currency: 'USD'
  }
}

/**
 * Get recording download URL with authentication
 * @param recordingSid Twilio recording SID
 */
export function getAuthenticatedRecordingUrl(recordingSid: string): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`
}

/**
 * Test Twilio credentials
 */
export async function testTwilioCredentials(): Promise<boolean> {
  try {
    await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch()
    return true
  } catch (error) {
    console.error('Invalid Twilio credentials:', error)
    return false
  }
}
