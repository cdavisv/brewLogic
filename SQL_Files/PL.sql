-- Stored procedures for BrewLogic project
-- Group 10: Logical Solutions
-- Charles Davis, Stephan Demmers

--Citation for use of AI:
-- Date: 11/17/2025
-- Summary of prompts used to generate PL.sql:
-- "Create a SQL stored procedure to reset the database schema for a brewlogic, including 
-- [insert brewlogic DDL.sql here] for creating tables and inserting sample data. Also, 
-- create stored procedures to delete entries from each table, ensuring referential integrity,
-- and make sure to include DROP PROCEDURE statements for each."
-- AI SOURCE URL: https://copilot.microsoft.com/

-- Drop and recreate RESET procedure
DROP PROCEDURE IF EXISTS sp_brewlogic_reset;
DELIMITER //

CREATE PROCEDURE sp_brewlogic_reset()
BEGIN
    SET FOREIGN_KEY_CHECKS=0;

    -- Drop tables
    DROP TABLE IF EXISTS OrderItems;
    DROP TABLE IF EXISTS SalesOrders;
    DROP TABLE IF EXISTS Products;
    DROP TABLE IF EXISTS Clients;
    DROP TABLE IF EXISTS Categories;

    -- Recreate tables
    CREATE TABLE Categories (
        categoryID INT PRIMARY KEY AUTO_INCREMENT,
        categoryName VARCHAR(50) NOT NULL
    );

    CREATE TABLE Clients (
        clientID INT PRIMARY KEY AUTO_INCREMENT,
        firstName VARCHAR(50),
        lastName VARCHAR(50),
        email VARCHAR(100) NOT NULL UNIQUE,
        phoneNumber VARCHAR(15),
        address VARCHAR(255),
        categoryID INT,
        FOREIGN KEY (categoryID) REFERENCES Categories(categoryID)
            ON DELETE CASCADE
    );

    CREATE TABLE Products (
        productID INT PRIMARY KEY AUTO_INCREMENT,
        productName VARCHAR(100) NOT NULL,
        beerType VARCHAR(50) NOT NULL,
        beerPrice DECIMAL(9,2) NOT NULL,
        productInStock INT NOT NULL,
        currentlyAvailable BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE SalesOrders (
        orderID INT PRIMARY KEY AUTO_INCREMENT,
        orderDate DATE NOT NULL,
        clientID INT NOT NULL,
        totalAmount DECIMAL(18,2) NOT NULL,
        orderStatus VARCHAR(50) NOT NULL,
        FOREIGN KEY (clientID) REFERENCES Clients(clientID)
            ON DELETE CASCADE
    );

    CREATE TABLE OrderItems (
        orderItemID INT PRIMARY KEY AUTO_INCREMENT,
        orderID INT NOT NULL,
        productID INT NOT NULL,
        orderQty INT NOT NULL,
        unitPrice DECIMAL(9,2) NOT NULL,
        lineTotal DECIMAL(18,2) AS (orderQty * unitPrice),
        UNIQUE (orderID, productID),
        FOREIGN KEY (orderID) REFERENCES SalesOrders(orderID)
            ON DELETE CASCADE,
        FOREIGN KEY (productID) REFERENCES Products(productID)
            ON DELETE CASCADE
    );

    -- Insert sample data
    INSERT INTO Categories (categoryName) VALUES ('Consumer'), ('Vendor');

    INSERT INTO Clients (firstName, lastName, email, phoneNumber, address, categoryID) VALUES
      ('Alice', 'Nguyen', 'alice.nguyen@example.com', '541-555-1234', '123 Oak St, Corvallis, OR', 1),
      ('BrewCo', NULL, 'sales@brewco.com', '503-555-9876', '456 Hops Ave, Portland, OR', 2),
      ('Jordan', 'Lee', 'jordan.lee@example.com', '541-555-5678', '789 Maple Rd, Eugene, OR', 1);

    INSERT INTO Products (productName, beerType, beerPrice, productInStock, currentlyAvailable) VALUES
      ('Sunburst IPA', 'IPA', 5.99, 120, TRUE),
      ('Midnight Stout', 'Stout', 6.49, 80, TRUE),
      ('Citrus Wheat', 'Wheat', 5.49, 150, TRUE);

    INSERT INTO SalesOrders (orderDate, clientID, totalAmount, orderStatus) VALUES
      ('2025-10-01', 1, 17.97, 'Completed'),
      ('2025-10-03', 2, 324.50, 'Shipped'),
      ('2025-10-05', 3, 11.98, 'Pending');

    INSERT INTO OrderItems (orderID, productID, orderQty, unitPrice, lineTotal) VALUES
      (1, 1, 3, 5.99, 17.97),
      (2, 2, 50, 6.49, 324.50),
      (3, 3, 2, 5.99, 11.98);

    SET FOREIGN_KEY_CHECKS=1;
END //
-- Insert procedures for all entities
DROP PROCEDURE IF EXISTS sp_insert_client;
CREATE PROCEDURE sp_insert_client(
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_phoneNumber VARCHAR(15),
    IN p_address VARCHAR(255),
    IN p_categoryID INT
)
BEGIN
    INSERT INTO Clients (firstName, lastName, email, phoneNumber, address, categoryID)
    VALUES (p_firstName, p_lastName, p_email, p_phoneNumber, p_address, p_categoryID);
END //

DROP PROCEDURE IF EXISTS sp_insert_category;
CREATE PROCEDURE sp_insert_category(
    IN p_categoryName VARCHAR(50)
)
BEGIN
    INSERT INTO Categories (categoryName)
    VALUES (p_categoryName);
END //

DROP PROCEDURE IF EXISTS sp_insert_product;
CREATE PROCEDURE sp_insert_product(
    IN p_productName VARCHAR(100),
    IN p_beerType VARCHAR(50),
    IN p_beerPrice DECIMAL(9,2),
    IN p_productInStock INT,
    IN p_currentlyAvailable BOOLEAN
)
BEGIN
    INSERT INTO Products (productName, beerType, beerPrice, productInStock, currentlyAvailable)
    VALUES (p_productName, p_beerType, p_beerPrice, p_productInStock, p_currentlyAvailable);
END //

DROP PROCEDURE IF EXISTS sp_insert_salesorder;
CREATE PROCEDURE sp_insert_salesorder(
    IN p_orderDate DATE,
    IN p_clientID INT,
    IN p_totalAmount DECIMAL(18,2),
    IN p_orderStatus VARCHAR(50)
)
BEGIN
    INSERT INTO SalesOrders (orderDate, clientID, totalAmount, orderStatus)
    VALUES (p_orderDate, p_clientID, p_totalAmount, p_orderStatus);
END //

DROP PROCEDURE IF EXISTS sp_insert_orderitem;
CREATE PROCEDURE sp_insert_orderitem(
    IN p_orderID INT,
    IN p_productID INT,
    IN p_orderQty INT,
    IN p_unitPrice DECIMAL(9,2)
)
BEGIN
    -- Prevent duplicate product in the same order
    IF EXISTS (
        SELECT 1
        FROM OrderItems
        WHERE orderID = p_orderID
          AND productID = p_productID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate product for this order. Use Update instead.';
    ELSE
        -- Insert new order item
        INSERT INTO OrderItems (orderID, productID, orderQty, unitPrice)
        VALUES (p_orderID, p_productID, p_orderQty, p_unitPrice);

        -- Recalculate SalesOrder total
        UPDATE SalesOrders
        SET totalAmount = (
            SELECT SUM(orderQty * unitPrice)
            FROM OrderItems
            WHERE orderID = p_orderID
        )
        WHERE orderID = p_orderID;
    END IF;
END //
--Update procedures for all entities
DROP PROCEDURE IF EXISTS sp_update_client;
CREATE PROCEDURE sp_update_client(
    IN p_clientID INT,
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_phoneNumber VARCHAR(15),
    IN p_address VARCHAR(255),
    IN p_categoryID INT
)
BEGIN
    UPDATE Clients
    SET firstName = p_firstName,
        lastName = p_lastName,
        email = p_email,
        phoneNumber = p_phoneNumber,
        address = p_address,
        categoryID = p_categoryID
    WHERE clientID = p_clientID;
END //

DROP PROCEDURE IF EXISTS sp_update_category;
CREATE PROCEDURE sp_update_category(
    IN p_categoryID INT,
    IN p_categoryName VARCHAR(50)
)
BEGIN
    UPDATE Categories
    SET categoryName = p_categoryName
    WHERE categoryID = p_categoryID;
END //

DROP PROCEDURE IF EXISTS sp_update_product;
CREATE PROCEDURE sp_update_product(
    IN p_productID INT,
    IN p_productName VARCHAR(100),
    IN p_beerType VARCHAR(50),
    IN p_beerPrice DECIMAL(9,2),
    IN p_productInStock INT,
    IN p_currentlyAvailable BOOLEAN
)
BEGIN
    UPDATE Products
    SET productName = p_productName,
        beerType = p_beerType,
        beerPrice = p_beerPrice,
        productInStock = p_productInStock,
        currentlyAvailable = p_currentlyAvailable
    WHERE productID = p_productID;
END //

DROP PROCEDURE IF EXISTS sp_update_salesorder;
CREATE PROCEDURE sp_update_salesorder(
    IN p_orderID INT,
    IN p_orderDate DATE,
    IN p_clientID INT,
    IN p_totalAmount DECIMAL(18,2),
    IN p_orderStatus VARCHAR(50)
)
BEGIN
    UPDATE SalesOrders
    SET orderDate = p_orderDate,
        clientID = p_clientID,
        totalAmount = p_totalAmount,
        orderStatus = p_orderStatus
    WHERE orderID = p_orderID;
END //

DROP PROCEDURE IF EXISTS sp_update_orderitem;
CREATE PROCEDURE sp_update_orderitem(
    IN p_orderItemID INT,
    IN p_orderQty INT,
    IN p_unitPrice DECIMAL(9,2)
)
BEGIN
    UPDATE OrderItems
    SET orderQty = p_orderQty,
        unitPrice = p_unitPrice
    WHERE orderItemID = p_orderItemID;

    -- Recalculate SalesOrder total
    UPDATE SalesOrders
    SET totalAmount = (
        SELECT SUM(orderQty * unitPrice)
        FROM OrderItems
        WHERE orderID = (
            SELECT orderID FROM OrderItems WHERE orderItemID = p_orderItemID
        )
    )
    WHERE orderID = (
        SELECT orderID FROM OrderItems WHERE orderItemID = p_orderItemID
    );
END //
-- DELETE procedures for all entities
DROP PROCEDURE IF EXISTS sp_delete_client;
CREATE PROCEDURE sp_delete_client(IN p_clientID INT)
BEGIN
    DELETE FROM Clients WHERE clientID = p_clientID;
END //

DROP PROCEDURE IF EXISTS sp_delete_product;
CREATE PROCEDURE sp_delete_product(IN p_productID INT)
BEGIN
    DELETE FROM Products WHERE productID = p_productID;
END //

DROP PROCEDURE IF EXISTS sp_delete_category;
CREATE PROCEDURE sp_delete_category(IN p_categoryID INT)
BEGIN
    DELETE FROM Categories WHERE categoryID = p_categoryID;
END //

DROP PROCEDURE IF EXISTS sp_delete_salesorder;
CREATE PROCEDURE sp_delete_salesorder(IN p_orderID INT)
BEGIN
    DELETE FROM SalesOrders WHERE orderID = p_orderID;
END //

DROP PROCEDURE IF EXISTS sp_delete_orderitem;
CREATE PROCEDURE sp_delete_orderitem(IN p_orderItemID INT)
BEGIN
    DELETE FROM OrderItems WHERE orderItemID = p_orderItemID;
END //

DELIMITER ;
