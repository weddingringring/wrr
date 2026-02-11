# Twilio Regulatory Bundle Setup Guide

## ⚠️ CRITICAL: Required for UK Phone Numbers

Before you can purchase UK phone numbers (and numbers in many other countries), you **must** create and submit a Regulatory Bundle in Twilio.

---

## 📋 What You Need

### For UK Business Registration:
- **Business Name**
- **Business Address** (UK address)
- **Business Registration Number** (Companies House number)
- **Proof of Address** (utility bill, bank statement, etc.)

### For Individual Registration:
- **Full Name**
- **Residential Address** (UK address)
- **Proof of Identity** (passport, driving license)
- **Proof of Address** (utility bill, council tax, etc.)

---

## 🔧 Setup Steps

### Step 1: Log into Twilio Console
1. Go to https://console.twilio.com
2. Navigate to **Regulatory Compliance** in the left sidebar
3. Click **Bundles**

### Step 2: Create a New Bundle
1. Click **Create new Regulatory Bundle**
2. Select your country: **United Kingdom (GB)**
3. Choose number type: **Local** (most common for landlines)
4. Select end-user type:
   - **Business** (if registering as a company)
   - **Individual** (if registering personally)

### Step 3: Fill in Required Information

**For Business:**
```
Legal Business Name: [Your company name]
Business Registration Number: [Companies House number]
Business Address:
  Street: [Your business address]
  City: [City]
  Postal Code: [Postcode]
  Country: United Kingdom
```

**For Individual:**
```
Full Name: [Your full legal name]
Date of Birth: [DD/MM/YYYY]
Residential Address:
  Street: [Your home address]
  City: [City]
  Postal Code: [Postcode]
  Country: United Kingdom
```

### Step 4: Upload Supporting Documents

**Required Documents:**
- **Proof of Address** (dated within last 3 months):
  - Utility bill (gas, electricity, water)
  - Bank statement
  - Council tax bill
  - HMRC correspondence

**For Business (additional):**
- **Certificate of Incorporation** (from Companies House)
- **Proof of Business Address**
- **Director's ID** (passport or driving license)

**For Individual:**
- **Proof of Identity**:
  - UK Passport
  - UK Driving License
  - National ID card

### Step 5: Submit for Review
1. Review all information
2. Click **Submit for Review**
3. Wait for Twilio approval (usually 1-3 business days)

### Step 6: Get Your Bundle SID
Once approved:
1. Go back to **Regulatory Compliance → Bundles**
2. Find your approved bundle
3. Copy the **Bundle SID** (starts with `BU...`)
4. This is your `TWILIO_REGULATORY_BUNDLE_SID`

---

## 🔑 Environment Variable

Once you have your Bundle SID, add it to your environment variables:

```bash
TWILIO_REGULATORY_BUNDLE_SID=BUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Without this, phone number purchases will fail!**

---

## 📱 What This Enables

Once your regulatory bundle is approved and configured:
- ✅ Automatic phone number purchases work
- ✅ Numbers are properly registered to your business
- ✅ Compliant with UK Ofcom regulations
- ✅ Can purchase multiple numbers using the same bundle

---

## 🌍 International Bundles

If you plan to offer services in other countries, you'll need separate bundles for:
- **US/Canada** - Requires US address + tax ID
- **France** - Requires French SIRET number
- **Germany** - Requires German business registration
- **Spain** - Requires Spanish NIF/CIF
- And so on...

Each country has different requirements. Check Twilio's regulatory requirements page:
https://www.twilio.com/guidelines/regulatory

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Complete bundle form | 15-30 minutes |
| Upload documents | 10 minutes |
| Twilio review | 1-3 business days |
| **Total** | **1-3 days** |

---

## 🚨 Common Issues

### "Bundle Not Approved"
- Check all documents are clear and readable
- Ensure addresses match exactly
- Make sure documents are recent (within 3 months)
- Try different document types

### "Number Purchase Still Fails"
- Verify `TWILIO_REGULATORY_BUNDLE_SID` is correct
- Check bundle status is "Approved" not "Pending"
- Ensure bundle is for the correct country (GB)
- Contact Twilio support

### "Multiple Bundles Needed?"
No! One approved bundle can be used for all UK number purchases.

---

## 💡 Pro Tips

1. **Use Business Registration**: Faster approval, more professional
2. **PDF Documents**: Upload as PDF for best quality
3. **Keep Documents Handy**: You might need to update annually
4. **Test Purchase**: Try buying one number manually first
5. **Save Bundle SID**: Keep it safe, you'll use it for all purchases

---

## 🔄 After Approval

Once approved:
1. ✅ Add `TWILIO_REGULATORY_BUNDLE_SID` to environment variables
2. ✅ Redeploy application (if already deployed)
3. ✅ Test phone number purchase
4. ✅ Verify number shows in Twilio Console
5. ✅ Test incoming call to purchased number

---

## 📞 Need Help?

**Twilio Support:**
- Email: help@twilio.com
- Phone: +1 (888) 908-9454
- Docs: https://www.twilio.com/docs/phone-numbers/regulatory

**Regulatory Compliance:**
- https://www.twilio.com/guidelines/regulatory
- https://support.twilio.com/hc/en-us/articles/223179808

---

**⚠️ IMPORTANT: Do this ASAP!**

The regulatory bundle approval takes 1-3 business days, so start this process now while we finish the deployment setup. You can test everything else (database, storage, emails) while waiting for bundle approval.
