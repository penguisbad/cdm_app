const pinecone = require("@pinecone-database/pinecone");
const fs = require("fs");

const openAIKey = process.env.OPENAI_API_KEY;
const pineconeKey = process.env.PINECONE_API_KEY;

const getEmbeddings = async (input) => {
    let response = await fetch("https://api.openai.com/v1/embeddings", {
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

const go = async () => {
    const pineconeClient = new pinecone.PineconeClient();
    await pineconeClient.init({
        environment: "gcp-starter",
        apiKey: pineconeKey
    });
    const index = pineconeClient.Index("categories-and-descriptions");
    
    console.log("reading file");
    let data = fs.readFileSync("categoriesAndDescriptions.txt", "utf8");
    let lines = data.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const lineSplit = lines[i].split("|");
        const response = await getEmbeddings(lineSplit[1]);
        console.log(response);
        if (response["data"] == undefined) {
            continue;
        }
        const vector = {
            id: "vector" + i,
            values: response["data"][0]["embedding"],
            metadata: {
                category: lineSplit[0]
            }
        };
        const upsertRequest = {
            vectors: [vector]
        };
        const upsertReponse = await index.upsert({ upsertRequest });
        console.log(upsertReponse);
    }
}

go();