document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/dashboard-stats")
        .then(response => response.json())
        .then(data => {
            document.getElementById("totalCustomers").innerText = data.customers;
            document.getElementById("totalSupplier").innerText = data.suppliers;
            document.getElementById("totalCategories").innerText = data.categories;
            document.getElementById("totalProducts").innerText = data.products;

            document.getElementById("todaySales").innerText = "₹" + data.today_sales;
            document.getElementById("todayExpenses").innerText = "₹" + data.today_expenses;

            document.getElementById("weekProfit").innerText = "₹" + data.week_profit;
            document.getElementById("monthProfit").innerText = "₹" + data.month_profit;
        });
});
