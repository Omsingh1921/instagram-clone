package com.instagramclone.config;

import com.instagramclone.ratelimit.WebSocketRateLimitInterceptor;
import com.instagramclone.security.filter.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;
    private final WebSocketRateLimitInterceptor webSocketRateLimitInterceptor;
    private final CorsConfig corsConfig;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Destination prefixes for subscribers
        registry.enableSimpleBroker("/topic", "/queue");
        // Destination prefix for messages routed to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        CorsConfiguration baseCorsConfig = corsConfig.buildBaseCorsConfiguration();
        HandshakeInterceptor dynamicOriginInterceptor = new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(
                    ServerHttpRequest request,
                    ServerHttpResponse response,
                    WebSocketHandler wsHandler,
                    Map<String, Object> attributes) {
                String origin = request.getHeaders().getOrigin();
                if (!corsConfig.isWebSocketOriginAllowed(origin, baseCorsConfig)) {
                    log.warn("Rejected WebSocket handshake from disallowed origin: {}", origin);
                    response.setStatusCode(HttpStatus.FORBIDDEN);
                    return false;
                }
                return true;
            }

            @Override
            public void afterHandshake(
                    ServerHttpRequest request,
                    ServerHttpResponse response,
                    WebSocketHandler wsHandler,
                    Exception exception) {
                // No-op
            }
        };

        // Allow HandshakeInterceptor to evaluate dynamic runtime origins cleanly without static startup lockout
        registry.addEndpoint("/ws")
                .addInterceptors(dynamicOriginInterceptor)
                .setAllowedOriginPatterns("*")
                .withSockJS();

        registry.addEndpoint("/ws")
                .addInterceptors(dynamicOriginInterceptor)
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Enforce JWT Auth first, then enforce rate limiting on authenticated sessions
        registration.interceptors(webSocketAuthInterceptor, webSocketRateLimitInterceptor);
    }
}
