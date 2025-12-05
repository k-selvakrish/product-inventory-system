from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, g
import mysql.connector
from datetime import date

app = Flask(__name__)
app.secret_key = "selva_secret_key"

# ===================== DATABASE CONNECTION =====================
def get_db_connection():
    if 'db' not in g:
        g.db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="super_project",
            buffered=True
        )
    return g.db

@app.teardown_appcontext
def close_db_connection(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# ===================== LOGIN PAGE =====================
@app.route('/')
def index():
    return render_template('index.html')

# ===================== LOGIN =====================
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('user')
    password = request.form.get('pass')

    db = get_db_connection()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM admin WHERE username=%s AND password=%s", (username, password))
    user = cur.fetchone()
    cur.close()

    if user:
        session['user'] = user['username']
        flash("Login Successful!", "success")
        return redirect(url_for('dashboard'))
    else:
        flash("Invalid Username or Password!", "danger")
        return redirect(url_for('index'))

# ===================== DASHBOARD PAGE =====================
@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        flash("Please login first!", "warning")
        return redirect(url_for('index'))

    return render_template('dashboard.html')

# ===================== LIVE DASHBOARD API =====================
@app.route('/api/dashboard-stats')
def dashboard_stats():

    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    # Total Customers
    cur.execute("SELECT COUNT(*) AS total FROM customers")
    customers = cur.fetchone()['total']

    # Total Suppliers
    cur.execute("SELECT COUNT(*) AS total FROM suppliers")
    suppliers = cur.fetchone()['total']

    # Total Categories
    try:
        cur.execute("SELECT COUNT(*) AS total FROM categories")
        categories = cur.fetchone()['total']
    except:
        categories = 0

    # Total Products
    cur.execute("SELECT COUNT(*) AS total FROM products")
    products = cur.fetchone()['total']

    # Today's Sales
    try:
        cur.execute("SELECT SUM(amount) AS total FROM sales WHERE date = CURDATE()")
        today_sales = cur.fetchone()['total'] or 0
    except:
        today_sales = 0

    # Today's Expenses
    try:
        cur.execute("SELECT SUM(amount) AS total FROM expenses WHERE expense_date = CURDATE()")
        today_expenses = cur.fetchone()['total'] or 0
    except:
        today_expenses = 0

    # Week Profit
    try:
        cur.execute("""
            SELECT 
                (SELECT IFNULL(SUM(amount),0) FROM sales WHERE WEEK(date)=WEEK(CURDATE())) -
                (SELECT IFNULL(SUM(amount),0) FROM expenses WHERE WEEK(expense_date)=WEEK(CURDATE()))
            AS profit
        """)
        week_profit = cur.fetchone()['profit'] or 0
    except:
        week_profit = 0

    # Month Profit
    try:
        cur.execute("""
            SELECT 
                (SELECT IFNULL(SUM(amount),0) FROM sales WHERE MONTH(date)=MONTH(CURDATE())) -
                (SELECT IFNULL(SUM(amount),0) FROM expenses WHERE MONTH(expense_date)=MONTH(CURDATE()))
            AS profit
        """)
        month_profit = cur.fetchone()['profit'] or 0
    except:
        month_profit = 0

    cur.close()

    return jsonify({
        "customers": customers,
        "suppliers": suppliers,
        "categories": categories,
        "products": products,
        "today_sales": today_sales,
        "today_expenses": today_expenses,
        "week_profit": week_profit,
        "month_profit": month_profit
    })

# ===================== CUSTOMER MODULE =====================
# CUSTOMER LIST PAGE
# ------------------------------
# CUSTOMER LIST PAGE
# ------------------------------
@app.route('/customer')
def customer():
    if 'user' not in session:
        flash("Please login first!", "warning")
        return redirect(url_for('index'))

    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    # Count total customers for live count
    cur.execute("SELECT COUNT(*) AS total FROM customers")
    total_customers = cur.fetchone()['total']

    # Fetch all customers
    cur.execute("SELECT * FROM customers ORDER BY id DESC")
    customers = cur.fetchall()

    cur.close()
    db.close()

    return render_template(
        'customer.html',
        customers=customers,
        total_customers=total_customers
    )


# ------------------------------
# CUSTOMER FORM SUBMIT (INSERT)
# ------------------------------
@app.route('/cusform', methods=['POST'])
def cusform():
    if 'user' not in session:
        flash("Please login first!", "warning")
        return redirect(url_for('index'))

    name = request.form.get('name', '').strip()
    father_name = request.form.get('father_name', '').strip()
    email = request.form.get('email', '').strip()
    phone = request.form.get('phone', '').strip()
    whatsapp = request.form.get('whatsapp', '').strip()
    address = request.form.get('address', '').strip()
    state = request.form.get('state', '').strip()
    pincode = request.form.get('pincode', '').strip()

    # Basic validation (optional but good)
    if not name or not phone:
        flash("Name and Phone are required!", "danger")
        return redirect(url_for('customer'))

    db = get_db_connection()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO customers 
        (name, father_name, email, phone, whatsapp, address, state, pincode)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (name, father_name, email, phone, whatsapp, address, state, pincode))

    db.commit()
    cur.close()
    db.close()

    flash("Customer added successfully!", "success")
    return redirect(url_for('customer'))



# ===================== SUPPLIER MODULE =====================
@app.route('/supplier')
def supplier():
    if 'user' not in session:
        flash("Please login first!", "warning")
        return redirect(url_for('index'))

    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM suppliers")
    supplier_list = cur.fetchall()

    cur.execute("SELECT * FROM categories")
    categories_list = cur.fetchall()

    cur.close()

    return render_template('supplier.html', supplier=supplier_list, categories=categories_list)

@app.route('/add_supplier', methods=['POST'])
def add_supplier():
    if 'user' not in session:
        flash("Please login first!", "warning")
        return redirect(url_for('index'))

    contact_type = request.form.get('contactType')
    contact_id = request.form.get('contactId')
    business_name = request.form.get('businessName')
    prefix = request.form.get('prefix')
    first_name = request.form.get('firstName')
    middle_name = request.form.get('middleName')
    last_name = request.form.get('lastName')
    mobile = request.form.get('mobile')
    alt_contact = request.form.get('altContact')
    landline = request.form.get('landline')
    email = request.form.get('email')
    dob = request.form.get('dob')

    db = get_db_connection()
    cur = db.cursor()
    cur.execute("""
        INSERT INTO suppliers (contact_type, contact_id, business_name, prefix, first_name, middle_name, last_name, mobile, alt_contact, landline, email, dob)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (contact_type, contact_id, business_name, prefix, first_name, middle_name, last_name, mobile, alt_contact, landline, email, dob))
    db.commit()
    cur.close()

    flash("Supplier added successfully!", "success")
    return redirect(url_for('supplier'))

# ===================== OTHER PAGES =====================
@app.route('/category')
def category():
    return render_template('category.html')

@app.route('/purchase')
def purchase():
    return render_template('purchase.html')

@app.route('/profit_of_sales')
def profit():
    return render_template('profit_of_sales.html')

@app.route('/expenses')
def expenses():
    return render_template('expenses.html')

@app.route('/report')
def report():
    return render_template('report.html')

# ===================== LOGOUT =====================
@app.route('/logout')
def logout():
    session.pop('user', None)
    flash("Logged out successfully!", "info")
    return redirect(url_for('index'))

# ===================== MAIN =====================
if __name__ == '__main__':
    app.run(debug=True)
