const { readFileSync, writeFileSync } = require("fs");
const {
  sendMessage,
  ananlyeVideoItem,
  createScript,
} = require("./plugin/openai");
const { getVideoFrameInfo } = require("./utils");

const ananlyeVideo = async (filepath) => {
  console.log(filepath);
  const video_info = await getVideoFrameInfo(filepath);

  let list = [];

  for (let item of video_info.slice(0, 3)) {
    const base64_image = readFileSync(item.outputFile, "base64");
    const image_desc = await ananlyeVideoItem(base64_image);

    console.log("处理图片", item.outputFile,item.timestamp);

    list.push({
      ...item,
      ...image_desc,
    });
  }
  const script = await createScript(list);



  let input_text = script.script_info.content;


  writeFileSync("./script.txt", script.script_info.content, "utf-8");

  let result_list=[]
 try{
    const info=JSON.parse(input_text)

    if(info.messages && Array.isArray(info.messages)){
        const d=info.messages[0]
        if(typeof d.content === "string"){
            console.log(d.content)
            const s=JSON.parse(d.content)
            result_list=s;
        }else {
            if(Array.isArray(d.content)){
                result_list=d.content;
            }
            console.log(d.content,'con')
        }
    }
 }catch(e){
    let r=input_text;
    const fixedContent = r.replace(/\\"/g, '"');
    console.log(fixedContent)
    const contentArray = JSON.parse(fixedContent);
    console.log(contentArray);
    console.log("json解析错误",{
        r
    },e)
 }

 return result_list.map((v,index)=>{
    const cover=video_info[index]?.outputFile;
    return {
        ...v,
        cover
    }
 })

};

module.exports = {
  ananlyeVideo,
};
