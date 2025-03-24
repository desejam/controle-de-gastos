const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3001;
const JWT_SECRET = 'seu_segredo_jwt_aqui'; // Troque por um segredo forte

// Middleware
app.use(express.json()); // Para entender o corpo das requisições em JSON
app.use(cors()); // Habilita CORS

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Defina sua senha do MySQL
  database: 'sistema', // Troque para o nome do seu banco de dados
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ' + err.stack);
    return;
  }
  console.log('Conectado ao banco de dados com sucesso.');
});

// Rota de login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erro no servidor' });

    if (results.length === 0) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const usuario = results[0];

    // Verificando a senha
    bcrypt.compare(senha, usuario.senha, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Erro ao verificar senha' });

      if (!isMatch) {
        return res.status(400).json({ message: 'Senha incorreta' });
      }

      // Gerando o token JWT
      const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '1h' });

      res.json({ message: 'Login bem-sucedido', token });
    });
  });
});

// Rota para buscar produtos (despesas)
app.get('/produtos', (req, res) => {
  db.query('SELECT id, nome_produto, quantidade_parcelado, valor_total FROM despesas', (err, results) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar produtos' });

    // Marcar se o produto está pago ou não
    const produtos = results.map(produto => ({
      ...produto,
      status_pagamento: produto.quantidade_parcelado === 0 ? 'Pago' : 'Parcelado'
    }));

    res.json(produtos);
  });
});

// Rota para calcular e retornar os totais de saldo e parcelados
app.get('/totais', (req, res) => {
  const query = `
    SELECT 
      SUM(total_saldo) AS total_saldo,  -- Soma do total_saldo
      SUM(CASE WHEN quantidade_parcelado > 0 THEN valor_total ELSE 0 END) AS total_parcelado  -- Soma dos valores parcelados
    FROM despesas
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao calcular os totais' });
    }

    // Certifique-se de que os totais sejam passados corretamente
    const totals = results[0];
    res.json({
      total_saldo: totals.total_saldo || 0,  // Se não houver valores, retorna 0
      total_parcelado: totals.total_parcelado || 0  // Se não houver valores, retorna 0
    });
  });
});

// Rota para editar produto
app.put('/produtos/:id', (req, res) => {
  const { id } = req.params;
  const { nome_produto, quantidade_parcelado, valor_total } = req.body;

  // Se não passar o valor total ou o nome, ou a quantidade de parcelas, retorna erro.
  if (!nome_produto || quantidade_parcelado === undefined || valor_total === undefined) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
  }

  // Se quantidade_parcelado for 0, queremos garantir que o valor_total é o valor pago integralmente
  if (quantidade_parcelado === 0 && valor_total <= 0) {
    return res.status(400).json({ message: 'Valor total deve ser maior que 0 quando o produto for pago integralmente!' });
  }

  const query = `
    UPDATE despesas
    SET nome_produto = ?, quantidade_parcelado = ?, valor_total = ?
    WHERE id = ?
  `;

  db.query(query, [nome_produto, quantidade_parcelado, valor_total, id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erro ao editar produto' });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto atualizado com sucesso' });
  });
});

// Rota para excluir produto
app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM despesas WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erro ao excluir produto' });

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto excluído com sucesso' });
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
