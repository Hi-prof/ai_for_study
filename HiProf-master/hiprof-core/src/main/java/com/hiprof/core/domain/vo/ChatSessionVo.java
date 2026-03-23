package com.hiprof.core.domain.vo;

import com.hiprof.core.domain.ChatSession;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@Schema(description = "会话对象")
public class ChatSessionVo extends ChatSession {

    @Schema(description = "会话成员ID列表")
    private List<Long> memberIds;

    public List<Long> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(List<Long> memberIds) {
        this.memberIds = memberIds;
    }
}
