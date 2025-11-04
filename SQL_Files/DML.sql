-- BrewLogic Database DML Script
-- Group 10: Logical Solutions
-- Charles Davis, Stephan Demmers
-- Description: This file contains the Data Manipulation Language (DML) queries
-- for the BrewLogic web application.
-- A colon (:) is used to denote variables that will have data
-- passed from the backend (:firstNameInput, :clientID_selected, etc.).
--

-- ---------------------------------------------------------------------
-- CRUD operations for the Categories table
-- ---------------------------------------------------------------------

-- Get all categories (to populate lists and dropdowns)
SELECT categoryID, categoryName FROM Categories
ORDER BY categoryName;

-- GET (by id)
SELECT categoryID, categoryName
FROM Categories
WHERE categoryID = :categoryID;

-- Add a new category
INSERT INTO Categories (categoryName)
VALUES :categoryNameInput;

-- Update an existing category
UPDATE Categories
SET categoryName = :categoryNameInput
WHERE categoryID = :categoryID_from_form;

-- Delete a category
-- ON DELETE CASCADE for Clients delete all clients in that category.
DELETE FROM Categories
WHERE categoryID = :categoryID_selected;


-- ---------------------------------------------------------------------
-- CRUD operations for the Products table
-- ---------------------------------------------------------------------

-- Get all products for the main "View Products" page
SELECT productID, productName, beerType, beerPrice, productInStock, currentlyAvailable
FROM Products
ORDER BY productName;


-- Get all *available* products 
SELECT productID, productName, beerPrice
FROM Products
WHERE currentlyAvailable = TRUE
ORDER BY productName;

-- Get a single product's data (to populate an "Update Product" form)
SELECT productID, productName, beerType, beerPrice, productInStock, currentlyAvailable
FROM Products
WHERE productID = :productID_selected_from_list;

-- Add a new product
INSERT INTO Products (productName, beerType, beerPrice, productInStock, currentlyAvailable)
VALUES (:productNameInput, :beerTypeInput, :priceInput, :stockInput, :availableInput);

-- Update an existing product
UPDATE Products
SET
    productName = :productNameInput,
    beerType = :beerTypeInput,
    beerPrice = :priceInput,
    productInStock = :stockInput,
    currentlyAvailable = :availableInput
WHERE
    productID = :productID_from_form;

-- Delete a product
-- Note: ON DELETE CASCADE for OrderItems will remove the product from all order histories.
DELETE FROM Products
WHERE productID = :productID_selected;


-- ---------------------------------------------------------------------
-- CRUD operations for the Clients table
-- ---------------------------------------------------------------------

-- Get all clients (with their category name)
SELECT
    Clients.clientID,
    Clients.firstName,
    Clients.lastName,
    Clients.email,
    Clients.phoneNumber,
    Clients.address,
    Categories.categoryName
FROM Clients
INNER JOIN Categories ON Clients.categoryID = Categories.categoryID
ORDER BY Clients.lastName, Clients.firstName;

-- Get all clients (to populate dropdown when creating a new order)
SELECT clientID, CONCAT(firstName, ' ', lastName, ' (', email, ')') AS clientName
FROM Clients
ORDER BY lastName, firstName;

-- Get a single client's data (to populate an "Update Client")
SELECT clientID, firstName, lastName, email, phoneNumber, address, categoryID
FROM Clients
WHERE clientID = :clientID_selected_from_list;

-- Add a new client
INSERT INTO Clients (firstName, lastName, email, phoneNumber, address, categoryID)
VALUES (
    :firstNameInput,
    :lastNameInput,
    :emailInput,
    :phoneInput,
    :addressInput,
    :categoryID_from_dropdown
);

-- Update an existing client
UPDATE Clients
SET
    firstName = :firstNameInput,
    lastName = :lastNameInput,
    email = :emailInput,
    phoneNumber = :phoneInput,
    address = :addressInput,
    categoryID = :categoryID_from_dropdown
WHERE clientID = :clientID_from_form;

-- Delete a client
-- Note: ON DELETE CASCADE for SalesOrders will delete all their sales orders and associated order items.
DELETE FROM Clients
WHERE clientID = :clientID_selected;


-- ---------------------------------------------------------------------
-- CRUD operations for SalesOrders and OrderItems
-- ---------------------------------------------------------------------

-- Get all sales orders (with client info) for the "View Orders"
SELECT
    SalesOrders.orderID,
    SalesOrders.orderDate,
    CONCAT(Clients.firstName, ' ', Clients.lastName) AS clientName,
    Clients.email,
    SalesOrders.totalAmount,
    SalesOrders.orderStatus
FROM SalesOrders
INNER JOIN Clients ON SalesOrders.clientID = Clients.clientID
ORDER BY SalesOrders.orderDate DESC;

-- === Create a New Order  ===

-- 1. Add the main SalesOrders record.
-- The totalAmount is passed by the backend after calculating from the cart.
INSERT INTO SalesOrders (orderDate, clientID, totalAmount, orderStatus)
VALUES (
    :orderDateInput,
    :clientID_from_dropdown,
    :totalAmount_calculated,
    :orderStatusInput
);

-- 2. Get the new orderID 
SELECT LAST_INSERT_ID() AS newOrderID;

-- 3. Add items to the OrderItems table
-- The :orderID_from_last_insert comes from the query above.
-- The :unitPrice is the snapshot price at time of sale.
INSERT INTO OrderItems (orderID, productID, orderQty, unitPrice)
VALUES (
    :orderID_from_last_insert,
    :productID_from_cart_item,
    :quantity_from_cart_item,
    :price_from_cart_item
);

-- === View a Single Order's Details ===

-- 1. Get the main order and client details
SELECT
    SalesOrders.orderID,
    SalesOrders.orderDate,
    SalesOrders.totalAmount,
    SalesOrders.orderStatus,
    Clients.firstName,
    Clients.lastName,
    Clients.email,
    Clients.phoneNumber,
    Clients.address
FROM SalesOrders
INNER JOIN Clients ON SalesOrders.clientID = Clients.clientID
WHERE SalesOrders.orderID = :orderID_selected;

-- 2. Get the line items for that order (details)
SELECT
    OrderItems.orderItemID,
    Products.productName,
    Products.beerType,
    OrderItems.orderQty,
    OrderItems.unitPrice,
    OrderItems.lineTotal
FROM OrderItems
INNER JOIN Products ON OrderItems.productID = Products.productID
WHERE OrderItems.orderID = :orderID_selected;

-- === Update an Order ===

-- Update an order's status
UPDATE SalesOrders
SET orderStatus = :newOrderStatus_from_dropdown
WHERE orderID = :orderID_from_form;

-- Update the totalAmount 
UPDATE SalesOrders
SET totalAmount = :new_calculated_total
WHERE orderID = :orderID_from_form;

-- Delete an order
-- Note: ON DELETE CASCADE for OrderItems will delete all associated line items.
DELETE FROM SalesOrders
WHERE orderID = :orderID_selected;


-- ---------------------------------------------------------------------
-- MANAGING ORDER ITEMS 
-- ---------------------------------------------------------------------

-- LIST items for an order
SELECT OrderItems.orderItemID, OrderItems.orderID, OrderItems.productID, Products.productName, OrderItems.orderQty, OrderItems.unitPrice, OrderItems.lineTotal
FROM OrderItems 
JOIN Products ON Products.productID = OrderItems.productID
WHERE OrderItems.orderID = :orderID
ORDER BY OrderItems.orderItemID;

-- Add a new item to an existing order
INSERT INTO OrderItems (orderID, productID, orderQty, unitPrice)
VALUES (
    :orderID_from_form,
    :productID_from_dropdown,
    :quantityInput,
    :priceInput
); 
-- After this, you should re-calculate and UPDATE the SalesOrders.totalAmount

-- Update an item's quantity or price in an order
UPDATE OrderItems
SET orderQty = :newQuantityInput, unitPrice = :newPriceInput
WHERE orderItemID = :orderItemID_from_form;
-- After this, you should re-calculate and UPDATE the SalesOrders.totalAmount

-- Remove an item from an order
DELETE FROM OrderItems
WHERE orderItemID = :orderItemID_to_delete;
-- After this, you should re-calculate and UPDATE the SalesOrders.totalAmount
