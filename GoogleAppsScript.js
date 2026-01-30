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
