package com.hiprof.core.domain.vo;

import com.hiprof.common.core.page.TableDataInfo;
import com.hiprof.core.domain.ZstpGraph;
import io.swagger.v3.oas.annotations.media.Schema;


public class ZstpGraphVo extends ZstpGraph {

    @Schema(title = "图谱下节点数量")
    private Integer nodeCount;

    public Integer getNodeCount() {
        return nodeCount;
    }

    public void setNodeCount(Integer nodeCount) {
        this.nodeCount = nodeCount;
    }
}
