const http = require("node:http");
const { version } = require("../package.json");

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
     res.setHeader("Allow", "GET");
     res.writeHead(405);
     return res.end(JSON.stringify({
       error: "Method not allowed"
     }));
 }
  if (req.url === "/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({
      status: "healthy"
    }));
  }

  if (req.url === "/") {
    res.writeHead(200);
    return res.end(JSON.stringify({
      application: "DevOps Practicum",
      version,
      message: "Deployment successful"
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

if (require.main === module) {
  server.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
  });
}

module.exports = server;
