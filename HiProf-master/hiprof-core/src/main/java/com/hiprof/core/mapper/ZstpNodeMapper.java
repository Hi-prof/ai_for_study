package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ZstpNode;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;

/**
 * 节点表Mapper接口
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
public interface ZstpNodeMapper 
{
    /**
     * 查询节点表
     * 
     * @param id 节点表主键
     * @return 节点表
     */
    public List<ZstpNode> selectZstpNodeById(Long id);
    public List<ZstpNode> selectZstpNodeByGraphIds(Long[] ids);

    /**
     * 查询节点表列表
     * 
     * @param zstpNode 节点表
     * @return 节点表集合
     */
    public List<ZstpNode> selectZstpNodeList(ZstpNode zstpNode);

    /**
     * 新增节点表
     * 
     * @param zstpNode 节点表
     * @return 结果
     */
    @Options(useGeneratedKeys = true, keyProperty = "id")
    public long  insertZstpNode( ZstpNode zstpNode);

    /**
     * 修改节点表
     * 
     * @param zstpNode 节点表
     * @return 结果
     */
    public int updateZstpNode(ZstpNode zstpNode);

    /**
     * 删除节点表
     * 
     * @param id 节点表主键
     * @return 结果
     */
    public int deleteZstpNodeById(Long id);

    /**
     * 批量删除节点表
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteZstpNodeByIds(Long[] ids);


    public List<ZstpNode> selectZstpNodeListByParentIds(Long[] ids);
}
