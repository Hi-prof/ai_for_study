package com.hiprof.core.chat

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.server.standard.ServerEndpointExporter


@Configuration
open class WebSocketConfiguration {

    @Bean
    open fun serverEndpointExporter() : ServerEndpointExporter? {
//        val serverEndpointExporter = ServerEndpointExporter()
//        // 手动注册 WebSocket 端点
//        serverEndpointExporter.setAnnotatedEndpointClasses(EchoChannel::class.java)

        return ServerEndpointExporter()
    }

}