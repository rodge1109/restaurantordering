// Google Apps Script for Restaurant Ordering System
// This script handles both reading products (GET) and saving orders (POST)

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
    const headers = data[0];
    const products = [];

    // Convert rows to objects (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const product = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].toLowerCase();
        let value = row[j];

        // Convert data types
        if (header === 'id') {
          value = Number(value);
        } else if (header === 'price') {
          value = Number(value);
        } else if (header === 'popular') {
          value = value === true || value === 'TRUE' || value === 'true' || value === 1;
        }

        product[header] = value;
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
      data.items || '',
      data.subtotal || 0,
      data.deliveryFee || 0,
      data.tax || 0,
      data.total || 0,
      'Pending'
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      orderNumber: orderNumber
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
