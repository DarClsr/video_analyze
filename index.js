const { readFile,existsSync,mkdirSync,writeFileSync, createWriteStream } = require("fs");
const path = require("path");
const http = require("http");
require('dotenv').config();
const Bull = require("bull");
const Redis = require("redis");
const { ananlyeVideo } = require("./frame");
const Busboy = require('busboy');

// 创建 Redis 客户端
const redisClient = Redis.createClient({
    url: `redis://${process.env.REDISHOST}:${process.env.REDISPORT}` // 本地 Redis
});
redisClient.on("error", (err) => console.error("Redis Error:", err));

redisClient.connect()

// 创建 Bull 队列
const taskQueue = new Bull("file-processing", {
  redis: { host: process.env.REDISHOST, port: process.env.REDISPORT },
});

const uploadDirectory = path.join(__dirname, "uploads");
const frameDirectory = path.join(__dirname, "frames");
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory); // 如果目录不存在，则创建
}

if (!existsSync(frameDirectory)) {
    mkdirSync(frameDirectory); // 如果目录不存在，则创建
  }

const server = http.createServer((req, res) => {
  const filePath =
    req.url === "/" ? "./public/index.html" : `./public${req.url}`;
  const ext = path.extname(filePath);

  // 设置 MIME 类型
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";

  // 读取文件

  if(filePath.includes("index.html")){
    readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end("<h1>404 Not Found</h1>");
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        }
      });
  }
  

  const url = req.url;

  console.log({
    url,
  })

  if (req.method === "POST" && req.url === "/upload") {
    handleFileUpload(req, res); // 处理文件上传
  }

  if(req.method === "GET" && req.url.startsWith("/status")) {
    handleTaskStatus(req, res); // 查询任务状态
  }

  if(url.includes("images")){
    const imagepath = req.url.split("images")[1];
    let filePath = path.join(__dirname, imagepath);
    console.log(filePath,'files')
    readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('文件未找到');
        } else {
          const extname = path.extname(filePath);
          console.log({
            extname
          })
          let contentType;
          switch (extname) {
            case '.jpg':
              contentType = 'image/jpeg';
              break;
            case '.png':
              contentType = 'image/png';
              break;
            // 可以添加更多的文件类型判断
            default:
              contentType = 'text/plain';
          }
          res.writeHead(200, {'Content-Type': contentType});
          res.end(data);
        }
      });
  }
});

function handleFileUpload(req, res) {
    const busboy =  Busboy({ headers: req.headers });
  
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(uploadDirectory,filename)
      const filePath = path.join(uploadDirectory, filename.filename);
      console.log(filePath)
      const writeStream = createWriteStream(filePath);
  
      file.pipe(writeStream);
  
      file.on('end', () => {
        // 初始化任务状态到 Redis
        const taskId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        redisClient.set(
          taskId,
          JSON.stringify({ status: 1, details: [] }),
          (err) => {
            if (err) console.error('Error setting task status:', err);
          }
        );
        const jobData = { filePath, fileName:filename.filename, taskId };
        taskQueue.add(jobData);
  
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: 'File uploaded successfully',
            file: `/uploads/${filename.filename}`,
            taskId,
            name:taskId,
          })
        );
      });
    });
  
    req.pipe(busboy);
  }


// 检查任务状态

function handleTaskStatus(req, res) {
    const urlParts = req.url.split("?");
    const queryParams = new URLSearchParams(urlParts[1]);
    const taskId = queryParams.get("id");
  
    if (!taskId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Task ID is required" }));
      return;
    }
    redisClient.get(taskId).then((rs)=>{
        res.writeHead(200, { "Content-Type": "application/json" });
        const result=JSON.parse(rs)
        res.end(JSON.stringify({ taskId, 
            status:result.status,
            details:result.details,
            name:taskId,
         }));
    });
  }

let port = 5000;

server.listen(port, () => {
  console.log("start prot success");
});

// 消息队列处理

taskQueue.process(async (job) => {
    const { filePath, fileName,taskId } = job.data;
  
    try {
      console.log(`Processing file: ${filePath}`);
      // 模拟任务处理（例如压缩视频）
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟耗时任务

      const details=await ananlyeVideo(filePath)

      


      // 更新 Redis 中任务状态为 2（成功）

      console.log("set",taskId,details)
      redisClient.set(taskId,JSON.stringify({
            status:2,
            details:details
      }), (err) => {
        if (err) console.error("更新任务失败", err);
      });
  
      console.log(`执行成功: ${fileName}`);
    } catch (error) {
      console.error(`执行失败: ${fileName}`, error);
  
      // 更新 Redis 中任务状态为 3（失败）
      const taskId = job.id;
      redisClient.set(taskId, JSON.stringify({
        staus:3,
        details:[]
  }), (err) => {
        if (err) console.error("Error updating task status:", err);
      });
  
      throw error;
    }
  })
