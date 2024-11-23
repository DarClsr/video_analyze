const OpenAI = require("openai");
const openai = new OpenAI({
  baseURL: "https://api.gptgod.online/v1/",
  apiKey: "sk-E1c2iWjeGfCI4fIMdxFI95AppGd1SmzGCnoH8xnGbsRpY8p0",
});

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
    model: "gpt-4-vision-preview",
    messages: [
      { role: "system", content: "图片分析助手" },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "这是我想要上传的视频中的关键画面，请归纳图片内容，内容尽量简洁一些，不超过100字",
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
            text: `以下是我的一段数据，其中涵盖了主要场景的详细内容以及对应的时间信息。请帮我对这些数据进行整合与归纳，并将其整理成一个脚本，要求各部分时长保持一致。返回格式是数组，方便在table中展示，请以文本形式返回结果，每行内容格式是
            ’请返回一个标准的JSON数据，如{“time_range”: “value1”, “content”: “value2”}。仅生成JSON格式的数据，不能有其它文本或附加信息。
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
