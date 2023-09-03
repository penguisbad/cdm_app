const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");

const getPage = (url, func) => {
    request(url, {}, (error, response, body) => {
        if (error) {
            console.log(error);
        } else {
            func(body);
        }
    });
}

const getDomainsFromHTML = (html) => {
    let domains = [];
    let $ = cheerio.load(html);
    $("a").each((i, el) => {
        domains.push(el.attribs.href);
    });
    for (let i = 0; i < domains.length; i++) {
        let domain = domains[i];
        if (domain == "https://www.cyberbit.com/") {
            continue; // cyberbit doesnt work for some reason;
        }
        getPage(domain, (body) => {
            $ = cheerio.load(body);
            let description = $('meta[property="og:description"]').attr("content");
            if (description != undefined) {
                console.log(domain + "|" + description);
                fs.appendFile("domainAndDescriptions.txt", domain + "|" + description + "\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
            
        });
    }
    
}

fs.readFile("domainsHTML1.html", "utf8", async (error, content) => getDomainsFromHTML(content));
fs.readFile("domainsHTML2.html", "utf8", async (error, content) => getDomainsFromHTML(content));
