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

  for (let item of video_info.slice(0, 1)) {
    const base64_image = readFileSync(item.outputFile, "base64");
    const image_desc = await ananlyeVideoItem(base64_image);

    console.log("处理图片", item.outputFile, item.timestamp);

    list.push({
      ...item,
      ...image_desc,
    });
  }
  const script = await createScript(list);

  let input_text = script.script_info.content;

  writeFileSync("./script.txt", script.script_info.content, "utf-8");

  let result_list = [];
  try {
    const info = JSON.parse(input_text);
    console.log({
      ...info,
      script
    });

    if(Array.isArray(info)){
        result_list = content;
    }

    if (info && info.messages && Array.isArray(info.messages)) {
      const content = info.messages[0].content;
      if (Array.isArray(content)) {
        result_list = content;
      }

      if(typeof content == "string"){
        result_list=JSON.parse(content)
      }
    }
  } catch (e) {
    let r = input_text;

    console.log(
      {
        r,
        script,
      },
      "json 解析出错"
    );
  }

  return result_list.map((v, index) => {
    const cover = video_info[index]?.outputFile;
    return {
      ...v,
      cover,
    };
  });
};

module.exports = {
  ananlyeVideo,
};
