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

function fnv1a(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export async function GET() {
  try {
    const [data, likesData] = await Promise.all([
      redis.get(COMMENTS_KEY),
      redis.hgetall(LIKES_KEY),
    ]);
    const storedComments = Array.isArray(data) ? data : [];
    const likesMap = likesData && typeof likesData === "object" ? likesData : {};
    let changed = false;

    const normalized = storedComments.map((c) => {
      if (c && typeof c === "object" && c.id) return c;
      const base = `${c?.author ?? ""}|${c?.text ?? ""}|${c?.date ?? ""}`;
      const id = `c_${fnv1a(base)}`;
      changed = true;
      return { ...(c && typeof c === "object" ? c : {}), id };
    });

    if (changed) {
      await redis.set(COMMENTS_KEY, normalized);
    }

    const merged = normalized.map((c) => {
      const id = c.id;
      const likes = parseInt(likesMap[id] || "0", 10) || 0;
      return { ...c, likes };
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
