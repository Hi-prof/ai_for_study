package com.hiprof.core.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ZstpLineMapper;
import com.hiprof.core.domain.ZstpLine;
import com.hiprof.core.service.IZstpLineService;

/**
 * 线段关系Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
@Service
public class ZstpLineServiceImpl implements IZstpLineService 
{
    @Autowired
    private ZstpLineMapper zstpLineMapper;

    /**
     * 查询线段关系
     * 
     * @param id 线段关系主键
     * @return 线段关系
     */
    @Override
    public ZstpLine selectZstpLineById(Long id)
    {
        return zstpLineMapper.selectZstpLineById(id);
    }

    /**
     * 查询线段关系列表
     * 
     * @param zstpLine 线段关系
     * @return 线段关系
     */
    @Override
    public List<ZstpLine> selectZstpLineList(ZstpLine zstpLine)
    {
        return zstpLineMapper.selectZstpLineList(zstpLine);
    }

    /**
     * 新增线段关系
     * 
     * @param zstpLine 线段关系
     * @return 结果
     */
    @Override
    public int insertZstpLine(ZstpLine zstpLine)
    {
        return zstpLineMapper.insertZstpLine(zstpLine);
    }

    /**
     * 修改线段关系
     * 
     * @param zstpLine 线段关系
     * @return 结果
     */
    @Override
    public int updateZstpLine(ZstpLine zstpLine)
    {
        return zstpLineMapper.updateZstpLine(zstpLine);
    }

    /**
     * 批量删除线段关系
     * 
     * @param ids 需要删除的线段关系主键
     * @return 结果
     */
    @Override
    public int deleteZstpLineByIds(Long[] ids)
    {
        return zstpLineMapper.deleteZstpLineByIds(ids);
    }

    /**
     * 删除线段关系信息
     * 
     * @param id 线段关系主键
     * @return 结果
     */
    @Override
    public int deleteZstpLineById(Long id)
    {
        return zstpLineMapper.deleteZstpLineById(id);
    }
}
