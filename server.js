const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// 🔗 Conexão com o banco de dados MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'despesas'
});

// ✅ Conectar ao banco de dados
db.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados');
  }
});

// 🌍 Middleware
app.use(cors());
app.use(bodyParser.json());

// 🌍 Middleware para registrar requisições
app.use((req, res, next) => {
  console.log(`🔄 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// 🔐 Middleware para verificar token
function verificarToken(req, res, next) {
  console.log('🔍 Verificando token...');

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('⚠️ Cabeçalho Authorization ausente.');
    return res.status(403).json({ message: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('⚠️ Token não encontrado após "Bearer".');
    return res.status(403).json({ message: 'Token de autenticação não fornecido.' });
  }

  jwt.verify(token, 'seu_segredo', (err, decoded) => {
    if (err) {
      console.log('❌ Token inválido:', err);
      return res.status(401).json({ message: 'Token inválido.' });
    }
    console.log('✅ Token válido! Usuário:', decoded.username);
    req.user = decoded;
    next();
  });
}

// Notificações
let notifications = [];

// Rota para listar notificações
app.get('/notificacoes', (req, res) => {
  console.log('🔍 Listando notificações');
  res.status(200).json(notifications);
});

// Rota para adicionar uma nova notificação
app.post('/notificacoes', verificarToken, (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Mensagem da notificação é obrigatória.' });
  }

  const newNotification = {
    id: notifications.length + 1, // Simulando um ID único
    message,
    timestamp: new Date().toISOString()
  };

  notifications.push(newNotification);
  console.log('✅ Notificação adicionada:', newNotification);
  res.status(201).json(newNotification);
});

// Rota para limpar todas as notificações
app.delete('/notificacoes', verificarToken, (req, res) => {
  notifications = []; // Limpa o array de notificações
  console.log('✅ Todas as notificações foram limpas.');
  res.status(200).json({ message: 'Todas as notificações foram limpas.' });
});

// 🚪 Rota de logout
app.post('/logout', verificarToken, (req, res) => {
  const username = req.user.username; // Obtém o nome de usuário do token
  notifications.push({ message: `Usuário ${username} deslogou com sucesso.`, timestamp: new Date().toISOString() });
  console.log(`🔒 Logout realizado pelo usuário: ${username}`);
  res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

// 🚀 Rota de login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Login solicitado para:', username);

  const query = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
  db.execute(query, [username, password], (err, results) => {
    if (err) {
      console.error('❌ Erro ao consultar o banco:', err);
      return res.status(500).json({ message: 'Erro interno no servidor' });
    }

    console.log('🔎 Resultado da consulta:', results);

    if (results.length > 0) {
      const user = results[0];
      const token = jwt.sign({ id: user.id, username: user.username }, 'seu_segredo', { expiresIn: '1h' });

      // Retorna todos os usuários cadastrados e o token gerado
      const queryTodosUsuarios = 'SELECT id, username FROM usuarios';
      db.execute(queryTodosUsuarios, (err, allUsers) => {
        if (err) {
          console.error('❌ Erro ao buscar usuários:', err);
          return res.status(500).json({ message: 'Erro ao recuperar usuários.' });
        }

        console.log('✅ Token gerado:', token);
        notifications.push({ message: `${username} logou com sucesso.`, timestamp: new Date().toISOString() });
        return res.status(200).json({
          message: '✅ Login bem-sucedido!',
          token,
          usuarios: allUsers // Retorna todos os usuários cadastrados
        });
      });
    } else {
      notifications.push({ message: `Tentativa de login falhou para o usuário ${username}.`, timestamp: new Date().toISOString() });
      console.log('⚠️ Credenciais inválidas:', username);
      return res.status(401).json({ message: '❌ Credenciais inválidas.' });
    }
  });
});

// 📊 Rota de dashboard (Validação de token)
app.get('/dashboard', verificarToken, (req, res) => {
  const username = req.user.username;
  console.log(`📊 Dashboard acessado pelo usuário: ${username}`);

  const querySaldoTotal = "SELECT COALESCE(saldo_total, 0) AS saldoTotal FROM saldo LIMIT 1";
  const queryParcelado = "SELECT COALESCE(SUM(valor_total), 0) AS totalParcelado FROM produtos WHERE status_pagamento = 'Pendente' AND forma_pagamento = 'Cartão de Crédito'";
  const querySaldoPixPago = "SELECT COALESCE(SUM(valor_total), 0) AS totalPagoPix FROM produtos WHERE forma_pagamento = 'Pix' AND status_pagamento = 'Pendente'";

  db.execute(querySaldoTotal, (err, resultSaldo) => {
    if (err) return res.status(500).json({ message: 'Erro ao recuperar saldo.' });

    const saldoTotal = resultSaldo[0].saldoTotal;
    console.log('💰 Saldo total:', saldoTotal);

    db.execute(queryParcelado, (err, resultParcelado) => {
      if (err) return res.status(500).json({ message: 'Erro ao recuperar parcelado.' });

      const totalParcelado = resultParcelado[0].totalParcelado;
      console.log('💳 Total parcelado:', totalParcelado);

      db.execute(querySaldoPixPago, (err, resultPix) => {
        if (err) return res.status(500).json({ message: 'Erro ao recuperar saldo pago via PIX.' });

        const totalPagoPix = resultPix[0].totalPagoPix;
        console.log('📲 Total pago via PIX:', totalPagoPix);

        const saldoRestante = saldoTotal - totalParcelado - totalPagoPix;
        const saldoNegativo = saldoRestante < 0 ? saldoRestante : 0;

        const responseData = {
          username,
          saldoTotal,
          totalParcelado,
          totalPagoPix,
          saldoRestante: saldoRestante < 0 ? 0 : saldoRestante,
          saldoNegativo
        };

        console.log('📊 Dados finais do dashboard:', responseData);
        res.status(200).json(responseData);
      });
    });
  });
});

// 📋 Rota para listar produtos
app.get('/produtos', verificarToken, (req, res) => {
  console.log('🔍 Lista de produtos solicitada.');

  const categoriaFiltro = req.query.categoria;
  let query = `SELECT id, nome_despesa, categoria, valor_total, numero_parcelas, valor_parcelado, data_adicao, 
                      data_vencimento, COALESCE(forma_pagamento, 'Desconhecido') AS forma_pagamento, 
                      COALESCE(status_pagamento, 'Pendente') AS status_pagamento 
               FROM produtos`;

  if (categoriaFiltro) {
    query += " WHERE categoria = ?";
  }

  db.execute(query, categoriaFiltro ? [categoriaFiltro] : [], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar produtos:', err);
      return res.status(500).json({ message: 'Erro ao recuperar lista de produtos.' });
    }

    if (results.length === 0) {
      console.log('⚠️ Nenhum produto encontrado.');
      return res.status(404).json({ message: 'Nenhum produto encontrado.' });
    }

    console.log(`📋 Total de produtos: ${results.length}`);
    res.status(200).json({ totalProdutos: results.length, produtos: results });
  });
});

// 📝 Rota para adicionar produto
app.post('/produtos', verificarToken, (req, res) => {
  const { nome_despesa, categoria, valor_total, numero_parcelas, valor_parcelado, data_adicao, data_vencimento, forma_pagamento, status_pagamento } = req.body;

  console.log('📝 Adicionando novo produto:', req.body);

  // Verificar se todos os campos obrigatórios foram fornecidos
  if (!nome_despesa || !categoria || !valor_total || !numero_parcelas || !data_adicao || !data_vencimento) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const query = "INSERT INTO produtos (nome_despesa, categoria, valor_total, numero_parcelas, valor_parcelado, data_adicao, data_vencimento, forma_pagamento, status_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

  db.execute(query, [nome_despesa, categoria, valor_total, numero_parcelas, valor_parcelado, data_adicao, data_vencimento, forma_pagamento, status_pagamento], (err, result) => {
    if (err) {
      console.error('❌ Erro ao adicionar produto:', err);
      return res.status(500).json({ message: 'Erro ao adicionar produto.' });
    }

    console.log('✅ Produto adicionado com sucesso! ID:', result.insertId);
    notifications.push({ message: `${nome_despesa} adicionado com sucesso!`, timestamp: new Date().toISOString() });
    
    // Retornar as opções de status e forma de pagamento
    const formasPagamento = ["Pix", "Cartão de Crédito"];
    const statusPagamento = ["Pendente", "Pago"];

    res.status(201).json({
      message: 'Produto adicionado com sucesso!',
      id: result.insertId,
      formasPagamento,
      statusPagamento
    }); // Retorna o ID do novo produto
  });
});

// 🗑️ Rota para excluir produto
app.delete('/produtos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Excluindo produto ID: ${id}`);

  // Primeiro, busque o produto para obter o nome_despesa
  const queryBuscarProduto = "SELECT nome_despesa FROM produtos WHERE id = ?";
  
  db.execute(queryBuscarProduto, [id], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar produto:', err);
      return res.status(500).json({ message: 'Erro ao buscar produto.' });
    }

    if (results.length === 0) {
      console.log(`⚠️ Nenhum produto encontrado com o ID: ${id}`);
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const nomeDespesa = results[0].nome_despesa; // Armazena o nome_despesa

    // Agora, exclua o produto
    const queryExcluirProduto = "DELETE FROM produtos WHERE id = ?";
    db.execute(queryExcluirProduto, [id], (err, result) => {
      if (err) {
        console.error('❌ Erro ao excluir produto:', err);
        return res.status(500).json({ message: 'Erro ao excluir produto.' });
      }

      if (result.affectedRows === 0) {
        console.log(`⚠️ Nenhum produto encontrado com o ID: ${id}`);
        return res.status(404).json({ message: 'Produto não encontrado.' });
      }

      notifications.push({ message: `${nomeDespesa} foi excluído com sucesso!`, timestamp: new Date().toISOString() });
      console.log('✅ Produto excluído com sucesso!');
      res.status(200).json({ message: '✅ Produto excluído com sucesso!' });
    });
  });
});

// 📝 Rota para editar produto
app.put('/produtos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nome_despesa, categoria, valor_total, numero_parcelas, valor_parcelado, data_adicao, data_vencimento, forma_pagamento, status_pagamento } = req.body;

  console.log(`📝 Editando produto ID: ${id}`);
  console.log('📦 Corpo da requisição:', req.body);

  // Primeiro, busque o produto para obter o nome_despesa
  const queryBuscarProduto = "SELECT nome_despesa FROM produtos WHERE id = ?";
  
  db.execute(queryBuscarProduto, [id], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar produto:', err);
      return res.status(500).json({ message: 'Erro ao buscar produto.' });
    }

    if (results.length === 0) {
      console.log(`⚠️ Nenhum produto encontrado com o ID: ${id}`);
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const nomeDespesa = results[0].nome_despesa; // Armazena o nome_despesa

    // Verificar se pelo menos um campo foi enviado
    if (!nome_despesa && !categoria && !valor_total && !numero_parcelas && !valor_parcelado && !data_adicao && !data_vencimento && !forma_pagamento && !status_pagamento) {
      return res.status(400).json({ message: 'Nenhum campo foi enviado para atualização.' });
    }

    // Montar a query dinamicamente
    let query = 'UPDATE produtos SET ';
    const updates = [];
    const values = [];

    if (nome_despesa) {
      updates.push('nome_despesa = ?');
      values.push(nome_despesa);
    }
    if (categoria) {
      updates.push('categoria = ?');
      values.push(categoria);
    }
    if (valor_total) {
      updates.push('valor_total = ?');
      values.push(valor_total);
    }
    if (numero_parcelas) {
      updates.push('numero_parcelas = ?');
      values.push(numero_parcelas);
    }
    if (valor_parcelado) { // Campo não obrigatório
      updates.push('valor_parcelado = ?');
      values.push(valor_parcelado);
    }
    if (data_adicao) {
      updates.push('data_adicao = ?');
      values.push(data_adicao);
    }
    if (data_vencimento) {
      updates.push('data_vencimento = ?');
      values.push(data_vencimento);
    }
    if (forma_pagamento) {
      updates.push('forma_pagamento = ?');
      values.push(forma_pagamento);
    }
    if (status_pagamento) {
      updates.push('status_pagamento = ?');
      values.push(status_pagamento);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    values.push(id);

    console.log('🔧 Query montada:', query);
    console.log('📌 Valores:', values);

    // Executar a query
    db.execute(query, values, (err, result) => {
      if (err) {
        console.error('❌ Erro ao editar produto:', err);
        return res.status(500).json({ message: 'Erro ao editar produto.' });
      }

      if (result.affectedRows === 0) {
        console.log(`⚠️ Nenhum produto encontrado com o ID: ${id}`);
        return res.status(404).json({ message: 'Produto não encontrado.' });
      }

      notifications.push({ message: `${nomeDespesa} foi editado com sucesso!`, timestamp: new Date().toISOString() });
      console.log('✅ Produto editado com sucesso!');

      // Retornar as opções de status e forma de pagamento
      const formasPagamento = ["Pix", "Cartão de Crédito"];
      const statusPagamento = ["Pendente", "Pago"];

      res.status(200).json({
        message: '✅ Produto editado com sucesso!',
        formasPagamento,
        statusPagamento
      });
    });
  });
});

// 🔍 Rota para buscar um produto pelo ID
app.get('/produtos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Buscando produto ID: ${id}`);

  const query = "SELECT id, nome_despesa, categoria, valor_total, numero_parcelas, valor_parcelado, data_adicao, data_vencimento, forma_pagamento, status_pagamento FROM produtos WHERE id = ?";

  db.execute(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Erro ao buscar produto:', err);
      return res.status(500).json({ message: 'Erro ao recuperar produto.' });
    }

    if (results.length === 0) {
      console.log(`⚠️ Produto não encontrado com o ID: ${id}`);
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    console.log('📋 Produto encontrado:', results[0]);
    res.status(200).json(results[0]); // Retorna o produto encontrado
  });
});

// 💳 Rota para listar formas de pagamento
app.get('/formas-pagamento', verificarToken, (req, res) => {
  console.log('🔍 Carregando formas de pagamento');

  // Retornar as opções fixas
  const formasPagamento = ["Pix", "Cartão de Crédito"];
  res.status(200).json({ formasPagamento });
});

// 📝 Rota para listar status de pagamento
app.get('/status-pagamento', verificarToken, (req, res) => {
  console.log('🔍 Carregando status de pagamento');

  // Retornar as opções fixas
  const statusPagamento = ["Pendente", "Pago"];
  res.status(200).json({ statusPagamento });
});

// 🏦 Rota para obter o saldo total
app.get('/saldo', verificarToken, (req, res) => {
  console.log('🔍 Carregando saldo total');

  const query = "SELECT COALESCE(saldo_total, 0) AS saldo_total FROM saldo LIMIT 1";

  db.execute(query, (err, results) => {
    if (err) {
      console.error('❌ Erro ao carregar saldo:', err);
      return res.status(500).json({ message: 'Erro ao recuperar saldo.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Saldo não encontrado.' });
    }

    res.status(200).json({ saldo_total: results[0].saldo_total });
  });
});

// 🏦 Rota para atualizar o saldo total
app.put('/saldo', verificarToken, (req, res) => {
  const { saldo_total } = req.body;
  console.log(`📝 Atualizando saldo total para: R$ ${saldo_total}`);

  if (saldo_total === undefined) {
    return res.status(400).json({ message: 'Saldo total não fornecido.' });
  }

  const query = "UPDATE saldo SET saldo_total = ? WHERE id = 1"; // Supondo que haja apenas um registro de saldo

  db.execute(query, [saldo_total], (err, result) => {
    if (err) {
      console.error('❌ Erro ao atualizar saldo:', err);
      return res.status(500).json({ message: 'Erro ao atualizar saldo.' });
    }

    if (result.affectedRows === 0) {
      console.log('⚠️ Nenhum saldo encontrado para atualizar.');
      return res.status(404).json({ message: 'Saldo não encontrado.' });
    }

    notifications.push({ message: `Saldo atualizado para R$ ${parseFloat(saldo_total).toFixed(2)}!`, timestamp: new Date().toISOString() });
    console.log('✅ Saldo atualizado com sucesso!');
    res.status(200).json({ message: 'Saldo atualizado com sucesso!' }); // Retorna uma mensagem de sucesso
  });
});

// Rota para verificar o status do servidor
app.get('/status', (req, res) => {
  console.log('🔍 Verificando status do servidor...');

  // Coletar informações do servidor
  const status = 'Online'; // Status do servidor
  const uptime = process.uptime().toFixed(2) + 's'; // Uptime do servidor
  const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB'; // Uso de memória
  const cpuLoad = (Math.random() * 0.5).toFixed(2); // Simulando carga da CPU
  const platform = process.platform; // Plataforma do servidor

  // Exibir informações no console
  console.clear(); // Limpa o console para uma visualização mais limpa
  console.log('==============================');
  console.log('         Status do Servidor         ');
  console.log('==============================');
  console.log(`Status:                ${status}`);
  console.log(`Uptime:               ${uptime}`);
  console.log(`Uso de Memória:       ${memoryUsage}`);
  console.log(`Carga da CPU:         ${cpuLoad}`);
  console.log(`Plataforma:           ${platform}`);
  console.log('==============================');

  // Retornar as informações como resposta
  res.status(200).json({
    status,
    uptime,
    memoryUsage,
    cpuLoad,
    platform
  });
});
// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);
});
