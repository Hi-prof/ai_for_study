package com.hiprof.tp.mapper;

import java.util.List;
import com.hiprof.tp.domain.TpContent;

/**
 * 模块内容Mapper接口
 * 
 * @author ruoyi
 * @date 2025-07-02
 */
public interface TpContentMapper 
{
    /**
     * 查询模块内容
     * 
     * @param id 模块内容主键
     * @return 模块内容
     */
    public TpContent selectTpContentById(Long id);

    /**
     * 查询模块内容列表
     * 
     * @param tpContent 模块内容
     * @return 模块内容集合
     */
    public List<TpContent> selectTpContentList(TpContent tpContent);

    /**
     * 新增模块内容
     * 
     * @param tpContent 模块内容
     * @return 结果
     */
    public int insertTpContent(TpContent tpContent);

    /**
     * 修改模块内容
     * 
     * @param tpContent 模块内容
     * @return 结果
     */
    public int updateTpContent(TpContent tpContent);

    /**
     * 删除模块内容
     * 
     * @param id 模块内容主键
     * @return 结果
     */
    public int deleteTpContentById(Long id);

    /**
     * 批量删除模块内容
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteTpContentByIds(Long[] ids);
}
