/*

*/

const pinecone = require("@pinecone-database/pinecone");
const cheerio = require("cheerio");
const express = require("express");
const langchain = require("langchain");
const request = require("request");
const fs = require("fs");

const openAIKey = process.env.OEPN_AI_KEY;
const pineconeKey = process.env.PINECONE_API_KEY;

const pineconeClient = new pinecone.PineconeClient();
pineconeClient.init({
    environment: "gcp-starter",
    apiKey: pineconeKey
})
const llm = new langchain.OpenAI({
    temperature: 0
});
const text = fs.readFileSync("test.txt", "utf8");
const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
const docs = await textSplitter.createDocuments([text]);

const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());

const vectorStoreRetriever = vectorStore.asRetriever();

const chain = RetrievalQAChain.fromLLM(llm, vectorStoreRetriever);

const askChatGPT = async (prompt) => {
    const response = await llm.predict(prompt);
    return response;
}

const mapProduct = (input)

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
    const index = pineconeClient.Index("cdm-index");
    const queryRequest = {
        vector: vector,
        topK: 5,
        includeValues: true,
        includeMetadata: true
    };
    const response = await index.query({ queryRequest });
    return response;
}