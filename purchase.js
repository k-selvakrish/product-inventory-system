const API = {
  add: "/api/add_purchase",
  list: "/api/get_purchases",
  delete: (id) => `/api/delete_purchase/${id}`,
  update: (id) => `/api/update_purchase/${id}`,
  chart: "/api/chart_data",
  export: "/api/export_csv"
};

const $ = (id) => document.getElementById(id);

function resetForm() {
  $("editId").value = "";
  $("invoiceNo").value = "";
  $("supplier").value = "";
  $("product").value = "";
  $("quantity").value = 1;
  $("unitPrice").value = 0;
  // Use UTC date string, to avoid timezone issues
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  $("purchaseDate").value = `${yyyy}-${mm}-${dd}`;
  $("paymentStatus").value = "Pending";
  $("deliveryStatus").value = "Not Delivered";
  $("notes").value = "";
  $("submitBtn").textContent = "Add Purchase";
}

async function loadPurchases() {
  try {
    const res = await fetch(API.list);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    renderTable(data);
    renderSummary(data);
    renderChart();
  } catch(e) {
    console.error('Load purchases error:', e);
  }
}

function renderTable(data) {
  const tbody = $("tableBody");
  const search = $("searchInput").value.trim().toLowerCase();
  const statusFilter = $("filterStatus").value;
  tbody.innerHTML = "";
  let shown = 0;
  data.forEach(p => {
    if (search) {
      const txt = (p.supplier + " " + p.product + " " + p.invoice_no).toLowerCase();
      if (!txt.includes(search)) return;
    }
    if (statusFilter) {
      // Use OR instead of AND for status filter so it matches payment OR delivery status
      if (p.payment_status !== statusFilter && p.delivery_status !== statusFilter) return;
    }
    shown++;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.invoice_no}</td>
      <td>${p.supplier}</td>
      <td>${p.product}</td>
      <td>${p.quantity}</td>
      <td>₹${p.unit_price}</td>
      <td>₹${p.total_amount}</td>
      <td>${p.purchase_date}</td>
      <td>${p.payment_status}</td>
      <td>${p.delivery_status}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" data-id="${p.id}" onclick="editRow(${p.id})"><i class="fa fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" data-id="${p.id}" onclick="deleteRow(${p.id})"><i class="fa fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  $("rowCount").textContent = shown;
}

function renderSummary(data) {
  const total = data.reduce((s, p) => s + Number(p.total_amount), 0);
  const pending = data.filter(p => p.payment_status === "Pending").length;
  const completed = data.filter(p => p.payment_status === "Paid").length;
  const suppliers = new Set(data.map(p => p.supplier)).size;
  $("totalAmount").textContent = `₹${total.toFixed(2)}`;
  $("pendingOrders").textContent = pending;
  $("completedOrders").textContent = completed;
  $("supplierCount").textContent = suppliers;
}

async function renderChart() {
  try {
    const res = await fetch(API.chart);
    if (!res.ok) throw new Error('Chart API error');
    const j = await res.json();
    const ctx = document.getElementById('purchaseChart').getContext('2d');
    if (window.purchaseChart) window.purchaseChart.destroy();
    window.purchaseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: j.labels,
        datasets: [{
          label: 'Monthly total (₹)',
          data: j.totals,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  } catch (e) {
    console.error("Chart render error:", e);
  }
}

$("purchaseForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const id = $("editId").value;
  const payload = {
    invoice_no: $("invoiceNo").value || undefined,
    supplier: $("supplier").value,
    product: $("product").value,
    quantity: Number($("quantity").value),
    unit_price: Number($("unitPrice").value),
    purchase_date: $("purchaseDate").value,
    payment_status: $("paymentStatus").value,
    delivery_status: $("deliveryStatus").value,
    notes: $("notes").value
  };
  if (!payload.supplier || !payload.product) {
    alert("Supplier and Product required");
    return;
  }

  try {
    let res;
    if (id) {
      res = await fetch(API.update(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(API.add, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const j = await res.json();
    if (j.success) {
      resetForm();
      loadPurchases();
    } else {
      alert("Operation failed");
    }
  } catch (err) {
    alert("API request failed");
    console.error(err);
  }
});

async function deleteRow(id) {
  if (!confirm("Delete this purchase?")) return;
  try {
    const res = await fetch(API.delete(id), { method: "DELETE" });
    const j = await res.json();
    if (j.success) loadPurchases();
  } catch (e) {
    console.error("Delete error:", e);
  }
}

async function editRow(id) {
  try {
    const res = await fetch(API.list);
    const data = await res.json();
    const p = data.find((x) => x.id === id);
    if (!p) return alert("Not found");
    $("editId").value = p.id;
    $("invoiceNo").value = p.invoice_no;
    $("supplier").value = p.supplier;
    $("product").value = p.product;
    $("quantity").value = p.quantity;
    $("unitPrice").value = p.unit_price;
    $("purchaseDate").value = p.purchase_date;
    $("paymentStatus").value = p.payment_status;
    $("deliveryStatus").value = p.delivery_status;
    $("notes").value = p.notes;
    $("submitBtn").textContent = "Update Purchase";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    alert("Error fetching record");
    console.error(err);
  }
}

$("resetBtn").addEventListener("click", resetForm);
$("searchInput").addEventListener("input", loadPurchases);
$("filterStatus").addEventListener("change", loadPurchases);
$("exportCsv").addEventListener("click", () => {
  window.location = API.export;
});

document.addEventListener("DOMContentLoaded", () => {
  resetForm();
  loadPurchases();
});