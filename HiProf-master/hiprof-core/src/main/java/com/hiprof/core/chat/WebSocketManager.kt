package com.hiprof.core.chat

import com.hiprof.core.domain.ChatMembers
import com.hiprof.core.domain.ChatMessages
import com.hiprof.core.service.IChatMembersService
import com.hiprof.core.service.impl.ChatMessagesServiceImpl
import jakarta.websocket.Session
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet


@Component
class WebSocketManager(
    private val membersService: IChatMembersService,
    private val messageService: ChatMessagesServiceImpl
) {
    private val webSocketServerSet = CopyOnWriteArraySet<WebSocketServerChannel>()
    private val webSocketServerMap = ConcurrentHashMap<String, WebSocketServerChannel>()
    private val userSessionMap = ConcurrentHashMap<Long, Session>()
    fun addWebSocketServer(webSocketServer: WebSocketServerChannel, userId: Long?,chatId: Long?) {

        if(userId == null || chatId == null) throw RuntimeException("无法识别的用户或会话")
        val sessionID = webSocketServer.getSessionID()
        val session = webSocketServer.getSession()
        //取得当前加入会话的成员信息
        val selectChatMembers = membersService.selectChatMembers(chatId, userId)
        selectChatMembers.unreadCount=0
        membersService.updateChatMembers(selectChatMembers)
        webSocketServerSet.add(webSocketServer)
        webSocketServerMap[sessionID] = webSocketServer
        userSessionMap[userId] = session
    }

    fun removeWebSocketServer(webSocketServer: WebSocketServerChannel, userId: Long) {
        webSocketServerSet.remove(webSocketServer)
        webSocketServerMap.remove(webSocketServer.getSessionID())
        userSessionMap.remove(userId)
    }
    //发送消息
    fun sendMessage(chatMessages: ChatMessages) {
        val chatMembers = ChatMembers().also {
            it.sessionId=chatMessages.sessionId
        }
//        //获取到了该会话下所有用户
        val selectChatMembersList = membersService.selectChatMembersList(chatMembers)
        //排除发送人
        val chatMembersList = selectChatMembersList.filter {
            it.userId != chatMembers.userId
        }
        //向数据库中插入消息数据
        messageService.insertChatMessages(chatMessages)
        //向所有参与该会话的用户发送该消息
        for (item in chatMembersList) {
            val session = userSessionMap[item.userId]
            if (session == null){
                //用户不在线
                item.unreadCount ++
                membersService.updateChatMembers(item)
            }else{
                //向客户端发送数据
                session.asyncRemote.sendText(chatMessages.content)
            }
        }
    }
}