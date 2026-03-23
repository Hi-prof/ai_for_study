package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ZstpLine;

/**
 * 线段关系Mapper接口
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
public interface ZstpLineMapper 
{
    /**
     * 查询线段关系
     * 
     * @param id 线段关系主键
     * @return 线段关系
     */
    public ZstpLine selectZstpLineById(Long id);

    /**
     * 查询线段关系列表
     * 
     * @param zstpLine 线段关系
     * @return 线段关系集合
     */
    public List<ZstpLine> selectZstpLineList(ZstpLine zstpLine);

    /**
     * 新增线段关系
     * 
     * @param zstpLine 线段关系
     * @return 结果
     */
    public int insertZstpLine(ZstpLine zstpLine);

    /**
     * 修改线段关系
     * 
     * @param zstpLine 线段关系
     * @return 结果
     */
    public int updateZstpLine(ZstpLine zstpLine);

    /**
     * 删除线段关系
     * 
     * @param id 线段关系主键
     * @return 结果
     */
    public int deleteZstpLineById(Long id);

    /**
     * 批量删除线段关系
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteZstpLineByIds(Long[] ids);
    public int deleteZstpLineByNodeIds(Long[] ids);
}
