import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const COMMENTS_KEY = "kanekiq:comments";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  try {
    const data = await redis.get(COMMENTS_KEY);
    const comments = Array.isArray(data) ? data : [];
    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Ошибка сервера" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const author = String(body?.author ?? "").trim();
    const text = String(body?.text ?? "").trim();

    if (!author || !text) {
      return new Response(
        JSON.stringify({ error: "Имя и комментарий обязательны" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const comment = {
      author,
      text,
      date: new Date().toLocaleString("ru-RU"),
    };

    const data = await redis.get(COMMENTS_KEY);
    const comments = Array.isArray(data) ? data : [];
    comments.unshift(comment);
    await redis.set(COMMENTS_KEY, comments);

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Ошибка сервера" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
