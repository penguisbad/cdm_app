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
const request = require("request");
const fs = require("fs");

const pineconeKey = process.env.PINECONE_API_KEY;
const openAIKey = process.env.OPENAI_API_KEY;

const pineconeClient = new pinecone.PineconeClient();
pineconeClient.init({
    environment: "gcp-starter",
    apiKey: pineconeKey
})

const askChatGPT = async (prompt, temperature) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
            "Authorization": "Bearer " + openAIKey,
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature
        })
    });
    return response;
}

const summary = async (input) => {
    console.log(input);
    let response = await askChatGPT("Give of a short summary of this: " + input, 0);
    return response.choices[0].message.content;
}

const getDescription = async (url, func) => {
    request(url, {}, async (error, response, body) => {
        if (error) {
            console.log(error);
        }
        
        let $ = cheerio.load(body);
        let description = $('meta[property="og:description"]').attr("content");
        if (description == undefined) {
            //description = await summary($("html").text());
        }
        func(description);
    });
}


const getEmbeddings = async (input) => {
    console.log(input);
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

const mapCategory = (input) => {
    
}

const go = () => {
    const app = express();
    app.get("/app", (req, res) => {
        fs.readFile("app.html", "utf8", async (error, pageHTML) => {
            if (req.query.url == null) {
              res.send(pageHTML);
              return;
            }
            if (error) {
              console.log(error);
              return;
            }

            await getDescription(req.query.url, async (description) => {
                const embedding = await getEmbeddings(description);
                
                const response = await queryIndex(embedding["data"][0]["embedding"]);
                
                let root = HTMLParser.parse(pageHTML);
                root.getElementById("explanation").innerHTML = response.matches[0].metadata.category;
                res.send(root.toString());
            });
        });
    });
    app.listen(8080);
}

go();