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
        },
        formatMoney: function (value) {
            if (value === null || value === undefined || value === "") return "$0.00";
            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) return value;
            return `$${numericValue.toFixed(2)}`;
        },
        navActive: function (target, current) {
            return target === current ? "is-active" : "";
        }
    }
}));

app.set('view engine', '.hbs');

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
});

const DB_UNAVAILABLE_CODES = new Set([
    'ECONNREFUSED',
    'ENOTFOUND',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST'
]);

function isDatabaseUnavailable(error) {
    return error && DB_UNAVAILABLE_CODES.has(error.code);
}

function renderDatabaseFallback(res, view, fallbackData, error) {
    console.error(`Database unavailable while rendering ${view}: ${error.code || 'UNKNOWN'} ${error.message}`);
    return res.status(200).render(view, {
        ...fallbackData,
        databaseError: 'Database connection unavailable. Showing an empty workspace until MySQL is configured and reachable.'
    });
}

function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
}

function addStringUpdate(updates, key, value) {
    if (typeof value === 'string' && value.trim() !== '') {
        updates[key] = value.trim();
    }
}

function addProvidedUpdate(updates, key, value) {
    if (hasValue(value)) {
        updates[key] = value;
    }
}

async function recalculateOrderTotal(orderID) {
    await db.query(`
        UPDATE SalesOrders
        SET totalAmount = COALESCE(
            (SELECT SUM(orderQty * unitPrice) FROM OrderItems WHERE orderID = ?),
            0.00
        )
        WHERE orderID = ?;
    `, [orderID, orderID]);
}

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
        const query1 = `
            SELECT
                Clients.clientID,
                Clients.firstName,
                Clients.lastName,
                Clients.email,
                Clients.phoneNumber,
                Clients.address,
                Clients.categoryID,
                Categories.categoryName
            FROM Clients
            LEFT JOIN Categories ON Clients.categoryID = Categories.categoryID
            ORDER BY Clients.lastName, Clients.firstName;
        `;
        const query2 = `SELECT * FROM Categories ORDER BY categoryName;`;
        const [clients] = await db.query(query1);
        const [categories] = await db.query(query2);

        res.render('brewlogic-clients', { clients: clients, categories: categories });
    } catch (error) {
        if (isDatabaseUnavailable(error)) {
            return renderDatabaseFallback(res, 'brewlogic-clients', { clients: [], categories: [] }, error);
        }
        console.error('Error fetching clients:', error);
        res.status(500).send('An error occurred while retrieving client data.');
    }
});

app.get('/products', async function (req, res) {
    try {
        const query1 = `SELECT * FROM Products ORDER BY productName;`;
        const [products] = await db.query(query1);

        res.render('brewlogic-products', { products: products });
    } catch (error) {
        if (isDatabaseUnavailable(error)) {
            return renderDatabaseFallback(res, 'brewlogic-products', { products: [] }, error);
        }
        console.error('Error fetching products:', error);
        res.status(500).send('An error occurred while retrieving product data.');
    }
});

app.get('/categories', async function (req, res) {
    try {
        const query1 = `SELECT * FROM Categories ORDER BY categoryName;`;
        const [categories] = await db.query(query1);

        res.render('brewlogic-categories', { categories: categories });
    } catch (error) {
        if (isDatabaseUnavailable(error)) {
            return renderDatabaseFallback(res, 'brewlogic-categories', { categories: [] }, error);
        }
        console.error('Error fetching categories:', error);
        res.status(500).send('An error occurred while retrieving category data.');
    }
});

app.get('/salesorders', async function (req, res) {
    try {
        const query1 = `
            SELECT
                SalesOrders.orderID,
                SalesOrders.orderDate,
                SalesOrders.clientID,
                CONCAT_WS(' ', Clients.firstName, Clients.lastName) AS clientName,
                Clients.email,
                SalesOrders.totalAmount,
                SalesOrders.orderStatus
            FROM SalesOrders
            INNER JOIN Clients ON SalesOrders.clientID = Clients.clientID
            ORDER BY SalesOrders.orderDate DESC, SalesOrders.orderID DESC;
        `;
        const query2 = `SELECT * FROM Clients ORDER BY lastName, firstName;`;
        const [salesorders] = await db.query(query1);
        const [clients] = await db.query(query2);

        res.render('brewlogic-salesorders', { salesorders: salesorders, clients: clients });
    } catch (error) {
        if (isDatabaseUnavailable(error)) {
            return renderDatabaseFallback(res, 'brewlogic-salesorders', { salesorders: [], clients: [] }, error);
        }
        console.error('Error fetching sales orders:', error);
        res.status(500).send('An error occurred while retrieving sales order data.');
    }
});

app.get('/orderitems', async function (req, res) {
    try {
        const query1 = `
            SELECT
                OrderItems.orderItemID,
                OrderItems.orderID,
                OrderItems.productID,
                Products.productName,
                Products.beerType,
                OrderItems.orderQty,
                OrderItems.unitPrice,
                OrderItems.lineTotal
            FROM OrderItems
            INNER JOIN Products ON OrderItems.productID = Products.productID
            ORDER BY OrderItems.orderID, OrderItems.orderItemID;
        `;
        const query2 = `SELECT * FROM Products ORDER BY productName;`;
        const query3 = `
            SELECT
                SalesOrders.orderID,
                SalesOrders.orderDate,
                SalesOrders.totalAmount,
                CONCAT_WS(' ', Clients.firstName, Clients.lastName) AS clientName
            FROM SalesOrders
            INNER JOIN Clients ON SalesOrders.clientID = Clients.clientID
            ORDER BY SalesOrders.orderDate DESC, SalesOrders.orderID DESC;
        `;
        const [orderitems] = await db.query(query1);
        const [products] = await db.query(query2);
        const [salesorders] = await db.query(query3);

        res.render('brewlogic-orderitems', {
            orderitems: orderitems,
            products: products,
            salesorders: salesorders
        });
    } catch (error) {
        if (isDatabaseUnavailable(error)) {
            return renderDatabaseFallback(res, 'brewlogic-orderitems', { orderitems: [], products: [], salesorders: [] }, error);
        }
        console.error('Error fetching order items:', error);
        res.status(500).send('An error occurred while retrieving order item data.');
    }
});

// RESET Database Route
app.post('/reset', async function (req, res) {
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
    try {
        const { productName, beerType, beerPrice, productInStock, currentlyAvailable } = req.body;
        await db.query('CALL sp_insert_product(?,?,?,?,?)',
            [productName, beerType, beerPrice, productInStock, currentlyAvailable]);
        res.redirect('/products');
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Add failed.");
    }
});

app.post('/categories/add', async (req, res) => {
    try {
        const { categoryName } = req.body;
        await db.query('CALL sp_insert_category(?)', [categoryName]);
        res.redirect('/categories');
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).send("Add failed.");
    }
});

app.post('/salesorders/add', async (req, res) => {
    try {
        const { orderDate, clientID, totalAmount, orderStatus } = req.body;
        await db.query('CALL sp_insert_salesorder(?,?,?,?)',
            [orderDate, clientID, totalAmount, orderStatus]);
        res.redirect('/salesorders');
    } catch (error) {
        console.error("Error adding sales order:", error);
        res.status(500).send("Add failed.");
    }
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
    addStringUpdate(updates, 'firstName', firstName);
    addStringUpdate(updates, 'lastName', lastName);
    addStringUpdate(updates, 'email', email);
    addStringUpdate(updates, 'phoneNumber', phoneNumber);
    addStringUpdate(updates, 'address', address);
    addProvidedUpdate(updates, 'categoryID', categoryID);

    try {
        const sql = buildUpdate(updates);
        if (!sql) return res.redirect('/clients');

        await db.query(
            `UPDATE Clients SET ${sql.setClause} WHERE clientID = ?`,
            [...sql.values, clientID]
        );

        res.redirect('/clients');
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).send("Update failed.");
    }
});

// PRODUCTS UPDATE
app.post('/products/update', async (req, res) => {
    const { productID, productName, beerType, beerPrice, productInStock, currentlyAvailable } = req.body;

    const updates = {};
    addStringUpdate(updates, 'productName', productName);
    addStringUpdate(updates, 'beerType', beerType);
    addProvidedUpdate(updates, 'beerPrice', beerPrice);
    addProvidedUpdate(updates, 'productInStock', productInStock);
    addProvidedUpdate(updates, 'currentlyAvailable', currentlyAvailable);

    try {
        const sql = buildUpdate(updates);
        if (!sql) return res.redirect('/products');

        await db.query(
            `UPDATE Products SET ${sql.setClause} WHERE productID = ?`,
            [...sql.values, productID]
        );

        res.redirect('/products');
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("Update failed.");
    }
});

// CATEGORIES UPDATE
app.post('/categories/update', async (req, res) => {
    const { categoryID, categoryName } = req.body;

    const updates = {};
    addStringUpdate(updates, 'categoryName', categoryName);

    try {
        const sql = buildUpdate(updates);
        if (!sql) return res.redirect('/categories');

        await db.query(
            `UPDATE Categories SET ${sql.setClause} WHERE categoryID = ?`,
            [...sql.values, categoryID]
        );

        res.redirect('/categories');
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).send("Update failed.");
    }
});

// SALES ORDERS UPDATE
app.post('/salesorders/update', async (req, res) => {
    const { orderID, orderDate, clientID, totalAmount, orderStatus } = req.body;

    const updates = {};
    addStringUpdate(updates, 'orderDate', orderDate);
    addProvidedUpdate(updates, 'clientID', clientID);
    addProvidedUpdate(updates, 'totalAmount', totalAmount);
    addStringUpdate(updates, 'orderStatus', orderStatus);

    try {
        const sql = buildUpdate(updates);
        if (!sql) return res.redirect('/salesorders');

        await db.query(
            `UPDATE SalesOrders SET ${sql.setClause} WHERE orderID = ?`,
            [...sql.values, orderID]
        );

        res.redirect('/salesorders');
    } catch (error) {
        console.error("Error updating sales order:", error);
        res.status(500).send("Update failed.");
    }
});

// ORDER ITEMS UPDATE
app.post('/orderitems/update', async (req, res) => {
    const { orderItemID, orderQty, unitPrice } = req.body;

    const updates = {};
    addProvidedUpdate(updates, 'orderQty', orderQty);
    addProvidedUpdate(updates, 'unitPrice', unitPrice);

    try {
        const sql = buildUpdate(updates);
        if (!sql) return res.redirect('/orderitems');

        await db.query(
            `UPDATE OrderItems SET ${sql.setClause} WHERE orderItemID = ?`,
            [...sql.values, orderItemID]
        );

        const [[orderItem]] = await db.query(
            'SELECT orderID FROM OrderItems WHERE orderItemID = ?',
            [orderItemID]
        );
        if (orderItem?.orderID) {
            await recalculateOrderTotal(orderItem.orderID);
        }

        res.redirect('/orderitems');
    } catch (error) {
        console.error("Error updating order item:", error);
        res.status(500).send("Update failed.");
    }
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

        const [[orderItem]] = await db.query(
            'SELECT orderID FROM OrderItems WHERE orderItemID = ?',
            [orderItemID]
        );

        await db.query('CALL sp_delete_orderitem(?);', [orderItemID]);

        if (orderItem?.orderID) {
            await recalculateOrderTotal(orderItem.orderID);
        }
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
