package com.hiprof.core.service.impl;

import java.util.List;

import com.hiprof.core.domain.ZstpNode;
import com.hiprof.core.domain.vo.ZstpGraphVo;
import com.hiprof.core.mapper.ZstpNodeMapper;
import com.hiprof.core.service.IZstpNodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ZstpGraphMapper;
import com.hiprof.core.domain.ZstpGraph;
import com.hiprof.core.service.IZstpGraphService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 知识图谱Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
@Service
public class ZstpGraphServiceImpl implements IZstpGraphService 
{
    @Autowired
    private ZstpGraphMapper zstpGraphMapper;
    @Autowired
    private ZstpNodeMapper zstpNodeMapper;
    @Autowired
    private IZstpNodeService zstpNodeService;

    /**
     * 查询知识图谱
     * 
     * @param id 知识图谱主键
     * @return 知识图谱
     */
    @Override
    public ZstpGraph selectZstpGraphById(Long id)
    {
        return zstpGraphMapper.selectZstpGraphById(id);
    }

    /**
     * 查询知识图谱列表
     * 
     * @param zstpGraph 知识图谱
     * @return 知识图谱
     */
    @Override
    public List<ZstpGraphVo> selectZstpGraphList(ZstpGraph zstpGraph)
    {
        return zstpGraphMapper.selectZstpGraphVoList(zstpGraph);
    }

    /**
     * 新增知识图谱
     * 
     * @param zstpGraph 知识图谱
     * @return 结果
     */
    @Override
    public long insertZstpGraph(ZstpGraph zstpGraph) {
        zstpGraphMapper.insertZstpGraph(zstpGraph);
        if (zstpGraph.getId() !=null){
            return zstpGraph.getId() ;
        }
        throw new RuntimeException("发生未知错误无法拿到新增的图谱ID");

    }

    /**
     * 修改知识图谱
     * 
     * @param zstpGraph 知识图谱
     * @return 结果
     */
    @Override
    public int updateZstpGraph(ZstpGraph zstpGraph)
    {
        return zstpGraphMapper.updateZstpGraph(zstpGraph);
    }

    /**
     * 批量删除知识图谱
     * 
     * @param ids 需要删除的知识图谱主键
     * @return 结果
     */

    @Transactional
    @Override
    public void deleteZstpGraphByIds(Long[] ids)
    {
        if (ids == null || ids.length == 0) {
            return;
        }

        List<ZstpNode> zstpNodes = zstpNodeMapper.selectZstpNodeByGraphIds(ids);
        if (!zstpNodes.isEmpty()) {
            Long[] deleteIds = zstpNodes.stream().map(ZstpNode::getId).distinct().toArray(Long[]::new);
            zstpNodeService.deleteZstpNodeByIds(deleteIds);
        }

        zstpGraphMapper.deleteZstpGraphByIds(ids);
    }

    /**
     * 删除知识图谱信息
     * 
     * @param id 知识图谱主键
     * @return 结果
     */
    @Override
    public int deleteZstpGraphById(Long id)
    {
        if (id == null) {
            return 0;
        }

        List<ZstpNode> zstpNodes = zstpNodeMapper.selectZstpNodeByGraphIds(new Long[]{ id });
        if (!zstpNodes.isEmpty()) {
            Long[] deleteIds = zstpNodes.stream().map(ZstpNode::getId).distinct().toArray(Long[]::new);
            zstpNodeService.deleteZstpNodeByIds(deleteIds);
        }

        return zstpGraphMapper.deleteZstpGraphById(id);
    }
}
