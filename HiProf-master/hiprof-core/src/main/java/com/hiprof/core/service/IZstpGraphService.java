package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ZstpGraph;
import com.hiprof.core.domain.vo.ZstpGraphVo;

/**
 * 知识图谱Service接口
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
public interface IZstpGraphService 
{
    /**
     * 查询知识图谱
     * 
     * @param id 知识图谱主键
     * @return 知识图谱
     */
    public ZstpGraph selectZstpGraphById(Long id);

    /**
     * 查询知识图谱列表
     * 
     * @param zstpGraph 知识图谱
     * @return 知识图谱集合
     */
    public List<ZstpGraphVo> selectZstpGraphList(ZstpGraph zstpGraph);

    /**
     * 新增知识图谱
     * 
     * @param zstpGraph 知识图谱
     * @return 结果
     */
    public long insertZstpGraph(ZstpGraph zstpGraph);

    /**
     * 修改知识图谱
     * 
     * @param zstpGraph 知识图谱
     * @return 结果
     */
    public int updateZstpGraph(ZstpGraph zstpGraph);

    /**
     * 批量删除知识图谱
     * 
     * @param ids 需要删除的知识图谱主键集合
     * @return 结果
     */
    public void deleteZstpGraphByIds(Long[] ids);

    /**
     * 删除知识图谱信息
     * 
     * @param id 知识图谱主键
     * @return 结果
     */
    public int deleteZstpGraphById(Long id);
}
