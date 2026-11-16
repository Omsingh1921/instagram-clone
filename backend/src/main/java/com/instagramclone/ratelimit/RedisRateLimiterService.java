package com.instagramclone.ratelimit;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dedicated Leaky Bucket Rate Limiter Service.
 *
 * Implements the Leaky Bucket algorithm using Redis HMGET/HMSET with an atomic Lua script:
 * - Capacity: maximum burst volume of the bucket (limit)
 * - Leak Rate: continuous constant rate of water draining (capacity / windowMillis)
 * - Guarantees smooth, non-bursty traffic output and O(1) constant Redis memory usage.
 * - Provides an in-memory Leaky Bucket fallback cache if Redis is temporarily unreachable.
 */
@Service
@RequiredArgsConstructor
public class RedisRateLimiterService implements IRateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimiterService.class);

    private final StringRedisTemplate stringRedisTemplate;

    // Redis Lua script for atomic Leaky Bucket rate limiting
    private static final String LEAKY_BUCKET_LUA =
            "local key = KEYS[1]\n" +
            "local now = tonumber(ARGV[1])\n" +
            "local capacity = tonumber(ARGV[2])\n" +
            "local windowMillis = tonumber(ARGV[3])\n" +
            "\n" +
            "local leakRate = capacity / windowMillis\n" +
            "\n" +
            "local data = redis.call('HMGET', key, 'water', 'lastLeak')\n" +
            "local water = tonumber(data[1]) or 0\n" +
            "local lastLeak = tonumber(data[2]) or now\n" +
            "\n" +
            "local delta = math.max(0, now - lastLeak)\n" +
            "local leaked = delta * leakRate\n" +
            "water = math.max(0, water - leaked)\n" +
            "\n" +
            "if water + 1 <= capacity then\n" +
            "    water = water + 1\n" +
            "    redis.call('HMSET', key, 'water', water, 'lastLeak', now)\n" +
            "    local ttlMillis = math.max(1000, math.ceil((water / leakRate) + 1000))\n" +
            "    redis.call('PEXPIRE', key, ttlMillis)\n" +
            "    local remaining = math.max(0, math.floor(capacity - water))\n" +
            "    local resetSeconds = math.max(1, math.ceil((water / leakRate) / 1000))\n" +
            "    return {1, remaining, 0, math.floor(water), resetSeconds}\n" +
            "else\n" +
            "    local overflow = (water + 1) - capacity\n" +
            "    local retryAfter = math.max(1, math.ceil((overflow / leakRate) / 1000))\n" +
            "    local resetSeconds = math.max(1, math.ceil((water / leakRate) / 1000))\n" +
            "    return {0, 0, retryAfter, math.floor(water), resetSeconds}\n" +
            "end";

    private static final DefaultRedisScript<List> SCRIPT =
            new DefaultRedisScript<>(LEAKY_BUCKET_LUA, List.class);

    /**
     * In-memory Leaky Bucket fallback cache if Redis is temporarily unreachable.
     */
    private final ConcurrentHashMap<String, InMemoryLeakyBucket> fallbackCache = new ConcurrentHashMap<>();

    @Override
    public RateLimitResult checkRateLimit(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowMillis = Math.max(1000L, windowSeconds * 1000L);

        try {
            List<?> rawResult = stringRedisTemplate.execute(
                    SCRIPT,
                    Collections.singletonList(key),
                    String.valueOf(now),
                    String.valueOf(limit),
                    String.valueOf(windowMillis)
            );

            if (rawResult != null && rawResult.size() >= 5) {
                boolean allowed = ((Number) rawResult.get(0)).longValue() == 1L;
                long remaining = ((Number) rawResult.get(1)).longValue();
                long retryAfter = ((Number) rawResult.get(2)).longValue();
                long currentCount = ((Number) rawResult.get(3)).longValue();
                long resetSeconds = ((Number) rawResult.get(4)).longValue();

                return RateLimitResult.builder()
                        .allowed(allowed)
                        .currentCount(currentCount)
                        .limit(limit)
                        .remaining(remaining)
                        .retryAfterSeconds(retryAfter)
                        .resetSeconds(resetSeconds)
                        .build();
            }
        } catch (Exception ex) {
            log.warn("Redis unavailable during Leaky Bucket rate limit check for key [{}]: {}. Using in-memory fallback.",
                    key, ex.getMessage());
            return checkFallback(key, limit, windowMillis, now);
        }

        // Default allow if script returns unexpected structure
        return RateLimitResult.builder()
                .allowed(true)
                .currentCount(1)
                .limit(limit)
                .remaining(Math.max(0, limit - 1))
                .retryAfterSeconds(0)
                .resetSeconds(windowSeconds)
                .build();
    }

    private RateLimitResult checkFallback(String key, int limit, long windowMillis, long now) {
        InMemoryLeakyBucket bucket = fallbackCache.computeIfAbsent(key, k -> new InMemoryLeakyBucket());
        return bucket.check(now, limit, windowMillis);
    }

    public void clearLimits() {
        fallbackCache.clear();
        if (stringRedisTemplate != null) {
            try {
                java.util.Set<String> keys = stringRedisTemplate.keys("rate_limit:*");
                if (keys != null && !keys.isEmpty()) {
                    stringRedisTemplate.delete(keys);
                }
            } catch (Exception ex) {
                log.warn("Error clearing rate limit keys in Redis: {}", ex.getMessage());
            }
        }
    }

    /**
     * Thread-safe in-memory Leaky Bucket accumulator.
     */
    private static class InMemoryLeakyBucket {
        private double water = 0.0;
        private long lastLeak = System.currentTimeMillis();

        public synchronized RateLimitResult check(long now, int limit, long windowMillis) {
            double leakRate = (double) limit / (double) windowMillis;
            long delta = Math.max(0, now - lastLeak);
            double leaked = delta * leakRate;
            water = Math.max(0.0, water - leaked);
            lastLeak = now;

            if (water + 1.0 <= limit) {
                water += 1.0;
                long remaining = Math.max(0, (long) Math.floor(limit - water));
                long resetSeconds = Math.max(1, (long) Math.ceil((water / leakRate) / 1000.0));
                return RateLimitResult.builder()
                        .allowed(true)
                        .currentCount((long) Math.floor(water))
                        .limit(limit)
                        .remaining(remaining)
                        .retryAfterSeconds(0)
                        .resetSeconds(resetSeconds)
                        .build();
            } else {
                double overflow = (water + 1.0) - limit;
                long retryAfter = Math.max(1, (long) Math.ceil((overflow / leakRate) / 1000.0));
                long resetSeconds = Math.max(1, (long) Math.ceil((water / leakRate) / 1000.0));
                return RateLimitResult.builder()
                        .allowed(false)
                        .currentCount((long) Math.floor(water))
                        .limit(limit)
                        .remaining(0)
                        .retryAfterSeconds(retryAfter)
                        .resetSeconds(resetSeconds)
                        .build();
            }
        }
    }
}
