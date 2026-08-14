import express from 'express'
import { readUsers } from './db.js'

const app = express ()
const PORT = 3000

app.get('/users', async (req, res) => {
 const users = await readUsers ()
    res.json(users)
})

app.get("/users/:id", async (req, res) => {
    const users = await readUsers()
    const user = users.find(u => u.id === Number(req.params.id))
     if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' })
    res.json(users)
})

app.listen(PORT, () =>
     console.log(`Server is running on http://localhost:${PORT}`))