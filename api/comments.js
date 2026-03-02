import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const COMMENTS_KEY = "kanekiq:comments";
const LIKES_KEY = "kanekiq:likes";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  try {
    const [data, likesData] = await Promise.all([
      redis.get(COMMENTS_KEY),
      redis.hgetall(LIKES_KEY),
    ]);
    const comments = Array.isArray(data) ? data : [];
    const likesMap = likesData && typeof likesData === "object" ? likesData : {};
    const merged = comments.map((c, i) => {
      const id = c.id || `legacy-${i}`;
      const likes = parseInt(likesMap[id] || "0", 10);
      return { ...c, id, likes };
    });
    return new Response(JSON.stringify(merged), {
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
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      author,
      text,
      date: new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }),
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
