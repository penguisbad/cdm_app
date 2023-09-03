/*
- get description of product
- turn it into embeddings
- query pinecone for category
- ask chatgpt based on the book where it is on the cyber defense matrix
*/

const pinecone = require("@pinecone-database/pinecone");
const cheerio = require("cheerio");
const HTMLParser = require("node-html-parser");
const express = require("express");
const lcOpenAI = require("langchain/chat_models/openai");
const lcTextSplitter = require("langchain/text_splitter");
const lcEmbeddings = require("langchain/embeddings/openai");
const lcMemory = require("langchain/vectorstores/memory");
const lcChains = require("langchain/chains");
const request = require("request");
const fs = require("fs");

const pineconeKey = process.env.PINECONE_API_KEY;
const openAIKey = process.env.OPENAI_API_KEY;

const pineconeClient = new pinecone.PineconeClient();
pineconeClient.init({
    environment: "gcp-starter",
    apiKey: pineconeKey
})
const llm = new lcOpenAI.ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0 });

//let docs, vectorStore, vectorStoreRetriever, chain;

//const text = fs.readFileSync("cdm_book.txt", "utf8");
//const textSplitter = new lcTextSplitter.RecursiveCharacterTextSplitter({ chunkSize: 500 });

const askChatGPT = async (prompt) => {
    const response = await llm.predict(prompt);
    return response;
}

const askChatGPTbasedOnBook = async (prompt) => {
    const response = await chain.call({ query: prompt });
    return response;
}

const getDescription = (url) => {
    let description;
    request(url, {}, (error, response, body) => {
        if (error) {
            console.log(error);
        }
        let $ = cheerio.load(body);
        description = $('meta[property="og:description"]').attr("content");
        if (description == undefined) {
            description = summary($("html").text());
        }
    });
    return description;
}


const getEmbeddings = async (input) => {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + openAIKey
        },
        method: "POST",
        body: JSON.stringify({
            "input": input,
            "model": "text-embedding-ada-002"
        })
    });
    return response.json();
}

const queryIndex = async (vector) => {
    const index = pineconeClient.Index("categories-and-descriptions");
    const queryRequest = {
        vector: vector,
        topK: 1,
        includeValues: true,
        includeMetadata: true
    };
    const response = await index.query({ queryRequest });
    return response;
}

const mapProduct = (input) => {
    
}

const go = async () => {
    const app = express();
    app.get("/app", (req, res) => {
        fs.readFile("app.html", "utf8", async (error, pageHTML) => {
            if (req.query.product == null) {
              res.send(pageHTML);
              return;
            }
            if (error) {
              console.log(error);
              return;
            }

            const embedding = await getEmbeddings(req.query.product);
            const response = await queryIndex(embedding["data"][0]["embedding"]);
            
            let root = HTMLParser.parse(pageHTML);
            root.getElementById("explanation").innerHTML = response.matches[0].metadata.category;
            res.send(root.toString());
          });
    });
    app.listen(8080);
}

go();