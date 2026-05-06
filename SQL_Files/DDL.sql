-- Citation for use of AI Tools:
-- Date: 10/27/2025
-- Prompts used to generate SQL sample data:
-- "Can you give me sample INSERT statements for my project schema with tables:
-- "Categories, Clients, Products, SalesOrders, and OrderItems?
-- "Make the data polite, realistic, and demonstrate foreign key relationships.
-- AI Source URL: https://copilot.microsoft.com/


-- BrewLogic Database DDL Script
-- Group 10: Logical Solutions
-- Charles Davis, Stephan Demmers

SET FOREIGN_KEY_CHECKS=0;
SET AUTOCOMMIT = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS SalesOrders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Clients;
DROP TABLE IF EXISTS Categories;

-- Create new tables
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
INSERT INTO Categories (categoryName) 
VALUES
  ('Consumer'),
  ('Vendor');

INSERT INTO Clients (firstName, lastName, email, phoneNumber, address, categoryID) 
VALUES
  ('Alice', 'Nguyen', 'alice.nguyen@example.com', '541-555-1234', '123 Oak St, Corvallis, OR', 1),
  ('BrewCo', NULL, 'sales@brewco.com', '503-555-9876', '456 Hops Ave, Portland, OR', 2),
  ('Jordan', 'Lee', 'jordan.lee@example.com', '541-555-5678', '789 Maple Rd, Eugene, OR', 1);

INSERT INTO Products (productName, beerType, beerPrice, productInStock, currentlyAvailable) 
VALUES
  ('Sunburst IPA', 'IPA', 5.99, 120, TRUE),
  ('Midnight Stout', 'Stout', 6.49, 80, TRUE),
  ('Citrus Wheat', 'Wheat', 5.49, 150, TRUE);

INSERT INTO SalesOrders (orderDate, clientID, totalAmount, orderStatus) 
VALUES
  ('2025-10-01', 1, 17.97, 'Completed'),
  ('2025-10-03', 2, 324.50, 'Shipped'),
  ('2025-10-05', 3, 11.98, 'Pending');

INSERT INTO OrderItems (orderID, productID, orderQty, unitPrice) VALUES
(1, 1, 3, 5.99),
(2, 2, 50, 6.49),
(3, 3, 2, 5.99);


SET FOREIGN_KEY_CHECKS=1;
COMMIT;
