document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("categorySelect");
  const supplierSelect = document.getElementById("supplierSelect");
  const productTableBody = document.getElementById("productTableBody");
  const totalValueEl = document.getElementById("totalValue");
  const totalCountEl = document.getElementById("totalCount");

  // Categories (10)
  const categories = [
    "Food & Grocery", "Beverages", "Dairy & Bakery", "Electronics", "Stationery",
    "Home Essentials", "Clothing", "Cosmetics", "Health & Wellness", "Sports & Fitness"
  ];

  // Supplier base names per category
  const supplierBases = {
    "Food & Grocery": ["ITC Limited","Britannia","Nestle India","MTR Foods","Aashirvaad","Fortune","Haldiram","Kraft","MDH","Patanjali"],
    "Beverages": ["Coca Cola","PepsiCo","Bisleri","Tata Beverages","Red Bull","Maaza","Tropicana","Real","Paper Boat","Monster"],
    "Dairy & Bakery": ["Amul","Mother Dairy","Milky Mist","Britannia Dairy","Parag","Dairyland","Keventers","Anand","Gowardhan","Heritage"],
    "Electronics": ["Samsung","LG","Sony","Philips","Panasonic","Bajaj","Bosch","IFB","Whirlpool","Xiaomi"],
    "Stationery": ["Classmate","Camlin","Reynolds","Parker","Cello","Faber-Castell","Staples","Pilot","Cambridge","Luxor"],
    "Home Essentials": ["Godrej","Harpic","Lizol","Dettol","HUL","Mr Muscle","Vim","Cif","Hindustan Unilever","Febreze"],
    "Clothing": ["Puma","Adidas","Reebok","Nike","Levis","Allen Solly","Peter England","Zara","H&M","Benetton"],
    "Cosmetics": ["Lakme","Maybelline","Loreal","Colorbar","Nykaa","Revlon","The Body Shop","Ponds","Lotus Herbals","Biotique"],
    "Health & Wellness": ["Dabur","Himalaya","Patanjali","Glenmark","GSK","Zandu","Apollo","Cipla","Baidyanath","Sun Pharma"],
    "Sports & Fitness": ["Decathlon","Nike Sports","Adidas Sports","Puma Sports","Yonex","Cosco","SF","Kookaburra","Wilson","Slazenger"]
  };

  const baseProducts = { /* same as original */ };
  const modifiers = ["250g","500g","1kg","2kg","Pack","Combo","Family Pack","100ml","200ml","Small","Medium","Large","Deluxe","Pro","Plus","XL"];

  function generateProducts(category, supplierName) {
    const base = baseProducts[category] || ["Product"];
    const prods = [];
    for (let i = 0; i < 100; i++) {
      const b = base[i % base.length];
      const m = modifiers[i % modifiers.length];
      const variant = Math.floor(i / base.length) + 1;
      let name = `${b} ${m}`;
      if (variant > 1) name += ` - V${variant}`;
      prods.push(name);
    }
    return prods;
  }

  const data = {};
  categories.forEach(cat => {
    data[cat] = {};
    (supplierBases[cat] || []).forEach(sname => {
      data[cat][sname] = generateProducts(cat, sname);
    });
  });

  // Populate category dropdown
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  categorySelect.addEventListener("change", () => {
    supplierSelect.innerHTML = '<option value="">-- Choose Supplier --</option>';
    productTableBody.innerHTML = '<tr><td colspan="6" class="text-muted">No data selected</td></tr>';
    totalValueEl.textContent = 0;
    totalCountEl.textContent = 0;
    supplierSelect.disabled = true;

    const selected = categorySelect.value;
    if (!selected) return;
    Object.keys(data[selected]).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      supplierSelect.appendChild(opt);
    });
    supplierSelect.disabled = false;
  });

  supplierSelect.addEventListener("change", () => {
    const cat = categorySelect.value;
    const supp = supplierSelect.value;
    if (!supp) return;
    const products = data[cat][supp] || [];
    productTableBody.innerHTML = '';
    let totalStock = 0;

    products.forEach(p => {
      const newQty = Math.floor(Math.random() * 50) + 10;
      const sold = Math.floor(Math.random() * newQty);
      const balance = newQty - sold;
      const stock = Math.floor(Math.random() * 100) + 20;
      const payment = Math.random() > 0.5 ? 'Paid' : 'Pending';
      totalStock += stock;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p}</td><td>${newQty}</td><td>${sold}</td><td>${balance}</td><td>${stock}</td><td>${payment}</td>`;
      productTableBody.appendChild(tr);
    });

    totalValueEl.textContent = totalStock;
    totalCountEl.textContent = products.length;

    if ($.fn.DataTable.isDataTable("#productTable")) {
      $("#productTable").DataTable().destroy();
    }
    $("#productTable").DataTable({
      dom: 'Bfrtip',
      buttons: ['csv', 'excel', 'pdf', 'print'],
      pageLength: 10
    });
  });

  document.getElementById("addSupplierBtn").addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("addSupplierModal")).show();
  });

  document.getElementById("addSupplierForm").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("New contact added successfully!");
    bootstrap.Modal.getInstance(document.getElementById("addSupplierModal")).hide();
    e.target.reset();
  });

  document.getElementById('searchBox').addEventListener('input', (e) => {
    const q = (e.target.value || '').toLowerCase().trim();
    if (!q) return;
    const matchedCat = categories.find(c => c.toLowerCase().includes(q));
    if (matchedCat) {
      categorySelect.value = matchedCat;
      categorySelect.dispatchEvent(new Event('change'));
      return;
    }
    for (const c of Object.keys(data)) {
      const supplier = Object.keys(data[c]).find(s => s.toLowerCase().includes(q));
      if (supplier) {
        categorySelect.value = c;
        categorySelect.dispatchEvent(new Event('change'));
        supplierSelect.value = supplier;
        supplierSelect.dispatchEvent(new Event('change'));
        return;
      }
    }
  });
});
