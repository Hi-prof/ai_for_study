package com.hiprof.portal.domain

import com.hiprof.common.core.domain.BaseEntity
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime

@Schema(name = "轮播图实体")
data class Banner(
    @Schema(title = "轮播图id")
    val id: Int,
    @Schema(title = "轮播图标题")
    val title: String,
    @Schema(title = "轮播图图片地址")
    val imageUrl: String,
    @Schema(title = "轮播图跳转地址")
    val linkUrl: String?,
    @Schema(title = "轮播图描述文本")
    val description: String?,
    @Schema(title = "显示位置：home-首页，explore-发现页，")
    val position: String?,
    @Schema(title = "排序索引（数值越大排序越靠前）")
    val orderIndex: Int,
    @Schema(title = "生效开始时间")
    val startTime: LocalDateTime?,
    @Schema(title = "生效结束时间")
    val endTime: LocalDateTime?,
    @Schema(title = "点击次数")
    val clickCount: Long,
    @Schema(title = "查看次数")
    val viewCount: Long,
):BaseEntity()
