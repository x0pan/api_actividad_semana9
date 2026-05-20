const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Contraseña de XAMPP
    database: 'api_clientes'
};

// --- OPERACIONES CRUD --- [cite: 31]

// POST - Agregar cliente
app.post('/api/clientes', async (req, res) => {
    const { nombre, email, telefono } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        // '?' para prevenir inyección SQL 
        const [result] = await connection.execute(
            'INSERT INTO cliente (nombre, email, telefono) VALUES (?, ?, ?)',
            [nombre, email, telefono]
        );
        await connection.end();
        res.status(201).json({ mensaje: 'Cliente creado', id: result.insertId });
    } catch (error) {
        // Manejo específico del error 409 por email duplicado (Código ER_DUP_ENTRY en MySQL) [cite: 28, 63]
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Conflicto: El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM cliente');
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Actualizar cliente
app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, telefono } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'UPDATE cliente SET nombre = ?, email = ?, telefono = ? WHERE id_cliente = ?',
            [nombre, email, telefono, id]
        );
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json({ mensaje: 'Cliente actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Conflicto: El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// Eliminar cliente
app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute('DELETE FROM cliente WHERE id_cliente = ?', [id]);
        await connection.end();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json({ mensaje: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});