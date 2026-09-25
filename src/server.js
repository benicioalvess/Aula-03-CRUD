import app from "./app.js"

import { readProducts, readUsers, writeProducts, writeUsers } from "./db.js"

import dotenv from "dotenv"

dotenv.config()

app.listen(process.env.PORTA, () => {
    console.log("Servidor rodando na Porta " + process.env.PORTA)
})

app.get("/", async (req, res) => {
    res.send("Seja bem vindo !")
})

app.get("/users", async (req, res) => {
    const { maior } = req.query;
    let users = await readUsers();
    users = users.filter((u) => !u.deletado);
    if (maior) {
        users = users.filter((u) => u.idade >= Number(maior));
    }
    res.json(users);
});

app.get('/users/:id', async (req, res) => {
    const users = await readUsers()
    const user = users.find(u => u.id === Number(req.params.id) && !u.deletado)

    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' })
    res.json(user)
})



app.get("/products/:id", async (req, res) => {
    const products = await readProducts()
    const product = products.find(p => p.id === Number(req.params.id) && !p.deletado)
    if (!product) {
        return res.status(404).json({
            status: 404,
            message: "Produto não encontrado"
        })
    }
    res.json(product)
}
)

app.get("/products", async (req, res) => {
    let products = await readProducts()
    products = products.filter(p => !p.deletado)
    const { min } = req.query
    if (min) {
        products = products.filter(p => p.preco >= parseFloat(min))
    }
    res.json(products)
})

function validateUserPayload(body) {
    const { nome, email } = body || {}
    if (!nome) return { ok: false, erro: 'nome é obrigatório' }
    if (!email || !email.includes('@')) return { ok: false, erro: 'email inválido' }
    return { ok: true, data: { nome, email } }
}

app.post('/users', async (req, res) => {
    const { nome, email } = validateUserPayload(req.body).data

    const users = await readUsers()
    const novoId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1

    users.map(u => {
        if (u.email === email) {
            res.status(409).json({ erro: 'email Duplicado' })
        }
    })

    const novo = { id: novoId, nome, email }
    users.push(novo)
    await writeUsers(users)

   
    res.status(201).json(novo)
})

app.post('/users/batch', async (req, res) => {
    const usersBody = req.body || []

    const users = readUsers()

    let biggestId = users.length ? Math.max(...users.map((user) => user.id)) : 1

    const validUsers = usersBody
        .filter((user) => user.nome && typeof user.nome === "string" && user.email && user.email.includes("@"))
        .map((user) => ({
            ...user,
            id: ++biggestId
        }))

    if (validUsers.length === 0) {
        return res.status(400).json({
            erro: "dados inválidos"
        })
    }

    if (validUsers.length < usersBody.length) {
        return res.status(400).json({
            erro: "nem todos os usuários foram cadastrados"
        })
    }

    const newUsers = [...users, ...validUsers]
    await writeUsers(newUsers)

    res.status(201).json(newUsers)
})


app.post('/products', async (req, res) => {
    const { nome, preco } = req.body || {}

    // validação simples
    if (!nome || typeof nome !== 'string') {
        return res.status(400).json({ erro: 'nome é obrigatório' })
    }
    if (!preco || typeof preco !== 'number') {
        return res.status(400).json({ erro: 'Preço inválido' })
    }

    const products = await readProducts()
    const novoId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1

    const novo = { id: novoId, nome, preco }
    products.push(novo)
    await writeProducts(products)

  
    res.status(201).json(novo)
})

app.put("/products/:id", async (req, res) => {
    const { nome, preco } = req.body || {}

    if (typeof nome !== 'string' || nome.trim() === "") {
        return res.status(400).json({ erro: 'nome é obrigatório' })
    }
    if (typeof preco !== 'number' || preco <= 0) {
        return res.status(400).json({ erro: 'preço precisa ser um número maior do que zero' })
    }

    const produtos = await readProducts()

    const id = Number(req.params.id)

    const indexProduto = produtos.findIndex((produto) => produto.id === id)

    if (indexProduto === -1) {
        return res.status(404).json({ erro: 'Produto não existe' })
    }

    produtos[indexProduto] = { id, nome, preco }

    await writeProducts(produtos)

    return res.status(200).json(produtos[indexProduto])

})

app.patch("/products/:id", async (req, res) => {
    const { id: _, createdAt: __, updatedAt: ___, ...dados } = req.body || {}
    const { nome, preco } = dados


    if (nome !== undefined && (typeof nome !== 'string' || nome.trim() === "")) {
        return res.status(400).json({ erro: 'nome inválido' })
    }
    if (preco !== undefined && (typeof preco !== 'number' || preco <= 0)) {
        return res.status(400).json({ erro: 'preco precisa ser um número maior do que zero' })
    }

    const produtos = await readProducts()
    const id = Number(req.params.id)
    const indexProduto = produtos.findIndex((produto) => produto.id === id)

    if (indexProduto === -1) {
        return res.status(404).json({ erro: 'Produto não existe' })
    }

    produtos[indexProduto] = {
        ...produtos[indexProduto],
        ...(nome !== undefined && { nome }),
        ...(preco !== undefined && { preco }),
        updatedAt: new Date().toISOString(),
    }

    await writeProducts(produtos)

    return res.status(200).json(produtos[indexProduto])
})

app.delete("/products/:id", async (req, res) => {
    const produtos = await readProducts()
    const id = Number(req.params.id)

    const indexProduto = produtos.findIndex((produto) => produto.id === id)

    if (indexProduto === -1 || produtos[indexProduto].deletado) {
        return res.status(404).json({ erro: 'Produto não existe' })
    }

    produtos[indexProduto] = {
        ...produtos[indexProduto],
        deletado: true,
        deletedAt: new Date().toISOString()
    }

    await writeProducts(produtos)

    return res.status(200).json({ mensagem: 'Produto removido com sucesso' })
})

app.delete("/users/:id", async (req, res) => {
    const { force } = req.query
    const users = await readUsers()
    const id = Number(req.params.id)

    const indexUser = users.findIndex((user) => user.id === id)

    if (indexUser === -1) {
        return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    if (force === 'true') {
        users.splice(indexUser, 1)
        await writeUsers(users)
        return res.status(200).json({ mensagem: 'Usuário removido permanentemente' })
    }

    if (users[indexUser].deletado) {
        return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    users[indexUser] = {
        ...users[indexUser],
        deletado: true,
        deletedAt: new Date().toISOString()
    }

    await writeUsers(users)

    return res.status(200).json({ mensagem: 'Usuário removido com sucesso (soft delete)' })
})