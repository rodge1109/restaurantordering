// Google Apps Script for Restaurant Ordering System
// This script handles both reading products (GET) and saving orders (POST)

// ===========================
// CONFIGURATION - SMS SETTINGS
// ===========================
// IMPORTANT: Replace this with your actual Semaphore API key
// Get your API key from: https://semaphore.co/
const SEMAPHORE_API_KEY = 'YOUR_SEMAPHORE_API_KEY_HERE';
const SEMAPHORE_SENDER_NAME = 'Kuchefnero'; // Max 11 characters
const SMS_ENABLED = true; // Set to false to disable SMS notifications

// ===========================
// SMS FUNCTION
// ===========================
function sendSMS(phoneNumber, message) {
  if (!SMS_ENABLED) {
    Logger.log('SMS is disabled. Message not sent.');
    return { success: false, message: 'SMS disabled' };
  }

  // Check if API key is valid (should be 32+ characters for Semaphore)
  if (!SEMAPHORE_API_KEY || SEMAPHORE_API_KEY.length < 20 || SEMAPHORE_API_KEY.indexOf('YOUR_') === 0) {
    Logger.log('Semaphore API key not configured or invalid');
    Logger.log('Key length: ' + (SEMAPHORE_API_KEY ? SEMAPHORE_API_KEY.length : 0));
    return { success: false, message: 'API key not configured' };
  }

  // Clean phone number - remove spaces, dashes, and ensure proper format
  let cleanNumber = phoneNumber.toString().replace(/[\s\-()]/g, '');

  // If number starts with 0, replace with 63 (Philippines country code)
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '63' + cleanNumber.substring(1);
  }

  // If number doesn't have country code, add it
  if (!cleanNumber.startsWith('63') && !cleanNumber.startsWith('+63')) {
    cleanNumber = '63' + cleanNumber;
  }

  // Remove + if present
  cleanNumber = cleanNumber.replace('+', '');

  Logger.log('Attempting to send SMS to: ' + cleanNumber);
  Logger.log('Message: ' + message);
  Logger.log('Message length: ' + message.length + ' characters');

  try {
    const url = 'https://api.semaphore.co/api/v4/messages';

    // Format payload as URL-encoded string (matching Node.js working version)
    const payload = 'apikey=' + encodeURIComponent(SEMAPHORE_API_KEY) +
                    '&number=' + encodeURIComponent(cleanNumber) +
                    '&message=' + encodeURIComponent(message) +
                    '&sendername=' + encodeURIComponent(SEMAPHORE_SENDER_NAME);

    const options = {
      'method': 'post',
      'contentType': 'application/x-www-form-urlencoded',
      'payload': payload,
      'muteHttpExceptions': true
    };

    Logger.log('Sending request to Semaphore API...');
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Response Code: ' + responseCode);
    Logger.log('Response Body: ' + responseText);

    // Check for HTTP errors
    if (responseCode !== 200) {
      Logger.log('SMS API Error - HTTP ' + responseCode + ': ' + responseText);
      return { success: false, message: 'HTTP ' + responseCode + ': ' + responseText };
    }

    const result = JSON.parse(responseText);

    // Check for message_id in response (matching Node.js success check)
    if (Array.isArray(result) && result[0] && result[0].message_id) {
      Logger.log('SMS sent successfully to ' + cleanNumber);
      Logger.log('Message ID: ' + result[0].message_id);
      return { success: true, result: result };
    } else if (result.message_id) {
      Logger.log('SMS sent successfully to ' + cleanNumber);
      Logger.log('Message ID: ' + result.message_id);
      return { success: true, result: result };
    }

    // Check if Semaphore returned an error
    if (result.error || result.status === 'failed') {
      Logger.log('SMS API returned error: ' + JSON.stringify(result));
      return { success: false, message: JSON.stringify(result) };
    }

    Logger.log('SMS response (unknown format): ' + JSON.stringify(result));
    return { success: true, result: result };
  } catch (error) {
    Logger.log('SMS Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ===========================
// TEST FUNCTION - Run this manually to test SMS
// ===========================
// Instructions:
// 1. Replace the phone number below with your test number
// 2. In Apps Script editor, select "testSMS" from the dropdown
// 3. Click "Run"
// 4. Check the Execution Log for results
function testSMS() {
  // CHANGE THIS to your test phone number (Philippine format)
  const testPhoneNumber = '09171234567';
  const testMessage = 'Kuchefnero Test: SMS integration is working! This is a test message.';

  Logger.log('=== SMS TEST STARTED ===');
  Logger.log('API Key length: ' + SEMAPHORE_API_KEY.length);
  Logger.log('API Key (first 10 chars): ' + SEMAPHORE_API_KEY.substring(0, 10) + '...');
  Logger.log('API Key starts with YOUR_: ' + (SEMAPHORE_API_KEY.indexOf('YOUR_') === 0));
  Logger.log('Sender Name: ' + SEMAPHORE_SENDER_NAME);
  Logger.log('SMS Enabled: ' + SMS_ENABLED);
  Logger.log('Test Phone: ' + testPhoneNumber);

  const result = sendSMS(testPhoneNumber, testMessage);

  Logger.log('=== SMS TEST RESULT ===');
  Logger.log('Success: ' + result.success);
  Logger.log('Full Result: ' + JSON.stringify(result));

  if (result.success) {
    Logger.log('SMS sent successfully! Check your phone.');
  } else {
    Logger.log('SMS FAILED. Check the error above.');
  }

  return result;
}

// Handle GET requests - Fetch products from Products sheet
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Products sheet not found'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toLowerCase());
    const products = [];

    // Get column indices for size fields
    const smallIdx = headers.indexOf('small_price');
    const mediumIdx = headers.indexOf('medium_price');
    const largeIdx = headers.indexOf('large_price');
    const priceIdx = headers.indexOf('price');
    const sizesJsonIdx = headers.indexOf('sizes_json');

    // Convert rows to objects (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const product = {};

      // Map basic fields (exclude size-related and price fields temporarily)
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];

        // Skip size-related fields, we'll handle them separately
        if (header === 'small_price' || header === 'medium_price' ||
            header === 'large_price' || header === 'price' || header === 'sizes_json') {
          continue;
        }

        let value = row[j];

        // Convert data types
        if (header === 'id') {
          value = Number(value);
        } else if (header === 'popular') {
          value = value === true || value === 'TRUE' || value === 'true' || value === 1;
        }

        product[header] = value;
      }

      // Handle size variants
      // First, check if there's a sizes_json column with JSON data
      if (sizesJsonIdx >= 0 && row[sizesJsonIdx]) {
        try {
          product.sizes = JSON.parse(row[sizesJsonIdx]);
        } catch (e) {
          // If JSON parsing fails, fall back to single price
          product.price = priceIdx >= 0 ? Number(row[priceIdx]) || 0 : 0;
        }
      }
      // Otherwise, check for individual size price columns
      else if (smallIdx >= 0 || mediumIdx >= 0 || largeIdx >= 0) {
        const hasSmall = smallIdx >= 0 && row[smallIdx] !== '' && row[smallIdx] != null;
        const hasMedium = mediumIdx >= 0 && row[mediumIdx] !== '' && row[mediumIdx] != null;
        const hasLarge = largeIdx >= 0 && row[largeIdx] !== '' && row[largeIdx] != null;

        // If at least one size price exists, create sizes array
        if (hasSmall || hasMedium || hasLarge) {
          product.sizes = [];
          if (hasSmall) product.sizes.push({ name: 'Small', price: Number(row[smallIdx]) });
          if (hasMedium) product.sizes.push({ name: 'Medium', price: Number(row[mediumIdx]) });
          if (hasLarge) product.sizes.push({ name: 'Large', price: Number(row[largeIdx]) });
        } else {
          // No sizes, use regular price
          product.price = priceIdx >= 0 ? Number(row[priceIdx]) || 0 : 0;
        }
      }
      // No size columns at all, use regular price
      else {
        product.price = priceIdx >= 0 ? Number(row[priceIdx]) || 0 : 0;
      }

      products.push(product);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      products: products
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests - Save orders to Orders sheet
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Orders sheet not found'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);

    const timestamp = new Date();
    const orderNumber = 'ORD-' + timestamp.getTime();

    sheet.appendRow([
      timestamp,
      orderNumber,
      data.fullName || '',
      data.email || '',
      data.phone || '',
      data.address || '',
      data.city || '',
      data.barangay || '',
      data.paymentMethod || '',
      data.paymentReference || 'N/A',
      data.items || '',
      data.subtotal || 0,
      data.deliveryFee || 0,
      data.tax || 0,
      data.total || 0,
      'Pending'
    ]);

    // Send SMS confirmation to customer
    let smsResult = null;
    if (data.phone) {
      const smsMessage = `Hi ${data.fullName}! Your order ${orderNumber} has been confirmed. Total: Php ${data.total}. Payment: ${data.paymentMethod}. We'll deliver to ${data.address}, ${data.city} in 25-30 mins. Thank you for ordering from Kuchefnero!`;

      smsResult = sendSMS(data.phone, smsMessage);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      orderNumber: orderNumber,
      smsStatus: smsResult ? (smsResult.success ? 'sent' : 'failed') : 'not_sent'
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
