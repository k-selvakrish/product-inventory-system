// Data store
let salesData = JSON.parse(localStorage.getItem('salesData')) || [];
let saleIdCounter = parseInt(localStorage.getItem('saleIdCounter')) || 1;

// DOM
const salesForm = document.getElementById('salesForm');
const salesTableBody = document.getElementById('salesTableBody');
const totalSalesEl = document.getElementById('totalSales');
const totalPointsEl = document.getElementById('totalPoints');
const totalOrdersEl = document.getElementById('totalOrders');
const billModal = document.getElementById('billModal');
const billContent = document.getElementById('billContent');
const clearAllBtn = document.getElementById('clearAll');
const printBillBtn = document.getElementById('printBill');
const closeBillBtn = document.getElementById('closeBill');
const closeBillFooter = document.getElementById('closeBillFooter');

// Points calculation → 1 point for every ₹100
function calculatePoints(amount) {
  return Math.floor(amount / 100);
}

// Init
function init() {
  renderSalesTable();
  updateSummary();
}
init();

// Form submit
salesForm.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('id').value.trim();
  const customer = document.getElementById('customer').value.trim();
  const productName = document.getElementById('productName').value.trim();
  const quantity = parseFloat(document.getElementById('quantity').value);
  const sellingPrice = parseFloat(document.getElementById('sellingPrice').value);

  if (!id || !customer || !productName || isNaN(quantity) || isNaN(sellingPrice)) {
    alert("Please fill all fields correctly!");
    return;
  }

  const totalSelling = quantity * sellingPrice;
  const points = calculatePoints(totalSelling);

  const sale = {
    id,
    customer,
    productName,
    quantity,
    sellingPrice,
    totalSelling,
    points,
    date: new Date().toLocaleString()
  };

  salesData.push(sale);
  saveData();
  renderSalesTable();
  updateSummary();
  salesForm.reset();
});

// Save data
function saveData() {
  localStorage.setItem('salesData', JSON.stringify(salesData));
  localStorage.setItem('saleIdCounter', saleIdCounter.toString());
}

// Render Table
function renderSalesTable() {
  salesTableBody.innerHTML = '';
  salesData.forEach(sale => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sale.id}</td>
      <td>${sale.customer}</td>
      <td>${sale.productName}</td>
      <td>${sale.quantity} kg</td>
      <td>₹${sale.sellingPrice.toFixed(2)}</td>
      <td class="fw-bold text-primary">₹${sale.totalSelling.toFixed(2)}</td>
      <td class="fw-bold text-success">${sale.points}</td>
      <td class="no-print">
        <button class="btn btn-sm btn-info me-2" onclick="generateBill('${sale.id}')">
          <i class="fa-solid fa-file-invoice"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteSale('${sale.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    salesTableBody.appendChild(row);
  });
}

// Update summary
function updateSummary() {
  const totalSales = salesData.reduce((sum, s) => sum + s.totalSelling, 0);
  const totalPoints = salesData.reduce((sum, s) => sum + s.points, 0);
  totalSalesEl.textContent = `₹${totalSales.toFixed(2)}`;
  totalPointsEl.textContent = totalPoints;
  totalOrdersEl.textContent = salesData.length;
}

// Generate Bill
function generateBill(id) {
  const sale = salesData.find(s => s.id === id);
  if (!sale) return;

  billContent.innerHTML = `
    <h5 class="text-center fw-bold mb-3">SALES INVOICE</h5>
    <p><b>Invoice #:</b> ${sale.id}</p>
    <p><b>Date:</b> ${sale.date}</p>
    <hr>
    <p><b>Customer:</b> ${sale.customer}</p>
    <p><b>Product:</b> ${sale.productName}</p>
    <p><b>Quantity:</b> ${sale.quantity} kg</p>
    <p><b>Price/kg:</b> ₹${sale.sellingPrice.toFixed(2)}</p>
    <p class="fw-bold"><b>Total:</b> ₹${sale.totalSelling.toFixed(2)}</p>
    <p class="text-success"><b>Points Earned:</b> ${sale.points}</p>
  `;

  billModal.classList.remove('d-none');
}

// Delete sale
function deleteSale(id) {
  if (!confirm("Delete this sale?")) return;
  salesData = salesData.filter(s => s.id !== id);
  saveData();
  renderSalesTable();
  updateSummary();
}

// Clear All
clearAllBtn.addEventListener('click', () => {
  if (!confirm("Clear ALL sales data?")) return;
  salesData = [];
  saleIdCounter = 1;
  saveData();
  renderSalesTable();
  updateSummary();
});

// Print Bill
printBillBtn.addEventListener('click', () => {
  const win = window.open('', '', 'width=800,height=600');
  win.document.write(<html><head><title>Invoice</title></head><body>${billContent.innerHTML}</body></html>);
  win.print();
});

// Close Modal
closeBillBtn.addEventListener('click', () => billModal.classList.add('d-none'));
closeBillFooter.addEventListener('click', () => billModal.classList.add('d-none'));
