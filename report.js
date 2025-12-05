/* ----------------------
  Helper functions
---------------------- */
async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    console.error('Fetch error', url, e);
    return [];
  }
}

function populateSelect(sel, items, valueKey='id', textKey='name', prependEmpty=true){
  sel.innerHTML = '';
  if (prependEmpty) sel.appendChild(new Option('-- All --', ''));
  items.forEach(it => sel.appendChild(new Option(it[textKey], it[valueKey])));
}

/* ----------------------
  Global cache
---------------------- */
let GLOBAL = {
  suppliers: [],
  customers: [],
  products: [],
  categories: []
};

/* ----------------------
  Init DataTables
---------------------- */
let dtSuppliers, dtCustomers, dtPurchases, dtExpenses, dtProfit;

function initDataTables(){
  const commonOpts = {
    dom: 'Bfrtip',
    buttons: [
      { extend:'copy', text:'Copy' },
      { extend:'csv', text:'CSV' },
      { extend:'excel', text:'Excel' },
      { extend:'pdf', text:'PDF' },
      { extend:'print', text:'Print' },
      { extend:'colvis', text:'Columns' }
    ],
    pageLength: 25,
    responsive: true
  };

  dtSuppliers = $('#tblSuppliers').DataTable(Object.assign({}, commonOpts, {
    columns: [
      {data: 'id'}, {data: 'name'}, {data: 'category'}, {data: 'contact'}, {data: 'phone'}, {data: 'address'}
    ]
  }));

  dtCustomers = $('#tblCustomers').DataTable(Object.assign({}, commonOpts, {
    columns: [
      {data: 'id'}, {data: 'name'}, {data: 'email'}, {data: 'phone'}, {data: 'address'}
    ]
  }));

  dtPurchases = $('#tblPurchases').DataTable(Object.assign({}, commonOpts, {
    columns: [
      {data:'id'}, {data:'purchase_date'}, {data:'bill_no'}, {data:'supplier_name'}, {data:'product_name'}, {data:'total_amount'}
    ]
  }));

  dtExpenses = $('#tblExpenses').DataTable(Object.assign({}, commonOpts, {
    columns: [
      {data:'id'}, {data:'expense_date'}, {data:'category'}, {data:'description'}, {data:'amount'}
    ]
  }));

  dtProfit = $('#tblProfit').DataTable(Object.assign({}, commonOpts, {
    columns: [
      {data:'period'}, {data:'total_sales'}, {data:'total_purchases'}, {data:'total_expenses'}, {data:'gross_profit'}
    ]
  }));
}

/* ----------------------
  Load initial data
---------------------- */
async function loadInitial() {
  GLOBAL.suppliers = await fetchJSON('/api/suppliers');
  GLOBAL.customers = await fetchJSON('/api/customers');
  GLOBAL.products = await fetchJSON('/api/products').catch(()=>[]);
  const cats = [...new Set(GLOBAL.suppliers.map(s => s.category).filter(Boolean))].sort();
  GLOBAL.categories = cats.map(c => ({ id: c, name: c }));

  populateSelect(document.getElementById('filterCategory'), GLOBAL.categories, 'id', 'name');
  populateSelect(document.getElementById('filterSupplier'), GLOBAL.suppliers, 'id', 'name');
  populateSelect(document.getElementById('filterProduct'), GLOBAL.products.map(p => ({ id: p.id, name: p.name })), 'id', 'name');

  const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 30);
  document.getElementById('dateTo').value = to.toISOString().slice(0,10);
  document.getElementById('dateFrom').value = from.toISOString().slice(0,10);

  await refreshAllTables();
}

/* ----------------------
  Refresh functions
---------------------- */
async function refreshSuppliers(){
  dtSuppliers.clear().rows.add(GLOBAL.suppliers).draw();
}

async function refreshCustomers(){
  dtCustomers.clear().rows.add(GLOBAL.customers).draw();
}

function matchesDateRange(rowDateStr, fromStr, toStr){
  if (!fromStr && !toStr) return true;
  if (!rowDateStr) return true;
  const r = new Date(rowDateStr);
  if (fromStr && r < new Date(fromStr)) return false;
  if (toStr && r > new Date(toStr)) return false;
  return true;
}

async function refreshPurchases(){
  const all = await fetchJSON('/api/purchases');
  const cat = document.getElementById('filterCategory').value;
  const sup = document.getElementById('filterSupplier').value;
  const prod = document.getElementById('filterProduct').value;
  const from = document.getElementById('dateFrom').value;
  const to = document.getElementById('dateTo').value;

  const filtered = all.filter(r => {
    if (cat) {
      const s = GLOBAL.suppliers.find(x => String(x.id) === String(r.supplier_id) || x.name === r.supplier_name);
      if (!s || (s.category || '') !== cat) return false;
    }
    if (sup && String(r.supplier_id) !== String(sup)) return false;
    if (prod && String(r.product_name) !== String(prod) && String(r.product_id||'') !== String(prod)) return false;
    if (!matchesDateRange(r.purchase_date, from, to)) return false;
    return true;
  });

  dtPurchases.clear().rows.add(filtered).draw();
}

async function refreshExpenses(){
  const all = await fetchJSON('/api/expenses');
  const from = document.getElementById('dateFrom').value;
  const to = document.getElementById('dateTo').value;
  const filtered = all.filter(r => matchesDateRange(r.expense_date, from, to));
  dtExpenses.clear().rows.add(filtered).draw();
}

async function refreshProfit(){
  const all = await fetchJSON('/api/profit_of_sales');
  dtProfit.clear().rows.add(all).draw();
}

async function refreshAllTables(){
  await refreshSuppliers();
  await refreshCustomers();
  await refreshPurchases();
  await refreshExpenses();
  await refreshProfit();
}

/* ----------------------
  Events
---------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  initDataTables();
  await loadInitial();

  document.getElementById('btnApply').addEventListener('click', refreshAllTables);
  document.getElementById('btnReset').addEventListener('click', async () => {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterSupplier').value = '';
    document.getElementById('filterProduct').value = '';
    const to = new Date(); const from = new Date(); from.setDate(to.getDate() - 30);
    document.getElementById('dateTo').value = to.toISOString().slice(0,10);
    document.getElementById('dateFrom').value = from.toISOString().slice(0,10);
    await loadInitial();
  });

  document.getElementById('filterCategory').addEventListener('change', () => {
    const cat = document.getElementById('filterCategory').value;
    const subs = cat ? GLOBAL.suppliers.filter(s => (s.category || '') === cat) : GLOBAL.suppliers;
    populateSelect(document.getElementById('filterSupplier'), subs, 'id', 'name');
  });

  document.getElementById('filterSupplier').addEventListener('change', () => {
    const supId = document.getElementById('filterSupplier').value;
    if (!supId) {
      populateSelect(document.getElementById('filterProduct'), GLOBAL.products.map(p=>({id:p.id, name:p.name})));
    } else {
      const prods = GLOBAL.products.filter(p => String(p.supplier_id) === String(supId));
      populateSelect(document.getElementById('filterProduct'), prods.map(p=>({id:p.id, name:p.name})));
    }
  });

  $('#tblPurchases tbody').on('click', 'tr', function () {
    const data = dtPurchases.row(this).data();
    if (data) alert('Purchase detail:\n' + JSON.stringify(data, null, 2));
  });

  $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function () {
    dtSuppliers.columns.adjust();
    dtCustomers.columns.adjust();
    dtPurchases.columns.adjust();
    dtExpenses.columns.adjust();
    dtProfit.columns.adjust();
  });
});
