const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const { readdir, unlinkSync, readdirSync } = require('fs');

// 获取视频信息
function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      const fps = eval(metadata.streams[0].r_frame_rate);
      resolve({ duration, fps });
    });
  });
}

// 计算帧时间点
function calculateFrameTimestamps(duration, fps, interval = 1) {
  const totalFrames = Math.floor(duration * fps);
  const timestamps = [];

  for (let frame = 0; frame < totalFrames; frame += interval) {
    const timestamp = (frame / fps).toFixed(2);
    timestamps.push(timestamp);
  }

  return timestamps;
}

// 执行帧提取
function captureFrames(videoPath, outputDir, timestamps) {
  return new Promise((resolve,reject)=>{
    let result=[]

    timestamps.forEach((timestamp, index) => {
        const outputFile = `${outputDir}/frame-${index}.png`;
        const command = `ffmpeg -i "${videoPath}"  -ss ${timestamp} -vf scale=iw/2:ih/2 -vframes 1 "${outputFile}"`;
    
        exec(command, (error) => {
          if (error) {
            console.error(`帧 ${index} 提取失败:`, error.message);
            reject(error.message)
          } else {
            console.log(`帧 ${index} 提取完成: ${outputFile}`,timestamp);
            result.push({
                index,
                timestamp,
                outputFile
            })

            if(result.length==timestamps.length) {
                resolve(result)
            }
          }
        });

      
      });
  })
}

const clearDir=(dir)=>{
    const files=readdirSync(dir);
    for(let file of files){
        unlinkSync(`./${dir}/${file}`)
    }
}


 const formatePath = (path) => {
    return path.replace(/\\/g, "\\\\");
  };


const getVideoFrameInfo=async (filepath)=>{
    const videoPath = formatePath(filepath);
    console.log({
        videoPath
    })
    const outputDir = './frames';
  clearDir(outputDir)
  console.log(2222)
    try {
        const { duration, fps } = await getVideoInfo(videoPath);
        console.log(`视频时长: ${duration}s, 帧率: ${fps}fps`);
    
        const timestamps = calculateFrameTimestamps(duration, fps, fps * 2); // 每 30 帧截取
        console.log('截取时间点:', timestamps);
        const data=await captureFrames(videoPath, outputDir, timestamps);
        return data;
      } catch (err) {
        console.error('处理失败:', err.message);
      }
}

module.exports  = {
    getVideoFrameInfo
}
