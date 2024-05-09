import { createServer } from "node:http";

let stash: any[] = []; // Added explicit type annotation

// is app is in development mode or if origin is wago then allow the request
function allowRequest(req: any): boolean { // Added explicit type annotations
  if (
    process.env.NODE_ENV === "development" ||
    req.headers.origin === "https://wago.io"
  ) {
    return true;
  }
  return false;
}

// parse post data into JSON object
function getPostData(req: any, callback: (json: any | null) => void): void { // Added explicit type annotations
  let body = "";

  req.on("data", (chunk: any) => { // Added explicit type annotations
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const json = JSON.parse(body);
      return callback(json);
    } catch (e) {
      return callback(null);
    }
  });
}

function LocalServerRequestHandler(req: any, res: any): void { // Added explicit type annotations
  // make sure this request is allowed
  if (!allowRequest(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    return res.end("{ 'result': 'no' }");
  }

  // if browser is doing a CORS check then allow it
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-origin": req.headers.origin,
    });
    return res.end();
  }

  // otherwise it should be a POST, parse and process the data
  if (req.method === "POST") {
    getPostData(req, (body: any | null) => { // Added explicit type annotations
      // console.log(body);
      if (body && body.action === "Add-Import") { // Added null check for body
        const match = body.url.match(/(https:\/\/wago.io\/)([^/]+)/);
        const slug = match ? match[2] : ""; // Added null check for match

        if (stash.findIndex((aura) => aura.url === body.url) === -1)
          stash.push({
            name: body.name,
            encoded: body.import,
            slug,
            user: body.user,
            version: body.version,
          });
      }

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Origin": req.headers.origin,
      });
      return res.end("{'success': true}");
    });
  } else {
    // method not allowed
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end("{'result': 'no'}");
  }
}
const localServer = createServer(LocalServerRequestHandler);
const localServerPort = 24642;

export function start(v: any[]): void { // Added explicit type annotations
  stash = v;
  localServer.listen(localServerPort, "127.0.0.1");
}

export function stop(): void { // Added explicit type annotations
  localServer.close();
}
