const express = require("express");
const fs = require("fs");
const HTMLParser = require("node-html-parser");

const app = express();

const apiKey = process.env.OPENAI_API_KEY;

const query = async (prompt, temperature) => {
  let response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": prompt}],
      "temperature": temperature,
      "max_tokens": 100
    })
  });
  return response.json();
}

const mapProduct = async (product) => {
  let response = await query('Which of the five NIST framework functions does ' + product +' perform? Answer "Identify", "Protect", "Detect", "Respond" or "Recover" and choose only one answer.', 0);
  let textResponse = response.choices[0].message.content;
  let xAxis = "";
  console.log(response, textResponse);
  ["Identify", "Protect", "Detect", "Respond", "Recover"].forEach(element => {
    if (textResponse.includes(element)) {
      xAxis = element;
    }
  });
  response = await query('Explain very briefly how ' + product + ' performs the "' + xAxis + '" of the NIST framework', 0.3);
  console.log(response)
  let xAxisExplanation = response.choices[0].message.content;

  response = await query('What does ' + product + ' protect? Answer "Devices", "Applications", "Networks", "Data", or "Users" and choose only one answer.', 0);
  textResponse = response.choices[0].message.content;
  let yAxis = "";
  console.log(response, textResponse);
  ["Devices", "Applications", "Networks", "Data", "Users"].forEach(element => {
    if (textResponse.includes(element)) {
      yAxis = element;
    }
  });
  response = await query('Explain very briefly how ' + product + ' protects ' + yAxis, 0.3);
  console.log(response);
  let yAxisExplanation = response.choices[0].message.content;

  return [[xAxis, yAxis], [xAxisExplanation, yAxisExplanation]];
}

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
    //let coordinates = [["Identify", "Users"]];
    let coordinates = await mapProduct(req.query.product);
    let elementId = coordinates[0][0] + "-" + coordinates[0][1];
    let root = HTMLParser.parse(pageHTML);
    root.getElementById(elementId).rawAttrs += ' style="background-color: green"';
    root.getElementById("explanation").innerHTML = coordinates[1][0] + "<br>" + coordinates[1][1];
    
    res.send(root.toString());
  });
  
});
app.listen(8080);
