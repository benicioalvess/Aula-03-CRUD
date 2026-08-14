
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"


const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_PATH = join(__dirname, "data.json");
const PRODUCTS_PATH = join (__dirname, "products.json") 

export async function  readUsers() {
    try {
        const raw = await readFile(DB_PATH, "utf8");
        return  JSON.parse(raw)
    }catch (error) {
        if (error.code == 'ENOENT') return [];
            
        throw error;
        
    }
    
}

export async function readProducts() {
    try {
        const raw = await readFile(PRODUCTS_PATH, "utf8");
        return JSON.parse(raw)
    } catch (error) {
        if (error.code == 'ENOENT') return [];

        throw error;

    }
}