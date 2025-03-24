const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistema', // Substitua com o nome do seu banco de dados
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ' + err.stack);
    return;
  }
  console.log('Conectado ao banco de dados com sucesso.');
});

// Dados do novo usuário
const email = 'usuario@teste.com';
const senha = 'senha123'; // Senha simples para testes
const id = 1; // ID do usuário

// Criptografando a senha com bcryptjs
bcrypt.hash(senha, 10, (err, hashedPassword) => {
  if (err) {
    console.error('Erro ao criptografar a senha:', err);
    return;
  }

  // Inserir usuário no banco de dados
  db.query(
    'INSERT INTO usuarios (id, email, senha) VALUES (?, ?, ?)',
    [id, email, hashedPassword],
    (err, results) => {
      if (err) {
        console.error('Erro ao inserir usuário:', err);
        return;
      }
      console.log('Usuário inserido com sucesso!');
      db.end();
    }
  );
});
