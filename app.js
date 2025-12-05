// Citation for adapted starter code:
// Date: 11/03/2025
// Adapted from: Exploration: Web Application Technology (CS340 starter app)
// Author: Oregon State University CS340 Instructional Team
// Source URL: https://canvas.oregonstate.edu/courses/2017561/pages/exploration-web-application-technology-2?module_item_id=25645131


// ########################################
// ########## SETUP

// Express
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const PORT = 8696;

// Database
const db = require('./database/db-connector');

// Handlebars
const { engine } = require('express-handlebars');

app.engine('.hbs', engine({
    extname: '.hbs',
    helpers: {
        formatDate: function (d) {
            if (!d) return "";
            try {
                return new Date(d).toISOString().split("T")[0];
            } catch (e) {
                return d;
            }
        }
    }
}));

app.set('view engine', '.hbs');

// ########################################
// ########## ROUTE HANDLERS

// READ ROUTES
app.get('/', async function (req, res) {
    try {
        res.render('home');
    } catch (error) {
        console.error('Error rendering home page:', error);
        res.status(500).send('An error occurred while rendering the home page.');
    }
});

app.get('/clients', async function (req, res) {
    try {
        const query1 = `SELECT * FROM Clients;`;
        const query2 = `SELECT * FROM Categories;`;
        const [clients] = await db.query(query1);
        const [categories] = await db.query(query2);

        res.render('brewlogic-clients', { clients: clients, categories: categories });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).send('An error occurred while retrieving client data.');
    }
});

app.get('/products', async function (req, res) {
    try {
        const query1 = `SELECT * FROM Products;`;
        const [products] = await db.query(query1);

        res.render('brewlogic-products', { products: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('An error occurred while retrieving product data.');
    }
});

app.get('/categories', async function (req, res) {
    try {
        const query1 = `SELECT * FROM Categories;`;
        const [categories] = await db.query(query1);

        res.render('brewlogic-categories', { categories: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('An error occurred while retrieving category data.');
    }
});

app.get('/salesorders', async function (req, res) {
    try {
        const query1 = `SELECT * FROM SalesOrders;`;
        const query2 = `SELECT * FROM Clients;`;
        const [salesorders] = await db.query(query1);
        const [clients] = await db.query(query2);

        res.render('brewlogic-salesorders', { salesorders: salesorders, clients: clients });
    } catch (error) {
        console.error('Error fetching sales orders:', error);
        res.status(500).send('An error occurred while retrieving sales order data.');
    }
});

app.get('/orderitems', async function (req, res) {
    try {
        const query1 = `SELECT * FROM OrderItems;`;
        const query2 = `SELECT * FROM Products;`;
        const query3 = `SELECT * FROM SalesOrders;`;
        const [orderitems] = await db.query(query1);
        const [products] = await db.query(query2);
        const [salesorders] = await db.query(query3);

        res.render('brewlogic-orderitems', {
            orderitems: orderitems,
            products: products,
            salesorders: salesorders
        });
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).send('An error occurred while retrieving order item data.');
    }
});

// RESET Database Route
app.get('/reset', async function (req, res) {
    try {
        const query = 'CALL sp_brewlogic_reset();';
        await db.query(query);
        console.log("Database reset successfully.");
        res.redirect('/'); 
    } catch (error) {
        console.error('Error executing reset:', error);
        res.status(500).send('An error occurred while resetting the database.');
    }
});

// CREATE Routes
app.post('/clients/add', async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, address, categoryID } = req.body;
        await db.query('CALL sp_insert_client(?,?,?,?,?,?)',
            [firstName, lastName, email, phoneNumber, address, categoryID]);
        res.redirect('/clients');
    } catch (error) {
        console.error("Error adding client:", error);
        res.status(500).send("Add failed.");
    }
});

app.post('/products/add', async (req, res) => {
    const { productName, beerType, beerPrice, productInStock, currentlyAvailable } = req.body;
    await db.query('CALL sp_insert_product(?,?,?,?,?)',
        [productName, beerType, beerPrice, productInStock, currentlyAvailable]);
    res.redirect('/products');
});

app.post('/categories/add', async (req, res) => {
    const { categoryName } = req.body;
    await db.query('CALL sp_insert_category(?)', [categoryName]);
    res.redirect('/categories');
});

app.post('/salesorders/add', async (req, res) => {
    const { orderDate, clientID, totalAmount, orderStatus } = req.body;
    await db.query('CALL sp_insert_salesorder(?,?,?,?)',
        [orderDate, clientID, totalAmount, orderStatus]);
    res.redirect('/salesorders');
});

// CREATE Route for OrderItems
app.post('/orderitems/add', async (req, res) => {
    const { orderID, productID, orderQty, unitPrice } = req.body;
    try {
        await db.query('CALL sp_insert_orderitem(?,?,?,?)',
            [orderID, productID, orderQty, unitPrice]);
        res.redirect('/orderitems');
    } catch (error) {
        console.error("Error adding order item:", error);
        res.status(500).send("Add failed. Did you try to add a duplicate product to the same order?");
    }
});

// Utility function to build SET clause dynamically
function buildUpdate(fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return null; 
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const values = Object.values(fields);
    return { setClause, values };
}

// UPDATE Routes

// CLIENTS UPDATE
app.post('/clients/update', async (req, res) => {
    const { clientID, firstName, lastName, email, phoneNumber, address, categoryID } = req.body;

    const updates = {};
    if (firstName?.trim()) updates.firstName = firstName;
    if (lastName?.trim()) updates.lastName = lastName;
    if (email?.trim()) updates.email = email;
    if (phoneNumber?.trim()) updates.phoneNumber = phoneNumber;
    if (address?.trim()) updates.address = address;
    if (categoryID?.trim()) updates.categoryID = categoryID;

    const sql = buildUpdate(updates);
    if (!sql) return res.redirect('/clients');

    await db.query(
        `UPDATE Clients SET ${sql.setClause} WHERE clientID = ?`,
        [...sql.values, clientID]
    );

    res.redirect('/clients');
});

// PRODUCTS UPDATE
app.post('/products/update', async (req, res) => {
    const { productID, productName, beerType, beerPrice, productInStock, currentlyAvailable } = req.body;

    const updates = {};
    if (productName?.trim()) updates.productName = productName;
    if (beerType?.trim()) updates.beerType = beerType;
    if (beerPrice) updates.beerPrice = beerPrice;
    if (productInStock) updates.productInStock = productInStock;
    if (currentlyAvailable) updates.currentlyAvailable = currentlyAvailable;

    const sql = buildUpdate(updates);
    if (!sql) return res.redirect('/products');

    await db.query(
        `UPDATE Products SET ${sql.setClause} WHERE productID = ?`,
        [...sql.values, productID]
    );

    res.redirect('/products');
});

// CATEGORIES UPDATE
app.post('/categories/update', async (req, res) => {
    const { categoryID, categoryName } = req.body;

    const updates = {};
    if (categoryName?.trim()) updates.categoryName = categoryName;

    const sql = buildUpdate(updates);
    if (!sql) return res.redirect('/categories');

    await db.query(
        `UPDATE Categories SET ${sql.setClause} WHERE categoryID = ?`,
        [...sql.values, categoryID]
    );

    res.redirect('/categories');
});

// SALES ORDERS UPDATE
app.post('/salesorders/update', async (req, res) => {
    const { orderID, orderDate, clientID, totalAmount, orderStatus } = req.body;

    const updates = {};
    if (orderDate?.trim()) updates.orderDate = orderDate;
    if (clientID?.trim()) updates.clientID = clientID;
    if (totalAmount) updates.totalAmount = totalAmount;
    if (orderStatus?.trim()) updates.orderStatus = orderStatus;

    const sql = buildUpdate(updates);
    if (!sql) return res.redirect('/salesorders');

    await db.query(
        `UPDATE SalesOrders SET ${sql.setClause} WHERE orderID = ?`,
        [...sql.values, orderID]
    );

    res.redirect('/salesorders');
});

// ORDER ITEMS UPDATE
app.post('/orderitems/update', async (req, res) => {
    const { orderItemID, orderQty, unitPrice } = req.body;

    const updates = {};
    if (orderQty) updates.orderQty = orderQty;
    if (unitPrice) updates.unitPrice = unitPrice;

    const sql = buildUpdate(updates);
    if (!sql) return res.redirect('/orderitems');

    await db.query(
        `UPDATE OrderItems SET ${sql.setClause} WHERE orderItemID = ?`,
        [...sql.values, orderItemID]
    );

    res.redirect('/orderitems');
});

// DELETE Routes
app.post('/clients/delete', async (req, res) => {
    try {
        const clientID = req.body.delete_client_id;
        await db.query('CALL sp_delete_client(?);', [clientID]);
        res.redirect('/clients');
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).send("Delete failed.");
    }
});

app.post('/products/delete', async (req, res) => {
    try {
        const productID = req.body.delete_product_id;
        await db.query('CALL sp_delete_product(?);', [productID]);
        res.redirect('/products');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Delete failed.");
    }
});

app.post('/categories/delete', async (req, res) => {
    try {
        const categoryID = req.body.delete_category_id;
        await db.query('CALL sp_delete_category(?);', [categoryID]);
        res.redirect('/categories');
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).send("Delete failed.");
    }
});

app.post('/salesorders/delete', async (req, res) => {
    try {
        const orderID = req.body.delete_salesorder_id;
        await db.query('CALL sp_delete_salesorder(?);', [orderID]);
        res.redirect('/salesorders');
    } catch (error) {
        console.error("Error deleting sales order:", error);
        res.status(500).send("Delete failed.");
    }
});

app.post('/orderitems/delete', async (req, res) => {
    try {
        const orderItemID = req.body.delete_orderitem_id;
        await db.query('CALL sp_delete_orderitem(?);', [orderItemID]);
        res.redirect('/orderitems');
    } catch (error) {
        console.error("Error deleting order item:", error);
        res.status(500).send("Delete failed.");
    }
});

// ########################################
// ########## LISTENER

app.listen(PORT, function () {
    console.log(`Express started on http://localhost:${PORT}; press Ctrl-C to terminate.`);
});
