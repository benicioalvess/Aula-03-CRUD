
import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_PATH = join(__dirname, 'data.json')

const DB_PRODUCTS = join(__dirname, "products.json")

export async function readUsers() {
    try {
        const raw = await readFile(DB_PATH, "utf-8")
        return JSON.parse(raw)

    } catch (err) {
        if (err.code === "ENOENT") return []

        throw err
    }
}

export async function readProducts() {
    try {
        const raw = await readFile(DB_PRODUCTS, "utf-8")
        return JSON.parse(raw)

    } catch (err) {
        if (err.code === "ENOENT") return []

        throw err
    }
}

export async function writeUsers(users) {
    await writeFile(DB_PATH, JSON.stringify(users, null, 2), 'utf8')
}

export async function writeProducts(products) {
    await writeFile(DB_PRODUCTS, JSON.stringify(products, null, 2), 'utf8')
}