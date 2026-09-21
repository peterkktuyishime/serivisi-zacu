const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ==========================================
// SERVE PUBLIC WEBSITE FILES
// logo.png, images, CSS, JS, etc.
// ==========================================

app.use(express.static(__dirname));

const ordersFile = path.join(__dirname, "orders.json");

// ==========================================
// ADMIN PASSWORD
// Iyi password iva muri Render Environment
// ==========================================

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const adminTokens = new Set();

// ==========================================
// PUBLIC WEBSITE
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "indexog1.html"));
});

// ==========================================
// ORDERS FILE
// ==========================================

if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, "[]", "utf8");
}

function getOrders() {
    try {
        const data = fs.readFileSync(ordersFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function saveOrders(orders) {
    fs.writeFileSync(
        ordersFile,
        JSON.stringify(orders, null, 2),
        "utf8"
    );
}

// ==========================================
// TEST SERVER
// ==========================================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Serivisi Zacu Rwanda backend irakora neza!"
    });
});

// ==========================================
// CUSTOMER ORDERS
// ==========================================

app.post("/api/orders", (req, res) => {

    const {
        name,
        phone,
        service,
        description,
        paymentMethod,
        transactionId
    } = req.body;

    if (!name || !phone || !service) {
        return res.status(400).json({
            success: false,
            message: "Name, phone na service birakenewe."
        });
    }

    const orders = getOrders();

    const newOrder = {
        id: Date.now(),
        name: name,
        phone: phone,
        service: service,
        description: description || "",
        paymentMethod: paymentMethod || "",
        transactionId: transactionId || "",
        date: new Date().toISOString(),
        status: "Pending"
    };

    orders.push(newOrder);

    saveOrders(orders);

    res.json({
        success: true,
        message: "Order yakiriwe neza!",
        order: newOrder
    });
});

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post("/api/admin/login", (req, res) => {

    const password = req.body.password;

    if (!ADMIN_PASSWORD) {

        return res.status(500).json({
            success: false,
            message: "ADMIN_PASSWORD ntabwo yashyizwe kuri server."
        });

    }

    if (password !== ADMIN_PASSWORD) {

        return res.status(401).json({
            success: false,
            message: "Password siyo."
        });

    }

    const token = crypto.randomBytes(32).toString("hex");

    adminTokens.add(token);

    res.setHeader(
        "Set-Cookie",
        "adminToken=" + token +
        "; HttpOnly; SameSite=Strict; Path=/"
    );

    res.json({
        success: true,
        message: "Winjiye muri Admin."
    });
});

// ==========================================
// ADMIN LOGOUT
// ==========================================

app.post("/api/admin/logout", (req, res) => {

    const cookies = req.headers.cookie || "";

    const match = cookies.match(/adminToken=([^;]+)/);

    if (match) {
        adminTokens.delete(match[1]);
    }

    res.setHeader(
        "Set-Cookie",
        "adminToken=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
    );

    res.json({
        success: true,
        message: "Wasohotse muri Admin."
    });
});

// ==========================================
// ADMIN SECURITY
// ==========================================

function requireAdmin(req, res, next) {

    const cookies = req.headers.cookie || "";

    const match = cookies.match(/adminToken=([^;]+)/);

    if (!match || !adminTokens.has(match[1])) {

        return res.status(401).json({
            success: false,
            message: "Ntufite uburenganzira bwo kubona aya makuru."
        });

    }

    next();
}

// ==========================================
// ADMIN PAGE
// ==========================================

app.get("/admin", (req, res) => {

    res.send(`
<!DOCTYPE html>
<html lang="rw">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Admin - Serivisi Zacu Rwanda</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
    background: #f4f6f9;
}

.container {
    max-width: 900px;
    margin: auto;
}

.box {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 3px 15px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}

h1 {
    color: #0b3d91;
}

input {
    width: 100%;
    padding: 13px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 6px;
}

button {
    padding: 11px 18px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: #0b3d91;
    color: white;
    margin: 5px;
}

button:hover {
    opacity: 0.9;
}

.logout,
.delete {
    background: #c62828;
}

#adminArea {
    display: none;
}

#message {
    color: #c62828;
    font-weight: bold;
}

.order {
    border: 1px solid #ddd;
    padding: 15px;
    margin: 12px 0;
    border-radius: 8px;
    background: #fafafa;
}

hr {
    margin: 20px 0;
}

</style>

</head>

<body>

<div class="container">

    <div class="box" id="loginArea">

        <h1>Admin Login</h1>

        <input
            type="password"
            id="password"
            placeholder="Andika password ya Admin"
        >

        <button onclick="login()">
            Injira
        </button>

        <p id="message"></p>

    </div>


    <div class="box" id="adminArea">

        <h1>Serivisi Zacu Rwanda</h1>

        <h2>Admin Dashboard</h2>

        <button
            class="logout"
            onclick="logout()">
            Sohoka
        </button>

        <button onclick="loadOrders()">
            Refresh Orders
        </button>

        <button
            class="delete"
            onclick="clearOrders()">
            Siba Orders Zose
        </button>

        <hr>

        <h2>Orders Zakiriwe</h2>

        <div id="ordersList">
        </div>

    </div>

</div>


<script>

// ==========================================
// LOGIN
// ==========================================

async function login() {

    const password =
        document.getElementById("password").value;

    const response = await fetch(
        "/api/admin/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                password: password
            })
        }
    );

    const data = await response.json();

    if (data.success) {

        document.getElementById(
            "loginArea"
        ).style.display = "none";

        document.getElementById(
            "adminArea"
        ).style.display = "block";

        document.getElementById(
            "message"
        ).textContent = "";

        loadOrders();

    } else {

        document.getElementById(
            "message"
        ).textContent = data.message;

    }
}


// ==========================================
// LOAD ORDERS
// ==========================================

async function loadOrders() {

    const response =
        await fetch("/api/orders");

    if (response.status === 401) {

        document.getElementById(
            "loginArea"
        ).style.display = "block";

        document.getElementById(
            "adminArea"
        ).style.display = "none";

        return;
    }

    const data =
        await response.json();

    const list =
        document.getElementById(
            "ordersList"
        );

    list.innerHTML = "";

    if (
        !data.orders ||
        data.orders.length === 0
    ) {

        list.innerHTML =
            "<p>Nta orders zirahari.</p>";

        return;
    }

    data.orders.forEach(function(order) {

        const div =
            document.createElement("div");

        div.className = "order";

        div.innerHTML =
            "<strong>Izina:</strong> " +
            order.name +
            "<br>" +

            "<strong>Phone:</strong> " +
            order.phone +
            "<br>" +

            "<strong>Service:</strong> " +
            order.service +
            "<br>" +

            "<strong>Description:</strong> " +
            (order.description || "") +
            "<br>" +

            "<strong>Payment:</strong> " +
            (order.paymentMethod || "") +
            "<br>" +

            "<strong>Transaction ID:</strong> " +
            (order.transactionId || "") +
            "<br>" +

            "<strong>Status:</strong> " +
            order.status +
            "<br>" +

            "<strong>Date:</strong> " +
            new Date(
                order.date
            ).toLocaleString() +

            "<br><br>" +

            '<button class="delete" ' +
            'onclick="deleteOrder(' +
            order.id +
            ')">' +
            "Siba" +
            "</button>";

        list.appendChild(div);

    });
}


// ==========================================
// DELETE ONE ORDER
// ==========================================

async function deleteOrder(id) {

    const confirmed =
        confirm(
            "Urashaka gusiba iyi order?"
        );

    if (!confirmed) {
        return;
    }

    const response =
        await fetch(
            "/api/orders/" + id,
            {
                method: "DELETE"
            }
        );

    if (response.ok) {

        loadOrders();

    } else {

        alert(
            "Ntibyashobokye gusiba order."
        );

    }
}


// ==========================================
// DELETE ALL ORDERS
// ==========================================

async function clearOrders() {

    const confirmed =
        confirm(
            "Urashaka gusiba ORDERS ZOSE?"
        );

    if (!confirmed) {
        return;
    }

    const response =
        await fetch(
            "/api/orders",
            {
                method: "DELETE"
            }
        );

    if (response.ok) {

        loadOrders();

    } else {

        alert(
            "Ntibyashobokye gusiba orders."
        );

    }
}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    await fetch(
        "/api/admin/logout",
        {
            method: "POST"
        }
    );

    document.getElementById(
        "adminArea"
    ).style.display = "none";

    document.getElementById(
        "loginArea"
    ).style.display = "block";

    document.getElementById(
        "password"
    ).value = "";

}

</script>

</body>

</html>
    `);

});

// ==========================================
// ADMIN ORDERS
// PROTECTED
// ==========================================

app.get(
    "/api/orders",
    requireAdmin,
    (req, res) => {

        const orders = getOrders();

        res.json({
            success: true,
            orders: orders
        });

    }
);

// ==========================================
// DELETE ONE ORDER
// PROTECTED
// ==========================================

app.delete(
    "/api/orders/:id",
    requireAdmin,
    (req, res) => {

        const id =
            Number(req.params.id);

        let orders =
            getOrders();

        const oldLength =
            orders.length;

        orders =
            orders.filter(
                order => order.id !== id
            );

        if (
            orders.length === oldLength
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Order ntabwo yabonetse."
            });

        }

        saveOrders(orders);

        res.json({
            success: true,
            message:
                "Order yasibwe."
        });

    }
);

// ==========================================
// DELETE ALL ORDERS
// PROTECTED
// ==========================================

app.delete(
    "/api/orders",
    requireAdmin,
    (req, res) => {

        saveOrders([]);

        res.json({
            success: true,
            message:
                "Orders zose zasibwe."
        });

    }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log("");
    console.log(
        "======================================"
    );
    console.log(
        " SERIVISI ZACU RWANDA BACKEND"
    );
    console.log(
        "======================================"
    );
    console.log(
        "Server iri gukora kuri port:"
    );
    console.log(PORT);
    console.log("");

});