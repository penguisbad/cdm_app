const fs = require("fs");

let data = fs.readFileSync("volume3.txt", {encoding: "utf8", flag: "r"});
let textToWrite = "";
let lines = data.split("\r\n");

for (let i = 0; i < lines.length; i++) {
    if (lines[i] == "TAG Cyber Controls") {
        textToWrite += lines[i+1] + "|";
    }
    if (lines[i] == "Brief Overview") {
        for (let j = i+1; j < lines.length; j++) {
            if (lines[j] == "Headquarters") {
                break;
            }
            textToWrite += lines[j] + " ";
            
        }
        textToWrite += "\n";
    }
}
console.log(textToWrite);
fs.writeFile("categoriesAndDescriptions.txt", textToWrite, "utf8", (error) => {
    if (error) {
        console.log(error);
    }
});