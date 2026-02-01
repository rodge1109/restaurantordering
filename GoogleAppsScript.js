// Google Apps Script for Restaurant Ordering System
// This script handles both reading products (GET) and saving orders (POST)
// Includes PayMongo GCash integration

// ===========================
// CONFIGURATION - SMS SETTINGS
// ===========================
const SEMAPHORE_API_KEY = 'YOUR_SEMAPHORE_API_KEY_HERE';
const SEMAPHORE_SENDER_NAME = 'Kuchefnero';
const SMS_ENABLED = true;

// ===========================
// CONFIGURATION - PAYMONGO SETTINGS
// ===========================
// Get your API keys from: https://dashboard.paymongo.com/developers
const PAYMONGO_SECRET_KEY = 'sk_test_YOUR_SECRET_KEY_HERE'; // Use sk_live_ for production
const PAYMONGO_PUBLIC_KEY = 'pk_test_YOUR_PUBLIC_KEY_HERE'; // Use pk_live_ for production

// Your website URL (update this for production)
const WEBSITE_URL = 'http://localhost:5173'; // Change to your actual domain in production

// ===========================
// PAYMONGO FUNCTIONS
// ===========================

/**
 * Create a GCash payment source via PayMongo API
 * @param {number} amount - Amount in PHP (will be converted to centavos)
 * @param {string} orderNumber - The order reference number
 * @param {string} customerName - Customer's name
 * @param {string} customerEmail - Customer's email
 * @param {string} customerPhone - Customer's phone
 * @returns {object} - PayMongo source object with checkout_url
 */
function createGCashSource(amount, orderNumber, customerName, customerEmail, customerPhone) {
  const url = 'https://api.paymongo.com/v1/sources';

  // Convert PHP to centavos (PayMongo requires amount in smallest currency unit)
  const amountInCentavos = Math.round(amount * 100);

  const payload = {
    data: {
      attributes: {
        amount: amountInCentavos,
        currency: 'PHP',
        type: 'gcash',
        redirect: {
          success: WEBSITE_URL + '?payment=success&order=' + orderNumber,
          failed: WEBSITE_URL + '?payment=failed&order=' + orderNumber
        },
        billing: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        metadata: {
          order_number: orderNumber
        }
      }
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(PAYMONGO_SECRET_KEY + ':')
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    Logger.log('Creating GCash source for order: ' + orderNumber);
    Logger.log('Amount: Php ' + amount + ' (' + amountInCentavos + ' centavos)');

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('PayMongo Response Code: ' + responseCode);
    Logger.log('PayMongo Response: ' + responseText);

    if (responseCode === 200 || responseCode === 201) {
      const result = JSON.parse(responseText);
      return {
        success: true,
        sourceId: result.data.id,
        checkoutUrl: result.data.attributes.redirect.checkout_url,
        status: result.data.attributes.status
      };
    } else {
      Logger.log('PayMongo Error: ' + responseText);
      return {
        success: false,
        error: 'PayMongo API error: ' + responseCode
      };
    }
  } catch (error) {
    Logger.log('PayMongo Exception: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Check payment status of a source
 * @param {string} sourceId - The PayMongo source ID
 * @returns {object} - Source status information
 */
function checkPaymentStatus(sourceId) {
  const url = 'https://api.paymongo.com/v1/sources/' + sourceId;

  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode(PAYMONGO_SECRET_KEY + ':')
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    return {
      success: true,
      status: result.data.attributes.status,
      amount: result.data.attributes.amount / 100 // Convert back to PHP
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Update order status in Google Sheets
 * @param {string} orderNumber - The order number to update
 * @param {string} status - New status (e.g., 'Paid', 'Failed')
 * @param {string} paymentId - PayMongo source/payment ID
 */
function updateOrderStatus(orderNumber, status, paymentId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();

  // Find the order by order number (column B, index 1)
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === orderNumber) {
      // Update status (column P, index 15)
      sheet.getRange(i + 1, 16).setValue(status);
      // Update payment reference (column J, index 9) with PayMongo ID
      if (paymentId) {
        sheet.getRange(i + 1, 10).setValue(paymentId);
      }
      Logger.log('Updated order ' + orderNumber + ' status to: ' + status);
      return true;
    }
  }

  Logger.log('Order not found: ' + orderNumber);
  return false;
}

// ===========================
// SMS FUNCTION
// ===========================
function sendSMS(phoneNumber, message) {
  if (!SMS_ENABLED) {
    Logger.log('SMS is disabled. Message not sent.');
    return { success: false, message: 'SMS disabled' };
  }

  if (!SEMAPHORE_API_KEY || SEMAPHORE_API_KEY.length < 20 || SEMAPHORE_API_KEY.indexOf('YOUR_') === 0) {
    Logger.log('Semaphore API key not configured or invalid');
    return { success: false, message: 'API key not configured' };
  }

  let cleanNumber = phoneNumber.toString().replace(/[\s\-()]/g, '');

  if (cleanNumber.startsWith('0')) {
    cleanNumber = '63' + cleanNumber.substring(1);
  }

  if (!cleanNumber.startsWith('63') && !cleanNumber.startsWith('+63')) {
    cleanNumber = '63' + cleanNumber;
  }

  cleanNumber = cleanNumber.replace('+', '');

  Logger.log('Attempting to send SMS to: ' + cleanNumber);

  try {
    const url = 'https://api.semaphore.co/api/v4/messages';

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

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      return { success: false, message: 'HTTP ' + responseCode + ': ' + responseText };
    }

    const result = JSON.parse(responseText);

    if (Array.isArray(result) && result[0] && result[0].message_id) {
      return { success: true, result: result };
    } else if (result.message_id) {
      return { success: true, result: result };
    }

    return { success: true, result: result };
  } catch (error) {
    Logger.log('SMS Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ===========================
// TEST FUNCTIONS
// ===========================
function testSMS() {
  const testPhoneNumber = '09171234567';
  const testMessage = 'Kuchefnero Test: SMS integration is working!';

  Logger.log('=== SMS TEST ===');
  const result = sendSMS(testPhoneNumber, testMessage);
  Logger.log('Result: ' + JSON.stringify(result));
  return result;
}

function testPayMongo() {
  Logger.log('=== PAYMONGO TEST ===');
  Logger.log('Secret Key configured: ' + (PAYMONGO_SECRET_KEY.indexOf('YOUR_') === -1));

  // Test with a small amount
  const result = createGCashSource(100, 'TEST-' + Date.now(), 'Test User', 'test@email.com', '09171234567');
  Logger.log('Result: ' + JSON.stringify(result));

  if (result.success) {
    Logger.log('GCash Checkout URL: ' + result.checkoutUrl);
  }

  return result;
}

// ===========================
// HANDLE GET REQUESTS - Fetch products
// ===========================
function doGet(e) {
  // Check if this is a payment status check
  if (e && e.parameter && e.parameter.action === 'checkPayment') {
    const sourceId = e.parameter.sourceId;
    const result = checkPaymentStatus(sourceId);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: Return products
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

    const smallIdx = headers.indexOf('small_price');
    const mediumIdx = headers.indexOf('medium_price');
    const largeIdx = headers.indexOf('large_price');
    const priceIdx = headers.indexOf('price');
    const sizesJsonIdx = headers.indexOf('sizes_json');

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const product = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];

        if (header === 'small_price' || header === 'medium_price' ||
            header === 'large_price' || header === 'price' || header === 'sizes_json') {
          continue;
        }

        let value = row[j];

        if (header === 'id') {
          value = Number(value);
        } else if (header === 'popular') {
          value = value === true || value === 'TRUE' || value === 'true' || value === 1;
        }

        product[header] = value;
      }

      if (sizesJsonIdx >= 0 && row[sizesJsonIdx]) {
        try {
          product.sizes = JSON.parse(row[sizesJsonIdx]);
        } catch (e) {
          product.price = priceIdx >= 0 ? Number(row[priceIdx]) || 0 : 0;
        }
      }
      else if (smallIdx >= 0 || mediumIdx >= 0 || largeIdx >= 0) {
        const hasSmall = smallIdx >= 0 && row[smallIdx] !== '' && row[smallIdx] != null;
        const hasMedium = mediumIdx >= 0 && row[mediumIdx] !== '' && row[mediumIdx] != null;
        const hasLarge = largeIdx >= 0 && row[largeIdx] !== '' && row[largeIdx] != null;

        if (hasSmall || hasMedium || hasLarge) {
          product.sizes = [];
          if (hasSmall) product.sizes.push({ name: 'Small', price: Number(row[smallIdx]) });
          if (hasMedium) product.sizes.push({ name: 'Medium', price: Number(row[mediumIdx]) });
          if (hasLarge) product.sizes.push({ name: 'Large', price: Number(row[largeIdx]) });
        } else {
          product.price = priceIdx >= 0 ? Number(row[priceIdx]) || 0 : 0;
        }
      }
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

// ===========================
// HANDLE POST REQUESTS - Save orders & process payments
// ===========================
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

    // Check if this is a webhook from PayMongo
    if (data.type && data.type.startsWith('source.')) {
      return handlePayMongoWebhook(data);
    }

    const timestamp = new Date();
    const orderNumber = 'ORD-' + timestamp.getTime();

    // Determine initial status based on payment method
    let initialStatus = 'Pending';
    let paymentReference = data.paymentReference || 'N/A';

    // If GCash payment, create PayMongo source
    let gcashResult = null;
    if (data.paymentMethod === 'GCash' || data.paymentMethod === 'gcash') {
      const totalAmount = parseFloat(data.total);

      gcashResult = createGCashSource(
        totalAmount,
        orderNumber,
        data.fullName,
        data.email,
        data.phone
      );

      if (gcashResult.success) {
        initialStatus = 'Awaiting Payment';
        paymentReference = gcashResult.sourceId;
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Failed to create GCash payment: ' + gcashResult.error
        }))
        .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Save order to sheet
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
      paymentReference,
      data.items || '',
      data.subtotal || 0,
      data.deliveryFee || 0,
      data.tax || 0,
      data.total || 0,
      initialStatus
    ]);

    // For non-GCash payments, send SMS confirmation immediately
    let smsResult = null;
    if (data.paymentMethod !== 'GCash' && data.paymentMethod !== 'gcash' && data.phone) {
      const smsMessage = `Hi ${data.fullName}! Your order ${orderNumber} has been confirmed. Total: Php ${data.total}. Payment: ${data.paymentMethod}. We'll deliver to ${data.address}, ${data.city} in 25-30 mins. Thank you for ordering from Kuchefnero!`;
      smsResult = sendSMS(data.phone, smsMessage);
    }

    // Build response
    const response = {
      success: true,
      orderNumber: orderNumber,
      smsStatus: smsResult ? (smsResult.success ? 'sent' : 'failed') : 'pending'
    };

    // Add GCash checkout URL if applicable
    if (gcashResult && gcashResult.success) {
      response.paymentUrl = gcashResult.checkoutUrl;
      response.sourceId = gcashResult.sourceId;
      response.requiresPayment = true;
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===========================
// HANDLE PAYMONGO WEBHOOKS
// ===========================
function handlePayMongoWebhook(data) {
  Logger.log('PayMongo Webhook received: ' + JSON.stringify(data));

  try {
    const eventType = data.type;
    const sourceData = data.data.attributes;
    const orderNumber = sourceData.metadata ? sourceData.metadata.order_number : null;
    const sourceId = data.data.id;

    if (eventType === 'source.chargeable') {
      // Payment successful - update order status
      updateOrderStatus(orderNumber, 'Paid', sourceId);

      // Send SMS confirmation
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
      const orders = sheet.getDataRange().getValues();

      for (let i = 1; i < orders.length; i++) {
        if (orders[i][1] === orderNumber) {
          const phone = orders[i][4];
          const fullName = orders[i][2];
          const total = orders[i][14];
          const address = orders[i][5];
          const city = orders[i][6];

          const smsMessage = `Hi ${fullName}! Payment received for order ${orderNumber}. Total: Php ${total}. We'll deliver to ${address}, ${city} in 25-30 mins. Thank you!`;
          sendSMS(phone, smsMessage);
          break;
        }
      }

      Logger.log('Order ' + orderNumber + ' marked as Paid');
    } else if (eventType === 'source.failed' || eventType === 'source.expired') {
      // Payment failed
      updateOrderStatus(orderNumber, 'Payment Failed', sourceId);
      Logger.log('Order ' + orderNumber + ' payment failed');
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Webhook processed'
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Webhook Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
