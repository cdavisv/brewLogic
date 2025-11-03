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
app.engine('.hbs', engine({ extname: '.hbs' }));
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
        const [clients] = await db.query(query1);

        res.render('brewlogic-clients', { clients: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).send('An error occurred while retrieving client data.');
    }
});

// ########################################
// ########## LISTENER

app.listen(PORT, function () {
    console.log(`Express started on http://localhost:${PORT}; press Ctrl-C to terminate.`);
});
