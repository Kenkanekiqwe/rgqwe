import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const LIKES_KEY = "kanekiq:likes";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function likedSetKey(commentId) {
  return `kanekiq:liked:${commentId}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const commentId = String(body?.commentId ?? "").trim();
    const fingerprint = String(body?.fingerprint ?? "").trim();

    if (!commentId) {
      return new Response(
        JSON.stringify({ error: "commentId обязателен" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const setKey = likedSetKey(commentId);
    const alreadyLiked = fingerprint
      ? await redis.sismember(setKey, fingerprint)
      : false;

    if (alreadyLiked) {
      const count = parseInt((await redis.hget(LIKES_KEY, commentId)) || "0", 10);
      return new Response(JSON.stringify({ likes: count, alreadyLiked: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const count = await redis.hincrby(LIKES_KEY, commentId, 1);
    if (fingerprint) {
      await redis.sadd(setKey, fingerprint);
    }

    return new Response(JSON.stringify({ likes: count, alreadyLiked: false }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Ошибка сервера" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
