package com.hiprof.core.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ZstpNodeStyleMapper;
import com.hiprof.core.domain.ZstpNodeStyle;
import com.hiprof.core.service.IZstpNodeStyleService;

/**
 * 节点样式Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
@Service
public class ZstpNodeStyleServiceImpl implements IZstpNodeStyleService 
{
    @Autowired
    private ZstpNodeStyleMapper zstpNodeStyleMapper;

    /**
     * 查询节点样式
     * 
     * @param id 节点样式主键
     * @return 节点样式
     */
    @Override
    public ZstpNodeStyle selectZstpNodeStyleById(Long id)
    {
        return zstpNodeStyleMapper.selectZstpNodeStyleById(id);
    }

    /**
     * 查询节点样式列表
     * 
     * @param zstpNodeStyle 节点样式
     * @return 节点样式
     */
    @Override
    public List<ZstpNodeStyle> selectZstpNodeStyleList(ZstpNodeStyle zstpNodeStyle)
    {
        return zstpNodeStyleMapper.selectZstpNodeStyleList(zstpNodeStyle);
    }

    /**
     * 新增节点样式
     * 
     * @param zstpNodeStyle 节点样式
     * @return 结果
     */
    @Override
    public int insertZstpNodeStyle(ZstpNodeStyle zstpNodeStyle)
    {
        return zstpNodeStyleMapper.insertZstpNodeStyle(zstpNodeStyle);
    }

    /**
     * 修改节点样式
     * 
     * @param zstpNodeStyle 节点样式
     * @return 结果
     */
    @Override
    public int updateZstpNodeStyle(ZstpNodeStyle zstpNodeStyle)
    {
        return zstpNodeStyleMapper.updateZstpNodeStyle(zstpNodeStyle);
    }

    /**
     * 批量删除节点样式
     * 
     * @param ids 需要删除的节点样式主键
     * @return 结果
     */
    @Override
    public int deleteZstpNodeStyleByIds(Long[] ids)
    {
        return zstpNodeStyleMapper.deleteZstpNodeStyleByIds(ids);
    }

    /**
     * 删除节点样式信息
     * 
     * @param id 节点样式主键
     * @return 结果
     */
    @Override
    public int deleteZstpNodeStyleById(Long id)
    {
        return zstpNodeStyleMapper.deleteZstpNodeStyleById(id);
    }
}
