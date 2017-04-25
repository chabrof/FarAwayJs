import * as http from "http"
import * as url from "url"
import * as path from "path"
import * as fs from "fs"

let port :string = process.argv[2] || "8888";

http.createServer(function(request, response) {

let uri = url.parse(request.url).pathname
let filename = path.join(process.cwd(), uri)

fs.exists(filename,
  (exists) => {
    if (!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary",
      (err, file) => {
        if (err) {
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }

        response.writeHead(200);
        response.write(file, "binary");
        response.end();
      } );
    });
  })
  .listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
