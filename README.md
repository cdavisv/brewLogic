# brewLogic

## Citation for Adapted Starter Code

- **Date Retrieved**: 11/03/2025  
- **Source Title**: Exploration: Web Application Technology
- **Type**: Source code (CS340 starter app)  
- **Author**: Oregon State University CS340 Instructional Team  
- **Source URL**: [https://canvas.oregonstate.edu/courses/2017561/pages/exploration-web-application-technology-2?module_item_id=25645131](https://canvas.oregonstate.edu/courses/2017561/pages/exploration-web-application-technology-2?module_item_id=25645131)  

# BrewLogic

BrewLogic is a full-stack web application designed to manage brewery sales operations, including products, clients, categories, sales orders, and order items. The application demonstrates a complete CRUD workflow backed by a relational database with enforced referential integrity.

This project was built as a database-driven web application using Node.js, Express, Handlebars, and MySQL, with a strong emphasis on clean schema design, foreign keys, cascading deletes, and stored procedures.

---

## Features

- Full CRUD operations for all core entities
  - Categories
  - Clients
  - Products
  - Sales Orders
  - Order Items
- Relational database design with enforced foreign key constraints
- Cascading deletes to preserve data consistency
- Generated columns for computed values such as line totals
- Stored procedures for inserts, updates, deletes, and full database reset
- Dynamic forms with prefilled update fields
- Server-side rendering using Handlebars
- Clean separation of concerns between routes, views, and database logic

---

## Tech Stack

### Backend
- Node.js
- Express.js
- MySQL

### Frontend
- Handlebars (server-side templating)
- HTML5
- CSS

### Database
- MySQL
- SQL DDL and DML scripts
- Stored procedures for core operations

---

## Database Schema Overview

The database consists of five primary tables:

- **Categories**
  - Groups clients into logical categories such as Consumer or Vendor

- **Clients**
  - Stores customer or vendor information
  - Linked to Categories via foreign key

- **Products**
  - Brewery products including beer type, price, stock level, and availability

- **SalesOrders**
  - Represents individual orders placed by clients

- **OrderItems**
  - Line items within a sales order
  - Enforces a unique product per order constraint
  - Automatically calculates line totals

Foreign key constraints and cascading deletes ensure referential integrity across all tables.

---

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- MySQL (v8.0 recommended)
- npm

---

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/brewlogic.git
cd brewlogic
```

2. Install dependencies

```bash
npm install
```

3. Create a MySQL database

```bash
CREATE DATABASE brewlogic;
```

4. Run the database setup scripts in this order:

* DDL.sql – creates tables and constraints

* DML.sql – provides sample queries and CRUD logic

* PL.sql – creates stored procedures and reset functionality

5. Configure database connection
Create a .env file or update your database config with:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=brewlogic
```

### Running the Application
```bash
npm start
```

The application will start on:
```
http://localhost:3000
```

### Application Pages

* Home

    * Landing page introducing BrewLogic

* Categories

    * Manage client categories

* Clients

    * Create, update, and delete customers or vendors

* Products

    * Manage brewery products and inventory

* Sales Orders

    * Create and track orders linked to clients

* Order Items

    * Add, update, or remove items within existing orders

### Stored Procedures

BrewLogic includes stored procedures for:

* Inserting, updating, and deleting records for all entities

* Preventing duplicate products in the same order

* Automatically recalculating order totals

* Fully resetting the database schema and sample data

These procedures enforce business logic at the database layer and improve data integrity.

### License

This project is licensed under the BSD 3-Clause License.

BSD 3-Clause License

Copyright (c) 2025, Charles Davis, Stephan Demmers
All rights reserved.


See the LICENSE file for full details.

Author

Charles Davis
Stephan Demmers

Built as part of a database-driven web application project demonstrating full CRUD functionality, relational modeling, and backend integration.

Notes

This project is intended for educational and portfolio use. It is not production-hardened and does not include authentication or authorization.