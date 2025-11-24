import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const host = "0.0.0.0";
const porta = 3000;

var listaUsuarios = [];

const server = express();
server.use(session({
    secret: 'segredo',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 15
    }
}));
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser());


// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
function verificarAutenticacao(req, res, next) {
    if (req.session.dadosLogin?.usuarioLogado) {
        return next();
    } else {
        res.redirect("/login");
    }
}


// ===== HOME =====
server.get('/', verificarAutenticacao, (req, res) => {
    let ultimoAcesso = req.cookies?.ultimoAcesso;

    const data = new Date();
    res.cookie("ultimoAcesso", data.toLocaleString());
    res.setHeader("Content-Type", "text/html");
    res.write(`
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inicio</title>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-light bg-light">
<div class="container-fluid">
    <a class="navbar-brand" href="#">Menu</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
        <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Opções</a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="/cadastrar-produto">Cadastro de produtos</a></li>
                    <li><a class="dropdown-item" href="/listarUsuarios">Listar empresas</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="/logout">Logout</a></li>
                </ul>
            </li>
        </ul>
    </div>
</div>
<div class="container-fluid">
    <div class="d-flex">
        <div class="p-2">
        <p>Último acesso: ${ultimoAcesso || "Primeiro acesso"}</p>
        </div>
    </div>
</div>
</nav>
</body>
</html>
`);
    res.end();
});


// ===== CADASTRAR PRODUTO =====
server.get('/cadastrar-produto', verificarAutenticacao, (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cadastro de Produtos</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>

<div class="container mt-5">
    <h2 class="mb-4 text-center">Cadastro de Produtos</h2>

    <form method="POST" action="/adicionarUsuario" class="row g-3">

        <div class="col-md-4">
            <label for="codigo" class="form-label">Código de Barras</label>
            <input type="text" class="form-control" id="codigo" name="codigo" required>
        </div>

        <div class="col-md-8">
            <label for="descricao" class="form-label">Descrição do Produto</label>
            <input type="text" class="form-control" id="descricao" name="descricao" required>
        </div>

        <div class="col-md-4">
            <label for="precoCusto" class="form-label">Preço de Custo (R$)</label>
            <input type="number" step="0.01" class="form-control" id="precoCusto" name="precoCusto" required>
        </div>

        <div class="col-md-4">
            <label for="precoVenda" class="form-label">Preço de Venda (R$)</label>
            <input type="number" step="0.01" class="form-control" id="precoVenda" name="precoVenda" required>
        </div>

        <div class="col-md-4">
            <label for="validade" class="form-label">Data de Validade</label>
            <input type="date" class="form-control" id="validade" name="validade">
        </div>

        <div class="col-md-4">
            <label for="estoque" class="form-label">Quantidade em Estoque</label>
            <input type="number" class="form-control" id="estoque" name="estoque" required>
        </div>

        <div class="col-md-8">
            <label for="fabricante" class="form-label">Nome do Fabricante</label>
            <input type="text" class="form-control" id="fabricante" name="fabricante">
        </div>

        <div class="col-12">
            <button class="btn btn-primary" type="submit">Cadastrar</button>
            <a class="btn btn-secondary" href="/">Voltar</a>
        </div>

    </form>
</div>

</body>
</html>

`);
});


// ===== POST ADICIONAR USUÁRIO =====
server.post('/adicionarUsuario', verificarAutenticacao, (req, res) => {
    const codigo = req.body.codigo;
    const descricao = req.body.descricao;
    const precoCusto = req.body.precoCusto;
    const precoVenda = req.body.precoVenda;
    const validade = req.body.validade;
    const estoque = req.body.estoque;
    const fabricante = req.body.fabricante;

    if (codigo && descricao && precoCusto && precoVenda && validade && estoque && fabricante) {
        listaUsuarios.push({ codigo, descricao, precoCusto, precoVenda, validade, estoque, fabricante});
        return res.redirect('/listarUsuarios');
    }

    let conteudo = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Cadastro de Produtos</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>

<div class="container mt-5">
<h2 class="mb-4 text-center">Cadastro de Produtos</h2>

<form method="POST" action="/adicionarUsuario" class="row g-3">`;

// ===== Código de Barras =====
conteudo += `
<div class="col-md-4">
<label class="form-label">Código de Barras</label>
<input type="text" class="form-control" name="codigo" value="${codigo ?? ""}">
</div>`;
if (!codigo) conteudo += `<div class="text-danger">Por favor, preencha o campo Código de Barras.</div>`;

// ===== Descrição =====
conteudo += `
<div class="col-md-8">
<label class="form-label">Descrição do Produto</label>
<input type="text" class="form-control" name="descricao" value="${descricao ?? ""}">
</div>`;
if (!descricao) conteudo += `<div class="text-danger">Por favor, preencha o campo Descrição.</div>`;

// ===== Preço de Custo =====
conteudo += `
<div class="col-md-4">
<label>Preço de Custo (R$)</label>
<input type="number" step="0.01" class="form-control" name="precoCusto" value="${precoCusto ?? ""}">
</div>`;
if (!precoCusto) conteudo += `<div class="text-danger">Por favor, preencha o campo Preço de Custo.</div>`;

// ===== Preço de Venda =====
conteudo += `
<div class="col-md-4">
<label>Preço de Venda (R$)</label>
<input type="number" step="0.01" class="form-control" name="precoVenda" value="${precoVenda ?? ""}">
</div>`;
if (!precoVenda) conteudo += `<div class="text-danger">Por favor, preencha o campo Preço de Venda.</div>`;

// ===== Validade =====
conteudo += `
<div class="col-md-4">
<label>Data de Validade</label>
<input type="date" class="form-control" name="validade" value="${validade ?? ""}">
</div>`;
if (!validade) conteudo += `<div class="text-danger">Por favor, preencha o campo Data de Validade.</div>`;

// ===== Estoque =====
conteudo += `
<div class="col-md-4">
<label>Quantidade em Estoque</label>
<input type="number" class="form-control" name="estoque" value="${estoque ?? ""}">
</div>`;
if (!estoque) conteudo += `<div class="text-danger">Por favor, preencha o campo Estoque.</div>`;

// ===== Fabricante =====
conteudo += `
<div class="col-md-8">
<label>Nome do Fabricante</label>
<input type="text" class="form-control" name="fabricante" value="${fabricante ?? ""}">
</div>`;
if (!fabricante) conteudo += `<div class="text-danger">Por favor, preencha o campo Fabricante.</div>`;

// ===== Botões =====
conteudo += `
<div class="col-12">
<button class="btn btn-primary" type="submit">Cadastrar</button>
<a class="btn btn-secondary" href="/">Voltar</a>
</div>

</form>
</div>

</body>
</html>
`;

return res.send(conteudo);
});



// ===== LISTAR USUÁRIOS =====
server.get('/listarUsuarios', verificarAutenticacao, (req, res) => {

    let conteudo = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Lista de Usuários</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>

<div class="container mt-5">
<h2 class="mb-4 text-center">Lista de Produtos</h2>

<table class="table table-striped">
<thead>
<tr>
<th>Código</th>
<th>Descrição</th>
<th>Valor de Custo</th>
<th>Valor de Venda</th>
<th>Validade</th>
<th>Estoque</th>
<th>Fabricante</th>
</tr>
</thead>
<tbody>`;

    listaUsuarios.forEach(usuario => {
        conteudo += `
<tr>
<td>${usuario.codigo}</td>
<td>${usuario.descricao}</td>
<td>${usuario.precoCusto}</td>
<td>${usuario.precoVenda}</td>
<td>${usuario.validade}</td>
<td>${usuario.estoque}</td>
<td>${usuario.fabricante}</td>
</tr>`;
    });

    conteudo += `
</tbody>
</table>

<a class="btn btn-primary" href="/cadastrar-produto">Cadastrar novo produto</a>
<a class="btn btn-secondary" href="/">Voltar ao Início</a>

</div>
</body>
</html>
`;

    res.send(conteudo);
});


// ===== LOGIN =====
server.get('/login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-5">
<h2 class="mb-4 text-center">Autenticação de usuário</h2>

<form method="POST" action="/login" class="row g-3">

<div class="col-12">
<label class="form-label">Usuário</label>
<input type="text" class="form-control" name="usuario">
</div>

<div class="col-12">
<label class="form-label">Senha</label>
<input type="password" class="form-control" name="senha">
</div>

<div class="col-12">
<button class="btn btn-primary" type="submit">Entrar</button>
<a class="btn btn-secondary" href="/">Voltar</a>
</div>

</form>
</div>
</body>
</html>
`);
});


// ===== LOGIN POST CORRIGIDO =====
server.post('/login', (req, res) => {

    const { usuario, senha } = req.body;

    if (usuario === "admin" && senha === "admin123") {

        req.session.dadosLogin = {
            usuarioLogado: true,
            nomeUsuario: "Administrador"
        };

        return res.redirect("/");
    }

    // Se usuário ou senha errados
    res.write(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <title>Login</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
        <div class="container mt-5">
        <h2 class="mb-4 text-center">Autenticação de usuário</h2>

        <form method="POST" action="/login" class="row g-3">

            <div class="col-12">
                <label class="form-label">Usuário</label>
                <input type="text" class="form-control" name="usuario" value="${usuario ?? ''}">
                ${!usuario ? `<div class="text-danger">Por favor, preencha o campo Usuário.</div>` : ''}
            </div>

            <div class="col-12">
                <label class="form-label">Senha</label>
                <input type="password" class="form-control" name="senha">
                ${!senha ? `<div class="text-danger">Por favor, preencha o campo Senha.</div>` : ''}
            </div>

            <div class="col-12">
                <button class="btn btn-primary" type="submit">Entrar</button>
                <a class="btn btn-secondary" href="/">Voltar</a>
            </div>

        </form>
        </div>
        </body>
        </html>
    `);

    res.end();
});


// ===== LOGOUT =====
server.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});


// ===== INICIAR SERVIDOR =====
server.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
