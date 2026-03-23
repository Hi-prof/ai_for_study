package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ZstpNode;

/**
 * 节点表Service接口
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
public interface IZstpNodeService 
{
    /**
     * 查询节点表
     * 
     * @param id 节点表主键
     * @return 节点表
     */
    public List<ZstpNode> selectZstpNodeById(Long id);

    /**
     * 查询节点表列表
     * 
     * @param zstpNode 节点表
     * @return 节点表集合
     */
    public List<ZstpNode> selectZstpNodeList(ZstpNode zstpNode);
    public List<ZstpNode> selectZstpNodeListByParentIds(Long[] ids);


    /**
     * 新增节点表
     * 
     * @param zstpNode 节点表
     * @return 结果
     */
    public long insertZstpNode(ZstpNode zstpNode);

    /**
     * 修改节点表
     * 
     * @param zstpNode 节点表
     * @return 结果
     */
    public int updateZstpNode(ZstpNode zstpNode);

    /**
     * 批量删除节点表
     * 
     * @param ids 需要删除的节点表主键集合
     * @return 结果
     */
    public int deleteZstpNodeByIds(Long[] ids);

    /**
     * 删除节点表信息
     * 
     * @param id 节点表主键
     * @return 结果
     */
    public int deleteZstpNodeById(Long id);

}
