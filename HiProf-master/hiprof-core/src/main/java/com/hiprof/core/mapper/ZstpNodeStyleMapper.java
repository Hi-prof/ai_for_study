package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ZstpNodeStyle;

/**
 * 节点样式Mapper接口
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
public interface ZstpNodeStyleMapper 
{
    /**
     * 查询节点样式
     * 
     * @param id 节点样式主键
     * @return 节点样式
     */
    public ZstpNodeStyle selectZstpNodeStyleById(Long id);

    /**
     * 查询节点样式列表
     * 
     * @param zstpNodeStyle 节点样式
     * @return 节点样式集合
     */
    public List<ZstpNodeStyle> selectZstpNodeStyleList(ZstpNodeStyle zstpNodeStyle);

    /**
     * 新增节点样式
     * 
     * @param zstpNodeStyle 节点样式
     * @return 结果
     */
    public int insertZstpNodeStyle(ZstpNodeStyle zstpNodeStyle);

    /**
     * 修改节点样式
     * 
     * @param zstpNodeStyle 节点样式
     * @return 结果
     */
    public int updateZstpNodeStyle(ZstpNodeStyle zstpNodeStyle);

    /**
     * 删除节点样式
     * 
     * @param id 节点样式主键
     * @return 结果
     */
    public int deleteZstpNodeStyleById(Long id);

    /**
     * 批量删除节点样式
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteZstpNodeStyleByIds(Long[] ids);
    public int deleteZstpNodeStyleByNodeIds(Long[] ids);
}
