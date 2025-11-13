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

// ########################################
// ########## LISTENER

app.listen(PORT, function () {
    console.log(`Express started on http://localhost:${PORT}; press Ctrl-C to terminate.`);
});
