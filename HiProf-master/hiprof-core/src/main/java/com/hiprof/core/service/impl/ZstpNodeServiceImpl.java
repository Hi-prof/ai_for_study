package com.hiprof.core.service.impl;

import java.util.LinkedHashSet;
import java.util.List;

import com.hiprof.core.domain.ZstpLine;
import com.hiprof.core.mapper.ZstpLineMapper;
import com.hiprof.core.mapper.ZstpNodeStyleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ZstpNodeMapper;
import com.hiprof.core.domain.ZstpNode;
import com.hiprof.core.service.IZstpNodeService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 节点表Service业务层处理
 *
 * @author ruoyi
 * @date 2025-06-22
 */
@Service
public class ZstpNodeServiceImpl implements IZstpNodeService {
    @Autowired
    private ZstpNodeMapper zstpNodeMapper;

    @Autowired
    private ZstpNodeStyleMapper zstpNodeStyleMapper;
    @Autowired
    private ZstpLineMapper zstpLineMapper;

    /**
     * 查询节点表
     *
     * @param id 节点表主键
     * @return 节点表
     */
    @Override
    public List<ZstpNode> selectZstpNodeById(Long id) {
        return zstpNodeMapper.selectZstpNodeById(id);
    }

    /**
     * 查询节点表列表
     *
     * @param zstpNode 节点表
     * @return 节点表
     */
    @Override
    public List<ZstpNode> selectZstpNodeList(ZstpNode zstpNode) {
        return zstpNodeMapper.selectZstpNodeList(zstpNode);
    }

    /**
     * 新增节点表
     *
     * @param zstpNode 节点表
     * @return 结果
     */
    @Transactional
    @Override
    public long insertZstpNode(ZstpNode zstpNode) {
        zstpNodeMapper.insertZstpNode(zstpNode);
        long createNodeId = zstpNode.getId();
        if (zstpNode.getParentId() != null) {
            //父节点不为空时，随即创建线段
            ZstpLine zstpLine = new ZstpLine();
            zstpLine.setNodeId(zstpNode.getParentId());
            zstpLine.setTargetId(createNodeId);
            zstpLineMapper.insertZstpLine(zstpLine);
        }
        return  createNodeId;
    }

    /**
     * 修改节点表
     *
     * @param zstpNode 节点表
     * @return 结果
     */
    @Override
    public int updateZstpNode(ZstpNode zstpNode) {
        return zstpNodeMapper.updateZstpNode(zstpNode);
    }

    /**
     * 批量删除节点表
     *
     * @param ids 需要删除的节点表主键
     * @return 结果
     */

    @Transactional
    @Override
    public int deleteZstpNodeByIds(Long[] ids) {
        if (ids == null || ids.length == 0) {
            return 0;
        }

        LinkedHashSet<Long> deleteIds = new LinkedHashSet<>();
        for (Long id : ids) {
            if (id == null) {
                continue;
            }

            List<ZstpNode> childNodes = zstpNodeMapper.selectZstpNodeById(id);
            if (childNodes == null || childNodes.isEmpty()) {
                deleteIds.add(id);
                continue;
            }

            childNodes.stream().map(ZstpNode::getId).forEach(deleteIds::add);
        }

        if (deleteIds.isEmpty()) {
            return 0;
        }

        Long[] deleteIdArray = deleteIds.toArray(Long[]::new);
        zstpNodeStyleMapper.deleteZstpNodeStyleByNodeIds(deleteIdArray);
        zstpLineMapper.deleteZstpLineByNodeIds(deleteIdArray);
        return zstpNodeMapper.deleteZstpNodeByIds(deleteIdArray);
    }

    /**
     * 删除节点表信息
     *
     * @param id 节点表主键
     * @return 结果
     */
    @Override
    public int deleteZstpNodeById(Long id) {
        return zstpNodeMapper.deleteZstpNodeById(id);
    }

    @Override
    public List<ZstpNode> selectZstpNodeListByParentIds(Long[] ids) {
        return zstpNodeMapper.selectZstpNodeListByParentIds(ids);
    }
}
