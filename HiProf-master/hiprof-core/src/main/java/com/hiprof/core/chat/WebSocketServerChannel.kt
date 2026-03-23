package com.hiprof.core.chat

import com.hiprof.core.domain.ChatMessages
import jakarta.websocket.*
import jakarta.websocket.server.PathParam
import jakarta.websocket.server.ServerEndpoint
import org.springframework.context.ApplicationContext
import org.springframework.context.ApplicationContextAware
import org.springframework.stereotype.Component


// 使用 @ServerEndpoint 注解表示此类是一个 WebSocket 端点，这个端点由服务器创建因此不在Spring生命周期中因此无法进行自动装配的操作
//可以在 WebSocket 端点上添加 @Component 注解，使用 Spring 自动扫描，这样的话不需要手动调用 setAnnotatedEndpointClasses 方法进行注册。
@Component
@ServerEndpoint(value = "/channel/chat/{userId}")
class WebSocketServerChannel
    : ApplicationContextAware {
    private lateinit var chatSession: Session

    private companion object {
        lateinit var applicationContext: ApplicationContext
    }
    //    实现ApplicationContextAware后在运行时Spring将会提供应用上下文
    override fun setApplicationContext(applicationContext: org.springframework.context.ApplicationContext) {
        WebSocketServerChannel.applicationContext = applicationContext
        //可以从app中获取bean
    }
    //连接打开
    fun getSessionID(): String {
        return chatSession.id
    }

    fun getSession(): Session {
        return chatSession
    }
    @OnOpen
    fun open(
        session: Session,
        @PathParam("userId") userId: String?,
    ) {
        chatSession = session

        val chatSessionId = parseQueryString(session.queryString, 0)

        val webSocketManager = applicationContext.getBean(WebSocketManager::class.java)
        webSocketManager.addWebSocketServer(this, userId?.toLong(),chatSessionId?.toLong())

    }

    // 接收消息
    @OnMessage
    fun onMessage(
        session: Session,
        message: String,
        @PathParam("userId") userId: Long,
    ) {
        if (message == "bye") {
            //正常关闭连接
            chatSession.close(CloseReason(CloseReason.CloseCodes.NORMAL_CLOSURE, "Bye"))
            return
        }
        val chatSessionId = parseQueryString(session.queryString, 0)
        val type = parseQueryString(session.queryString, 1)
        val fileUrl = parseQueryString(session.queryString, 2)

        val webSocketManager = applicationContext.getBean(WebSocketManager::class.java)

        val chatMessages = ChatMessages().also {
            it.sessionId = chatSessionId?.toLong()
            it.contentType = type
            it.content = message
            it.fileUrl = fileUrl
            it.createBy= userId.toString()
        }
        webSocketManager.sendMessage(chatMessages)
    }

    private fun parseQueryString(queryString: String, index: Int): String? {
        val querys = queryString.split("&")
        return querys[index].split("=")[1]
    }

    //连接关闭
    @OnClose
    fun onClose(session: Session,
        @PathParam("userId") userId: Long

    ) {
        println("连接关闭，id:${session.id}")
        val webSocketManager = applicationContext.getBean(WebSocketManager::class.java)

        webSocketManager.removeWebSocketServer(this,userId)
    }

    @OnError
    fun onError(session: Session, error: Throwable) {
        println("连接错误，id:${session.id},error:${error.message}")
    }

}