const db = require('../models/db');
const { addActivityLog } = require('./logsController');

exports.getInventory = (req, res) => {
    db.query("SELECT * FROM inventory ORDER BY name ASC", (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch inventory" });
        res.json(result);
    });
};

exports.getTransactions = (req, res) => {
    db.query("SELECT * FROM inventory_transactions ORDER BY transaction_date DESC", (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to fetch transactions" });
        res.json(result);
    });
};

exports.addInventory = (req, res) => {
    const { name, quantity, unit, category, updatedBy } = req.body;
    const checkSql = "SELECT * FROM inventory WHERE LOWER(name) = LOWER(?) LIMIT 1";
    const user = updatedBy || 'System/Admin'; // 🌟 Anti-crash prevention

    db.query(checkSql, [name], (err, existingItems) => {
        if (err) return res.status(500).json({ error: "Failed to check existing inventory" });

        if (existingItems.length > 0) {
            const existingItem = existingItems[0];
            const updateSql = "UPDATE inventory SET quantity = quantity + ?, unit = ?, category = ?, updatedBy = ? WHERE id = ?";
            
            db.query(updateSql, [quantity, unit, category, user, existingItem.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "Failed to update item" });
                
                db.query("INSERT INTO inventory_transactions (item_name, transaction_type, quantity_change, remarks, transacted_by) VALUES (?, ?, ?, ?, ?)", 
                [existingItem.name, 'IN (Add Stock)', quantity, 'Added stock', user]);
                
                addActivityLog(`Added stock (+${quantity} ${unit}) to: ${existingItem.name}`, user);
                return res.json({ message: "Stock added successfully.", id: existingItem.id });
            });
        } else {
            const insertSql = "INSERT INTO inventory (name, quantity, unit, category, updatedBy) VALUES (?, ?, ?, ?, ?)";
            db.query(insertSql, [name, quantity, unit, category, user], (insertErr, result) => {
                if (insertErr) return res.status(500).json({ error: "Failed to add inventory item" });
                
                db.query("INSERT INTO inventory_transactions (item_name, transaction_type, quantity_change, remarks, transacted_by) VALUES (?, ?, ?, ?, ?)", 
                [name, 'IN (New Item)', quantity, 'Initial stock added', user]);
                
                addActivityLog(`Added a new inventory item: ${name}`, user);
                return res.json({ message: "New item added successfully", id: result.insertId });
            });
        }
    });
};

exports.updateInventory = (req, res) => {
    const { id } = req.params;
    const { name, quantity, unit, category, updatedBy } = req.body;
    const user = updatedBy || 'System/Admin'; // 🌟 Anti-crash prevention

    const sql = "UPDATE inventory SET name=?, quantity=?, unit=?, category=?, updatedBy=? WHERE id=?";
    
    db.query(sql, [name, quantity, unit, category, user, id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update item" });
        
        db.query("INSERT INTO inventory_transactions (item_name, transaction_type, quantity_change, remarks, transacted_by) VALUES (?, ?, ?, ?, ?)", 
        [name, 'ADJUST (Edited)', quantity, 'Item details updated', user]);
        
        addActivityLog(`Updated inventory item: ${name}`, user);
        res.json({ message: "Item updated successfully" });
    });
};

exports.releaseInventory = (req, res) => {
    const inventory_id = req.params.id;
    const { item_name, quantity, basis, released_by } = req.body;
    const user = released_by || 'System/Admin'; // 🌟 Anti-crash prevention

    const updateSql = "UPDATE inventory SET quantity = quantity - ?, updatedBy = ? WHERE id = ?";
    db.query(updateSql, [quantity, user, inventory_id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to release stock" });
        
        db.query("INSERT INTO inventory_transactions (item_name, transaction_type, quantity_change, remarks, transacted_by) VALUES (?, ?, ?, ?, ?)", 
        [item_name, 'OUT (Released)', quantity, basis, user]);
        
        addActivityLog(`Released ${quantity} of ${item_name}`, user);
        res.json({ message: "Item released successfully!" });
    });
};

exports.deleteInventory = (req, res) => {
    const { id } = req.params;
    const { item_name, deleted_by } = req.body; 
    const user = deleted_by || 'System/Admin'; // 🌟 Anti-crash prevention
    
    db.query("DELETE FROM inventory WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete item" });
        addActivityLog(`Deleted inventory item: ${item_name || 'ID ' + id}`, user);
        res.json({ message: "Item deleted successfully" });
    });
};