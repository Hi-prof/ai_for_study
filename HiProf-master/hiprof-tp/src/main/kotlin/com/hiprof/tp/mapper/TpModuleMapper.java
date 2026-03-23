package com.hiprof.tp.mapper;

import java.util.List;
import com.hiprof.tp.domain.TpModule;
import com.hiprof.tp.domain.TpContent;

/**
 * 教案模块Mapper接口
 * 
 * @author ruoyi
 * @date 2025-07-02
 */
public interface TpModuleMapper 
{
    /**
     * 查询教案模块
     * 
     * @param id 教案模块主键
     * @return 教案模块
     */
    public TpModule selectTpModuleById(Long id);

    /**
     * 查询教案模块列表
     * 
     * @param tpModule 教案模块
     * @return 教案模块集合
     */
    public List<TpModule> selectTpModuleList(TpModule tpModule);

    /**
     * 新增教案模块
     * 
     * @param tpModule 教案模块
     * @return 结果
     */
    public int insertTpModule(TpModule tpModule);

    /**
     * 修改教案模块
     * 
     * @param tpModule 教案模块
     * @return 结果
     */
    public int updateTpModule(TpModule tpModule);

    /**
     * 删除教案模块
     * 
     * @param id 教案模块主键
     * @return 结果
     */
    public int deleteTpModuleById(Long id);

    /**
     * 批量删除教案模块
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteTpModuleByIds(Long[] ids);

    /**
     * 批量删除模块内容
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteTpContentByModuleIds(Long[] ids);
    
    /**
     * 批量新增模块内容
     * 
     * @param tpContentList 模块内容列表
     * @return 结果
     */
    

    /**
     * 通过教案模块主键删除模块内容信息
     * 
     * @param id 教案模块ID
     * @return 结果
     */
    public int deleteTpContentByModuleId(Long id);
}
