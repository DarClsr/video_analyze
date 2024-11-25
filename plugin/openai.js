const OpenAI = require("openai");
const openai = new OpenAI({
  baseURL: process.env.BASEURL,
  apiKey:  process.env.APIKEY,
});
require('dotenv').config();

const sendMessage = async () => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: "Write a haiku about recursion in programming.",
      },
    ],
  });

  console.log(completion.choices[0].message);
};

const ananlyeVideoItem = async (base64_image) => {
  const completion = await openai.chat.completions.create({
    // model: "gpt-4-vision-preview",
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "图片分析助手" },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "请简洁描述所涉及内容，不要出现类似 “画面”“元素”“场景” 等指代所给内容的词汇，就如同直接描述一件事或一个情况那样，之后再给出 3 至 5 个贴合该描述的简洁标签",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64_image}`,
            },
          },
        ],
      },
    ],
  });
  return {
    msg: completion.choices[0].message,
  };
};

const createScript = async (list) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "你是一个电影脚本生成工具" },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `以下是我的一段数据，其中涵盖了主要场景的详细内容以及对应的时间信息。请帮我对这些数据进行整合与归纳，并将其整理成一个脚本，要求各部分时长保持一致。
            ’请返回一个标准的JSON数组格式的数据，如["details":{"time_range": "value1", "content": "value2","tags":"value3"}]。仅生成JSON数据，不能有其它文本或附加信息,层级不能太深。
            `,
          },
          {
            type: "text",
            text: list
              .map((v) => {
                return `${v.timestamp}: ${v.msg.content}`;
              })
              .join("\n"),
          },
        ],
      },
    ],
  });
  return {
    script_info: completion.choices[0].message,
  };
};
module.exports = {
  sendMessage,
  ananlyeVideoItem,
  createScript,
};
