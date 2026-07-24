/**
 * Module: utils
 * 
 * Handles logic and operations for utils.
 */

export const normalizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed;
  }
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
};

export const getBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const apiUrl = normalizeUrl(rawUrl);
  return apiUrl.replace(/\/api\/?$/, '');
}

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export const formatDate = (value) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const readErrorMessage = (error, fallback) => {
  return error.response?.data?.message || fallback
}

export const roundCurrency = (value) => {
  return Number(Number(value || 0).toFixed(2))
}

export const authConfig = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export const exportToCSV = (data, fileName) => {
  if (!data || !data.length) return

  const headers = Object.keys(data[0])
  const csvRows = []

  // Add Headers
  csvRows.push(headers.join(','))

  // Add Data
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header]
      const escaped = String(val).replace(/"/g, '""')
      return `"${escaped}"`
    })
    csvRows.push(values.join(','))
  }

  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${fileName}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const printReceipt = (sale, user, receivedAmount = 0, company = null) => {
  const receiptWindow = window.open('', '_blank', 'width=450,height=800')

  if (!receiptWindow) return

  const logoUrl = company?.logo ? `${getBaseUrl()}${company.logo}` : ''
  const companyName = company?.name || 'NILMA Alliance (Pvt) Ltd'
  const companyTagline = company?.tagline || 'Excellence Across Diverse Industries'
  const companyAddress = company?.address || '295, 1/1 Galle Road, Colombo 06, Sri Lanka'
  const companyPhone = company?.phone || '+94-742-955-414'
  const watermarkText = company?.watermark || companyName.split(' ')[0]



  const rows = sale.items
    .map(
      (item, index) => {
        // Use calculations directly from the sale record
        // originalPrice: base price from DB
        // loyaltyDiscount: calculated savings per unit (Regular - Member)
        // lineTotal: quantity * (selling price)
        
        const regularPrice = Number(item.originalPrice || item.price || 0)
        const discountPerUnit = Number(item.loyaltyDiscount || 0)
        const amount = Number(item.lineTotal || 0)

        return `
        <div style="display: flex; margin-bottom: 6px; font-size: 11px; line-height: 1.2;">
          <div style="width: 20px; text-align: center; font-weight: 700;">${index + 1}</div>
          <div style="flex: 1;">
            <div style="font-weight: 700; text-transform: uppercase; font-size: 12px; margin-bottom: 1px;">${item.name}</div>
            <div style="display: flex; font-weight: 700; font-family: 'Courier New', Courier, monospace;">
              <span style="width: 65px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.sku}</span>
              <span style="width: 30px; text-align: center;">${Number(item.quantity).toFixed(0)}</span>
              <span style="width: 55px; text-align: center;">${regularPrice.toFixed(2)}</span>
              <span style="width: 60px; text-align: center;">${discountPerUnit.toFixed(2)}</span>
              <span style="width: 65px; text-align: center; font-weight: 900;">${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `
      },
    )
    .join('')

  const balance = Math.max(0, (Number(receivedAmount) || 0) - sale.total)
  const subtotal = sale.items.reduce((sum, i) => sum + (Number(i.lineTotal) || 0), 0)

  receiptWindow.document.write(`
    <html>
      <head>
        <title>Receipt - ${sale.invoiceNumber}</title>
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          * { box-sizing: border-box; -webkit-font-smoothing: none; }
          .dashed-line { border-top: 2px dashed #000; margin: 8px 0; }
          .double-dashed-line { border-top: 4px double #000; margin: 10px 0; }
        </style>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; width: 300px; margin: 0 auto; color: #000; line-height: 1.2; font-smooth: never; -webkit-font-smoothing: none; position: relative;">
        <!-- Background Watermark -->
        <div style="position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 44px; font-weight: 900; color: #000000; opacity: 0.06; pointer-events: none; z-index: 0; user-select: none; white-space: nowrap; font-family: sans-serif;">
          ${watermarkText}
        </div>
        <div style="text-align: center; margin-bottom: 6px; padding-top: 0; margin-top: 2px;">
          ${logoUrl ? `<img src="${logoUrl}" style="max-width: 150px; max-height: 60px; margin-bottom: 5px; object-fit: contain;">` : ''}
          <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 1px;">${companyName}</div>
          <div style="font-size: 11px; font-weight: 800; border-top: 1px solid #000; border-bottom: 1px solid #000; display: inline-block; padding: 1px 6px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">${companyTagline}</div>
          <div style="font-size: 10px; font-weight: 700; line-height: 1.1; margin-bottom: 1px;">${companyAddress}</div>
          <div style="font-size: 10px; font-weight: 700;">Tel: ${companyPhone}</div>
        </div>

        <div style="font-size: 11px; margin-bottom: 6px; font-weight: 700;">
          <div style="display: flex; justify-content: space-between;">
            <span>DATE: ${new Date(sale.createdAt).toLocaleDateString()}</span>
            <span>TIME: ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>BILL: ${sale.invoiceNumber}</span>
            <span>CASHIER: ${user.name.toUpperCase()}</span>
          </div>
          <div style="margin-top: 2px; border-bottom: 1px solid #000; padding-bottom: 2px;">CUSTOMER: ${sale.customerName.toUpperCase()}</div>
          ${sale.loyaltyCard ? `<div style="margin-top: 2px; border-bottom: 1px solid #000; padding-bottom: 2px;">LOYALTY CARD: ${sale.loyaltyCard.toUpperCase()}</div>` : ''}
        </div>

        <div style="display: flex; font-weight: 900; font-size: 10px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin-bottom: 8px; text-transform: uppercase; font-family: 'Arial Black', Gadget, sans-serif;">
          <div style="width: 20px; text-align: center;">NO</div>
          <div style="flex: 1;">
            <div style="display: flex;">
              <div style="width: 65px; text-align: center;">ITEM</div>
              <div style="width: 30px; text-align: center;">QTY</div>
              <div style="width: 55px; text-align: center;">PRICE</div>
              <div style="width: 60px; text-align: center;">DISCOUNT</div>
              <div style="width: 65px; text-align: center;">AMOUNT</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          ${rows}
        </div>

        <div class="dashed-line"></div>

        <div style="font-size: 13px; margin-left: 10%; font-weight: 700;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <span>GROSS TOTAL:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <span>DISCOUNT:</span>
            <span>${Number(sale.discount || 0).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 18px; margin-top: 4px; border-top: 2px solid #000; padding-top: 4px;">
            <span>NET TOTAL:</span>
            <span>${Number(sale.total).toFixed(2)}</span>
          </div>

          ${sale.paymentMethod === 'split' && sale.splitPayments && sale.splitPayments.length > 0 ? 
            sale.splitPayments.map(p => `
              <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 12px; font-weight: 800;">
                <span>PAYMENT (${p.method.toUpperCase()}):</span>
                <span>${Number(p.amount).toFixed(2)}</span>
              </div>
            `).join('') : `
              <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 12px;">
                <span>PAYMENT (${sale.paymentMethod.toUpperCase()}):</span>
                <span>${Number(receivedAmount || sale.total).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 14px;">
                <span>BALANCE:</span>
                <span>${balance.toFixed(2)}</span>
              </div>
            `
          }
        </div>

        <div class="double-dashed-line"></div>

        <div style="text-align: center; font-weight: 700;">
          <div style="font-size: 10px; margin-bottom: 6px;">ITEMS: ${sale.items.length} | QTY: ${sale.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0).toFixed(2)}</div>
          <div style="font-weight: 900; margin: 6px 0; font-size: 13px;">*** THANK YOU - VISIT AGAIN ***</div>
          
          <div style="border-top: 1px dashed #000; padding-top: 8px; font-size: 9px; letter-spacing: 0.5px; text-transform: uppercase;">
            System by: <strong>BrightAngel IT Solutions </strong>
          </div>
          <div style="height: 2px;"></div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              window.onafterprint = function() { window.close(); };
              setTimeout(function() { window.close(); }, 1000); // safety close
            }, 300);
          };
        </script>
      </body>
    </html>
  `)
  receiptWindow.document.close()
}

