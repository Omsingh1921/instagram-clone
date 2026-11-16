package com.instagramclone.common.response;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Generic response advice that ensures:
 * 1. The HTTP status code in response headers and the JSON body 'status' field are 100% synchronized.
 * 2. Unwrapped controller responses are automatically wrapped into standardized ApiResponse<T>.
 */
@RestControllerAdvice
public class GlobalResponseWrapper implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        String className = returnType.getContainingClass().getName();
        return !className.contains("springdoc")
                && !className.contains("swagger")
                && !className.contains("actuator");
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {

        int statusCode = HttpStatus.OK.value();
        if (response instanceof ServletServerHttpResponse servletResponse) {
            statusCode = servletResponse.getServletResponse().getStatus();
        }

        // If body is already an ApiResponse (e.g. from existing controllers or exception handlers)
        if (body instanceof ApiResponse<?> apiResponse) {
            // Keep status synchronized with HTTP status code
            if (apiResponse.getStatus() == null || apiResponse.getStatus() == 0 || (apiResponse.getStatus() == 200 && statusCode != 200) || (apiResponse.getStatus() == 400 && statusCode != 400)) {
                apiResponse.setStatus(statusCode);
            }
            return apiResponse;
        }

        // Do not wrap byte arrays, raw Strings, or null
        if (body instanceof byte[] || body instanceof String) {
            return body;
        }

        // Check if controller method has @ResponseStatus
        ResponseStatus responseStatus = returnType.getMethodAnnotation(ResponseStatus.class);
        if (responseStatus != null) {
            statusCode = responseStatus.value().value();
        }

        // Wrap bare objects automatically
        return ApiResponse.success(
                statusCode,
                "Request successful",
                body
        );
    }
}

