import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();
const porta = 3000;

let listaProdutos = [];

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'chave-secreta-exemplo',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 30 }
}));

function autenticar(req, res, next) {
  if (req.session?.usuario?.logado) {
    return next();
  }
  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Acesso negado</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f7f3ff; color: #222; padding: 40px; }
          .card { max-width:600px; margin:40px auto; background: #fff; padding:20px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
          .btn { display:inline-block; padding:10px 16px; border-radius:6px; color:white; text-decoration:none; font-weight:600; }
          .roxo { background:#5a2ea6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Acesso negado</h2>
          <p>Você precisa <strong>realizar o login</strong> para acessar esta página.</p>
          <a class="btn roxo" href="/login">Ir para Login</a>
        </div>
      </body>
    </html>
  `);
}

const cssGlobal = `
<style>
  :root {
    --roxo-1: #5a2ea6;
    --roxo-2: #472488;
    --roxo-3: #361c6b;
    --fundo: #f2eefc;
  }
  body { font-family: Arial, sans-serif; background: var(--fundo); margin:0; padding:20px; color:#222; }
  .container { width:90%; max-width:1100px; margin:20px auto; }
  .nav { display:flex; justify-content:space-between; align-items:center; background: linear-gradient(90deg,var(--roxo-2),var(--roxo-1)); color:white; padding:12px 16px; border-radius:8px; }
  .nav a { color:white; text-decoration:none; margin-left:12px; font-weight:600; }
  .titulo { color:var(--roxo-1); text-align:center; margin:18px 0; }
  .form-card { background:white; padding:18px; border-radius:8px; box-shadow:0 3px 10px rgba(0,0,0,0.08); }
  label { display:block; margin-bottom:6px; font-weight:600; }
  input[type="text"], input[type="number"], input[type="date"], input[type="password"] { width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; margin-bottom:12px; }
  .btn { display:inline-block; padding:10px 16px; border-radius:6px; text-decoration:none; color:white; font-weight:600; }
  .btn-roxo { background:var(--roxo-1); border:none; cursor:pointer; }
  .btn-roxo:hover { background:var(--roxo-2); }
  .btn-cinza { background:#6c6c6c; }
  table { width:100%; border-collapse:collapse; margin-top:14px; background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
  thead { background:var(--roxo-1); color:white; }
  th, td { padding:12px 10px; border-bottom:1px solid #eee; font-size:14px; text-align:left; }
  tr:hover { background:#f7f3ff; }
  .meta { color:#555; font-size:13px; margin-top:12px; }
</style>
`;


app.get("/", autenticar, (req, res) => {
  const ultimo = req.cookies?.ultimoAcesso || "Primeiro acesso";
  const agora = new Date();
  res.cookie("ultimoAcesso", agora.toLocaleString(), { maxAge: 1000 * 60 * 60 * 24 * 7 }); // 7 dias

  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Início</title>
        ${cssGlobal}
      </head>
      <body>
        <div class="container">
          <div class="nav">
            <div><strong>Sistema de Produtos</strong></div>
            <div>
              Olá, ${req.session.usuario.nome} |
              <a href="/novo-produto">Cadastrar produto</a>
              <a href="/produtos">Ver produtos</a>
              <a href="/logout">Sair</a>
            </div>
          </div>

          <h2 class="titulo">Painel Inicial</h2>

          <div class="form-card">
            <p>Bem-vindo, <strong>${req.session.usuario.nome}</strong>.</p>
            <p class="meta"><strong>Último acesso:</strong> ${ultimo}</p>
            <p>Navegue pelo menu para cadastrar ou visualizar produtos.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get("/login", (req, res) => {
  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Login</title>
        ${cssGlobal}
      </head>
      <body>
        <div class="container" style="max-width:420px;">
          <h2 class="titulo">Login</h2>
          <div class="form-card">
            <form method="POST" action="/login">
              <label>Nome do usuário</label>
              <input type="text" name="nome" placeholder="Ex: João" required>

              <label>Senha</label>
              <input type="password" name="senha" placeholder="Senha" required>

              <div style="display:flex; gap:10px; margin-top:8px;">
                <button class="btn btn-roxo" type="submit">Entrar</button>
                <a class="btn btn-cinza" href="/produtos">Ver produtos (público)</a>
              </div>
            </form>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  const { nome, senha } = req.body;

  if (!nome || !senha) {
    return res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Erro</title>${cssGlobal}</head>
        <body>
          <div class="container" style="max-width:420px;">
            <h2 class="titulo">Login</h2>
            <div class="form-card">
              <p class="meta" style="color:#b00020;">Preencha nome e senha.</p>
              <a class="btn btn-roxo" href="/login">Voltar</a>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  req.session.usuario = {
    logado: true,
    nome: nome
  };

  const agora = new Date();
  res.cookie("ultimoAcesso", agora.toLocaleString(), { maxAge: 1000 * 60 * 60 * 24 * 7 });

  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});


app.get("/novo-produto", autenticar, (req, res) => {
  const ultimo = req.cookies?.ultimoAcesso || "Primeiro acesso";

  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Novo Produto</title>
        ${cssGlobal}
      </head>
      <body>
        <div class="container" style="max-width:900px;">
          <div class="nav">
            <div><strong>Cadastrar produto</strong></div>
            <div>
              <a href="/">Início</a>
              <a href="/produtos">Produtos</a>
              <a href="/logout">Sair</a>
            </div>
          </div>

          <h2 class="titulo">Formulário de Cadastro</h2>

          <div class="form-card">
            <p class="meta"><strong>Último acesso:</strong> ${ultimo}</p>

            <form method="POST" action="/salvar-produto">
              <label>Código de barras</label>
              <input type="text" name="codigo" required>

              <label>Descrição do produto</label>
              <input type="text" name="descricao" required>

              <label>Preço de custo (R$)</label>
              <input type="number" step="0.01" name="precoCusto" required>

              <label>Preço de venda (R$)</label>
              <input type="number" step="0.01" name="precoVenda" required>

              <label>Data de validade</label>
              <input type="date" name="validade">

              <label>Quantidade em estoque</label>
              <input type="number" name="estoque" required>

              <label>Nome do fabricante</label>
              <input type="text" name="fabricante">

              <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="btn btn-roxo" type="submit">Cadastrar</button>
                <a class="btn btn-cinza" href="/produtos">Cancelar</a>
              </div>
            </form>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.post("/salvar-produto", autenticar, (req, res) => {
  const { codigo, descricao, precoCusto, precoVenda, validade, estoque, fabricante } = req.body;

  // validação simples
  if (!codigo || !descricao || !precoCusto || !precoVenda || !estoque) {
    return res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Erro</title>${cssGlobal}</head>
        <body>
          <div class="container" style="max-width:600px;">
            <h2 class="titulo">Erro ao cadastrar</h2>
            <div class="form-card">
              <p class="meta" style="color:#b00020;">Preencha todos os campos obrigatórios.</p>
              <a class="btn btn-roxo" href="/novo-produto">Voltar</a>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  listaProdutos.push({
    codigo,
    descricao,
    precoCusto: parseFloat(precoCusto).toFixed(2),
    precoVenda: parseFloat(precoVenda).toFixed(2),
    validade: validade || "",
    estoque: parseInt(estoque, 10),
    fabricante: fabricante || ""
  });

  const agora = new Date();
  res.cookie("ultimoAcesso", agora.toLocaleString(), { maxAge: 1000 * 60 * 60 * 24 * 7 });

  res.redirect("/produtos");
});

app.get("/produtos", (req, res) => {
  const ultimo = req.cookies?.ultimoAcesso || "Primeiro acesso";

  let tabela = "";
  if (listaProdutos.length === 0) {
    tabela = `<tr><td colspan="7" style="text-align:center; padding:18px;">Nenhum produto cadastrado.</td></tr>`;
  } else {
    listaProdutos.forEach(p => {
      tabela += `
        <tr>
          <td>${p.codigo}</td>
          <td>${p.descricao}</td>
          <td>R$ ${p.precoCusto}</td>
          <td>R$ ${p.precoVenda}</td>
          <td>${p.validade || "-"}</td>
          <td>${p.estoque}</td>
          <td>${p.fabricante}</td>
        </tr>
      `;
    });
  }

  const logado = req.session?.usuario?.logado;
  const nomeUsuario = req.session?.usuario?.nome || "";

  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Produtos</title>
        ${cssGlobal}
      </head>
      <body>
        <div class="container">
          <div class="nav">
            <div><strong>Produtos</strong></div>
            <div>
              ${logado ? `Olá, ${nomeUsuario} | <a href="/novo-produto">Novo</a> <a href="/logout">Sair</a>` : `<a href="/login">Login</a>`}
            </div>
          </div>

          <h2 class="titulo">Produtos cadastrados</h2>

          <div class="form-card">
            <p class="meta"><strong>Último acesso:</strong> ${ultimo}</p>

            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Preço de custo</th>
                  <th>Preço de venda</th>
                  <th>Validade</th>
                  <th>Estoque</th>
                  <th>Fabricante</th>
                </tr>
              </thead>
              <tbody>
                ${tabela}
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Inicia servidor
app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
