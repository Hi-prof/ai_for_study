package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ZstpGraph;
import com.hiprof.core.domain.vo.ZstpGraphVo;

/**
 * 知识图谱Mapper接口
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
public interface ZstpGraphMapper 
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
    public List<ZstpGraph> selectZstpGraphList(ZstpGraph zstpGraph);
    public List<ZstpGraphVo> selectZstpGraphVoList(ZstpGraph zstpGraph);

    /**
     * 新增知识图谱
     * 
     * @param zstpGraph 知识图谱
     * @return 结果
     */
    public int insertZstpGraph(ZstpGraph zstpGraph);

    /**
     * 修改知识图谱
     * 
     * @param zstpGraph 知识图谱
     * @return 结果
     */
    public int updateZstpGraph(ZstpGraph zstpGraph);

    /**
     * 删除知识图谱
     * 
     * @param id 知识图谱主键
     * @return 结果
     */
    public int deleteZstpGraphById(Long id);

    /**
     * 批量删除知识图谱
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteZstpGraphByIds(Long[] ids);
    public int deleteZstpGraphByCourseIds(Long[] ids);
}
