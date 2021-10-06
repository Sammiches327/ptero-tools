/**
 * ************************************************************************************
 * 
 * ptero-tools
 * @version v1.0.0
 * @author Sammiches327
 * 
 * ************************************************************************************
 */

const https = require("https");
const prompt = require("prompt-sync")();

const connection_url = prompt('Connection URL (plain, without http or https): ');
const api_key = prompt('API Key: ');
const page_num = prompt('Server Page Number: ');

var ops1 = {
    'method': 'GET',
    'hostname': `${connection_url}`,
    'path': '/api/application/nodes',
    'headers': {
      'Authorization': `Bearer ${api_key}`
    },
    'maxRedirects': 20
};

var ops2 = {
    'method': 'GET',
    'hostname': `${connection_url}`,
    'path': `/api/application/servers?page=${page_num}`,
    'headers': {
      'Authorization': `Bearer ${api_key}`
    },
    'maxRedirects': 20
};

var req = https.request(ops1, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
        chunks.push(chunk);
    });

    res.on("end", function (chunk) {
        console.log("Listing Nodes...\n");

        var body = JSON.parse(Buffer.concat(chunks));
        for (var i in body.data){
            var node = {
                "id": `${body.data[i].attributes.id}`,
                "name": `${body.data[i].attributes.name}`,
                "description": `${body.data[i].attributes.description}`,
                "uuid": `${body.data[i].attributes.uuid}`,
            }

            console.log(node);
        }

        var node_option = prompt('Select a node ID (not uuid) based on the names/description above: ');
        var confirmation = prompt(`You selected node with ID ${node_option}. Please confirm this is the correct node by typing "yes": `);
        if (confirmation === "yes") {
            var confirmation2 = prompt(`THIS MAY RESULT IN PERMANENT DATA LOSS. PLEASE TYPE "YES" TO CONFIRM: `);
            if (confirmation2 === "YES") {
                var req2 = https.request(ops2, function (res2) {
                    var chunks2 = [];

                    res2.on("data", function (chunk2) {
                        chunks2.push(chunk2);
                    });

                    res2.on("end", function (chunk) {
                        var body2 = JSON.parse(Buffer.concat(chunks2));
                        var count = 0;
                        for (var j in body2.data) {
                            if (body2.data[j].attributes.node == node_option) {
                                count++;

                                console.log({
                                    "server": {
                                        "name": body2.data[j].attributes.name,
                                        "description": body2.data[j].attributes.description,
                                        "uuid": body2.data[j].attributes.uuid,
                                        "id": body2.data[j].attributes.id,
                                    }
                                });

                                var req3 = https.request({
                                    'method': 'DELETE',
                                    'hostname': `${connection_url}`,
                                    'path': `/api/application/servers/${body2.data[j].attributes.id}/force`,
                                    'headers': {
                                        'Authorization': `Bearer ${api_key}`
                                    },
                                    'maxRedirects': 20
                                }, function (res3) {
                                    var chunks3 = [];

                                    res3.on("data", function (chunk3) {
                                        chunks3.push(chunk3);
                                    });

                                    res3.on("error", function (error3) {
                                        console.error(error3);
                                    });
                                });

                                req3.end();
                            }
                        }
                        
                        console.log(`Deleted ${count} servers from the panel forcibly.`);
                    });

                    res2.on("error", function (error2) {
                        console.error(error2);
                    });
                });

                req2.end();
            } else {
                console.log("Quitting...");
            }
        } else {
            console.log("Quitting...");
        }
    });

    res.on("error", function (error) {
        console.error(error);
    });
});
  
req.end();