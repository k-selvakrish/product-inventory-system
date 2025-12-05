let expenses = [];
let monthlyChart;

async function fetchExpenses() {
  try {
    const res = await fetch("/api/expenses");
    if (!res.ok) throw new Error("Network response was not ok");
    expenses = await res.json();
    renderExpenses();
    updateCharts();
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("expenseForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const date = document.getElementById("expenseDate").value;
    const category = document.getElementById("expenseCategory").value;
    const description = document.getElementById("expenseDescription").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);

    if (!date || !category || !description || isNaN(amount)) {
      alert("Fill all fields correctly!");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, category, description, amount }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      await fetchExpenses(); // Refresh after adding
      form.reset();
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  });

  fetchExpenses(); // Initial load
});

function renderExpenses() {
  const tbody = document.getElementById("expenseTableBody");
  const recentList = document.getElementById("recentList");
  const totalDisplay = document.getElementById("totalExpenses");
  const monthlyDisplay = document.getElementById("monthlyExpenses");

  tbody.innerHTML = "";
  recentList.innerHTML = "";

  if (expenses.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No expenses yet</td></tr>";
    recentList.innerHTML = "<li>No expenses yet</li>";
    totalDisplay.innerText = "₹0";
    monthlyDisplay.innerText = "₹0";
    return;
  }

  let total = 0;
  expenses.forEach((e, i) => {
    total += parseFloat(e.amount);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>${e.category}</td>
      <td>${e.description}</td>
      <td>₹${parseFloat(e.amount).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  totalDisplay.innerText = `₹${total.toFixed(2)}`;
  monthlyDisplay.innerText = `₹${total.toFixed(2)}`;

  const recent = expenses.slice(-3).reverse();
  recent.forEach((e) => {
    const li = document.createElement("li");
    li.textContent = `${e.description}: ₹${parseFloat(e.amount).toFixed(2)}`;
    recentList.appendChild(li);
  });
}

function updateCharts() {
  const ctx = document.getElementById("monthlyChart");
  if (!ctx) return;

  const ctx2 = ctx.getContext("2d");
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthAmounts = months.map((m) =>
    expenses
      .filter((e) => new Date(e.date).getMonth() + 1 === m)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  );

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: months.map((m) => `Month ${m}`),
      datasets: [
        {
          label: "Monthly Expenses",
          data: monthAmounts,
          backgroundColor: "#36A2EB",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
