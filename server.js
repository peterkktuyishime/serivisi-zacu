const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Gufungura website iyo umuntu ageze kuri /
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "indexog1.html"));
});

const ordersFile = path.join(__dirname, "orders.json");

// Gukora orders.json niba itarabaho
if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, "[]", "utf8");
}

// Kubona orders
function getOrders() {
    try {
        const data = fs.readFileSync(ordersFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Kubika orders
function saveOrders(orders) {
    fs.writeFileSync(
        ordersFile,
        JSON.stringify(orders, null, 2),
        "utf8"
    );
}

// Test ya server
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Serivisi Zacu Rwanda backend irakora neza!"
    });
});

// Customer yohereza order
app.post("/api/orders", (req, res) => {
    const { name, phone, service, description } = req.body;

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

// Admin abona orders zose
app.get("/api/orders", (req, res) => {
    const orders = getOrders();

    res.json({
        success: true,
        orders: orders
    });
});

// Gusiba order imwe
app.delete("/api/orders/:id", (req, res) => {
    const id = Number(req.params.id);

    let orders = getOrders();

    const oldLength = orders.length;

    orders = orders.filter(order => order.id !== id);

    if (orders.length === oldLength) {
        return res.status(404).json({
            success: false,
            message: "Order ntabwo yabonetse."
        });
    }

    saveOrders(orders);

    res.json({
        success: true,
        message: "Order yasibwe."
    });
});

// Gusiba orders zose
app.delete("/api/orders", (req, res) => {
    saveOrders([]);

    res.json({
        success: true,
        message: "Orders zose zasibwe."
    });
});

// Gutangiza server
app.listen(PORT, () => {
    console.log("");
    console.log("======================================");
    console.log(" SERIVISI ZACU RWANDA BACKEND");
    console.log("======================================");
    console.log("Server iri gukora kuri:");
    console.log("http://localhost:" + PORT);
    console.log("");
});